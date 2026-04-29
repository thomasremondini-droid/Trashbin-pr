import os
import cv2
from ultralytics import YOLO #cervello della telecamera (AI)
from gpiozero import DistanceSensor, AngularServo
from time import sleep
import threading
from flask import Flask, render_template, Response, jsonify
from flask_cors import CORS

#variabili globali e statistiche----------------
app = Flask(__name__)
CORS(app)
stats = {"plastica": 0, "carta":0}
frame_globale = None #immagine per sito web

os.environ["OMP_NUM_THREADS"] = "4" #seleziono il thread da usare
modello = YOLO("best1_ncnn_model") #carica il modello pre-addestrato
telecamera = cv2.VideoCapture(0, cv2.CAP_V4L2) #identificare la telecamera

#Set up telecamera
telecamera.set(cv2.CAP_PROP_FRAME_WIDTH, 320) #abbassiamo la qualitá
telecamera.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
telecamera.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
conto = 0

if not telecamera.isOpened():
    print("Errore: impossibile aprire la camera")
    exit()

#Set up hardware, motori
sensore = DistanceSensor(echo = 17, trigger = 14)
motorePlastica = AngularServo(13, min_angle = -90, max_angle = 90, initial_angle = None)
motoreCarta = AngularServo(12, min_angle = -90, max_angle = 90, initial_angle = None)

motoreCarta.angle = 90
sleep(0.5)
motoreCarta.angle = None
motorePlastica.angle = -90
sleep(0.5)
motorePlastica.angle = None
bidonePlastica_inMovimento = False
bidoneCarta_inMovimento = False
def esegui_movimento(tipo):
    global bidonePlastica_inMovimento, bidoneCarta_inMovimento, stats
    if tipo == "plastica":
        bidonePlastica_inMovimento = True
        print("Apertura bidone plastica")
        stats["plastica"] += 1
        motorePlastica.angle = 90
        sleep(0.5)
        motorePlastica.angle = None
        sleep(3)
        print("Chiusura bidone plastica")
        motorePlastica.angle = -90
        sleep(0.5)
        motorePlastica.angle = None   
        bidonePlastica_inMovimento = False
    elif tipo == "carta":
        bidoneCarta_inMovimento = True
        print("Apertura bidone carta")
        stats["carta"] += 1
        motoreCarta.angle = -90
        sleep(0.5)
        motoreCarta.angle = None
        sleep(3)
        print("Chiusura bidone carta")
        motoreCarta.angle = 90
        sleep(0.5)
        motoreCarta.angle = None
        bidoneCarta_inMovimento = False

def logica_bidone():
    print("Sistema pronto, in attesa di un oggetto...")
    try:
        global frame_globale, stats,bidoneCarta_inMovimento,bidonePlastica_inMovimento
        while True:
            #si controlla se funziona la telecamera
            ret, frame = telecamera.read()
            if not ret:
                print("Errore: impossibile aprire la telecamera")
                break

            frame_globale = frame.copy()

            #va in azione solo se si rileva un oggeto
            distanza = sensore.distance * 100
            if distanza < 10:
                print(f"Oggetto rilevato a distanza: {distanza:1.1f} cm")
                risultati = modello(frame, stream = True, conf = 0.6, verbose = False)
                classe = None
                for i in risultati:
                    frame_ai = i.plot(labels=True, boxes=True, conf=False)
                    frame_globale = frame_ai.copy()
                    #cv2.imshow("Telecamera", frame_ai) #mostra il frame
                    for box in i.boxes:
                        #x1,y1,x2,y2 = box.xyxy[0]
                        classe_id = int(box.cls[0])
                        classe = i.names[classe_id]
                        confidenza = box.conf[0]
                        print(f"Oggetto rilevato: {classe}, confidenza: {confidenza:.2%}")
                        if classe is not None:
                            if classe == "plastic" and bidonePlastica_inMovimento == False:
                                threading.Thread(target=esegui_movimento, args=("plastica",)).start()
                                
                            elif classe == "paper" and bidoneCarta_inMovimento == False:
                                threading.Thread(target=esegui_movimento, args=("carta",)).start()
                    print("In attesa del prossimo oggetto...")
                    sleep(0.05)
    
            sleep(0.1)

            sleep(0.05)

    except KeyboardInterrupt:
        print("Uscita dal programma in corso...") 
    finally:
        telecamera.release()
        cv2.destroyAllWindows()
        motorePlastica.angle = -90
        motoreCarta.angle = 90
        sleep(0.5)
        motorePlastica.angle = None
        motoreCarta.angle = None
        print("Uscita completata.")

# @app.route('/')
# def bidonesito():
#     return render_template('trashbin.html')

@app.route('/apri/<tipo>')
def apri_bin(tipo):
    global bidonePlastica_inMovimento, bidoneCarta_inMovimento,stats
    print(f"Richiesta ricevuta per: {tipo}") # Questa appare nel terminale

    if (tipo == 'plastica' and bidonePlastica_inMovimento == True) or (tipo == 'carta' and bidoneCarta_inMovimento == True):
        return "Attendere, bidone giá aperto!", 429
    
    if tipo == "plastica" or tipo == "carta":
        threading.Thread(target=esegui_movimento, args=(tipo,)).start()
        return f"Apertura bidone: {tipo}", 200
    
    return "Errore", 400

#per aggiornare le statistiche dei rifiuti
@app.route('/stats')
def get_stats():
    global bidonePlastica_inMovimento, bidoneCarta_inMovimento
    return  jsonify({
        "status": "online", # Aggiungiamo questo per il JS
        "plastica":stats["plastica"],
        "carta":stats["carta"],
        "plastica_in_uso": bidonePlastica_inMovimento,
        "carta_in_uso": bidoneCarta_inMovimento
    })
#per avere lo streaming della camera sul sito
@app.route('/video_feed')
def video_feed():
    def genera():
        while True:
            if frame_globale is not None:
                #trasforma frame in un JPG
                ret, buffer = cv2.imencode('.jpg', frame_globale)
                frame_jpg = buffer.tobytes()  
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_jpg + b'\r\n')
    return Response(genera(), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- AVVIO ---
if __name__ == '__main__':
    # Avviamo la logica del bidone in "sottofondo"
    t = threading.Thread(target=logica_bidone, daemon=True)
    t.start()
    
    # Avviamo il server Flask
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)