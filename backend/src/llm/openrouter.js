const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function chatCompletion(messages, { temperature = 0, maxTokens = 1024 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    throw new Error('OPENROUTER_API_KEY is not configured in .env');
  }

  const model = process.env.LLM_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SAP O2C Query',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { chatCompletion };
