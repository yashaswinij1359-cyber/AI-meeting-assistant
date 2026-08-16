// backend/analyze.js

require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeMeeting(transcript) {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Meeting transcript is empty.");
  }

  const prompt = `
You are an AI Meeting-to-Action Assistant.

Analyze the following meeting transcript and return ONLY valid JSON.

Required format:
{
  "summary": "Short summary of the meeting",
  "actionItems": [
    {
      "task": "Task to be completed",
      "owner": "Person responsible or Not specified",
      "deadline": "Deadline or Not specified"
    }
  ]
}

Meeting transcript:
${transcript}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You extract structured meeting information accurately."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2
  });

  const result = response.choices[0].message.content;

  // Remove markdown code fences if the AI adds them
  const cleanResult = result
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanResult);
}

module.exports = analyzeMeeting;