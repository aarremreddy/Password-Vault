// script.js
import { initMSAL } from "./auth.js";

const page = location.pathname.split("/").pop().toLowerCase();
const isLogin = page === "" || page === "index.html" || page === "login.html";
const isLanding = page === "landing.html";
const isClientLanding = page === "client-landing.html";

/* ---------- Small helpers ---------- */
const $ = (sel) => document.querySelector(sel);

function showAlert(msg) {
  const alertWindow = $("#alertWindow");
  const errorMessage = $("#errorMessage");
  const closeBtn = document.querySelector("#alertWindow .close-btn");
  const okBtn = $("#okBtn");
  if (errorMessage) errorMessage.textContent = msg || "Something went wrong";
  if (alertWindow) alertWindow.style.display = "block";
  function hide() {
    alertWindow.style.display = "none";
    closeBtn?.removeEventListener("click", hide);
    okBtn?.removeEventListener("click", hide);
  }
  closeBtn?.addEventListener("click", hide);
  okBtn?.addEventListener("click", hide);
}

/* Overlay controls (inline style beats any CSS cascade) */
function overlayEl() { return $("#signinOverlay"); }
function showOverlay() {
  const el = overlayEl();
  if (!el) return;
  el.style.display = "flex";          // ← forces visible
  el.classList.remove("hide");        // keep classes in sync
}
function hideOverlay() {
  const el = overlayEl();
  if (!el) return;
  el.style.display = "none";          // ← forces hidden
  el.classList.add("hide");
}

async function mapMsEmailToUserId() {
  const email = (sessionStorage.getItem("loginUserEmail") || "").toLowerCase();
  if (!email) return false;
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) return false;
  const data = await res.json();
  const users = data?.usersInfo?.users || [];
  const me = users.find((u) => String(u.email || "").toLowerCase() === email);
  if (!me) return false;
  sessionStorage.setItem("loginUserId", String(me.userId));
  sessionStorage.setItem("loginUser", me.userName || email);
  return true;
}

/* ---------- Auth gate for non-login pages ---------- */
async function ensureAuthenticated(msalInstance) {
  const active =
    msalInstance?.getActiveAccount?.() ||
    (msalInstance?.getAllAccounts?.() || [])[0];

  const hasAppSession =
    !!sessionStorage.getItem("loginUser") ||
    !!sessionStorage.getItem("loginUserEmail") ||
    !!sessionStorage.getItem("loginUserId");

  if (active || hasAppSession) return true;

  try {
    const mapped = await mapMsEmailToUserId();
    if (mapped) return true;
  } catch {}

  location.replace("login.html");
  return false;
}

/* ---------- Logout (robust) ---------- */
function clearMsalCache() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("msal.") || k.includes("msal") || k.includes("authority") || k.includes("aad"))) {
        keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Could not clear MSAL cache:", e);
  }
}

async function appLogout() {
  try {
    sessionStorage.removeItem("loginUser");
    sessionStorage.removeItem("loginUserEmail");
    sessionStorage.removeItem("loginUserId");
    clearMsalCache();

    const postLogoutRedirectUri = `${location.origin}/login.html`;
    const msalInstance = window.__msalInstance;

    if (msalInstance?.logoutRedirect) {
      const account =
        msalInstance.getActiveAccount() ||
        (msalInstance.getAllAccounts?.() || [])[0];
      if (account) {
        await msalInstance.logoutRedirect({ account, postLogoutRedirectUri });
        return; // browser navigates
      }
    }

    // Fallback: direct AAD logout
    const tenant = "common"; // or your tenantId
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;
    location.assign(url);
  } catch (e) {
    console.error("Logout error:", e);
    location.replace("login.html");
  }
}

/* ---------- Name resolution + DOM wiring ---------- */
async function resolveDisplayName(msalInstance) {
  // 1) App session (set by MSAL login or form login)
  let displayName = (sessionStorage.getItem("loginUser") || "").trim();
  if (displayName) return displayName;

  // 2) MSAL active account
  try {
    const acct =
      msalInstance?.getActiveAccount?.() ||
      (msalInstance?.getAllAccounts?.() || [])[0];
    if (acct?.name) return acct.name;
    if (acct?.username) {
      const email = String(acct.username);
      const beforeAt = email.split("@")[0];
      if (beforeAt) return beforeAt;
    }
  } catch {}

  // 3) data.json fallback: { "userName": "Sai" } or usersInfo mapping
  try {
    const r = await fetch("data.json", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      if (d?.userName) return d.userName;
      // Optional: if usersInfo exists and we have loginUserEmail, try map
      const email = (sessionStorage.getItem("loginUserEmail") || "").toLowerCase();
      if (email && Array.isArray(d?.usersInfo?.users)) {
        const m = d.usersInfo.users.find(u => String(u.email || "").toLowerCase() === email);
        if (m?.userName) return m.userName;
      }
    }
  } catch {}

  return ""; // nothing found
}

function applyWelcomeName(name) {
  if (!name) return;
  // Update span if present (preferred)
  const nameSpan = $("#welcome-name");
  if (nameSpan) {
    nameSpan.textContent = name;
  }
  // Also support older markup: replace full title text
  const welcomeEl = $("#welcome-message");
  if (welcomeEl && !nameSpan) {
    welcomeEl.textContent = `Welcome ${name}`;
  }
  // Header dropdown greeting
  const profileNameEl = $("#profile-name");
  if (profileNameEl) profileNameEl.textContent = name;

  // Client landing header paragraph (legacy support)
  const ph = document.querySelector(".profile-header p");
  if (ph && ph.textContent?.startsWith("Hi,")) {
    ph.textContent = `Hi, ${name}!`;
  }
}

/* ---------- Page boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  // Hard-stop: always start hidden on login page (covers post-logout)
  if (isLogin) {
    hideOverlay();
    // extra microtask guard
    setTimeout(hideOverlay, 0);
  }

  // Microsoft button
  const msBtn = $("#ms-login");
  if (msBtn) {
    msBtn.type = "button";
    msBtn.addEventListener("click", async () => {
      try {
        window.__msalInstance ||= await initMSAL(true);
        if (!window.__msalInstance) {
          showAlert("Microsoft login is not configured. Check console and config.json.");
          return;
        }
        showOverlay(); // only when user initiates login
        const loginRequest = { scopes: ["openid", "profile", "email"], prompt: "select_account" };
        await window.__msalInstance.loginRedirect(loginRequest);
      } catch (err) {
        console.error("Microsoft login error:", err);
        showAlert("Microsoft login failed. Check console for details.");
        hideOverlay();
      }
    });
  }

  // Init MSAL
  let msalInstance = null;
  try {
    msalInstance = (window.__msalInstance = await initMSAL(isLogin));
  } catch (e) {
    console.error("MSAL init failed:", e);
  }

  // --- LOGIN PAGE ONLY ---
  if (isLogin && msalInstance) {
    try {
      // Wait to see if Microsoft redirected back
      const redirectResponse = await msalInstance.handleRedirectPromise();

      if (redirectResponse?.account) {
        showOverlay(); // real redirect → show while finishing

        msalInstance.setActiveAccount(redirectResponse.account);
        sessionStorage.setItem(
          "loginUser",
          redirectResponse.account.name || redirectResponse.account.username || ""
        );
        sessionStorage.setItem("loginUserEmail", redirectResponse.account.username || "");

        const mapped = await mapMsEmailToUserId();
        if (mapped) {
          location.replace("landing.html");
        } else {
          showAlert("Your Microsoft account is not authorized for this app.");
          hideOverlay(); // back to login UI
        }
        return;
      }

      // No redirect → keep overlay hidden (do nothing)
    } catch (e) {
      console.error("handleRedirectPromise error:", e);
      showAlert("Login redirect handling failed. Check console for details.");
      hideOverlay();
    }
  }

  // Username/password login
  if (isLogin) {
    const loginForm = $("#loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const username = ($("#username")?.value || "").trim();
        const password = ($("#password")?.value || "").trim();

        if (!username || !password) {
          showAlert("Please enter both username and password.");
          return;
        }

        let didNavigate = false;
        submitBtn && (submitBtn.disabled = true);
        showOverlay();

        try {
          const r = await fetch("users.json", { cache: "no-store" });
          if (!r.ok) throw new Error(`users.json HTTP ${r.status}`);

          const { users = [] } = await r.json();
          const u = users.find((x) => x.username === username && x.password === password);

          if (!u) {
            showAlert("Invalid username or password");
            return;
          }

          sessionStorage.setItem("loginUser", u.username);
          sessionStorage.setItem("loginUserId", String(u.userId));

          didNavigate = true; // leave overlay visible during navigation
          location.replace("landing.html");
        } catch (err) {
          console.error(err);
          showAlert("Login error. Please try again.");
        } finally {
          if (!didNavigate) {
            hideOverlay();
            submitBtn && (submitBtn.disabled = false);
          }
        }
      });
    }
  }

  /* ---------- Header menu + Logout wiring ---------- */
  document.addEventListener("click", async (e) => {
    const logoutA = e.target.closest(".logout-link");
    if (logoutA) {
      e.preventDefault();
      await appLogout();
    }
  });

  // Simple gear menu toggle
  (function wireHeaderMenu() {
    const gearBtn = $("#gear-btn");
    const profileDropdown = $("#profile-dropdown");
    const closeBtn = profileDropdown?.querySelector(".close-btn");

    function close() {
      if (!profileDropdown) return;
      profileDropdown.classList.remove("show");
      profileDropdown.setAttribute("hidden", "");
    }
    function open() {
      if (!profileDropdown) return;
      profileDropdown.classList.add("show");
      profileDropdown.removeAttribute("hidden");
    }

    gearBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!profileDropdown) return;
      const isOpen = profileDropdown.classList.contains("show") && !profileDropdown.hasAttribute("hidden");
      if (isOpen) close(); else open();
    });

    closeBtn?.addEventListener("click", close);
    document.addEventListener("click", (e) => {
      if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== gearBtn) close();
    });
  })();

  /* ---------- Auth gate for landing / client pages ---------- */
  if (!isLogin) {
    await ensureAuthenticated(msalInstance);
  }

  /* ---------- Dynamic Welcome (landing + header) ---------- */
  if (isLanding || isClientLanding) {
    try {
      const name = await resolveDisplayName(msalInstance);
      if (name) applyWelcomeName(name);
    } catch (e) {
      console.warn("Could not resolve display name:", e);
    }
  }
});
