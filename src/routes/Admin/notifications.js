const express = require("express");
const router = express.Router();
const db = require("../../db");

// Fetch all requests with corrective action details for admin
router.get("/admin/reports", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        type_of_problem,
        date,
        department,
        location,
        complaint_details,
        lab_assistant,
        hod,
        staff_id,
        assigned_person,
        verification_remarks,
        materials_used,
        resolved_inhouse,
        resolved_remark,
        consumables_needed,
        consumable_details,
        external_agency_needed,
        agency_name,
        approx_expenditure,
        admin_approval_status AS adminApprovalStatus
      FROM requests
      ORDER BY id DESC;
    `;

    const [results] = await db.query(query);

    // ✅ keep enum values as-is
    const normalized = results.map(r => ({
      ...r,
      adminApprovalStatus: r.adminApprovalStatus || "pending", // default
    }));

    res.json(normalized);

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/notifications", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        type_of_problem,
        date,
        department,
        location,
        complaint_details,
        lab_assistant,
        hod,
        staff_id,
        assigned_person,
        verification_remarks,
        materials_used,
        resolved_inhouse,
        resolved_remark,
        consumables_needed,
        consumable_details,
        external_agency_needed,
        agency_name,
        approx_expenditure,
        admin_approval_status AS adminApprovalStatus
      FROM requests
      WHERE completed_steps = 4 AND current_step = 5
      ORDER BY id DESC;
    `;

    const [results] = await db.query(query);

    // ✅ keep enum values as-is, add default for null
    const normalized = results.map(r => ({
      ...r,
      adminApprovalStatus: r.adminApprovalStatus || "pending",
    }));

    res.json(normalized);

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get only pending notifications count
router.get("/admin/notifications/pending/count", async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM requests
      WHERE completed_steps = 4 
        AND current_step = 5
        AND (admin_approval_status IS NULL OR admin_approval_status = 'pending');
    `;

    const [results] = await db.query(query);
    res.json({ count: results[0].count });

  } catch (error) {
    console.error("Error fetching pending notifications count:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.put("/requests/admin/:id/approve", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE requests SET admin_approval_status = 'approved' WHERE id = ?`,
      [id]
    );
    res.json({ message: "Request approved successfully", requestId: id });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/requests/admin/:id/reject", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE requests SET admin_approval_status = 'rejected' WHERE id = ?`,
      [id]
    );
    res.json({ message: "Request rejected successfully", requestId: id });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/assistant/details/:id/approval", async (req, res) => {
  const { id } = req.params;
  let { adminApprovalStatus } = req.body;

  // Only allow approved/rejected/pending
  const validStatuses = ["approved", "rejected", "pending"];
  if (!validStatuses.includes(adminApprovalStatus)) {
    return res.status(400).json({ error: "Invalid approval status" });
  }

  try {
    const query = `
      UPDATE requests
      SET admin_approval_status = ?
      WHERE id = ?;
    `;

    const [result] = await db.query(query, [adminApprovalStatus, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({
      message: "Approval status updated successfully",
      requestId: id,
      adminApprovalStatus,
    });
  } catch (error) {
    console.error("Error updating approval status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
