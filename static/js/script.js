
const URL_RASPBERRY = "https://not-matching-peoples-asin.trycloudflare.com"

// Funzione per aggiornare i contatori ogni secondo senza ricaricare la pagina
function updateStats() {
    fetch(URL_RASPBERRY + '/stats')
        .then(response => {
            if (response.ok){
                document.getElementById('offline-screen').style.display = 'none';
                document.getElementById('live-streem').style.display = 'block'; // Mostra video
                return response.json();
            }else{
                throw new Error("Offline");
            }
            
        })
        .then(data => {
            // SISTEMA ONLINE: Mostro video, nascondo errore
            const badge = document.getElementById('status-badge');
            badge.innerText = "SISTEMA ONLINE";
            badge.classList.remove('offline');
            badge.classList.add('online');
            //aggiorno i conteggi
            document.getElementById('count-plastica').innerText = data.plastica;
            document.getElementById('count-carta').innerText = data.carta;
            //sistemo i bottoni
            const btnPlastica = document.querySelector(".btn-plastica");
            const btnCarta = document.querySelector(".btn-carta");

            if (data.plastica_in_uso){
                btnPlastica.disabled = true;
                btnPlastica.style.opacity = "0.5";
            }else{
                btnPlastica.disabled = false;
                btnPlastica.style.opacity = "1";
            }
            if (data.carta_in_uso){
                btnCarta.disabled = true;
                btnCarta.style.opacity = "0.5";
            }else{
                btnCarta.disabled = false;
                btnCarta.style.opacity = "1";
            }
        })
        .catch(error => {
            console.warn("Sistema Offline");
            document.getElementById('offline-screen').style.display = 'flex'; //Mostra avviso camera offline
            document.getElementById('live-streem').style.display = 'none' //Rimuovo il video
            const badge = document.getElementById('status-badge');
            badge.innerText = "SISTEMA OFFLINE";
            badge.classList.remove('online');
            badge.classList.add('offline');

            //Disabilito anche i bottoni
            const bPlastica = document.querySelector(".btn-plastica");
            const bCarta = document.querySelector(".btn-carta");
            if (bPlastica) bPlastica.disabled = true;
            if (bCarta) bCarta.disabled = true;
            //btnPlastica.style.opacity = "0.5";
            //btnCarta.style.opacity = "0.5";
        });
}
setInterval(updateStats, 1000); // Aggiorna ogni 1000ms

function apriBin(tipo) {
    const btnPlastica = document.querySelector('.btn-plastica');
    const btnCarta = document.querySelector('.btn-carta');
    let btnSelezionato;
    if (tipo == 'plastica') {
        btnSelezionato = btnPlastica;
    }if (tipo == 'carta'){
        btnSelezionato = btnCarta;

    }
    btnSelezionato.disabled = true;
    btnSelezionato.style.opacity = "0.5";
    
    console.log("Comando inviato: apri " + tipo);


    // Quando userai Flask, questo manderà una richiesta al server
    fetch(URL_RASPBERRY + '/apri/' + tipo)
        .then(response => {
            if (!response.ok) {
                console.error("Errore nell'apertura del cestino");
            }
        })
        .catch(error => {
            console.error("Errore connessione:",error);
        })
        .finally(() => {
            setTimeout(()=>{
                btnSelezionato.disabled = false;
                btnSelezionato.style.opacity = "1";
                console.log("bottone riattivato");
            }, 1000); //Aspettiamo 1sec per sicurezza
        });
}