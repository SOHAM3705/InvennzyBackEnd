const express = require('express');
const router = express.Router();
const db = require('../../db');

// Get equipment for a specific lab
router.get('/labs/equipment/:labId', (req, res) => {
    const { labId } = req.params;

    const query = `
    SELECT 
        equipment_id as id,
        equipment_name,
        equipment_code,
        equipment_type as type,
        equipment_status as status,
        equipment_password as password,
        company_name,
        specification,
        current_location
    FROM equipment_details
    WHERE lab_id = ?
    ORDER BY equipment_type, equipment_code
`;
    
    db.query(query, [labId], (err, results) => {
        if (err) {
            console.error('Error fetching equipment:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const grouped = {
            monitors: [],
            projectors: [],
            switch_boards: [],
            fans: [],
            wifi: [],
            others: []
        };

        results.forEach(equip => {
            const equipmentType = equip.type;
            if (grouped[equipmentType]) {
                grouped[equipmentType].push({
                    equipment_id: equip.id,
                    equipment_name: equip.equipment_name,
                    equipment_code: equip.equipment_code,
                    equipment_type: equipmentType,
                    equipment_status: equip.status,
                    equipment_password: equip.password,
                    company_name: equip.company_name,
                    specification: equip.specification,
                    current_location: equip.current_location
                });
            }
        });

        const counts = {};
        Object.keys(grouped).forEach(type => {
            counts[type] = grouped[type].length;
        });

        res.json({
            counts: counts,
            items: results,
            grouped: grouped
        });
    });
});

// Get labs assigned to a staff (incharge or assistant)
// routes/labs.js
router.get("/staff/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;

    // Step 1: Get staff info (with role fields + lab id)
    const [staffRows] = await db.query(
      `SELECT id, lab_id, incharge_name, incharge_email, assistant_name, assistant_email
       FROM staff WHERE id = ?`,
      [staffId]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    const staff = staffRows[0];

    // Step 2: Fetch lab details
    const [labRows] = await db.query(
      `SELECT * FROM labs WHERE id = ?`,
      [staff.lab_id]
    );

    if (labRows.length === 0) {
      return res.status(404).json({ error: "Lab not found" });
    }

    // Step 3: Attach role info from staff table
    const response = {
      staffId: staff.id,
      lab: labRows[0],
      incharge_name: staff.incharge_name,
      incharge_email: staff.incharge_email,
      assistant_name: staff.assistant_name,
      assistant_email: staff.assistant_email,
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching assigned lab for staff:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Handler for updating equipment details
const updateEquipmentHandler = async (req, res) => {
    console.log(`API hit: PUT ${req.originalUrl}`);
    const { equipmentId } = req.params;
    const {
        equipment_name,
        equipment_code,
        equipment_status,
        equipment_password,
        company_name,
        specification,
        current_location
    } = req.body;

    const numericId = parseInt(equipmentId.toString().replace(/[^\d]/g, ''), 10);
    if (isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid equipment ID format' });
    }

    const mapStatusToDb = (frontendStatus) => {
        switch(frontendStatus) {
            case 'active': return '0';
            case 'maintenance': return '2';
            case 'damaged': return '1';
            default: return '0';
        }
    };
    const dbStatus = mapStatusToDb(equipment_status);

    try {
        // --- Step 1: Update the equipment ---
        const updateQuery = `
            UPDATE equipment_details 
            SET equipment_name = ?, equipment_code = ?, equipment_status = ?, 
                equipment_password = ?, company_name = ?, specification = ?, current_location = ?
            WHERE equipment_id = ?`;

        const values = [
            equipment_name,
            equipment_code,
            dbStatus,
            equipment_password || null,
            company_name || null,
            specification || null,
            current_location || null,
            numericId
        ];

        // Notice there is no .promise() here
        const [updateResult] = await db.query(updateQuery, values);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Equipment not found or no changes made' });
        }


        // --- Step 2: Fetch the updated data to send back ---
        const selectQuery = `
            SELECT equipment_id as id, equipment_name, equipment_code, equipment_type as type,
                   equipment_status as status, equipment_password as password, company_name,
                   specification, current_location, lab_id
            FROM equipment_details
            WHERE equipment_id = ?`;

        // Notice there is no .promise() here
        const [updatedResults] = await db.query(selectQuery, [numericId]);

        if (updatedResults.length === 0) {
            return res.status(404).json({ error: 'Equipment updated but could not be found' });
        }

        const updatedEquipment = updatedResults[0];
        
        const mapStatusFromDb = (dbStatus) => {
            switch(String(dbStatus)) {
                case '0': return 'active';
                case '2': return 'maintenance';
                case '1': return 'damaged';
                default: return 'active';
            }
        };

        const responseData = {
            success: true,
            message: 'Equipment updated successfully',
            equipment: {
                equipment_id: updatedEquipment.id,
                equipment_name: updatedEquipment.equipment_name,
                equipment_code: updatedEquipment.equipment_code,
                equipment_type: updatedEquipment.type,
                status: mapStatusFromDb(updatedEquipment.status),
                password: updatedEquipment.password,
                company_name: updatedEquipment.company_name,
                specification: updatedEquipment.specification,
                current_location: updatedEquipment.current_location,
                lab_id: updatedEquipment.lab_id
            }
        };

        return res.json(responseData);

    } catch (err) {
        console.error('An error occurred in the update process:', err);
        return res.status(500).json({ error: 'Database error while processing update' });
    }
};

router.get('/equipment/:equipmentId', (req, res) => {
    const { equipmentId } = req.params;
    
    console.log('GET equipment endpoint called for ID:', equipmentId);
    
    const numericId = parseInt(equipmentId.toString().replace(/[^\d]/g, ''), 10);
    if (isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid equipment ID format' });
    }
    
    const query = `
        SELECT 
            equipment_id as id,
            equipment_name,
            equipment_code,
            equipment_type as type,
            equipment_status as status,
            equipment_password as password,
            company_name,
            specification,
            current_location,
            lab_id
        FROM equipment_details
        WHERE equipment_id = ?
    `;

    db.query(query, [numericId], (err, results) => {
        if (err) {
            console.error('Error fetching equipment:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        const equipment = results[0];
        
        const mapStatusFromDb = (dbStatus) => {
            switch(String(dbStatus)) {
                case '0': return 'active';
                case '2': return 'maintenance'; 
                case '1': return 'damaged';
                default: return 'active';
            }
        };
        
        res.json({
            success: true,
            equipment: {
                equipment_id: equipment.id,
                equipment_name: equipment.equipment_name,
                equipment_code: equipment.equipment_code,
                equipment_type: equipment.type,
                status: mapStatusFromDb(equipment.status),
                password: equipment.password,
                company_name: equipment.company_name,
                specification: equipment.specification,
                current_location: equipment.current_location,
                lab_id: equipment.lab_id
            }
        });
    });
});

router.get("/equipment", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM equipment_details");
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error("Error fetching equipment details:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch equipment details",
            error: err.message
        });
    }
});
async function getLabIdForStaff(staffId) {
  const [rows] = await db.query('SELECT lab_id FROM staff WHERE id = ? LIMIT 1', [staffId]);
  if (rows.length === 0) return null;
  return rows[0].lab_id || null;
}
/** Helper: map DB row to clean payload */
function mapRow(r) {
  const status_raw = String(r.equipment_status);
  const status_text =
    status_raw === '0' ? 'active' :
    status_raw === '1' ? 'maintenance' :
    'damaged';

  return {
    equipment_id: r.equipment_id,
    equipment_name: r.equipment_name,
    equipment_code: r.equipment_code,
    equipment_type: r.equipment_type,
    equipment_status: status_raw,
    status_text,
    equipment_password: r.equipment_password,
    company_name: r.company_name || null,
    specification: r.specification || null,
    current_location: r.current_location || null,
    lab_id: r.lab_id,
    updated_at: r.updated_at||null,
};
}
router.get('/labs/equipment/by-staff/:staffId', async (req, res) => {
  try {
    const staffId = parseInt(req.params.staffId, 10);
    if (Number.isNaN(staffId)) return res.status(400).json({ error: 'Invalid staff ID' });

    const labId = await getLabIdForStaff(staffId);
    if (!labId) return res.status(404).json({ error: 'No lab assigned to this staff' });

    const [equipRows] = await db.query(
  `SELECT equipment_id, lab_id, equipment_name, equipment_code, equipment_type,
          equipment_status, equipment_password, company_name, specification, current_location, updated_at
   FROM equipment_details
   WHERE lab_id = ?
   ORDER BY equipment_type, equipment_code`,
  [labId]
);

    const items = equipRows.map(mapRow);

    const grouped = { monitors: [], projectors: [], switch_boards: [], fans: [], wifi: [], others: [] };
    for (const item of items) {
      const key =
        item.equipment_type === 'monitor' ? 'monitors' :
        item.equipment_type === 'projector' ? 'projectors' :
        item.equipment_type === 'switch_board' ? 'switch_boards' :
        item.equipment_type === 'wifi' ? 'wifi' :
        item.equipment_type === 'fan' ? 'fans' :
        'others';
     
      grouped[key].push(item);
    }

    const counts = Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length]));
    res.json({ counts, items, grouped });
  } catch (err) {
    console.error('Error fetching equipment by staff:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/equipment/:equipmentId', updateEquipmentHandler);



module.exports = router;
