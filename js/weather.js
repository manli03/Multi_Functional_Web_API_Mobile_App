// API key
const weatherApiKey = 'bd5e378503939ddaee76f12ad7a97608';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const currentTimeDisplay = document.getElementById('current-time');
  const notification = document.getElementById('notification');
  const lastFetchTimeDisplay = document.getElementById('last-fetch-time');
  const backToMenuButton = document.querySelector('.btn-secondary');

  function logInteraction(type, action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length;
    const interaction = {
      index: index,
      action: error ? `[${type}] ${action}: ${error}` : `[${type}] ${action}`,
      timestamp: new Date().toISOString()
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  function updateCurrentTime() {
    const now = moment().format('MMMM Do YYYY, h:mm:ss a');
    currentTimeDisplay.textContent = `Current Date and Time: ${now}`;
  }

  function showNotification(message) {
    notification.textContent = message;
    setTimeout(() => {
      notification.textContent = '';
    }, 3000);
  }

  function updateLastFetchTime() {
    const lastFetchTimestamp = localStorage.getItem('lastFetchTimestamp');
    if (lastFetchTimestamp) {
      const formattedTime = moment(lastFetchTimestamp).format('h:mm:ss a');
      lastFetchTimeDisplay.textContent = `Last Fetch Time: ${formattedTime}`;
    } else {
      lastFetchTimeDisplay.textContent = 'No previous fetch recorded.';
    }
  }

  logInteraction('WEATHER', 'Page loaded');
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000); // Update current time every second

  function fetchWeatherData(latitude, longitude) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}`;

    fetch(url)
      .then(response => {
        logInteraction('WEATHER', 'Fetching weather data from API');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        logInteraction('WEATHER', 'Fetched weather data from API');

        loading.style.display = 'none';
        content.style.display = 'block';

        const temperature = (data.main.temp - 273.15).toFixed(2); // Convert from Kelvin to Celsius
        const feelsLike = (data.main.feels_like - 273.15).toFixed(2); // Convert from Kelvin to Celsius
        const weatherDescription = data.weather[0].description;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const visibility = data.visibility / 1000; // Convert from meters to kilometers
        const sunrise = moment.unix(data.sys.sunrise).format('h:mm:ss a');
        const sunset = moment.unix(data.sys.sunset).format('h:mm:ss a');

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

        logInteraction('WEATHER', 'Displayed weather data');

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

        const now = new Date().toISOString();
        localStorage.setItem('lastFetchTimestamp', now);

        logInteraction('WEATHER', 'Created weather chart');
        showNotification('Weather data updated');
        updateLastFetchTime();
      })
      .catch(error => {
        logInteraction('WEATHER', 'Error fetching data from weather API', error.message);
        loading.style.display = 'none';
        content.style.display = 'block';  // Ensuring content is displayed as a block
        content.innerHTML = '<p class="text-danger">Failed to load data. Please try again later.</p>';
      });
  }

  function getUserLocation() {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            logInteraction('WEATHER', `Fetched user location: Latitude ${latitude}, Longitude ${longitude}`);
            fetchWeatherData(latitude, longitude);
          }, error => {
            handleGeolocationError(error);
          });
        } else if (result.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            logInteraction('WEATHER', `Fetched user location: Latitude ${latitude}, Longitude ${longitude}`);
            fetchWeatherData(latitude, longitude);
          }, error => {
            handleGeolocationError(error);
          });
        } else if (result.state === 'denied') {
          handleGeolocationError({ message: 'Location permission denied' });
        }
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        logInteraction('WEATHER', `Fetched user location: Latitude ${latitude}, Longitude ${longitude}`);
        fetchWeatherData(latitude, longitude);
      }, error => {
        handleGeolocationError(error);
      });
    } else {
      logInteraction('WEATHER', 'Geolocation is not supported by this device');
      loading.style.display = 'none';
      content.style.display = 'block';  // Ensuring content is displayed as a block
      content.innerHTML = '<p class="text-danger">Geolocation is not supported by this device.</p>';
    }
  }

  function handleGeolocationError(error) {
    logInteraction('WEATHER', 'Error fetching user location', error.message);
    loading.style.display = 'none';
    content.style.display = 'block';  // Ensuring content is displayed as a block
    content.innerHTML = '<p class="text-danger">Failed to get your location. Please enable location services and try again.</p>';
  }

  // Log back to menu button click
  backToMenuButton.addEventListener('click', () => {
    logInteraction('USER', 'Clicked Back to Main Menu button');
  });

  updateLastFetchTime();
  getUserLocation();

  // Reload the page every minute
  setInterval(() => {
    logInteraction('WEATHER', 'Reloading page');
    location.reload();
  }, 60000); // 60000 ms = 1 minute
});
