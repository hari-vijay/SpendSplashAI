module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GEMINI_API_KEY"
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
- Keep the answer under 80 words.
- Sound friendly and professional.
- Give practical advice.
- Mention money values whenever useful.
- If spending is healthy, appreciate briefly.
- If spending is risky, explain why.
- End with one actionable recommendation.

Example style:

"Your forecast spending is ₹11,100. At this pace you are likely to exhaust your monthly budget before month-end. Reducing discretionary expenses in your highest spending category will improve your remaining balance."

Return plain text only.
`;

    const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
            maxOutputTokens: 500
          }
        })
      }
    );

    const data = await response.json();

    console.log(
      JSON.stringify(data, null, 2)
    );

    if (!response.ok) {

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini request failed."
      });

    }

    let answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    answer = answer
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!answer) {

      answer =
        "I couldn't generate financial advice right now. Please try again.";

    }

    return res.status(200).json({
      answer
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }
};