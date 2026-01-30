import { Connection, Client } from "@temporalio/client";

export async function getTemporalClient() {
  const address = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE ?? "default";
  const connection = await Connection.connect({ address });
  return new Client({ connection, namespace });
}
