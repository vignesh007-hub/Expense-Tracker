// Simple array to store all expenses in memory
var expenses = [];

// Get all important elements from HTML
var form = document.getElementById("expense-form");
var dateInput = document.getElementById("date");
var descInput = document.getElementById("description");
var amountInput = document.getElementById("amount");
var categoryInput = document.getElementById("category");
var tableBody = document.getElementById("expense-body");
var totalAmountSpan = document.getElementById("total-amount");

// Listen for form submit (when user clicks "Add Expense")
form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop page refresh

  // Get values from inputs
  var date = dateInput.value;
  var description = descInput.value;
  var amount = amountInput.value;
  var category = categoryInput.value;

  // Basic validation
  if (date === "" || description === "" || amount === "" || category === "") {
    alert("Please fill all fields");
    return;
  }

  if (Number(amount) <= 0) {
    alert("Amount should be greater than 0");
    return;
  }

  // Create an expense object
  var expense = {
    date: date,
    description: description,
    amount: Number(amount),
    category: category
  };

  // Add to array
  expenses.push(expense);

  // Clear inputs
  descInput.value = "";
  amountInput.value = "";
  categoryInput.value = "";

  // Re-render table and total
  renderTable();
  updateTotal();
});

// Function to show all expenses in the table
function renderTable() {
  // Clear old rows
  tableBody.innerHTML = "";

  // Loop through expenses array
  for (var i = 0; i < expenses.length; i++) {
    var exp = expenses[i];

    // Create a table row
    var row = document.createElement("tr");

    // Date cell
    var dateCell = document.createElement("td");
    dateCell.textContent = exp.date;
    row.appendChild(dateCell);

    // Description cell
    var descCell = document.createElement("td");
    descCell.textContent = exp.description;
    row.appendChild(descCell);

    // Category cell
    var catCell = document.createElement("td");
    catCell.textContent = exp.category;
    row.appendChild(catCell);

    // Amount cell
    var amountCell = document.createElement("td");
    amountCell.textContent = "₹" + exp.amount;
    row.appendChild(amountCell);

    // Action cell (delete button)
    var actionCell = document.createElement("td");
    var deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";

    // Add click event to delete this row
    deleteButton.addEventListener("click", createDeleteHandler(i));

    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    // Add the row to the table body
    tableBody.appendChild(row);
  }
}

// This function returns a function (closure) that remembers the index
function createDeleteHandler(index) {
  return function () {
    // Remove 1 element at position "index"
    expenses.splice(index, 1);
    renderTable();
    updateTotal();
  };
}

// Function to update total amount
function updateTotal() {
  var total = 0;

  for (var i = 0; i < expenses.length; i++) {
    total += expenses[i].amount;
  }

  totalAmountSpan.textContent = "₹" + total;
}
