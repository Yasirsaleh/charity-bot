exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message, orgName, orgInfo } = JSON.parse(event.body);

    // API key stored securely in Netlify environment variables
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    const systemPrompt = `أنت مساعد آلي لـ "${orgName || 'الجمعية'}". مهمتك الرد على استفسارات المستفيدين بلغة عربية واضحة وودية.

معلومات الجمعية:
${orgInfo || 'لا توجد معلومات إضافية'}

تعليمات مهمة:
- رد بشكل مختصر ومفيد (لا تتجاوز 4 أسطر إلا إذا السؤال يحتاج تفصيل)
- استخدم لغة بسيطة وودية
- إذا لم تعرف الإجابة، اطلب من المستفيد التواصل مع الجمعية مباشرة
- لا تختلق معلومات غير موجودة
- استخدم الرموز التعبيرية باعتدال`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error.message })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: data.content[0].text })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
