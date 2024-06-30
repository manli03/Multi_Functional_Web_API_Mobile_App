const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // Create a token with a short expiration time (e.g., 5 minutes)
  const token = jwt.sign({ singleUse: true }, process.env.JWT_SECRET, { expiresIn: '5m' });

  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};
