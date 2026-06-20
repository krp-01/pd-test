(function(){
  function backendUrl(){
    return String(window.CLOUD_BACKEND_URL || "").trim();
  }
  function isConfigured(){
    const url = backendUrl();
    return !!url && !url.includes("PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE");
  }
  function buildQuery(params){
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if(value !== undefined && value !== null) qs.set(key, String(value));
    });
    return qs.toString();
  }
  function jsonp(params, timeoutMs=60000){
    return new Promise((resolve, reject) => {
      if(!isConfigured()) return reject(new Error("Backend central neconfigurat."));
      const callbackName = "cloud_cb_" + Date.now() + "_" + Math.random().toString(16).slice(2);
      const script = document.createElement("script");
      const cleanup = () => {
        delete window[callbackName];
        script.remove();
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Backend-ul nu a răspuns la timp."));
      }, timeoutMs);
      window[callbackName] = (data) => {
        clearTimeout(timer);
        cleanup();
        if(data && data.ok === false) reject(new Error(data.error || "Eroare backend."));
        else resolve(data || {});
      };
      script.onerror = () => {
        clearTimeout(timer);
        cleanup();
        reject(new Error("Nu se poate conecta la backend."));
      };
      const url = backendUrl();
      script.src = url + (url.includes("?") ? "&" : "?") + buildQuery({...params, callback: callbackName, _ts: Date.now()});
      document.body.appendChild(script);
    });
  }
  async function post(action, payload){
    if(!isConfigured()) throw new Error("Backend central neconfigurat.");
    const body = new URLSearchParams();
    body.set("action", action);
    body.set("payload", JSON.stringify(payload || {}));
    // no-cors este folosit ca să funcționeze simplu pe GitHub Pages cu Google Apps Script.
    await fetch(backendUrl(), { method: "POST", mode: "no-cors", body });
    return {ok:true};
  }
  window.CloudAPI = {
    isConfigured,
    createRequest: (email) => post("createRequest", {email}),
    listRequests: (adminEmail, adminCode) => jsonp({action:"listRequests", adminEmail, adminCode}),
    approveRequest: (id, adminEmail, adminCode) => post("approveRequest", {id, adminEmail, adminCode}),
    rejectRequest: (id, adminEmail, adminCode) => post("rejectRequest", {id, adminEmail, adminCode}),
    clearRejected: (adminEmail, adminCode) => post("clearRejected", {adminEmail, adminCode}),
    clearAll: (adminEmail, adminCode) => post("clearAll", {adminEmail, adminCode}),
    listTests: (token) => jsonp({action:"listTests", token}),
    submitTest: (test) => post("submitTest", test),
    finishCorrection: (data) => post("finishCorrection", data),
    deleteTest: (id, token) => post("deleteTest", {id, token})
  };
})();
