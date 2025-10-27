const express = require("express");
const router = express.Router();
const db = require("../../db");

// routes/notifications.js
router.get("/:role/:staff_id", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const { role, staff_id } = req.params;
    console.log("Fetching notifications for:", role, staff_id);

    const [rows] = await db.query(`
  SELECT n.id, n.user_role, n.type, n.title, n.message, n.is_read, n.timestamp,
         n.request_id, n.staff_id,
         e.equipment_id, e.equipment_name
  FROM notifications n
  JOIN requests r ON n.request_id = r.id
  JOIN equipment_details e ON r.equipment_id = e.equipment_id
  WHERE n.user_role = ? AND n.staff_id = ?
  ORDER BY n.timestamp DESC
`, [role, staff_id]);

    console.log("Notifications with equipment found:", rows);

    res.json(rows);
  } catch (err) {
    console.error("Notification Fetch Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// Mark a notification as read
router.put("/:id/read", async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Notification Read Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM notifications WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Notification Delete Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
