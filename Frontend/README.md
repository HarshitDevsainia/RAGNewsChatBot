# 📰 RAG News Chatbot – React Frontend

A modern, interactive AI-powered news chatbot that provides real-time answers to user queries about **technology, finance, sports, and world events**. Built with **React**, **Tailwind CSS**, and **Framer Motion** for a smooth, responsive, and visually appealing chat experience.

---

## 🌟 Features

- Real-time chat with AI assistant.
- Maintains conversation context using session IDs stored in `localStorage`.
- Auto-scroll to show the latest message.
- Smooth animations with **Framer Motion** for messages and UI elements.
- Typing indicator while AI generates responses.
- Reset chat functionality to start a new conversation.
- Fully responsive design with modern, gradient-based UI.

---

## 🛠 Tech Stack

| Technology     | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| React          | Frontend framework for building interactive UI components |
| Tailwind CSS   | Utility-first CSS framework for styling              |
| Framer Motion  | Smooth animations and transitions                     |
| Axios          | Handles API requests to the backend                  |
| Lucide React   | Icons for AI, user, and interface elements          |
| LocalStorage   | Stores session ID for persistent conversation context |

---

## ⚡ How it Works

1. User types a message and presses **Enter** or clicks the **Send** button.
2. Frontend sends the message along with the current session ID to the backend `/chat` API.
3. Backend returns an AI-generated response along with an updated session ID.
4. Chat messages are displayed with proper styling:
   - **User messages**: Gradient background, right-aligned, shadowed for a premium feel.
   - **AI messages**: White/gray background, left-aligned with bot icon.
5. Typing indicator shows while AI is generating a response.
6. Users can reset the chat, clearing messages and session data.

---
