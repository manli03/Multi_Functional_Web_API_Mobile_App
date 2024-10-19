document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const forecast = document.getElementById('forecast');
  const dailyForecast = document.getElementById('daily-forecast');
  const hourlyForecast = document.getElementById('hourly-forecast');
  const notification = document.getElementById('notification');
  const lastFetchTimeDisplay = document.getElementById('last-fetch-time');
  const backToHomePageButton = document.querySelector('.btn-secondary');
  const cityInput = document.getElementById('cityInput');
  const getWeatherBtn = document.getElementById('getWeatherBtn');
  const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');

  logInteraction('WEATHER', 'Page loaded');

  // Hide the loading element after the page loads
  loading.style.display = 'none';

  // Event listeners
  getWeatherBtn.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
      resetContent();
      showLoading();
      fetchWeatherDataByCity(city);
    } else {
      showNotification('Please enter a city name.');
    }
  });

  cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      getWeatherBtn.click();
    }
  });

  getCurrentLocationBtn.addEventListener('click', () => {
    resetContent();
    showLoading();
    getUserLocation();
  });

  backToHomePageButton.addEventListener('click', () => {
    logInteraction('USER', 'Clicked Back to Main Menu button');
  });

  // Logs user interactions in local storage.
  function logInteraction(type, action, error = null) {
    const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    const index = interactions.length;
    const interaction = {
      index: index,
      action: error ? `[${type}] ${action}: ${error}` : `[${type}] ${action}`,
      timestamp: new Date().toISOString(),
    };
    interactions.push(interaction);
    localStorage.setItem('interactions', JSON.stringify(interactions));
  }

  // Displays a temporary notification message.
  function showNotification(message) {
    notification.textContent = message;
    setTimeout(() => {
      notification.textContent = '';
    }, 3000);
  }

  // Updates the display of the last fetch time.
  function updateLastFetchTime() {
    const lastFetchTimestamp = localStorage.getItem('lastFetchTimestamp');
    if (lastFetchTimestamp) {
      const formattedTime = moment(lastFetchTimestamp).format('h:mm:ss a');
      lastFetchTimeDisplay.textContent = `Last Fetch Time: ${formattedTime}`;
    } else {
      lastFetchTimeDisplay.textContent = 'No previous fetch recorded.';
    }
  }

  // Shows the loading indicator and hides content.
  function showLoading() {
    loading.style.display = 'block';
    content.style.display = 'none';
    forecast.style.display = 'none';
  }

  // Hides the loading indicator.
  function hideLoading() {
    loading.style.display = 'none';
  }

  // Clears the content of daily and hourly forecast sections.
  function resetContent() {
    dailyForecast.innerHTML = '';
    hourlyForecast.innerHTML = '';
    content.innerHTML = '';
  }

  // Fetches weather data using the city name.
  function fetchWeatherDataByCity(city) {
    fetch(`/.netlify/functions/fetchWeatherData?city=${city}`, {
      method: 'GET',
    })
    .then(response => handleFetchResponse(response))
    .then(data => {
      displayWeatherData(data);
      fetchWeatherForecast(data.coord.lat, data.coord.lon);
    })
    .catch(error => handleError(error));
  }

  // Fetches weather data using latitude and longitude.
  function fetchWeatherData(latitude, longitude) {
    fetch(`/.netlify/functions/fetchWeatherData?lat=${latitude}&lon=${longitude}`, {
      method: 'GET',
    })
    .then(response => handleFetchResponse(response))
    .then(data => {
      displayWeatherData(data);
      fetchWeatherForecast(data.coord.lat, data.coord.lon);
    })
    .catch(error => handleError(error));
  }

  // Fetches and displays the 7-day weather forecast.
  function fetchWeatherForecast(latitude, longitude) {
    fetch(`/.netlify/functions/fetchWeatherData?lat=${latitude}&lon=${longitude}&forecast=true`, {
      method: 'GET',
    })
    .then(response => handleFetchResponse(response))
    .then(data => {
      logInteraction('WEATHER', 'Fetched weather forecast from API');
      forecast.style.display = 'block';

      let dailyHTML = '<h3>7-Day Forecast</h3><div class="forecast-container">';
      const todayDate = moment().startOf('day');

      data.daily.forEach((day, index) => {
        if (index < 7) {
          const date = moment.unix(day.dt).format('MMMM Do');
          const tempDay = (day.temp.day - 273.15).toFixed(2);
          const tempNight = (day.temp.night - 273.15).toFixed(2);
          const description = day.weather[0].description;
          const icon = day.weather[0].icon;
          const isToday = moment.unix(day.dt).startOf('day').isSame(todayDate);

          dailyHTML += `
            <div class="forecast-card ${isToday ? 'today-forecast' : ''}" onclick="showHourlyForecast(${index})">
              <h5>${date}</h5>
              <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather icon">
              <p>Day: ${tempDay} °C</p>
              <p>Night: ${tempNight} °C</p>
              <p>${description}</p>
            </div>
          `;
        }
      });

      dailyHTML += '</div>';
      dailyForecast.innerHTML = dailyHTML;
      dailyForecast.style.display = 'block';
      window.hourlyData = data.hourly;
      window.hourlyDataFull = data.hourly;
    })
    .catch(error => handleError(error));
  }

  // Handles the API response and checks for errors.
  function handleFetchResponse(response) {
    logInteraction('WEATHER', 'Fetching weather data from API');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Displays an error message when data fetching fails.
  function handleError(error) {
    logInteraction('WEATHER', 'Error fetching data from weather API', error.message);
    hideLoading();
    content.style.display = 'block';
    content.innerHTML = '<p class="text-danger">Failed to load data. Please try again later.</p>';
  }

  // Fetches the user's current location.
  function getUserLocation() {
    const locationTimeout = setTimeout(() => {
      handleGeolocationError({ message: 'Location request timed out' });
    }, 5000);

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted' || result.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(position => {
            clearTimeout(locationTimeout);
            fetchWeatherData(position.coords.latitude, position.coords.longitude);
          }, error => {
            clearTimeout(locationTimeout);
            handleGeolocationError(error);
          });
        } else if (result.state === 'denied') {
          clearTimeout(locationTimeout);
          handleGeolocationError({ message: 'Location permission denied' });
        }
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        clearTimeout(locationTimeout);
        fetchWeatherData(position.coords.latitude, position.coords.longitude);
      }, error => {
        clearTimeout(locationTimeout);
        handleGeolocationError(error);
      });
    } else {
      clearTimeout(locationTimeout);
      handleGeolocationError({ message: 'Geolocation is not supported by this device' });
    }
  }

  // Displays an error message for geolocation failures.
  function handleGeolocationError(error) {
    logInteraction('WEATHER', 'Error fetching user location', error.message);
    hideLoading();
    content.style.display = 'block';
    content.innerHTML = '<p class="text-danger">Failed to get your location. Please enable location services and try again.</p>';
  }

  updateLastFetchTime();
});




/*

### Summary of Key Functions

1. **`logInteraction`**: Logs user interactions in local storage.
2. **`showNotification`**: Displays a temporary notification message.
3. **`updateLastFetchTime`**: Updates the display of the last fetch time.
4. **`showLoading`**: Shows the loading indicator and hides content.
5. **`hideLoading`**: Hides the loading indicator.
6. **`resetContent`**: Clears the content of daily and hourly forecast sections.
7. **`fetchWeatherDataByCity`**: Fetches weather data using the city name.
8. **`fetchWeatherData`**: Fetches weather data using latitude and longitude.
9. **`handleFetchResponse`**: Handles the API response and checks for errors.
10. **`handleError`**: Displays an error message when data fetching fails.
11. **`displayWeatherData`**: Displays the current weather data.
12. **`fetchWeatherForecast`**: Fetches and displays the 7-day weather forecast.
13. **`showHourlyForecast`**: Displays the hourly forecast for the selected day.
14. **`getUserLocation`**: Fetches the user's current location.
15. **`handleGeolocationError`**: Displays an error message for geolocation failures.

*/