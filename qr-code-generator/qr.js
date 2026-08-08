(function (root) {
  "use strict";

  const VERSIONS = [
    null,
    { size: 21, total: 26, data: 19, alignment: [] },
    { size: 25, total: 44, data: 34, alignment: [6, 18] },
    { size: 29, total: 70, data: 55, alignment: [6, 22] },
    { size: 33, total: 100, data: 80, alignment: [6, 26] },
    { size: 37, total: 134, data: 108, alignment: [6, 30] }
  ];

  function utf8Bytes(text) {
    return Array.from(new TextEncoder().encode(text));
  }

  function pushBits(target, value, length) {
    for (let bit = length - 1; bit >= 0; bit -= 1) target.push((value >>> bit) & 1);
  }

  function multiply(a, b) {
    let result = 0;
    while (b) {
      if (b & 1) result ^= a;
      b >>>= 1;
      a <<= 1;
      if (a & 0x100) a ^= 0x11d;
    }
    return result;
  }

  function errorCorrection(data, count) {
    let generator = [1];
    let value = 1;
    for (let i = 0; i < count; i += 1) {
      const next = Array(generator.length + 1).fill(0);
      for (let j = 0; j < generator.length; j += 1) {
        // Keep the highest-degree coefficient first. The previous implementation
        // built the polynomial in the opposite order, so the Reed-Solomon
        // remainder did not match the data written into the QR code.
        next[j] ^= generator[j];
        next[j + 1] ^= multiply(generator[j], value);
      }
      generator = next;
      value = multiply(value, 2);
    }
    const result = Array(count).fill(0);
    data.forEach(byte => {
      const factor = byte ^ result[0];
      result.shift();
      result.push(0);
      generator.slice(1).forEach((coefficient, index) => {
        result[index] ^= multiply(coefficient, factor);
      });
    });
    return result;
  }

  function encodeData(text) {
    const bytes = utf8Bytes(text);
    const version = VERSIONS.slice(1).findIndex(info => bytes.length <= info.data - 2) + 1;
    if (!version) throw new RangeError("入力が長すぎます（UTF-8で最大106バイト）");
    const info = VERSIONS[version];
    const bits = [];
    pushBits(bits, 4, 4);
    pushBits(bits, bytes.length, 8);
    bytes.forEach(byte => pushBits(bits, byte, 8));
    const capacity = info.data * 8;
    pushBits(bits, 0, Math.min(4, capacity - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    for (let pad = 0; data.length < info.data; pad += 1) data.push(pad % 2 ? 0x11 : 0xec);
    return { version, info, codewords: data.concat(errorCorrection(data, info.total - info.data)) };
  }

  function bch(value, polynomial) {
    let shifted = value;
    const degree = Math.floor(Math.log2(polynomial));
    while (shifted && Math.floor(Math.log2(shifted)) >= degree) {
      shifted ^= polynomial << (Math.floor(Math.log2(shifted)) - degree);
    }
    return shifted;
  }

  function createMatrix(text) {
    if (!text) throw new TypeError("URLを入力してください");
    const { version, info, codewords } = encodeData(text);
    const size = info.size;
    const modules = Array.from({ length: size }, () => Array(size).fill(false));
    const reserved = Array.from({ length: size }, () => Array(size).fill(false));
    const set = (row, col, dark, reserve = true) => {
      if (row < 0 || col < 0 || row >= size || col >= size) return;
      modules[row][col] = dark;
      if (reserve) reserved[row][col] = true;
    };
    const finder = (row, col) => {
      for (let y = -1; y <= 7; y += 1) for (let x = -1; x <= 7; x += 1) {
        const dark = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
        set(row + y, col + x, dark);
      }
    };
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
    for (let i = 8; i < size - 8; i += 1) {
      set(6, i, i % 2 === 0);
      set(i, 6, i % 2 === 0);
    }
    info.alignment.forEach(row => info.alignment.forEach(col => {
      if (reserved[row][col]) return;
      for (let y = -2; y <= 2; y += 1) for (let x = -2; x <= 2; x += 1) set(row + y, col + x, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }));
    for (let i = 0; i < 9; i += 1) {
      if (i !== 6) { set(8, i, false); set(i, 8, false); }
    }
    for (let i = 0; i < 8; i += 1) { set(8, size - 1 - i, false); set(size - 1 - i, 8, false); }
    set(size - 8, 8, true);

    const bits = [];
    codewords.forEach(byte => pushBits(bits, byte, 8));
    let bit = 0;
    let upward = true;
    for (let right = size - 1; right > 0; right -= 2) {
      if (right === 6) right -= 1;
      for (let step = 0; step < size; step += 1) {
        const row = upward ? size - 1 - step : step;
        for (let offset = 0; offset < 2; offset += 1) {
          const col = right - offset;
          if (!reserved[row][col]) {
            const value = bit < bits.length && bits[bit] === 1;
            modules[row][col] = value !== ((row + col) % 2 === 0);
            bit += 1;
          }
        }
      }
      upward = !upward;
    }
    const format = ((1 << 3) | 0);
    const formatBits = ((format << 10) | bch(format << 10, 0x537)) ^ 0x5412;
    for (let i = 0; i < 15; i += 1) {
      const dark = ((formatBits >>> i) & 1) === 1;
      const a = i < 6 ? [i, 8] : i < 8 ? [i + 1, 8] : i === 8 ? [8, 7] : [8, 14 - i];
      const b = i < 8 ? [8, size - i - 1] : [size - 15 + i, 8];
      set(a[0], a[1], dark); set(b[0], b[1], dark);
    }
    set(size - 8, 8, true);
    return modules;
  }

  function toSvg(text) {
    const matrix = createMatrix(text);
    const size = matrix.length + 8;
    const paths = [];
    matrix.forEach((row, y) => row.forEach((dark, x) => { if (dark) paths.push(`M${x + 4},${y + 4}h1v1h-1z`); }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-label="生成したQRコード"><rect width="100%" height="100%" fill="#fff"/><path d="${paths.join("")}" fill="#111827"/></svg>`;
  }

  const api = { utf8Bytes, encodeData, createMatrix, toSvg };
  if (typeof module !== "undefined") module.exports = api;
  root.QRCodeGenerator = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
