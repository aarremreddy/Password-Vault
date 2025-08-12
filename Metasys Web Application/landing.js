const dropdownBtns = document.querySelectorAll(".dropdown-btn");
dropdownBtns.forEach((btn, idx) => {
  btn.addEventListener("click", function (e) {
    e.stopPropagation();

    const dropdown = btn.closest("li").querySelector(".dropdown-content");
    const isOpen = dropdown.classList.contains("open");

    if (isOpen) {
      dropdown.classList.remove("open");
      btn.classList.remove("rotated");
    } else {
      dropdown.classList.add("open");
      btn.classList.add("rotated");
    }
  });
});

document.addEventListener("click", function () {
  document.querySelectorAll(".dropdown-content").forEach((menu) => {
    menu.classList.remove("open");
  });

  document.querySelectorAll(".dropdown-btn").forEach((btn) => {
    btn.classList.remove("rotated");
  });
});


