const db = require("../../db");
const { sendNotificationMail } = require("./notifier");

const NotificationService = {
  async handleNotification(notificationId) {
    try {
      // 1️⃣ Fetch notification
      const [[notification]] = await db.query(
        `SELECT * FROM notifications WHERE id = ?`,
        [notificationId]
      );

      if (!notification) return console.log("❌ Notification not found");

      const { user_role, staffid, title, message } = notification;
      let receiver = null;

      // ==========================================
      // LAB INCHARGE / LAB ASSISTANT
      // ==========================================
      if (user_role === "labincharge" || user_role === "labassistant") {
        const [[result]] = await db.query(
          `SELECT name, email, notify_email
           FROM ${user_role}
           WHERE staff_id = ?`,
          [staffid]
        );
        receiver = result;
      }

      // ==========================================
      // ADMIN
      // ==========================================
      else if (user_role === "admin") {
        // Find staff → lab_id
        const [[staffRow]] = await db.query(
          `SELECT lab_id FROM staff WHERE staff_id = ?`,
          [staffid]
        );
        if (!staffRow) return console.log("❌ Staff row not found");

        // Get admin_id from lab
        const [[labRow]] = await db.query(
          `SELECT admin_id FROM lab WHERE lab_id = ?`,
          [staffRow.lab_id]
        );
        if (!labRow) return console.log("❌ Lab row not found");

        // Get admin email + notify_email
        const [[adminRow]] = await db.query(
          `SELECT name, email, notify_email
           FROM admin 
           WHERE admin_id = ?`,
          [labRow.admin_id]
        );
        receiver = adminRow;
      }

      // ==========================================
      // VALIDATION
      // ==========================================
      if (!receiver) return console.log("❌ Receiver not found");

      // 🛑 STOP if notify_email is OFF
      if (receiver.notify_email !== 1) {
        return console.log(`📭 Email disabled for ${receiver.email}`);
      }

      // ==========================================
      // SEND EMAIL
      // ==========================================
      await sendNotificationMail({
        to: receiver.email,
        subject: `Invennzy Notification - ${title}`,
        title,
        message
      });

      console.log(`📩 Notification Email Sent → ${receiver.email}`);

    } catch (err) {
      console.error("❌ NotificationService Error:", err.message);
    }
  }
};

module.exports = NotificationService;
