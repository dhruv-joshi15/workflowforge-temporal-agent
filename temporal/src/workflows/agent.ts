import { proxyActivities, setHandler, workflowInfo, defineQuery } from "@temporalio/workflow";
import type {
  TaskPayload,
  AgentStatus,
  AgentResult,
  ToolInterpretOutput,
  ToolAnalyzeOutput,
  ToolComposeOutput
} from "../types";

const { toolInterpret, toolAnalyze, toolCompose } = proxyActivities<{
  toolInterpret(task: TaskPayload): Promise<ToolInterpretOutput>;
  toolAnalyze(task: TaskPayload, interpretation: ToolInterpretOutput): Promise<ToolAnalyzeOutput>;
  toolCompose(task: TaskPayload, interpretation: ToolInterpretOutput, analysis: ToolAnalyzeOutput): Promise<ToolComposeOutput>;
}>({
  startToCloseTimeout: "10 seconds",
  scheduleToCloseTimeout: "30 seconds",
  retry: {
    initialInterval: "200 ms",
    backoffCoefficient: 2,
    maximumInterval: "3 seconds",
    maximumAttempts: 5
  }
});

export const getStatusQuery = defineQuery<AgentStatus>("getStatus");

export async function agentWorkflow(task: TaskPayload): Promise<AgentResult> {
  const info = workflowInfo();
  const startedAt = info.startTime.getTime();
  let logicalTick = 0;

  const touch = () => startedAt + (logicalTick += 1);

  let status: AgentStatus = {
    step: "RECEIVED",
    startedAtEpochMs: startedAt,
    updatedAtEpochMs: startedAt,
    message: "Receiving task"
  };

  setHandler(getStatusQuery, () => status);

  const attempts: Record<string, number> = {
    toolInterpret: 0,
    toolAnalyze: 0,
    toolCompose: 0
  };

  try {
    status = { ...status, step: "INTERPRETING", updatedAtEpochMs: touch(), message: "Starting toolInterpret" };
    const interpretation = await toolInterpret(task);
    attempts.toolInterpret += 1;

    status = { ...status, step: "TOOL_1_DONE", updatedAtEpochMs: touch(), message: "Starting toolAnalyze" };
    const analysis = await toolAnalyze(task, interpretation);
    attempts.toolAnalyze += 1;

    status = { ...status, step: "TOOL_2_DONE", updatedAtEpochMs: touch(), message: "Starting toolCompose" };
    const composed = await toolCompose(task, interpretation, analysis);
    attempts.toolCompose += 1;

    status = { ...status, step: "COMPLETED", updatedAtEpochMs: touch(), message: "Returning result" };

    return {
      workflowId: info.workflowId,
      task: task.task,
      intent: interpretation.intent,
      entities: interpretation.entities,
      bullets: analysis.bullets,
      riskFlags: analysis.riskFlags,
      output: composed.result,
      meta: { attempts }
    };
  } catch (err: any) {
    status = {
      ...status,
      step: "FAILED",
      updatedAtEpochMs: touch(),
      message: "Failing workflow",
      lastError: { name: err?.name ?? "Error", message: err?.message ?? String(err) }
    };
    throw err;
  }
}
