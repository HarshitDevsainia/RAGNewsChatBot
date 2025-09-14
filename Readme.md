# 📰 AI News Chatbot

An AI-powered news chatbot that provides the latest updates on **technology, finance, sports, and world events**.  
The project is divided into two main parts:

- **Frontend** → React + Tailwind + Framer Motion (chat UI)
- **Backend** → Node.js + Express + Groq + OpenAI + Qdrant

---

## 🚀 Project Structure

-> frontend # Vite React app (chat interface)
-> backend # Node.js API (AI + database logic)
-> README.md


---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash

git clone https://github.com/HarshitDevsainia/RGANewsChatBot.git
cd RAGNewsChatBot

2. Backend Setup

Navigate to the Backend folder:

cd Backend


Install dependencies:

npm install


Create a .env file in the backend folder and add the following environment variables:

GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key


Start the backend server:

npm run dev   # for development (nodemon)
npm start     # for production


By default, the backend runs on http://localhost:4000.

3. Frontend Setup

Navigate to the Frontend folder:

cd ../Frontend


Install dependencies:

npm install


Start the frontend:

npm run dev


By default, the frontend runs on http://localhost:5173.

🌐 Deployment

Backend: Can be deployed on Render
, Heroku
, or Azure
.

Frontend: Can be deployed on Render
, Netlify
, or Amplify
.

📌 Features

🤖 AI-powered responses using Groq + OpenAI

📰 Get the latest trending news

💬 Smooth chat UI built with React + Framer Motion

📦 Vector search with Qdrant