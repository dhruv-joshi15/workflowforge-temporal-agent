"use client";

import { useEffect, useState } from "react";

type AgentStatus = {
  step: string;
  startedAtEpochMs: number;
  updatedAtEpochMs: number;
  message: string;
  lastError?: { name: string; message: string };
};

type StatusPayload = {
  workflowId: string;
  state: "RUNNING" | "COMPLETED" | "FAILED" | "UNKNOWN" | string;
  status: AgentStatus | null;
  result: unknown | null;
  error?: string;
};

async function safeJson<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const text = await res.text();
  if (!text.trim()) return { ok: false, error: `Empty response (HTTP ${res.status})` };
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: `Non-JSON response (HTTP ${res.status})` };
  }
}

function badgeStyle(state?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)"
  };

  if (!state) return base;

  const s = state.toUpperCase();
  if (s === "RUNNING") {
    return { ...base, borderColor: "rgba(56,189,248,0.35)", background: "rgba(56,189,248,0.10)" };
  }
  if (s === "COMPLETED") {
    return { ...base, borderColor: "rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.10)" };
  }
  if (s === "FAILED") {
    return { ...base, borderColor: "rgba(244,63,94,0.35)", background: "rgba(244,63,94,0.10)" };
  }
  return base;
}

export default function Home() {
  const [task, setTask] = useState("");
  const [starting, setStarting] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [data, setData] = useState<StatusPayload | null>(null);

  async function startWorkflow() {
    setStarting(true);
    setData(null);
    setWorkflowId(null);

    const res = await fetch("/api/workflows/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task })
    });

    const parsed = await safeJson<{ workflowId?: string; error?: string }>(res);

    if (!parsed.ok) {
      setStarting(false);
      setData({
        workflowId: "",
        state: "FAILED",
        status: null,
        result: null,
        error: parsed.error
      });
      return;
    }

    if (!res.ok || !parsed.data.workflowId) {
      setStarting(false);
      setData({
        workflowId: "",
        state: "FAILED",
        status: null,
        result: null,
        error: parsed.data.error ?? `Request failed (HTTP ${res.status})`
      });
      return;
    }

    setWorkflowId(parsed.data.workflowId);
    setStarting(false);
  }

  useEffect(() => {
    if (!workflowId) return;

    const id = workflowId;
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/workflows/status?workflowId=${encodeURIComponent(id)}`, {
        method: "GET"
      });

      const parsed = await safeJson<StatusPayload>(res);

      if (cancelled) return;

      if (!parsed.ok) {
        setData({
          workflowId: id,
          state: "FAILED",
          status: null,
          result: null,
          error: parsed.error
        });
        return;
      }

      setData(parsed.data);

      if (parsed.data.state === "RUNNING") {
        setTimeout(poll, 700);
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  const state = data?.state ?? (workflowId ? "LOADING" : "");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "56px 18px",
        fontFamily: "ui-sans-serif, system-ui",
        color: "rgba(255,255,255,0.92)",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(56,189,248,0.14), transparent 55%), radial-gradient(900px 700px at 50% 100%, rgba(34,197,94,0.10), transparent 55%), linear-gradient(180deg, #05070b 0%, #070b12 45%, #05070b 100%)"
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.7, letterSpacing: 0.3 }}>Temporal-backed mini agent runtime</div>
            <h1 style={{ marginTop: 8, fontSize: 28, fontWeight: 800, letterSpacing: -0.3 }}>
              Workflow Agent Runner
            </h1>
          </div>

          <div style={badgeStyle(state)}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  state === "RUNNING" ? "rgb(56,189,248)" : state === "COMPLETED" ? "rgb(34,197,94)" : state === "FAILED" ? "rgb(244,63,94)" : "rgba(255,255,255,0.35)",
                boxShadow:
                  state === "RUNNING"
                    ? "0 0 0 4px rgba(56,189,248,0.15)"
                    : state === "COMPLETED"
                      ? "0 0 0 4px rgba(34,197,94,0.15)"
                      : state === "FAILED"
                        ? "0 0 0 4px rgba(244,63,94,0.12)"
                        : "none"
              }}
            />
            <span>{state ? state : "IDLE"}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Try: extract entities, analyze risks, plan steps…"
              style={{
                flex: 1,
                minWidth: 240,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.35)",
                color: "rgba(255,255,255,0.92)",
                outline: "none"
              }}
            />

            <button
              onClick={startWorkflow}
              disabled={starting || !task.trim()}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: starting ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.92)",
                fontWeight: 700,
                cursor: starting || !task.trim() ? "not-allowed" : "pointer",
                boxShadow: "0 10px 30px rgba(0,0,0,0.30)"
              }}
            >
              {starting ? "Starting…" : "Start workflow"}
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
            Tip: keep the Temporal worker running; the UI polls status every ~700ms.
          </div>
        </div>

        {data?.error && (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 16,
              border: "1px solid rgba(244,63,94,0.35)",
              background: "rgba(244,63,94,0.10)"
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Error</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>
              {data.error}
            </div>
          </div>
        )}

        {workflowId && (
          <div
            style={{
              marginTop: 18,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Workflow ID:{" "}
                <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 800 }}>
                  {workflowId}
                </span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                State: <span style={{ fontWeight: 800 }}>{data?.state ?? "LOADING"}</span>
              </div>
            </div>

            <div
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)"
              }}
            />

            <pre
              style={{
                margin: 0,
                padding: 14,
                background: "#0b0f14",
                color: "#e6edf3",
                fontSize: 12,
                lineHeight: 1.55,
                overflow: "auto",
                maxHeight: 520,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: 18, fontSize: 12, opacity: 0.55 }}>
          Temporal UI: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>http://127.0.0.1:8081</span>{" "}
          • App: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>http://localhost:3000</span>
        </div>
      </div>
    </main>
  );
}
