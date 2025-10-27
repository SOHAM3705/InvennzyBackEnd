const express = require('express');
const router = express.Router();
const db = require('../../db'); // your mysql2/promise db pool
const multer = require('multer');
const path = require('path');
const verifyToken = require('../../middlewares/verifyToken'); // middleware to verify JWT token
const bcrypt = require('bcrypt');
const upload = require('../../middlewares/PhotoUploads'); 


/**
 * GET /api/settings/labincharge/profile
 */
router.get('/labincharge/profile', verifyToken, async (req, res) => {
  const userId = req.user.id;
  console.log("🔎 Executing profile query for userId:", userId);

  try {
    const [rows] = await db.query(
      `SELECT name, email, phone, department, role, profile_picture FROM labincharge WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'labincharge not found' });
    }

    res.json({ profile: rows[0] });
  } catch (err) {
    console.error('❌ Error fetching profile:', err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

/**
 * PUT /api/settinglabincharge
 * Accepts JSON or multipart/form-data (with optional profileImage)
 */
router.put('/inchargesetting', verifyToken, upload.single('profileImage'), async (req, res) => {
  const userId = req.user.id;

  try {
    const { name, email, phone, department, role } = req.body;
    const profileImageBuffer = req.file ? req.file.buffer : null;

    const fields = [name, email, phone || null, department || null, role];
    let query = `
      UPDATE labincharge
      SET name = ?, email = ?, phone = ?, department = ?, role = ?`;

    if (profileImageBuffer) {
      query += `, profile_picture = ?`;
      fields.push(profileImageBuffer);
    }
    
    query += ` WHERE id = ?`;
    fields.push(userId);

    const [result] = await db.query(query, fields);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'labincharge not found or no changes made' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ message: 'Update failed', error: err });
  }
});

router.put("/labincharge/password", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // 1. Get hashed password from DB
    const [rows] = await db.query("SELECT password FROM labincharge WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "labincharge not found" });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update password
    await db.query("UPDATE labincharge SET password = ? WHERE id = ?", [hashedNewPassword, userId]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET notification preferences
router.get("/labincharge/notifications", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT notify_email, notify_push, notify_sms FROM labincharge WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "labincharge not found" });
    }

    res.json({ notifications: rows[0] });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update notification preferences
router.put("/labincharge/notifications", verifyToken, async (req, res) => {
  const { notify_email, notify_push, notify_sms } = req.body;

  try {
    await db.query(
      `UPDATE labincharge 
       SET notify_email = ?, 
           notify_push = ?, 
           notify_sms = ?
       WHERE id = ?`,
      [notify_email, notify_push, notify_sms, req.user.id]
    );

    res.json({ message: "Notification preferences updated successfully" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
