# 📰 AI News Chatbot Backend

This backend powers a **retrieval-augmented AI chatbot** that answers user queries using real news articles.  
It integrates **Groq LLM**, **Qdrant vector database**, and **transformer embeddings** to provide context-aware responses.

---

## 🚀 Features

- **Context-aware AI** – Generates responses using both conversation history and retrieved news sources.
- **Semantic Search** – Uses embeddings to find relevant news articles in Qdrant.
- **Session Management** – Persists user conversations in JSON for multi-turn chat.
- **Automatic Ingestion** – Fetches and processes articles into embeddings automatically.
- **Flexible Configuration** – Environment variables control API keys, model selection, and storage paths.

---

## 🛠 Technology Stack

### Backend
- **Node.js** – High-performance, event-driven JavaScript runtime.
- **Express.js** – Lightweight framework for building REST APIs.
- **CORS** – Handles cross-origin requests securely.

### Vector Database
- **Qdrant** – Stores embeddings of news articles for fast semantic retrieval.

### Embeddings
- **@xenova/transformers** – Converts text to numerical vectors for semantic search.

### Language Model
- **Groq SDK** – Accesses LLM models (e.g., `llama-3.3-70b-versatile`) for generating AI responses.

### News Source
- **Scraped Articles** – Local JSON storage of scraped news articles.

### Session Management
- **JSON Storage** – Stores user sessions and conversation history.
- **Auto Session Handling** – Creates and persists new sessions automatically.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```bash
# Server
PORT=4000

# Groq AI LLM
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Qdrant vector database
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key

# Data directory for articles and sessions
DATA_DIR=./data
