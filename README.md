# AI Meeting Assistant 🤖📅

An AI-powered web application that helps users schedule, manage, and get intelligent insights on their meetings — with secure authentication and Gemini AI integration.

---

## 📌 Problem Statement

Managing meetings manually is time-consuming and error-prone. Users often struggle to:
- Keep track of multiple meetings across different times and dates
- Quickly summarize or extract key points from meeting agendas/notes
- Access a secure, centralized place to save, edit, and delete meeting records
- Get smart, AI-generated suggestions or summaries without switching between multiple tools

**AI Meeting Assistant** solves this by providing a single web platform where users can log in securely, manage their meetings, and leverage AI (Gemini) to get smart assistance — all in one place.

---

## ✨ Features

- 🔐 **User Authentication** — secure signup/login system (`auth.js`, `login.html`)
- 📝 **Create, Save & Delete Meetings** — full CRUD functionality for meeting records
- 🤖 **AI-Powered Assistance** — Gemini integration for smart meeting summaries/suggestions
- 🎨 **Clean, Responsive UI** — built with HTML/CSS and vanilla JavaScript
- ⚡ **REST API Backend** — dedicated API route handlers with auth-protected endpoints
- 🌐 **Deployed via GitHub Pages** — live deployment for easy access

---

## 🤖 Gemini Integration

The application integrates **Google's Gemini API** to power its AI assistant capabilities:

- Meeting content (agenda/notes) is sent to the Gemini API via a backend route
- Gemini processes the input and returns AI-generated output (e.g., summaries, action items, or smart suggestions)
- The response is displayed back to the user in the frontend interface
- API keys are kept secure on the **backend** and never exposed in frontend code

> ⚠️ [ ] *Add specific details here: which Gemini model you use (e.g., `gemini-1.5-flash`), what exact feature it powers (summarization, chat, action-item extraction, etc.), and any prompt design notes.*

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js [ ] *(confirm framework — Express, etc.)* |
| Authentication | Custom auth (`auth.js`) with token/session-based login |
| AI Integration | Google Gemini API |
| Version Control | Git & GitHub |
| Deployment | GitHub Pages / GitHub Deployments |

---

## 🏗️ Application Architecture

```
AI-meeting-assistant/
│
├── backend/              # API route handlers, auth middleware, Gemini API calls
├── frontend/             # Client-side UI components
├── auth.js               # Authentication logic (login/signup handling)
├── index.html            # Main application page
├── login.html            # Login/authentication page
├── script.js              # Core frontend logic (meeting CRUD, API calls)
├── style.css              # Application styling
└── .gitignore
```

**Flow:**
1. User logs in via `login.html` → `auth.js` validates credentials
2. Authenticated user lands on `index.html` (main dashboard)
3. `script.js` handles UI interactions and sends requests to the **backend** API
4. Backend routes handle meeting CRUD operations and forward AI requests to the **Gemini API**
5. Responses are returned to the frontend and rendered for the user

---

## ⚙️ Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashaswinij1359-cyber/AI-meeting-assistant.git
   cd AI-meeting-assistant
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend` folder:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=5000
   [ ] JWT_SECRET=your_secret_here
   ```

4. **Install frontend dependencies (if applicable)**
   ```bash
   cd ../frontend
   npm install
   ```

---

## ▶️ Run Locally

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

2. **Open the frontend**
   - Simply open `index.html` in your browser, **or**
   - If using a dev server:
     ```bash
     cd frontend
     npm start
     ```

3. **Access the app**
   Visit `http://localhost:5000` (or your configured port) in your browser.

---

## 📸 Screenshots

> [ ] *Add screenshots here once available:*
> - Login page
> - Main dashboard / meeting list
> - AI assistant in action
> - Meeting creation form

```
![Login Page](./screenshots/login.png)
![Dashboard](./screenshots/dashboard.png)
![AI Assistant](./screenshots/ai-assistant.png)
```

---

## 🎯 Key Product Features

- Secure user accounts with login/authentication
- Full meeting lifecycle management (create, view, edit, delete)
- AI-powered meeting insights via Gemini
- Simple, intuitive interface for non-technical users
- Deployed and accessible via GitHub Pages

---

## 👤 Author

**Yashaswini J** — [GitHub Profile](https://github.com/yashaswinij1359-cyber)

---

## 📄 License

[ ] *Add your license here (e.g., MIT License)*

