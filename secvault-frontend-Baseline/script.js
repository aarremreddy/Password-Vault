// script.js
import { initMSAL } from "./auth.js";

const page = location.pathname.split("/").pop().toLowerCase();
const isLogin = page === "" || page === "index.html" || page === "login.html";
const isLanding = page === "landing.html";
const isClientLanding = page === "client-landing.html";
const isAdmin = page === "admin.html";
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

/* ---------- Map Microsoft email to internal user and check for admin ---------- */
async function getLoginInfoFromMSAL() {
    const email = (sessionStorage.getItem("loginUserEmail") || "").toLowerCase();
    if (!email) return false;

    // First, check if the email belongs to an admin
    try {
        const adminRes = await fetch("admincreds.json", { cache: "no-store" });
        if (adminRes.ok) {
            const adminData = await adminRes.json();
            const admins = adminData?.usersInfo?.users || [];
            const adminFound = admins.find(u => String(u.email || "").toLowerCase() === email);
            if (adminFound) {
                sessionStorage.setItem("loginUserRole", "admin");
                sessionStorage.setItem("loginMethod", "microsoft");
                return true;
            }
        }
    } catch (err) {
        console.error("Error fetching admin data:", err);
    }

    // If not an admin, check against the regular user data
    try {
        const userRes = await fetch("usersdata.json", { cache: "no-store" });
        if (userRes.ok) {
            const userData = await userRes.json();
            const users = userData?.usersInfo?.users || [];
            const userFound = users.find(u => String(u.email || "").toLowerCase() === email);
            if (userFound) {
                sessionStorage.setItem("loginUserRole", "user");
                sessionStorage.setItem("loginUserId", String(userFound.userId));
                sessionStorage.setItem("loginUser", userFound.userName || email);
                sessionStorage.setItem("loginMethod", "microsoft");
                return true;
            }
        }
    } catch (err) {
        console.error("Error fetching user data:", err);
    }

    return false;
}

/* ---------- Auth gate ---------- */
async function ensureAuthenticated(msalInstance) {
    const active =
        msalInstance?.getActiveAccount?.() ||
        (msalInstance?.getAllAccounts?.() || [])[0];
    const hasAppSession =
        !!sessionStorage.getItem("loginUser") ||
        !!sessionStorage.getItem("loginUserEmail") ||
        !!sessionStorage.getItem("loginUserId") ||
        !!sessionStorage.getItem("loginUserRole");

    if (active || hasAppSession) return true;

    try {
        const mapped = await getLoginInfoFromMSAL();
        if (mapped) return true;
    } catch { }

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
    const loginMethod = sessionStorage.getItem("loginMethod");
    sessionStorage.clear();

    if (loginMethod === "microsoft") {
        try {
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
            const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;
            location.assign(url);
        } catch (e) {
            console.error("Microsoft logout error:", e);
            location.replace("login.html");
        }
    } else {
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
    } catch { }

    // Now check usersdata.json for the display name
    try {
        const r = await fetch("usersdata.json", { cache: "no-store" });
        if (r.ok) {
            const d = await r.json();
            const email = (sessionStorage.getItem("loginUserEmail") || "").toLowerCase();
            if (email && Array.isArray(d?.usersInfo?.users)) {
                const m = d.usersInfo.users.find((u) => String(u.email || "").toLowerCase() === email);
                if (m?.userName) return m.userName;
            }
        }
    } catch { }

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

//---------- Update profile UI ----------
async function updateProfileUI(msalInstance) {
    try {
        const displayName = await resolveDisplayName(msalInstance);

        // This is the element inside the profile dropdown that currently says "Hi, Member!"
        const profileWelcomeMsgEl = document.querySelector("#profile-dropdown .profile-header p");

        if (displayName) {
            // Update the name in the profile dropdown
            if (profileWelcomeMsgEl) {
                // Use innerHTML to update the span inside the p tag
                profileWelcomeMsgEl.innerHTML = `Hi, <span id="profile-name">${displayName}</span>!`;
            }

            // Update the avatar initial
            const profileAvatarEl = document.querySelector("#profile-dropdown .profile-avatar");
            if (profileAvatarEl) {
                profileAvatarEl.textContent = displayName.charAt(0).toUpperCase();
            }
        }

        // Additional profile updates (Manage Account sidebar links/icons)
        // This is necessary because the Manage Account page uses a different sidebar structure
        if (isManageAccount) {
            const manageAccountAvatar = document.querySelector(".site-nav .profile-avatar");
            if (manageAccountAvatar && displayName) {
                manageAccountAvatar.textContent = displayName.charAt(0).toUpperCase();
            }

            // Highlight the correct initial link
            const homeLink = document.getElementById('home-link');
            if (homeLink) {
                homeLink.classList.add('active'); // Set 'Home' as the default active link
            }
        }

    } catch (e) {
        console.warn("Could not update profile UI:", e);
    }
}

function applyWelcomeName(name) {
    if (!name) return;
    const welcomeEl = document.getElementById("welcomeMsg");
    if (welcomeEl) welcomeEl.textContent = `Welcome ${name}!`;

    const profileHeader = document.querySelector(".profile-header p");
    if (profileHeader && profileHeader.textContent?.startsWith("Hi,")) {
        profileHeader.textContent = `Hi, ${name}!`;
    }
}

/* ---------- Akruth's admin page functionality ---------- */
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
let userStatusFilterValue = 'all';

function loadUsersTable() {
    fetch('admindata.json')
        .then(response => response.json())
        .then(data => {
            allUsers = data.usersInfo.users;
            allUsers.sort((a, b) => {
                const nameA = a.userName.toUpperCase();
                const nameB = b.userName.toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            filteredUsers = [...allUsers];
            renderTable();
            renderPagination();
        })
        .catch(error => console.error('Error fetching user data:', error));
}

function renderTable() {
    const tableContainer = document.getElementById('users-table-container');
    if (!tableContainer) return; // Add null check
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToDisplay = filteredUsers.slice(startIndex, endIndex);

    // CRITICAL FIX: Ensure table has the class for shared styling
    let tableHTML = '<table class="users-table"><thead><tr><th>User Name</th><th>User ID</th><th>Email</th><th>Total Credentials</th><th>Active Credentials</th><th>Inactive Credentials</th><th>User Status</th></tr></thead><tbody>';

    usersToDisplay.forEach(user => {
        tableHTML += `
      <tr>
        <td>${user.userName}</td>
        <td>${user.userID}</td>
        <td>${user.email}</td>
        <td>${user.totalnumOfCredentials}</td>
        <td>${user.activeCredentialsCount}</td>
        <td>${user.inactiveCredentialsCount}</td>
        <td>${user.userStatus}</td>
      </tr>
    `;
    });

    tableHTML += '</tbody></table>';
    tableContainer.innerHTML = tableHTML;

    const userStatusHeader = tableContainer.querySelector('th:last-child');
    if (userStatusHeader) {
        userStatusHeader.textContent = '';
        const headerText = document.createElement('span');
        headerText.textContent = 'User Status';
        headerText.style.marginRight = '10px';
        const filterSelect = document.createElement('select');
        filterSelect.id = 'userStatusFilter';
        filterSelect.classList.add('user-status-filter');
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All';
        filterSelect.appendChild(allOption);
        const activeOption = document.createElement('option');
        activeOption.value = 'Active';
        activeOption.textContent = 'Active';
        filterSelect.appendChild(activeOption);
        const inactiveOption = document.createElement('option');
        inactiveOption.value = 'Inactive';
        inactiveOption.textContent = 'Inactive';
        filterSelect.appendChild(inactiveOption);
        userStatusHeader.appendChild(headerText);
        userStatusHeader.appendChild(filterSelect);
        filterSelect.value = userStatusFilterValue;
        filterSelect.addEventListener('change', handleSearchAndFilter);
    }
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return; // Add null check
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1 && filteredUsers.length <= usersPerPage) {
        paginationContainer.style.display = 'none';
        return;
    }
    paginationContainer.style.display = 'flex';

    const pageInfo = document.createElement('span');
    const startItem = (currentPage - 1) * usersPerPage + 1;
    const endItem = Math.min(currentPage * usersPerPage, filteredUsers.length);
    pageInfo.innerText = `${startItem}-${endItem} of ${filteredUsers.length} items`;
    pageInfo.classList.add('page-info');
    paginationContainer.appendChild(pageInfo);

    const firstPageBtn = document.createElement('button');
    firstPageBtn.innerText = '<<';
    firstPageBtn.classList.add('page-btn', 'prev-next-btn', 'first-last-btn');
    if (currentPage === 1) {
        firstPageBtn.disabled = true;
        firstPageBtn.classList.add('disabled');
    }
    firstPageBtn.addEventListener('click', () => {
        currentPage = 1;
        renderTable();
        renderPagination();
    });
    paginationContainer.appendChild(firstPageBtn);

    const prevBtn = document.createElement('button');
    prevBtn.innerText = '<';
    prevBtn.classList.add('page-btn', 'prev-next-btn');
    if (currentPage === 1) {
        prevBtn.disabled = true;
        prevBtn.classList.add('disabled');
    }
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            renderPagination();
        }
    });
    paginationContainer.appendChild(prevBtn);

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i;
        pageBtn.classList.add('page-btn');
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
            renderPagination();
        });
        paginationContainer.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.innerText = '>';
    nextBtn.classList.add('page-btn', 'prev-next-btn');
    if (currentPage === totalPages) {
        nextBtn.disabled = true;
        nextBtn.classList.add('disabled');
    }
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            renderPagination();
        }
    });
    paginationContainer.appendChild(nextBtn);

    const lastPageBtn = document.createElement('button');
    lastPageBtn.innerText = '>>';
    lastPageBtn.classList.add('page-btn', 'prev-next-btn', 'first-last-btn');
    if (currentPage === totalPages) {
        lastPageBtn.disabled = true;
        lastPageBtn.classList.add('disabled');
    }
    lastPageBtn.addEventListener('click', () => {
        currentPage = totalPages;
        renderTable();
        renderPagination();
    });
    paginationContainer.appendChild(lastPageBtn);

    const itemsPerPageContainer = document.createElement('div');
    itemsPerPageContainer.classList.add('items-per-page-container');
    const itemsPerPageSelect = document.createElement('select');
    itemsPerPageSelect.classList.add('items-per-page-select');
    [5, 10, 20, 50].forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.innerText = option;
        if (option === usersPerPage) {
            opt.selected = true;
        }
        itemsPerPageSelect.appendChild(opt);
    });

    itemsPerPageSelect.addEventListener('change', (e) => {
        usersPerPage = Number(e.target.value);
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    itemsPerPageContainer.appendChild(itemsPerPageSelect);
    const itemsPerPageLabel = document.createElement('span');
    itemsPerPageLabel.innerText = 'items per page';
    itemsPerPageLabel.classList.add('items-per-page-label');
    itemsPerPageContainer.appendChild(itemsPerPageLabel);
    paginationContainer.appendChild(itemsPerPageContainer);
}

function handleSearchAndFilter() {
    const query = searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('userStatusFilter');
    userStatusFilterValue = statusFilter.value;
    let tempUsers = [...allUsers];

    if (query) {
        tempUsers = tempUsers.filter(user => {
            const nameParts = user.userName.toLowerCase().split(' ');
            return nameParts.some(part => part.startsWith(query));
        });
    }

    if (userStatusFilterValue !== 'all') {
        tempUsers = tempUsers.filter(user => user.userStatus === userStatusFilterValue);
    }

    filteredUsers = tempUsers;
    currentPage = 1;
    renderTable();
    renderPagination();
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
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
                    showAlert(
                        "Microsoft login is not configured. Check console and config.json."
                    );
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
                sessionStorage.setItem(
                    "loginUser",
                    redirectResponse.account.name ||
                    redirectResponse.account.username ||
                    ""
                );
                sessionStorage.setItem(
                    "loginUserEmail",
                    redirectResponse.account.username || ""
                );

                const authorized = await getLoginInfoFromMSAL();

                if (authorized) {
                    const role = sessionStorage.getItem("loginUserRole");
                    if (role === "admin") {
                        location.replace("admin.html");
                    } else {
                        location.replace("landing.html");
                    }
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
                    const adminRes = await fetch("admincreds.json", { cache: "no-store" });
                    if (!adminRes.ok) throw new Error(`admincreds.json HTTP ${adminRes.status}`);
                    const { usersInfo: { users: admins = [] } = {} } = await adminRes.json();
                    const adminUser = admins.find(
                        (x) => x.userName === username && x.password === password
                    );

                    if (adminUser) {
                        sessionStorage.setItem("loginUser", adminUser.userName);
                        sessionStorage.setItem("loginUserRole", "admin");
                        sessionStorage.setItem("loginMethod", "local");
                        didNavigate = true;
                        location.replace("admin.html");
                        return;
                    }

                    const userRes = await fetch("users.json", { cache: "no-store" });
                    if (!userRes.ok) throw new Error(`users.json HTTP ${userRes.status}`);
                    const { users = [] } = await userRes.json();
                    const regularUser = users.find(
                        (x) => x.username === username && x.password === password
                    );

                    if (regularUser) {
                        sessionStorage.setItem("loginUser", regularUser.username);
                        sessionStorage.setItem("loginUserId", String(regularUser.userId));
                        sessionStorage.setItem("loginUserRole", "user");
                        sessionStorage.setItem("loginMethod", "local");
                        didNavigate = true;
                        location.replace("landing.html");
                    } else {
                        showAlert("Invalid username or password");
                    }

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
        const logoutA = e.target.closest(".logout-link");
        if (logoutA) {
            e.preventDefault();
            await appLogout();
        }
    });

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
            const isOpen =
                profileDropdown.classList.contains("show") &&
                !profileDropdown.hasAttribute("hidden");
            if (isOpen) close();
            else open();
        });
        closeBtn?.addEventListener("click", close);
        document.addEventListener("click", (e) => {
            if (
                profileDropdown &&
                !profileDropdown.contains(e.target) &&
                e.target !== gearBtn
            )
                close();
        });
    })();

    // Auth gate for non-login pages
    if (!isLogin) {
        await ensureAuthenticated(msalInstance);
    }

    // Dynamic welcome for landing pages
    if (isLanding || isClientLanding) {
        try {
            const name = await resolveDisplayName(msalInstance);
            if (name) applyWelcomeName(name);
        } catch (e) {
            console.warn("Could not resolve display name:", e);
        }
    }

    // CRITICAL FIX FOR MANAGE ACCOUNT PAGE: Ensure profile UI updates after auth
    if (!isLogin) {
        await updateProfileUI(msalInstance);
    }


    if (isAdmin) {
        loadUsersTable();
    }
});

//gearbox-personlinfo
// Find all navigation links and content sections
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.card');

// Function to fetch and display personal information
async function loadPersonalInfo() {
    // This function will need to be updated to fetch data for the *logged-in* user,
    // not just the first user in a static file.

    const activeUserId = sessionStorage.getItem("loginUserId");

    if (!activeUserId) {
        console.warn("Cannot load personal info: User ID not found.");
        return;
    }

    try {
        // Fetch usersdata.json (assuming personal info is nested here)
        const response = await fetch('usersdata.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Find the specific user's personal info
        const users = data?.usersInfo?.users || [];
        const user = users.find(u => String(u.userId) === activeUserId);

        // This is where you would look for a separate personalInfo array if it existed
        // For now, we use the user details from usersInfo/users

        if (user) {
            // Update the content of the existing HTML elements
            document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;
            // NOTE: Birthday, Gender, etc., are missing from the usersdata.json structure you provided, 
            // so these will remain blank until you update your JSON source.
            document.getElementById('user-email').textContent = user.email;
        }
        // ... (rest of the error handling and loading logic) ...

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
    link.addEventListener('click', function (event) {
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