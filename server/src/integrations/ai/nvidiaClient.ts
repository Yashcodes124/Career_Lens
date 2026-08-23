//server/src/integrations/ai/nvidiaClient.ts

import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export const analyzeResumeWithNvidia = async (prompt: string) => {
  const model = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b";

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
  });
  

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("NVIDIA API returned an empty response");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("NVIDIA API returned invalid JSON");
  }
};
