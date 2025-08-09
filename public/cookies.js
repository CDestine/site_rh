(function(){
  const KEY = "cookieConsent";
  const fab = document.createElement("button");
  fab.textContent = "🍪";
  fab.title = "Préférences cookies";
  fab.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:60;background:#111;color:#fff;border:none;border-radius:16px;width:44px;height:44px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.2)";
  document.addEventListener("DOMContentLoaded", ()=>document.body.appendChild(fab));
  function showBanner(){
    const bar = document.createElement("div");
    bar.innerHTML = `
      <div style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.35)"></div>
      <div style="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:51;max-width:720px;width:calc(100% - 32px);background:#0f172a;color:#fff;border-radius:14px;padding:16px;box-shadow:0 12px 30px rgba(0,0,0,.35)">
        <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <div style="font-size:14px">Nous utilisons des cookies techniques. <a href="privacy.html" style="text-decoration:underline;color:#93c5fd">En savoir plus</a>.</div>
          <div style="display:flex;gap:8px">
            <button id="cc-accept" style="background:#10b981;border:none;color:#fff;padding:8px 12px;border-radius:10px;cursor:pointer">Accepter</button>
            <button id="cc-decline" style="background:#334155;border:none;color:#fff;padding:8px 12px;border-radius:10px;cursor:pointer">Refuser</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(bar);
    document.getElementById("cc-accept").onclick = ()=>{ localStorage.setItem(KEY,"accepted"); bar.remove(); };
    document.getElementById("cc-decline").onclick = ()=>{ localStorage.setItem(KEY,"declined"); bar.remove(); };
  }
  if (!localStorage.getItem(KEY)) document.addEventListener("DOMContentLoaded", showBanner);
  fab.onclick = showBanner;
})();
