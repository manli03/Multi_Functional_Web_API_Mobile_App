const jwt = require('jsonwebtoken');

const allowedReferrer = 'https://multifunctionalapp.netlify.app';  // Change this to your actual domain

exports.handler = async (event, context) => {
  const token = event.headers.authorization;
  const referrer = event.headers.referer || '';

  if (!token) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  if (!referrer.startsWith(allowedReferrer)) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token has already been used
    if (!decoded.singleUse) {
      return { statusCode: 403, body: 'Forbidden: Token already used' };
    }

    // Invalidate the token by updating its payload (you can store used tokens in memory if needed)
    decoded.singleUse = false;

    const apiKey1 = process.env.API_KEY_1;
    const apiKey2 = process.env.API_KEY_2;
    const apiKey3 = process.env.API_KEY_3;
    const apiKey4 = process.env.API_KEY_4;

    return {
      statusCode: 200,
      body: JSON.stringify({
        apiKey1,
        apiKey2,
        apiKey3,
        apiKey4,
      }),
    };
  } catch (error) {
    return { statusCode: 403, body: 'Forbidden' };
  }
};
