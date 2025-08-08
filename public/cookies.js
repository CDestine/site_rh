(function(){
  const KEY = "cookieConsent";
  if (localStorage.getItem(KEY) === "accepted") return;

  const bar = document.createElement("div");
  bar.innerHTML = `
    <div class="fixed bottom-0 inset-x-0 z-50">
      <div class="mx-auto max-w-4xl m-4 p-4 rounded-2xl bg-slate-900 text-white shadow-lg">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p class="text-sm">
            Nous utilisons des cookies techniques pour améliorer votre expérience. 
            <a href="privacy.html" class="underline">En savoir plus</a>.
          </p>
          <div class="flex gap-2">
            <button id="cc-accept" class="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4 py-2 text-sm font-medium">Accepter</button>
            <button id="cc-decline" class="bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2 text-sm">Refuser</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(bar);

  document.getElementById("cc-accept").onclick = () => { localStorage.setItem(KEY,"accepted"); bar.remove(); };
  document.getElementById("cc-decline").onclick = () => { localStorage.setItem(KEY,"declined"); bar.remove(); };
})();
