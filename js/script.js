// ===============================
// State
// ===============================
let items = [];
let lastInvoiceId = null;

// ===============================
// DOM Elements
// ===============================
const addItemBtn = document.getElementById("addItemBtn");
const itemsTableBody = document.querySelector("#itemsTable tbody");
const grandTotalEl = document.getElementById("grandTotal");

const generateInvoiceBtn = document.getElementById("generateInvoiceBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

const customerNameInput = document.getElementById("customerName");
const invoiceDateInput = document.getElementById("invoiceDate");

const invoiceHistoryEl = document.getElementById("invoiceHistory");

// ===============================
// Init
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  addItemRow();
  fetchInvoices();
});

// ===============================
// Add Item Row
// ===============================
addItemBtn.addEventListener("click", addItemRow);

function addItemRow() {
  const rowId = Date.now();

  const row = document.createElement("tr");
  row.dataset.id = rowId;

  row.innerHTML = `
    <td><input type="text" class="item-name" placeholder="Item name"></td>
    <td><input type="number" class="item-qty" value="1" min="1"></td>
    <td><input type="number" class="item-price" value="0" min="0"></td>
    <td class="item-total">0</td>
    <td><button class="delete-btn">X</button></td>
  `;

  itemsTableBody.appendChild(row);

  items.push({
    id: rowId,
    name: "",
    qty: 1,
    price: 0,
    total: 0
  });

  attachRowEvents(row);
  updateTotals();
}

// ===============================
// Row Events
// ===============================
function attachRowEvents(row) {
  const qtyInput = row.querySelector(".item-qty");
  const priceInput = row.querySelector(".item-price");
  const nameInput = row.querySelector(".item-name");
  const deleteBtn = row.querySelector(".delete-btn");

  qtyInput.addEventListener("input", handleChange);
  priceInput.addEventListener("input", handleChange);
  nameInput.addEventListener("input", handleChange);

  deleteBtn.addEventListener("click", () => {
    const id = Number(row.dataset.id);
    items = items.filter(i => i.id !== id);
    row.remove();
    updateTotals();
  });

  function handleChange() {
    const id = Number(row.dataset.id);
    const item = items.find(i => i.id === id);

    item.name = nameInput.value;
    item.qty = Number(qtyInput.value);
    item.price = Number(priceInput.value);
    item.total = item.qty * item.price;

    row.querySelector(".item-total").innerText = item.total.toFixed(2);

    updateTotals();
  }
}

// ===============================
// Calculate Total
// ===============================
function updateTotals() {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  grandTotalEl.innerText = `₹${total.toFixed(2)}`;
}

// ===============================
// Generate Invoice
// ===============================
generateInvoiceBtn.addEventListener("click", async () => {
  const payload = {
    customerName: customerNameInput.value,
    date: invoiceDateInput.value,
    items: items,
    total: items.reduce((sum, i) => sum + i.total, 0)
  };

  try {
    const res = await fetch("http://localhost:5000/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    // STORE LAST INVOICE ID (IMPORTANT FIX)
    lastInvoiceId = data.invoice?._id;

    alert("Invoice Generated Successfully!");

    fetchInvoices();

  } catch (err) {
    console.error(err);
    alert("Error generating invoice");
  }
});

// ===============================
// Download PDF (FIXED)
// ===============================
downloadPdfBtn.addEventListener("click", () => {
  if (!lastInvoiceId) {
    alert("Generate invoice first!");
    return;
  }

  window.open(
    `http://localhost:5000/invoices/${lastInvoiceId}/pdf`,
    "_blank"
  );
});

// ===============================
// Fetch Invoices
// ===============================
async function fetchInvoices() {
  try {
    const res = await fetch("http://localhost:5000/invoices");
    const data = await res.json();

    renderHistory(data);
  } catch (err) {
    console.error("Error fetching invoices:", err);
  }
}

// ===============================
// Render History
// ===============================
function renderHistory(invoices) {
  invoiceHistoryEl.innerHTML = "";

  if (!invoices.length) {
    invoiceHistoryEl.innerHTML = "<p>No invoices yet</p>";
    return;
  }

  invoices.forEach(inv => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <strong>${inv.customerName}</strong>
      <span>₹${inv.total}</span>
      <button onclick="openInvoice('${inv._id}')">View PDF</button>
    `;

    invoiceHistoryEl.appendChild(div);
  });
}

// ===============================
// Open Invoice PDF
// ===============================
window.openInvoice = function (id) {
  window.open(`http://localhost:5000/invoices/${id}/pdf`, "_blank");
};