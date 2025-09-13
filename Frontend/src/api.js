import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000"
});

export async function createSession() {
  const r = await API.post("/session");
  return r.data.sessionId;
}

export async function getHistory(sessionId) {
  const r = await API.get(`/session/${sessionId}/history`);
  return r.data.history;
}

export async function sendMessage(sessionId, message) {
  const r = await API.post("/chat", { sessionId, message });
  return r.data;
}

export async function resetSession(sessionId) {
  const r = await API.post(`/session/${sessionId}/reset`);
  return r.data;
}
