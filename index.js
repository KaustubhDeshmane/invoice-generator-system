const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// TEMP STORAGE (no DB needed)
// ===============================
let invoices = [];

// ===============================
// CREATE INVOICE
// ===============================
app.post("/invoices", (req, res) => {
  const invoice = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date()
  };

  invoices.push(invoice);

  return res.json({
    message: "Invoice created",
    invoice
  });
});

// ===============================
// GET ALL INVOICES
// ===============================
app.get("/invoices", (req, res) => {
  res.json(invoices);
});

// ===============================
// GET LATEST INVOICE
// ===============================
app.get("/invoices/latest", (req, res) => {
  if (invoices.length === 0) {
    return res.status(404).json({ message: "No invoices found" });
  }

  res.json(invoices[invoices.length - 1]);
});

// ===============================
// SIMPLE PDF (DUMMY RESPONSE)
// (works even without PDFKit for now)
// ===============================
const PDFDocument = require("pdfkit");

app.get("/invoices/:id/pdf", (req, res) => {
  const invoice = invoices.find(i => i._id === req.params.id);

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");

  doc.pipe(res);

  // ================= HEADER =================
  doc.fontSize(22).text("INVOICE", { align: "center" });
  doc.moveDown(2);

  // ================= META =================
  doc.fontSize(12).text(`Customer: ${invoice.customerName}`);
  doc.text(`Date: ${invoice.date}`);
  doc.text(`Invoice ID: ${invoice._id}`);

  doc.moveDown(2);

  // ================= TABLE HEADER =================
  doc.fontSize(12).text("ITEM", 50, doc.y, { width: 150 });
  doc.text("QTY", 200, doc.y, { width: 80 });
  doc.text("PRICE", 280, doc.y, { width: 100 });
  doc.text("TOTAL", 380, doc.y);

  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();

  doc.moveDown(0.5);

  // ================= ITEMS =================
  invoice.items.forEach(item => {
    const y = doc.y;

    doc.text(item.name || "-", 50, y, { width: 150 });
    doc.text(String(item.qty), 200, y, { width: 80 });
    doc.text(String(item.price), 280, y, { width: 100 });
    doc.text(String(item.total), 380, y);

    doc.moveDown();
  });

  doc.moveDown(2);

  // ================= TOTAL =================
  doc.fontSize(14).text(`Grand Total: ₹${invoice.total}`, {
    align: "right"
  });

  doc.end();
});
// ===============================
// START SERVER
// ===============================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});