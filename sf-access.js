/* «Костёр историй»: доступ по коду семьи и открытие историй по датам.
   Сервер — ss-pay (проверка кода идёт ручкой /pay/status {sf_code}); сначала российский шлюз Яндекса, потом workers.dev.
   Код храним в localStorage sf_code; удачную проверку — sf_ok (время), чтобы без связи не выкидывало из игры. */
var SF = (function () {
  var SRV = ['https://d5d6o4mldv5m1nj5hvih.6brbn2wz.apigw.yandexcloud.net/zhpay', 'https://ss-bb.o-sintsova.workers.dev/zhpay'];
  // История N открывается в 00:00 по времени телефона. 31.12 и 01.01 — выходные.
  var DATES = { 1: '2026-12-27', 2: '2026-12-28', 3: '2026-12-29', 4: '2026-12-30', 5: '2027-01-02',
    6: '2027-01-03', 7: '2027-01-04', 8: '2027-01-05', 9: '2027-01-06', 10: '2027-01-07' };
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function device() { var d = ls('sf_dev'); if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); ls('sf_dev', d); } return d; }
  function norm(c) { c = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return c.length === 12 ? c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8) : c; }
  // без замка: локальный просмотр и скрытая тестовая копия (?gate=1 включает замок для проверки)
  function free() {
    if (/[?&]gate=1/.test(location.search)) return false;
    return /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname) || location.pathname.indexOf('/t-49db8ebd/') >= 0;
  }
  function post(i, body) {
    if (i >= SRV.length) return Promise.reject(new Error('offline'));
    var c = window.AbortController ? new AbortController() : null, t = c && setTimeout(function () { c.abort(); }, 9000);
    return fetch(SRV[i] + '/pay/status', { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, signal: c && c.signal })
      .then(function (r) { clearTimeout(t); return r.json(); })
      .catch(function () { clearTimeout(t); return post(i + 1, body); });
  }
  // → {ok, teacher?, reason?}. Без связи, но с недавней удачной проверкой — пускаем.
  function check(code) {
    code = norm(code);
    if (!code) return Promise.resolve({ ok: false, reason: 'empty' });
    return post(0, JSON.stringify({ sf_code: code, device: device() })).then(function (j) {
      if (j && j.ok) { ls('sf_code', code); ls('sf_ok', String(Date.now())); ls('sf_teacher', j.teacher ? '1' : null); }
      else if (j && j.reason !== 'rate_limited') { ls('sf_ok', null); }
      return j || { ok: false, reason: 'error' };
    }, function () {
      var okAt = +(ls('sf_ok') || 0);
      return okAt && Date.now() - okAt < 30 * 86400000 && ls('sf_code') === code ? { ok: true, offline: true, teacher: ls('sf_teacher') === '1' } : { ok: false, reason: 'offline' };
    });
  }
  function opensAt(n) { var d = DATES[n]; return d ? new Date(d + 'T00:00:00') : new Date(0); }
  function isOpen(n) { return ls('sf_teacher') === '1' || Date.now() >= opensAt(n).getTime(); }
  function dateText(n) { var d = opensAt(n); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  // ?k=КОД в адресе → запоминаем и убираем из адреса (чтобы не утёк в скриншот)
  function takeFromUrl() {
    var m = /[?&]k=([A-Za-z0-9-]+)/.exec(location.search);
    if (!m) return null;
    var code = norm(m[1]); ls('sf_code', code);
    try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])k=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {}
    return code;
  }
  return { check: check, isOpen: isOpen, dateText: dateText, opensAt: opensAt, free: free, takeFromUrl: takeFromUrl, norm: norm, DATES: DATES,
    code: function () { return ls('sf_code'); }, teacher: function () { return ls('sf_teacher') === '1'; }, forget: function () { ls('sf_code', null); ls('sf_ok', null); ls('sf_teacher', null); } };
})();
