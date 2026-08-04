module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error:
        "OPENROUTER_API_KEY is missing. Add it in your Vercel Environment Variables.",
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

const { question, context = "" } = body;
    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required.",
      });
    }

    const prompt = `
You are Spend Splash AI Coach.

You are an intelligent personal finance assistant built into the Spend Splash app.

The following is the user's current financial summary.

${context}

User Question:
${question}

Instructions:

- Answer ONLY using the financial summary above.
- Never invent salaries, balances, expenses or categories.
- Keep the answer below 120 words.
- Use simple, friendly English.
- Use ₹ when mentioning money.
- Mention the remaining balance whenever useful.
- If spending is high, suggest practical ways to reduce it.
- If the user asks about investing, first check whether their remaining balance and spending make sense before giving general guidance.
- Never recommend specific stocks, crypto, or risky investments.
- End with one short actionable suggestion.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://spend-splash-ai.vercel.app",
          "X-Title": "Spend Splash AI",
        },
        body: JSON.stringify({
          model: "inclusionai/ling-3.0-flash:free",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
         max_tokens: 400,
          provider: {
            allow_fallbacks: true,
          },
        }),
      }
    );

    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          "OpenRouter API request failed.",
      });
    }

    console.log("FULL RESPONSE:");
console.log(JSON.stringify(data, null, 2));

const answer =
  data?.choices?.[0]?.message?.content ||
  data?.choices?.[0]?.text ||
  data?.choices?.[0]?.delta?.content ||
  "";

    if (!answer) {
  return res.status(500).json(data);
}

    return res.status(200).json({
      answer: answer.trim(),
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
};