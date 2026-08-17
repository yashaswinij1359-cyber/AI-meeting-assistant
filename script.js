/* ==========================================
   MEETFLOW AI - FRONTEND
========================================== */

const API_URL = "http://localhost:5000/api/analyze";
const MEETINGS_API = "http://localhost:5000/api/meetings";

let meetings = [];
let tasks = [];


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
   GET LOGIN TOKEN
========================================== */

function getToken() {
    return localStorage.getItem("meetflowToken");
}


/* ==========================================
   INITIALIZE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Load saved tasks
try {
    const savedTasks = localStorage.getItem("meetflowTasks");

    if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);

        tasks = Array.isArray(parsedTasks)
            ? parsedTasks
            : [];
    } else {
        tasks = [];
    }

} catch (error) {

    console.error(
        "Could not load tasks:",
        error
    );

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

    const token = getToken();

    // Do NOT redirect to login from here.
    // Just keep the user on the homepage.
    if (!token) {
        console.warn("No login token found.");
        meetings = [];
        renderMeetings();
        updateStatistics();
        return;
    }

    try {

        const response =
            await fetch(MEETINGS_API, {
                method: "GET",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });


        if (response.status === 401) {

            console.warn(
                "Server rejected the login token."
            );

            showToast(
                "Your login session has expired. Please login again.",
                "!"
            );

            return;
        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Failed to load meetings"
            );

        }


        meetings =
            (data.meetings || []).map(m => ({

                id: m._id,

                title: m.title,

                summary: m.summary,

                actionItems:
                    m.actionItems || [],

                createdAt:
                    new Date(
                        m.createdAt
                    ).toLocaleString()

            }));


        renderMeetings();

        updateStatistics();


    } catch (error) {

        console.error(
            "Load meetings error:",
            error
        );

        // IMPORTANT:
        // Do NOT redirect to login.
        showToast(
            "Could not load saved meetings.",
            "!"
        );

    }

}


/* ==========================================
   CHARACTER COUNTER
========================================== */

if (transcript) {

    transcript.addEventListener(
        "input",
        () => {

            const count =
                transcript.value.length;

            characterCount.textContent =
                `${count.toLocaleString()} characters`;

        }
    );

}


/* ==========================================
   CLEAR
========================================== */

if (clearButton) {

    clearButton.addEventListener(
        "click",
        () => {

            meetingTitle.value = "";

            transcript.value = "";

            characterCount.textContent =
                "0 characters";

            showToast(
                "Meeting form cleared",
                "↻"
            );

        }
    );

}


/* ==========================================
   ANALYZE MEETING
========================================== */

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        async () => {

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

                const token =
                    getToken();


                const response =
                    await fetch(
                        API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
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


                // Save meeting
                await saveMeeting(
                    title,
                    data
                );


                showToast(
                    "Meeting analyzed and saved successfully!",
                    "✓"
                );


            } catch (error) {

                console.error(
                    "Analyze error:",
                    error
                );


                /*
                 * Local fallback
                 * if AI server is unavailable.
                 */

                const fallback =
                    localAnalyze(text);


                displayResults(
                    fallback
                );


                // Try saving fallback result
                await saveMeeting(
                    title,
                    fallback
                );


                showToast(
                    "Meeting analyzed successfully!",
                    "✓"
                );


            } finally {

                setLoading(false);

            }

        }
    );

}


/* ==========================================
   LOADING
========================================== */

function setLoading(loading) {

    if (!analyzeButton) {
        return;
    }


    analyzeButton.disabled =
        loading;


    if (loading) {

        buttonIcon.textContent =
            "◌";

        buttonText.textContent =
            "Analyzing meeting...";

    } else {

        buttonIcon.textContent =
            "✦";

        buttonText.textContent =
            "Analyze Meeting";

    }

}


/* ==========================================
   DISPLAY RESULTS
========================================== */

function displayResults(data) {

    resultsSection.classList.remove(
        "hidden"
    );


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


        div.className =
            "task";


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
        Number(
            checkbox.dataset.index
        );


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

    const token =
        getToken();


    const items =
        data.actionItems ||
        data.action_items ||
        [];


    /*
     * If there is no token, do not redirect.
     * Just keep the analysis on screen.
     */

    if (!token) {

        console.warn(
            "No token available. Meeting cannot be saved to server."
        );

        showToast(
            "Meeting analyzed, but login token was not found.",
            "!"
        );

        return;

    }


    try {

        const response =
            await fetch(
                MEETINGS_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        title,

                        summary:
                            data.summary || "",

                        actionItems:
                            items

                    })

                }
            );


        /*
         * Do not redirect to login.
         */

        if (response.status === 401) {

            console.error(
                "Unauthorized: token was rejected."
            );

            showToast(
                "Meeting analyzed, but it could not be saved.",
                "!"
            );

            return;

        }


        const result =
            await response.json();


        if (!response.ok ||
            !result.success) {

            throw new Error(
                result.error ||
                "Failed to save meeting"
            );

        }


        /*
         * Add meeting to the current page
         * immediately.
         */

        const savedMeeting =
            result.meeting;


        if (savedMeeting) {

            meetings.unshift({

                id:
                    savedMeeting._id,

                title:
                    savedMeeting.title,

                summary:
                    savedMeeting.summary,

                actionItems:
                    savedMeeting.actionItems || items,

                createdAt:
                    new Date(
                        savedMeeting.createdAt
                    ).toLocaleString()

            });

        } else {

            /*
             * If backend does not return
             * the saved meeting, reload them.
             */

            await loadMeetings();

        }


       /*
 * Add only new tasks
 */

const newTasks = items.map(item => {

    const task =
        typeof item === "string"
            ? { task: item }
            : item;

    return {
        ...task,
        meeting: title,
        completed: false
    };
});

tasks.push(...newTasks);

        localStorage.setItem(
            "meetflowTasks",
            JSON.stringify(tasks)
        );


        renderMeetings();

        updateStatistics();


    } catch (error) {

        console.error(
            "Save meeting error:",
            error
        );

        /*
         * IMPORTANT:
         * Do NOT go to login.html here.
         */

        showToast(
            "Meeting analyzed, but could not be saved.",
            "!"
        );

    }

}
/*
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
                    ${escapeHTML(
                        meeting.title
                    )}
                </strong>

                <p>
                    ${(meeting.actionItems || []).length}
                    action items •
                    ${escapeHTML(
                        meeting.createdAt
                    )}
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
        .querySelectorAll(
            ".delete-meeting-btn"
        )
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

async function handleDeleteMeeting(event) {

    const button =
        event.currentTarget;

    const meetingId =
        button.dataset.id;


    if (!meetingId) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        showToast(
            "Login token not found.",
            "!"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${MEETINGS_API}/${meetingId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok ||
            !result.success) {

            throw new Error(
                result.error ||
                "Could not delete meeting"
            );

        }


        meetings =
            meetings.filter(
                meeting =>
                    meeting.id !== meetingId
            );


        renderMeetings();

        updateStatistics();


        showToast(
            "Meeting deleted.",
            "✓"
        );


    } catch (error) {

        console.error(
            "Delete meeting error:",
            error
        );

        showToast(
            "Could not delete meeting.",
            "!"
        );

    }

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


    if (meetingCount) {

        meetingCount.textContent =
            meetings.length;

    }


    if (analysisCount) {

        analysisCount.textContent =
            meetings.length;

    }


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const pending =
        tasks.length -
        completed;


    if (completedCount) {

        completedCount.textContent =
            completed;

    }


    if (pendingCount) {

        pendingCount.textContent =
            pending;

    }

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


    const actionItems = [];


    sentences.forEach(
        sentence => {

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

        }
    );


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

    const section =
        document.getElementById(
            "new-meeting"
        );


    if (section) {

        section.scrollIntoView({
            behavior: "smooth"
        });

    }

}


window.scrollToMeeting =
    scrollToMeeting;


/* ==========================================
   TOAST
========================================== */

function showToast(
    message,
    icon = "✓"
) {

    const toastIcon =
        document.getElementById(
            "toastIcon"
        );


    if (toastIcon) {

        toastIcon.textContent =
            icon;

    }


    if (toastMessage) {

        toastMessage.textContent =
            message;

    }


    if (toast) {

        toast.classList.add(
            "show"
        );


        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);

    }

}


/* ==========================================
   HTML SECURITY
========================================== */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

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


if (themeButton) {

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

}


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
   LOGOUT
========================================== */
function handleTaskChange(event) {

    const checkbox = event.target;

    const index = Number(checkbox.dataset.index);

    if (!tasks[index]) {
        return;
    }
function logout() {

    localStorage.removeItem(
        "meetflowToken"
    );

    localStorage.removeItem(
        "meetflowUser"
    );

    window.location.href =
        "login.html";

}


window.logout =
    logout;
