# Technical Specification: Async Image Generation Pipeline

## 1. Overview
This document outlines the technical architecture for the asynchronous image generation pipeline using the `fal.ai` library. It details the API interaction flow, data persistence strategy for job tracking, and the schema for managing user selections and prompt history.

## 2. Async Generation Workflow (fal.ai)

We will use the `fal.ai` queue system to handle long-running generation tasks without blocking the user interface.

### 2.1. Workflow Steps
1.  **Client Request:** User submits a "Defect Blueprint" (prompt + parameters) via the Frontend.
2.  **Backend Submission:** The Backend receives the request, creates a `Job` record in the database with status `PENDING`, and submits the request to `fal.ai` using the `fal-client` queue.
3.  **Fal.ai Queue:**
    *   **Submit:** `fal_client.submit(endpoint_id, arguments, webhook_url)`
    *   **Response:** Returns a `request_id`.
4.  **Job Tracking:** Backend updates the `Job` record with the `request_id` and status `QUEUED`.
5.  **Completion Handling (Webhook/Polling):**
    *   **Webhook (Preferred):** `fal.ai` calls our `webhook_url` with the result JSON.
    *   **Polling (Fallback):** Backend periodically checks `fal_client.status(request_id)`.
6.  **Result Storage:** On success, Backend downloads/stores image URLs, updates `Job` status to `COMPLETED`, and saves `GeneratedImage` records.
7.  **Client Notification:** Frontend receives update via WebSocket/Polling that the job is done.

### 2.2. Fal.ai API Usage (Python Example)

```python
import fal_client
import asyncio

async def submit_generation_job(prompt: str, webhook_url: str):
    handler = await fal_client.submit_async(
        "fal-ai/flux/dev", # Example model endpoint
        arguments={"prompt": prompt},
        webhook_url=webhook_url
    )
    return handler.request_id

async def check_status(request_id: str):
    return await fal_client.status_async("fal-ai/flux/dev", request_id, logs=True)
```

## 3. Data Models (Schema Design)

We will use a relational database (PostgreSQL) to maintain strict consistency for jobs and history.

### 3.1. Job Registry (`jobs`)
Tracks the lifecycle of a generation request.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key to Users |
| `fal_request_id` | String | ID returned by fal.ai |
| `status` | Enum | `PENDING`, `QUEUED`, `IN_PROGRESS`, `COMPLETED`, `FAILED` |
| `created_at` | Timestamp | When the user clicked "Generate" |
| `completed_at` | Timestamp | When results were received |
| `blueprint_config` | JSONB | Snapshot of parameters used (prompt, seed, lora_scale) |

### 3.2. Generated Images (`generated_images`)
Stores individual images produced by a job.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `job_id` | UUID | Foreign Key to Jobs |
| `image_url` | String | URL to the image (S3/GCS or fal.ai temp URL) |
| `seed` | Integer | Specific seed for this image |
| `metadata` | JSONB | Technical metadata (resolution, steps) |

### 3.3. Human Selections (`selections`)
Tracks which images the human supervisor approved or rejected.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key to Users |
| `image_id` | UUID | Foreign Key to Generated Images |
| `decision` | Enum | `APPROVED`, `REJECTED`, `NEEDS_REFINEMENT` |
| `feedback_text` | Text | Optional comments from the user |
| `selected_at` | Timestamp | Time of selection |

### 3.4. Prompt History & Lineage (`prompt_history`)
Tracks the evolution of prompts (GEPA optimization trace).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `parent_prompt_id` | UUID | Self-referencing FK (Null for root prompt) |
| `job_id` | UUID | The job that executed this prompt |
| `prompt_text` | Text | The actual text used |
| `mutation_strategy` | String | How this prompt was derived (e.g., "GEPA_CROSSOVER", "MANUAL_EDIT") |
| `score` | Float | Performance score (if auto-evaluated) |

## 4. State Management Strategy

### 4.1. Jobs in Progress
*   **Redis:** Use Redis to store active `request_id`s with a TTL for quick status checks if polling is required.
*   **WebSocket:** Push `job_started`, `job_progress`, and `job_completed` events to the frontend to update the UI in real-time.

### 4.2. User Session
*   **Context:** The frontend will maintain a `SessionContext` containing the current `BlueprintID` and `ActiveJobID`.
*   **Persistence:** All critical state is persisted to Postgres. Redis is only for ephemeral cache/pub-sub.


### Async Generation Pipeline
We utilize `fal.ai`'s async API to handle the heavy lifting of image generation.
1.  **Job Submission:** User requests are queued via `fal_client.submit_async`.
2.  **State Management:** Jobs are tracked in Postgres with status updates via Webhooks.
3.  **Data Lineage:** Every generated image is linked back to its specific Prompt and Blueprint version, enabling full traceability.
