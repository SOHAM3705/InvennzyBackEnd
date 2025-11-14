const express = require("express");
const router = express.Router();
const db = require("../../db");
const NotificationService = require("../../utils/Notification/notificationservice");

// =======================
// LAB IN-CHARGE ROUTES
// =======================

router.post("/create", async (req, res) => {
  try {
    const { form, staff_id, equipment_id } = req.body;

    const [result] = await db.query(`
      INSERT INTO requests (
        type_of_problem, date, department, location,
        complaint_details, recurring_complaint, recurring_times,
        lab_assistant, lab_assistant_date, hod, hod_date,
        current_step, completed_steps, staff_id, equipment_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [
      form.typeOfProblem,
      form.date,
      form.department,
      form.location,
      form.complaintDetails,
      form.recurringComplaint,
      form.recurringTimes,
      form.labAssistant,
      form.labAssistantDate,
      form.hod,
      form.hodDate,
      staff_id,
      equipment_id
    ]);

    const requestId = result.insertId;

    // Update equipment to maintenance
    await db.query(
      `UPDATE equipment_details SET equipment_status = '2' WHERE equipment_id = ?`,
      [equipment_id]
    );

    // Notification → Lab Assistant
    const [noti] = await db.query(`
      INSERT INTO notifications (user_role, type, title, message, request_id, staff_id)
      VALUES ('labassistant', 'info', 'Request Created', 'You have created a maintenance request.', ?, ?)
    `, [requestId, staff_id]);

    await NotificationService.handleNotification(noti.insertId);

    res.json({ success: true, requestId });

  } catch (err) {
    console.error("LIC Create Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch all requests created by a LIC (based on staff_id)
router.get("/lic/:staff_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, e.equipment_name, e.equipment_code, e.equipment_type
       FROM requests r
       LEFT JOIN equipment_details e ON r.equipment_id = e.equipment_id
       WHERE r.staff_id = ?`,
      [req.params.staff_id]
    );

    res.json(rows);

  } catch (err) {
    console.error("LIC Fetch Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single request by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM requests WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Request Fetch Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// =======================
// LAB ASSISTANT ROUTES
// =======================

// Fetch all requests assigned to assistant by staff_id
router.get("/assistant/:staff_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM requests WHERE staff_id = ?`,
      [req.params.staff_id]
    );
    res.json(rows);

  } catch (err) {
    console.error("Assistant Fetch Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/assistant/:id/step", async (req, res) => {
  try {
    const { currentStep, completedSteps, message } = req.body;
    const requestId = req.params.id;

    await db.query(`
      UPDATE requests SET current_step = ?, completed_steps = ? WHERE id = ?
    `, [currentStep, completedSteps, requestId]);

    const [[request]] = await db.query(
      "SELECT staff_id FROM requests WHERE id = ?",
      [requestId]
    );

    // Notify Lab Incharge
    const [noti] = await db.query(`
      INSERT INTO notifications (user_role, type, title, message, request_id, staff_id)
      VALUES ('labincharge', 'maintenance', 'Request Progressed', ?, ?, ?)
    `, [message, requestId, request.staff_id]);

    await NotificationService.handleNotification(noti.insertId);

    res.json({ success: true });

  } catch (err) {
    console.error("Assistant Step Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Verification Step (Level 3)
router.put("/assistant/:id/verification", async (req, res) => {
  try {
    const requestId = req.params.id;
    const {
      assignedPerson,
      inChargeDate,
      verificationRemarks,
      currentStep,
      completedSteps,
      message
    } = req.body;

    await db.query(`
      UPDATE requests
      SET assigned_person = ?, in_charge_date = ?, verification_remarks = ?,
          current_step = ?, completed_steps = ?
      WHERE id = ?
    `, [
      assignedPerson,
      inChargeDate,
      verificationRemarks,
      currentStep,
      completedSteps,
      requestId
    ]);

    const [[request]] = await db.query(
      "SELECT staff_id FROM requests WHERE id = ?",
      [requestId]
    );

    // Notify Incharge
    const [noti] = await db.query(`
      INSERT INTO notifications (user_role, type, title, message, request_id, staff_id)
      VALUES ('labincharge', 'maintenance', 'Verification Completed', ?, ?, ?)
    `, [message, requestId, request.staff_id]);

    await NotificationService.handleNotification(noti.insertId);

    res.json({ success: true });

  } catch (err) {
    console.error("Assistant Step 3 Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



router.put("/admin/:id/approved", async (req, res) => {
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

router.put("/admin/:id/rejected", async (req, res) => {
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

router.put("/assistant/:id/corrective", async (req, res) => {
  try {
    const requestId = req.params.id;
    const {
      materialsUsed,
      resolvedInhouse,
      resolvedRemark,
      consumablesNeeded,
      consumableDetails,
      externalAgencyNeeded,
      agencyName,
      approxExpenditure,
    } = req.body;

    // Determine next steps
    let nextStep = resolvedInhouse === "yes" ? 6 : 5;
    let completedSteps = resolvedInhouse === "yes" ? 6 : 4;

    let message =
      resolvedInhouse === "yes"
        ? "Resolved in-house. Skipped Admin Approval → moved to Closure."
        : "Corrective action completed. Awaiting Admin Approval.";

    await db.query(`
      UPDATE requests
      SET materials_used = ?, resolved_inhouse = ?, resolved_remark = ?,
          consumables_needed = ?, consumable_details = ?, external_agency_needed = ?,
          agency_name = ?, approx_expenditure = ?,
          current_step = ?, completed_steps = ?
      WHERE id = ?
    `, [
      materialsUsed,
      resolvedInhouse,
      resolvedRemark,
      consumablesNeeded,
      consumableDetails,
      externalAgencyNeeded,
      agencyName,
      approxExpenditure,
      nextStep,
      completedSteps,
      requestId,
    ]);

    const [[request]] = await db.query(
      "SELECT staff_id FROM requests WHERE id = ?",
      [requestId]
    );

    // Always notify Incharge
    const [notiIncharge] = await db.query(`
      INSERT INTO notifications (user_role, type, title, message, request_id, staff_id)
      VALUES ('labincharge', 'maintenance', 'Corrective Action Completed', ?, ?, ?)
    `, [message, requestId, request.staff_id]);

    await NotificationService.handleNotification(notiIncharge.insertId);

    // Notify Admin only if NOT resolved in-house
    if (resolvedInhouse === "no") {
      const [notiAdmin] = await db.query(`
        INSERT INTO notifications (user_role, type, title, message, request_id, staff_id)
        VALUES ('admin', 'maintenance', 'Admin Approval Required', 'A corrective action requires your approval.', ?, ?)
      `, [requestId, request.staff_id]);

      await NotificationService.handleNotification(notiAdmin.insertId);
    }

    res.json({ success: true, skippedAdmin: resolvedInhouse === "yes" });

  } catch (err) {
    console.error("Assistant Step 4 Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// Closure Step (Level 5)
router.put("/assistant/:id/closure", async (req, res) => {
  try {
    const requestId = req.params.id;
    const {
      completionRemarkLab,
      labCompletionName,
      labCompletionSignature,
      labCompletionDate,
      completionRemarkMaintenance,
      maintenanceClosedDate,
      maintenanceClosedSignature,
      currentStep,
      completedSteps,
      message,
      equipmentStatus,
    } = req.body;

    // Map status to DB codes
    let statusValue = "2";
    if (equipmentStatus === "active") statusValue = "0";
    if (equipmentStatus === "damaged") statusValue = "1";

    await db.query(`
      UPDATE requests
      SET completion_remark_lab = ?, lab_completion_name = ?, lab_completion_signature = ?,
          lab_completion_date = ?, completion_remark_maintenance = ?, maintenance_closed_date = ?,
          maintenance_closed_signature = ?, current_step = ?, completed_steps = ?, 
          equipment_status = ?
      WHERE id = ?
    `, [
      completionRemarkLab,
      labCompletionName,
      labCompletionSignature,
      labCompletionDate,
      completionRemarkMaintenance,
      maintenanceClosedDate,
      maintenanceClosedSignature,
      currentStep,
      completedSteps,
      statusValue,
      requestId
    ]);

    const [[reqRow]] = await db.query(
      "SELECT staff_id, equipment_id FROM requests WHERE id = ?",
      [requestId]
    );

    // Update equipment as well
    await db.query(
      "UPDATE equipment_details SET equipment_status = ? WHERE equipment_id = ?",
      [statusValue, reqRow.equipment_id]
    );

    // Notify Incharge
    const [noti] = await db.query(`
      INSERT INTO notifications (user_role, type, title, message, request_id, staff_id)
      VALUES ('labincharge', 'maintenance', 'Closure Completed', ?, ?, ?)
    `, [message, requestId, reqRow.staff_id]);

    await NotificationService.handleNotification(noti.insertId);

    res.json({ success: true });

  } catch (err) {
    console.error("Assistant Step 5 Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
