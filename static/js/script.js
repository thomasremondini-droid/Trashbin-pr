
const URL_RASPBERRY = "htttps://bidone-smart.bidone.com"

// Funzione per aggiornare i contatori ogni secondo senza ricaricare la pagina
function updateStats() {
    fetch('/stats')
        .then(response => {
            if (response.ok){
                document.getElementById('offline-screen').style.display = 'none';
            }
            return response.json();
        })
        .then(data => {
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
            document.getElementById('offline-screen').style.display = 'flex';
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
    fetch('/apri/' + tipo)
        .then(response => {
            if (!response.ok) {
                console.error("Errore nell'apertura del cestino");
            }
        })
        .catch(error => {
            console.warn("Server non trovato. Se sei in locale senza Flask, è normale.");
        })
        .finally(() => {
            setTimeout(()=>{
                btnSelezionato.disabled = false;
                btnSelezionato.style.opacity = "1";
                console.log("bottone riattivato");
            }, 1000);
        });
}