const axios = require("axios");
const notificationEmail = require("./notificationEmail");

const sendNotificationMail = async ({ to, subject, title, message }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set in .env file");
    }

    await axios.post(
      "https://api.resend.com/emails",
      {
        from: "notification@invennzy.com",
        to,
        subject: subject || "Invennzy Notification",
        html: notificationEmail(title, message),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📩 Notification email sent to ${to}`);
  } catch (error) {
    console.error(
      "❌ Failed to send notification email:",
      error.response?.data || error.message
    );
  }
};

module.exports = { sendNotificationMail };
