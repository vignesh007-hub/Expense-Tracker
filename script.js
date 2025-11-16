// ===== Data & State =====
let expenses = [];
const STORAGE_KEY = "expense-manager-data";

let categoryChart = null;
let monthlyChart = null;

// ===== DOM elements =====
const form = document.getElementById("expense-form");
const dateInput = document.getElementById("date");
const descInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");

const searchInput = document.getElementById("search");
const filterCategoryInput = document.getElementById("filter-category");
const filtersMeta = document.getElementById("filters-meta");

const summaryTotal = document.getElementById("summary-total");
const summaryMonth = document.getElementById("summary-month");
const summaryTopCategory = document.getElementById("summary-top-category");
const historyCount = document.getElementById("history-count");

const tableWrapper = document.getElementById("table-wrapper");

const toastEl = document.getElementById("toast");
const toastMsg = document.getElementById("toast-message");

// ===== Helper functions =====
function showToast(message) {
  toastMsg.textContent = message;
  toastEl.classList.add("toast--visible");
  setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 2600);
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      expenses = data;
    }
  } catch (err) {
    console.error("Failed to load from storage", err);
  }
}

function formatCurrency(amount) {
  const value = Number(amount || 0);
  return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return "–";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function getCurrentMonthKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ===== Core logic =====
function addExpense(expense) {
  expenses.push(expense);
  saveToStorage();
  render();
}

function deleteExpense(id) {
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx === -1) return;
  if (!confirm("Delete this expense? This action cannot be undone.")) return;
  expenses.splice(idx, 1);
  saveToStorage();
  render();
}

function getFilteredExpenses() {
  const search = searchInput.value.trim().toLowerCase();
  const categoryFilter = filterCategoryInput.value;

  let filtered = [...expenses];

  if (categoryFilter && categoryFilter !== "all") {
    filtered = filtered.filter((exp) => exp.category === categoryFilter);
  }

  if (search) {
    filtered = filtered.filter((exp) =>
      String(exp.description || "").toLowerCase().includes(search)
    );
  }

  return filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ===== Rendering: Summary =====
function renderSummary() {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const currentMonthKey = getCurrentMonthKey();
  let monthTotal = 0;
  const categoryTotals = {};

  for (const e of expenses) {
    const amt = Number(e.amount || 0);
    if (!e.date) continue;

    const mk = getMonthKeyFromDate(e.date);
    if (mk === currentMonthKey) {
      monthTotal += amt;
    }

    const cat = e.category || "Uncategorized";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  }

  let topCategory = "–";
  let topAmount = 0;
  for (const [cat, val] of Object.entries(categoryTotals)) {
    if (val > topAmount) {
      topAmount = val;
      topCategory = cat;
    }
  }

  summaryTotal.textContent = formatCurrency(total);
  summaryMonth.textContent = formatCurrency(monthTotal);
  summaryTopCategory.textContent = topCategory === "–" ? "Not enough data" : topCategory;
}

// ===== Rendering: Charts =====
function renderCategoryChart() {
  const canvas = document.getElementById("categoryChart");
  if (!canvas) return;

  if (categoryChart) {
    categoryChart.destroy();
  }

  const categoryTotals = {};

  for (const e of expenses) {
    const amt = Number(e.amount || 0);
    if (!amt) continue;
    const cat = e.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  }

  const labels = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);

  if (labels.length === 0) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  categoryChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: dataValues,
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#e5e7eb",
            font: { size: 10 },
          },
        },
      },
    },
  });
}

function renderMonthlyChart() {
  const canvas = document.getElementById("monthlyChart");
  if (!canvas) return;

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  const monthTotals = {};

  for (const e of expenses) {
    const amt = Number(e.amount || 0);
    if (!amt || !e.date) continue;
    const mk = getMonthKeyFromDate(e.date);
    if (!mk) continue;
    monthTotals[mk] = (monthTotals[mk] || 0) + amt;
  }

  const sortedKeys = Object.keys(monthTotals).sort((a, b) => (a > b ? 1 : -1));

  const labels = sortedKeys.map((mk) => {
    const [y, m] = mk.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  });

  const values = sortedKeys.map((k) => monthTotals[k]);

  if (labels.length === 0) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  monthlyChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "₹ spent",
          data: values,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          ticks: { color: "#9ca3af", font: { size: 10 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#9ca3af", font: { size: 10 } },
          grid: { color: "rgba(148, 163, 184, 0.3)" },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

// ===== Rendering: Table =====
function renderTable() {
  const filtered = getFilteredExpenses();

  filtersMeta.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"} shown`;
  historyCount.textContent = `${expenses.length} record${expenses.length === 1 ? "" : "s"} total`;

  if (!filtered.length) {
    tableWrapper.innerHTML = `
      <div class="empty-state">
        <span>👀</span>
        <div>No expenses to show yet.</div>
        <div>Add a few from the form on the left and they’ll appear here with analytics.</div>
      </div>
    `;
    return;
  }

  let rowsHTML = "";
  for (const e of filtered) {
    rowsHTML += `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${escapeHtml(e.description)}</td>
        <td><span class="badge-pill badge-pill--category">${escapeHtml(e.category || "Other")}</span></td>
        <td class="amount-cell">${formatCurrency(e.amount)}</td>
        <td class="text-center">
          <button class="btn-icon" data-id="${e.id}">
            <span>✕</span>
            <span>Delete</span>
          </button>
        </td>
      </tr>
    `;
  }

  tableWrapper.innerHTML = `
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Date</th>
          <th>Description</th>
          <th style="width: 20%;">Category</th>
          <th style="width: 18%;" class="text-right">Amount</th>
          <th style="width: 14%;" class="text-center">Action</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
  `;

  tableWrapper.querySelectorAll(".btn-icon").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteExpense(id);
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===== Main render =====
function render() {
  renderSummary();
  renderCategoryChart();
  renderMonthlyChart();
  renderTable();
}

// ===== Event listeners =====
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = dateInput.value;
  const description = descInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;

  if (!date || !description || !amount || amount <= 0 || !category) {
    showToast("Fill all fields with valid values (amount > 0).");
    return;
  }

  const expense = {
    id: Date.now().toString(36),
    date,
    description,
    amount,
    category,
  };

  addExpense(expense);

  descInput.value = "";
  amountInput.value = "";
  categoryInput.value = "";
  // keep date so user can add multiple quickly
  descInput.focus();
});

searchInput.addEventListener("input", () => renderTable());
filterCategoryInput.addEventListener("change", () => renderTable());

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    form.requestSubmit();
  }
});

// ===== Initial load =====
(function init() {
  loadFromStorage();
  // Set default date = today
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${y}-${m}-${d}`;
  render();
})();
