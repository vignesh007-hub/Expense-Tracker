// Local data storage array
let expenses = [];
const STORAGE_KEY = "expense_manager_data";

// DOM elements
const form = document.getElementById("expense-form");
const dateInput = document.getElementById("date");
const descInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filter-category");
const filtersMeta = document.getElementById("filters-meta");
const summaryTotal = document.getElementById("summary-total");
const summaryMonth = document.getElementById("summary-month");
const summaryTopCategory = document.getElementById("summary-top-category");
const historyCount = document.getElementById("history-count");
const tableWrapper = document.getElementById("table-wrapper");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toast-message");

// Toast display
function showToast(msg){
    toastMsg.textContent = msg;
    toast.classList.add("show");
    setTimeout(()=> toast.classList.remove("show"),2200);
}

// LocalStorage functions
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }
function load(){
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(Array.isArray(data)) expenses = data;
}

// Summary update
function renderSummary(){
    const total = expenses.reduce((acc,e)=> acc + Number(e.amount),0);
    summaryTotal.textContent = "₹" + total;

    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthlyTotal = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
    }).reduce((acc,e)=> acc + Number(e.amount),0);
    summaryMonth.textContent = "₹" + monthlyTotal;

    const categoryTotals = {};
    expenses.forEach(e => categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount));
    let top = Object.keys(categoryTotals).sort((a,b)=> categoryTotals[b]-categoryTotals[a])[0] || "–";
    summaryTopCategory.textContent = top;
}

// Table render
function renderTable(){
    const search = searchInput.value.toLowerCase();
    const categoryFilter = filterCategory.value;

    const filtered = expenses.filter(e =>
        (categoryFilter === "all" || e.category === categoryFilter) &&
        e.description.toLowerCase().includes(search)
    );

    filtersMeta.textContent = filtered.length + " items";
    historyCount.textContent = expenses.length + " records";

    if(filtered.length === 0){
        tableWrapper.innerHTML = `<p style='text-align:center;margin-top:10px;'>No expenses found</p>`;
        return;
    }

    let rows = filtered.map(e => `
        <tr>
          <td>${e.date}</td>
          <td>${e.description}</td>
          <td>${e.category}</td>
          <td>₹${e.amount}</td>
          <td><button class="btn-icon" onclick="removeExpense('${e.id}')">Delete</button></td>
        </tr>
    `).join("");

    tableWrapper.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
}

// Remove expense
function removeExpense(id){
    expenses = expenses.filter(e => e.id !== id);
    save();
    renderAll();
}

// Form submit
form.addEventListener("submit",e=>{
    e.preventDefault();
    if(!dateInput.value || !descInput.value || !amountInput.value || !categoryInput.value){
        showToast("Fill all fields!");
        return;
    }

    expenses.push({
        id: Date.now().toString(),
        date: dateInput.value,
        description: descInput.value,
        amount: amountInput.value,
        category: categoryInput.value
    });

    descInput.value = "";
    amountInput.value = "";
    categoryInput.value = "";

    save();
    renderAll();
});

// Search + Filter
searchInput.addEventListener("input", renderTable);
filterCategory.addEventListener("change", renderTable);
document.addEventListener("keydown", e => { if(e.ctrlKey && e.key === "Enter") form.requestSubmit(); });

// Render everything
function renderAll(){
    renderSummary();
    renderTable();
}

// Initialize
load();
renderAll();
