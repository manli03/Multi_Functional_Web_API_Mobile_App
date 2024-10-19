const jwt = require('jsonwebtoken');

const allowedReferrer = 'https://multifunctionalapp.netlify.app';  // Change this to your actual domain

exports.handler = async (event, context) => {
  const allowedReferrers = ['https://multifunctionalapp.netlify.app', 'http://localhost:3000'];
  
  if (!allowedReferrers.some(allowed => referrer.startsWith(allowed))) {
      console.error('Invalid referrer:', referrer);
      return { statusCode: 403, body: 'Forbidden' };
  }


  try {
    // Create a token with a short expiration time (e.g., 5 minutes)
    const token = jwt.sign({ singleUse: true }, process.env.JWT_SECRET, { expiresIn: '5m' });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedReferrer, // Set to your front-end domain
        'Access-Control-Allow-Headers': 'Content-Type',
      },
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
