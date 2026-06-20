
function blockExportShortcuts(){
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["p","s","u"].includes(k)) {
      e.preventDefault();
      alert("Această acțiune este blocată pe formular.");
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i","j","c"].includes(k)) {
      e.preventDefault();
      alert("Această acțiune este blocată pe formular.");
    }
  });
  window.addEventListener("beforeprint", () => alert("Printarea / salvarea ca PDF este dezactivată pentru formular."));
}

function encodePayload(obj){
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodePayload(str){
  let s = String(str || "").trim();
  if (s.includes("#r=")) s = s.split("#r=")[1];
  if (s.includes("?r=")) s = s.split("?r=")[1].split("&")[0];
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function collectFormData(){
  const data = {};
  document.querySelectorAll("input, textarea, select").forEach(el => {
    if(!el.name) return;
    if(el.type === "checkbox") data[el.name] = el.checked;
    else if(el.type === "radio") { if(el.checked) data[el.name] = el.value; }
    else data[el.name] = el.value;
  });
  return data;
}
