import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import Groq from "groq-sdk";
import { fetchArticles } from "./scrapeArticles.js"; // your scraping script

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Data storage
const DATA_DIR = process.env.DATA_DIR || "./data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const VECTORS_FILE = path.join(DATA_DIR, "vectors.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// Persistent storage
let VECTOR_STORE = [];
let SESSIONS = {};

// Load persisted state
try {
  if (fs.existsSync(VECTORS_FILE))
    VECTOR_STORE = JSON.parse(fs.readFileSync(VECTORS_FILE));
  if (fs.existsSync(SESSIONS_FILE))
    SESSIONS = JSON.parse(fs.readFileSync(SESSIONS_FILE));
} catch (err) {
  console.warn(err.message);
}

// Save state
function persist() {
  fs.writeFileSync(VECTORS_FILE, JSON.stringify(VECTOR_STORE, null, 2));
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(SESSIONS, null, 2));
}

// Hugging Face embedder
let embedder = null;
async function initEmbedder() {
  embedder = await pipeline(
    "feature-extraction",
    "avsolatorio/GIST-small-Embedding-v0"
  );
  console.log("Embedder ready!");
}

async function getEmbedding(text) {
  const result = await embedder(text);

  // Convert nested TypedArray/Float32Array to normal JS array
  // result[0] is usually the sequence embeddings: [sequence_length][hidden_size]
  const nested = Array.from(result[0], (row) => Array.from(row));

  // Flatten manually
  const flat = nested.flat();
  return flat;
}

// Utilities
function cosineSimilarity(a, b) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

function chunkText(text, maxChars = 1000) {
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
  const chunks = [];
  let buffer = "";
  for (const s of sentences) {
    if ((buffer + s).length > maxChars) {
      if (buffer) chunks.push(buffer.trim());
      if (s.length > maxChars) {
        for (let i = 0; i < s.length; i += maxChars)
          chunks.push(s.slice(i, i + maxChars).trim());
        buffer = "";
      } else buffer = s;
    } else buffer += s;
  }
  if (buffer) chunks.push(buffer.trim());
  return chunks;
}

// Ingest JSON articles automatically
async function ingestFromFile(filePath) {
  if (!fs.existsSync(filePath)) return console.log("No articles file found");
  const data = JSON.parse(fs.readFileSync(filePath));
  const articles = data.articles || [];
  console.log(`Ingesting ${articles.length} articles...`);

  for (const art of articles) {
    const id =
      art.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const title = art.title || "(no title)";
    const chunks = chunkText(art.content || "");
    for (let i = 0; i < chunks.length; i++) {
      const textForEmbedding = `${title}\n\n${chunks[i]}`;
      const vector = await getEmbedding(textForEmbedding);
      VECTOR_STORE.push({
        id: `${id}::${i}`,
        sourceId: id,
        title,
        url: art.url || null,
        text: chunks[i],
        embedding: vector,
        createdAt: new Date().toISOString(),
      });
    }
  }
  persist();
  console.log("Ingestion done, vectors count:", VECTOR_STORE.length);
}

// Session helpers
function getOrCreateSession(sessionId) {
  if (sessionId && SESSIONS[sessionId])
    return { sessionId, session: SESSIONS[sessionId] };
  const id =
    sessionId ||
    `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  SESSIONS[id] = { history: [], createdAt: new Date().toISOString() };
  persist();
  return { sessionId: id, session: SESSIONS[id] };
}

// Chat endpoint (RAG)
app.post("/chat", async (req, res) => {
  try {
    const { sessionId: incomingSessionId, message, topK = 4 } = req.body;
    console.log(req.body);

    if (!message || typeof message !== "string")
      return res
        .status(400)
        .json({ success: false, message: "message required" });

    const { sessionId, session } = getOrCreateSession(incomingSessionId);
    session.history.push({
      from: "user",
      text: message,
      at: new Date().toISOString(),
    });

    const qEmb = await getEmbedding(message);
    const sims = VECTOR_STORE.map((doc) => ({
      doc,
      score: cosineSimilarity(qEmb, doc.embedding),
    }));
    sims.sort((a, b) => b.score - a.score);
    const top = sims.slice(0, topK).filter((s) => s.score > 0);

    const sourceMap = {};
    let sourceCounter = 1;
    let sourcesText = "";

    top.forEach((s) => {
      const articleId = s.doc.sourceId;
      if (!sourceMap[articleId]) {
        sourceMap[articleId] = sourceCounter++;
        sourcesText += `Source ${sourceMap[articleId]} - ${s.doc.title}\n`;
      }
      sourcesText += `${s.doc.text}\n---\n`;
    });

    const systemMessage = {
      role: "system",
      content:
        "You are a helpful assistant answering using the news sources. Cite as [Source 1], etc.",
    };
    const recentHistory = session.history
      .slice(-10)
      .map((h) => ({
        role: h.from === "user" ? "user" : "assistant",
        content: h.text,
      }));
    const retrievedContextMessage = {
      role: "system",
      content: `Retrieved context:\n${sourcesText}`,
    };
    const messages = [
      systemMessage,
      retrievedContextMessage,
      ...recentHistory,
      { role: "user", content: message },
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1000,
      temperature: 0.2,
    });

    const answer = chatCompletion.choices[0]?.message?.content || "";
    session.history.push({
      from: "assistant",
      text: answer,
      at: new Date().toISOString(),
    });
    persist();

    return res.json({
      success: true,
      sessionId,
      answer,
      retrieved: top.map((t) => ({
        id: t.doc.id,
        title: t.doc.title,
        score: t.score,
      })),
    });
  } catch (err) {
    console.error(err);
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get("/", (req, res) =>
  res.json({ status: "ok", VECTOR_STORE_SIZE: VECTOR_STORE.length })
);

// Start server with initialization
(async () => {
  await initEmbedder(); // init Hugging Face embedder
  await fetchArticles(); // scrape articles
  await ingestFromFile(path.join(DATA_DIR, "articles.json")); // ingest
  app.listen(PORT, () => console.log(`RAG backend running on port ${PORT}`));
})();
