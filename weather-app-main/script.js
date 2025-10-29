document.addEventListener("DOMContentLoaded", () => {
  let unit = "metric"; // default
  const defaultCity = "New York";

  // Fetch weather for default city on load
  getCityCoordinates(defaultCity, unit);

  // Unit toggle listener
  document.querySelectorAll('input[name="unit"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      unit = e.target.value;
      const city = document.getElementById("city-input").value || defaultCity;
      getCityCoordinates(city, unit);
    });
  });

  // Search button
  document.getElementById("search-button").addEventListener("click", () => {
    const city = document.getElementById("city-input").value;
    if(city) getCityCoordinates(city, unit);
  });
});

// Convert city name to coordinates
async function getCityCoordinates(city, unit) {
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
    const geoData = await geoResponse.json();
    if(geoData.results && geoData.results.length > 0) {
      const { latitude, longitude } = geoData.results[0];
      getWeather(latitude, longitude, unit);
    } else {
      alert("City not found");
    }
  } catch(error) {
    console.error("Error fetching city coordinates:", error);
  }
}

// Fetch weather from Open-Meteo API
async function getWeather(lat, lon, unit) {
  try {
    const tempUnitAPI = unit === "metric" ? "celsius" : "fahrenheit";
    const windUnitAPI = unit === "metric" ? "kmh" : "mph";
    const tempUnitDisplay = unit === "metric" ? "°C" : "°F";
    const windUnitDisplay = unit === "metric" ? "km/h" : "mph";
    const precipitationUnitDisplay = unit === "metric" ? "mm" : "in";

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=temperature_2m&temperature_unit=${tempUnitAPI}&windspeed_unit=${windUnitAPI}&timezone=auto`
    );

    const data = await response.json();

    // Update current weather
    document.getElementById("temp").textContent = `${data.current_weather.temperature}${tempUnitDisplay}`;
    document.getElementById("wind").textContent = `${data.current_weather.windspeed} ${windUnitDisplay}`;
    document.getElementById("precipitation").textContent = `${data.daily.precipitation_sum[0]} ${precipitationUnitDisplay}`;

    // Humidity not provided by Open-Meteo, keep placeholder
    document.getElementById("humidity").textContent = "--%";

    // Daily forecast
    const dailyContainer = document.getElementById("daily-forecast");
    dailyContainer.innerHTML = "";
    data.daily.temperature_2m_max.forEach((maxTemp, index) => {
      const minTemp = data.daily.temperature_2m_min[index];
      const dayDiv = document.createElement("div");
      dayDiv.textContent = `Day ${index + 1}: Max ${maxTemp}${tempUnitDisplay}, Min ${minTemp}${tempUnitDisplay}`;
      dailyContainer.appendChild(dayDiv);
    });

    // Hourly forecast (first 12 hours)
    const hourlyContainer = document.getElementById("hourly-forecast");
    hourlyContainer.innerHTML = "";
    data.hourly.temperature_2m.slice(0, 12).forEach((temp, hour) => {
      const hourDiv = document.createElement("div");
      hourDiv.textContent = `Hour ${hour}: ${temp}${tempUnitDisplay}`;
      hourlyContainer.appendChild(hourDiv);
    });

  } catch (error) {
    console.error("Error fetching weather:", error);
  }
}
