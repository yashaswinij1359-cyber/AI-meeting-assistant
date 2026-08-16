/* ==========================================
   MEETFLOW AI - FRONTEND
========================================== */

const API_URL = "http://localhost:5000/api/analyze";

let meetings =[];
let tasks =[];

/* ==========================================
   ELEMENTS
========================================== */

const meetingTitle =
    document.getElementById("meetingTitle");

const transcript =
    document.getElementById("transcript");

const analyzeButton =
    document.getElementById("analyzeButton");

const buttonText =
    document.getElementById("buttonText");

const buttonIcon =
    document.getElementById("buttonIcon");

const clearButton =
    document.getElementById("clearButton");

const characterCount =
    document.getElementById("characterCount");

const resultsSection =
    document.getElementById("results");

const summaryResult =
    document.getElementById("summaryResult");

const actionItems =
    document.getElementById("actionItems");

const taskCount =
    document.getElementById("taskCount");

const recentMeetings =
    document.getElementById("recentMeetings");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* ==========================================
   INITIALIZE
========================================== */

async function loadMeetings() {

    try {

        const response = await fetch("http://localhost:5000/api/meetings", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Failed to load meetings");
        }

        meetings = data.meetings.map(m => ({
            id: m._id,
            title: m.title,
            summary: m.summary,
            actionItems: m.actionItems,
            createdAt: new Date(m.createdAt).toLocaleString()
        }));

        renderMeetings();

    } catch (error) {

        console.error("Load meetings error:", error);

        if (error.message.includes("token")) {
            localStorage.removeItem("meetflowToken");
            window.location.href = "login.html";
        }

    }

}

/* ==========================================
   CHARACTER COUNTER
========================================== */

transcript.addEventListener("input", () => {

    const count = transcript.value.length;

    characterCount.textContent =
        `${count.toLocaleString()} characters`;

});


/* ==========================================
   CLEAR
========================================== */

clearButton.addEventListener("click", () => {

    meetingTitle.value = "";

    transcript.value = "";

    characterCount.textContent =
        "0 characters";

    showToast(
        "Meeting form cleared",
        "↻"
    );

});


/* ==========================================
   ANALYZE MEETING
========================================== */

analyzeButton.addEventListener("click", async () => {

    const title =
        meetingTitle.value.trim() ||
        "Untitled Meeting";

    const text =
        transcript.value.trim();


    if (!text) {

        showToast(
            "Please paste a meeting transcript first.",
            "!"
        );

        transcript.focus();

        return;
    }


    if (text.length < 20) {

        showToast(
            "Please provide a little more transcript text.",
            "!"
        );

        return;
    }


    setLoading(true);


    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title,
                    transcript: text
                })
            }
        );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );
        }


        const data =
            await response.json();


        displayResults(data);


        saveMeeting(
            title,
            data
        );


        showToast(
            "Meeting analyzed successfully!",
            "✓"
        );


    } catch (error) {

        console.error(error);


        showToast(
            "Could not connect to AI server.",
            "!"
        );


        /*
         * Local fallback so the demo
         * still works if server is unavailable.
         */

        const fallback =
            localAnalyze(text);

        displayResults(fallback);

        saveMeeting(
            title,
            fallback
        );

    } finally {

        setLoading(false);

    }

});


/* ==========================================
   LOADING
========================================== */

function setLoading(loading) {

    analyzeButton.disabled = loading;


    if (loading) {

        buttonIcon.textContent = "◌";

        buttonText.textContent =
            "Analyzing meeting...";

    } else {

        buttonIcon.textContent = "✦";

        buttonText.textContent =
            "Analyze Meeting";

    }

}


/* ==========================================
   DISPLAY RESULTS
========================================== */

function displayResults(data) {

    resultsSection.classList.remove("hidden");


    summaryResult.textContent =
        data.summary ||
        "No summary generated.";


    const items =
        data.actionItems ||
        data.action_items ||
        [];


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

        const task =
            typeof item === "string"
                ? {
                    task: item,
                    owner: "Unassigned",
                    deadline: "Not specified"
                }
                : item;


        const div =
            document.createElement("div");


        div.className = "task";


        div.innerHTML = `

            <input
                type="checkbox"
                class="task-checkbox"
                data-index="${index}"
            >

            <div class="task-content">

                <strong>
                    ${escapeHTML(
                        task.task ||
                        task.action ||
                        task.description ||
                        "Action item"
                    )}
                </strong>

                <div class="task-meta">

                    <span>
                        👤 ${escapeHTML(
                            task.owner ||
                            task.assignee ||
                            "Unassigned"
                        )}
                    </span>

                    <span>
                        ◷ ${escapeHTML(
                            task.deadline ||
                            task.dueDate ||
                            "Not specified"
                        )}
                    </span>

                </div>

            </div>
        `;


        actionItems.appendChild(div);

    });


    document
        .querySelectorAll(".task-checkbox")
        .forEach(checkbox => {

            checkbox.addEventListener(
                "change",
                handleTaskChange
            );

        });

}


/* ==========================================
   TASK CHECKBOX
========================================== */

function handleTaskChange(event) {

    const checkbox =
        event.target;

    const index =
        Number(checkbox.dataset.index);


    if (checkbox.checked) {

        checkbox
            .closest(".task")
            .style.opacity = "0.5";

        checkbox
            .closest(".task")
            .style.textDecoration =
            "line-through";


        tasks[index] = {
            ...tasks[index],
            completed: true
        };

    } else {

        checkbox
            .closest(".task")
            .style.opacity = "1";

        checkbox
            .closest(".task")
            .style.textDecoration =
            "none";


        if (tasks[index]) {

            tasks[index].completed =
                false;

        }

    }


    localStorage.setItem(
        "meetflowTasks",
        JSON.stringify(tasks)
    );


    updateStatistics();

}


/* ==========================================
   SAVE MEETING
========================================== */

async function saveMeeting(title, data) {

    const items =
        data.actionItems ||
        data.action_items ||
        [];

    try {

        const response = await fetch("http://localhost:5000/api/meetings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                summary: data.summary || "",
                actionItems: items
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Failed to save meeting");
        }

        await loadMeetings();

        tasks.push(
            ...items.map(item => ({
                ...item,
                meeting: title,
                completed: false
            }))
        );

        localStorage.setItem(
            "meetflowTasks",
            JSON.stringify(tasks)
        );

        updateStatistics();

    } catch (error) {

        console.error("Save meeting error:", error);

        showToast("Could not save meeting to your account.", "!");

    }

}


/* ==========================================
   MEETINGS
========================================== */

function renderMeetings() {

    if (!meetings.length) {

        recentMeetings.innerHTML = `

            <div class="empty-meetings">

                <div class="empty-icon">
                    ◫
                </div>

                <h3>No meetings yet</h3>

                <p>
                    Analyze your first meeting
                    to see it here.
                </p>

                <button
                    class="small-button"
                    onclick="scrollToMeeting()">

                    Start your first meeting

                </button>

            </div>
        `;

        return;
    }


    recentMeetings.innerHTML = "";


    meetings.forEach(meeting => {

        const row =
            document.createElement("div");

        row.className =
            "meeting-row";


        row.innerHTML = `

            <div class="meeting-icon">
                ✦
            </div>

            <div>

                <strong>
                    ${escapeHTML(meeting.title)}
                </strong>

                <p>
                    ${meeting.actionItems.length}
                    action items •
                    ${escapeHTML(meeting.createdAt)}
                </p>

            </div>

            <span class="meeting-status">
                Analyzed
            </span>
        `;


        recentMeetings.appendChild(row);

    });

}


/* ==========================================
   STATISTICS
========================================== */

function updateStatistics() {

    const meetingCount =
        document.getElementById(
            "meetingCount"
        );

    const analysisCount =
        document.getElementById(
            "analysisCount"
        );

    const completedCount =
        document.getElementById(
            "completedCount"
        );

    const pendingCount =
        document.getElementById(
            "pendingCount"
        );


    meetingCount.textContent =
        meetings.length;


    analysisCount.textContent =
        meetings.length;


    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    const pending =
        tasks.length - completed;


    completedCount.textContent =
        completed;


    pendingCount.textContent =
        pending;

}


/* ==========================================
   LOCAL FALLBACK ANALYZER
========================================== */

function localAnalyze(text) {

    const sentences =
        text
            .split(/[.!?\n]+/)
            .map(s => s.trim())
            .filter(Boolean);


    const actionItems =
        [];


    sentences.forEach(sentence => {

        const lower =
            sentence.toLowerCase();


        const actionWords = [

            "will",
            "should",
            "need to",
            "needs to",
            "must",
            "complete",
            "review",
            "finish",
            "prepare",
            "send",
            "create",
            "update",
            "test",
            "launch",
            "design"

        ];


        if (
            actionWords.some(
                word =>
                    lower.includes(word)
            )
        ) {

            actionItems.push({

                task: sentence,

                owner:
                    findOwner(sentence),

                deadline:
                    findDeadline(sentence)

            });

        }

    });


    return {

        summary:
            sentences
                .slice(0, 3)
                .join(". ") +
            (sentences.length ? "." : ""),

        actionItems:
            actionItems.slice(0, 10)

    };

}


/* ==========================================
   OWNER DETECTION
========================================== */

function findOwner(sentence) {

    const match =
        sentence.match(
            /\b([A-Z][a-z]{2,})\b/
        );


    return match
        ? match[1]
        : "Unassigned";

}


/* ==========================================
   DEADLINE DETECTION
========================================== */

function findDeadline(sentence) {

    const patterns = [

        "today",
        "tomorrow",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "this week",
        "next week"

    ];


    const lower =
        sentence.toLowerCase();


    const found =
        patterns.find(
            item =>
                lower.includes(item)
        );


    return found
        ? capitalize(found)
        : "Not specified";

}


/* ==========================================
   NAVIGATION
========================================== */

function scrollToMeeting() {

    document
        .getElementById("new-meeting")
        .scrollIntoView({
            behavior: "smooth"
        });

}


window.scrollToMeeting =
    scrollToMeeting;


/* ==========================================
   TOAST
========================================== */

function showToast(message, icon = "✓") {

    document.getElementById(
        "toastIcon"
    ).textContent = icon;


    toastMessage.textContent =
        message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

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

    return value
        .charAt(0)
        .toUpperCase() +
        value.slice(1);

}


/* ==========================================
   THEME BUTTON
========================================== */

const themeButton =
    document.getElementById(
        "themeButton"
    );


themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );

        showToast(
            "Theme preference changed",
            "◐"
        );

    }
);


/* ==========================================
   NAV ACTIVE STATE
========================================== */

document
    .querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".nav-link"
                    )
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );


                link.classList.add(
                    "active"
                );

            }
        );

    });
/* ==========================================
   MEETINGS
========================================== */

function renderMeetings() {

    if (!meetings.length) {

        recentMeetings.innerHTML = `

            <div class="empty-meetings">

                <div class="empty-icon">
                    ◫
                </div>

                <h3>No meetings yet</h3>

                <p>
                    Analyze your first meeting
                    to see it here.
                </p>

                <button
                    class="small-button"
                    onclick="scrollToMeeting()">

                    Start your first meeting

                </button>

            </div>
        `;

        return;
    }


    recentMeetings.innerHTML = "";


    meetings.forEach(meeting => {

        const row =
            document.createElement("div");

        row.className =
            "meeting-row";


        row.innerHTML = `

            <div class="meeting-icon">
                ✦
            </div>

            <div>

                <strong>
                    ${escapeHTML(meeting.title)}
                </strong>

                <p>
                    ${meeting.actionItems.length}
                    action items •
                    ${escapeHTML(meeting.createdAt)}
                </p>

            </div>

            <span class="meeting-status">
                Analyzed
            </span>

            <button
                class="delete-meeting-btn"
                data-id="${meeting.id}"
                title="Delete meeting">
                🗑
            </button>
        `;


        recentMeetings.appendChild(row);

    });


    document
        .querySelectorAll(".delete-meeting-btn")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                handleDeleteMeeting
            );

        });

}


/* ==========================================
   DELETE MEETING
========================================== */

async function saveMeeting(title, data) {

    const items =
        data.actionItems ||
        data.action_items ||
        [];

    try {

        const response = await fetch("http://localhost:5000/api/meetings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                summary: data.summary || "",
                actionItems: items
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Failed to save meeting");
        }

        await loadMeetings();

        tasks.push(
            ...items.map(item => ({
                ...item,
                meeting: title,
                completed: false
            }))
        );

        localStorage.setItem(
            "meetflowTasks",
            JSON.stringify(tasks)
        );

        updateStatistics();

    } catch (error) {

        console.error("Save meeting error:", error);

        showToast("Could not save meeting to your account.", "!");

    }

}
function logout() {
    localStorage.removeItem("meetflowToken");
    localStorage.removeItem("meetflowUser");
    window.location.href = "login.html";
}

window.logout = logout;
