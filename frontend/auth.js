const API_BASE = "http://localhost:5000/api/auth";

let isSignupMode = false;

const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const nameField = document.getElementById("nameField");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const submitButton = document.getElementById("submitButton");
const toggleText = document.getElementById("toggleText");
const toggleLink = document.getElementById("toggleLink");
const authError = document.getElementById("authError");

// If already logged in, skip straight to the app
if (localStorage.getItem("meetflowToken")) {
    window.location.href = "index.html";
}

toggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;
    updateFormMode();
});

function updateFormMode() {

    authError.style.display = "none";

    if (isSignupMode) {
        formTitle.textContent = "Create Account";
        formSubtitle.textContent = "Start turning meetings into action";
        nameField.style.display = "block";
        submitButton.textContent = "Sign Up";
        toggleText.textContent = "Already have an account?";
        toggleLink.textContent = "Log in";
    } else {
        formTitle.textContent = "Log In";
        formSubtitle.textContent = "Welcome back to MeetFlow AI";
        nameField.style.display = "none";
        submitButton.textContent = "Log In";
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = "Sign up";
    }

}

submitButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = nameInput.value.trim();

    authError.style.display = "none";

    if (!email || !password) {
        showError("Please fill in all fields.");
        return;
    }

    const endpoint = isSignupMode ? "/signup" : "/login";
    const body = isSignupMode ? { email, password, name } : { email, password };

    try {

        submitButton.disabled = true;
        submitButton.textContent = isSignupMode ? "Signing up..." : "Logging in...";

        const response = await fetch(API_BASE + endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!data.success) {
            showError(data.error || "Something went wrong.");
            return;
        }

        // Save token and user info, then go to the app
        localStorage.setItem("meetflowToken", data.token);
        localStorage.setItem("meetflowUser", JSON.stringify(data.user));

        window.location.href = "index.html";

    } catch (error) {

        console.error(error);
        showError("Could not connect to server. Is it running?");

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = isSignupMode ? "Sign Up" : "Log In";

    }

});

function showError(message) {
    authError.textContent = message;
    authError.style.display = "block";
}