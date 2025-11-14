const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/emailsender'); // ✅ add this import

class Lab {
  static async findByAdminId(adminId) {
    const [rows] = await db.query(`
      SELECT 
        l.*, 
        e.monitors, e.projectors, e.switch_boards, e.fans, e.wifi, e.others,
        s.incharge_name, s.incharge_email, s.incharge_phone,
        s.assistant_name, s.assistant_email, s.assistant_phone
      FROM labs l
      LEFT JOIN equipment e ON l.id = e.lab_id
      LEFT JOIN staff s ON l.id = s.lab_id
      WHERE l.admin_id = ?
      ORDER BY l.lab_no
    `, [adminId]);
    return rows;
  }

  static async findAll() {
    const [rows] = await db.query(`
      SELECT 
        l.*, 
        e.monitors, e.projectors, e.switch_boards, e.fans, e.wifi, e.others,
        s.incharge_name, s.incharge_email, s.incharge_phone,
        s.assistant_name, s.assistant_email, s.assistant_phone
      FROM labs l
      LEFT JOIN equipment e ON l.id = e.lab_id
      LEFT JOIN staff s ON l.id = s.lab_id
      ORDER BY l.lab_no
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT 
        l.*, 
        e.monitors, e.projectors, e.switch_boards, e.fans, e.wifi, e.others,
        s.incharge_name, s.incharge_email, s.incharge_phone,
        s.assistant_name, s.assistant_email, s.assistant_phone
      FROM labs l
      LEFT JOIN equipment e ON l.id = e.lab_id
      LEFT JOIN staff s ON l.id = s.lab_id
      WHERE l.id = ?
    `, [id]);
    return rows[0];
  }

  // ✅ UPDATED create() with account creation + email sending
  static async create(labData) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // ✅ Insert into labs
      const [labResult] = await conn.query(`
        INSERT INTO labs (lab_no, lab_name, building, floor, capacity, status, admin_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        labData.labNo,
        labData.labName,
        labData.building,
        labData.floor,
        labData.capacity,
        labData.status,
        labData.adminId
      ]);

      const labId = labResult.insertId;

      // ✅ Insert into equipment
      await conn.query(`
        INSERT INTO equipment (lab_id, monitors, projectors, switch_boards, fans, wifi, others)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        labId,
        labData.monitors,
        labData.projectors,
        labData.switchBoards,
        labData.fans,
        labData.wifi,
        labData.others
      ]);

      // ✅ Insert into staff
      const [staffResult] = await conn.query(`
        INSERT INTO staff (lab_id, incharge_name, incharge_email, incharge_phone, 
                          assistant_name, assistant_email, assistant_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        labId,
        labData.inchargeName,
        labData.inchargeEmail,
        labData.inchargePhone,
        labData.assistantName,
        labData.assistantEmail,
        labData.assistantPhone
      ]);

      const staffId = staffResult.insertId;

      // ✅ Generate random passwords instead of default
      const inchargePlainPassword = crypto.randomBytes(4).toString('hex');
      const assistantPlainPassword = crypto.randomBytes(4).toString('hex');

      // ✅ Hash passwords
      const inchargeHashed = await bcrypt.hash(inchargePlainPassword, 10);
      const assistantHashed = await bcrypt.hash(assistantPlainPassword, 10);

      // ✅ Insert into labincharge
      await conn.query(`
        INSERT INTO labincharge (staff_id, name, email, password, google_id, profile_picture, role, notify_email, notify_push, notify_sms, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, NULL, ?, 1, 1, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password)
      `, [
        staffId,
        labData.inchargeName,
        labData.inchargeEmail,
        inchargeHashed,
        'lab_incharge'
      ]);

      // ✅ Insert into labassistant
      await conn.query(`
        INSERT INTO labassistant (staff_id, name, email, password, google_id, profile_picture, role, notify_email, notify_push, notify_sms, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, NULL, ?, 1, 1, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password)
      `, [
        staffId,
        labData.assistantName,
        labData.assistantEmail,
        assistantHashed,
        'lab_assistant'
      ]);

      await conn.commit();

      // ✅ Send emails (after transaction is committed)
      try {
        if (labData.inchargeEmail) {
          await sendEmail({
            to: labData.inchargeEmail,
            name: labData.inchargeName,
            plainPassword: inchargePlainPassword,
            subject: `Your Invennzy Account (Lab Incharge - ${labData.labName})`
          });
        }
        if (labData.assistantEmail) {
          await sendEmail({
            to: labData.assistantEmail,
            name: labData.assistantName,
            plainPassword: assistantPlainPassword,
            subject: `Your Invennzy Account (Lab Assistant - ${labData.labName})`
          });
        }
        console.log("✅ Account creation emails sent successfully!");
      } catch (emailErr) {
        console.error("⚠️ Email sending failed:", emailErr.response?.data || emailErr.message);
      }

      // ✅ Return full lab with joins
      const fullLab = await Lab.findById(labId);
      return fullLab;

    } catch (err) {
      await conn.rollback();
      console.error("❌ Transaction failed:", err.message);
      throw err;
    } finally {
      conn.release();
    }
  }

static async update(id, labData) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ---------------------------
    // GET OLD staff RECORD FIRST
    // ---------------------------
    const [[oldStaff]] = await conn.query(
      `SELECT * FROM staff WHERE lab_id = ?`,
      [id]
    );

    if (!oldStaff) {
      throw new Error("Staff record not found for this lab.");
    }

    // ---------------------------
    // CALCULATE SAFE VALUES (fallbacks)
    // ---------------------------
    const newInchargeName = labData.inchargeName || oldStaff.incharge_name;
    const newInchargeEmail = labData.inchargeEmail || oldStaff.incharge_email;
    const newInchargePhone = labData.inchargePhone || oldStaff.incharge_phone;

    const newAssistantName = labData.assistantName || oldStaff.assistant_name;
    const newAssistantEmail = labData.assistantEmail || oldStaff.assistant_email;
    const newAssistantPhone = labData.assistantPhone || oldStaff.assistant_phone;

    // ---------------------------
    // UPDATE labs
    // ---------------------------
    await conn.query(`
      UPDATE labs 
      SET lab_no = ?, lab_name = ?, building = ?, floor = ?, 
          capacity = ?, status = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      labData.labNo,
      labData.labName,
      labData.building,
      labData.floor,
      labData.capacity,
      labData.status,
      id
    ]);

    // ---------------------------
    // UPDATE equipment
    // ---------------------------
    await conn.query(`
      UPDATE equipment 
      SET monitors = ?, projectors = ?, switch_boards = ?, fans = ?, wifi = ?, others = ?
      WHERE lab_id = ?
    `, [
      labData.monitors,
      labData.projectors,
      labData.switchBoards,
      labData.fans,
      labData.wifi,
      labData.others,
      id
    ]);

    // ---------------------------
    // UPDATE staff with safe values
    // ---------------------------
    await conn.query(`
      UPDATE staff 
      SET incharge_name = ?, incharge_email = ?, incharge_phone = ?,
          assistant_name = ?, assistant_email = ?, assistant_phone = ?
      WHERE lab_id = ?
    `, [
      newInchargeName,
      newInchargeEmail,
      newInchargePhone,
      newAssistantName,
      newAssistantEmail,
      newAssistantPhone,
      id
    ]);

    // ---------------------------
    // GET staff_id
    // ---------------------------
    const staffId = oldStaff.id;

    // ---------------------------
    // GET OLD labincharge & assistant emails
    // ---------------------------
    const [[oldInchargeAcc]] = await conn.query(
      `SELECT email FROM labincharge WHERE staff_id = ?`,
      [staffId]
    );

    const [[oldAssistantAcc]] = await conn.query(
      `SELECT email FROM labassistant WHERE staff_id = ?`,
      [staffId]
    );

    const inchargeEmailChanged = oldInchargeAcc && oldInchargeAcc.email !== newInchargeEmail;
    const assistantEmailChanged = oldAssistantAcc && oldAssistantAcc.email !== newAssistantEmail;

    // ---------------------------
    // UPDATE labincharge
    // ---------------------------
    await conn.query(`
      UPDATE labincharge
      SET name = ?, email = ?, phone = ?, 
          google_id = ${inchargeEmailChanged ? "NULL" : "google_id"}
      WHERE staff_id = ?
    `, [
      newInchargeName,
      newInchargeEmail,
      newInchargePhone,
      staffId
    ]);

    // ---------------------------
    // UPDATE labassistant
    // ---------------------------
    await conn.query(`
      UPDATE labassistant
      SET name = ?, email = ?, phone = ?, 
          google_id = ${assistantEmailChanged ? "NULL" : "google_id"}
      WHERE staff_id = ?
    `, [
      newAssistantName,
      newAssistantEmail,
      newAssistantPhone,
      staffId
    ]);

    await conn.commit();
    return true;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}



  static async delete(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query('DELETE FROM staff WHERE lab_id = ?', [id]);
      await conn.query('DELETE FROM equipment WHERE lab_id = ?', [id]);
      await conn.query('DELETE FROM labs WHERE id = ?', [id]);

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = Lab;
