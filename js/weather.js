// API key
const weatherApiKey = 'bd5e378503939ddaee76f12ad7a97608';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');

  function logUserInteraction(action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length; // Use the length of the array as the index
    const interaction = {
      index: index,
      action: error ? `[WEATHER] ${action}: ${error}` : `[WEATHER] ${action}`,
      timestamp: new Date().toISOString()
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  logUserInteraction('Page loaded');

  fetch(`http://api.openweathermap.org/data/2.5/weather?q=Changlun&appid=${weatherApiKey}`)
    .then(response => {
      logUserInteraction('Fetching weather data from API');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Log user interaction
      logUserInteraction('Fetched weather data from API');

      // Hide loading spinner and show content
      loading.style.display = 'none';
      content.style.display = 'block';

      // Extract and format the data
      const temperature = (data.main.temp - 273.15).toFixed(2); // Convert from Kelvin to Celsius
      const feelsLike = (data.main.feels_like - 273.15).toFixed(2); // Convert from Kelvin to Celsius
      const weatherDescription = data.weather[0].description;
      const humidity = data.main.humidity;
      const windSpeed = data.wind.speed;
      const visibility = data.visibility / 1000; // Convert from meters to kilometers
      const sunrise = moment.unix(data.sys.sunrise).format('HH:mm:ss');
      const sunset = moment.unix(data.sys.sunset).format('HH:mm:ss');

      // Display the data
      content.innerHTML = `
        <div class="weather-card">
          <h2>Weather in ${data.name}</h2>
          <p>Temperature: ${temperature} °C</p>
          <p>Feels Like: ${feelsLike} °C</p>
          <p>Condition: ${weatherDescription}</p>
          <p>Humidity: ${humidity}%</p>
          <p>Wind Speed: ${windSpeed} m/s</p>
          <p>Visibility: ${visibility} km</p>
          <p>Sunrise: ${sunrise}</p>
          <p>Sunset: ${sunset}</p>
          <canvas id="weatherChart" width="400" height="200"></canvas>
        </div>
      `;
      logUserInteraction('Displayed weather data');

      // Create a chart for visualizing temperature and feels like temperature
      const ctx = document.getElementById('weatherChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Temperature', 'Feels Like'],
          datasets: [{
            label: 'Temperature (°C)',
            data: [temperature, feelsLike],
            backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      logUserInteraction('Created weather chart');
    })
    .catch(error => {
      logUserInteraction('Error fetching data from weather API', error.message);
      loading.style.display = 'none';
      content.style.display = 'flex';
      content.innerHTML = '<p class="text-danger">Failed to load data. Please try again later.</p>';
      logUserInteraction('Displayed error message');
    });
});