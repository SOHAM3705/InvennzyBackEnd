const { Resend } = require("resend");
const notificationEmail = require("./notificationEmail");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendNotificationMail({ to, subject, title, message }) {
  try {
    await resend.emails.send({
      from: "Invennzy <noreply@invennzy.com>",
      to,
      subject,
      html: notificationEmail(title, message),
    });

    console.log("📧 Notification email sent to:", to);
  } catch (error) {
    console.error("❌ Resend Email Error:", error.message);
  }
}

module.exports = { sendNotificationMail };
