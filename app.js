const categories = {
  Food: ["grocery", "swiggy", "zomato", "restaurant", "cafe", "coffee", "food"],
  Transport: ["uber", "ola", "metro", "fuel", "petrol", "bus", "train"],
  Shopping: ["amazon", "flipkart", "clothes", "shopping", "myntra"],
  Bills: [
    "electricity",
    "rent",
    "wifi",
    "internet",
    "phone",
    "netflix",
    "spotify",
    "bill",
  ],
  Health: ["pharmacy", "doctor", "gym", "medical", "health"],
  Other: [],
};

const blank = () => ({
  income: 0,
  goal: 0,
  budgets: {
    Food: 3500,
    Transport: 2000,
    Shopping: 2500,
    Bills: 4500,
    Health: 1500,
    Other: 1500,
  },
  expenses: [],
});

let state =
  JSON.parse(localStorage.getItem("spend-splash-offline") || "null") ||
  blank();

const $ = (selector) => {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`Missing element: ${selector}`);

    return {
      textContent: "",
      innerHTML: "",
      value: "",
      style: {},
      onclick: null,
      reset() {},
      focus() {},
      showModal() {},
      close() {}
    };
  }

  return element;
};

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const save = () =>
  localStorage.setItem(
    "spend-splash-offline",
    JSON.stringify(state)
  );

const total = () =>
  state.expenses.reduce((sum, item) => sum + item.amount, 0);

const balance = () =>
  state.income - total() - state.goal;

function totals() {
  return Object.fromEntries(
    Object.keys(categories).map((category) => [
      category,
      state.expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0),
    ])
  );
}

function render() {

  const spent = total();

  const left = balance();

  const byCategory = totals();

  const percent = state.income
    ? Math.min(
        100,
        Math.round((spent / state.income) * 100)
      )
    : 0;

  const top = Object.entries(byCategory).sort(
    (a, b) => b[1] - a[1]
  )[0];

  $("#balance-main").textContent = money(left);

  $("#balance-story").textContent = state.income
    ? `${money(spent)} spent from ${money(
        state.income
      )} salary${
        state.goal
          ? `, with ${money(state.goal)} saved for my goal`
          : ""
      }.`
    : "Add monthly salary to start tracking.";

 $("#spent-line").style.width = percent + "%";

if (percent >= 100) {
    $("#spent-line").style.background = "#e53935"; // Red
} else if (percent >= 80) {
    $("#spent-line").style.background = "#f4b400"; // Orange
} else {
    $("#spent-line").style.background = "#2ecc71"; // Green
}

  $("#spent-label").textContent =
    `${money(spent)} spent (${percent}%)`;

  $("#salary-label").textContent =
    `${money(state.income)} salary`;

  if (percent >= 100) {

    $("#health-pill").textContent = "Budget Exceeded";
    $("#health-pill").style.background = "#ffebee";
    $("#health-pill").style.color = "#c62828";

    $("#balance-main").style.color = "#ff6b6b";

    $("#balance-story").style.color = "#ffd6d6";

    $("#spent-label").style.color = "#ffb3b3";

    $("#salary-label").style.color = "#ffb3b3";

    $("#spent-line").style.background = "#e53935";

} else if (percent >= 80) {

    $("#health-pill").textContent = "Watch Spending";
    $("#health-pill").style.background = "#fff3cd";
    $("#health-pill").style.color = "#8a5a00";

    $("#balance-main").style.color = "#ffffff";

    $("#balance-story").style.color = "#c6f2e8";

    $("#spent-label").style.color = "#c6f2e8";

    $("#salary-label").style.color = "#c6f2e8";

    $("#spent-line").style.background = "#f4b400";

} else {

    $("#health-pill").textContent = "On Track";
    $("#health-pill").style.background = "#d9f2e8";
    $("#health-pill").style.color = "#0a6254";

    $("#balance-main").style.color = "#ffffff";

    $("#balance-story").style.color = "#c6f2e8";

    $("#spent-label").style.color = "#c6f2e8";

    $("#salary-label").style.color = "#c6f2e8";

    $("#spent-line").style.background = "#2ecc71";

}

  $("#ring-value").textContent =
    percent + "%";

  $("#spend-ring").style.background =
    `conic-gradient(#0a6254 0 ${percent}%, #e9efec ${percent}% 100%)`;

  $("#month-label").textContent =
    new Date().toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });

  const colors = [
    "#0a6254",
    "#2b9d86",
    "#ef9a49",
    "#d85c56",
  ];

  $("#category-list").innerHTML =
    Object.entries(byCategory)
      .filter((x) => x[1])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(
        ([category, value], i) =>
          `<div class="category-item">
              <span>
                <i style="background:${colors[i]}"></i>
                ${category}
              </span>
              <b>${money(value)}</b>
           </div>`
      )
      .join("") ||
    "<small>No categories yet.</small>";

  $("#budget-list").innerHTML =
    Object.entries(state.budgets)
      .map(([category, budget]) => {

        const spentAmount = byCategory[category];

        const percentage = Math.min(
          100,
          Math.round((spentAmount / budget) * 100)
        );

        return `
        <div class="budget-row">

            <div>

                <span>
                    ${category}
                    <small>
                        ${money(spentAmount)} / ${money(budget)}
                    </small>
                </span>

                <b>${percentage}%</b>

            </div>

            <div class="track ${spentAmount > budget ? "over" : ""}">

                <i style="width:${percentage}%"></i>

            </div>

        </div>
        `;
      })
      .join("");

  $("#plan-income").textContent =
    money(state.income);

  $("#plan-spend").textContent =
    "-" + money(spent);

  $("#plan-goal").textContent =
    "-" + money(state.goal);

  $("#plan-left").textContent =
    money(left);
$("#transaction-list").innerHTML =
  [...state.expenses]
    .reverse()
    .map((expense, index) => `
      <div class="transaction">

        <span class="icon">
          ${expense.category[0]}
        </span>

        <span>
          ${expense.name}
          <small>
            ${expense.category} ·
            ${new Date(expense.date + "T00:00:00").toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </small>
        </span>

        <div class="transaction-actions">

          <b>
            -${money(expense.amount)}
          </b>

          <button
            class="delete-expense"
            data-index="${state.expenses.length - 1 - index}">
            🗑
          </button>

        </div>

      </div>
    `)
    .join("") ||
  "<p>No expenses yet — add one above.</p>";

  suggest(left, spent, top, byCategory);
}
function suggest(left, spent, top, byCategory) {

  const label = document.querySelector(".ai-panel .kicker");

  if (label) {
    label.textContent = "SPEND SPLASH COACH";
  }

  const over = Object.entries(byCategory).find(
    ([category, value]) => value > state.budgets[category]
  );

  let title;
  let body;

  if (!state.income) {

    title = "Start with monthly salary";

    body =
      "Add your salary once. Every expense will then update your remaining balance.";

  } else if (over) {

    title = `${over[0]} is over budget`;

    body =
      `You spent ${money(over[1])} in ${over[0]}. Pause optional expenses in that category until next month.`;

  } else if (left < 0) {

    title = "You are over your plan";

    body =
      `Your balance is ${money(left)}. Focus on necessary spending until your next salary.`;

  } else {

    title = `${money(left)} is available`;

    body =
      `You have spent ${money(spent)} so far. Keep a part of the balance for essentials and your savings goal.`;

  }

  $("#ai-summary").textContent = state.income
    ? `${state.expenses.length} expense${state.expenses.length === 1 ? "" : "s"} tracked. Your plan updates immediately.`
    : "Your personal spending summary will appear here.";

  $("#ai-result").innerHTML = `
      <span>SMART CHECK-IN</span>
      <strong>${title}</strong>
      <p>${body}</p>
  `;

  const askRow = document.querySelector(".ask-row");

  if (askRow) {
    askRow.style.display = "none";
  }
}

function categoryFor(text) {

  text = text.toLowerCase();

  return (
    Object.keys(categories).find((category) =>
      categories[category].some((keyword) =>
        text.includes(keyword)
      )
    ) || "Other"
  );
}

function addExpense(expense) {

  state.expenses.push(expense);

  save();

  render();
}

function openExpense() {

  $("#manual-category").innerHTML =
    Object.keys(categories)
      .map(
        (category) =>
          `<option>${category}</option>`
      )
      .join("");

  $("#manual-form").reset();

  $("#expense-dialog").showModal();

  $("#manual-name").focus();
}

function openPlan() {

  $("#income-input").value =
    state.income || "";

  $("#goal-input").value =
    state.goal || "";

  $("#plan-dialog").showModal();
}

$("#add-manual").onclick = openExpense;

$("#cancel-expense").onclick = () =>
  $("#expense-dialog").close();

$("#manual-form").onsubmit = (e) => {

  e.preventDefault();

  addExpense({

    name: $("#manual-name").value.trim(),

    amount: +$("#manual-amount").value,

    category: $("#manual-category").value,

    date: new Date()
      .toISOString()
      .slice(0, 10),

  });

  $("#expense-dialog").close();

  $("#parse-feedback").textContent =
    "Expense added. Your balance has been updated.";
};

$("#quick-form").onsubmit = (e) => {

  e.preventDefault();

  const text = $("#quick-input").value;

  const match =
    text.match(
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)/
    );

  if (!match) {

    $("#parse-feedback").textContent =
      "Add an amount, for example: Coffee 120";

    return;
  }

  addExpense({

    name:
      text.replace(match[0], "").trim() ||
      "Expense",

    amount: +match[1].replaceAll(",", ""),

    category: categoryFor(text),

    date: new Date()
      .toISOString()
      .slice(0, 10),

  });

  e.target.reset();

  $("#parse-feedback").textContent =
    "Expense added. Your balance has been updated.";
};

["#salary-edit", "#salary-edit-2"].forEach(
  (id) => {
    $(id).onclick = openPlan;
  }
);
$("#cancel-plan").onclick = () =>
  $("#plan-dialog").close();

$("#plan-form").onsubmit = (e) => {

  e.preventDefault();

  state.income = +$("#income-input").value;

  state.goal = +$("#goal-input").value || 0;

  save();

  $("#plan-dialog").close();

  render();
};

$("#salary-form").onsubmit = (e) => {

  e.preventDefault();

  state.income = +$("#starting-salary").value;

  state.goal = +$("#starting-goal").value || 0;

  save();

  $("#salary-dialog").close();

  render();
};

$("#edit-budget").onclick = () => {

  $("#budget-fields").innerHTML =
    Object.entries(state.budgets)
      .map(
        ([category, value]) => `
        <label class="budget-field">

          ${category}

          <input
            data-budget="${category}"
            type="number"
            min="0"
            value="${value}">

        </label>
      `
      )
      .join("");

  $("#budget-dialog").showModal();
};

$("#cancel-budget").onclick = () =>
  $("#budget-dialog").close();

$("#budget-form").onsubmit = (e) => {

  e.preventDefault();

  document
    .querySelectorAll("[data-budget]")
    .forEach((input) => {

      state.budgets[input.dataset.budget] =
        +input.value;

    });

  save();

  $("#budget-dialog").close();

  render();
};

$("#reset-data").onclick = () => {

  if (
    confirm(
      "Clear salary, goals, and all expenses?"
    )
  ) {

    state = blank();

    save();

    render();

    $("#salary-dialog").showModal();
  }
};

render();

document.addEventListener("click", (e) => {

  if (!e.target.classList.contains("delete-expense")) return;

  const index = Number(e.target.dataset.index);

  if (confirm("Delete this expense?")) {

    state.expenses.splice(index, 1);

    save();

    render();

  }

});
if (!state.income) {

  setTimeout(() => {

    $("#salary-dialog").showModal();

  }, 120);

}
setTimeout(() => {

  const panel = document.querySelector(".ai-panel");

  if (!panel) return;

  const kicker = panel.querySelector(".kicker");

  if (kicker) {
    kicker.innerHTML =
      'SPEND SPLASH AI <span class="live">CHAT</span>';
  }

  const row = panel.querySelector(".ask-row");

  if (!row) return;

  row.style.display = "flex";

  row.insertAdjacentHTML(
    "afterend",
    `
    <form id="ai-chat-form" class="splash-chat">

      <input
        id="ai-chat-input"
        maxlength="500"
        placeholder="Ask about my salary, balance or savings...">

      <button>

        Ask

      </button>

    </form>

    <div
      id="ai-chat-answer"
      class="splash-answer"
      aria-live="polite">

    </div>

    <small
      id="ai-chat-status"
      class="splash-status">

      AI chat works after the app is deployed.

    </small>
    `
  );

  const css = document.createElement("style");

  css.textContent = `
.splash-chat{
display:flex;
gap:8px;
margin-top:12px
}

.splash-chat input{
flex:1;
min-width:0;
border:0;
border-radius:9px;
padding:10px;
background:#fff;
color:#102e2b
}

.splash-chat button{
border:0;
border-radius:9px;
padding:0 14px;
background:#f3cb65;
color:#173a34;
font-weight:800;
cursor:pointer
}

.splash-answer{
display:none;
margin-top:9px;
padding:10px;
border:1px solid #ffffff1c;
background:#ffffff0d;
border-radius:10px;
color:#dbeee9;
font-size:.82rem
}

.splash-status{
display:block;
color:#9ac7bc;
margin-top:7px;
font-size:.67rem
}

@media(max-width:700px){

.splash-chat button{
padding:0 11px
}

}
`;

  document.head.appendChild(css);

  const form = $("#ai-chat-form");

  const input = $("#ai-chat-input");

  const answer = $("#ai-chat-answer");

  const status = $("#ai-chat-status");

  if (!form) return;

  form.onsubmit = async (e) => {

    e.preventDefault();

    const question = input.value.trim();

    if (!question) return;

    answer.style.display = "block";

    answer.textContent = "Thinking...";

    status.textContent =
      "Analysing your current Spend Splash budget...";

    const context = {

      monthlySalary: state.income,

      savingsGoal: state.goal,

      totalExpenses: total(),

      remainingBalance: balance(),

      categories: totals(),

      recentExpenses: state.expenses.slice(-12),

    };

    try {

      const response = await fetch("/api/advice", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          question,

          context,

        }),

      });

      const body = await response.json();

      if (!response.ok) {

        throw new Error(
          body.error || "AI is unavailable"
        );

      }

      answer.textContent = body.answer;

      status.textContent =
        "AI answer based on your current budget.";

    } catch (error) {

      answer.textContent =
        "AI is not connected yet. Deploy this folder and set GEMINI_API_KEY in Vercel Environment Variables.";

      status.textContent =
        "Your salary and expenses remain private in this browser until deployment.";

    }

  };

}, 0);