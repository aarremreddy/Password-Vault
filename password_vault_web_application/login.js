document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (
    (username === "akruth" && password === "1234") ||
    (username === "akshith" && password === "1234")
  ) {
    window.location.href = "landing.html";
  } else if(username === "admin" && password === "1234"){
    window.location.href = "admin.html";
  }
    else {
    alert("Invalid username or password");
  }
});
