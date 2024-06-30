const jwt = require('jsonwebtoken');

const allowedReferrer = 'https://multifunctionalapp.netlify.app';

exports.handler = async (event, context) => {
  const { authorization: token } = event.headers;
  const referrer = event.headers.referer || '';
  const { query, code } = event.queryStringParameters || {};

  if (!token || !referrer.startsWith(allowedReferrer)) {
    return { statusCode: 401, body: 'Unauthorized or Invalid Referrer' };
  }

  try {
    const fetch = (await import('node-fetch')).default;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.singleUse) {
      return { statusCode: 403, body: 'Forbidden: Token already used' };
    }

    const client_id = process.env.REDDIT_CLIENT_ID;
    const client_secret = process.env.REDDIT_CLIENT_SECRET;
    const redirect_uri = 'https://multifunctionalapp.netlify.app/.netlify/functions/fetchSocialData';
    const user_agent = 'web:multifunctionalapp:v1.0 (by /u/One_Resolution_2580)';

    let accessToken;

    if (!code) {
      const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      if (!authResponse.ok) {
        throw new Error(`Error fetching access token: ${authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      accessToken = authData.access_token;

      if (!accessToken) {
        throw new Error('Access token is undefined');
      }
    } else {
      const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`
      });

      if (!tokenResponse.ok) {
        throw new Error(`Error fetching access token: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('Access token is undefined');
      }
    }

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
    console.error('Error fetching social data:', error.message);
    console.error('Stack trace:', error.stack);
    return { statusCode: 500, body: `Internal Server Error: ${error.message}` };
  }
};
