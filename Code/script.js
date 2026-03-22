const apiKey = '61c6dea472b0aba30eba85cab9a96b02'; 
const searchBtn = document.getElementById('searchBtn');

window.onload = () => {
    const savedCity = localStorage.getItem('lastCity');
    if (savedCity) {
        document.getElementById('lastSearchedText').innerText = `Last searched: ${savedCity}`;
    }
};

searchBtn.addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    if (city) {
        getWeather(city);
    }
});

document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather(document.getElementById('cityInput').value);
    }
});

function showBanner(message) {
    const banner = document.getElementById('errorBanner');
    banner.innerText = message;
    banner.classList.add('show');
    
    setTimeout(() => {
        banner.classList.remove('show');
    }, 3000);
}

function updateWeatherTheme(condition) {
    const body = document.body;
    const iconDiv = document.getElementById('weatherIcon');

    const weather = condition.toLowerCase();
    let newGradient = 'linear-gradient(135deg, #614385, #516395)';

    switch (weather) {
        case 'clear':
            newGradient = 'linear-gradient(135deg, #FFD700, #FF8C00)';
            iconDiv.innerText = '☀️';
            break;
        case 'clouds':
            newGradient = 'linear-gradient(135deg, #757F9A, #D7DDE8)';
            iconDiv.innerText = '☁️';
            break;
        case 'rain':
        case 'drizzle':
        case 'mist':
        case 'haze':
            newGradient = 'linear-gradient(135deg, #203A43, #2C5364)';
            iconDiv.innerText = '🌧️';
            break;
        case 'snow':
            newGradient = 'linear-gradient(135deg, #83a4d4, #b6fbff)';
            iconDiv.innerText = '❄️';
            break;
        case 'thunderstorm':
            newGradient = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
            iconDiv.innerText = '⛈️';
            break;
        default:
            newGradient = 'linear-gradient(135deg, #614385, #516395)';
            iconDiv.innerText = '🌍';
    }

    body.style.setProperty('--next-bg-gradient', newGradient);
    
    body.classList.add('transitioning');
    
    setTimeout(() => {
        body.style.setProperty('--bg-gradient', newGradient);
    }, 750);
}


async function getWeather(city) {
    const loader = document.getElementById('loader');
    const weatherCard = document.getElementById('weatherResult');
    const forecastSec = document.getElementById('forecastSection');
    
    loader.classList.remove('hidden');
    weatherCard.classList.add('hidden');
    forecastSec.classList.add('hidden');

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(response.status === 404 ? "Could not find city!" : "API Error occurred");
        }

        const data = await response.json();
        
        if (data.cod == "200") {
            localStorage.setItem('lastCity', data.city.name);
            document.getElementById('lastSearchedText').innerText = `Last searched: ${data.city.name}`;

            updateWeatherTheme(data.list[0].weather[0].main);

            const dailyData = data.list.filter((_, index) => index % 8 === 0);

            displayWeather(data); 
            displayForecast(dailyData);
            updateChart(dailyData);
            
            forecastSec.classList.remove('hidden');
            createHistoryCard(data.city.name, Math.round(data.list[0].main.temp));
        }
    } catch (error) {
        showBanner(error.message);
    } finally {
        loader.classList.add('hidden');
    }
}

function displayWeather(data) {
    const card = document.getElementById('weatherResult');
    card.classList.remove('hidden');
    
    document.getElementById('cityName').innerText = data.city.name; 
    document.getElementById('temperature').innerText = Math.round(data.list[0].main.temp);
    document.getElementById('description').innerText = data.list[0].weather[0].description;
    document.getElementById('humidity').innerText = data.list[0].main.humidity;
    document.getElementById('wind').innerText = data.list[0].wind.speed;
}

function createHistoryCard(city, temp) {
    const historyList = document.getElementById('historyList');
    const existingCards = historyList.querySelectorAll('.history-item');
    let duplicateCard = null;

    existingCards.forEach(card => {
        if (card.querySelector('strong').innerText.toLowerCase() === city.toLowerCase()) {
            duplicateCard = card;
        }
    });

    if (duplicateCard) {
        historyList.removeChild(duplicateCard);
    }

    const card = document.createElement('div');
    card.className = 'history-item';
    card.innerHTML = `<strong>${city}</strong>: ${temp}°C`;
    
    card.addEventListener('click', () => {
        document.getElementById('cityInput').value = city;
        getWeather(city);
    });

    historyList.prepend(card);

    if (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
}

document.getElementById('toggleViewBtn').addEventListener('click', () => {
    const list = document.getElementById('forecastList');
    const chart = document.getElementById('forecastChartContainer');
    const btn = document.getElementById('toggleViewBtn');

    if (list.classList.contains('hidden')) {
        list.classList.remove('hidden');
        chart.classList.add('hidden');
        btn.textContent = 'Switch to Chart';
    } else {
        list.classList.add('hidden');
        chart.classList.remove('hidden');
        btn.textContent = 'Switch to List';
    }
});

function displayForecast(forecastData) {
    const listContainer = document.getElementById('forecastList');
    listContainer.innerHTML = ''; 

    forecastData.forEach(item => {
        const dayName = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const div = document.createElement('div');
        div.className = 'forecast-item';
        div.innerHTML = `<span>${dayName}</span> <b>${Math.round(item.main.temp)}°C</b>`;
        listContainer.appendChild(div);
    });
}

let myChart = null; 

function updateChart(forecastData) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    
    if (myChart) { myChart.destroy(); } 

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: forecastData.map(item => new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })),
            datasets: [{
                label: 'Temp (°C)',
                data: forecastData.map(item => item.main.temp),
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: 'white' } },
                x: { ticks: { color: 'white' } }
            }
        }
    });
}
