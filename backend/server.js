/* ==========================================
   MEETFLOW AI BACKEND
========================================== */

require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI)

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));   // ← THIS MUST COME BEFORE ROUTES

const authRoutes = require("./routes/auth");
const meetingRoutes = require("./routes/meetings");
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
/* ==========================================
   MIDDLEWARE
========================================== */


app.use(
    express.json({
        limit: "2mb"
    })
);


/* ==========================================
   HEALTH CHECK
========================================== */

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "MeetFlow AI server is running 🚀",

        version:
            "1.0.0"

    });

});


app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        status: "online"

    });

});


/* ==========================================
   ANALYZE MEETING
========================================== */

app.post(
    "/api/analyze",
    async (req, res) => {

        try {

            const {
                title,
                transcript
            } = req.body;


            /* -----------------------------
               VALIDATION
            ----------------------------- */

            if (!transcript) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Meeting transcript is required."

                });

            }


            if (
                typeof transcript !==
                "string"
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Transcript must be text."

                });

            }


            if (
                transcript.trim().length <
                20
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Transcript is too short."

                });

            }


            /* -----------------------------
               AI ANALYSIS
            ----------------------------- */

            let result;


            if (
                process.env.OPENAI_API_KEY
            ) {

                result =
                    await analyzeWithAI(
                        title ||
                        "Untitled Meeting",

                        transcript
                    );

            } else {

                /*
                 * No API key?
                 * Use local analyzer.
                 */

                result =
                    localAnalyze(
                        transcript
                    );

            }


            res.json({

                success: true,

                title:
                    title ||
                    "Untitled Meeting",

                summary:
                    result.summary,

                actionItems:
                    result.actionItems

            });


        } catch (error) {

            console.error(
                "Analysis error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Unable to analyze meeting."

            });

        }

    }
);


/* ==========================================
   AI ANALYZER
========================================== */

async function analyzeWithAI(
    title,
    transcript
) {

    /*
     * Uses OpenAI only when
     * OPENAI_API_KEY exists.
     */

    const OpenAI =
        require("openai");


    const client =
        new OpenAI({
            apiKey:
                process.env.OPENAI_API_KEY
        });


    const prompt = `

You are MeetFlow AI,
an expert meeting productivity assistant.

Analyze this meeting transcript.

Meeting title:
${title}

Transcript:
${transcript}

Return ONLY valid JSON.

Required structure:

{
  "summary": "short clear summary",
  "actionItems": [
    {
      "task": "specific task",
      "owner": "person responsible or Unassigned",
      "deadline": "deadline or Not specified"
    }
  ]
}

Rules:

1. Keep summary concise.
2. Extract real actionable tasks.
3. Do not invent tasks.
4. Identify owners when mentioned.
5. Identify deadlines when mentioned.
6. If owner is unknown use "Unassigned".
7. If deadline is unknown use "Not specified".
`;


    const response =
        await client.chat.completions.create({

            model:
                process.env.OPENAI_MODEL ||
                "gpt-4o-mini",

            messages: [

                {
                    role: "system",

                    content:
                        "You extract structured meeting actions."
                },

                {
                    role: "user",

                    content: prompt
                }

            ],

            temperature: 0.2

        });


    const content =
        response
            .choices[0]
            .message
            .content
            .trim();


    /*
     * Remove markdown code fences
     * if the model returns them.
     */

    const clean =
        content
            .replace(
                /^```json/i,
                ""
            )
            .replace(
                /^```/i,
                ""
            )
            .replace(
                /```$/i,
                ""
            )
            .trim();


    return JSON.parse(clean);

}


/* ==========================================
   LOCAL ANALYZER
========================================== */

function localAnalyze(transcript) {

    const sentences =
        transcript
            .split(/[.!?\n]+/)
            .map(
                sentence =>
                    sentence.trim()
            )
            .filter(Boolean);


    const actionItems = [];


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


    sentences.forEach(sentence => {

        const lower =
            sentence.toLowerCase();


        const isAction =
            actionWords.some(
                word =>
                    lower.includes(word)
            );


        if (isAction) {

            actionItems.push({

                task:
                    sentence,

                owner:
                    findOwner(sentence),

                deadline:
                    findDeadline(sentence)

            });

        }

    });


    const summary =
        sentences
            .slice(0, 3)
            .join(". ");


    return {

        summary:
            summary
                ? summary + "."
                : "No summary available.",

        actionItems:
            actionItems.slice(
                0,
                10
            )

    };

}


/* ==========================================
   FIND OWNER
========================================== */

function findOwner(sentence) {

    const match =
        sentence.match(
            /\b([A-Z][a-z]{2,})\b/
        );


    if (match) {

        return match[1];

    }


    return "Unassigned";

}


/* ==========================================
   FIND DEADLINE
========================================== */

function findDeadline(sentence) {

    const deadlines = [

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


    const result =
        deadlines.find(
            deadline =>
                lower.includes(
                    deadline
                )
        );


    if (result) {

        return (
            result.charAt(0)
            .toUpperCase() +
            result.slice(1)
        );

    }


    return "Not specified";

}


/* ==========================================
   ERROR HANDLER
========================================== */

app.use(
    (err, req, res, next) => {

        console.error(err);

        res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


/* ==========================================
   START SERVER
========================================== */

app.listen(
    PORT,
    () => {

        console.log(
            "================================"
        );

        console.log(
            "   MeetFlow AI Server"
        );

        console.log(
            "================================"
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "================================"
        );

    }
);