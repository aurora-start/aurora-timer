"use client";
import { useState } from "react";

export default function TimerWidget({ taskId, userId, notionPageId }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function callApi(endpoint) {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notionPageId }),
      });
      const data = await res.json();
      setStatus(data.message || (data.ok ? "OK" : "Error"));
    } catch (err) {
      setStatus("Error de conexión");
    }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <button onClick={() => callApi("/api/start")} disabled={loading} style={{ marginRight: 10 }}>
        Iniciar
      </button>
      <button onClick={() => callApi("/api/stop")} disabled={loading}>
        Detener
      </button>
      <div style={{ marginTop: 10, fontSize: 14, color: "#fff" }}>{status}</div>
    </div>
  );
}
