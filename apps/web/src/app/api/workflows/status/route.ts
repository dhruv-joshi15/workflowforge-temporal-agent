import { NextResponse } from "next/server";
import { getClient } from "@/lib/temporalClient";
import { workflowConfig } from "@/lib/workflowConfig";

type ExecState =
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED"
  | "TERMINATED"
  | "CONTINUED_AS_NEW"
  | "TIMED_OUT"
  | "UNKNOWN";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workflowId = (url.searchParams.get("workflowId") ?? "").trim();

    if (!workflowId) {
      return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
    }

    const client = await getClient();
    const handle = client.workflow.getHandle(workflowId);

    const desc = await handle.describe();
    const state = (desc.status?.name ?? "UNKNOWN") as ExecState;

    let status: unknown = null;
    try {
      status = await handle.query(workflowConfig.statusQueryName);
    } catch {
      status = null;
    }

    if (state === "RUNNING") {
      return NextResponse.json({ workflowId, state, status, result: null }, { status: 200 });
    }

    try {
      const result = await handle.result();
      return NextResponse.json({ workflowId, state, status, result }, { status: 200 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        {
          workflowId,
          state: state === "COMPLETED" ? "FAILED" : state,
          status,
          result: null,
          error: message
        },
        { status: 200 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
