const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

/*
=====================================================
GET EXPORT PDF
=====================================================
*/
router.get("/export/pdf/:report_id", async (req, res) => {
  try {
    const reportId = req.params.report_id;

    // Example: fetch report from session cache
    const report = req.session?.reports?.[reportId];

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-report-${reportId}.pdf`
    );

    doc.pipe(res);

    /*
    ===========================
    HEADER
    ===========================
    */
    doc
      .fontSize(20)
      .text("SMART ATTENDANCE SYSTEM", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(16)
      .text(report.title || "Attendance Report", {
        align: "center",
      });

    doc
      .fontSize(10)
      .text(`Generated on: ${new Date().toLocaleString()}`, {
        align: "right",
      });

    doc.moveDown();

    /*
    ===========================
    SUMMARY
    ===========================
    */
    if (report.summary) {
      doc.fontSize(12).text("Summary", { underline: true });

      Object.entries(report.summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });

      doc.moveDown();
    }

    /*
    ===========================
    TABLE
    ===========================
    */
    const tableTop = doc.y;
    const itemHeight = 20;

    const headers = report.headers || [
      "Date",
      "Student",
      "Subject",
      "Status",
    ];

    headers.forEach((h, i) => {
      doc.text(h, 50 + i * 120, tableTop);
    });

    let y = tableTop + itemHeight;

    report.records.forEach((row) => {
      doc.text(row.date, 50, y);
      doc.text(row.student || "-", 170, y);
      doc.text(row.subject || "-", 290, y);
      doc.text(row.status || "-", 410, y);
      y += itemHeight;
    });

    /*
    ===========================
    FOOTER
    ===========================
    */
    doc.moveDown();
    doc.text(
      `Report generated at ${new Date().toLocaleTimeString()}`,
      {
        align: "center",
      }
    );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

/*
=====================================================
GET EXPORT EXCEL
=====================================================
*/
router.get("/export/excel/:report_id", async (req, res) => {
  try {
    const reportId = req.params.report_id;

    const report = req.session?.reports?.[reportId];

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const workbook = new ExcelJS.Workbook();

    /*
    ===========================
    SUMMARY SHEET
    ===========================
    */
    const summarySheet = workbook.addWorksheet("Summary");

    summarySheet.addRow(["Report Title", report.title]);
    summarySheet.addRow([
      "Generated",
      new Date().toLocaleString(),
    ]);

    summarySheet.addRow([]);

    if (report.summary) {
      Object.entries(report.summary).forEach(([k, v]) => {
        summarySheet.addRow([k, v]);
      });
    }

    summarySheet.getColumn(1).font = { bold: true };

    /*
    ===========================
    DETAILS SHEET
    ===========================
    */
    const sheet = workbook.addWorksheet("Detailed Data");

    const headers = report.headers || [
      "Date",
      "Student",
      "Subject",
      "Status",
      "Attendance %",
    ];

    const headerRow = sheet.addRow(headers);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDDEEFF" },
    };

    report.records.forEach((r) => {
      const row = sheet.addRow([
        r.date,
        r.student,
        r.subject,
        r.status,
        r.percentage,
      ]);

      // color low attendance
      if (r.percentage && r.percentage < 75) {
        row.getCell(5).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFCCCC" },
        };
      }
    });

    // totals formula
    const totalRow = sheet.addRow([
      "",
      "",
      "",
      "Average",
      {
        formula: `AVERAGE(E2:E${sheet.rowCount})`,
      },
    ]);

    totalRow.font = { bold: true };

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    /*
    ===========================
    RESPONSE HEADERS
    ===========================
    */
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-report-${reportId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel generation failed" });
  }
});