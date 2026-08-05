module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing."
    });
  }

  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const {
      question,
      context = ""
    } = body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required."
      });
    }

    const prompt = `
You are Spend Splash AI.

You are an intelligent personal finance assistant.

Use ONLY the financial report below.

${context}

User Question:
${question}

Rules:

- Never invent numbers.
- Keep answer below 120 words.
- Give practical advice.
- Mention risks if needed.
- End with one useful tip.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          contents: [

            {

              role: "user",

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

    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {

      return res.status(response.status).json({

        error:
          data.error?.message ||
          "Gemini API Error"

      });

    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {

      return res.status(500).json({

        error: "No response generated."

      });

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