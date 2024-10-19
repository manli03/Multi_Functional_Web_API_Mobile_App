const allowedReferrer = 'https://multifunctionalapp.netlify.app';  // Change this to your actual domain

exports.handler = async (event, context) => {
  const referrer = event.headers.referer || '';

  // If the referrer is not allowed, return forbidden status
  if (!referrer.startsWith(allowedReferrer)) {
    console.error('Invalid referrer:', referrer);
    return { statusCode: 403, body: 'Forbidden' };
  }

  // No token generation anymore, just return success
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Referrer is allowed, no token needed.' }),
  };
};
