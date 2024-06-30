const jwt = require('jsonwebtoken');

const allowedReferrer = 'https://multifunctionalapp.netlify.app';

exports.handler = async (event, context) => {
  const fetch = (await import('node-fetch')).default;

  const { authorization: token } = event.headers;
  const referrer = event.headers.referer || '';

  // Extract query parameters
  const { city, lat, lon, forecast } = event.queryStringParameters || {};

  if (!token || !referrer.startsWith(allowedReferrer)) {
    return { statusCode: 401, body: 'Unauthorized or Invalid Referrer' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.singleUse) {
      return { statusCode: 403, body: 'Forbidden: Token already used' };
    }

    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.API_KEY_1}`;
    } else if (lat && lon) {
      if (forecast === 'true') {
        url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${process.env.API_KEY_1}`;
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.API_KEY_1}`;
      }
    } else {
      return { statusCode: 400, body: 'Bad Request: Missing required parameters' };
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching data from OpenWeatherMap: ${response.statusText}`);
    }
    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Error fetching weather data:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
