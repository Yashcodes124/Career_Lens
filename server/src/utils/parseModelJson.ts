/**
 * Safely parses JSON from LLM outputs, stripping <think> reasoning blocks,
 * markdown code fences, and conversational preambles/postambles.
 */
export const parseModelJson = <T = unknown>(raw: string): T => {
  if (typeof raw !== "string") {
    throw new Error("No JSON object found in model output");
  }

  let cleaned = raw.trim();
  if (!cleaned) {
    throw new Error("No JSON object found in model output");
  }

  // 1. Strip <think>...</think> reasoning blocks emitted by Nemotron / DeepSeek / Qwen
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Direct parse attempt
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continue to fence and balanced-bracket extraction
  }

  // 3. Extract from ```json ... ``` or ``` ... ``` markdown blocks
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let fenceMatch: RegExpExecArray | null;
  while ((fenceMatch = fenceRegex.exec(cleaned)) !== null) {
    const candidate = fenceMatch[1]?.trim();
    if (candidate) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // Try next block if multiple fences exist
      }
    }
  }

  // 4. Locate balanced JSON object {...} or array [...] inside reasoning text
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startIdx = -1;
  let openChar = "{";
  let closeChar = "}";

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    openChar = "{";
    closeChar = "}";
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    openChar = "[";
    closeChar = "]";
  } else {
    throw new Error("No JSON object found in model output");
  }

  const lastIdx = cleaned.lastIndexOf(closeChar);
  if (lastIdx > startIdx) {
    const sliced = cleaned.slice(startIdx, lastIdx + 1);
    try {
      return JSON.parse(sliced) as T;
    } catch {
      // Fall through to character-level balanced scan
    }
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIdx; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) {
          const candidate = cleaned.slice(startIdx, i + 1);
          return JSON.parse(candidate) as T;
        }
      }
    }
  }

  throw new Error("Malformed JSON object in model output");
};
