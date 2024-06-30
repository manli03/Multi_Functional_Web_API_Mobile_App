const jwt = require('jsonwebtoken');

const allowedReferrer = 'https://multifunctionalapp.netlify.app';

exports.handler = async (event, context) => {
  const fetch = (await import('node-fetch')).default;

  const { authorization: token } = event.headers;
  const referrer = event.headers.referer || '';
  const { keyword = '', category = '', language = 'en' } = event.queryStringParameters || {};

  if (!token || !referrer.startsWith(allowedReferrer)) {
    return { statusCode: 401, body: 'Unauthorized or Invalid Referrer' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.singleUse) {
      return { statusCode: 403, body: 'Forbidden: Token already used' };
    }

    let url = `https://api.currentsapi.services/v1/search?country=my&page_size=200&apiKey=${process.env.API_KEY_2}`;
    if (keyword) url += `&keywords=${encodeURIComponent(keyword)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (language) url += `&language=${encodeURIComponent(language)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching data from Currents API: ${response.statusText}`);
    }
    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Error fetching news data:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
