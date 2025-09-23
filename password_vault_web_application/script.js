document.addEventListener("DOMContentLoaded", function() {

  // login.js - Handles the form submission on the login page
  const loginForm = document.getElementById("loginForm");
  const alertWindow = document.getElementById("alertWindow");
  const errorMessage = document.getElementById("errorMessage");
  const closealertBtn = document.querySelector("#alertWindow .close-btn");
  const okBtn = document.getElementById("okBtn");
  
  // Function to show the alert with a specific message
  function showalert(message) {
    errorMessage.textContent = message;
    alertWindow.style.display = "block";
  }

  // Function to hide the alert
  function hidealert() {
    alertWindow.style.display = "none";
  }

  // Close the alert when the close button is clicked
  if (closealertBtn) {
    closealertBtn.addEventListener("click", hidealert);
  }

  // Close the alert when the OK button is clicked
  if (okBtn) {
    okBtn.addEventListener("click", hidealert);
  }

  // Close the alert if the user clicks anywhere outside of it
  window.addEventListener("click", function(event) {
    if (event.target === alertWindow) {
      hidealert();
    }
  });


  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();

      const username = document.getElementById("username").value.toLowerCase();
      const password = document.getElementById("password").value;

      // logic to fetch and validate credentials from JSON file
      fetch('admin-data.json')
        .then(response => response.json())
        .then(data => {
          const users = data.usersInfo.users;
          const userFound = users.find(user => 
            user.userName.toLowerCase() === username && user.password === password
          );

          if (userFound) {
            window.location.href = "admin.html";
          } else {
            showalert("Invalid username or password");
          }
        })
        .catch(error => {
          console.error('Error fetching admin data:', error);
          showalert("Login failed. Please try again later.");
        });
    });
  }

  // Common selectors for all dropdowns
  const navDropdownBtns = document.querySelectorAll(".nav-item-header");
  const tableDropdownBtns = document.querySelectorAll(".table-dropdown-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const gearBtn = document.getElementById("gear-btn");

  // for closing drop down
  function closeAllDropdowns() {
    // navigation dropdowns
    document.querySelectorAll(".dropdown-content.open").forEach(dropdown => {
      dropdown.classList.remove("open");
      const btn = dropdown.closest("li").querySelector(".dropdown-btn");
      if (btn) btn.classList.remove("rotated");
    });
    
    // for  profile dropdown
    if (profileDropdown) {
      profileDropdown.classList.remove("show");
    }
  }

  // Logic for the navigation dropdowns
  navDropdownBtns.forEach((btn) => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      const parentListItem = btn.closest("li");
      const dropdown = parentListItem.querySelector(".dropdown-content");
      const dropdownIcon = btn.querySelector(".dropdown-btn");
      const isOpen = dropdown.classList.contains("open");
      
      closeAllDropdowns();
      
      if (!isOpen) {
        dropdown.classList.add("open");
        if (dropdownIcon) {
          dropdownIcon.classList.add("rotated");
        }
      }
    });
  });

  // Logic for the table dropdowns
  tableDropdownBtns.forEach((btn) => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      const dropdown = btn.nextElementSibling;
      const isOpen = dropdown.classList.contains("open");

      closeAllDropdowns();
      
      if (!isOpen) {
        dropdown.classList.add("open");
      }
    });
  });
  
  // Logic for the gear menu dropdown
  if (gearBtn) {
    gearBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      const isOpen = profileDropdown.classList.contains("show");
      
      closeAllDropdowns();

      if (!isOpen) {
        if (profileDropdown) {
          profileDropdown.classList.add("show");
        }
      }
    });
  }

  // Close all dropdowns, clicking anywhere on the page
  document.addEventListener("click", function() {
    closeAllDropdowns();
  });

  // code for pagination, sorting and search
  let allUsers = [];
  let filteredUsers = []; //array to hold filtered data
  let currentPage = 1;
  let usersPerPage = 10; // Default items per page
  
  // Add new selectors for search and filter elements
  const searchInput = document.querySelector('.search-input');
  const searchButton = document.querySelector('.search-button');
  
  // New variable to hold the filter value
  let userStatusFilterValue = 'all';

  function loadUsersTable() {
    fetch('data.json')
      .then(response => response.json())
      .then(data => {
        allUsers = data.usersInfo.users;
        
        // Sort the users alphabetically by userName
        allUsers.sort((a, b) => {
          const nameA = a.userName.toUpperCase(); 
          const nameB = b.userName.toUpperCase(); 
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });

        filteredUsers = [...allUsers]; // Initialize filteredUsers with the sorted data
        
        renderTable();
        renderPagination();
      })
      .catch(error => console.error('Error fetching user data:', error));
  }

  function renderTable() {
    const tableContainer = document.getElementById('users-table-container');
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToDisplay = filteredUsers.slice(startIndex, endIndex); // Use filteredUsers

    let tableHTML = '<table><thead><tr><th>User Name</th><th>User ID</th><th>Email</th><th>Total Credentials</th><th>Active Credentials</th><th>Inactive Credentials</th><th>User Status</th></tr></thead><tbody>';

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

    // Dynamically create and add the filter dropdown to the header
    const userStatusHeader = tableContainer.querySelector('th:last-child');
    if (userStatusHeader) {
        // Clear the existing text content
        userStatusHeader.textContent = '';
        
        // Create a new container for the text and dropdown to align them
        const headerText = document.createElement('span');
        headerText.textContent = 'User Status';
        headerText.style.marginRight = '10px';
        
        // Create the select dropdown
        const filterSelect = document.createElement('select');
        filterSelect.id = 'userStatusFilter';
        filterSelect.classList.add('user-status-filter');
        
        // Populate the options
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

        // Append the elements to the table header
        userStatusHeader.appendChild(headerText);
        userStatusHeader.appendChild(filterSelect);
        
        // Set the selected value to what it was before re-rendering
        filterSelect.value = userStatusFilterValue;
        
        // Re-attach the event listener
        filterSelect.addEventListener('change', handleSearchAndFilter);
    }
  }

  function renderPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage); // Use filteredUsers
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
  
  // New function to handle both search and filter
  function handleSearchAndFilter() {
    const query = searchInput.value.toLowerCase();
    const statusFilter = document.getElementById('userStatusFilter');
    
    // Update the global filter value variable
    userStatusFilterValue = statusFilter.value;
    
    // Start with the full list of users for filtering
    let tempUsers = [...allUsers];

    // Apply text search filter if a query exists
    if (query) {
        tempUsers = tempUsers.filter(user => {
            const nameParts = user.userName.toLowerCase().split(' ');
            return nameParts.some(part => part.startsWith(query));
        });
    }

    // Apply status filter based on the dropdown selection
    if (userStatusFilterValue !== 'all') {
        tempUsers = tempUsers.filter(user => user.userStatus === userStatusFilterValue);
    }

    filteredUsers = tempUsers;
    currentPage = 1; // Reset to the first page for new search/filter results
    renderTable();
    renderPagination();
  }

  // A simple debounce function to add a delay to the search and filter
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
  }
  
  // Add event listeners for search and filter
  if (searchInput) {
    const debouncedSearchAndFilter = debounce(handleSearchAndFilter, 200);
    searchInput.addEventListener('input', debouncedSearchAndFilter);
  }

  if (searchButton) {
    searchButton.addEventListener('click', handleSearchAndFilter);
  }

  // Call the function when the page loads
  if (window.location.pathname.endsWith('admin.html')) {
    loadUsersTable();
  }
});