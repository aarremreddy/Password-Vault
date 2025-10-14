// auth.js

// Load config.json dynamically (clientId + tenantId)
async function loadConfig() {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok)
        throw new Error(`Failed to load config.json: HTTP ${res.status}`);
    return await res.json();
}

/**
 * Initializes the MSAL PublicClientApplication.
 * @param {boolean} isLoginPage - Indicates if the current page is the login page.
 * @returns {Promise<PublicClientApplication | null>}
 */
export async function initMSAL(isLoginPage = false) {
    try {
        const cfg = await loadConfig();
        const clientId = cfg.clientId?.trim();
        const tenantId = cfg.tenantId?.trim();
        const redirectUri = window.location.origin + (cfg.redirectPath || "/login.html");

        if (!clientId || !tenantId) {
            console.error("Invalid tenantId/clientId in config.json");
            return null;
        }

        const msalInstance = new msal.PublicClientApplication({
            auth: {
                clientId,
                authority: `https://login.microsoftonline.com/${tenantId}`,
                redirectUri,
            },
            cache: { cacheLocation: "localStorage" },
        });

        // Handle the redirect promise on the login page to process the auth response.
        if (isLoginPage) {
            await msalInstance.handleRedirectPromise();
        }

        // This line is not needed. The constructor call above already initializes it.
        // await msalInstance.initialize();

        // Set the active account if one exists.
        const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
        if (account) {
            msalInstance.setActiveAccount(account);
        }

        return msalInstance;
    } catch (err) {
        console.error("MSAL init error:", err);
        return null;
    }
}