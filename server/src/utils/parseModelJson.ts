// Models sometimes wrap JSON in code fences, add a sentence before it, or emit
// reasoning blocks. This extracts the outermost JSON object and parses it.
// It does not check the shape; callers must validate with Zod.
export const parseModelJson = (content: string): unknown => {
  const withoutReasoning = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const withoutFences = withoutReasoning.replace(/```(?:json)?/gi, "");

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }

  return JSON.parse(withoutFences.slice(start, end + 1));
};
