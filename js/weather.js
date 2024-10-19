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
    fetchToken().then(token => {
      fetch(`/.netlify/functions/fetchWeatherData?city=${city}`, {
        method: 'GET',
        headers: { 'Authorization': token }
      })
      .then(response => handleFetchResponse(response))
      .then(data => {
        displayWeatherData(data);
        fetchWeatherForecast(data.coord.lat, data.coord.lon);
      })
      .catch(error => handleError(error));
    });
  }

  // Fetches weather data using latitude and longitude.
  function fetchWeatherData(latitude, longitude) {
    fetchToken().then(token => {
      fetch(`/.netlify/functions/fetchWeatherData?lat=${latitude}&lon=${longitude}`, {
        method: 'GET',
        headers: { 'Authorization': token } // Use the token to fetch the API data
      })
      .then(response => handleFetchResponse(response))
      .then(data => {
        displayWeatherData(data);
        fetchWeatherForecast(data.coord.lat, data.coord.lon);
      })
      .catch(error => handleError(error));
    });
  }

  // Fetches and displays the 7-day weather forecast.
  function fetchWeatherForecast(latitude, longitude) {
    fetchToken().then(token => {
      fetch(`/.netlify/functions/fetchWeatherData?lat=${latitude}&lon=${longitude}&forecast=true`, {
        method: 'GET',
        headers: { 'Authorization': token } // Use the token to fetch the API data
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
                <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather icon">
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
    });
  }

  // Fetches a single use token for authentication
  function fetchToken() {
    return fetch('/.netlify/functions/generateToken', { method: 'POST' })
      .then(response => response.json())
      .then(tokenData => tokenData.token)
      .catch(error => {
        logInteraction('WEATHER', 'Error generating token', error.message);
        throw new Error('Token generation failed');
      });
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

  // Displays the current weather data.
  function displayWeatherData(data) {
    hideLoading();
    content.style.display = 'block';
  
    const todayDate = moment().format('MMMM Do, YYYY');
    const temperature = (data.main.temp - 273.15).toFixed(2);
    const feelsLike = (data.main.feels_like - 273.15).toFixed(2);
    const weatherDescription = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const visibility = data.visibility / 1000;
    const sunrise = moment.unix(data.sys.sunrise).format('h:mm:ss a');
    const sunset = moment.unix(data.sys.sunset).format('h:mm:ss a');
    const icon = data.weather[0].icon;
  
    content.innerHTML = `
      <div class="weather-card animated fadeIn">
        <h2>Weather in ${data.name}</h2>
        <p><strong>${todayDate}</strong></p>
        <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather icon" class="weather-icon">
        <p><i class="fas fa-thermometer-half"></i> Temperature: ${temperature} °C</p>
        <p><i class="fas fa-thermometer"></i> Feels Like: ${feelsLike} °C</p>
        <p><i class="fas fa-cloud"></i> Condition: ${weatherDescription}</p>
        <p><i class="fas fa-tint"></i> Humidity: ${humidity}%</p>
        <p><i class="fas fa-wind"></i> Wind Speed: ${windSpeed} m/s</p>
        <p><i class="fas fa-eye"></i> Visibility: ${visibility} km</p>
        <p><i class="fas fa-sun"></i> Sunrise: ${sunrise}</p>
        <p><i class="fas fa-moon"></i> Sunset: ${sunset}</p>
        <canvas id="weatherChart" width="400" height="200"></canvas>
      </div>
    `;
  
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
  }  

  // Displays the hourly forecast for the selected day.
  window.showHourlyForecast = function(dayIndex) {
    const start = dayIndex * 24;
    const end = start + 24;
    const hourlyData = window.hourlyDataFull.slice(start, end);
  
    // Remove the 'selected' class from all forecast cards
    document.querySelectorAll('.forecast-card').forEach(card => {
      card.classList.remove('selected');
    });
  
    // Add the 'selected' class to the clicked card
    const selectedCard = document.querySelectorAll('.forecast-card')[dayIndex];
    selectedCard.classList.add('selected');
  
    // Auto scroll to center the selected card
    selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  
    let hourlyHTML = '<h3>Hourly Forecast</h3><div class="hourly-forecast">';
  
    if (hourlyData.length === 0) {
      hourlyHTML += '<p class="no-data">No data available for this day.</p>';
    } else {
      hourlyData.forEach(hour => {
        const hourTime = moment.unix(hour.dt).format('HH:mm');
        const hourTemp = (hour.temp - 273.15).toFixed(2);
        const hourIcon = hour.weather[0].icon;
  
        hourlyHTML += `
          <div class="hourly-card">
            <h6>${hourTime}</h6>
            <img src="http://openweathermap.org/img/wn/${hourIcon}@2x.png" alt="Weather icon">
            <p>${hourTemp} °C</p>
          </div>
        `;
      });
    }
  
    hourlyHTML += '</div>';
    hourlyForecast.innerHTML = hourlyHTML;
    hourlyForecast.style.display = 'block';
  };
  

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