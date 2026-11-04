# Environment Variables

Copy `.env.example` to `.env` and fill in your own credentials.

```bash
cp .env.example .env
```

Never commit `.env`, API keys, database URLs, or JWT secrets.

## Database

| Variable            | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `DATABASE_URL`      | PostgreSQL connection string used by the application   |
| `DIRECT_URL`        | Direct PostgreSQL connection used by Prisma migrations |
| `POSTGRES_DB`       | Local PostgreSQL database name                         |
| `POSTGRES_USER`     | Local PostgreSQL username                              |
| `POSTGRES_PASSWORD` | Local PostgreSQL password                              |
| `POSTGRES_PORT`     | Local PostgreSQL port                                  |

For Supabase, use the pooled connection for `DATABASE_URL` and the direct connection for `DIRECT_URL`.

## Server

| Variable     | Description                   |
| ------------ | ----------------------------- |
| `PORT`       | Backend server port           |
| `NODE_ENV`   | `development` or `production` |
| `CLIENT_URL` | Allowed frontend origin       |
| `SERVER_URL` | Backend base URL              |

## Authentication

| Variable         | Description              |
| ---------------- | ------------------------ |
| `JWT_SECRET`     | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiration duration  |

Use a long random value for `JWT_SECRET`.

## AI Configuration

| Variable        | Description                                              |
| --------------- | -------------------------------------------------------- |
| `AI_PROVIDER`   | Active provider: `groq`, `nvidia`, `gemini`, or `ollama` |
| `AI_BASE_URL`   | OpenAI-compatible base URL                               |
| `AI_API_KEY`    | API key for the active provider                          |
| `AI_MODEL`      | Default model                                            |
| `AI_TIMEOUT_MS` | AI request timeout                                       |

## Groq

| Variable                | Description                      |
| ----------------------- | -------------------------------- |
| `GROQ_API_KEY`          | Groq API key                     |
| `GROQ_BASE_URL`         | `https://api.groq.com/openai/v1` |
| `GROQ_MODEL`            | Primary model                    |
| `GROQ_FAST_MODEL`       | Fast fallback model              |
| `GROQ_EVALUATION_MODEL` | High-quality evaluation model    |

Recommended values:

```env
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_FAST_MODEL=openai/gpt-oss-20b
GROQ_EVALUATION_MODEL=openai/gpt-oss-120b
```

## NVIDIA NIM

| Variable          | Description                           |
| ----------------- | ------------------------------------- |
| `NVIDIA_API_KEY`  | NVIDIA API key                        |
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL`    | NVIDIA model ID                       |

Recommended value:

```env
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
```

## Ollama

| Variable          | Description      |
| ----------------- | ---------------- |
| `OLLAMA_BASE_URL` | Local Ollama URL |
| `OLLAMA_MODEL`    | Local model name |

Recommended value:

```env
OLLAMA_MODEL=qwen3:4b
```

## Greenhouse

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `GREENHOUSE_BOARDS`      | Comma-separated list of board tokens          |
| `GREENHOUSE_BOARD_TOKEN` | Active board token                            |
| `GREENHOUSE_COMPANY`     | Company name associated with the active board |

Example:

```env
GREENHOUSE_BOARDS=stripe,vercel,cloudflare,datadog,discord
GREENHOUSE_BOARD_TOKEN=stripe
GREENHOUSE_COMPANY=stripe
```
