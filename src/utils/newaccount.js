const emailContent = (name, email, password) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Invennzy Login Credentials</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      background-color: #f5f7fa;
      color: #2d3748;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      background-color: #f5f7fa;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      text-align: center;
      padding: 40px 20px;
    }
    .logo {
      max-width: 180px;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .header-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
      margin-top: 15px;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 35px;
      color: #2d3748;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 20px;
    }
    .intro-text {
      font-size: 15px;
      color: #4a5568;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .credentials-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #0ea5e9;
      border-radius: 10px;
      padding: 30px;
      margin: 30px 0;
    }
    .credentials-title {
      font-size: 16px;
      font-weight: 700;
      color: #0284c7;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .credential-row {
      width: 100%;
      margin: 15px 0;
      background-color: #ffffff;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      box-sizing: border-box;
      border-left: 3px solid #0ea5e9;
    }
    .credential-label {
      font-weight: 600;
      color: #718096;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: block;
    }
    .credential-value {
      font-size: 16px;
      color: #1a202c;
      font-weight: 500;
      word-break: break-all;
    }
    .login-button-container {
      text-align: center;
      margin: 35px 0;
    }
    .login-button {
      display: inline-block;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: #ffffff;
      padding: 16px 50px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
      transition: all 0.3s ease;
    }
    .login-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(14, 165, 233, 0.5);
    }
    .security-notice {
      background-color: #fffaf0;
      border-left: 4px solid #f6ad55;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .security-title {
      color: #c05621;
      font-weight: 700;
      margin-bottom: 12px;
      font-size: 15px;
      display: flex;
      align-items: center;
    }
    .security-icon {
      margin-right: 8px;
      font-size: 18px;
    }
    .security-list {
      margin: 10px 0 0 0;
      padding-left: 20px;
      color: #744210;
    }
    .security-list li {
      margin: 8px 0;
      font-size: 14px;
      line-height: 1.6;
    }
    .help-section {
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .help-title {
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 12px;
      font-size: 16px;
    }
    .help-text {
      color: #4a5568;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .contact-link {
      color: #0ea5e9;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
    }
    .contact-link:hover {
      text-decoration: underline;
      color: #0284c7;
    }
    .footer {
      background-color: #f7fafc;
      text-align: center;
      padding: 30px 20px;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      color: #718096;
      font-size: 13px;
      margin: 8px 0;
    }
    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }
    .incorbis-brand {
      font-size: 13px;
      color: #718096;
      margin-top: 15px;
    }
    .incorbis-link {
      color: #0ea5e9;
      text-decoration: none;
      font-weight: 600;
    }
    .incorbis-link:hover {
      text-decoration: underline;
      color: #0284c7;
    }
    
    /* Mobile Responsive Styles */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .email-container {
        border-radius: 8px;
      }
      .header {
        padding: 30px 15px;
      }
      .header-text {
        font-size: 20px;
      }
      .logo {
        max-width: 150px;
      }
      .content {
        padding: 30px 20px;
      }
      .greeting {
        font-size: 18px;
      }
      .intro-text {
        font-size: 14px;
      }
      .credentials-section {
        padding: 20px 15px;
      }
      .credentials-title {
        font-size: 14px;
      }
      .credential-row {
        padding: 12px;
        margin: 12px 0;
      }
      .credential-label {
        font-size: 12px;
      }
      .credential-value {
        font-size: 14px;
      }
      .login-button {
        padding: 14px 40px;
        font-size: 15px;
        width: 100%;
        max-width: 280px;
        box-sizing: border-box;
      }
      .login-button-container {
        margin: 25px 0;
      }
      .security-notice {
        padding: 15px;
      }
      .security-title {
        font-size: 14px;
      }
      .security-list {
        padding-left: 15px;
      }
      .security-list li {
        font-size: 13px;
      }
      .help-section {
        padding: 20px 15px;
      }
      .help-title {
        font-size: 15px;
      }
      .help-text {
        font-size: 13px;
      }
      .contact-link {
        font-size: 14px;
      }
      .footer {
        padding: 25px 15px;
      }
      .footer-text {
        font-size: 12px;
      }
    }
    
    @media only screen and (max-width: 400px) {
      .email-wrapper {
        padding: 10px 5px;
      }
      .content {
        padding: 25px 15px;
      }
      .credentials-section {
        padding: 15px 12px;
      }
      .login-button {
        padding: 12px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <img src="https://invennzy.com/logo.png" alt="Invennzy Logo" class="logo">
        <div class="header-text">Your Login Credentials</div>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${name},</div>
        
        <p class="intro-text">
          You requested your login credentials for <strong>Invennzy</strong>. Below you'll find everything you need to access your account securely.
        </p>

        <div class="credentials-section">
          <div class="credentials-title">🔐 Your Login Details</div>
          
          <div class="credential-row">
            <span class="credential-label">User ID / Email</span>
            <div class="credential-value">${email}</div>
          </div>
          
          <div class="credential-row">
            <span class="credential-label">Password</span>
            <div class="credential-value">${password}</div>
          </div>
        </div>

        <div class="login-button-container">
          <a href="https://invennzy.com/login" class="login-button">Login to Your Account</a>
        </div>

        <div class="security-notice">
          <div class="security-title">
            <span class="security-icon">⚠️</span>
            Security Best Practices
          </div>
          <ul class="security-list">
            <li>Never share your password with anyone, including Invennzy staff</li>
            <li>We recommend changing your password regularly for enhanced security</li>
            <li>If you didn't request these credentials, please contact us immediately</li>
            <li>Always ensure you're on the official Invennzy website before logging in</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-title">Need Assistance?</div>
          <p class="help-text">Our support team is here to help you 24/7</p>
          <a href="mailto:support@invennzy.com" class="contact-link">support@invennzy.com</a>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text"><strong>Best regards,</strong></p>
        <p class="footer-text">The Invennzy Team</p>
        
        <div class="divider"></div>
        
        <p class="footer-text">This is an automated email. Please do not reply to this message.</p>
        <p class="footer-text">© 2024 Invennzy. All rights reserved.</p>
        
        <div class="incorbis-brand">
          An <a href="https://incorbis.com" class="incorbis-link" target="_blank">Incorbis</a> Product
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = emailContent;
