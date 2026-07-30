/**
 * Thin, swappable abstraction over the LLM provider.
 *
 * Only this file knows it's talking to OpenAI. If you want to switch to
 * Anthropic, Gemini, or a local model, reimplement `getCompletion` and
 * leave everything else (repoAnalyzer.ts, prompts.ts) untouched.
 */

export class MissingApiKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY or OPENROUTER_API_KEY is not set");
    this.name = "MissingApiKeyError";
  }
}

export class AiRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

interface GetCompletionArgs {
  systemPrompt: string;
  userPrompt: string;
}

export async function getCompletion({
  systemPrompt,
  userPrompt,
}: GetCompletionArgs): Promise<string> {
  const openAiKey = process.env.OPENAI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openAiKey && !openRouterKey) {
    throw new MissingApiKeyError();
  }

  const isOpenAI = Boolean(openAiKey);
  const isOpenRouter = !isOpenAI && Boolean(openRouterKey);

  const apiKey = openAiKey || openRouterKey;
  const model = isOpenAI
    ? process.env.OPENAI_MODEL || "gpt-4o-mini"
    : process.env.OPENROUTER_MODEL || "gpt-oss-120b";

  const baseUrl = isOpenAI
    ? process.env.OPENAI_API_URL || "https://api.openai.com/v1"
    : process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1";
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const body: Record<string, unknown> = {
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (isOpenAI) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiRequestError(
      `AI provider request failed (${res.status}): ${text}`,
      res.status
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new AiRequestError("AI provider returned an empty response");
  }

  return content;
}
