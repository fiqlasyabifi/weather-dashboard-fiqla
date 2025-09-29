// Weather Dashboard Javascript
// Konfigurasi API
const API_KEY = "e30e59a46cf9deea7e7b82eca3c209dd";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "http://api.openweathermap.org/geo/1.0";

// State Management (Data sementara di browser)
let currentUnit = "metric";
let currentCity = null;
let favorites = JSON.parse(localStorage.getItem("weatherFavorites")) || [];
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];

//DOM Elements (ambil dari HTML)
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const themeToggle = document.getElementById("themeToggle");
const unitBtns = document.getElementById(".unit-btn");
const loadingSpinner = document.getElementById("loadingSpinner");
const weatherContent = document.getElementById("weatherContent");
const favoriteBtn = document.getElementById("favoriteBtn");

// Initialize App (Ketika Konten Dimuat)
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  initializeEventListeners();
  loadRecentSearches();
  loadFavorites();

  //Default Load: Jakarta
  fetchWeatherByCity("Jakarta");
});

// Theme Management
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector("i");
  icon.className = theme === "light" ? "fas fa-moon" : "fas fa-sun";
}

// Event Listeners (aksi user)
function initializeEventListeners() {
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  locationBtn.addEventListener("click", getCurrentLocation);
  themeToggle.addEventListener("click", toggleTheme);

  unitBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      unitBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentUnit = btn.dataset.unit;
      if (currentCity) {
        fetchWeatherByCity(currentCity);
      }
    });
  });

  favoriteBtn.addEventListener("click", toggleFavorite);
}

// Search Functions
function handleSearch() {
  const city = searchInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
    addToRecentSearches(city);
  }
}

function addToRecentSearches(city) {
  if (!recentSearches.includes(city)) {
    recentSearches.unshift(city);
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    loadRecentSearches();
  }
}

function loadRecentSearches() {
  const container = document.getElementById("recentSearches");
  container.innerHTML = "";

  recentSearches.forEach((city) => {
    const item = document.createElement("div");
    item.className = "recent-item";
    item.textContent = city;
    item.addEventListener("click", () => {
      searchInput.value = city;
      fetchWeatherByCity(city);
    });
    container.appendChild(item);
  });
}

// Geolocation
function getCurrentLocation() {
  if (navigator.geolocation) {
    loadingSpinner.style.display = "block";
    weatherContent.style.display = "none";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (error) => {
        alert(
          "Unable to get your location. Please search for a city manually."
        );
        loadingSpinner.style.display = "none";
      }
    );
  } else {
    alert("Geolocation is not supported by your browser");
  }
}

// API Calls
async function fetchWeatherByCity(city) {
  try {
    loadingSpinner.style.display = "block";
    weatherContent.style.display = "none";

    // Get coordinates first
    const geoResponse = await fetch(
      `${GEO_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    const geoData = await geoResponse.json();

    if (geoData.length === 0) {
      throw new Error("City not found");
    }

    const { lat, lon, name, country } = geoData[0];
    currentCity = name;

    await fetchWeatherByCoords(lat, lon, name, country);
  } catch (error) {
    console.error("Error fetching weather", error);
    alert("City not found, Please try again");
    loadingSpinner.style.display = "none";
  }
}

async function fetchWeatherByCoords(
  lat,
  lon,
  cityName = null,
  countryName = null
) {
  try {
    // Fetch current Weather (API Cuaca saat ini)
    const currentResponse = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units${currentUnit}&appid=${API_KEY}`
    );
    const currentData = await currentResponse.json();

    //Fetch Forecast
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
    );
    const forecastData = await forecastResponse.json();

    //Fetch Air Quality
    const airQualityResponse = await fetch(
      `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    const airQualityData = await airQualityResponse.json();

    currentCity = cityName || currentData.name;

    displayCurrentWeather(currentData);
    displayHourlyForecast(forecastData);
    displayDailyForecast(forecastData);
    displayAirQuality(airQualityData);
    updateMap(lat, lon);
    updateFavoriteButton();

    loadingSpinner.style.display = "none";
    weatherContent.style.display = "block";
  } catch (error) {
    console.error("Enter fetching weather data:", error);
    alert("Error loading weather data. Please try again");
    loadingSpinner.style.display = "none";
  }
}
