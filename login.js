// ====== Local login (existing logic) ======
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (
    (username === "akruth" && password === "1234") ||
    (username === "akshith" && password === "1234")
  ) {
    sessionStorage.setItem("localLogin", "true");
    sessionStorage.setItem("localUser", username);
    sessionStorage.removeItem("role");
    window.location.href = "landing.html";
    return;
  } else if (username === "admin" && password === "1234") {
    sessionStorage.setItem("localLogin", "true");
    sessionStorage.setItem("localUser", username);
    sessionStorage.setItem("role", "admin");
    window.location.href = "admin.html";
    return;
  } else {
    alert("Invalid username or password");
  }
});

// ====== Microsoft OAuth login via config.json ======
(async () => {
  // 1) Load config.json
  let cfg;
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading /config.json`);
    cfg = await res.json();
  } catch (err) {
    console.error("Failed to load config.json:", err);
    alert("Authentication config not found. Please contact the administrator.");
    return;
  }

  const tenantId = cfg.tenantId?.trim();
  const clientId = cfg.clientId?.trim();

  if (!tenantId || !clientId) {
    console.error("Missing tenantId/clientId in config.json");
    alert("Invalid authentication configuration. Please contact the administrator.");
    return;
  }

  // 2) MSAL config
  const redirectUri = window.location.origin + "/login.html"; // must match Entra ID app registration
  const msalInstance = new msal.PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri
    },
    cache: { cacheLocation: "localStorage" }
  });

  try {
    // 3) Initialize and handle redirect response
    await msalInstance.initialize();
    const resp = await msalInstance.handleRedirectPromise().catch(console.error);

    if (resp) {
      msalInstance.setActiveAccount(resp.account);
      window.location.href = "landing.html";
      return;
    }

    const existingAccounts = msalInstance.getAllAccounts();
    if (existingAccounts.length > 0) {
      msalInstance.setActiveAccount(existingAccounts[0]);
      window.location.href = "landing.html";
      return;
    }

    // 4) Microsoft login button click — avoid interaction_in_progress
    document.getElementById("ms-login").addEventListener("click", async () => {
      try {
        const activeAccount = msalInstance.getActiveAccount();
        if (!activeAccount) {
          await msalInstance.loginRedirect({ scopes: ["User.Read"] });
        } else {
          console.log("Already logged in as", activeAccount.username);
        }
      } catch (e) {
        console.error("Microsoft login error:", e);
      }
    });

  } catch (err) {
    console.error("MSAL init/redirect handling error:", err);
  }
})();
