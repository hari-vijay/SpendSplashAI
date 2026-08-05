module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "No AI provider configured."
    });
  }

  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const {
      question = "",
      context = ""
    } = body;

    if (!question.trim()) {
      return res.status(400).json({
        error: "Question is required."
      });
    }

    const prompt = `
You are Spend Splash AI.

You are a premium AI Financial Coach similar to CRED.

You will ALWAYS answer using ONLY the financial report below.

=========================
FINANCIAL REPORT
=========================

${context}

=========================
USER QUESTION
=========================

${question}

=========================
RULES
=========================

- Never invent numbers.
- Use only values from the report.
- Always answer in complete sentences.
- Never return incomplete text.
- Keep answers below 80 words.
- Friendly and professional.
- Give practical advice.
- Mention money values whenever useful.
- Appreciate good spending habits.
- Explain risks if spending is unhealthy.
- Finish with one actionable recommendation.

Return plain text only.
`;

    // ==========================================================
    // 1. TRY GEMINI FIRST
    // ==========================================================

    if (GEMINI_API_KEY) {

      try {

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 300
              }
            })
          }
        );

        const geminiData = await geminiResponse.json();

        if (geminiResponse.ok) {

          let answer =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

          answer = answer
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          if (answer) {

            console.log("✅ Gemini Success");

            return res.status(200).json({
              answer
            });

          }

        }

        console.log("⚠ Gemini Failed -> Switching to OpenRouter");

      } catch (e) {

        console.log("⚠ Gemini Exception -> OpenRouter");

      }

    }

    // ==========================================================
    // 2. FALLBACK TO OPENROUTER
    // ==========================================================

    if (!OPENROUTER_API_KEY) {

      return res.status(500).json({
        error: "Both Gemini and OpenRouter unavailable."
      });

    }

    const orResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://spend-splash-ai.vercel.app",
          "X-Title": "Spend Splash AI"
        },
        body: JSON.stringify({

          model: "inclusionai/ling-3.0-flash:free",

          messages: [
            {
              role: "user",
              content: prompt
            }
          ],

          temperature: 0.4,

          max_tokens: 300,

          provider: {
            allow_fallbacks: true
          }

        })
      }
    );

    const orData = await orResponse.json();

   if (!orResponse.ok) {

  if (orResponse.status === 429) {

    return res.status(200).json({
      answer:
        "🤖 AI is taking a short break. Our free daily AI quota has been reached. Please try again later."
    });

  }

  return res.status(200).json({
    answer:
      "⚠️ AI is temporarily unavailable. Please try again in a few minutes."
  });

}

    let answer =
      orData?.choices?.[0]?.message?.content ||
      "";

    answer = answer
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!answer) {

      answer =
        "I couldn't generate financial advice right now.";

    }

    console.log("✅ OpenRouter Success");

    return res.status(200).json({
      answer
    });

  }

  catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }

};