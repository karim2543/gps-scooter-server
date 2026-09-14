const params = new URLSearchParams(window.location.search);

if (params.get("error") === "1") {
    document.getElementById("errorMessage").style.display = "block";
}
