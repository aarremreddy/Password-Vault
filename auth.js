// auth.js

// Load config.json dynamically (clientId + tenantId)
async function loadConfig() {
  const res = await fetch("/config.json", { cache: "no-store" });
  if (!res.ok)
    throw new Error(`Failed to load config.json: HTTP ${res.status}`);
  return await res.json();
}

export async function initMSAL(isLoginPage = false) {
  try {
    const cfg = await loadConfig();
    const clientId = cfg.clientId?.trim();
    const tenantId = cfg.tenantId?.trim();
    const redirectUri = window.location.origin + (cfg.redirectPath || "/login.html");

    if (!clientId || !tenantId) {
      console.error("Invalid tenantId/clientId in config.json");
      return;
    }

    const msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri,
      },
      cache: { cacheLocation: "localStorage" },
    });

    // On login page, handle the redirect promise. On other pages, just initialize.
    // This ensures that by the time we check for an active account,
    // the redirect has been fully processed and the session is in storage.
    if (isLoginPage) {
      await msalInstance.handleRedirectPromise();
    }
    await msalInstance.initialize();

    // For landing/admin pages → check active account
    const account =
      msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    // if (!account && !isLoginPage) {
    //   console.log("No active Microsoft session. Redirecting to login...");
    //   window.location.href = "login.html";
    //   return;
    // }
    return msalInstance;
  } catch (err) {
    console.error("MSAL init error:", err);
  }
}
