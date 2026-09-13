(() => {
  const replaceBranding = () => {
    document.body.innerHTML = document.body.innerHTML
      .replaceAll("DEAL AUDIT", "CAGNEX")
      .replaceAll("A. Chen", "Anurag Mishra")
      .replaceAll("Managing Dir.", "Managing Director");
    document.title = "CAGNEX — Autonomous Credit Intelligence";
  };

  const toast = (message) => {
    const node = document.createElement("div");
    node.textContent = message;
    node.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:100;background:#131c35;color:#dfe2ef;border:1px solid rgba(180,197,255,.35);padding:10px 14px;border-radius:4px;font:12px 'JetBrains Mono',monospace;box-shadow:0 8px 28px #0008";
    document.body.append(node);
    window.setTimeout(() => node.remove(), 2800);
  };

  replaceBranding();

  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelectorAll("nav a").forEach((item) => item.classList.remove("bg-surface-elevated", "text-primary", "font-semibold"));
      link.classList.add("bg-surface-elevated", "text-primary", "font-semibold");
      toast(`${link.textContent.trim()} module selected`);
    });
  });

  document.querySelectorAll("button").forEach((button) => {
    const label = button.textContent.trim();
    if (/Run Compliance Check/i.test(label)) button.addEventListener("click", () => toast("Compliance validation queued — deterministic checks will run in the verification worker."));
    if (/Export IC Memo/i.test(label)) button.addEventListener("click", () => toast("IC memo export queued — the audit-ready file will appear in Export Vault."));
    if (/Sync to Excel Model/i.test(label)) button.addEventListener("click", () => toast("Financial model sync queued — source references will be preserved."));
    if (/Override Value/i.test(label)) button.addEventListener("click", () => toast("Override requires a reason and will create an immutable audit event."));
    if (/Simulate Cure/i.test(label)) button.addEventListener("click", () => toast("Cure simulation queued for base, downside, and severe scenarios."));
  });

  const tabs = [...document.querySelectorAll("main button")].filter((button) => /Financial Covenants|EBITDA Reconciliation|IC Memo Draft|Scenario Stress/i.test(button.textContent));
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("bg-surface-elevated", "text-primary"));
    tab.classList.add("bg-surface-elevated", "text-primary");
    toast(`${tab.textContent.trim()} view selected`);
  }));
})();
