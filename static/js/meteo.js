// Configurazione Darmstadt
const lat = 49.87;
const lon = 8.65;

// 1. Aggiorna l'orologio e la data in tempo reale
function updateClock() {
    const now = new Date();
    document.getElementById('time').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'});
    
    // Se c'è l'elemento 'date' nell'HTML, lo aggiorna
    const dateEl = document.getElementById('date');
    if(dateEl) {
        dateEl.innerText = now.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
}
setInterval(updateClock, 1000);
updateClock();

// 2. Recupera Meteo e Previsioni (Darmstadt)
async function getWeatherData() {
    // API per il meteo di ORA
    const currentUrl = `https://api.brightsky.dev/current_weather?lat=${lat}&lon=${lon}`;
    
    // Impostiamo le date per chiedere le PREVISIONI (da oggi ai prossimi 4 giorni)
    const today = new Date();
    const lastDate = new Date();
    lastDate.setDate(today.getDate() + 7); 
    
    const dateISO = today.toISOString().split('T')[0];
    const lastDateISO = lastDate.toISOString().split('T')[0];
    const forecastUrl = `https://api.brightsky.dev/weather?lat=${lat}&lon=${lon}&date=${dateISO}&last_date=${lastDateISO}`;

    try {
        console.log("1. Recupero meteo attuale...");
        const currentRes = await fetch(currentUrl);
        if (!currentRes.ok) throw new Error("Errore API meteo corrente");
        
        const currentData = await currentRes.json();
        const current = currentData.weather;

        // Inseriamo i dati attuali (uso "|| 0" in modo che se l'API dà null, scrive 0 invece di dare errore)
        document.getElementById('main-temp').innerText = `${Math.round(current.temperature)}°`;
        document.getElementById('humidity').innerText = `${Math.round(current.relative_humidity)}%`;
        document.getElementById('wind').innerText = `${Math.round(current.wind_speed || 0)} km/h`;
        document.getElementById('pressure').innerText = `${Math.round(current.pressure_msl || 0)} hPa`;
        

        // Passiamo l'icona o la condizione per lo sfondo
        updateBackground(current.icon || current.condition);

        console.log("2. Recupero previsioni per i prossimi giorni...");
        const forecastRes = await fetch(forecastUrl);
        if (!forecastRes.ok) throw new Error("Errore API previsioni");
        const forecastData = await forecastRes.json();
        
        // BrightSky per le previsioni restituisce dati orari. Li raggruppiamo per trovare la TEMP MAX di ogni giorno
        const dailyMax = {};
        forecastData.weather.forEach(item => {
            const dayStr = item.timestamp.substring(0, 10); // Prende solo la data YYYY-MM-DD
            if (!dailyMax[dayStr] || item.temperature > dailyMax[dayStr].temp) {
                dailyMax[dayStr] = {
                    temp: item.temperature,
                    icon: item.icon || item.condition
                }
            }
        });

        // Andiamo a riempire l'HTML delle previsioni
        const forecastContainer = document.getElementById('forecast-id');
        forecastContainer.innerHTML = ''; // Svuotiamo i vecchi dati finti dell'HTML
        
        let count = 0;
        for (const [dateString, dayData] of Object.entries(dailyMax)) {
            if (dateString === dateISO) continue; // Saltiamo il meteo di oggi, è già al centro
            if (count >= 7) break; // Vogliamo solo i 7 giorni successivi
            
            const dateObj = new Date(dateString);
            const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'long'});
            const dayCap = dayName.charAt(0).toUpperCase() + dayName.slice(1); // Mette la prima lettera maiuscola (es: "Sab")
            const dayDate = dateObj.toLocaleDateString('it-IT',{day: 'numeric', month: 'long'})

            const maxTemp = dayData.temp;
            const condition = dayData.icon.toLowerCase();

            let emoji = "🌤️"  //default
            if(condition.includes('rain')) emoji = "🌧️";
            else if (condition.includes('clear') || condition.includes('dry')) emoji = "☀️";
            else if (condition.includes('partly')) emoji = "⛅";
            else if (condition.includes('cloud')) emoji = "☁️";
            else if (condition.includes('snow')) emoji = "❄️";
            else if (condition.includes('storm') || condition.includes('thunder')) emoji = "⛈️";


            forecastContainer.innerHTML += `
                <div class="day">
                    <span>${dayCap} <strong>${dayDate}</span>
                    <strong>${emoji} ${Math.round(maxTemp)}°</strong>
                </div>
            `;
            count++;
        }

        console.log("Tutto aggiornato con successo!");

    } catch (error) {
        console.error("SI È VERIFICATO UN ERRORE:", error);
    }
}

function updateBackground(condition) {
    const body = document.body;
    
    // Controllo di sicurezza: se "condition" è null, mettiamo lo sfondo standard e ci fermiamo qui
    if (!condition) {
        body.style.backgroundImage = "url('../static/images/default.jpg')";
        return;
    }
    
    const c = condition.toLowerCase();
    
    if (c.includes('rain')) body.style.backgroundImage = "url('../static/images/rain.jpg')";
    else if (c.includes('clear') || c.includes('dry')) body.style.backgroundImage = "url('../static/images/sunny.jpg')";
    else if (c.includes('partly')) body.style.backgroundImage = "url('../static/images/partly-cloudy.jpg')";
    else if (c.includes('cloud')) body.style.backgroundImage = "url('../static/images/cloudy.jpg')";
    else if (c.includes('snow')) body.style.backgroundImage = "url('../static/images/snow.jpg')";
    else body.style.backgroundImage = "url('../static/images/default.jpg')";
}

// Avvia la funzione appena carica la pagina
getWeatherData();