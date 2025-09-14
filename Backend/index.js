import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import Groq from "groq-sdk";
import { fetchArticles } from "./scrapeArticles.js";
import { QdrantClient } from "@qdrant/js-client-rest";

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

// ---------------- Groq ----------------
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ---------------- Sessions ----------------
const DATA_DIR = process.env.DATA_DIR || "./data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
let SESSIONS = {};
try {
  if (fs.existsSync(SESSIONS_FILE)) {
    SESSIONS = JSON.parse(fs.readFileSync(SESSIONS_FILE));
  }
} catch (err) {
  console.warn("Session load error:", err.message);
}

function persistSessions() {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(SESSIONS, null, 2));
}

// ---------------- Embedder ----------------
let embedder = null;
let VECTOR_SIZE = null;

async function initEmbedder() {
  embedder = await pipeline(
    "feature-extraction",
    "avsolatorio/GIST-small-Embedding-v0"
  );
  console.log("Embedder ready!");

  // detect embedding size
  const sample = await getEmbedding("hello world");
  VECTOR_SIZE = sample.length;
  console.log(`Detected VECTOR_SIZE = ${VECTOR_SIZE}`);
}

// mean pooling
async function getEmbedding(text) {
  const output = await embedder(text); // shape: [1, seq_len, hidden_size]
  const embeddings = output[0]; // seq_len × hidden_size
  const dim = embeddings[0].length;

  const avg = new Array(dim).fill(0);
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = 0; j < dim; j++) {
      avg[j] += embeddings[i][j];
    }
  }
  for (let j = 0; j < dim; j++) {
    avg[j] /= embeddings.length;
  }
  return avg;
}

// ---------------- Text utils ----------------
function chunkText(text, maxChars = 1000) {
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
  const chunks = [];
  let buffer = "";
  for (const s of sentences) {
    if ((buffer + s).length > maxChars) {
      if (buffer) chunks.push(buffer.trim());
      if (s.length > maxChars) {
        for (let i = 0; i < s.length; i += maxChars) {
          chunks.push(s.slice(i, i + maxChars).trim());
        }
        buffer = "";
      } else {
        buffer = s;
      }
    } else {
      buffer += s;
    }
  }
  if (buffer) chunks.push(buffer.trim());
  return chunks;
}

// ---------------- Qdrant ----------------
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  checkCompatibility: false,
});

const COLLECTION_NAME = "news_articles";

async function initQdrant() {
  try {
    const collections = await qdrant.getCollections();
    if (!collections.collections.find((c) => c.name === COLLECTION_NAME)) {
      console.log(
        `Creating qdrant collection '${COLLECTION_NAME}' (size=${VECTOR_SIZE})...`
      );
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`Qdrant collection '${COLLECTION_NAME}' created`);
    } else {
      console.log(`Qdrant collection '${COLLECTION_NAME}' already exists`);
    }
  } catch (err) {
    console.error("Failed to initialize Qdrant:", err);
    throw err;
  }
}

async function ingestFromFile(filePath) {
  if (!fs.existsSync(filePath)) return console.log("No articles file found");
  const data = JSON.parse(fs.readFileSync(filePath));
  const articles = data.articles || [];
  console.log(`Ingesting ${articles.length} articles to Qdrant...`);

  for (const art of articles) {
    const id = art.id || crypto.randomUUID(); // ✅ always valid UUID
    const title = art.title || "(no title)";
    const chunks = chunkText(art.content || "");

    const points = [];
    for (let i = 0; i < chunks.length; i++) {
      const textForEmbedding = `${title}\n\n${chunks[i]}`;

      // ✅ ensure vector is correct shape
      const vectorRaw = await getEmbedding(textForEmbedding);

      // Handle different possible formats
      let vector;
      if (Array.isArray(vectorRaw)) {
        if (Array.isArray(vectorRaw[0])) {
          vector = vectorRaw[0]; // case 2
        } else {
          vector = vectorRaw; // case 3
        }
      } else if (vectorRaw.embedding) {
        vector = vectorRaw.embedding; // case 1
      } else {
        throw new Error(
          "⚠️ Unknown embedding format: " + JSON.stringify(vectorRaw)
        );
      }

      if (vector.length !== VECTOR_SIZE) {
        console.error(
          `⚠️ Skipping: expected ${VECTOR_SIZE}, got ${vector.length}`
        );
        continue;
      }

      points.push({
        id: crypto.randomUUID(), // ✅ avoid "::" problem
        vector,
        payload: { title, url: art.url || null, text: chunks[i] },
      });
    }

    if (points.length > 0) {
      await qdrant.upsert(COLLECTION_NAME, { points });
    }
  }
  console.log("Ingestion done!");
}

// ---------------- Sessions ----------------
function getOrCreateSession(sessionId) {
  if (sessionId && SESSIONS[sessionId]) {
    return { sessionId, session: SESSIONS[sessionId] };
  }
  const id =
    sessionId ||
    `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  SESSIONS[id] = { history: [], createdAt: new Date().toISOString() };
  persistSessions();
  return { sessionId: id, session: SESSIONS[id] };
}

// ---------------- Chat API ----------------
app.post("/chat", async (req, res) => {
  try {
    const { sessionId: incomingSessionId, message, topK = 4 } = req.body;
    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "message required" });
    }

    const { sessionId, session } = getOrCreateSession(incomingSessionId);
    session.history.push({
      from: "user",
      text: message,
      at: new Date().toISOString(),
    });

    const qEmb = await getEmbedding(message);

    const searchResult = await qdrant.search(COLLECTION_NAME, {
      vector: qEmb,
      limit: topK,
    });

    let sourcesText = "";
    searchResult.forEach((r, idx) => {
      sourcesText += `Source ${idx + 1} - ${r.payload.title}\n${
        r.payload.text
      }\n---\n`;
    });

    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant answering using the news sources. Cite as [Source 1], etc.",
      },
      { role: "system", content: `Retrieved context:\n${sourcesText}` },
      ...session.history.slice(-10).map((h) => ({
        role: h.from === "user" ? "user" : "assistant",
        content: h.text,
      })),
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
    persistSessions();

    res.json({
      success: true,
      sessionId,
      answer,
      retrieved: searchResult.map((r) => ({
        id: r.id,
        title: r.payload.title,
        score: r.score,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Health Check ----------------
app.get("/", async (req, res) => {
  try {
    const count = await qdrant.count(COLLECTION_NAME);
    res.json({ status: "ok", VECTOR_STORE_SIZE: count.count });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
});

// ---------------- Startup ----------------
(async () => {
  try {
    await initEmbedder();
    await initQdrant();
    await fetchArticles();
    await ingestFromFile(path.join(DATA_DIR, "articles.json"));
    app.listen(PORT, () => console.log(`RAG backend running on port ${PORT}`));
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();
