// ===== Weather App JavaScript - Enhanced Version =====

// API Configuration
const API_KEY = '244d32972338b87b6129a5318dea0b90';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// State
let currentUnit = 'celsius';
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
let currentCity = '';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const unitBtn = document.getElementById('unitBtn');
const unitBtnF = document.getElementById('unitBtnF');
const darkModeBtn = document.getElementById('darkModeBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const welcomeLocationBtn = document.getElementById('welcomeLocationBtn');
const loader = document.getElementById('loader');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const weatherContent = document.getElementById('weatherContent');
const welcomeScreen = document.getElementById('welcomeScreen');
const recentCities = document.getElementById('recentCities');
const favoriteCities = document.getElementById('favoriteCities');
const forecastGrid = document.getElementById('forecastGrid');

// Weather Display Elements
const cityNameEl = document.getElementById('cityName');
const currentDateEl = document.getElementById('currentDate');
const temperatureEl = document.getElementById('temperature');
const weatherConditionEl = document.getElementById('weatherCondition');
const weatherIconEl = document.getElementById('weatherIcon');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');

// Additional Metrics Elements
const hourlyGrid = document.getElementById('hourlyGrid');
const aqiValueEl = document.getElementById('aqiValue');
const aqiLabelEl = document.getElementById('aqiLabel');
const pm25El = document.getElementById('pm25');
const pm10El = document.getElementById('pm10');
const uvValueEl = document.getElementById('uvValue');
const uvLevelEl = document.getElementById('uvLevel');
const uvRecommendationEl = document.getElementById('uvRecommendation');
const precipValueEl = document.getElementById('precipValue');
const precipBarEl = document.getElementById('precipBar');
const dewPointEl = document.getElementById('dewPoint');
const weatherAlertsEl = document.getElementById('weatherAlerts');
const alertsContainer = document.getElementById('alertsContainer');

// Chart instance
let weatherChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (darkMode) {
        document.body.classList.add('dark-mode');
        darkModeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    displayRecentSearches();
    displayFavorites();
    showWelcomeScreen();
});

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeather(city);
    }
});

locationBtn && locationBtn.addEventListener('click', getLocationWeather);
welcomeLocationBtn && welcomeLocationBtn.addEventListener('click', getLocationWeather);

unitBtn.addEventListener('click', () => {
    if (currentUnit !== 'celsius') {
        currentUnit = 'celsius';
        unitBtn.classList.add('active');
        unitBtnF.classList.remove('active');
        const city = cityNameEl.textContent;
        if (city && city !== '--') fetchWeather(city);
    }
});

unitBtnF.addEventListener('click', () => {
    if (currentUnit !== 'fahrenheit') {
        currentUnit = 'fahrenheit';
        unitBtnF.classList.add('active');
        unitBtn.classList.remove('active');
        const city = cityNameEl.textContent;
        if (city && city !== '--') fetchWeather(city);
    }
});

darkModeBtn && darkModeBtn.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    darkModeBtn.innerHTML = darkMode ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
});

favoriteBtn && favoriteBtn.addEventListener('click', toggleFavorite);

// Fetch weather data
async function fetchWeather(city) {
    showLoader();
    hideError();
    hideWeatherContent();
    hideWelcomeScreen();

    try {
        const geoUrl = `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
        const geoResponse = await fetch(geoUrl);
        if (!geoResponse.ok) throw new Error('Failed to find city.');
        const geoData = await geoResponse.json();
        if (!geoData || geoData.length === 0) throw new Error('City not found.');

        const { lat, lon, name, country } = geoData[0];
        currentCity = name;

        const weatherUrl = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) throw new Error('Failed to fetch weather data.');

        const weatherData = await weatherResponse.json();
        weatherData.cityName = name;
        weatherData.cityCountry = country;
        
        // Fetch forecast data
        const forecastUrl = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = forecastResponse.ok ? await forecastResponse.json() : { list: [] };
        
        // Display all weather data
        displayWeather(weatherData);
        displayHourlyForecast(forecastData);
        displayForecast(forecastData);
        displayPrecipitation(forecastData);
        displayDewPoint(forecastData);
        createWeatherChart(forecastData);
        displayWeatherAlerts(forecastData);
        
        // AQI requires separate API call
        displayAQI(lat, lon);
        
        // UV Index from forecast
        displayUVIndex(forecastData);
        
        addToRecentSearches(name);
        updateFavoriteButton();
        
        // Cache the data
        cacheWeatherData(name, weatherData);
        
    } catch (error) {
        showError(error.message);
        hideLoader();
        showWelcomeScreen();
    }
}

// Fetch 5-day forecast
async function fetchForecast(lat, lon) {
    if (!forecastGrid) return;
    try {
        const url = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch forecast.');
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        forecastGrid.innerHTML = '<p class="no-forecast">Forecast unavailable</p>';
    }
}

// Display forecast
function displayForecast(data) {
    if (!forecastGrid) return;
    forecastGrid.innerHTML = '';
    if (!data.list || data.list.length === 0) {
        forecastGrid.innerHTML = '<p class="no-forecast">No forecast available</p>';
        return;
    }

    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        if (!dailyForecasts[dayKey] && date.getHours() >= 12) {
            dailyForecasts[dayKey] = item;
        }
    });

    const forecasts = Object.values(dailyForecasts).slice(0, 5);
    forecasts.forEach((forecast, index) => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const fullDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const temp = Math.round(forecast.main.temp);
        const icon = forecast.weather[0].icon;
        const condition = forecast.weather[0].main;
        const humidity = forecast.main.humidity;
        const windSpeed = (forecast.wind.speed * 3.6).toFixed(1);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <p class="forecast-day">${dayName}</p>
            <p class="forecast-date">${fullDate}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Icon">
            <p class="forecast-temp">${temp}°</p>
            <p class="forecast-condition">${condition}</p>
            <div class="forecast-details">
                <span><i class="fa-solid fa-droplet"></i> ${humidity}%</span>
                <span><i class="fa-solid fa-wind"></i> ${windSpeed} km/h</span>
            </div>
        `;
        
        // Add click event to show hourly forecast for that specific day
        forecastItem.addEventListener('click', () => {
            showDayForecast(data, index);
            // Highlight selected day
            document.querySelectorAll('.forecast-item').forEach(item => item.classList.remove('selected'));
            forecastItem.classList.add('selected');
        });
        
        forecastGrid.appendChild(forecastItem);
    });
}

// Show hourly forecast for a specific day
function showDayForecast(data, dayIndex) {
    if (!hourlyGrid) return;
    
    // Get all forecasts for the selected day
    const forecasts = Object.values(
        data.list.reduce((acc, item) => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(item);
            return acc;
        }, {})
    );
    
    const dayKeys = Object.keys(data.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000);
        acc[date.toDateString()] = true;
        return acc;
    }, {}));
    
    if (dayIndex >= dayKeys.length) return;
    
    const selectedDayKey = dayKeys[dayIndex];
    const dayForecasts = data.list.filter(item => {
        const date = new Date(item.dt * 1000);
        return date.toDateString() === selectedDayKey;
    });
    
    hourlyGrid.innerHTML = '';
    
    if (dayForecasts.length === 0) {
        hourlyGrid.innerHTML = '<p class="no-hourly">No hourly data available for this day</p>';
        return;
    }
    
    const selectedDate = new Date(selectedDayKey);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    // Add day header
    const dayHeader = document.createElement('div');
    dayHeader.className = 'hourly-day-header';
    dayHeader.innerHTML = `<h4>${dayName}</h4>`;
    hourlyGrid.appendChild(dayHeader);
    
    dayForecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;
        const pop = Math.round((item.pop || 0) * 100);
        const humidity = item.main.humidity;
        const windSpeed = (item.wind.speed * 3.6).toFixed(1);
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <p class="hourly-time">${time}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Icon">
            <p class="hourly-temp">${temp}°</p>
            ${pop > 0 ? `<p class="hourly-pop"><i class="fa-solid fa-droplet"></i> ${pop}%</p>` : ''}
            <div class="hourly-extras">
                <span><i class="fa-solid fa-droplet"></i> ${humidity}%</span>
                <span><i class="fa-solid fa-wind"></i> ${windSpeed} km/h</span>
            </div>
        `;
        hourlyGrid.appendChild(hourlyItem);
    });
    
    // Scroll to hourly section
    const hourlySection = document.querySelector('.hourly-section');
    if (hourlySection) {
        hourlySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Display weather data
function displayWeather(data) {
    const weather = data.weather && data.weather[0];
    const condition = weather ? weather.main.toLowerCase() : 'clear';
    const main = data.main || {};
    const wind = data.wind || {};
    const sys = data.sys || {};
    
    cityNameEl.textContent = `${data.cityName || data.name || 'Unknown'}, ${data.cityCountry || sys.country || ''}`;
    currentDateEl.textContent = formatDate(new Date());

    const tempCelsius = Math.round(main.temp);
    const tempFahrenheit = Math.round((tempCelsius * 9/5) + 32);
    temperatureEl.textContent = currentUnit === 'celsius' ? tempCelsius : tempFahrenheit;

    if (feelsLikeEl) {
        const feelsLikeCelsius = Math.round(main.feels_like);
        const feelsLikeFahrenheit = Math.round((feelsLikeCelsius * 9/5) + 32);
        feelsLikeEl.textContent = `Feels like ${currentUnit === 'celsius' ? feelsLikeCelsius : feelsLikeFahrenheit}°`;
    }

    weatherConditionEl.textContent = weather ? weather.description : 'Unknown';
    weatherIconEl.src = `https://openweathermap.org/img/wn/${weather ? weather.icon : '01d'}@4x.png`;
    humidityEl.textContent = `${main.humidity || '--'}%`;
    windSpeedEl.textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`;
    pressureEl.textContent = `${main.pressure || '--'} hPa`;
    visibilityEl.textContent = `${((data.visibility || 10000) / 1000).toFixed(1)} km`;
    sunriseEl.textContent = sys.sunrise ? formatTime(sys.sunrise) : '--';
    sunsetEl.textContent = sys.sunset ? formatTime(sys.sunset) : '--';

    updateBackground(condition);
    hideLoader();
    hideError();
    showWeatherContent();
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function updateBackground(condition) {
    const body = document.body;
    body.classList.remove('sunny', 'rainy', 'cloudy', 'snow');
    if (condition.includes('clear') || condition.includes('sun')) body.classList.add('sunny');
    else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) body.classList.add('rainy');
    else if (condition.includes('cloud') || condition.includes('mist') || condition.includes('fog')) body.classList.add('cloudy');
    else if (condition.includes('snow')) body.classList.add('snow');
}

// Display Hourly Forecast
function displayHourlyForecast(data) {
    if (!hourlyGrid) return;
    hourlyGrid.innerHTML = '';
    
    // Show all available hourly data (up to 40 points = 5 days at 3-hour intervals)
    // For 24 hours, we can show up to 8 data points at 3-hour intervals
    const hourlyData = data.list ? data.list.slice(0, 24) : [];
    
    if (hourlyData.length === 0) {
        hourlyGrid.innerHTML = '<p class="no-hourly">No hourly forecast available</p>';
        return;
    }
    
    hourlyData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;
        const pop = Math.round((item.pop || 0) * 100);
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <p class="hourly-day">${day}</p>
            <p class="hourly-time">${time}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Icon">
            <p class="hourly-temp">${temp}°</p>
            ${pop > 0 ? `<p class="hourly-pop"><i class="fa-solid fa-droplet"></i> ${pop}%</p>` : ''}
        `;
        hourlyGrid.appendChild(hourlyItem);
    });
}

// Display AQI (Air Quality Index)
async function displayAQI(lat, lon) {
    try {
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const response = await fetch(aqiUrl);
        
        if (!response.ok) throw new Error('AQI not available');
        
        const data = await response.json();
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        
        const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
        const aqiColors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97'];
        
        aqiValueEl.textContent = aqi;
        aqiLabelEl.textContent = aqiLabels[aqi - 1] || '--';
        aqiValueEl.style.color = aqiColors[aqi - 1] || '#4a90d9';
        
        pm25El.textContent = components.pm2_5.toFixed(1) + ' μg/m³';
        pm10El.textContent = components.pm10.toFixed(1) + ' μg/m³';
        
    } catch (error) {
        aqiValueEl.textContent = '--';
        aqiLabelEl.textContent = 'N/A';
        pm25El.textContent = '--';
        pm10El.textContent = '--';
    }
}

// Display UV Index
function displayUVIndex(data) {
    if (!uvValueEl) return;
    try {
        const uvi = data.daily && data.daily[0] ? data.daily[0].uvi : 0;
        const uv = Math.round(uvi || 0);
        
        let level = 'Low';
        let recommendation = 'No protection required.';
        
        if (uv <= 2) { level = 'Low'; recommendation = 'Safe for outdoor activities.'; }
        else if (uv <= 5) { level = 'Moderate'; recommendation = 'Wear sunscreen and seek shade during midday.'; }
        else if (uv <= 7) { level = 'High'; recommendation = 'Reduce sun exposure between 10am-4pm.'; }
        else if (uv <= 10) { level = 'Very High'; recommendation = 'Take extra precautions. Unprotected skin can burn quickly.'; }
        else { level = 'Extreme'; recommendation = 'Avoid sun exposure. Take precautions.'; }
        
        uvValueEl.textContent = uv;
        uvLevelEl.textContent = level;
        uvRecommendationEl.textContent = recommendation;
        
    } catch (error) {
        uvValueEl.textContent = '--';
        uvLevelEl.textContent = 'N/A';
        uvRecommendationEl.textContent = 'UV data unavailable';
    }
}

// Display Precipitation Probability
function displayPrecipitation(data) {
    if (!precipValueEl || !precipBarEl) return;
    try {
        const hourlyData = data.list || [];
        let maxPop = 0;
        hourlyData.forEach(item => {
            if (item.pop && item.pop > maxPop) maxPop = item.pop;
        });
        const precipChance = Math.round(maxPop * 100);
        precipValueEl.textContent = precipChance;
        precipBarEl.style.width = precipChance + '%';
    } catch (error) {
        precipValueEl.textContent = '--';
        precipBarEl.style.width = '0%';
    }
}

// Display Dew Point
function displayDewPoint(data) {
    if (!dewPointEl) return;
    try {
        const main = data.list ? data.list[0].main : data.main || {};
        const temp = main.temp;
        const humidity = main.humidity;
        
        const a = 17.27;
        const b = 237.7;
        const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
        const dewPoint = (b * alpha) / (a - alpha);
        
        const dewPointCelsius = Math.round(dewPoint);
        const dewPointFahrenheit = Math.round((dewPointCelsius * 9/5) + 32);
        
        dewPointEl.textContent = currentUnit === 'celsius' ? dewPointCelsius + '°' : dewPointFahrenheit + '°';
        
    } catch (error) {
        dewPointEl.textContent = '--';
    }
}

// Create/Update Weather Chart
function createWeatherChart(data) {
    if (!data.list || !data.list.length) return;
    const ctx = document.getElementById('weatherChart');
    if (!ctx) return;
    
    if (weatherChart) weatherChart.destroy();
    
    // Show 24 hours (8 data points at 3-hour intervals)
    const hourlyData = data.list.slice(0, 24);
    const labels = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
    });
    const temps = hourlyData.map(item => Math.round(item.main.temp));
    const feelsLike = hourlyData.map(item => Math.round(item.main.feels_like));
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f5f6fa' : '#2d3436';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature',
                    data: temps,
                    borderColor: '#4a90d9',
                    backgroundColor: 'rgba(74, 144, 217, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Feels Like',
                    data: feelsLike,
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', labels: { color: textColor, usePointStyle: true, padding: 20 } },
                tooltip: { mode: 'index', intersect: false, backgroundColor: isDark ? 'rgba(45, 52, 54, 0.9)' : 'rgba(255, 255, 255, 0.9)', titleColor: isDark ? '#fff' : '#333', bodyColor: isDark ? '#fff' : '#333' }
            },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor }, ticks: { color: textColor, callback: function(value) { return value + '°'; } } }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

// Display Weather Alerts
function displayWeatherAlerts(data) {
    if (!weatherAlertsEl || !alertsContainer) return;
    
    const alerts = [];
    const current = data.list ? data.list[0] : data;
    const weather = current.weather ? current.weather[0] : {};
    const main = current.main || {};
    const wind = current.wind || {};
    
    const condition = weather.main ? weather.main.toLowerCase() : '';
    
    if (condition.includes('thunderstorm') || condition.includes('storm')) {
        alerts.push({ title: 'Thunderstorm Warning', description: 'Thunderstorms are expected. Seek shelter and avoid open areas.' });
    }
    if (condition.includes('tornado')) {
        alerts.push({ title: 'Tornado Warning', description: 'Tornado conditions detected. Take immediate shelter.' });
    }
    if (condition.includes('snow') && main.temp < 0) {
        alerts.push({ title: 'Freezing Conditions', description: 'Temperatures below freezing. Beware of icy roads.' });
    }
    if (wind.speed > 20) {
        alerts.push({ title: 'High Wind Alert', description: 'Strong winds expected. Secure loose objects outdoors.' });
    }
    if (main.temp > 40) {
        alerts.push({ title: 'Extreme Heat Warning', description: 'Dangerously high temperatures. Stay hydrated and avoid sun exposure.' });
    }
    if (main.humidity > 85) {
        alerts.push({ title: 'High Humidity Advisory', description: 'Very humid conditions. Stay cool and drink plenty of water.' });
    }
    
    if (alerts.length > 0) {
        alertsContainer.innerHTML = '';
        alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `<h4>${alert.title}</h4><p>${alert.description}</p>`;
            alertsContainer.appendChild(alertItem);
        });
        weatherAlertsEl.classList.remove('hidden');
    } else {
        weatherAlertsEl.classList.add('hidden');
    }
}

// Cache data for offline support
function cacheWeatherData(city, data) {
    const cacheKey = `weather_cache_${city.toLowerCase()}`;
    const cacheData = { data: data, timestamp: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
}

// Get cached data
function getCachedData(city) {
    const cacheKey = `weather_cache_${city.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < 30 * 60 * 1000) {
            return cacheData.data;
        }
    }
    return null;
}

// Favorites
function toggleFavorite() {
    if (!currentCity) return;
    const index = favorites.indexOf(currentCity);
    if (index > -1) favorites.splice(index, 1);
    else { favorites.unshift(currentCity); if (favorites.length > 5) favorites.pop(); }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButton();
    displayFavorites();
}

function updateFavoriteButton() {
    if (!favoriteBtn) return;
    const isFavorite = favorites.includes(currentCity);
    favoriteBtn.innerHTML = isFavorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
}

function displayFavorites() {
    if (!favoriteCities) return;
    favoriteCities.innerHTML = '';
    if (favorites.length === 0) { favoriteCities.innerHTML = '<p class="no-favorites">No favorite cities yet</p>'; return; }
    favorites.forEach(city => {
        const btn = document.createElement('button');
        btn.className = 'favorite-city-btn';
        btn.innerHTML = `<i class="fa-solid fa-star"></i> ${city} <span class="remove-favorite">&times;</span>`;
        btn.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-favorite')) removeFavorite(city);
            else { cityInput.value = city; fetchWeather(city); }
        });
        favoriteCities.appendChild(btn);
    });
}

function removeFavorite(city) {
    const index = favorites.indexOf(city);
    if (index > -1) { favorites.splice(index, 1); localStorage.setItem('favorites', JSON.stringify(favorites)); displayFavorites(); updateFavoriteButton(); }
}

// Recent Searches
function addToRecentSearches(city) {
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    const index = recentSearches.indexOf(formattedCity);
    if (index > -1) recentSearches.splice(index, 1);
    recentSearches.unshift(formattedCity);
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

function displayRecentSearches() {
    recentCities.innerHTML = '';
    if (recentSearches.length === 0) { recentCities.innerHTML = '<p class="no-recent">No recent searches</p>'; return; }
    recentSearches.forEach(city => {
        const btn = document.createElement('button');
        btn.className = 'recent-city-btn';
        btn.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${city}`;
        btn.addEventListener('click', () => { cityInput.value = city; fetchWeather(city); });
        recentCities.appendChild(btn);
    });
}

// Location
function getLocationWeather() {
    if (navigator.geolocation) {
        showLoader(); hideError(); hideWeatherContent(); hideWelcomeScreen();
        navigator.geolocation.getCurrentPosition(
            (position) => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
            (error) => { showError('Unable to get your location.'); hideLoader(); showWelcomeScreen(); }
        );
    } else { showError('Geolocation not supported.'); showWelcomeScreen(); }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const url = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch weather.');
        const data = await response.json();
        
        const reverseGeoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const reverseGeoResponse = await fetch(reverseGeoUrl);
        if (reverseGeoResponse.ok) {
            const reverseData = await reverseGeoResponse.json();
            if (reverseData && reverseData.length > 0) { data.cityName = reverseData[0].name; data.cityCountry = reverseData[0].country; }
        }
        
        // Fetch forecast data
        const forecastUrl = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = forecastResponse.ok ? await forecastResponse.json() : { list: [] };
        
        displayWeather(data);
        displayHourlyForecast(forecastData);
        displayForecast(forecastData);
        displayPrecipitation(forecastData);
        displayDewPoint(forecastData);
        createWeatherChart(forecastData);
        displayWeatherAlerts(forecastData);
        displayAQI(lat, lon);
        displayUVIndex(forecastData);
        
        addToRecentSearches(data.cityName || 'Current Location');
        currentCity = data.cityName;
        updateFavoriteButton();
    } catch (error) { showError(error.message); hideLoader(); showWelcomeScreen(); }
}

// UI Controls
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }
function showError(message) { errorText.textContent = message; errorMsg.classList.remove('hidden'); }
function hideError() { errorMsg.classList.add('hidden'); }
function showWeatherContent() { weatherContent.classList.add('active'); }
function hideWeatherContent() { weatherContent.classList.remove('active'); }
function showWelcomeScreen() { welcomeScreen.classList.remove('hidden'); }
function hideWelcomeScreen() { welcomeScreen.classList.add('hidden'); }

