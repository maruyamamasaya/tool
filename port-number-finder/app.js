(function () {
  'use strict';

  const PORTS = [
    [20,'FTP Data','TCP','FTPのデータ転送'],[21,'FTP','TCP','ファイル転送の制御'],[22,'SSH / SFTP','TCP','安全なリモート接続・ファイル転送'],[23,'Telnet','TCP','暗号化されないリモート接続'],[25,'SMTP','TCP','メール送信'],[53,'DNS','TCP/UDP','ドメイン名の名前解決'],[67,'DHCP Server','UDP','IPアドレスの自動割り当て（サーバー）'],[68,'DHCP Client','UDP','IPアドレスの自動割り当て（クライアント）'],[69,'TFTP','UDP','簡易ファイル転送'],[80,'HTTP','TCP','Webサイト（暗号化なし）'],[110,'POP3','TCP','メール受信'],[123,'NTP','UDP','時刻同期'],[143,'IMAP','TCP','メール受信・同期'],[161,'SNMP','UDP','ネットワーク機器の監視'],[162,'SNMP Trap','UDP','ネットワーク機器からの通知'],[179,'BGP','TCP','ルーター間の経路交換'],[389,'LDAP','TCP/UDP','ディレクトリサービス'],[443,'HTTPS','TCP','暗号化されたWeb通信'],[445,'SMB','TCP','Windowsファイル・プリンター共有'],[465,'SMTPS','TCP','暗号化されたメール送信'],[500,'IKE / IPsec','UDP','VPN鍵交換'],[514,'Syslog','UDP','システムログ転送'],[587,'SMTP Submission','TCP','認証付きメール送信'],[636,'LDAPS','TCP','暗号化されたLDAP'],[993,'IMAPS','TCP','暗号化されたIMAP'],[995,'POP3S','TCP','暗号化されたPOP3'],[1433,'Microsoft SQL Server','TCP','SQL Serverデータベース'],[1521,'Oracle Database','TCP','Oracleデータベース'],[2049,'NFS','TCP/UDP','ネットワークファイル共有'],[2375,'Docker','TCP','Docker API（暗号化なし）'],[2376,'Docker TLS','TCP','Docker API（TLS）'],[3000,'Development Server','TCP','開発用Webサーバーでよく使用'],[3306,'MySQL / MariaDB','TCP','MySQL系データベース'],[3389,'RDP','TCP/UDP','Windowsリモートデスクトップ'],[5432,'PostgreSQL','TCP','PostgreSQLデータベース'],[5672,'AMQP / RabbitMQ','TCP','メッセージキュー'],[5900,'VNC','TCP','リモートデスクトップ'],[6379,'Redis','TCP','インメモリデータストア'],[6443,'Kubernetes API','TCP','Kubernetes APIサーバー'],[8080,'HTTP Alternate','TCP','代替HTTP・プロキシ・開発サーバー'],[8443,'HTTPS Alternate','TCP','代替HTTPS'],[9200,'Elasticsearch','TCP','検索・分析エンジン'],[27017,'MongoDB','TCP','MongoDBデータベース']
  ].map(([port, service, protocol, description]) => ({ port, service, protocol, description }));
  const POPULAR = [22, 53, 80, 443, 3306, 3389, 5432, 8080];

  function searchPorts(query, protocol = 'all') {
    const term = String(query || '').trim().toLocaleLowerCase('ja');
    const exactPort = /^\d+$/.test(term) ? Number(term) : null;
    return PORTS.filter((item) => {
      const matchesProtocol = protocol === 'all' || item.protocol.split('/').includes(protocol);
      const keywords = item.description.includes('データベース') ? ' database db' : '';
      const haystack = `${item.port} ${item.service} ${item.description}${keywords}`.toLocaleLowerCase('ja');
      const matchesTerm = exactPort === null ? (!term || haystack.includes(term)) : item.port === exactPort;
      return matchesProtocol && matchesTerm;
    });
  }

  if (typeof module !== 'undefined') module.exports = { PORTS, POPULAR, searchPorts };
  if (typeof document === 'undefined') return;

  const query = document.getElementById('query');
  const clear = document.getElementById('clear');
  const list = document.getElementById('resultList');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  let protocol = 'all';

  function render() {
    const results = searchPorts(query.value, protocol);
    clear.hidden = !query.value;
    count.textContent = query.value || protocol !== 'all' ? `${results.length}件` : `全${results.length}件`;
    empty.hidden = results.length > 0;
    list.innerHTML = results.map((item) => `<article class="port-row"><div class="port-number"><small>PORT</small><strong>${item.port}</strong></div><div class="port-info"><div><h3>${item.service}</h3><span class="protocol">${item.protocol}</span></div><p>${item.description}</p></div></article>`).join('');
  }

  document.getElementById('hints').innerHTML = POPULAR.map((port) => {
    const item = PORTS.find((candidate) => candidate.port === port);
    return `<button type="button" data-port="${port}"><strong>${port}</strong><span>${item.service.split(' / ')[0]}</span></button>`;
  }).join('');
  document.getElementById('hints').addEventListener('click', (event) => {
    const button = event.target.closest('[data-port]');
    if (!button) return;
    query.value = button.dataset.port;
    render();
    query.focus();
  });
  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
    protocol = button.dataset.protocol;
    document.querySelectorAll('.filter').forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    render();
  }));
  query.addEventListener('input', render);
  clear.addEventListener('click', () => { query.value = ''; query.focus(); render(); });
  render();
}());
