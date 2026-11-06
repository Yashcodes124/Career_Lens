import "dotenv/config";

async function verifyAi() {
  const provider = process.env.AI_PROVIDER || "groq";
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    "";
  const baseUrl =
    process.env.AI_BASE_URL ||
    process.env.GROQ_BASE_URL ||
    process.env.NVIDIA_BASE_URL ||
    "https://api.groq.com/openai/v1";
  const model =
    process.env.AI_MODEL ||
    process.env.GROQ_MODEL ||
    process.env.NVIDIA_MODEL ||
    "qwen/qwen3.8-27b";

  console.log(`\n--- Testing AI Provider: ${provider} ---`);
  console.log(`Endpoint: ${baseUrl}`);
  console.log(`Model:    ${model}`);
  console.log(
    `API Key:  ${apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "MISSING!"}\n`,
  );

  if (!apiKey) {
    console.error("❌ Error: No API key found in server/.env");
    process.exit(1);
  }

  const endpointUrl = baseUrl.endsWith("/")
    ? `${baseUrl}chat/completions`
    : `${baseUrl}/chat/completions`;

  const start = Date.now();

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant. Return valid JSON only without markdown code fences.",
          },
          {
            role: "user",
            content:
              'Return JSON: {"status": "ok", "message": "connection verified"}',
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    const elapsed = Date.now() - start;

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        `❌ HTTP ${response.status} Error (${elapsed}ms):`,
        errText,
      );
      process.exit(1);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    console.log(`✓ Response received in ${elapsed}ms:`);
    console.log(content);
    console.log("\n✅ AI Provider is reachable and returning responses.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Connection failed:", message);
    process.exit(1);
  }
}

void verifyAi();
