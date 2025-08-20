// === Microsoft OAuth + Local Admin Guard ===
const clientId = "3e86aad7-3817-47f1-b455-9044395ac442";
const tenantId = "42378c32-6188-4ed7-a9e6-437421b2960c";
const redirectUri = "http://localhost:8080/login.html"; // must match Entra SPA

const msalInstance = new msal.PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri
  },
  cache: { cacheLocation: "localStorage" }
});

(async () => {
  await msalInstance.initialize();

  // 1) If signed in with Microsoft, let them in (you can add role checks later via Graph/claims)
  const account = msalInstance.getAllAccounts()[0];

  if (account) {
    msalInstance.setActiveAccount(account);
    document.getElementById("welcome").textContent =
      `Welcome, ${account.name || account.username}`;
  } else {
    // 2) Else require local admin login
    const localLogin = sessionStorage.getItem("localLogin") === "true";
    const role = sessionStorage.getItem("role");
    if (!(localLogin && role === "admin")) {
      // not an admin → send to normal login
      window.location.href = "login.html";
      return;
    }
    const localUser = sessionStorage.getItem("localUser") || "admin";
    document.getElementById("welcome").textContent = `Welcome, ${localUser} (admin)`;
  }

  // Logout button clears local flags and logs out of Microsoft if needed
  document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem("localLogin");
    sessionStorage.removeItem("localUser");
    sessionStorage.removeItem("role");

    if (account) {
      msalInstance.logoutRedirect({ postLogoutRedirectUri: redirectUri });
    } else {
      window.location.href = "login.html";
    }
  });
})();

// === Dropdown menu logic (same pattern as landing.js) ===
const dropdownBtns = document.querySelectorAll(".dropdown-btn");
dropdownBtns.forEach((btn) => {
  btn.addEventListener("click", function (e) {
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
