// === Microsoft OAuth + Local Login Guard (using config.json) ===
(async () => {
  // 0) Ensure MSAL is present
  if (!window.msal) {
    console.error("MSAL failed to load. Check lib/msal-browser.min.js or CDN fallback.");
    // You can still allow local login below, but MS login won't work.
  }

  // 1) Try local-login fast path first (so page is responsive even if config fetch is slow)
  const localLogin = sessionStorage.getItem("localLogin") === "true";
  let showedLocalWelcome = false;

  if (localLogin) {
    const localUser = sessionStorage.getItem("localUser") || "there";
    const el = document.getElementById("welcome");
    if (el) el.textContent = `Welcome, ${localUser}`;
    showedLocalWelcome = true;
  }

  // 2) Load config.json
  let cfg;
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading /config.json`);
    cfg = await res.json();
  } catch (err) {
    console.error("Failed to load config.json:", err);
    // If not locally logged in, bounce to login
    if (!localLogin) window.location.href = "login.html";
    return;
  }

  const tenantId = cfg.tenantId?.trim();
  const clientId = cfg.clientId?.trim();
  if (!tenantId || !clientId) {
    console.error("Missing tenantId/clientId in config.json");
    if (!localLogin) window.location.href = "login.html";
    return;
  }

  // 3) Init MSAL (redirectUri = login page)
  const redirectUri = window.location.origin + "/login.html";
  const msalInstance = new msal.PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri
    },
    cache: { cacheLocation: "localStorage" }
  });

  try {
    await msalInstance.initialize();

    // No-op unless this page was used as redirect target
    try { await msalInstance.handleRedirectPromise(); } 
    catch (e) { console.warn("handleRedirectPromise (landing) warning:", e); }

    let account = msalInstance.getAllAccounts()[0];

    if (account) {
      msalInstance.setActiveAccount(account);
      const name = account.name || account.username || "there";
      const el = document.getElementById("welcome");
      if (el) el.textContent = `Welcome, ${name}`;
    } else {
      // If there was no MSAL account and no local login, send to login
      if (!localLogin) {
        window.location.href = "login.html";
        return;
      }
      // If local login already showed welcome, nothing more to do
    }

    // Logout
    document.getElementById("logout")?.addEventListener("click", async () => {
      // Clear local flags regardless of auth type
      sessionStorage.removeItem("localLogin");
      sessionStorage.removeItem("localUser");
      sessionStorage.removeItem("role");

      const currentAccount = msalInstance.getAllAccounts()[0];
      if (currentAccount) {
        try {
          await msalInstance.logoutRedirect({ postLogoutRedirectUri: redirectUri });
        } catch (e) {
          console.error("logoutRedirect error:", e);
          window.location.href = "login.html";
        }
      } else {
        window.location.href = "login.html";
      }
    });

  } catch (e) {
    console.error("Landing init error:", e);
    const out = document.getElementById("output");
    if (out) out.textContent = String(e?.message || e);
    if (!localLogin) window.location.href = "login.html";
  }
})();

// === Dropdown menu logic ===
const dropdownBtns = document.querySelectorAll(".dropdown-btn");
dropdownBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = btn.closest("li").querySelector(".dropdown-content");
    const isOpen = dropdown.classList.contains("open");

    document.querySelectorAll(".dropdown-content").forEach(menu => menu.classList.remove("open"));
    document.querySelectorAll(".dropdown-btn").forEach(b => b.classList.remove("rotated"));

    if (!isOpen) {
      dropdown.classList.add("open");
      btn.classList.add("rotated");
    }
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown-content").forEach(menu => menu.classList.remove("open"));
  document.querySelectorAll(".dropdown-btn").forEach(btn => btn.classList.remove("rotated"));
});
