blockExportShortcuts();

const EVALUATOR_TESTS_KEY = "evaluator_tests_queue_v1"; // păstrat doar pentru compatibilitate, NU se mai folosește ca stocare principală

function portalUid(prefix="test"){
  if (window.crypto && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function sendToEvaluatorPortal({type, candidateName, code}){
  if(!window.CloudAPI || !CloudAPI.isConfigured()){
    throw new Error("Backend-ul central nu este configurat. Pune Web App URL în backend-config.js.");
  }
  await CloudAPI.submitTest({
    id: portalUid("test"),
    type,
    candidateName: candidateName || "Candidat PD",
    code,
    status: "waiting",
    createdAt: new Date().toISOString(),
    source: "candidate-finalize"
  });
}

function showFinalizedMessage(candidateName){
  const result = document.getElementById("result");
  if(result){
    result.classList.remove("hidden");
    result.innerHTML = `
      <h3>Test finalizat</h3>
      <p class="hint">Testul ${candidateName ? "pentru <b>" + candidateName + "</b>" : ""} a fost trimis automat în portalul evaluator central, la categoria <b>Teste în așteptare</b>.</p>
      <div class="note success">Poți închide pagina. Nu se mai generează link pentru evaluator.</div>
    `;
    result.scrollIntoView({behavior:"smooth", block:"center"});
  } else {
    alert("Test finalizat și trimis automat în portalul evaluator.");
  }
}

function requiredWarnings(data){
  const warnings = [];
  if(!data.ooc_name || !data.discord_username || !data.real_age || !data.occupation || !data.activity_time) {
    warnings.push("Nu ai completat toate datele OOC importante.");
  }
  if(!data.ic_name || !data.ic_age || !data.game_id || !data.cnp_ic || !data.ic_education) {
    warnings.push("Nu ai completat datele IC importante.");
  }
  if(!data.final_confirm || !data.confirm_staff) warnings.push("Nu ai bifat confirmările finale.");
  return warnings;
}

async function finalizeTest(){
  const data = collectFormData();
  const warnings = requiredWarnings(data);
  if(warnings.length){
    const ok = confirm("Formularul pare incomplet:\n\n- " + warnings.join("\n- ") + "\n\nVrei să finalizezi totuși testul?");
    if(!ok) return;
  }
  const payload = encodePayload({v:1, type:"pd-haos-application", submittedAt:new Date().toISOString(), data});
  const candidateName = data.ic_name || data.ooc_name || data.discord_username || "Candidat PD";
  try {
    await sendToEvaluatorPortal({type:"pd", candidateName, code:payload});
  } catch(err) {
    alert(err.message || "Testul nu a putut fi trimis în portalul evaluator.");
    return;
  }
  localStorage.setItem("pd_haos_candidate_draft", JSON.stringify(data));
  showFinalizedMessage(candidateName);
}

function generateEvaluatorLink(){
  finalizeTest();
}

function copyLink(){
  alert("Linkul către evaluator a fost eliminat. Apasă Finalizează testul pentru trimitere automată în portal.");
}

function saveLocal(){
  localStorage.setItem("pd_haos_candidate_draft", JSON.stringify(collectFormData()));
  alert("Formular salvat temporar în acest browser.");
}

function loadLocal(){
  const raw = localStorage.getItem("pd_haos_candidate_draft");
  if(!raw) return alert("Nu există salvare temporară.");
  const data = JSON.parse(raw);
  document.querySelectorAll("input, textarea, select").forEach(el => {
    if(!el.name) return;
    if(el.type === "checkbox") el.checked = !!data[el.name];
    else if(el.type === "radio") el.checked = data[el.name] === el.value;
    else if(data[el.name] !== undefined) el.value = data[el.name];
  });
  alert("Salvarea a fost încărcată.");
}
