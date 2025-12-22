document.getElementById("btnLogin").addEventListener("click", async () => {

    const username = document.getElementById("user").value;
    const password = document.getElementById("pass").value;

    const res = await fetch("/authLogin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
        window.location.href = data.redirect;
    } else {
        alert(data.error);
    }
});
