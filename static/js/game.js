

// Costanti per gli SVG
const nastroDritto = `
    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
        <line x1="0" y1="50" x2="100" y2="50" stroke="#222" stroke-width="20"/>
        <line x1="0" y1="50" x2="100" y2="50" stroke="#676767" stroke-width="20" stroke-dasharray="15 15" class="animato"/>
    </svg>`;
const nastroCurvo = `
    <svg viewBox="0 0 100 100" class="nastro-svg">
        <path d="M 50 0 A 50 50 0 0 0 100 50" fill="none" stroke="#222" stroke-width="24" />
        <path d="M 50 0 A 50 50 0 0 0 100 50" fill="none" stroke="#676767" stroke-width="20" stroke-dasharray="15 15" class="animato" />
    </svg>`;

function creaGriglia(dimensione) {
    dimensioneAttuale = dimensione;
    const campo = document.getElementById("gioco-container");
    campo.innerHTML = '';
    campo.style.setProperty('--colonne', dimensione);

    const totalPezzi = dimensione * dimensione;
    
    // 1. Genera un percorso logico garantito e nascondilo nel livello
    let percorsoSegreto = generaPercorsoValido(dimensione);
    let mappaSoluzione = calcolaPezziSoluzione(percorsoSegreto, dimensione);

    for (let i = 0; i < totalPezzi; i++) {
        let nuovoPezzo = document.createElement("div");
        nuovoPezzo.classList.add("pezzo");
        nuovoPezzo.id = `pezzo-${i}`; // ID univoco per trovarli durante l'animazione

        if (i === 0) {
            nuovoPezzo.classList.add("start");
            nuovoPezzo.innerHTML = "INIZIO";
        } else if (i === totalPezzi - 1) {
            nuovoPezzo.classList.add("end");
            nuovoPezzo.innerHTML = "🗑️";
        } else {
            let tipo, angoloLogico;
            
            // Se questa cella fa parte del percorso segreto, usa il pezzo corretto
            if (mappaSoluzione[i]) {
                tipo = mappaSoluzione[i].tipo;
                angoloLogico = mappaSoluzione[i].angle;
            } else {
                // Altrimenti metti un pezzo a caso
                tipo = Math.random() > 0.5 ? 'curvo' : 'dritto';
                angoloLogico = 0;
            }

            // Aggiungiamo rotazioni casuali extra per "scombinare" il puzzle per il giocatore
            let rotazioniExtra = Math.floor(Math.random() * 4); 
            let angoloAttuale = (angoloLogico + rotazioniExtra * 90) % 360;

            // Salviamo i dati per la logica (0-360) e l'angolo visivo per il CSS (cresce all'infinito per non far girare il pezzo al contrario)
            nuovoPezzo.setAttribute('data-tipo', tipo);
            nuovoPezzo.setAttribute('data-angle', angoloAttuale);
            nuovoPezzo.setAttribute('data-vis-angle', angoloAttuale);
            nuovoPezzo.innerHTML = tipo === 'dritto' ? nastroDritto : nastroCurvo;
            nuovoPezzo.style.transform = `rotate(${angoloAttuale}deg)`;

            nuovoPezzo.onclick = function() {
                let visAngle = parseInt(this.getAttribute('data-vis-angle'));
                let logAngle = parseInt(this.getAttribute('data-angle'));
                
                // Aggiorniamo di 90 gradi
                visAngle += 90;
                logAngle = (logAngle + 90) % 360; // Manteniamo la logica tra 0, 90, 180, 270
                
                this.style.transform = `rotate(${visAngle}deg)`;
                this.setAttribute('data-vis-angle', visAngle);
                this.setAttribute('data-angle', logAngle);
            };
        }
        campo.appendChild(nuovoPezzo);
    }
}

// ==========================================
// FUNZIONI PER LA GENERAZIONE DEL PERCORSO
// ==========================================

// Trova un percorso da 0 a FINE usando un algoritmo DFS (Depth First Search)
function generaPercorsoValido(dim) {
    let visited = new Array(dim * dim).fill(false);
    let path = [];

    function dfs(curr) {
        path.push(curr);
        visited[curr] = true;

        // Se siamo arrivati alla fine, vittoria!
        if (curr === dim * dim - 1) return true;

        let neighbors = [];
        let r = Math.floor(curr / dim);
        let c = curr % dim;

        if (r > 0) neighbors.push(curr - dim); // Su
        if (r < dim - 1) neighbors.push(curr + dim); // Giù
        if (c > 0) neighbors.push(curr - 1); // Sinistra
        if (c < dim - 1) neighbors.push(curr + 1); // Destra

        // Mischia i vicini per creare percorsi casuali a zig-zag
        neighbors.sort(() => Math.random() - 0.5);

        for (let next of neighbors) {
            if (!visited[next]) {
                if (dfs(next)) return true;
            }
        }

        // Se nessuna direzione va bene, torna indietro (Backtracking)
        path.pop();
        return false;
    }

    dfs(0);
    return path;
}

// Analizza il percorso trovato e decide se servono tubi dritti o curvi e come ruotarli
function calcolaPezziSoluzione(path, dim) {
    let sol = {};
    for (let i = 1; i < path.length - 1; i++) {
        let curr = path[i];
        let prev = path[i - 1];
        let next = path[i + 1];

        // 0=Su, 1=Destra, 2=Giù, 3=Sinistra
        let dir1 = ottieniDirezione(curr, prev, dim);
        let dir2 = ottieniDirezione(curr, next, dim);

        let ports = [dir1, dir2].sort((a,b) => a-b).join(',');

        if (ports === '0,2' || ports === '1,3') sol[curr] = { tipo: 'dritto', angle: ports === '1,3' ? 0 : 90 };
        else if (ports === '0,1') sol[curr] = { tipo: 'curvo', angle: 0 };
        else if (ports === '1,2') sol[curr] = { tipo: 'curvo', angle: 90 };
        else if (ports === '2,3') sol[curr] = { tipo: 'curvo', angle: 180 };
        else if (ports === '0,3') sol[curr] = { tipo: 'curvo', angle: 270 };
    }
    return sol;
}

function ottieniDirezione(da, a, dim) {
    if (a === da - dim) return 0; // Su
    if (a === da + 1) return 1;   // Destra
    if (a === da + dim) return 2; // Giù
    if (a === da - 1) return 3;   // Sinistra
}


function getPorteAperte(tipo, angolo) {
    let rotazioni = angolo / 90;
    // Un pezzo dritto (0 deg) collega Destra(1) e Sinistra(3)
    // Un pezzo curvo (0 deg) collega Su(0) e Destra(1)
    let porteBase = tipo === 'dritto' ? [1, 3] : [0, 1];
    
    // Mappatura matematica elegante per ruotare le porte aperte
    return porteBase.map(p => (p + rotazioni) % 4);
}

function verificaPercorso() {
    let dim = dimensioneAttuale;
    let totalPezzi = dim * dim;
    let currCell = 0;
    let prevCell = -1;
    let animPath = [0]; // Tracciamo il percorso che farà l'animazione

    while (currCell !== totalPezzi - 1) {
        let mosso = false;
        let neighbors = [
            { dir: 0, index: currCell - dim },
            { dir: 1, index: currCell + 1 },
            { dir: 2, index: currCell + dim },
            { dir: 3, index: currCell - 1 }
        ];

        // Filtra i vicini che escono dai bordi
        neighbors = neighbors.filter(n => {
            if (n.index < 0 || n.index >= totalPezzi) return false;
            if (currCell % dim === 0 && n.dir === 3) return false;
            if (currCell % dim === dim - 1 && n.dir === 1) return false;
            return true;
        });

        // Ottieni porte del pezzo attuale
        let currentPorts = [];
        if (currCell === 0) {
            currentPorts = [0, 1, 2, 3]; // L'INIZIO spara in qualsiasi direzione valida
        } else {
            let el = document.getElementById(`pezzo-${currCell}`);
            currentPorts = getPorteAperte(el.getAttribute('data-tipo'), parseInt(el.getAttribute('data-angle')));
        }

        for (let n of neighbors) {
            if (n.index === prevCell) continue; // Non tornare indietro!

            //Il pezzo attuale è aperto verso il vicino?
            if (!currentPorts.includes(n.dir)) continue;

            // Il vicino è aperto verso di noi
            let targetPorts = [];
            if (n.index === totalPezzi - 1) {
                targetPorts = [0, 1, 2, 3]; // La FINE accetta tutto
            } else {
                let el = document.getElementById(`pezzo-${n.index}`);
                targetPorts = getPorteAperte(el.getAttribute('data-tipo'), parseInt(el.getAttribute('data-angle')));
            }

            // La porta reciproca (es: se esco a Destra(1), il vicino deve essere aperto a Sinistra(3))
            let reciproca = (n.dir + 2) % 4;
            
            if (targetPorts.includes(reciproca)) {
                // Trovata connessione valida!
                prevCell = currCell;
                currCell = n.index;
                animPath.push(currCell);
                mosso = true;
                break;
            }
        }

        if (!mosso) break; // Vicolo cieco, ferma il ciclo
    }

    avviaAnimazione(animPath, dim, currCell === totalPezzi - 1);
}

function avviaAnimazione(path, dim, successo) {
    let rifiuto = document.getElementById("rifiuto-animato");
    if (!rifiuto) {
        rifiuto = document.createElement("div");
        rifiuto.id = "rifiuto-animato";
        rifiuto.innerHTML = "♻️";
        document.getElementById("gioco-container").appendChild(rifiuto);
    }

    let cellaInizio = document.getElementById("pezzo-0");
    
    // rifiuto.style.left = (cellaInizio.offsetLeft + 25) + "px"; per centrarlo, ma gia fatto nel css
    // rifiuto.style.top = (cellaInizio.offsetTop + 25) + "px";
    
    let stepIndex = 0;

    function faiUnPasso() {
        if (stepIndex < path.length) {
            let cella = document.getElementById(`pezzo-${path[stepIndex]}`);
            rifiuto.style.left = (cella.offsetLeft + 25) + "px";
            rifiuto.style.top = (cella.offsetTop + 25) + "px";
            stepIndex++;
            
            // Aspetta il completamento dell'animazione CSS (400ms) prima del prossimo passo
            setTimeout(faiUnPasso, 400); 
        } else {
            // Fine del percorso
            setTimeout(() => {
                if (successo) {
                    alert("Rifiuto riciclato con successo! 🎉");
                } else {
                    alert("Ops... c'é un problema con i nastri trasportatori!🚚");
                    // Riporta il rifiuto all'inizio in caso di errore
                    rifiuto.style.left = (cellaInizio.offsetLeft + 25) + "px";
                    rifiuto.style.top = (cellaInizio.offsetTop + 25) + "px";
                }
            }, 300);
        }
    }

    // Parte l'animazione dopo 100ms per sicurezza di rendering
    setTimeout(faiUnPasso, 100);
}

// Inizializza il gioco all'avvio della pagina
window.onload = () => creaGriglia(3);