const express = require('express');
const router = express.Router();
const db = require('../db');

// GET lab information for a lab incharge - Enhanced version
router.get('/incharge/:userId/lab', async (req, res) => {
  const userId = req.params.staffId;

  try {
    console.log('Looking for lab with userId:', userId);

    // Try multiple approaches to find the lab for this user
    let labRows = [];

    // Approach 1: Direct match in staff table where this user is incharge
    try {
      [labRows] = await db.query(`
        SELECT l.id as lab_id, l.lab_no, l.lab_name, l.building, l.floor, l.capacity, l.status
        FROM labs l
        JOIN staff s ON l.id = s.lab_id
        WHERE s.id = ? AND s.incharge_name IS NOT NULL
      `, [userId]);
      
      console.log('Approach 1 - Direct staff match:', labRows.length, 'results');
    } catch (e) {
      console.log('Approach 1 failed:', e.message);
    }

    // Approach 2: If not found, try matching via users table
    if (labRows.length === 0) {
      try {
        [labRows] = await db.query(`
          SELECT l.id as lab_id, l.lab_no, l.lab_name, l.building, l.floor, l.capacity, l.status
          FROM labs l
          JOIN staff s ON l.id = s.lab_id
          JOIN users u ON s.id = u.staff_id
          WHERE u.id = ? AND s.incharge_name IS NOT NULL
        `, [userId]);
        
        console.log('Approach 2 - Via users table:', labRows.length, 'results');
      } catch (e) {
        console.log('Approach 2 failed:', e.message);
      }
    }

    // Approach 3: Try finding any staff record for this user (incharge or assistant)
    if (labRows.length === 0) {
      try {
        [labRows] = await db.query(`
          SELECT l.id as lab_id, l.lab_no, l.lab_name, l.building, l.floor, l.capacity, l.status
          FROM labs l
          JOIN staff s ON l.id = s.lab_id
          WHERE s.id = ?
        `, [userId]);
        
        console.log('Approach 3 - Any staff record:', labRows.length, 'results');
      } catch (e) {
        console.log('Approach 3 failed:', e.message);
      }
    }

    // Approach 4: Try via users table for any staff role
    if (labRows.length === 0) {
      try {
        [labRows] = await db.query(`
          SELECT l.id as lab_id, l.lab_no, l.lab_name, l.building, l.floor, l.capacity, l.status
          FROM labs l
          JOIN staff s ON l.id = s.lab_id
          JOIN users u ON s.id = u.staff_id
          WHERE u.id = ?
        `, [userId]);
        
        console.log('Approach 4 - Via users table (any staff):', labRows.length, 'results');
      } catch (e) {
        console.log('Approach 4 failed:', e.message);
      }
    }

    if (labRows.length === 0) {
      console.log('No lab found for userId:', userId);
      return res.status(404).json({ 
        error: 'No lab found for this user',
        debug: {
          userId: userId,
          message: 'User is not assigned to any lab or not found in staff records'
        }
      });
    }

    const lab = labRows[0];
    console.log('Found lab:', lab);
    res.status(200).json(lab);
  } catch (error) {
    console.error('Error fetching lab for incharge:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lab information',
      debug: {
        userId: userId,
        message: error.message
      }
    });
  }
});

// GET staff information by userId - Enhanced version
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    console.log('Looking for staff with userId:', userId);

    let staffRows = [];

    // Approach 1: Direct match in staff table
    try {
      [staffRows] = await db.query(`
        SELECT s.*, l.lab_name, l.lab_no, l.building, l.floor
        FROM staff s
        JOIN labs l ON s.lab_id = l.id
        WHERE s.id = ?
      `, [userId]);
      
      console.log('Approach 1 - Direct staff match:', staffRows.length, 'results');
    } catch (e) {
      console.log('Approach 1 failed:', e.message);
    }

    // Approach 2: Match via users table
    if (staffRows.length === 0) {
      try {
        [staffRows] = await db.query(`
          SELECT s.*, l.lab_name, l.lab_no, l.building, l.floor, u.id as user_id
          FROM staff s
          JOIN labs l ON s.lab_id = l.id
          JOIN users u ON s.id = u.staff_id
          WHERE u.id = ?
        `, [userId]);
        
        console.log('Approach 2 - Via users table:', staffRows.length, 'results');
      } catch (e) {
        console.log('Approach 2 failed:', e.message);
      }
    }

    if (staffRows.length === 0) {
      console.log('No staff found for userId:', userId);
      return res.status(404).json({ 
        error: 'Staff member not found',
        debug: {
          userId: userId,
          message: 'User not found in staff records'
        }
      });
    }

    const staff = staffRows[0];
    console.log('Found staff:', staff);
    res.status(200).json(staff);
  } catch (error) {
    console.error('Error fetching staff information:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staff information',
      debug: {
        userId: userId,
        message: error.message
      }
    });
  }
});

// NEW: Debug endpoint to help troubleshoot user lookup
router.get('/debug/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const debug = {
      userId: userId,
      results: {}
    };

    // Check users table
    try {
      const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      debug.results.users = userRows;
    } catch (e) {
      debug.results.users_error = e.message;
    }

    // Check staff table
    try {
      const [staffRows] = await db.query('SELECT * FROM staff WHERE id = ?', [userId]);
      debug.results.staff_direct = staffRows;
    } catch (e) {
      debug.results.staff_direct_error = e.message;
    }

    // Check staff via users table
    try {
      const [staffViaUsers] = await db.query(`
        SELECT s.*, u.id as user_id 
        FROM staff s 
        JOIN users u ON s.id = u.staff_id 
        WHERE u.id = ?
      `, [userId]);
      debug.results.staff_via_users = staffViaUsers;
    } catch (e) {
      debug.results.staff_via_users_error = e.message;
    }

    // Check all tables structure
    try {
      const [usersCols] = await db.query('DESCRIBE users');
      const [staffCols] = await db.query('DESCRIBE staff');
      const [labsCols] = await db.query('DESCRIBE labs');
      
      debug.schema = {
        users: usersCols.map(col => col.Field),
        staff: staffCols.map(col => col.Field),
        labs: labsCols.map(col => col.Field)
      };
    } catch (e) {
      debug.schema_error = e.message;
    }

    res.status(200).json(debug);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed', message: error.message });
  }
});



module.exports = router;