import { NextResponse } from "next/server";
import { getClient } from "@/lib/temporalClient";
import { workflowConfig } from "@/lib/workflowConfig";

type StartBody = {
  task?: string;
};

function makeWorkflowId(): string {
  const rand = Math.random().toString(16).slice(2);
  return `wf-${Date.now()}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as StartBody;
    const task = (body.task ?? "").trim();

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 });
    }

    const client = await getClient();
    const workflowId = makeWorkflowId();

    await client.workflow.start(workflowConfig.workflowName, {
      taskQueue: workflowConfig.taskQueue,
      workflowId,
      args: [{ task }]
    });

    return NextResponse.json({ workflowId }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
