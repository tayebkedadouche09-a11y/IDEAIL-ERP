const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const db = require("../database");

// ===============================
// إضافة رأس الشركة + اللوجو
// ===============================

function addCompanyHeader(doc, callback) {
  db.get(
    `
    SELECT *
    FROM company_info
    LIMIT 1
    `,
    [],
    (err, company) => {
      if (err || !company) {
        doc.fontSize(20)
          .text(
            "SARL IDEAIL ROUVETMON",
            {
              align: "center"
            }
          );
        doc.moveDown();
        callback();
        return;
      }

      let logoPath = null;

      if (company.logo) {
        const possiblePath = path.join(
          __dirname,
          "..",
          "uploads",
          company.logo
        );

        if (fs.existsSync(possiblePath)) {
          logoPath = possiblePath;
        }
      }

      if (logoPath) {
        doc.image(
          logoPath,
          {
            fit: [100, 100],
            align: "center"
          }
        );
        doc.moveDown();
      }

      doc.fontSize(20)
        .text(
          company.company_name ||
          "SARL IDEAIL ROUVETMON",
          {
            align: "center"
          }
        );

      doc.fontSize(10);

      if (company.phone)
        doc.text(
          `Tel: ${company.phone}`,
          {
            align: "center"
          }
        );

      if (company.address)
        doc.text(
          company.address,
          {
            align: "center"
          }
        );

      doc.moveDown(2);

      callback();
    }
  );
}

// =======================================
// INVOICE PDF
// =======================================

router.get("/invoice/:id", (req, res) => {
  const invoiceId = req.params.id;

  db.get(
    `
    SELECT
      invoices.*,
      clients.name AS client_name,
      clients.phone AS client_phone,
      clients.address AS client_address,
      projects.name AS project_name
    FROM invoices
    LEFT JOIN clients
      ON invoices.client_id = clients.id
    LEFT JOIN projects
      ON invoices.project_id = projects.id
    WHERE invoices.id = ?
    `,
    [invoiceId],
    (err, invoice) => {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      if (!invoice) {
        return res.status(404).json({
          error: "الفاتورة غير موجودة"
        });
      }

      const doc = new PDFDocument({
        size: "A4",
        margin: 50
      });

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename=invoice-${invoice.id}.pdf`
      );

      doc.pipe(res);

      addCompanyHeader(doc, () => {
        doc.fontSize(16)
          .text(
            "FACTURE / INVOICE",
            {
              align: "center"
            }
          );

        doc.moveDown();

        doc.fontSize(12);

        doc.text(
          `رقم الفاتورة: ${invoice.invoice_number}`
        );

        doc.text(
          `التاريخ: ${invoice.invoice_date || ""}`
        );

        doc.moveDown();

        doc.text(
          `العميل: ${invoice.client_name || "-"}`
        );

        doc.text(
          `الهاتف: ${invoice.client_phone || "-"}`
        );

        doc.text(
          `العنوان: ${invoice.client_address || "-"}`
        );

        doc.moveDown();

        doc.text(
          `المشروع: ${invoice.project_name || "-"}`
        );

        doc.moveDown();

        doc.fontSize(14)
          .text(
            "تفاصيل الفاتورة"
          );

        doc.moveDown();

        doc.fontSize(12)
          .text(
            `
            المبلغ الإجمالي:
            ${invoice.amount || 0} DA

            الحالة:
            ${invoice.status || ""}
            `
          );

        doc.moveDown(2);

        doc.text(
          "شكراً لاختياركم IDEAIL"
        );

        doc.text(
          "التوقيع: " +
          (invoice.signature || "")
        );

        doc.end();
      });
    }
  );
});

// =======================================
// DEVIS PDF
// =======================================

router.get("/devis/:id", (req, res) => {
  const devisId = req.params.id;

  db.get(
    `
    SELECT
      d.*,
      c.name AS client_name,
      c.phone AS client_phone,
      c.address AS client_address,
      p.name AS project_name
    FROM devis d
    LEFT JOIN clients c ON d.client_id = c.id
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.id = ?
    `,
    [devisId],
    (err, devis) => {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      if (!devis) {
        return res.status(404).json({
          error: "العرض غير موجود"
        });
      }

      // Get devis items
      db.all(
        "SELECT * FROM devis_items WHERE devis_id = ? ORDER BY id ASC",
        [devisId],
        (err, items) => {
          if (err) {
            return res.status(500).json({
              error: err.message
            });
          }

          const doc = new PDFDocument({
            size: "A4",
            margin: 50
          });

          res.setHeader(
            "Content-Type",
            "application/pdf"
          );

          res.setHeader(
            "Content-Disposition",
            `inline; filename=devis-${devis.id}.pdf`
          );

          doc.pipe(res);

          addCompanyHeader(doc, () => {
            doc.fontSize(16)
              .text(
                "DEVIS / عرض سعر",
                {
                  align: "center"
                }
              );

            doc.moveDown();

            doc.fontSize(12);

            doc.text(
              `Client: ${devis.client_name || "-"}`
            );

            doc.text(
              `Phone: ${devis.client_phone || "-"}`
            );

            doc.text(
              `Address: ${devis.client_address || "-"}`
            );

            doc.moveDown();

            if (devis.project_name) {
              doc.text(
                `Project: ${devis.project_name}`
              );
            }

            doc.text(
              `Devis #: ${devis.devis_number || ""}`
            );

            doc.text(
              `Date: ${devis.created_at || ""}`
            );

            doc.moveDown();

            // Items table
            doc.fontSize(14);
            doc.text("Items:");
            doc.moveDown();

            doc.fontSize(10);
            if (items && items.length > 0) {
              items.forEach((item) => {
                doc.text(
                  `${item.description} - Qty: ${item.quantity} - Price: ${item.unit_price} DA - Total: ${item.total_price} DA`
                );
              });
            }

            doc.moveDown();

            doc.fontSize(14);
            doc.text(
              `Total Amount: ${devis.amount || 0} DA`
            );

            doc.moveDown(2);

            doc.text(
              "This quotation is valid after client approval."
            );

            doc.text(
              "Thank you for your business!"
            );

            doc.end();
          });
        }
      );
    }
  );
});

// =======================================
// EXPENSE PDF
// =======================================

router.get("/expense/:id", (req, res) => {
  const expenseId = req.params.id;

  db.get(
    `
    SELECT
      e.*,
      c.name AS category_name,
      p.name AS project_name,
      s.name AS supplier_name
    FROM expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.id
    LEFT JOIN projects p ON e.project_id = p.id
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    WHERE e.id = ?
    `,
    [expenseId],
    (err, expense) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      const doc = new PDFDocument({
        size: "A4",
        margin: 50
      });

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename=expense-${expense.id}.pdf`
      );

      doc.pipe(res);

      addCompanyHeader(doc, () => {
        doc.fontSize(16)
          .text(
            "EXPENSE REPORT / تقرير مصروف",
            {
              align: "center"
            }
          );

        doc.moveDown();

        doc.fontSize(12);

        doc.text(
          `Expense #${expense.id}`
        );

        doc.text(
          `Date: ${expense.expense_date || ""}`
        );

        doc.moveDown();

        doc.text(
          `Category: ${expense.category_name || "-"}`
        );

        doc.text(
          `Title: ${expense.title || "-"}`
        );

        if (expense.description) {
          doc.text(
            `Description: ${expense.description}`
          );
        }

        doc.moveDown();

        if (expense.project_name) {
          doc.text(
            `Project: ${expense.project_name}`
          );
        }

        if (expense.supplier_name) {
          doc.text(
            `Supplier: ${expense.supplier_name}`
          );
        }

        doc.moveDown();

        doc.fontSize(14);
        doc.text(
          `Amount: ${expense.amount || 0} DA`
        );

        doc.text(
          `VAT: ${expense.vat_amount || 0} DA`
        );

        doc.text(
          `Total: ${expense.total_amount || 0} DA`
        );

        doc.moveDown();

        doc.fontSize(12);
        doc.text(
          `Payment Method: ${expense.payment_method || "cash"}`
        );

        if (expense.receipt_number) {
          doc.text(
            `Receipt #: ${expense.receipt_number}`
          );
        }

        doc.moveDown(2);

        doc.text(
          "Thank you!"
        );

        doc.text(
          "Signature: ____________________"
        );

        doc.end();
      });
    }
  );
});

// =======================================
// PAYMENT RECEIPT PDF
// =======================================

router.get("/payment/:id", (req, res) => {
  const paymentId = req.params.id;

  db.get(
    `
    SELECT
      p.*,
      c.name AS client_name,
      c.phone AS client_phone,
      c.address AS client_address,
      i.invoice_number,
      s.name AS supplier_name
    FROM payments p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
    `,
    [paymentId],
    (err, payment) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const doc = new PDFDocument({
        size: "A4",
        margin: 50
      });

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename=receipt-${payment.id}.pdf`
      );

      doc.pipe(res);

      addCompanyHeader(doc, () => {
        doc.fontSize(16)
          .text(
            "PAYMENT RECEIPT / إيصال دفع",
            {
              align: "center"
            }
          );

        doc.moveDown();

        doc.fontSize(12);

        doc.text(
          `Receipt #${payment.id}`
        );

        doc.text(
          `Date: ${payment.payment_date || ""}`
        );

        doc.moveDown();

        if (payment.client_name) {
          doc.text(
            `Client: ${payment.client_name}`
          );
          doc.text(
            `Phone: ${payment.client_phone || "-"}`
          );
        }

        if (payment.supplier_name) {
          doc.text(
            `Supplier: ${payment.supplier_name}`
          );
        }

        if (payment.invoice_number) {
          doc.text(
            `Invoice #: ${payment.invoice_number}`
          );
        }

        doc.moveDown();

        doc.fontSize(14);
        doc.text(
          `Amount: ${payment.amount || 0} DA`
        );

        doc.text(
          `Payment Method: ${payment.payment_method || "cash"}`
        );

        if (payment.reference_number) {
          doc.text(
            `Reference: ${payment.reference_number}`
          );
        }

        doc.moveDown(2);

        doc.text(
          "Thank you for your payment!"
        );

        doc.text(
          "Signature: ____________________"
        );

        doc.end();
      });
    }
  );
});

// =======================================
// PROJECT PROFITABILITY PDF
// =======================================

router.get("/project/:id/profitability", (req, res) => {
  const projectId = req.params.id;

  const { getProfitSummary } = require("../services/profitability");

  getProfitSummary(db, projectId)
    .then((summary) => {
      db.get(
        `
        SELECT p.*, c.name AS client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
        `,
        [projectId],
        (err, project) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          if (!project) {
            return res.status(404).json({ error: "Project not found" });
          }

          const doc = new PDFDocument({
            size: "A4",
            margin: 50
          });

          res.setHeader(
            "Content-Type",
            "application/pdf"
          );

          res.setHeader(
            "Content-Disposition",
            `inline; filename=project-profit-${project.id}.pdf`
          );

          doc.pipe(res);

          addCompanyHeader(doc, () => {
            doc.fontSize(16)
              .text(
                "PROJECT PROFITABILITY / تقرير ربح المشروع",
                {
                  align: "center"
                }
              );

            doc.moveDown();

            doc.fontSize(12);

            doc.text(
              `Project: ${project.name}`
            );

            if (project.client_name) {
              doc.text(
                `Client: ${project.client_name}`
              );
            }

            doc.moveDown();

            doc.fontSize(14);
            doc.text(
              `Revenue: ${summary.revenue || 0} DA`
            );

            doc.text(
              `Material Cost: ${summary.materialCost || 0} DA`
            );

            doc.text(
              `Labor Cost: ${summary.laborCost || 0} DA`
            );

            doc.text(
              `Expense Cost: ${summary.expenseCost || 0} DA`
            );

            doc.text(
              `Other Expenses: ${summary.otherExpenses || 0} DA`
            );

            doc.moveDown();

            doc.fontSize(16);
            doc.text(
              `Total Cost: ${summary.totalCost || 0} DA`
            );

            doc.text(
              `Profit: ${summary.profit || 0} DA`
            );

            doc.text(
              `Margin: ${summary.margin || 0}%`
            );

            doc.moveDown(2);

            doc.text(
              "Signature: ____________________"
            );

            doc.end();
          });
        }
      );
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// =======================================
// FINANCIAL REPORT PDF
// =======================================

router.get("/financial-report", (req, res) => {
  const { start_date, end_date } = req.query;

  const queries = {
    totalRevenue: "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'مدفوعة'",
    totalExpenses: "SELECT COALESCE(SUM(total_amount), 0) AS total FROM expenses",
    totalPayments: "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_type = 'client_payment'",
  };

  let results = {};
  let completed = 0;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, [], (err, row) => {
      if (!err && row) results[key] = row.total || 0;
      else results[key] = 0;
      completed++;
      if (completed === Object.keys(queries).length) {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50
        });

        res.setHeader(
          "Content-Type",
          "application/pdf"
        );

        res.setHeader(
          "Content-Disposition",
          `inline; filename=financial-report.pdf`
        );

        doc.pipe(res);

        addCompanyHeader(doc, () => {
          doc.fontSize(16)
            .text(
              "FINANCIAL REPORT / التقرير المالي",
              {
                align: "center"
              }
            );

          doc.moveDown();

          doc.fontSize(12);

          if (start_date) {
            doc.text(
              `Period: ${start_date} to ${end_date || "now"}`
            );
            doc.moveDown();
          }

          doc.fontSize(14);
          doc.text(
            `Total Revenue: ${results.totalRevenue || 0} DA`
          );

          doc.text(
            `Total Expenses: ${results.totalExpenses || 0} DA`
          );

          doc.text(
            `Total Payments: ${results.totalPayments || 0} DA`
          );

          doc.moveDown();

          const netProfit = (results.totalRevenue || 0) - (results.totalExpenses || 0);
          doc.fontSize(16);
          doc.text(
            `Net Profit: ${netProfit} DA`
          );

          doc.moveDown(2);

          doc.text(
            "Signature: ____________________"
          );

          doc.end();
        });
      }
    });
  });
});

module.exports = router;