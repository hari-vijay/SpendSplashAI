module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing.",
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { question, context = "" } = body;

    if (!question?.trim()) {
      return res.status(400).json({
        error: "Question is required.",
      });
    }

    const prompt = `
You are Spend Splash AI Financial Agent.

The financial summary below is always accurate.

${context}

User Question:
${question}

Rules:
- Use ONLY the provided financial summary.
- Never invent numbers.
- Be concise and practical.
- Explain WHY something happened.
- Give one clear recommendation.
- Mention risks if necessary.
- Encourage savings when appropriate.
- Keep responses below 120 words.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed.",
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return res.status(500).json({
        error: "No response from Gemini.",
      });
    }

    return res.status(200).json({
      answer: answer.trim(),
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message,
    });

  }
};