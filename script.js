// script.js
import { initMSAL } from "./auth.js";

const page = location.pathname.split("/").pop().toLowerCase();
const isLogin = page === "" || page === "index.html" || page === "login.html";
const isLanding = page === "landing.html";
const isClientLanding = page === "client-landing.html";
const isManageAccount = page === "manage-account.html";

/* ---------- Small helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);


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

/* ---------- Overlay controls ---------- */
function overlayEl() {
  return $("#signinOverlay");
}
function showOverlay() {
  const el = overlayEl();
  if (!el) return;
  el.style.display = "flex";
  el.classList.remove("hide");
}
function hideOverlay() {
  const el = overlayEl();
  if (!el) return;
  el.style.display = "none";
  el.classList.add("hide");
}

/* ---------- Map Microsoft email to internal user ---------- */
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

/* ---------- Auth gate ---------- */
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

/* ---------- Logout handling ---------- */
function clearMsalCache() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("msal.") ||
          k.includes("msal") ||
          k.includes("authority") ||
          k.includes("aad"))
      ) {
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
        return;
      }
    }

    const tenant = "common";
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
      postLogoutRedirectUri
    )}`;
    location.assign(url);
  } catch (e) {
    console.error("Logout error:", e);
    location.replace("login.html");
  }
}

/* ---------- Resolve display name ---------- */
async function resolveDisplayName(msalInstance) {
  let displayName = (sessionStorage.getItem("loginUser") || "").trim();
  if (displayName) return displayName;

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

  try {
    const r = await fetch("data.json", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      const email = (
        sessionStorage.getItem("loginUserEmail") || ""
      ).toLowerCase();
      if (email && Array.isArray(d?.usersInfo?.users)) {
        const m = d.usersInfo.users.find(
          (u) => String(u.email || "").toLowerCase() === email
        );
        if (m?.userName) return m.userName;
      }
    }
  } catch {}

  return "";
}

async function getUserEmail(msalInstance) {
  try {
    const activeAccount = msalInstance?.getActiveAccount?.() || (msalInstance?.getAllAccounts?.() || [])[0];
    return activeAccount?.username || sessionStorage.getItem("loginUserEmail") || "";
  } catch (e) {
    console.error("Could not get user email from MSAL:", e);
    return sessionStorage.getItem("loginUserEmail") || "";
  }
}

async function updateProfileUI(msalInstance) {
  try {
    const displayName = await resolveDisplayName(msalInstance);
    const userEmail = await getUserEmail(msalInstance);
    const profileIconButton = document.getElementById("profile-icon-btn");

    if (profileIconButton && displayName) {
      profileIconButton.setAttribute("title", `Account manager for ${displayName}`);
    }

    // Only update welcome message on landing page
    if (isLanding) {
      const welcomeEl = document.getElementById("welcomeMsg");
      if (welcomeEl) welcomeEl.textContent = `Welcome ${displayName}!`;
    }
    
    const profileEmailEl = document.getElementById("profile-email");
    if (profileEmailEl) profileEmailEl.textContent = userEmail;

    const profileLargeAvatarEl = document.getElementById("profile-avatar-large");
    if (profileLargeAvatarEl && displayName) {
      profileLargeAvatarEl.textContent = displayName.charAt(0).toUpperCase();
    }

    const profileSmallAvatarEl = document.querySelector(".profile-icon-btn .profile-avatar");
    if (profileSmallAvatarEl && displayName) {
      profileSmallAvatarEl.textContent = displayName.charAt(0).toUpperCase();
    }
    
    const profileWelcomeMsgEl = document.getElementById("welcome-message");
    if (profileWelcomeMsgEl && displayName) {
        profileWelcomeMsgEl.textContent = `Hi, ${displayName}!`;
    }

  } catch (e) {
    console.warn("Could not update profile UI:", e);
  }
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  if (isLogin) {
    hideOverlay();
    setTimeout(hideOverlay, 0);
  }

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
        showOverlay();
        const loginRequest = {
          scopes: ["openid", "profile", "email"],
          prompt: "select_account",
        };
        await window.__msalInstance.loginRedirect(loginRequest);
      } catch (err) {
        console.error("Microsoft login error:", err);
        showAlert("Microsoft login failed. Check console for details.");
        hideOverlay();
      }
    });
  }

  let msalInstance = null;
  try {
    msalInstance = window.__msalInstance = await initMSAL(isLogin);
  } catch (e) {
    console.error("MSAL init failed:", e);
  }

  if (isLogin && msalInstance) {
    try {
      const redirectResponse = await msalInstance.handleRedirectPromise();
      if (redirectResponse?.account) {
        showOverlay();
        msalInstance.setActiveAccount(redirectResponse.account);
        sessionStorage.setItem("loginUser", redirectResponse.account.name || redirectResponse.account.username || "");
        sessionStorage.setItem("loginUserEmail", redirectResponse.account.username || "");
        const mapped = await mapMsEmailToUserId();
        if (mapped) {
          location.replace("landing.html");
        } else {
          showAlert("Your Microsoft account is not authorized for this app.");
          hideOverlay();
        }
        return;
      }
    } catch (e) {
      console.error("handleRedirectPromise error:", e);
      showAlert("Login redirect handling failed. Check console for details.");
      hideOverlay();
    }
  }

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

          sessionStorage.setItem("loginUser", u.userName || u.username);
          sessionStorage.setItem("loginUserId", String(u.userId));
          sessionStorage.setItem("loginUserEmail", u.email || "");

          didNavigate = true;
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

  document.addEventListener("click", async (e) => {
    const logoutA = e.target.closest(".profile-link.logout");
    if (logoutA) {
      e.preventDefault();
      await appLogout();
    }
  });

  (function wireHeaderMenu() {
    const profileIconBtn = $("#profile-icon-btn");
    const profileDropdown = $("#profile-dropdown");
    if (!profileIconBtn || !profileDropdown) {
        console.warn("Profile icon or dropdown not found in the DOM.");
        return;
    }
    profileIconBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isExpanded = profileIconBtn.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        profileDropdown.setAttribute("hidden", "");
        profileDropdown.classList.remove("show");
        profileIconBtn.setAttribute("aria-expanded", "false");
      } else {
        profileDropdown.removeAttribute("hidden");
        profileDropdown.classList.add("show");
        profileIconBtn.setAttribute("aria-expanded", "true");
      }
    });
    document.addEventListener("click", (e) => {
        const isClickInside = profileDropdown.contains(e.target) || profileIconBtn.contains(e.target);
        if (!isClickInside) {
            profileDropdown.setAttribute("hidden", "");
            profileDropdown.classList.remove("show");
            profileIconBtn.setAttribute("aria-expanded", "false");
        }
    });
  })();

  if (!isLogin) {
    await ensureAuthenticated(msalInstance);
  }
  
  // Find all navigation links and content sections
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.card');

// Function to fetch and display personal information
async function loadPersonalInfo() {
  try {
    // Fetch the JSON file
    const response = await fetch('personal_info.json');

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON data
    const data = await response.json();

    // Display the first user's information as an example
    if (data.personalInfo && data.personalInfo.length > 0) {
      const user = data.personalInfo[0]; 

      // Update the content of the existing HTML elements
      document.getElementById('user-name').textContent = user.name;
      document.getElementById('user-birthday').textContent = user.birthday;
      document.getElementById('user-gender').textContent = user.gender;
      document.getElementById('user-contact').textContent = user.contactInfo;
    } else {
      // Clear the content if no data is found
      document.getElementById('user-name').textContent = '';
      document.getElementById('user-birthday').textContent = '';
      document.getElementById('user-gender').textContent = '';
      document.getElementById('user-contact').textContent = '';
    }

  } catch (error) {
    console.error('Error loading personal information:', error);
  }
}

  // Main function to show the correct section and highlight the active link
  function showSection(sectionId) {
    sections.forEach(section => section.classList.add('hidden'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[id="${sectionId.replace('-section', '-link')}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  // Add click event listeners to navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const targetId = this.id.replace('-link', '-section');
      showSection(targetId);
      // Load user data only if the personal info section is being shown
      if (targetId === 'personal-info-section') {
        loadPersonalInfo();
      }
    });
  });

  // Set the default view on page load
  showSection('home-section');
  
  if (isLanding || isManageAccount) {
    await updateProfileUI(msalInstance);
}

});