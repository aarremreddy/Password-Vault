// client-landing.js — client sees ONLY their own subscriptions/passwords

// ----- tiny helpers -----
const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const escapeAttr = (s) => escapeHtml(s);
const norm = (v) => String(v ?? "").toLowerCase();
const paginate = (items, page, size) =>
  items.slice((page - 1) * size, (page - 1) * size + size);

// --- debounce helper (for smooth live search) ---
function debounce(func, delay = 200) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// ----- MAIN EXECUTION BLOCK (Consolidated) -----
document.addEventListener("DOMContentLoaded", () => {

  // ===================================
  // PAGE CHROME (Menus/Dropdowns)
  // ===================================
  const navDropdownBtns = document.querySelectorAll(".nav-item-header");
  const tableDropdownBtns = document.querySelectorAll(".table-dropdown-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const gearBtn = document.getElementById("gear-btn");

  function closeAllDropdowns() {
    document.querySelectorAll(".nav-item__dropdown.open").forEach((d) => {
      d.classList.remove("open");
      const btn = d.closest("li")?.querySelector(".nav-item__dropdown-btn");
      if (btn) btn.classList.remove("nav-item__dropdown-btn--rotated");
    });
    if (profileDropdown) profileDropdown.classList.remove("show");
  }

  navDropdownBtns.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const li = btn.closest("li");
      // NOTE: Adjusted class names for dropdowns/buttons based on your Admin HTML
      const dd = li?.querySelector(".nav-item__dropdown");
      const icon = btn.querySelector(".nav-item__dropdown-btn");
      const isOpen = dd?.classList.contains("open");
      closeAllDropdowns();
      if (dd && !isOpen) {
        dd.classList.add("open");
        icon?.classList.add("nav-item__dropdown-btn--rotated");
      }
    })
  );

  tableDropdownBtns.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dd = btn.nextElementSibling;
      const isOpen = dd?.classList.contains("open");
      closeAllDropdowns();
      if (dd && !isOpen) dd.classList.add("open");
    })
  );

  if (gearBtn) {
    gearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = profileDropdown?.classList.contains("show");
      closeAllDropdowns();
      if (!isOpen && profileDropdown) profileDropdown.classList.add("show");
    });
  }

  document.addEventListener("click", closeAllDropdowns);


  // ===================================
  // CLIENT-ONLY TABLE LOGIC
  // CRITICAL: All DOM elements are safe to query now.
  // ===================================

  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchName");
  const perPageSel = document.getElementById("perPage");
  const tbody = document.getElementById("tbody");
  const pager = document.getElementById("pager");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const resultMeta = document.getElementById("resultMeta");

  // If the required table elements aren't here (e.g., if we are on landing.html), stop cleanly.
  if (!tbody || !searchInput) return;

  let ALL = [];
  let MINE = [];
  let VIEW = [];
  let currentPage = 1;
  // Set initial perPage value from the select element
  let perPage = parseInt(perPageSel?.value || "10", 10) || 10;

  function render() {
    const total = VIEW.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    currentPage = Math.min(currentPage, totalPages);

    resultMeta.textContent = total
      ? `${total} service${total === 1 ? "" : "s"}`
      : "";

    if (!total) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty">No results.</td></tr>';
      pager.hidden = true;
      return;
    }

    // --- Sorting Logic (Safe to run inside DCL) ---
    let currentSort = { key: null, asc: true };
    function sortData(key) {
      currentSort.asc = currentSort.key === key ? !currentSort.asc : true;
      currentSort.key = key;
      VIEW.sort((a, b) => {
        const va = (a[key] || "").toLowerCase();
        const vb = (b[key] || "").toLowerCase();
        if (va < vb) return currentSort.asc ? -1 : 1;
        if (va > vb) return currentSort.asc ? 1 : -1;
        return 0;
      });
      render();
    }
    document.querySelectorAll("#dataTable th[data-sort]").forEach((th) => {
      // Re-clone/re-bind event listeners safely
      th.replaceWith(th.cloneNode(true));
    });
    document.querySelectorAll("#dataTable th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => sortData(th.dataset.sort));
    });

    // --- Render Rows ---
    const pageItems = paginate(VIEW, currentPage, perPage);
    tbody.innerHTML = pageItems
      .map((row) => {
        const urlLabel = row.url ? row.url.replace(/^https?:\/\//, "") : "";
        return `
                <tr>
                    <td>${escapeHtml(row.serviceName || "-")}</td>
                    <td>${row.url
            ? `<a href="${escapeAttr(row.url)}" target="_blank" rel="noopener">${escapeHtml(urlLabel)}</a>`
            : "-"
          }</td>
                    <td class="mono">${escapeHtml(row.login || row.userName || "-")}</td>
                    <td>
                        <div class="pw">
                            <input type="password" value="${escapeAttr(row.password || "")}" readonly />
                            <button class="icon-btn" title="Show/Hide" aria-label="Toggle password" data-eye>👁️</button>
                            <button class="icon-btn" title="Copy" aria-label="Copy password" data-copy>📋</button>
                        </div>
                    </td>
                </tr>`;
      })
      .join("");

    // --- Bind Password Actions ---
    tbody.querySelectorAll("[data-eye]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        input.type = input.type === "password" ? "text" : "password";
      });
    });

    tbody.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        navigator.clipboard
          .writeText(input.value)
          .then(() => alert("Password copied!"))
          .catch(() => alert("Copy failed"));
      });
    });

    // --- Render Pager ---
    pager.hidden = false;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  function applyFilter(q) {
    const t = norm(q);
    VIEW = t
      ? MINE.filter((r) =>
        [r.serviceName, r.url, r.login || r.userName, r.password]
          .map(norm)
          .some((h) => h.includes(t))
      )
      : MINE.slice();
    currentPage = 1;
    render();
  }

  // Determine who is logged in → return { userId, email, name }
  async function resolveActiveUser(meta) {
    const fromSessionId = sessionStorage.getItem("loginUserId");
    const fromSessionName = sessionStorage.getItem("loginUser");
    let emailFromMsal = null;

    try {
      // Dummy initialization just to check for active account
      if (window.msal && typeof msal.PublicClientApplication === "function") {
        const app = new msal.PublicClientApplication({ auth: { clientId: "dummy" } });
        const acct = app.getActiveAccount?.() || (app.getAllAccounts?.() || [])[0];
        emailFromMsal = acct?.username || null;
      }
    } catch { /* ignore - msal optional here */ }

    const users = meta?.usersInfo?.users || [];
    // Match 1: Session ID (Local Login)
    if (fromSessionId) {
      const hit = users.find((u) => String(u.userId) === String(fromSessionId));
      if (hit) return { userId: String(hit.userId), email: hit.email, name: hit.userName };
    }
    // Match 2: MSAL Email (Microsoft Login)
    if (emailFromMsal) {
      const hit = users.find((u) => norm(u.email) === norm(emailFromMsal));
      if (hit) return { userId: String(hit.userId), email: hit.email, name: hit.userName };
    }
    // Match 3: Session Name (Fallback)
    if (fromSessionName) {
      const hit = users.find((u) => norm(u.userName).includes(norm(fromSessionName)));
      if (hit) return { userId: String(hit.userId), email: hit.email, name: hit.userName };
    }
    return null;
  }

  async function boot() {
    try {
      const res = await fetch("usersdata.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load usersdata.json (${res.status})`);
      const data = await res.json();

      // Normalize all credentials (Adjusted property access for robustness)
      const raw =
        data?.userCredentials?.userCredentialsInfo ??
        [];

      ALL = (Array.isArray(raw) ? raw : []).map((r) => ({
        userId: String(r.userId || "").trim(),
        serviceName: String(r.serviceName || "").trim(),
        url: String(r.URL || "").trim(),
        login: String(r.userName || "").trim(),
        password: String(r.password || "").trim(),
      }));

      const active = await resolveActiveUser(data);
      if (!active || !active.userId) {
        // No login? back to login page (should be caught by main script.js)
        return;
      }

      // Filter to this user's services only
      MINE = ALL.filter((r) => String(r.userId) === String(active.userId));

      // Show their name in the profile header (assuming this is only for client page)
      const profileHeader = document.querySelector(".profile-header p");
      const profileAvatar = document.querySelector(".profile-avatar");

      if (active && active.name) {
        profileHeader.textContent = `Hi, ${active.name}!`;
        const initial = active.name.trim().charAt(0).toUpperCase();
        profileAvatar.textContent = initial;
      }

      // First render: Apply filter (which calls render)
      applyFilter(searchInput?.value || "");
    } catch (err) {
      console.error("Client-Landing Boot Error:", err);
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty">Could not load services data.</td></tr>';
      pager.hidden = true;
    }
  }

  // ---------- Event Listeners ----------
  const handleSearch = () => applyFilter(searchInput.value);
  const debouncedSearch = debounce(handleSearch, 200);

  searchInput?.addEventListener("input", debouncedSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  });
  searchBtn?.addEventListener("click", handleSearch);

  perPageSel?.addEventListener("change", () => {
    perPage = parseInt(perPageSel.value, 10) || 10;
    currentPage = 1;
    render();
  });
  prevBtn?.addEventListener("click", () => {
    currentPage = Math.max(1, currentPage - 1);
    render();
  });
  nextBtn?.addEventListener("click", () => {
    currentPage = currentPage + 1;
    render();
  });

  // Finally, run the boot sequence!
  boot();
});