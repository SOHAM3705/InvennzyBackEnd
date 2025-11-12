const express = require('express');
const router = express.Router();
const db = require('../../db'); // Add DB connection here
const Lab = require('../../models/Labs');

// ✅ GET labs by adminId
router.get('/admin/:adminId', async (req, res) => {
  try {
    const labs = await Lab.findByAdminId(req.params.adminId);
    res.status(200).json(labs);
  } catch (error) {
    console.error('Error fetching labs for admin:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// ✅ GET all labs
router.get('/', async (req, res) => {
  try {
    const labs = await Lab.findAll();
    res.status(200).json(labs);
  } catch (error) {
    console.error('Error fetching all labs:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// ✅ NEW: GET equipment for a specific lab by labId (MOVED BEFORE /:id route)
router.get('/equipment/:labId', async (req, res) => {
  const labId = req.params.labId;

  try {
    const [rows] = await db.query(`
      SELECT monitors, projectors, switch_boards, fans, wifi, others
      FROM equipment
      WHERE lab_id = ?
    `, [labId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No equipment found for this lab' });
    }

    res.status(200).json(rows[0]); // Return equipment object
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

router.get('/equipment/:adminId/:labId/:type', async (req, res) => {
  try {
    const { adminId, labId, type } = req.params;
    
    // Validate equipment type
    const validTypes = ['monitor', 'projector', 'switch_board', 'fan', 'wifi', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid equipment type' });
    }

    const query = `
      SELECT ed.*
      FROM equipment_details ed
      JOIN labs l ON ed.lab_id = l.id
      WHERE ed.lab_id = ? AND ed.equipment_type = ? AND l.admin_id = ?
      ORDER BY ed.created_at DESC
    `;
    
    const [rows] = await db.execute(query, [labId, type, adminId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching equipment details:', error);
    res.status(500).json({ error: 'Failed to fetch equipment details' });
  }
});

// ✅ GET a single lab by ID
router.get('/:id', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    res.status(200).json(lab);
  } catch (error) {
    console.error('Error fetching lab:', error);
    res.status(500).json({ error: 'Failed to fetch lab' });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      labNo, labName, building, floor, capacity,
      monitors, projectors, switchBoards, fans, wifi, others,
      inchargeName, inchargeEmail, inchargePhone,
      assistantName, assistantEmail, assistantPhone,
      status, adminId
    } = req.body;

    if (!labNo || !labName || !building || !floor || !adminId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Create Lab
    const newLab = await Lab.create({
      labNo, labName, building, floor, capacity,
      monitors, projectors, switchBoards, fans, wifi, others,
      inchargeName, inchargeEmail, inchargePhone,
      assistantName, assistantEmail, assistantPhone,
      status, adminId,
    });

    const labId = newLab.id;

    // 2️⃣ Generate random passwords
    const inchargePasswordPlain = crypto.randomBytes(4).toString("hex");
    const assistantPasswordPlain = crypto.randomBytes(4).toString("hex");

    // 3️⃣ Hash passwords
    const inchargePasswordHash = await bcrypt.hash(inchargePasswordPlain, 10);
    const assistantPasswordHash = await bcrypt.hash(assistantPasswordPlain, 10);

    // 4️⃣ Insert into labincharge and labassistant tables
    if (inchargeName && inchargeEmail) {
      await db.query(
        `INSERT INTO labincharge (name, email, phone, password, lab_id, admin_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [inchargeName, inchargeEmail, inchargePhone, inchargePasswordHash, labId, adminId]
      );
    }

    if (assistantName && assistantEmail) {
      await db.query(
        `INSERT INTO labassistant (name, email, phone, password, lab_id, admin_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [assistantName, assistantEmail, assistantPhone, assistantPasswordHash, labId, adminId]
      );
    }

    // 5️⃣ Send account creation emails
    try {
      if (inchargeEmail) {
        await sendEmail({
          to: inchargeEmail,
          name: inchargeName,
          plainPassword: inchargePasswordPlain,
          subject: `Your Invennzy Account (Lab Incharge - ${labName})`,
        });
      }
      if (assistantEmail) {
        await sendEmail({
          to: assistantEmail,
          name: assistantName,
          plainPassword: assistantPasswordPlain,
          subject: `Your Invennzy Account (Lab Assistant - ${labName})`,
        });
      }
    } catch (emailError) {
      console.error("⚠️ Email send error:", emailError.message);
      // Don't block creation if email fails
    }

    // 6️⃣ Create equipment (your original logic)
    const equipmentInsert = [];
    const createEquipments = (type, count) => {
      for (let i = 1; i <= count; i++) {
        equipmentInsert.push([
          labId,
          null,
          type,
          `${type} ${i}`,
          `${type}-${labId}-${i}`,
          "0",
          null,
          null,
          null,
          labNo,
        ]);
      }
    };

    createEquipments("monitor", monitors);
    createEquipments("projector", projectors);
    createEquipments("switch_board", switchBoards);
    createEquipments("fan", fans);
    createEquipments("wifi", wifi);
    createEquipments("other", others);

    if (equipmentInsert.length > 0) {
      await db.query(
        `INSERT INTO equipment_details 
         (lab_id, staff_id, equipment_type, equipment_name, equipment_code, equipment_status, equipment_password, company_name, specification, current_location)
         VALUES ?`,
        [equipmentInsert]
      );
    }

    res.status(201).json({
      message: "Lab created successfully with Lab Incharge and Assistant accounts.",
      lab: newLab,
    });
  } catch (error) {
    console.error("❌ Error creating lab:", error);
    res.status(500).json({ error: "Failed to create lab" });
  }
});

// ✅ DELETE lab
router.delete('/:id', async (req, res) => {
  const labId = req.params.id;
  try {
    // First delete equipment for this lab
    await db.query(`DELETE FROM equipment_details WHERE lab_id = ?`, [labId]);

    // Then delete the lab
    const deleted = await Lab.delete(labId);
    if (!deleted) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    res.status(200).json({ message: 'Lab and related equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab:', error);
    res.status(500).json({ error: 'Failed to delete lab' });
  }
});


module.exports = router;