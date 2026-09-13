const toast = document.querySelector("#toast");
const views = document.querySelectorAll(".view");
const crumbTitle = document.querySelector("#crumbTitle");

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function showView(id, title) {
  views.forEach((view) => view.classList.toggle("active-view", view.id === id));
  crumbTitle.textContent = title;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".deal-row").forEach((row) => {
  row.addEventListener("click", () => {
    showView("workbench", "Project Apollo");
    document.querySelectorAll(".deal-row").forEach((item) => item.classList.remove("selected-row"));
    row.classList.add("selected-row");
  });
});

document.querySelector("#openWorkbench").addEventListener("click", () => showView("workbench", "Project Apollo"));
document.querySelectorAll('a[href="#workbench"]').forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  showView("workbench", "Project Apollo");
}));
document.querySelector('a[href="#pipeline"]').addEventListener("click", (event) => {
  event.preventDefault();
  showView("pipeline", "Pipeline");
});

document.querySelectorAll(".intel-tabs button").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".intel-tabs button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".intel-body").forEach((body) => body.classList.add("hidden"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.tab}`).classList.remove("hidden");
  });
});

document.querySelectorAll("[data-tab-target]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector('[data-tab="financials"]').click());
});
document.querySelectorAll(".covenant-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    notify("Source linked: Credit_Agreement_Final.pdf · page 114 · §7.02(b)");
  });
});
document.querySelectorAll(".source-btn").forEach((button) => button.addEventListener("click", () => notify("Evidence canvas focused on page 114, §7.02(c)")));
document.querySelectorAll(".override").forEach((button) => button.addEventListener("click", () => notify(`${button.dataset.covenant} override requires a reason and will be added to the immutable audit log.`)));
document.querySelector("#validateBtn").addEventListener("click", (event) => {
  event.currentTarget.textContent = "✓ Validation queued";
  notify("Compliance job queued. Deterministic checks will run in the verification worker.");
  window.setTimeout(() => { event.currentTarget.textContent = "✓ Run compliance check"; }, 3000);
});
document.querySelector("#exportBtn").addEventListener("click", () => notify("IC memo export queued. You will receive a download when the job completes."));

const dealModal = document.querySelector("#dealModal");
document.querySelector("#newDeal").addEventListener("click", () => { dealModal.hidden = false; document.querySelector("#dealName").focus(); });
document.querySelector("#closeDeal").addEventListener("click", () => { dealModal.hidden = true; });
document.querySelector("#createDeal").addEventListener("click", () => {
  const name = document.querySelector("#dealName").value.trim();
  if (!name) return notify("Enter a deal name to create the room.");
  dealModal.hidden = true;
  document.querySelector("#dealName").value = "";
  notify(`${name} deal room created. Upload documents to begin classification.`);
});
dealModal.addEventListener("click", (event) => { if (event.target === dealModal) dealModal.hidden = true; });
