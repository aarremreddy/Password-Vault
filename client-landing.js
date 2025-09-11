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

// ----- page chrome (menus/dropdowns) -----
document.addEventListener("DOMContentLoaded", () => {
  const navDropdownBtns = document.querySelectorAll(".nav-item-header");
  const tableDropdownBtns = document.querySelectorAll(".table-dropdown-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const gearBtn = document.getElementById("gear-btn");

  function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-content.open").forEach((d) => {
      d.classList.remove("open");
      const btn = d.closest("li")?.querySelector(".dropdown-btn");
      if (btn) btn.classList.remove("rotated");
    });
    if (profileDropdown) profileDropdown.classList.remove("show");
  }

  navDropdownBtns.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const li = btn.closest("li");
      const dd = li?.querySelector(".dropdown-content");
      const isOpen = dd?.classList.contains("open");
      closeAllDropdowns();
      if (dd && !isOpen) {
        dd.classList.add("open");
        btn.querySelector(".dropdown-btn")?.classList.add("rotated");
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
});

// ----- client-only table -----
(function () {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchName");
  const perPageSel = document.getElementById("perPage");
  const tbody = document.getElementById("tbody");
  const pager = document.getElementById("pager");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const resultMeta = document.getElementById("resultMeta");

  if (!tbody) return;

  let ALL = []; // all services from data.json
  let MINE = []; // services for this user only
  let VIEW = []; // filtered view (search within mine)
  let currentPage = 1;
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

    const pageItems = paginate(VIEW, currentPage, perPage);
    tbody.innerHTML = pageItems
      .map((row) => {
        const urlLabel = row.url ? row.url.replace(/^https?:\/\//, "") : "";
        const keywords = Array.isArray(row.keywords)
          ? row.keywords
              .map((k) => `<span class="tag">${escapeHtml(k)}</span>`)
              .join(" ")
          : "";
        return `
          <tr>
            <td class="mono">${escapeHtml(row.userId)}</td>
            <td>${escapeHtml(row.serviceName || "-")}</td>
            <td>${
              row.url
                ? `<a href="${escapeAttr(
                    row.url
                  )}" target="_blank" rel="noopener">${escapeHtml(
                    urlLabel
                  )}</a>`
                : "-"
            }</td>
            <td class="mono">${escapeHtml(
              row.login || row.userName || "-"
            )}</td>
            <td>
              <div class="pw">
                <input type="password" value="${escapeAttr(row.password || "")}"
                       readonly style="width:180px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;" />
                <button class="icon-btn" title="Show/Hide" aria-label="Toggle password" data-eye>👁️</button>
              </div>
            </td>
            <td>${keywords || "-"}</td>
          </tr>`;
      })
      .join("");

    // Show/Hide password
    tbody.querySelectorAll("[data-eye]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        input.type = input.type === "password" ? "text" : "password";
      });
    });

    pager.hidden = false;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  function applyFilter(q) {
    const t = norm(q);
    VIEW = t
      ? MINE.filter((r) =>
          [
            r.userId,
            r.serviceName,
            r.url,
            r.login || r.userName,
            r.password,
            ...(r.keywords || []),
          ]
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
    const fromSessionName = sessionStorage.getItem("loginUser"); // e.g., "Alice Smith"
    let emailFromMsal = null;

    // If MSAL is available and an account exists, prefer that email
    try {
      if (window.msal && typeof msal.PublicClientApplication === "function") {
        // If you're using auth.js elsewhere, the active account may already be set
        const app = new msal.PublicClientApplication({
          auth: { clientId: "dummy" },
        }); // safe no-op
        const acct =
          app.getActiveAccount?.() || (app.getAllAccounts?.() || [])[0];
        emailFromMsal = acct?.username || null;
      }
    } catch {
      /* ignore - msal optional here */
    }

    // Try to find the matching user in your usersInfo by (1) exact userId, (2) email, (3) name contains
    const users = meta?.usersInfo?.users || [];
    if (fromSessionId) {
      const hit = users.find((u) => String(u.userId) === String(fromSessionId));
      if (hit)
        return {
          userId: String(hit.userId),
          email: hit.email,
          name: hit.userName,
        };
    }
    if (emailFromMsal) {
      const hit = users.find((u) => norm(u.email) === norm(emailFromMsal));
      if (hit)
        return {
          userId: String(hit.userId),
          email: hit.email,
          name: hit.userName,
        };
    }
    if (fromSessionName) {
      const hit = users.find((u) =>
        norm(u.userName).includes(norm(fromSessionName))
      );
      if (hit)
        return {
          userId: String(hit.userId),
          email: hit.email,
          name: hit.userName,
        };
    }
    return null;
  }

  async function boot() {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load data.json (${res.status})`);
      const data = await res.json(); // has usersInfo + userCredentials
      // Normalize all credentials
      const raw =
        data?.userCredentials?.userCredentialsInfo ??
        data?.records ??
        data ??
        [];
      ALL = (Array.isArray(raw) ? raw : []).map((r) => ({
        userId: String(r.userId || "").trim(),
        serviceName: String(r.serviceName || "").trim(),
        url: String(r.URL || "").trim(),
        login: String(r.userName || "").trim(),
        password: String(r.password || "").trim(),
        keywords: Array.isArray(r.keywords) ? r.keywords : [],
      }));

      const active = await resolveActiveUser(data);
      if (!active || !active.userId) {
        // No login? back to login page
        window.location.href = "login.html";
        return;
      }

      // Filter to this user's services only
      MINE = ALL.filter((r) => String(r.userId) === String(active.userId));

      // Show their name in the profile header, if present
      const ph = document.querySelector(".profile-header p");
      if (ph && active.name) ph.textContent = `Hi, ${active.name}!`;

      // Initial render (search inside user's own services)
      applyFilter(searchInput?.value || "");
    } catch (err) {
      console.error(err);
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty">Could not load data.json</td></tr>';
      pager.hidden = true;
    }
  }

  // wire UI
  searchBtn?.addEventListener("click", () => applyFilter(searchInput.value));
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilter(searchInput.value);
  });
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

  document.addEventListener("DOMContentLoaded", boot);
})();
