module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

    const { question, context = "" } = body;

    const prompt = `
You are Spend Splash AI Financial Agent.

${context}

User Question:
${question}

Rules:
- Use only the given financial data.
- Never invent numbers.
- Give practical advice.
- Maximum 120 words.
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
            maxOutputTokens: 300
          }
        })
      }
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.status(200).json({
      answer: answer || "No response."
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
};