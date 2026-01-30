# WorkflowForge – Temporal Agent Runtime

A minimal, production-minded agent runtime built using **Temporal (Node.js SDK)** and **Next.js**.

This project demonstrates how an agent-style system can be orchestrated using
deterministic workflows and side-effectful activities.

---

## High-Level Architecture

- **Temporal** is the single orchestration layer
- **Next.js** is used only to:
  - Trigger workflow execution
  - Poll execution status
  - Render final results
- **Activities** represent isolated tools
- **Workflows** coordinate tools deterministically

User → Next.js → Temporal Workflow → Activities → Result


---

## Workflow Design

The workflow:
1. Accepts a user task
2. Interprets the task (intent detection)
3. Analyzes entities and structure
4. Composes a structured result
5. Returns execution metadata

The workflow code is **fully deterministic** and contains no side effects.

---

## Activities (Tools)

Each tool is implemented as a **separate Temporal Activity**:

- `toolInterpret` – detects intent
- `toolAnalyze` – extracts entities
- `toolCompose` – produces structured output

Activities:
- Are independently retryable
- Are the only place where side effects occur
- Have explicit retry & timeout policies

---

## Failure Handling & Retries

- Retries are handled at the **Temporal activity layer**
- Workflow logic remains simple and deterministic
- Failures return structured error state to the UI

---

## Frontend (Next.js)

The frontend:
- Submits tasks to start workflows
- Polls workflow status via a query
- Displays execution state and final output

The UI does **not** contain business logic.

---

## Running the Project

### 1. Start Temporal (dev mode)

```bash
temporal server start-dev \
  --ip 127.0.0.1 \
  --port 7233 \
  --ui-ip 127.0.0.1 \
  --ui-port 8081

Temporal UI: http://127.0.0.1:8081

Start the Temporal worker -
cd temporal
npm install
npm run worker

Start the Next.js app -
cd apps/web
npm install
npm run dev

App: http://localhost:3000


Determinism Guarantees -

No non-deterministic APIs (Date, Math.random, network calls) are used in workflows
All side effects are isolated to activities
Workflow replay is safe and predictable

Production Considerations -

If extended to production, this system would:
Persist workflow results for replay/debugging
Replace mocked tools with MCP-compatible tools
Add authentication and rate limiting
Support long-running and human-in-the-loop workflows


Notes -

This project intentionally avoids UI polish and real LLM calls in favor of
demonstrating correct orchestration, failure handling, and system design.

