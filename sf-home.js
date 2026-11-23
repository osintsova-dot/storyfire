/* У кого уже есть код квеста: «домой» ведёт к историям, а не на продающую главную (24.11.2026). */
(function () {
  var code = null; try { code = localStorage.getItem('sf_code'); } catch (e) {}
  if (!code) return;
  var home = /^\/(index\.html)?$/.test(location.pathname);
  function pill(text) {
    var a = document.createElement('a'); a.href = '/play/'; a.textContent = text;
    a.style.cssText = 'position:fixed;left:12px;bottom:14px;z-index:60;padding:12px 18px;border-radius:999px;background:#F5C842;color:#24132f;font:700 15px/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.35)';
    document.body.appendChild(a);
  }
  function run() {
    if (home) { pill('← Мои истории'); return; }
    var as = document.querySelectorAll('header a[href="../"], .top a[href="../"]');
    for (var i = 0; i < as.length; i++) as[i].setAttribute('href', '/play/');
    if (/\/(dogovor|oferta|privacy|prolog)\//.test(location.pathname)) pill('← К историям');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
