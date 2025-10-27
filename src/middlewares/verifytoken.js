const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_this_in_production';  // ✅ IMPORTANT
    const decoded = jwt.verify(token, secret);  // ✅ pass the secret

    req.user = decoded;
    console.log("Decoded JWT:", decoded);
    next();
  } catch (err) {
    console.error('JWT verify failed:', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;
