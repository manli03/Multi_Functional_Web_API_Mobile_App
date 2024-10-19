const jwt = require('jsonwebtoken');

const allowedReferrer = 'https://multifunctionalapp.netlify.app';  // Change this to your actual domain

exports.handler = async (event, context) => {
  const referrer = event.headers.referer || '';

  // If the referrer is not allowed, return forbidden status
  if (!referrer.startsWith(allowedReferrer)) {
    console.error('Invalid referrer:', referrer);
    return { statusCode: 403, body: 'Forbidden' };
  }

  try {
    // Create a token with a short expiration time (e.g., 5 minutes)
    const token = jwt.sign({ singleUse: true }, process.env.JWT_SECRET, { expiresIn: '5m' });

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    console.error('Error generating token:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
