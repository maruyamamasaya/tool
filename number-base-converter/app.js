"use strict";

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx";

function parseBaseValue(rawValue, base) {
  if (!Number.isInteger(base) || base < 2 || base > 60) throw new Error("基数は2〜60の範囲で指定してください");

  let value = String(rawValue).trim();
  if (!value) return null;

  let sign = 1n;
  if (value[0] === "+" || value[0] === "-") {
    if (value[0] === "-") sign = -1n;
    value = value.slice(1);
  }
  if (base === 2 && /^0b/i.test(value)) value = value.slice(2);
  if (base === 16 && /^0x/i.test(value)) value = value.slice(2);
  if (base === 10) value = value.replace(/,/g, "");
  if (!value) throw new Error(`${base}進数の値を入力してください`);

  let result = 0n;
  const normalizedValue = base <= 36 ? value.toUpperCase() : value;
  for (const character of normalizedValue) {
    const digit = DIGITS.indexOf(character);
    if (digit < 0 || digit >= base) throw new Error(`${base}進数では「${character}」は使用できません`);
    result = result * BigInt(base) + BigInt(digit);
  }
  return result * sign;
}

function formatBaseValue(value, base) {
  if (typeof value !== "bigint") value = BigInt(value);
  if (!Number.isInteger(base) || base < 2 || base > 60) throw new Error("基数は2〜60の範囲で指定してください");
  if (value === 0n) return "0";

  const isNegative = value < 0n;
  let remaining = isNegative ? -value : value;
  let result = "";
  while (remaining > 0n) {
    result = DIGITS[Number(remaining % BigInt(base))] + result;
    remaining /= BigInt(base);
  }
  return `${isNegative ? "-" : ""}${result}`;
}

if (typeof document !== "undefined") {
  const fixedFields = [
    { input: document.querySelector("#binary"), base: 2, error: document.querySelector("#binary-error") },
    { input: document.querySelector("#decimal"), base: 10, error: document.querySelector("#decimal-error") },
    { input: document.querySelector("#duodecimal"), base: 12, error: document.querySelector("#duodecimal-error") },
    { input: document.querySelector("#hexadecimal"), base: 16, error: document.querySelector("#hexadecimal-error") },
    { input: document.querySelector("#base24"), base: 24, error: document.querySelector("#base24-error") },
    { input: document.querySelector("#sexagesimal"), base: 60, error: document.querySelector("#sexagesimal-error") }
  ];
  const customBase = document.querySelector("#custom-base");
  const customValue = document.querySelector("#custom-value");
  const customError = document.querySelector("#custom-error");
  const baseError = document.querySelector("#base-error");
  const status = document.querySelector("#status");
  let currentValue = 255n;
  let statusTimer;

  function clearErrors() {
    [...fixedFields.map((field) => field.error), customError, baseError].forEach((element) => { element.textContent = ""; });
    [...fixedFields.map((field) => field.input), customValue, customBase].forEach((element) => element.removeAttribute("aria-invalid"));
  }

  function clearValues(except) {
    fixedFields.forEach(({ input }) => { if (input !== except) input.value = ""; });
    if (customValue !== except) customValue.value = "";
    currentValue = null;
    updateCopyButtons();
  }

  function render(value, source) {
    fixedFields.forEach(({ input, base }) => { if (input !== source) input.value = formatBaseValue(value, base); });
    if (customValue !== source) customValue.value = formatBaseValue(value, Number(customBase.value));
    currentValue = value;
    updateCopyButtons();
  }

  function convert(source, base, errorElement) {
    clearErrors();
    if (!source.value.trim()) return clearValues(source);
    try {
      const value = parseBaseValue(source.value, base);
      render(value, source);
    } catch (error) {
      errorElement.textContent = `⚠ ${error.message}`;
      source.setAttribute("aria-invalid", "true");
    }
  }

  function updateCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.disabled = !document.querySelector(`#${button.dataset.copy}`).value;
    });
  }

  function announce(message) {
    clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = setTimeout(() => { status.textContent = ""; }, 1600);
  }

  fixedFields.forEach((field) => field.input.addEventListener("input", () => convert(field.input, field.base, field.error)));
  customValue.addEventListener("input", () => convert(customValue, Number(customBase.value), customError));
  customBase.addEventListener("input", () => {
    clearErrors();
    const base = Number(customBase.value);
    if (!Number.isInteger(base) || base < 2 || base > 60) {
      baseError.textContent = "⚠ 基数は2〜60の範囲で指定してください";
      customBase.setAttribute("aria-invalid", "true");
      return;
    }
    if (currentValue !== null) customValue.value = formatBaseValue(currentValue, base);
    updateCopyButtons();
  });

  document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
    const input = document.querySelector(`#${button.dataset.copy}`);
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      input.select();
      document.execCommand("copy");
    }
    announce("コピーしました");
  }));

  document.querySelector("#clear-button").addEventListener("click", () => {
    clearErrors();
    clearValues();
    fixedFields[0].input.focus();
  });

  updateCopyButtons();
}

if (typeof module !== "undefined") module.exports = { parseBaseValue, formatBaseValue };
