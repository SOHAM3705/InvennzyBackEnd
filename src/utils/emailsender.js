// utils/emailSender.js
const axios = require("axios");

const sendEmail = async ({ to, name, plainPassword, subject }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured in environment");
  }
  if (!to || typeof to !== "string") {
    throw new Error("Invalid recipient email");
  }

  // Load HTML template generator (adjust path if needed)
  const emailContent = require("./newaccount"); // function: (name, email, password) => html

  try {
    const resp = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "support@invennzy.com",
        to,
        subject: subject || "Welcome to Invennzy — Your account details",
        html: emailContent(name, to, plainPassword),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10s timeout to avoid hanging
      }
    );

    return { success: true, data: resp.data };
  } catch (err) {
    // Throw a useful error to the caller (caller can log or retry)
    const errDetail = err.response?.data || err.message;
    throw new Error(`Failed to send email: ${JSON.stringify(errDetail)}`);
  }
};

module.exports = sendEmail;
