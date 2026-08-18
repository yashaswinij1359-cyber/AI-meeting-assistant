/* ==========================================
   MEETFLOW AI - FRONTEND
   (Local-storage version — no backend required)
========================================== */
const API_URL = "http://localhost:5000/api/analyze";
const MEETINGS_API = "http://localhost:5000/api/meetings";

let meetings = [];
let tasks = [];


/* ==========================================
   ELEMENTS
========================================== */

const meetingTitle = document.getElementById("meetingTitle");
const transcript = document.getElementById("transcript");
const analyzeButton = document.getElementById("analyzeButton");
const buttonText = document.getElementById("buttonText");
const buttonIcon = document.getElementById("buttonIcon");
const clearButton = document.getElementById("clearButton");
const characterCount = document.getElementById("characterCount");
const resultsSection = document.getElementById("results");
const summaryResult = document.getElementById("summaryResult");
const actionItems = document.getElementById("actionItems");
const taskCount = document.getElementById("taskCount");
const recentMeetings = document.getElementById("recentMeetings");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");


/* ==========================================
   INITIALIZE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Load saved tasks
    try {
        const savedTasks = localStorage.getItem("meetflowTasks");
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        tasks = Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch (error) {
        console.error("Could not load tasks:", error);
        tasks = [];
    }

    // Load meetings
    loadMeetings();

    // Update statistics
    updateStatistics();

});


/* ==========================================
   LOAD MEETINGS
========================================== */

async function loadMeetings() {
    try {
        const saved = localStorage.getItem("meetflowMeetings");
        meetings = saved ? JSON.parse(saved) : [];

        renderMeetings();
        updateStatistics();

    } catch (error) {
        console.error("Load meetings error:", error);
        meetings = [];
        showToast("Could not load saved meetings.", "!");
    }
}


/* ==========================================
   CHARACTER COUNTER
========================================== */

if (transcript) {
    transcript.addEventListener("input", () => {
        const count = transcript.value.length;
        characterCount.textContent = `${count.toLocaleString()} characters`;
    });
}


/* ==========================================
   CLEAR
========================================== */

if (clearButton) {
    clearButton.addEventListener("click", () => {
        meetingTitle.value = "";
        transcript.value = "";
        characterCount.textContent = "0 characters";
        showToast("Meeting form cleared", "↻");
    });
}


/* ==========================================
   ANALYZE MEETING
========================================== */

if (analyzeButton) {

    analyzeButton.addEventListener("click", async () => {

        const title = meetingTitle.value.trim() || "Untitled Meeting";
        const text = transcript.value.trim();

        if (!text) {
            showToast("Please paste a meeting transcript first.", "!");
            transcript.focus();
            return;
        }

        if (text.length < 20) {
            showToast("Please provide a little more transcript text.", "!");
            return;
        }

        setLoading(true);

        try {

            // Local analysis (no backend required)
            const data = localAnalyze(text);

            displayResults(data);

            await saveMeeting(title, data);

            showToast("Meeting analyzed and saved successfully!", "✓");

        } catch (error) {

            console.error("Analyze error:", error);
            showToast("Something went wrong analyzing the meeting.", "!");

        } finally {

            setLoading(false);

        }

    });

}


/* ==========================================
   LOADING
========================================== */

function setLoading(loading) {

    if (!analyzeButton) {
        return;
    }

    analyzeButton.disabled = loading;

    if (loading) {
        buttonIcon.textContent = "◌";
        buttonText.textContent = "Analyzing meeting...";
    } else {
        buttonIcon.textContent = "✦";
        buttonText.textContent = "Analyze Meeting";
    }

}


/* ==========================================
   DISPLAY RESULTS
========================================== */

function displayResults(data) {

    resultsSection.classList.remove("hidden");

    summaryResult.textContent = data.summary || "No summary generated.";

    const items = data.actionItems || data.action_items || [];

    renderActionItems(items);

    taskCount.textContent =
        `${items.length} task${items.length === 1 ? "" : "s"} identified`;

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* ==========================================
   ACTION ITEMS
========================================== */

function renderActionItems(items) {

    actionItems.innerHTML = "";

    if (!items || items.length === 0) {
        actionItems.innerHTML = `
            <div class="empty-state">
                No action items were identified.
            </div>
        `;
        return;
    }

    items.forEach((item, index) => {

        const task = typeof item === "string"
            ? { task: item, owner: "Unassigned", deadline: "Not specified" }
            : item;

        const div = document.createElement("div");
        div.className = "task";

        div.innerHTML = `
            <input
                type="checkbox"
                class="task-checkbox"
                data-index="${index}"
                ${task.completed ? "checked" : ""}
            >
            <div class="task-content">
                <strong>
                    ${escapeHTML(task.task || task.action || task.description || "Action item")}
                </strong>
                <div class="task-meta">
                    <span>👤 ${escapeHTML(task.owner || task.assignee || "Unassigned")}</span>
                    <span>◷ ${escapeHTML(task.deadline || task.dueDate || "Not specified")}</span>
                </div>
            </div>
        `;

        actionItems.appendChild(div);

    });

    document.querySelectorAll(".task-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", handleTaskChange);
    });

}


/* ==========================================
   TASK CHECKBOX
========================================== */

function handleTaskChange(event) {

    const checkbox = event.target;
    const index = Number(checkbox.dataset.index);

    if (!tasks[index]) {
        return;
    }

    const row = checkbox.closest(".task");

    if (checkbox.checked) {
        row.style.opacity = "0.5";
        row.style.textDecoration = "line-through";
        tasks[index] = { ...tasks[index], completed: true };
    } else {
        row.style.opacity = "1";
        row.style.textDecoration = "none";
        tasks[index].completed = false;
    }

    localStorage.setItem("meetflowTasks", JSON.stringify(tasks));

    updateStatistics();

}


/* ==========================================
   SAVE MEETING
========================================== */

async function saveMeeting(title, data) {

    try {

        const items = data.actionItems || data.action_items || [];

        const meeting = {
            id: Date.now().toString(),
            title,
            summary: data.summary || "",
            actionItems: items,
            createdAt: new Date().toLocaleString()
        };

        meetings.unshift(meeting);

        localStorage.setItem("meetflowMeetings", JSON.stringify(meetings));

        // Add new tasks tied to this meeting
        const newTasks = items.map(item => {
            const task = typeof item === "string" ? { task: item } : item;
            return { ...task, meeting: title, completed: false };
        });

        tasks.push(...newTasks);

        localStorage.setItem("meetflowTasks", JSON.stringify(tasks));

        renderMeetings();
        updateStatistics();

    } catch (error) {

        console.error("Save meeting error:", error);
        showToast("Meeting analyzed, but could not be saved.", "!");

    }

}


/* ==========================================
   RENDER MEETINGS
========================================== */

function renderMeetings() {

    if (!meetings.length) {
        recentMeetings.innerHTML = `
            <div class="empty-meetings">
                <div class="empty-icon">◫</div>
                <h3>No meetings yet</h3>
                <p>Analyze your first meeting to see it here.</p>
                <button class="small-button" onclick="scrollToMeeting()">
                    Start your first meeting
                </button>
            </div>
        `;
        return;
    }

    recentMeetings.innerHTML = "";

    meetings.forEach(meeting => {

        const row = document.createElement("div");
        row.className = "meeting-row";

        row.innerHTML = `
            <div class="meeting-icon">✦</div>
            <div>
                <strong>${escapeHTML(meeting.title)}</strong>
                <p>${escapeHTML(meeting.createdAt || "")} · ${(meeting.actionItems || []).length} tasks</p>
            </div>
            <button class="delete-meeting-btn" data-id="${meeting.id}">
                🗑
            </button>
        `;

        recentMeetings.appendChild(row);

    });

    document.querySelectorAll(".delete-meeting-btn").forEach(btn => {
        btn.addEventListener("click", handleDeleteMeeting);
    });

}


/* ==========================================
   DELETE MEETING
========================================== */

function handleDeleteMeeting(event) {

    const button = event.currentTarget;
    const meetingId = button.dataset.id;

    if (!meetingId) {
        return;
    }

    try {

        const deletedMeeting = meetings.find(meeting => meeting.id === meetingId);

        meetings = meetings.filter(meeting => meeting.id !== meetingId);
        localStorage.setItem("meetflowMeetings", JSON.stringify(meetings));

        if (deletedMeeting) {
            tasks = tasks.filter(task => task.meeting !== deletedMeeting.title);
            localStorage.setItem("meetflowTasks", JSON.stringify(tasks));
        }

        renderMeetings();
        updateStatistics();

        showToast("Meeting deleted.", "✓");

    } catch (error) {

        console.error("Delete meeting error:", error);
        showToast("Could not delete meeting.", "!");

    }

}


/* ==========================================
   STATISTICS
========================================== */

function updateStatistics() {

    const meetingCount = document.getElementById("meetingCount");
    const analysisCount = document.getElementById("analysisCount");
    const completedCount = document.getElementById("completedCount");
    const pendingCount = document.getElementById("pendingCount");

    if (meetingCount) {
        meetingCount.textContent = meetings.length;
    }

    if (analysisCount) {
        analysisCount.textContent = meetings.length;
    }

    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;

    if (completedCount) {
        completedCount.textContent = completed;
    }

    if (pendingCount) {
        pendingCount.textContent = pending;
    }

}


/* ==========================================
   LOCAL ANALYZER
========================================== */

function localAnalyze(text) {

    const sentences = text
        .split(/[.!?\n]+/)
        .map(s => s.trim())
        .filter(Boolean);

    const actionItems = [];

    sentences.forEach(sentence => {

        const lower = sentence.toLowerCase();

        const actionWords = [
            "will", "should", "need to", "needs to", "must",
            "complete", "review", "finish", "prepare",
            "send", "create", "update", "test", "launch", "design"
        ];

        if (actionWords.some(word => lower.includes(word))) {
            actionItems.push({
                task: sentence,
                owner: findOwner(sentence),
                deadline: findDeadline(sentence)
            });
        }

    });

    return {
        summary: sentences.slice(0, 3).join(". ") + (sentences.length ? "." : ""),
        actionItems: actionItems.slice(0, 10)
    };

}


/* ==========================================
   OWNER DETECTION
========================================== */

function findOwner(sentence) {
    const match = sentence.match(/\b([A-Z][a-z]{2,})\b/);
    return match ? match[1] : "Unassigned";
}


/* ==========================================
   DEADLINE DETECTION
========================================== */

function findDeadline(sentence) {

    const patterns = [
        "today", "tomorrow", "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday",
        "this week", "next week"
    ];

    const lower = sentence.toLowerCase();
    const found = patterns.find(item => lower.includes(item));

    return found ? capitalize(found) : "Not specified";

}


/* ==========================================
   NAVIGATION
========================================== */

function scrollToMeeting() {
    const section = document.getElementById("new-meeting");
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
}

window.scrollToMeeting = scrollToMeeting;


/* ==========================================
   TOAST
========================================== */

function showToast(message, icon = "✓") {

    const toastIcon = document.getElementById("toastIcon");

    if (toastIcon) {
        toastIcon.textContent = icon;
    }

    if (toastMessage) {
        toastMessage.textContent = message;
    }

    if (toast) {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

}


/* ==========================================
   HTML SECURITY
========================================== */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}


/* ==========================================
   THEME BUTTON
========================================== */

const themeButton = document.getElementById("themeButton");

if (themeButton) {
    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        showToast("Theme preference changed", "◐");
    });
}


/* ==========================================
   NAV ACTIVE STATE
========================================== */

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
        link.classList.add("active");
    });
});
/* ==========================================
   LOGOUT
========================================== */

function logout() {
    localStorage.removeItem("meetflowToken");
    localStorage.removeItem("meetflowUser");
    window.location.href = "login.html";
}

window.logout = logout;