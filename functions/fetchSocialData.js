const jwt = require('jsonwebtoken');

const allowedReferrer = 'https://multifunctionalapp.netlify.app';

exports.handler = async (event, context) => {
  const fetch = (await import('node-fetch')).default;

  const { authorization: token } = event.headers;
  const referrer = event.headers.referer || '';
  const { query } = event.queryStringParameters || {};

  if (!token || !referrer.startsWith(allowedReferrer)) {
    return { statusCode: 401, body: 'Unauthorized or Invalid Referrer' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.singleUse) {
      return { statusCode: 403, body: 'Forbidden: Token already used' };
    }

    const client_id = process.env.REDDIT_CLIENT_ID;
    const client_secret = process.env.REDDIT_CLIENT_SECRET;
    const username = process.env.REDDIT_USERNAME;
    const password = process.env.REDDIT_PASSWORD;
    const user_agent = process.env.REDDIT_USER_AGENT;

    // Obtain the access token from Reddit
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
      },
      body: `grant_type=password&username=${username}&password=${password}`
    });

    if (!authResponse.ok) {
      throw new Error(`Error fetching access token: ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    let url = `https://oauth.reddit.com/r/malaysia/top/.json?limit=100`;
    if (query) {
      url = `https://oauth.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=100`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': user_agent
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching data from Reddit: ${response.statusText}`);
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Error fetching social data:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
