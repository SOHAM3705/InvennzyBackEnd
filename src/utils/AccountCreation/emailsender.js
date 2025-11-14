const axios = require("axios");
const emailContent = require("./newaccount");

const sendEmail = async ({ to, name, plainPassword, subject }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set in .env file");
    }

    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "support@invennzy.com",
        to,
        subject: subject || "Welcome to Invennzy",
        html: emailContent(name, to, plainPassword),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("❌ Failed to send email:", error.response?.data || error.message);
  }
};

module.exports = sendEmail;
