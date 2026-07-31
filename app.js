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
  JSON.parse(localStorage.getItem("spend-splash-offline") || "null") || blank();
const $ = (s) => document.querySelector(s),
  money = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n),
  save = () =>
    localStorage.setItem("spend-splash-offline", JSON.stringify(state)),
  total = () => state.expenses.reduce((n, x) => n + x.amount, 0),
  balance = () => state.income - total() - state.goal;
function totals() {
  return Object.fromEntries(
    Object.keys(categories).map((c) => [
      c,
      state.expenses
        .filter((x) => x.category === c)
        .reduce((n, x) => n + x.amount, 0),
    ]),
  );
}
function render() {
  const spent = total(),
    left = balance(),
    byCategory = totals(),
    percent = state.income
      ? Math.min(100, Math.round((spent / state.income) * 100))
      : 0,
    top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  $("#balance-main").textContent = money(left);
  $("#balance-story").textContent = state.income
    ? `${money(spent)} spent from ${money(state.income)} salary${state.goal ? `, with ${money(state.goal)} saved for my goal` : ""}.`
    : "Add monthly salary to start tracking.";
  $("#spent-line").style.width = percent + "%";
  $("#spent-label").textContent = `${money(spent)} spent (${percent}%)`;
  $("#salary-label").textContent = `${money(state.income)} salary`;
  $("#health-pill").textContent =
    left < 0 ? "Over plan" : percent > 80 ? "Watch spending" : "On track";
  $("#ring-value").textContent = percent + "%";
  $("#spend-ring").style.background =
    `conic-gradient(#0a6254 0 ${percent}%,#e9efec ${percent}% 100%)`;
  $("#month-label").textContent = new Date().toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  const colors = ["#0a6254", "#2b9d86", "#ef9a49", "#d85c56"];
  $("#category-list").innerHTML =
    Object.entries(byCategory)
      .filter((x) => x[1])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(
        ([c, v], i) =>
          `<div class="category-item"><span><i style="background:${colors[i]}"></i>${c}</span><b>${money(v)}</b></div>`,
      )
      .join("") || "<small>No categories yet.</small>";
  $("#budget-list").innerHTML = Object.entries(state.budgets)
    .map(([c, b]) => {
      const v = byCategory[c],
        p = Math.min(100, Math.round((v / b) * 100));
      return `<div class="budget-row"><div><span>${c} <small>${money(v)} / ${money(b)}</small></span><b>${p}%</b></div><div class="track ${v > b ? "over" : ""}"><i style="width:${p}%"></i></div></div>`;
    })
    .join("");
  $("#plan-income").textContent = money(state.income);
  $("#plan-spend").textContent = "-" + money(spent);
  $("#plan-goal").textContent = "-" + money(state.goal);
  $("#plan-left").textContent = money(left);
  $("#transaction-list").innerHTML =
    [...state.expenses]
      .reverse()
      .map(
        (x) =>
          `<div class="transaction"><span class="icon">${x.category[0]}</span><span>${x.name}<small>${x.category} · ${new Date(x.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></span><b>-${money(x.amount)}</b></div>`,
      )
      .join("") || "<p>No expenses yet — add one above.</p>";
  suggest(left, spent, top, byCategory);
}
function suggest(left, spent, top, byCategory) {
  const label = document.querySelector(".ai-panel .kicker");
  if (label) label.textContent = "SPEND SPLASH COACH";
  const over = Object.entries(byCategory).find(
    ([c, v]) => v > state.budgets[c],
  );
  let title, body;
  if (!state.income) {
    title = "Start with monthly salary";
    body =
      "Add your salary once. Every expense will then update your remaining balance.";
  } else if (over) {
    title = `${over[0]} is over budget`;
    body = `You spent ${money(over[1])} in ${over[0]}. Pause optional expenses in that category until next month.`;
  } else if (left < 0) {
    title = "You are over your plan";
    body = `Your balance is ${money(left)}. Focus on necessary spending until your next salary.`;
  } else {
    title = `${money(left)} is available`;
    body = `You have spent ${money(spent)} so far. Keep a part of the balance for essentials and your savings goal.`;
  }
  $("#ai-summary").textContent = state.income
    ? `${state.expenses.length} expense${state.expenses.length === 1 ? "" : "s"} tracked. Your plan updates immediately.`
    : "Your personal spending summary will appear here.";
  $("#ai-result").innerHTML =
    `<span>SMART CHECK-IN</span><strong>${title}</strong><p>${body}</p>`;
  document.querySelector(".ask-row").style.display = "none";
}
function categoryFor(text) {
  text = text.toLowerCase();
  return (
    Object.keys(categories).find((c) =>
      categories[c].some((k) => text.includes(k)),
    ) || "Other"
  );
}
function addExpense(x) {
  state.expenses.push(x);
  save();
  render();
}
function openExpense() {
  $("#manual-category").innerHTML = Object.keys(categories)
    .map((c) => `<option>${c}</option>`)
    .join("");
  $("#manual-form").reset();
  $("#expense-dialog").showModal();
  $("#manual-name").focus();
}
function openPlan() {
  $("#income-input").value = state.income || "";
  $("#goal-input").value = state.goal || "";
  $("#plan-dialog").showModal();
}
$("#add-manual").onclick = openExpense;
$("#cancel-expense").onclick = () => $("#expense-dialog").close();
$("#manual-form").onsubmit = (e) => {
  e.preventDefault();
  addExpense({
    name: $("#manual-name").value.trim(),
    amount: +$("#manual-amount").value,
    category: $("#manual-category").value,
    date: new Date().toISOString().slice(0, 10),
  });
  $("#expense-dialog").close();
  $("#parse-feedback").textContent =
    "Expense added. Your balance has been updated.";
};
$("#quick-form").onsubmit = (e) => {
  e.preventDefault();
  const text = $("#quick-input").value,
    match = text.match(/(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  if (!match) {
    $("#parse-feedback").textContent = "Add an amount, for example: Coffee 120";
    return;
  }
  addExpense({
    name: text.replace(match[0], "").trim() || "Expense",
    amount: +match[1].replaceAll(",", ""),
    category: categoryFor(text),
    date: new Date().toISOString().slice(0, 10),
  });
  e.target.reset();
  $("#parse-feedback").textContent =
    "Expense added. Your balance has been updated.";
};
["#salary-edit", "#salary-edit-2"].forEach((id) => ($(id).onclick = openPlan));
$("#cancel-plan").onclick = () => $("#plan-dialog").close();
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
  $("#budget-fields").innerHTML = Object.entries(state.budgets)
    .map(
      ([c, v]) =>
        `<label class="budget-field">${c}<input data-budget="${c}" type="number" min="0" value="${v}"></label>`,
    )
    .join("");
  $("#budget-dialog").showModal();
};
$("#cancel-budget").onclick = () => $("#budget-dialog").close();
$("#budget-form").onsubmit = (e) => {
  e.preventDefault();
  document
    .querySelectorAll("[data-budget]")
    .forEach((x) => (state.budgets[x.dataset.budget] = +x.value));
  save();
  $("#budget-dialog").close();
  render();
};
$("#reset-data").onclick = () => {
  if (confirm("Clear salary, goals, and all expenses?")) {
    state = blank();
    save();
    render();
    $("#salary-dialog").showModal();
  }
};
render();
if (!state.income) setTimeout(() => $("#salary-dialog").showModal(), 120);
setTimeout(() => {
  const panel = document.querySelector(".ai-panel");
  if (!panel) return;
  panel.querySelector(".kicker").innerHTML =
    'SPEND SPLASH AI <span class="live">CHAT</span>';
  const row = panel.querySelector(".ask-row");
  row.style.display = "flex";
  row.insertAdjacentHTML(
    "afterend",
    '<form id="ai-chat-form" class="splash-chat"><input id="ai-chat-input" maxlength="500" placeholder="Ask about my salary, balance or savings..."><button>Ask</button></form><div id="ai-chat-answer" class="splash-answer" aria-live="polite"></div><small id="ai-chat-status" class="splash-status">AI chat works after the app is deployed.</small>',
  );
  const css = document.createElement("style");
  css.textContent =
    ".splash-chat{display:flex;gap:8px;margin-top:12px}.splash-chat input{flex:1;min-width:0;border:0;border-radius:9px;padding:10px;background:#fff;color:#102e2b}.splash-chat button{border:0;border-radius:9px;padding:0 14px;background:#f3cb65;color:#173a34;font-weight:800;cursor:pointer}.splash-answer{display:none;margin-top:9px;padding:10px;border:1px solid #ffffff1c;background:#ffffff0d;border-radius:10px;color:#dbeee9;font-size:.82rem}.splash-status{display:block;color:#9ac7bc;margin-top:7px;font-size:.67rem}@media(max-width:700px){.splash-chat button{padding:0 11px}}";
  document.head.append(css);
  const form = $("#ai-chat-form"),
    input = $("#ai-chat-input"),
    answer = $("#ai-chat-answer"),
    status = $("#ai-chat-status");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    answer.style.display = "block";
    answer.textContent = "Thinking…";
    status.textContent = "Analysing your current Spend Splash budget…";
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "AI is unavailable");
      answer.textContent = body.answer;
      status.textContent = "AI answer based on your current budget.";
    } catch (error) {
      answer.textContent =
        "AI is not connected yet. Deploy this folder and set OPENAI_API_KEY in the host settings.";
      status.textContent =
        "Your salary and expenses remain private in this browser until you deploy.";
    }
  };
}, 0);
