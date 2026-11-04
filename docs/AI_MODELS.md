# AI Models

TrueHire uses a provider-agnostic AI layer. The backend communicates with OpenAI-compatible APIs, allowing Groq, NVIDIA NIM, Google Gemini, and Ollama to be swapped through environment variables.

## Recommended Setup

Use Groq as the primary provider:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=[https://api.groq.com/openai/v1](https://api.groq.com/openai/v1)
GROQ_MODEL=qwen/qwen3.8-27b
```

## Model Recommendations

| Model                         | Provider   | Speed          | Quality   | Best Use                                                  | Status                           |
| ----------------------------- | ---------- | -------------- | --------- | --------------------------------------------------------- | -------------------------------- |
| `qwen/qwen3.8-27b`            | Groq       | Very fast      | High      | Resume parsing, matching, interview questions, evaluation | **Recommended primary**          |
| `openai/gpt-oss-20b`          | Groq       | Fastest        | Good      | Lightweight extraction and quick interview responses      | **Recommended fast fallback**    |
| `openai/gpt-oss-120b`         | Groq       | Fast           | Very high | Final evaluation, complex reasoning, rubric scoring       | **Recommended evaluation model** |
| `meta/llama-3.1-70b-instruct` | NVIDIA NIM | Medium         | High      | Backup provider and general reasoning                     | Good secondary option            |
| `qwen3:4b`                    | Ollama     | Fast locally   | Medium    | Offline local development                                 | Good local default               |
| `qwen3:8b`                    | Ollama     | Medium locally | High      | Better local interview evaluation                         | Use if hardware allows           |

## Why Qwen 3.8 27B Is the Best Default

`qwen/qwen3.8-27b` is the best default for TrueHire because it supports:

- Fast inference through Groq.
- Large context handling.
- JSON mode.
- Tool use.
- Reasoning and instruct modes.
- Structured output suitable for resume parsing and interview evaluation.

Groq documents it as the successor to `qwen/qwen3.6-27b`, with a 131K context window. [40][41]

## Model Routing Strategy

Use different models for different workloads:

```text
Resume parsing              → qwen/qwen3.8-27b
Job skill extraction        → openai/gpt-oss-20b
Interview question creation → qwen/qwen3.8-27b
Answer feedback             → openai/gpt-oss-20b
Final evaluation            → openai/gpt-oss-120b
Local development           → qwen3:4b via Ollama
```

This reduces latency while preserving quality where it matters most.

## Provider Fallback

Recommended fallback order:

```text
Groq Qwen 3.8 27B
    ↓
Groq GPT-OSS 20B
    ↓
NVIDIA Llama 3.1 70B
    ↓
Ollama Qwen3 4B
```

## Deprecated Models to Avoid

Do not use these in new configurations:

| Model                     | Provider | Reason                                                        |
| ------------------------- | -------- | ------------------------------------------------------------- |
| `llama-3.3-70b-versatile` | Groq     | Deprecated for free and developer-tier usage. [41]            |
| `llama-3.1-8b-instant`    | Groq     | Deprecated for free and developer-tier usage. [41]            |
| `qwen/qwen3.6-27b`        | Groq     | Replaced by `qwen/qwen3.8-27b`. [41]                          |
| `gemini-2.5-flash`        | Google   | Deprecated and no longer selectable in Google AI Studio. [32] |

## Rate Limits

Free-tier limits vary by provider and account. Groq’s published baseline for its current free models is commonly reported as 30 requests per minute, 1,000 requests per day, 8,000 tokens per minute, and 200,000 tokens per day at the organization level. [45]

NVIDIA’s prototype tier is rate-limited, with up to 40 requests per minute reported for many models. [37][43]

Because limits can change, TrueHire should implement:

- Provider fallback.
- Request retries with exponential backoff.
- Timeout handling.
- User-facing AI-unavailable messages.
- Caching for repeated resume or job analyses.
