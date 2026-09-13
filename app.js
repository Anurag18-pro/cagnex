(() => {
  const $ = (selector) => document.querySelector(selector);
  const publicView = $("#public-view");
  const authView = $("#auth-view");
  const appView = $("#app-view");
  let authMode = "login";
  let currentUser = null;
  let organization = null;
  let demoMode = false;
  let supabaseClient = null;
  const demoStorageKey = "cagnex-demo-users";

  const toast = (message) => {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => node.classList.remove("show"), 3200);
  };

  const request = async (url, options = {}) => {
    let response;
    try {
      response = await fetch(url, { credentials: "same-origin", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    } catch {
      throw new Error("The CAGNEX API is not running. Start the project with `vercel dev`; a static file server cannot process login or registration.");
    }
    if (response.status === 204) return null;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Something went wrong. Please try again.");
      error.apiUnavailable = [404, 405, 501].includes(response.status);
      throw error;
    }
    return data;
  };

  const getSupabaseClient = async () => {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase?.createClient) throw new Error("Supabase Auth is unavailable. Check your internet connection and reload.");
    const config = await request("/api/auth/request-reset");
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return supabaseClient;
  };

  const demoUsers = () => JSON.parse(localStorage.getItem(demoStorageKey) || "[]");
  const saveDemoUsers = (users) => localStorage.setItem(demoStorageKey, JSON.stringify(users));
  const demoRole = (accountType) => ({ admin: "managing_director", employee: "credit_analyst", client: "external_auditor" }[accountType] || "external_auditor");
  const demoAuth = (form, register) => {
    const accountType = form.get("account_type") || "client";
    const email = String(form.get("email")).trim().toLowerCase();
    const users = demoUsers();
    let user = users.find((item) => item.email === email);
    if (register) {
      user = { id: `demo-${Date.now()}`, name: String(form.get("name")).trim(), email, phone_number: String(form.get("phone")).trim(), password: String(form.get("password")), accountType, deals: [] };
      users.push(user);
      saveDemoUsers(users);
    } else if (!user) {
      user = { id: `demo-${accountType}`, name: accountType === "admin" ? "Anurag Mishra" : accountType === "employee" ? "Demo Employee" : "Demo Client", email, phone_number: "", password: String(form.get("password")), accountType, deals: [] };
      users.push(user);
      saveDemoUsers(users);
    }
    currentUser = user;
    organization = { id: `demo-workspace-${user.accountType}`, name: user.accountType === "admin" ? "CAGNEX Executive Workspace" : `${user.name}'s Workspace`, role: demoRole(user.accountType) };
    demoMode = true;
  };

  const setView = (view) => {
    publicView.classList.toggle("hidden", view !== "public");
    authView.classList.toggle("hidden", view !== "auth");
    appView.classList.toggle("hidden", view !== "app");
    window.scrollTo(0, 0);
  };

  const setAuthMode = (mode) => {
    authMode = mode;
    const register = mode === "register";
    $("#auth-title").textContent = register ? "Build your workspace." : "Welcome back.";
    $("#auth-subtitle").textContent = register ? "Create a secure space for your next credit decision." : "Sign in to continue to your secure workspace.";
    $("#auth-submit").innerHTML = register ? "Create workspace <span>→</span>" : "Sign in <span>→</span>";
    $("#name-field").classList.toggle("hidden", !register);
    $("#phone-field").classList.toggle("hidden", !register);
    $("#name").required = register;
    $("#phone").required = register;
    $("#auth-switch").innerHTML = register ? 'Already have an account? <button data-auth="login">Sign in</button>' : 'New to CAGNEX? <button data-auth="register">Create an account</button>';
    setView("auth");
  };

  const showAuth = (event) => {
    event.preventDefault();
    setAuthMode(event.currentTarget.dataset.auth);
  };

  document.addEventListener("click", (event) => {
    const authButton = event.target.closest("[data-auth]");
    if (authButton) showAuth({ preventDefault: () => event.preventDefault(), currentTarget: authButton });
    if (event.target.closest("[data-show-public]")) setView("public");
    if (event.target.closest("[data-close-modal]")) $("#deal-modal").classList.add("hidden");
  });

  $("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { email: form.get("email"), password: form.get("password"), account_type: form.get("account_type") };
    if (authMode === "register") Object.assign(payload, { name: form.get("name"), phone_number: form.get("phone") });
    const error = $("#form-error");
    error.textContent = "";
    const submit = $("#auth-submit");
    submit.disabled = true;
    submit.textContent = authMode === "register" ? "Creating workspace…" : "Signing in…";
    try {
      const result = await request(authMode === "register" ? "/api/auth/register" : "/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
      currentUser = result.user;
      organization = result.organization || null;
      await showApp();
    } catch (requestError) {
      if (requestError.apiUnavailable || requestError.message.includes("API is not running")) {
        demoAuth(form, authMode === "register");
        toast("Local preview mode: this workspace is saved only in this browser.");
        await showApp();
      } else {
        error.textContent = requestError.message;
      }
    } finally {
      submit.disabled = false;
      submit.innerHTML = authMode === "register" ? "Create workspace <span>→</span>" : "Sign in <span>→</span>";
    }
  });

  $("#forgot-password-button").addEventListener("click", () => {
    $("#reset-panel").classList.toggle("hidden");
    $("#reset-email").value = $("#email").value;
    $("#reset-error").textContent = "";
  });

  $("#send-reset-code").addEventListener("click", async () => {
    const email = $("#reset-email").value.trim();
    const error = $("#reset-error");
    error.textContent = "";
    if (!email) {
      error.textContent = "Enter your account email first.";
      return;
    }
    const button = $("#send-reset-code");
    button.disabled = true;
    button.textContent = "Sending OTP…";
    try {
      const client = await getSupabaseClient();
      const { error: otpError } = await client.auth.signInWithOtp({ email });
      if (otpError) throw otpError;
      $("#otp-fields").classList.remove("hidden");
      toast("If the account exists, a Supabase email OTP has been sent.");
    } catch (requestError) {
      error.textContent = requestError.message;
    } finally {
      button.disabled = false;
      button.textContent = "Send OTP";
    }
  });

  $("#reset-password-button").addEventListener("click", async () => {
    const error = $("#reset-error");
    error.textContent = "";
    const button = $("#reset-password-button");
    button.disabled = true;
    button.textContent = "Updating password…";
    try {
      const client = await getSupabaseClient();
      const email = $("#reset-email").value.trim().toLowerCase();
      const otp = $("#reset-otp").value.trim();
      const { data: authData, error: otpError } = await client.auth.verifyOtp({ email, token: otp, type: "email" });
      if (otpError || !authData.session?.access_token) {
        throw otpError || new Error("The OTP is invalid or expired. Request a new code.");
      }
      const result = await request("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          password: $("#reset-password").value,
          access_token: authData.session.access_token
        })
      });
      toast(result.message);
      $("#password").value = $("#reset-password").value;
      $("#reset-panel").classList.add("hidden");
      $("#otp-fields").classList.add("hidden");
    } catch (requestError) {
      error.textContent = requestError.message;
    } finally {
      button.disabled = false;
      button.textContent = "Reset password";
    }
  });

  const renderDeals = (deals) => {
    $("#deal-count").textContent = deals.length;
    $("#flag-count").textContent = deals.reduce((total, deal) => total + Number(deal.flags_count || 0), 0);
    $("#deal-list").innerHTML = deals.length ? deals.map((deal) => `<article class="deal-row"><div><strong>${escapeHtml(deal.name)}</strong><small>${escapeHtml(deal.borrower_name || "Borrower not added")} · ${escapeHtml(deal.facility_type || "Credit facility")}</small></div><div><span>Facility</span><strong>${deal.facility_amount ? `$${Number(deal.facility_amount).toLocaleString()}` : "Not set"}</strong></div><div><span>Status</span><span class="status">${formatStatus(deal.status)}</span></div><button class="button button-quiet open-deal" data-deal-id="${deal.id}">Open →</button></article>`).join("") : '<div class="empty-state"><strong>Your first deal room is waiting.</strong><br>Create a room to start organizing the work.</div>';
    document.querySelectorAll(".open-deal").forEach((button) => button.addEventListener("click", () => toast("Deal room is ready for documents and review. Document ingestion is the next step.")));
  };

  const loadDeals = async () => {
    if (demoMode) {
      const stored = demoUsers().find((item) => item.id === currentUser.id);
      renderDeals(stored?.deals || []);
      return;
    }
    try {
      const result = await request("/api/v1/deals");
      renderDeals(result.deals || []);
    } catch (error) {
      $("#deal-list").innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    }
  };

  const showApp = async () => {
    setView("app");
    const role = organization?.role || "external_auditor";
    const isAdmin = ["super_admin", "managing_director"].includes(role);
    const isEmployee = ["lead_underwriter", "credit_analyst"].includes(role);
    $("#role-badge").textContent = isAdmin ? "CEO / Admin" : isEmployee ? "Employee" : "Client";
    $("#deal-nav-label").textContent = isAdmin ? "All deal rooms" : isEmployee ? "Assigned work" : "My deals";
    $("#workspace-eyebrow").textContent = isAdmin ? "CEO command center" : isEmployee ? "Employee workspace" : "Client workspace";
    $("#welcome-copy").textContent = isAdmin ? "Every important signal from your organization, in one place." : isEmployee ? "Only deals assigned to you are shown here." : "Track your deal progress and account information here.";
    $("#deal-heading").textContent = isAdmin ? "Organization deal rooms" : isEmployee ? "Assigned deal rooms" : "My deal rooms";
    $("#deal-subheading").textContent = isAdmin ? "Monitor progress across every active piece of work." : isEmployee ? "Your access is limited to the deals you are working on." : "Your account only shows the deals connected to you.";
    $("#new-deal-button").classList.toggle("hidden", !isAdmin);
    $("#admin-panel").classList.toggle("hidden", !isAdmin);
    if (!isAdmin) {
      $("#stat-one-label").textContent = isEmployee ? "Assigned deal rooms" : "Your active deals";
      $("#stat-two-label").textContent = isEmployee ? "Review flags" : "Payment status";
      $("#stat-three-label").textContent = "Progress";
      $("#readiness-value").textContent = isEmployee ? "78%" : "In progress";
    }
    const firstName = (currentUser?.name || "there").split(" ")[0];
    $("#welcome-title").textContent = `Good morning, ${firstName}.`;
    $("#user-avatar").textContent = (currentUser?.name || "AM").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    $("#workspace-name").textContent = organization?.name || "Your workspace";
    $("#workspace-eyebrow").textContent += demoMode ? " · LOCAL PREVIEW" : "";
    try {
      const overview = await request("/api/v1/overview");
      if (isAdmin) {
        $("#people-count").textContent = overview.people;
        $("#admin-deals").textContent = overview.deals;
        $("#admin-flags").textContent = overview.flags;
        $("#team-list").innerHTML = (overview.team || []).map((member) => `<div class="team-member"><span>${escapeHtml(member.name)}</span><small>${escapeHtml(member.role.replaceAll("_", " "))} · ${member.assigned_deals} assigned</small></div>`).join("");
      }
    } catch (error) {
      if (demoMode && isAdmin) {
        const users = demoUsers();
        $("#people-count").textContent = users.length || "1";
        $("#admin-deals").textContent = users.reduce((count, user) => count + (user.deals?.length || 0), 0);
        $("#admin-flags").textContent = "0";
        $("#team-list").innerHTML = users.map((user) => `<div class="team-member"><span>${escapeHtml(user.name)}</span><small>${escapeHtml(demoRole(user.accountType).replaceAll("_", " "))} · ${user.deals?.length || 0} assigned</small></div>`).join("");
      } else if (!demoMode) {
        toast(error.message);
      }
    }
    await loadDeals();
  };

  $("#logout-button").addEventListener("click", async () => {
    if (!demoMode) await request("/api/auth/logout", { method: "POST" });
    currentUser = null;
    organization = null;
    setView("public");
    demoMode = false;
    toast("You have been signed out.");
  });
  $("#new-deal-button").addEventListener("click", () => $("#deal-modal").classList.remove("hidden"));
  $("#refresh-deals").addEventListener("click", loadDeals);
  $("#deal-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = $("#deal-error");
    error.textContent = "";
    if (!organization?.id) {
      error.textContent = "Your workspace is still loading. Please try again.";
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      if (demoMode) {
        const users = demoUsers();
        const user = users.find((item) => item.id === currentUser.id);
        user.deals.push({ id: `demo-deal-${Date.now()}`, name: form.get("deal-name"), borrower_name: form.get("borrower-name"), facility_type: "Credit facility", status: "review", flags_count: 0 });
        saveDemoUsers(users);
        event.currentTarget.reset();
        $("#deal-modal").classList.add("hidden");
        toast("Demo deal room created in this browser.");
        await loadDeals();
        return;
      }
      await request("/api/v1/deals", { method: "POST", body: JSON.stringify({ name: form.get("deal-name"), borrower_name: form.get("borrower-name"), workspace_id: organization.id }) });
      event.currentTarget.reset();
      $("#deal-modal").classList.add("hidden");
      toast("Deal room created.");
      await loadDeals();
    } catch (requestError) {
      error.textContent = requestError.message;
    }
  });

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
  const formatStatus = (value) => ({ queued: "Queued", classifying: "Processing", parsing: "Processing", review: "Needs review", complete: "Ready" }[value] || "In progress");

  const initialize = async () => {
    try {
      const result = await request("/api/auth/me");
      currentUser = result.user;
      organization = result.organization;
      await showApp();
    } catch {
      setView("public");
    }
  };
  initialize();
})();
