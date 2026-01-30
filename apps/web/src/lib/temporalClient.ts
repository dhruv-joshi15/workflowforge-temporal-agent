import { Connection, Client } from "@temporalio/client";
import { workflowConfig } from "./workflowConfig";

let cached: { client: Client; connection: Connection } | null = null;

export async function getClient(): Promise<Client> {
  if (cached) return cached.client;

  const connection = await Connection.connect({ address: workflowConfig.address });
  const client = new Client({ connection, namespace: workflowConfig.namespace });

  cached = { client, connection };
  return client;
}
