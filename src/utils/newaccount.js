const emailContent = (name, email, password) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invennzy Account Credentials</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      background-color: #0C0C0C;
      color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #1A1A1A;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
    }
    .header {
      background: linear-gradient(90deg, #fa5519, #ff7e3d);
      text-align: center;
      padding: 25px 10px;
    }
    .logo {
      max-width: 160px;
      height: auto;
    }
    .content {
      padding: 30px;
      color: #e5e5e5;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 20px;
    }
    .credentials-box {
      background-color: #121212;
      border: 1px solid #2f2f2f;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-item {
      margin: 12px 0;
    }
    .credential-label {
      font-weight: bold;
      color: #fa5519;
      margin-right: 5px;
    }
    .important-notice {
      background-color: #151515;
      border-left: 4px solid #fa5519;
      padding: 15px 20px;
      border-radius: 6px;
      margin: 25px 0;
    }
    .important-title {
      color: #fa5519;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .bullet-points {
      margin: 0;
      padding-left: 20px;
    }
    .bullet-points li {
      margin: 8px 0;
    }
    .warning-text {
      color: #ff4d4d;
      font-weight: bold;
      margin: 20px 0;
    }
    .support-text {
      margin-top: 20px;
      color: #cccccc;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999999;
      font-size: 12px;
      background-color: #111111;
      border-top: 1px solid #2f2f2f;
    }
    .divider {
      border-top: 1px solid #2f2f2f;
      margin: 15px 0;
    }
    a {
      color: #fa5519;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        margin: 10px;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://invennzy.com/logo1.png" alt="Invennzy Logo" class="logo">
    </div>
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      <p>Welcome to <strong>Invennzy</strong> — your account has been successfully created. Below are your login credentials:</p>

      <div class="credentials-box">
        <div class="credential-item">
          <span class="credential-label">User ID:</span>
          <span>${email}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Temporary Password:</span>
          <span>${password}</span>
        </div>
      </div>

      <div class="important-notice">
        <div class="important-title">Important:</div>
        <ul class="bullet-points">
          <li>Please change your password immediately after your first login.</li>
          <li>Access your dashboard here: <a href="https://invennzy.com">Invennzy.com</a></li>
          <li>Keep these credentials private and secure.</li>
        </ul>
      </div>

      <div class="warning-text">
        ⚠️ This is a temporary password. It will expire within 24 hours for security reasons.
      </div>

      <div class="support-text">
        Need help? Reach out to our support team at 
        <a href="mailto:support@invennzy.com">support@invennzy.com</a>
      </div>
    </div>
    <div class="footer">
      <p>Best regards,<br>The Invennzy Team</p>
      <div class="divider"></div>
      <p>This is an automated message — please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = emailContent;
