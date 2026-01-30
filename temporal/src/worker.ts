import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities/tools";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const address = process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE ?? "default";
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "workflowforge-task-queue";

  const connection = await NativeConnection.connect({ address });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    workflowsPath: path.join(__dirname, "workflows"),
    activities
  });

  await worker.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
