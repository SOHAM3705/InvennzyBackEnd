const express = require('express');
const router = express.Router();
const db = require('../../db');
const PDFDocument = require("pdfkit");
const path = require("path");


// Example usage
const filePath = path.join(__dirname, "uploads", "report.pdf");
// ✅ Fetch ALL deadstock rows, grouped by deadstock_id
router.get("/fetch/deadstock", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.deadstock_id, d.po_no, d.date_submitted, d.quantity, d.remark,
              d.equipment_name, d.purchase_year, d.ds_number, d.cost, d.gst_rate, 
              d.subtotal_excl_gst, d.gst_amount, d.total_incl_gst, d.staff_id, l.name 
       FROM dead_stock_requirements d 
       JOIN labassistant l ON d.staff_id = l.staff_id`
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching deadstock:", error);
    res.status(500).json({ error: "Failed to fetch deadstock" });
  }
});


// ✅ Add a new deadstock record with GST handling
router.post("/deadstock", async (req, res) => {
  try {
    const {
      deadstock_id,
      po_no,
      purchase_year,
      equipment_name,
      ds_number,
      quantity,
      unit_rate,
      gst_rate,
      remark,
      staff_id
    } = req.body;

    // Validation
    if (
      !deadstock_id ||
      !purchase_year ||
      !equipment_name ||
      !ds_number ||
      !quantity ||
      !unit_rate ||
      gst_rate == null // must explicitly check since 0 is valid
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Cost & GST calculations
    const subtotal_excl_gst = quantity * unit_rate;
    const gst_amount = (subtotal_excl_gst * gst_rate) / 100;
    const total_incl_gst = subtotal_excl_gst + gst_amount;

    const query = `
      INSERT INTO dead_stock_requirements 
        (deadstock_id, po_no, purchase_year, equipment_name, ds_number, quantity, unit_rate, gst_rate, cost, remark, date_submitted, staff_id,subtotal_excl_gst, gst_amount, total_incl_gst)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      deadstock_id,
      po_no || null,
      purchase_year,
      equipment_name,
      ds_number,
      quantity,
      unit_rate,
      gst_rate,
      subtotal_excl_gst, // 🔹 cost = same as subtotal_excl_gst for backward compatibility
      remark || null,
      staff_id,
      subtotal_excl_gst,
      gst_amount,
      total_incl_gst,
    ]);

    res.status(201).json({
      message: "Dead stock record added",
      id: result.insertId,
      data: {
        deadstock_id,
        po_no,
        purchase_year,
        equipment_name,
        ds_number,
        quantity,
        unit_rate,
        gst_rate,
        staff_id,
        subtotal_excl_gst,
        gst_amount,
        total_incl_gst,
        remark
      }
    });
  } catch (error) {
    console.error("Error inserting dead stock record:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/download/deadstock-report/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // ✅ Fetch data first
    const [rows] = await db.query(
      "SELECT * FROM dead_stock_requirements WHERE deadstock_id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No records found for this deadstockId" });
    }

    // ✅ Start PDF generation
    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4" 
    });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition", 
      `attachment; filename=deadstock_report_${id}.pdf`
    );
    doc.pipe(res);

    // =====================================================
    // TABLE WITH HEADER SECTION
    // =====================================================
    const pageWidth = doc.page.width;
    const tableStartX = 15;
    const tableWidth = pageWidth - 30; // Full width with margins
    let currentY = 50;

    // Define table structure
    const colWidths = [30, 55, 50, 90, 80, 30, 60, 40, 60, 75];
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);

    // =====================================================
    // HEADER SECTION INSIDE TABLE (TOP BORDER)
    // =====================================================
    const headerSectionHeight = 100;
    
    // Draw outer border for header section
    doc.rect(tableStartX, currentY, totalTableWidth, headerSectionHeight).stroke();

    // Logo paths and dimensions
    const leftLogoPath = path.join(__dirname, "../../uploads/left_logo.jpg");
    const rightLogoPath = path.join(__dirname, "../../uploads/right_logo.png");
    const logoWidth = 60;
    const logoHeight = 60;
    const logoY = currentY + 20;

    // Left Logo
    doc.image(leftLogoPath, tableStartX + 15, logoY, { 
      width: logoWidth, 
      height: logoHeight 
    });
    
    // Right Logo
    doc.image(rightLogoPath, tableStartX + totalTableWidth - logoWidth - 15, logoY, { 
      width: logoWidth, 
      height: logoHeight 
    });
    
    // Draw vertical line after left logo
    const leftLineX = tableStartX + logoWidth + 25;
    doc.moveTo(leftLineX, currentY)
       .lineTo(leftLineX, currentY + headerSectionHeight)
       .stroke();
    
    // Draw vertical line before right logo
    const rightLineX = tableStartX + totalTableWidth - logoWidth - 25;
    doc.moveTo(rightLineX, currentY)
       .lineTo(rightLineX, currentY + headerSectionHeight)
       .stroke();
    
    // Header text - centered between logos
    const textStartX = tableStartX + logoWidth + 30;
    const textWidth = totalTableWidth - (2 * logoWidth) - 60;
    const textY = logoY + 5;
    
    doc.font("Helvetica-Bold")
       .fontSize(13)
       .text("Pimpri Chinchwad Education Trust's", textStartX, textY, {
         width: textWidth,
         align: "center"
       });
    
    doc.fontSize(12)
       .text("Pimpri Chinchwad College of Engineering & Research Ravet, Pune", textStartX, textY + 18, {
         width: textWidth,
         align: "center"
       });
    
    doc.fontSize(8)
       .text("An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified", textStartX, textY + 35, {
         width: textWidth,
         align: "center"
       });
    
    doc.font("Helvetica-Bold")
       .fontSize(10)
       .text("IQAC PCCOER", textStartX, textY + 52, {
         width: textWidth,
         align: "center"
       });

    currentY += headerSectionHeight;

    // =====================================================
    // DEADSTOCK ID SECTION
    // =====================================================
    const deadstockSectionHeight = 25;
    doc.rect(tableStartX, currentY, totalTableWidth, deadstockSectionHeight).stroke();
    
    doc.font("Helvetica-Bold")
       .fontSize(11)
       .text(`Deadstock ID: ${id}`, tableStartX, currentY + 8, {
         width: totalTableWidth,
         align: "center"
       });

    currentY += deadstockSectionHeight;

    // Add spacing between Deadstock ID and equipment list
    currentY += 15;

    // =====================================================
    // TABLE HEADER WITH VERTICAL LINES
    // =====================================================
    const headers = [
      "Sr.No", 
      "PO No", 
      "Purchase Year", 
      "Equipment Name", 
      "DS No", 
      "Qty", 
      "Unit Rate (Rs)", 
      "GST (%)", 
      "Cost (Rs)", 
      "Remark"
    ];
    
    const headerHeight = 25;
    
    // Draw header background
    doc.rect(tableStartX, currentY, totalTableWidth, headerHeight).stroke();

    // Draw header text and vertical lines
    headers.forEach((header, i) => {
      const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      
      // Draw vertical line before each column (except first)
      if (i > 0) {
        doc.moveTo(x, currentY)
           .lineTo(x, currentY + headerHeight)
           .stroke();
      }
      
      // Header text
      doc.font("Helvetica-Bold")
         .fontSize(9)
         .text(header, x + 2, currentY + 8, {
           width: colWidths[i] - 4,
           align: "center"
         });
    });

    currentY += headerHeight;

    // =====================================================
    // TABLE ROWS WITH VERTICAL LINES
    // =====================================================
    let grandSubtotal = 0;
    let grandGSTAmount = 0;
    let grandTotal = 0;

    rows.forEach((row, index) => {
      // Calculate values
      const unitRate = parseFloat(row.unit_rate) || 0;
      const quantity = parseInt(row.quantity) || 0;
      const gstRate = parseFloat(row.gst_rate) || 0;
      
      const subtotal = unitRate * quantity;
      const gstAmount = (subtotal * gstRate) / 100;
      const total = subtotal + gstAmount;
      
      // Add to grand totals
      grandSubtotal += subtotal;
      grandGSTAmount += gstAmount;
      grandTotal += total;

      const rowData = [
        (index + 1).toString(),
        row.po_no || "N/A",
        row.purchase_year || "N/A", 
        row.equipment_name || "N/A",
        row.ds_number || "N/A",
        quantity.toString(),
        unitRate.toFixed(2),
        gstRate.toFixed(2),
        total.toFixed(2),
        row.remark || ""
      ];

      const rowHeight = 20;
      
      // Draw row border
      doc.rect(tableStartX, currentY, totalTableWidth, rowHeight).stroke();

      // Draw data and vertical lines
      rowData.forEach((data, i) => {
        const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        
        // Draw vertical line before each column (except first)
        if (i > 0) {
          doc.moveTo(x, currentY)
             .lineTo(x, currentY + rowHeight)
             .stroke();
        }
        
        // Cell data
        doc.font("Helvetica")
           .fontSize(8)
           .text(data, x + 2, currentY + 6, {
             width: colWidths[i] - 4,
             align: "center"
           });
      });

      currentY += rowHeight;
      
      // Check if we need a new page
      if (currentY > doc.page.height - 150) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.moveDown(2);
    currentY = doc.y + 20;

    // =====================================================
    // TOTALS SECTION
    // =====================================================
    const totalsStartX = pageWidth - 280;
    
    doc.font("Helvetica-Bold")
       .fontSize(10);
    
    // Subtotal
    doc.text("Subtotal (Excl. GST):", totalsStartX, currentY);
    doc.text(`Rs ${grandSubtotal.toFixed(2)}`, totalsStartX + 150, currentY);
    currentY += 20;
    
    // GST Amount  
    doc.text("GST Amount:", totalsStartX, currentY);
    doc.text(`Rs ${grandGSTAmount.toFixed(2)}`, totalsStartX + 150, currentY);
    currentY += 20;
    
    // Total
    doc.fontSize(12);
    doc.text("Total Cost:", totalsStartX, currentY);
    doc.text(`Rs ${grandTotal.toFixed(2)}`, totalsStartX + 150, currentY);
    
    doc.moveDown(4);

    // =====================================================
    // SIGNATURE SECTION
    // =====================================================
    const signatureY = doc.y + 60;
    
    doc.font("Helvetica-Bold")
       .fontSize(11);
    
    // Lab Assistant signature (left side)
    doc.text("Lab Assistant", 80, signatureY);
    
    // Head of Department signature (right side)  
    doc.text("Head of Department", pageWidth - 200, signatureY);

    // =====================================================
    doc.end();
    
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating report" });
    }
  }
});


// backend/routes/deadstock.js
router.get("/download/deadstock-full-report", async (req, res) => {
  try {
    const staffId = req.query.staffId;

    // ✅ Fetch data first
    const [rows] = await db.query(
      "SELECT * FROM dead_stock_requirements WHERE staff_id = ? ORDER BY id",
      [staffId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No deadstock records found for this staff" });
    }

    // ✅ Start PDF generation
    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4" 
    });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition", 
      `attachment; filename=deadstock_full_report_${staffId}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
    doc.pipe(res);

    // =====================================================
    // TABLE WITH HEADER SECTION
    // =====================================================
    const pageWidth = doc.page.width;
    const tableStartX = 15;
    const tableWidth = pageWidth - 30; // Full width with margins
    let currentY = 50;

    // Define table structure - adjusted for better alignment
    const colWidths = [25, 55, 45, 90, 80, 25, 25, 50, 35, 55, 65];
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);

     // =====================================================
    // HEADER SECTION INSIDE TABLE (TOP BORDER)
    // =====================================================
    const headerSectionHeight = 100;
    
    // Draw outer border for header section
    doc.rect(tableStartX, currentY, totalTableWidth, headerSectionHeight).stroke();

    // Logo paths and dimensions
    const leftLogoPath = path.join(__dirname, "../../uploads/left_logo.jpg");
    const rightLogoPath = path.join(__dirname, "../../uploads/right_logo.png");
    const logoWidth = 55;
    const logoHeight = 55;
    const logoY = currentY + 20;

    // Left Logo
    doc.image(leftLogoPath, tableStartX + 15, logoY, { 
      width: logoWidth, 
      height: logoHeight 
    });
    
    // Right Logo
    doc.image(rightLogoPath, tableStartX + totalTableWidth - logoWidth - 15, logoY, { 
      width: logoWidth, 
      height: logoHeight 
    });
    
    // Draw vertical line after left logo
    const leftLineX = tableStartX + logoWidth + 25;
    doc.moveTo(leftLineX, currentY)
       .lineTo(leftLineX, currentY + headerSectionHeight)
       .stroke();
    
    // Draw vertical line before right logo
    const rightLineX = tableStartX + totalTableWidth - logoWidth - 25;
    doc.moveTo(rightLineX, currentY)
       .lineTo(rightLineX, currentY + headerSectionHeight)
       .stroke();
    
    // Header text - centered between logos
    const textStartX = tableStartX + logoWidth + 28;
    const textWidth = totalTableWidth - (2 * logoWidth) - 50;
    const textY = logoY + 5;
    
    doc.font("Helvetica-Bold")
       .fontSize(13)
       .text("Pimpri Chinchwad Education Trust's", textStartX, textY, {
         width: textWidth,
         align: "center"
       });
    
    doc.fontSize(12)
       .text("Pimpri Chinchwad College of Engineering & Research Ravet, Pune", textStartX, textY + 18, {
         width: textWidth,
         align: "center"
       });
    
    doc.fontSize(8)
       .text("An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified", textStartX, textY + 35, {
         width: textWidth,
         align: "center"
       });
    
    doc.font("Helvetica-Bold")
       .fontSize(10)
       .text("IQAC PCCOER", textStartX, textY + 54, {
         width: textWidth,
         align: "center"
       });

    currentY += headerSectionHeight;

    // =====================================================
    // STAFF ID & DATE SECTION
    // =====================================================
    const staffSectionHeight = 30;
    doc.rect(tableStartX, currentY, totalTableWidth, staffSectionHeight).stroke();
    
    doc.font("Helvetica-Bold")
       .fontSize(12)
       .text("DEADSTOCK REPORT", tableStartX, currentY + 8, {
         width: totalTableWidth,
         align: "center"
       });
    
  
    currentY += staffSectionHeight;

    // Add spacing between header and equipment list
    currentY += 15;

    // =====================================================
    // TABLE HEADER WITH VERTICAL LINES
    // =====================================================
    const headers = [
      "Sr.", 
      "PO No", 
      "Purchase\nYear", 
      "Equipment Name", 
      "DS No", 
      "Qty", 
      "Unit",
      "Rate (Rs)", 
      "GST (%)", 
      "Cost (Rs)", 
      "Remark"
    ];
    
    const headerHeight = 28;
    
    // Draw header background
    doc.rect(tableStartX, currentY, totalTableWidth, headerHeight).stroke();

    // Draw header text and vertical lines
    headers.forEach((header, i) => {
      const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      
      // Draw vertical line before each column (except first)
      if (i > 0) {
        doc.moveTo(x, currentY)
           .lineTo(x, currentY + headerHeight)
           .stroke();
      }
      
      // Header text
      doc.font("Helvetica-Bold")
         .fontSize(9)
         .text(header, x + 2, currentY + 8, {
           width: colWidths[i] - 4,
           align: "center"
         });
    });

    currentY += headerHeight;

    // =====================================================
    // TABLE ROWS WITH VERTICAL LINES
    // =====================================================
    let grandSubtotal = 0;
    let grandGSTAmount = 0;
    let grandTotal = 0;

    rows.forEach((row, index) => {
      // Calculate values
      const unitRate = parseFloat(row.subtotal_excl_gst) / parseInt(row.quantity) || 0;
      const quantity = parseInt(row.quantity) || 0;
      const gstRate = parseFloat(row.gst_rate) || 0;
      
      const subtotal = unitRate * quantity;
      const gstAmount = (subtotal * gstRate) / 100;
      const total = subtotal + gstAmount;
      
      // Add to grand totals
      grandSubtotal += subtotal;
      grandGSTAmount += gstAmount;
      grandTotal += total;

      const rowData = [
        (index + 1).toString(),
        row.po_no || "",
        row.purchase_year || "", 
        row.equipment_name || "",
        row.ds_number || "",
        quantity.toString(),
        "Nos",
        unitRate.toFixed(2),
        gstRate.toFixed(2),
        total.toFixed(2),
        row.remark || ""
      ];

      // Calculate dynamic row height based on content length
      const equipmentNameLength = (row.equipment_name || "").length;
      const dsNumberLength = (row.ds_number || "").length;
      const remarkLength = (row.remark || "").length;
      
      // Determine row height (minimum 20, add more for long content)
      let rowHeight = 20;
      if (equipmentNameLength > 25 || dsNumberLength > 20 || remarkLength > 15) {
        rowHeight = 28;
      }
      if (equipmentNameLength > 40 || dsNumberLength > 35 || remarkLength > 25) {
        rowHeight = 36;
      }
      
      // Draw row border
      doc.rect(tableStartX, currentY, totalTableWidth, rowHeight).stroke();

      // Draw data and vertical lines
      rowData.forEach((data, i) => {
        const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        
        // Draw vertical line before each column (except first)
        if (i > 0) {
          doc.moveTo(x, currentY)
             .lineTo(x, currentY + rowHeight)
             .stroke();
        }
        
        // Cell data - align differently based on column
        let align = "center";
        let textY = currentY + 6;
        
        // Column-specific alignment
        if (i === 3) { // Equipment Name
          align = "left";
          textY = currentY + 4;
        } else if (i === 4) { // DS Number
          align = "left";
          textY = currentY + 4;
        } else if (i === 7 || i === 9) { // Rate and Cost
          align = "right";
        } else if (i === 10) { // Remark
          align = "left";
          textY = currentY + 4;
        }
        
        doc.font("Helvetica")
           .fontSize(7)
           .text(data, x + 2, textY, {
             width: colWidths[i] - 4,
             align: align,
             lineGap: 1
           });
      });

      currentY += rowHeight;
      
      // Check if we need a new page
      if (currentY > doc.page.height - 150) {
        doc.addPage();
        currentY = 50;
        
        // Redraw headers on new page
        doc.rect(tableStartX, currentY, totalTableWidth, headerHeight).stroke();
        headers.forEach((header, i) => {
          const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          if (i > 0) {
            doc.moveTo(x, currentY)
               .lineTo(x, currentY + headerHeight)
               .stroke();
          }
          doc.font("Helvetica-Bold")
             .fontSize(9)
             .text(header, x + 2, currentY + 8, {
               width: colWidths[i] - 4,
               align: "center"
             });
        });
        currentY += headerHeight;
      }
    });

    doc.moveDown(2);
    currentY = doc.y + 20;

    // =====================================================
    // GRAND TOTALS SECTION
    // =====================================================
    const totalsStartX = pageWidth - 280;
    
    doc.font("Helvetica-Bold")
       .fontSize(12)
       .text("GRAND TOTALS", 0, currentY, { width: pageWidth, align: "center" });
    
    currentY += 25;
    
    doc.fontSize(10);
    
    // Subtotal
    doc.text("Subtotal (Excl. GST):", totalsStartX, currentY);
    doc.text(`Rs ${grandSubtotal.toFixed(2)}`, totalsStartX + 150, currentY);
    currentY += 20;
    
    // GST Amount  
    doc.text("GST Amount:", totalsStartX, currentY);
    doc.text(`Rs ${grandGSTAmount.toFixed(2)}`, totalsStartX + 150, currentY);
    currentY += 20;
    
    // Grand Total
    doc.fontSize(12);
    doc.text("GRAND TOTAL:", totalsStartX, currentY);
    doc.text(`Rs ${grandTotal.toFixed(2)}`, totalsStartX + 150, currentY);
    
    doc.moveDown(4);

    // =====================================================
    // SIGNATURE SECTION
    // =====================================================
    const signatureY = doc.y + 60;
    
    doc.font("Helvetica-Bold")
       .fontSize(11);
    
    // Lab Assistant signature (left side)
    doc.text("Lab Assistant", 80, signatureY);
    
    // Head of Department signature (right side)  
    doc.text("Head of Department", pageWidth - 200, signatureY);

    // =====================================================
    doc.end();
    
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating report" });
    }
  }
});

router.get("/api/labs", async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id AS lab_id,
        l.lab_no,
        l.lab_name,
        l.building,
        l.floor,
        l.capacity,
        l.status AS lab_status,
        l.created_at,
        l.last_updated,
        l.admin_id,
        COUNT(d.deadstock_id) AS total_reports,
        SUM(d.quantity) AS total_items,
        SUM(d.total_incl_gst) AS total_value,
        MAX(d.date_submitted) AS last_report_date
      FROM labs l
      LEFT JOIN deadstock d ON l.id = d.lab_id
      GROUP BY l.id
      ORDER BY l.lab_no ASC
    `;

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching labs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/downloads/deadstock-full-report", async (req, res) => {
  try {
    const labId = req.query.labId;

    // ✅ Step 1: Get staff_id from the staff table using lab_id
    const [staffRows] = await db.query(
      "SELECT id FROM staff WHERE lab_id = ? LIMIT 1",
      [labId]
    );

    if (!staffRows.length) {
      return res.status(404).json({ message: "No staff found for this lab" });
    }

    const staffId = staffRows[0].id;

    // ✅ Step 2: Fetch deadstock data using staff_id
    const [rows] = await db.query(
      "SELECT * FROM dead_stock_requirements WHERE staff_id = ? ORDER BY id",
      [staffId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No deadstock records found for this staff" });
    }

    // ... rest of your PDF generation code remains the same
    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4" 
    });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition", 
      `attachment; filename=deadstock_full_report_${staffId}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
    doc.pipe(res);

    // =====================================================
    // TABLE WITH HEADER SECTION
    // =====================================================
    const pageWidth = doc.page.width;
    const tableStartX = 15;
    const tableWidth = pageWidth - 30; // Full width with margins
    let currentY = 50;

    // Define table structure - adjusted for better alignment
    const colWidths = [25, 55, 45, 90, 80, 25, 25, 50, 35, 55, 65];
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);

     // =====================================================
    // HEADER SECTION INSIDE TABLE (TOP BORDER)
    // =====================================================
    const headerSectionHeight = 100;
    
    // Draw outer border for header section
    doc.rect(tableStartX, currentY, totalTableWidth, headerSectionHeight).stroke();

    // Logo paths and dimensions
    const leftLogoPath = path.join(__dirname, "../../uploads/left_logo.jpg");
    const rightLogoPath = path.join(__dirname, "../../uploads/right_logo.png");
    const logoWidth = 55;
    const logoHeight = 55;
    const logoY = currentY + 20;

    // Left Logo
    doc.image(leftLogoPath, tableStartX + 15, logoY, { 
      width: logoWidth, 
      height: logoHeight 
    });
    
    // Right Logo
    doc.image(rightLogoPath, tableStartX + totalTableWidth - logoWidth - 15, logoY, { 
      width: logoWidth, 
      height: logoHeight 
    });
    
    // Draw vertical line after left logo
    const leftLineX = tableStartX + logoWidth + 25;
    doc.moveTo(leftLineX, currentY)
       .lineTo(leftLineX, currentY + headerSectionHeight)
       .stroke();
    
    // Draw vertical line before right logo
    const rightLineX = tableStartX + totalTableWidth - logoWidth - 25;
    doc.moveTo(rightLineX, currentY)
       .lineTo(rightLineX, currentY + headerSectionHeight)
       .stroke();
    
    // Header text - centered between logos
    const textStartX = tableStartX + logoWidth + 30;
    const textWidth = totalTableWidth - (2 * logoWidth) - 60;
    const textY = logoY + 5;
    
    doc.font("Helvetica-Bold")
       .fontSize(13)
       .text("Pimpri Chinchwad Education Trust's", textStartX, textY, {
         width: textWidth,
         align: "center"
       });
    
    doc.fontSize(12)
       .text("Pimpri Chinchwad College of Engineering & Research Ravet, Pune", textStartX, textY + 18, {
         width: textWidth,
         align: "center"
       });
    
    doc.fontSize(8)
       .text("An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified", textStartX, textY + 35, {
         width: textWidth,
         align: "center"
       });
    
    doc.font("Helvetica-Bold")
       .fontSize(10)
       .text("IQAC PCCOER", textStartX, textY + 54, {
         width: textWidth,
         align: "center"
       });

    currentY += headerSectionHeight;

    // =====================================================
    // STAFF ID & DATE SECTION
    // =====================================================
    const staffSectionHeight = 30;
    doc.rect(tableStartX, currentY, totalTableWidth, staffSectionHeight).stroke();
    
    doc.font("Helvetica-Bold")
       .fontSize(12)
       .text("DEADSTOCK REPORT", tableStartX, currentY + 8, {
         width: totalTableWidth,
         align: "center"
       });
    
  
    currentY += staffSectionHeight;

    // Add spacing between header and equipment list
    currentY += 15;

    // =====================================================
    // TABLE HEADER WITH VERTICAL LINES
    // =====================================================
    const headers = [
      "Sr.", 
      "PO No", 
      "Purchase\nYear", 
      "Equipment Name", 
      "DS No", 
      "Qty", 
      "Unit",
      "Rate (Rs)", 
      "GST (%)", 
      "Cost (Rs)", 
      "Remark"
    ];
    
    const headerHeight = 28;
    
    // Draw header background
    doc.rect(tableStartX, currentY, totalTableWidth, headerHeight).stroke();

    // Draw header text and vertical lines
    headers.forEach((header, i) => {
      const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      
      // Draw vertical line before each column (except first)
      if (i > 0) {
        doc.moveTo(x, currentY)
           .lineTo(x, currentY + headerHeight)
           .stroke();
      }
      
      // Header text
      doc.font("Helvetica-Bold")
         .fontSize(9)
         .text(header, x + 2, currentY + 8, {
           width: colWidths[i] - 4,
           align: "center"
         });
    });

    currentY += headerHeight;

    // =====================================================
    // TABLE ROWS WITH VERTICAL LINES
    // =====================================================
    let grandSubtotal = 0;
    let grandGSTAmount = 0;
    let grandTotal = 0;

    rows.forEach((row, index) => {
      // Calculate values
      const unitRate = parseFloat(row.subtotal_excl_gst) / parseInt(row.quantity) || 0;
      const quantity = parseInt(row.quantity) || 0;
      const gstRate = parseFloat(row.gst_rate) || 0;
      
      const subtotal = unitRate * quantity;
      const gstAmount = (subtotal * gstRate) / 100;
      const total = subtotal + gstAmount;
      
      // Add to grand totals
      grandSubtotal += subtotal;
      grandGSTAmount += gstAmount;
      grandTotal += total;

      const rowData = [
        (index + 1).toString(),
        row.po_no || "",
        row.purchase_year || "", 
        row.equipment_name || "",
        row.ds_number || "",
        quantity.toString(),
        "Nos",
        unitRate.toFixed(2),
        gstRate.toFixed(2),
        total.toFixed(2),
        row.remark || ""
      ];

      // Calculate dynamic row height based on content length
      const equipmentNameLength = (row.equipment_name || "").length;
      const dsNumberLength = (row.ds_number || "").length;
      const remarkLength = (row.remark || "").length;
      
      // Determine row height (minimum 20, add more for long content)
      let rowHeight = 20;
      if (equipmentNameLength > 25 || dsNumberLength > 20 || remarkLength > 15) {
        rowHeight = 28;
      }
      if (equipmentNameLength > 40 || dsNumberLength > 35 || remarkLength > 25) {
        rowHeight = 36;
      }
      
      // Draw row border
      doc.rect(tableStartX, currentY, totalTableWidth, rowHeight).stroke();

      // Draw data and vertical lines
      rowData.forEach((data, i) => {
        const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        
        // Draw vertical line before each column (except first)
        if (i > 0) {
          doc.moveTo(x, currentY)
             .lineTo(x, currentY + rowHeight)
             .stroke();
        }
        
        // Cell data - align differently based on column
        let align = "center";
        let textY = currentY + 6;
        
        // Column-specific alignment
        if (i === 3) { // Equipment Name
          align = "left";
          textY = currentY + 4;
        } else if (i === 4) { // DS Number
          align = "left";
          textY = currentY + 4;
        } else if (i === 7 || i === 9) { // Rate and Cost
          align = "right";
        } else if (i === 10) { // Remark
          align = "left";
          textY = currentY + 4;
        }
        
        doc.font("Helvetica")
           .fontSize(7)
           .text(data, x + 2, textY, {
             width: colWidths[i] - 4,
             align: align,
             lineGap: 1
           });
      });

      currentY += rowHeight;
      
      // Check if we need a new page
      if (currentY > doc.page.height - 150) {
        doc.addPage();
        currentY = 50;
        
        // Redraw headers on new page
        doc.rect(tableStartX, currentY, totalTableWidth, headerHeight).stroke();
        headers.forEach((header, i) => {
          const x = tableStartX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          if (i > 0) {
            doc.moveTo(x, currentY)
               .lineTo(x, currentY + headerHeight)
               .stroke();
          }
          doc.font("Helvetica-Bold")
             .fontSize(9)
             .text(header, x + 2, currentY + 8, {
               width: colWidths[i] - 4,
               align: "center"
             });
        });
        currentY += headerHeight;
      }
    });

    doc.moveDown(2);
    currentY = doc.y + 20;

    // =====================================================
    // GRAND TOTALS SECTION
    // =====================================================
    const totalsStartX = pageWidth - 280;
    
    doc.font("Helvetica-Bold")
       .fontSize(12)
       .text("GRAND TOTALS", 0, currentY, { width: pageWidth, align: "center" });
    
    currentY += 25;
    
    doc.fontSize(10);
    
    // Subtotal
    doc.text("Subtotal (Excl. GST):", totalsStartX, currentY);
    doc.text(`Rs ${grandSubtotal.toFixed(2)}`, totalsStartX + 150, currentY);
    currentY += 20;
    
    // GST Amount  
    doc.text("GST Amount:", totalsStartX, currentY);
    doc.text(`Rs ${grandGSTAmount.toFixed(2)}`, totalsStartX + 150, currentY);
    currentY += 20;
    
    // Grand Total
    doc.fontSize(12);
    doc.text("GRAND TOTAL:", totalsStartX, currentY);
    doc.text(`Rs ${grandTotal.toFixed(2)}`, totalsStartX + 150, currentY);
    
    doc.moveDown(4);

    // =====================================================
    // SIGNATURE SECTION
    // =====================================================
    const signatureY = doc.y + 60;
    
    doc.font("Helvetica-Bold")
       .fontSize(11);
    
    // Lab Assistant signature (left side)
    doc.text("Lab Assistant", 80, signatureY);
    
    // Head of Department signature (right side)  
    doc.text("Head of Department", pageWidth - 200, signatureY);

    // =====================================================
    doc.end();
    
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating report" });
    }
  }
});



module.exports = router;