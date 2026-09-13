const workflows = [
  { name: "Client onboarding", detail: "Welcome email → Intake form → Create project", runs: "124 runs", time: "14.2 hrs saved", icon: "↯", tone: "purple", active: true },
  { name: "Proposal follow-up", detail: "Proposal viewed → Wait 2 days → Send follow-up", runs: "86 runs", time: "8.6 hrs saved", icon: "✉", tone: "orange", active: true },
  { name: "Invoice reminder", detail: "Invoice overdue → Send reminder → Notify team", runs: "52 runs", time: "6.1 hrs saved", icon: "▣", tone: "blue", active: true },
  { name: "Weekly client digest", detail: "Every Monday → Compile updates → Send digest", runs: "22 runs", time: "2.6 hrs saved", icon: "◷", tone: "green", active: false }
];

const list = document.querySelector("#workflowList");
const search = document.querySelector("#workflowSearch");
const modal = document.querySelector("#workflowModal");
const nameInput = document.querySelector("#workflowName");

function renderWorkflows(filter = "") {
  const query = filter.trim().toLowerCase();
  list.innerHTML = "";
  workflows.filter((workflow) => workflow.name.toLowerCase().includes(query)).forEach((workflow, index) => {
    const row = document.createElement("article");
    row.className = "workflow-row";
    row.innerHTML = `
      <span class="workflow-icon ${workflow.tone}">${workflow.icon}</span>
      <div><h3>${workflow.name}</h3><p>${workflow.detail}</p></div>
      <div class="workflow-stat"><strong>${workflow.runs}</strong>${workflow.time}</div>
      <span class="status ${workflow.active ? "" : "paused"}">${workflow.active ? "Active" : "Paused"}</span>
      <button class="row-menu" aria-label="Toggle ${workflow.name}">•••</button>
    `;
    row.querySelector(".row-menu").addEventListener("click", () => {
      workflow.active = !workflow.active;
      renderWorkflows(search.value);
    });
    list.appendChild(row);
  });
}

function openModal() {
  modal.hidden = false;
  nameInput.focus();
}

function closeModal() {
  modal.hidden = true;
}

document.querySelector("#createButton").addEventListener("click", openModal);
document.querySelector("#topCreateButton").addEventListener("click", openModal);
document.querySelector("#quickStartButton").addEventListener("click", openModal);
document.querySelector("#closeModal").addEventListener("click", closeModal);
document.querySelector("#cancelModal").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});
search.addEventListener("input", (event) => renderWorkflows(event.target.value));
document.querySelector("#workflowForm").addEventListener("submit", (event) => {
  event.preventDefault();
  workflows.unshift({
    name: nameInput.value.trim(),
    detail: `${document.querySelector("#workflowTrigger").value} → Run your playbook`,
    runs: "0 runs",
    time: "Ready to save time",
    icon: "✦",
    tone: "purple",
    active: true
  });
  renderWorkflows(search.value);
  event.target.reset();
  closeModal();
});

renderWorkflows();
