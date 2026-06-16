const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const errorMsg = document.getElementById('error-msg');

// Icon mapping dynamic design ke liye
const iconMap = {
    'clear': 'fa-sun',
    'clouds': 'fa-cloud-sun',
    'rain': 'fa-cloud-showers-heavy',
    'drizzle': 'fa-cloud-rain',
    'thunderstorm': 'fa-cloud-bolt',
    'snow': 'fa-snowflake',
    'mist': 'fa-smog',
    'smoke': 'fa-smog',
    'haze': 'fa-smog'
};

// Open-Meteo Server API ka public wrapper jo block nahi hoga
async function fetchWeather(city) {
    try {
        errorMsg.style.display = "none";
        
        // Step 1: City name se coordinates nikalna (Geocoding)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showError();
            return;
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country } = location;

        // Step 2: Un coordinates se complete dashboard data fetch karna
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        updateUI(name, country, weatherData);

    } catch (error) {
        showError();
    }
}

function updateUI(cityName, country, data) {
    const current = data.current;
    
    // City name mapping
    document.getElementById('city-name').innerText = `${cityName}, ${country}`;
    
    // Date creation
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', options);
    
    // Weather status and codes parsing
    const code = current.weather_code;
    const condition = getWeatherConditionByCode(code);
    document.getElementById('weather-desc').innerText = condition.text;
    document.getElementById('temperature').innerText = Math.round(current.temperature_2m);
    
    // Highlights mapping
    document.getElementById('humidity').innerText = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').innerText = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('feels-like').innerText = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('pressure').innerText = `${Math.round(current.pressure_msl)} hPa`;

    // Main weather icon handling
    const mainIcon = document.getElementById('weather-icon');
    mainIcon.className = `fa-solid ${condition.icon} weather-main-icon animate-glow`;

    // 5-Day Forecast Generation
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Fresh clean render

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = new Date().getDay();

    for (let i = 1; i <= 5; i++) {
        const forecastDayIndex = (todayIndex + i) % 7;
        const forecastCode = data.daily.weather_code[i];
        const forecastCond = getWeatherConditionByCode(forecastCode);
        const maxTemp = Math.round(data.daily.temperature_2m_max[i]);

        const cardHtml = `
            <div class="forecast-card">
                <p class="day">${days[forecastDayIndex]}</p>
                <i class="fa-solid ${forecastCond.icon}"></i>
                <p class="temp">${maxTemp}°C</p>
            </div>
        `;
        forecastContainer.insertAdjacentHTML('beforeend', cardHtml);
    }
}

function getWeatherConditionByCode(code) {
    // WMO Weather interpretation codes mapping
    if (code === 0) return { text: "Clear Sky", icon: "fa-sun" };
    if (code >= 1 && code <= 3) return { text: "Partly Cloudy", icon: "fa-cloud-sun" };
    if (code >= 45 && code <= 48) return { color: "#bbb", text: "Foggy", icon: "fa-smog" };
    if (code >= 51 && code <= 57) return { text: "Drizzle", icon: "fa-cloud-rain" };
    if (code >= 61 && code <= 67) return { text: "Rain", icon: "fa-cloud-showers-heavy" };
    if (code >= 71 && code <= 77) return { text: "Snowfall", icon: "fa-snowflake" };
    if (code >= 95 && code <= 99) return { text: "Thunderstorm", icon: "fa-cloud-bolt" };
    return { text: "Cloudy", icon: "fa-cloud" };
}

function showError() {
    errorMsg.style.display = "flex";
}

// Events listeners hooks
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city !== "") fetchWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Default display load open
fetchWeather('Lahore');