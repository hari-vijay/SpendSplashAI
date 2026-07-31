
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing. Add it in your Vercel Environment Variables."
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const {
      question,
      context = {}
    } = body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required."
      });
    }

    const prompt = `
You are Spend Splash AI.

You are a friendly personal finance coach.

The user is using the Spend Splash expense tracker.

Current Financial Information

Monthly Salary:
₹${context.monthlySalary || 0}

Savings Goal:
₹${context.savingsGoal || 0}

Total Expenses:
₹${context.totalExpenses || 0}

Remaining Balance:
₹${context.remainingBalance || 0}

Category Spending:
${JSON.stringify(context.categories || {}, null, 2)}

Recent Expenses:
${JSON.stringify(context.recentExpenses || [], null, 2)}

User Question:
${question}

Instructions

- Answer only based on the information above.
- Be friendly and practical.
- Keep the answer below 120 words.
- Use simple English.
- Mention remaining balance whenever useful.
- Give saving suggestions if spending is high.
- Never recommend individual stocks.
- Never invent numbers.
- If information is missing, politely mention it.
`;


    console.log(prompt);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
            temperature: 0.5,
            maxOutputTokens: 180
          }
        })
      }
    );

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      console.error(data);

      return res.status(500).json({
        error: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({
      answer: answer.trim()
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Internal Server Error"
    });
  }
};