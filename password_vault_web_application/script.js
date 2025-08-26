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

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (
        (username === "akruth" && password === "1234") ||
        (username === "akshith" && password === "1234")
      ) {
        window.location.href = "landing.html";
      } else if (username === "admin" && password === "1234") {
        window.location.href = "admin.html";
      } else {
        showalert("Invalid username or password");
      }
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

    // // for table dropdowns
    // document.querySelectorAll(".table-dropdown-content.open").forEach(dropdown => {
    //   dropdown.classList.remove("open");
    // });
    
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
});
