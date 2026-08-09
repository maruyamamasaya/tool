(function () {
  'use strict';

  const STATUSES = [
    [100, 'Continue', 'リクエストを継続できます。'],
    [101, 'Switching Protocols', 'プロトコルを切り替えています。'],
    [102, 'Processing', 'リクエストを処理中です。'],
    [103, 'Early Hints', '最終レスポンスより前に、読み込みのヒントを返します。'],
    [200, 'OK', 'リクエストが正常に成功しました。'],
    [201, 'Created', 'リクエストが成功し、新しいリソースが作成されました。'],
    [202, 'Accepted', 'リクエストは受理されましたが、処理は完了していません。'],
    [204, 'No Content', '成功しましたが、返すコンテンツはありません。'],
    [206, 'Partial Content', 'リソースの一部分を返しました。'],
    [300, 'Multiple Choices', '複数の選択肢があります。'],
    [301, 'Moved Permanently', 'リソースは恒久的に移動しました。'],
    [302, 'Found', 'リソースは一時的に別の場所にあります。'],
    [303, 'See Other', '別のURLをGETで参照してください。'],
    [304, 'Not Modified', 'キャッシュ済みの内容から変更されていません。'],
    [307, 'Temporary Redirect', 'メソッドを維持したまま一時的に転送します。'],
    [308, 'Permanent Redirect', 'メソッドを維持したまま恒久的に転送します。'],
    [400, 'Bad Request', '構文などに問題があり、リクエストを処理できません。'],
    [401, 'Unauthorized', '認証が必要です。'],
    [403, 'Forbidden', 'アクセスする権限がありません。'],
    [404, 'Not Found', '指定されたリソースが見つかりません。'],
    [405, 'Method Not Allowed', 'そのHTTPメソッドは許可されていません。'],
    [406, 'Not Acceptable', '要求された形式でレスポンスを返せません。'],
    [408, 'Request Timeout', 'リクエストが時間内に完了しませんでした。'],
    [409, 'Conflict', 'リソースの現在の状態と競合しています。'],
    [410, 'Gone', 'リソースは恒久的に削除されています。'],
    [411, 'Length Required', 'Content-Lengthヘッダーが必要です。'],
    [412, 'Precondition Failed', 'リクエストの前提条件を満たしていません。'],
    [413, 'Content Too Large', '送信された内容が大きすぎます。'],
    [414, 'URI Too Long', 'URIが長すぎます。'],
    [415, 'Unsupported Media Type', '送信されたメディア形式に対応していません。'],
    [416, 'Range Not Satisfiable', '要求されたデータ範囲を返せません。'],
    [418, "I'm a teapot", 'ティーポットなのでコーヒーを淹れられません。'],
    [422, 'Unprocessable Content', '構文は正しいものの、内容を処理できません。'],
    [423, 'Locked', '対象のリソースはロックされています。'],
    [424, 'Failed Dependency', '依存する処理が失敗しました。'],
    [425, 'Too Early', 'リクエストを処理するには早すぎます。'],
    [426, 'Upgrade Required', '別のプロトコルへの切り替えが必要です。'],
    [428, 'Precondition Required', 'リクエストに前提条件が必要です。'],
    [429, 'Too Many Requests', '短時間にリクエストを送りすぎています。'],
    [431, 'Request Header Fields Too Large', 'リクエストヘッダーが大きすぎます。'],
    [451, 'Unavailable For Legal Reasons', '法的な理由により利用できません。'],
    [500, 'Internal Server Error', 'サーバー内部で予期しないエラーが発生しました。'],
    [501, 'Not Implemented', 'リクエストされた機能に対応していません。'],
    [502, 'Bad Gateway', '上流サーバーから不正な応答を受け取りました。'],
    [503, 'Service Unavailable', '一時的にサービスを利用できません。'],
    [504, 'Gateway Timeout', '上流サーバーから時間内に応答がありません。'],
    [505, 'HTTP Version Not Supported', 'そのHTTPバージョンには対応していません。'],
    [506, 'Variant Also Negotiates', 'コンテンツネゴシエーションの設定に問題があります。'],
    [507, 'Insufficient Storage', '処理に必要な保存容量が不足しています。'],
    [508, 'Loop Detected', '処理中に無限ループを検出しました。'],
    [510, 'Not Extended', 'リクエストを満たすための拡張が不足しています。'],
    [511, 'Network Authentication Required', 'ネットワークへの接続認証が必要です。']
  ].map(([code, name, description]) => ({ code, name, description, category: String(code)[0] }));

  const CATEGORY_NAMES = { 1: '情報', 2: '成功', 3: 'リダイレクト', 4: 'クライアントエラー', 5: 'サーバーエラー' };

  function searchStatuses(query, category = 'all') {
    const term = String(query || '').trim().toLocaleLowerCase('ja');
    return STATUSES.filter((status) => {
      const matchesCategory = category === 'all' || status.category === String(category);
      const haystack = `${status.code} ${status.name} ${status.description} ${CATEGORY_NAMES[status.category]}`.toLocaleLowerCase('ja');
      return matchesCategory && (!term || haystack.includes(term));
    });
  }

  if (typeof module !== 'undefined') module.exports = { STATUSES, CATEGORY_NAMES, searchStatuses };
  if (typeof document === 'undefined') return;

  const query = document.getElementById('query');
  const clear = document.getElementById('clear');
  const list = document.getElementById('resultList');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  let category = 'all';

  function render() {
    const results = searchStatuses(query.value, category);
    clear.hidden = !query.value;
    count.textContent = `${results.length}件`;
    empty.hidden = results.length > 0;
    list.innerHTML = results.map((status) => `<article class="status-row category-${status.category}"><div class="status-code"><strong>${status.code}</strong><span>${CATEGORY_NAMES[status.category]}</span></div><div class="status-info"><h3>${status.name}</h3><p>${status.description}</p></div></article>`).join('');
  }

  document.getElementById('filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    document.querySelectorAll('.filter').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render();
  });
  query.addEventListener('input', render);
  clear.addEventListener('click', () => { query.value = ''; query.focus(); render(); });
  render();
}());
