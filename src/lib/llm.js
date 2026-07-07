function normalizeOpenAIUrl(url) {
  const clean = (url || '').trim();
  if (!clean) return 'https://api.openai.com/v1/chat/completions';
  return clean.endsWith('/v1') ? `${clean}/chat/completions` : clean;
}

function geminiPayloadToMessages(payload) {
  const parts = payload?.contents?.[0]?.parts || [];
  const content = parts.map(part => {
    if (part.text) return { type: 'text', text: part.text };
    if (part.inlineData?.data) {
      return {
        type: 'image_url',
        image_url: { url: `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}` }
      };
    }
    return null;
  }).filter(Boolean);

  return [{ role: 'user', content: content.length === 1 && content[0].type === 'text' ? content[0].text : content }];
}

export async function callLLM({ provider, baseUrl, apiKey, model, payload }) {
  if (!apiKey) return { error: "请配置 API Key" };

  try {
    const isGemini = provider === 'gemini';
    const response = await fetch(
      isGemini
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        : normalizeOpenAIUrl(baseUrl),
      isGemini
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: geminiPayloadToMessages(payload), temperature: 0.4 })
          }
    );
    const data = await response.json();
    if (!response.ok || data.error) return { error: data.error?.message || `请求失败 (${response.status})` };
    const result = isGemini
      ? { text: data.candidates?.[0]?.content?.parts?.[0]?.text }
      : { text: data.choices?.[0]?.message?.content };
    return result.text ? result : { error: "AI 没有返回内容" };
  } catch (error) {
    return { error: "网络错误" };
  }
}
