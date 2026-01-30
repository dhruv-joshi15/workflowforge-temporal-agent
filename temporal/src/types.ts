export type TaskPayload = {
    task: string;
    input?: Record<string, any>;
  };
  
  export type AgentStep =
    | "RECEIVED"
    | "INTERPRETING"
    | "TOOL_1_DONE"
    | "TOOL_2_DONE"
    | "TOOL_3_DONE"
    | "COMPLETED"
    | "FAILED";
  
  export type AgentStatus = {
    step: AgentStep;
    startedAtEpochMs: number;
    updatedAtEpochMs: number;
    message?: string;
    lastError?: { name: string; message: string };
  };
  
  export type ToolInterpretOutput = {
    intent: "summarize" | "extract" | "plan";
    entities: string[];
  };
  
  export type ToolAnalyzeOutput = {
    bullets: string[];
    riskFlags: string[];
  };
  
  export type ToolComposeOutput = {
    result: {
      title: string;
      summary: string;
      nextActions: string[];
    };
  };
  
  export type AgentResult = {
    workflowId: string;
    task: string;
    intent: ToolInterpretOutput["intent"];
    entities: string[];
    bullets: string[];
    riskFlags: string[];
    output: ToolComposeOutput["result"];
    meta: { attempts: Record<string, number> };
  };
  