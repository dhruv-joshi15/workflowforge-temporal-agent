import { Context } from "@temporalio/activity";
import type {
  TaskPayload,
  ToolInterpretOutput,
  ToolAnalyzeOutput,
  ToolComposeOutput
} from "../types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function toolInterpret(task: TaskPayload): Promise<ToolInterpretOutput> {
  const log = Context.current().log;
  log.info("toolInterpret running", { task: task.task });

  await sleep(150);

  const t = task.task.toLowerCase();
  const intent: ToolInterpretOutput["intent"] =
    t.includes("plan") || t.includes("steps") ? "plan" :
    t.includes("extract") || t.includes("entities") ? "extract" :
    "summarize";

  const entities = Array.from(
    new Set(
      task.task
        .split(/[\s,.;:!?()]+/)
        .filter((w) => w.length >= 4)
        .slice(0, 8)
    )
  );

  return { intent, entities };
}

export async function toolAnalyze(
  task: TaskPayload,
  interpretation: ToolInterpretOutput
): Promise<ToolAnalyzeOutput> {
  const log = Context.current().log;
  log.info("toolAnalyze running", { intent: interpretation.intent });

  await sleep(200);

  const bullets: string[] = [];
  bullets.push(`Intent detected: ${interpretation.intent}`);
  bullets.push(`Entities: ${interpretation.entities.join(", ") || "(none)"}`);
  bullets.push(`Task length: ${task.task.length} chars`);

  const riskFlags: string[] = [];
  if (task.task.length > 240) riskFlags.push("LONG_TASK");
  if (task.task.toLowerCase().includes("urgent")) riskFlags.push("URGENT");
  if (task.task.toLowerCase().includes("money")) riskFlags.push("FINANCE_MENTION");

  return { bullets, riskFlags };
}

export async function toolCompose(
  task: TaskPayload,
  interpretation: ToolInterpretOutput,
  analysis: ToolAnalyzeOutput
): Promise<ToolComposeOutput> {
  const log = Context.current().log;
  log.info("toolCompose running");

  await sleep(150);

  const title =
    interpretation.intent === "plan" ? "Execution Plan" :
    interpretation.intent === "extract" ? "Extracted Entities" :
    "Summary";

  const summary =
    interpretation.intent === "extract"
      ? `Key entities: ${interpretation.entities.join(", ") || "none detected"}.`
      : `Producing structured output for: "${task.task.slice(0, 80)}${task.task.length > 80 ? "…" : ""}"`;

  const nextActions =
    interpretation.intent === "plan"
      ? ["Confirming scope", "Running tools in sequence", "Reviewing output for correctness"]
      : ["Reviewing extracted signals", "Deciding follow-up action", "Sharing the result"];

  void analysis;

  return { result: { title, summary, nextActions } };
}
