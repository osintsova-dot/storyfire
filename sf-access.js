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
  // «Кто играет?»: несколько детей на одном устройстве. Прогресс ребёнка — все ключи sf_* кроме служебных;
  // при смене игрока прячем их в sfp_<id> и достаём сохранённые ключи другого. Пока игрок один, ничего не меняется.
  var SYS = { sf_code: 1, sf_ok: 1, sf_teacher: 1, sf_dev: 1, sf_sound: 1, sf_order: 1, sf_players: 1, sf_cur: 1 };
  function own() { var o = {}; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('sf_') === 0 && !SYS[k]) o[k] = localStorage.getItem(k); } } catch (e) {} return o; }
  function kidName() { try { return (JSON.parse(ls('sf_prolog') || '{}').name || '').trim(); } catch (e) { return ''; } }
  function players() { var p; try { p = JSON.parse(ls('sf_players') || '[]'); } catch (e) { p = []; } return p; }
  function cur() { return ls('sf_cur') || ''; }
  function stash() { var c = cur(); if (c) ls('sfp_' + c, JSON.stringify(own())); }
  function load(id) {
    var o = own(); for (var k in o) ls(k, null);
    var d; try { d = JSON.parse(ls('sfp_' + id) || '{}'); } catch (e) { d = {}; }
    for (var j in d) ls(j, d[j]);
    ls('sf_cur', id);
  }
  function addPlayer(name) {
    name = String(name || '').trim().slice(0, 24); if (!name) return;
    var p = players();
    if (!p.length) { p.push({ id: 'p1', name: kidName() || 'Игрок 1' }); ls('sf_cur', 'p1'); }
    var id = 'p' + (Date.now() % 1e8).toString(36);
    p.push({ id: id, name: name }); ls('sf_players', JSON.stringify(p));
    stash(); load(id); ls('sf_prolog', JSON.stringify({ name: name }));
  }
  function switchTo(id) { if (id === cur()) return; stash(); load(id); }

  // История пройдена (битва за значок): сообщаем серверу код, игрока и счёт — для кабинета школы и отчёта родителям.
  // Имён не шлём. Без связи — кладём в очередь sf_q и досылаем при следующем вызове.
  function flushQ() {
    var q; try { q = JSON.parse(ls('sf_q') || '[]'); } catch (e) { q = []; }
    if (!q.length) return;
    var it = q.shift(); ls('sf_q', JSON.stringify(q));
    post(0, JSON.stringify(it)).then(function (j) { if (!j || (!j.ok && j.reason !== 'not_found' && j.reason !== 'bad')) { q.unshift(it); ls('sf_q', JSON.stringify(q)); } else if (q.length) flushQ(); },
      function () { q.unshift(it); ls('sf_q', JSON.stringify(q)); });
  }
  function done(n, rep) {
    var code = ls('sf_code'); if (!code || free()) return;
    var it = { sf_code: code, device: device(), sf_done: +n || 0, pid: cur() || 'p1', score: rep && rep.score || 0, of: rep && rep.of || 0 };
    var q; try { q = JSON.parse(ls('sf_q') || '[]'); } catch (e) { q = []; }
    q.push(it); ls('sf_q', JSON.stringify(q.slice(-30)));
    flushQ();
  }

  return { check: check, done: done, isOpen: isOpen, players: players, cur: cur, kidName: kidName, addPlayer: addPlayer, switchTo: switchTo, dateText: dateText, opensAt: opensAt, free: free, takeFromUrl: takeFromUrl, norm: norm, DATES: DATES,
    code: function () { return ls('sf_code'); }, teacher: function () { return ls('sf_teacher') === '1'; }, forget: function () { ls('sf_code', null); ls('sf_ok', null); ls('sf_teacher', null); } };
})();
