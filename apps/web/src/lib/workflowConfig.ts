export const workflowConfig = {
    address: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
    namespace: process.env.TEMPORAL_NAMESPACE ?? "default",
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "workflowforge-task-queue",
    workflowName: process.env.TEMPORAL_WORKFLOW_NAME ?? "agentWorkflow",
    statusQueryName: "getStatus"
  };
  
  export const TEMPORAL_ADDRESS = workflowConfig.address;
  export const TEMPORAL_NAMESPACE = workflowConfig.namespace;
  export const TASK_QUEUE = workflowConfig.taskQueue;
  export const WORKFLOW_NAME = workflowConfig.workflowName;
  export const STATUS_QUERY_NAME = workflowConfig.statusQueryName;
  