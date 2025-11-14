const db = require("../db");
const { sendNotificationMail } = require("../utils/notifier");

const NotificationService = {
  async handleNotification(notificationId) {
    try {
      // 1️⃣ Fetch notification record
      const [[notification]] = await db.query(
        `SELECT * FROM notifications WHERE id = ?`,
        [notificationId]
      );

      if (!notification) {
        console.log("❌ Notification not found:", notificationId);
        return;
      }

      const { user_role, staff_id, title, message } = notification;

      // 2️⃣ Determine which table to fetch email from
      let table = "";

      if (user_role === "labincharge") {
        table = "labincharge";
      } else if (user_role === "labassistant") {
        table = "labassistant";
      } else if (user_role === "admin") {
        table = "admin"; // You must have admin table with notify_email
      } else {
        console.log("⚠ Unknown role, skipping email.");
        return;
      }

      // 3️⃣ Fetch recipient data using staff_id
      const [[receiver]] = await db.query(
        `SELECT name, email, notify_email 
         FROM ${table} 
         WHERE staff_id = ?`,
        [staff_id]
      );

      if (!receiver) {
        console.log(`❌ No receiver found in table ${table} for staff_id:`, staff_id);
        return;
      }

      // 4️⃣ Check user notification preferences (notify_email)
      if (receiver.notify_email !== 1) {
        console.log(`📭 Email disabled for ${receiver.email}, NOT sending notification mail.`);
        return;
      }

      // 5️⃣ Send email using Resend
      await sendNotificationMail({
        to: receiver.email,
        subject: `Invennzy Notification - ${title}`,
        title,
        message,
      });

      console.log(`📩 Notification Email Sent → ${receiver.email}`);

    } catch (err) {
      console.error("❌ NotificationService Error:", err.message);
    }
  }
};

module.exports = NotificationService;
