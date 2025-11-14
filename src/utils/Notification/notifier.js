const notificationEmail = (title, message) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invennzy Notification</title>

<style>
  body {
    margin: 0;
    padding: 0;
    background: #f5f7fa;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .wrapper {
    padding: 40px 20px;
  }

  .container {
    max-width: 600px;
    margin: auto;
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(0,0,0,0.08);
  }

  .header {
    padding: 35px 20px;
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    text-align: center;
  }

  .logo {
    max-width: 180px;
    margin-bottom: 12px;
  }

  .header-title {
    color: #ffffff;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 0.4px;
  }

  .content {
    padding: 40px 32px;
    color: #1a202c;
  }

  .notification-box {
    margin: 25px 0;
    padding: 25px;
    background: #e0f2fe;
    border-left: 4px solid #0284c7;
    border-radius: 10px;
  }

  .notification-title {
    font-size: 20px;
    font-weight: 700;
    color: #0369a1;
    margin-bottom: 12px;
  }

  .notification-message {
    font-size: 15px;
    color: #1e293b;
    line-height: 1.6;
  }

  .cta-section {
    text-align: center;
    margin-top: 32px;
  }

  .cta-button {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: white;
    text-decoration: none;
    padding: 14px 45px;
    border-radius: 8px;
    font-weight: 600;
    box-shadow: 0 4px 10px rgba(14,165,233,0.4);
    font-size: 15px;
    transition: 0.3s ease;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(14,165,233,0.45);
  }

  .footer {
    background: #f7fafc;
    padding: 25px 20px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
  }

  .footer-text {
    font-size: 13px;
    color: #718096;
    margin: 5px 0;
  }

  .brand {
    margin-top: 12px;
    font-size: 12.5px;
  }

  .brand a {
    text-decoration: none;
    color: #0284c7;
    font-weight: 600;
  }

  @media only screen and (max-width: 600px) {
    .content {
      padding: 28px 20px;
    }
    .notification-title {
      font-size: 18px;
    }
    .cta-button {
      width: 100%;
      padding: 14px 0;
    }
  }
</style>
</head>

<body>
  <div class="wrapper">
    <div class="container">

      <div class="header">
        <img src="https://invennzy.com/logo.png" class="logo" alt="Invennzy Logo" />
        <div class="header-title">Invennzy Notification</div>
      </div>

      <div class="content">
        <p style="font-size: 16px; margin-bottom: 18px;">
          You have a new update regarding your request.
        </p>

        <div class="notification-box">
          <div class="notification-title">${title}</div>
          <div class="notification-message">${message}</div>
        </div>

        <div class="cta-section">
          <a href="https://invennzy.com" class="cta-button">Open Dashboard</a>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text"><strong>Invennzy Team</strong></p>
        <p class="footer-text">This is an automated notification. Do not reply.</p>

        <div class="brand">
          An <a href="https://incorbis.com" target="_blank">Incorbis</a> Product
        </div>
      </div>

    </div>
  </div>
</body>
</html>
`;
};

module.exports = notificationEmail;
