import os
import cv2
from ultralytics import YOLO #cervello della telecamera (AI)
from gpiozero import DistanceSensor, AngularServo
from time import sleep


os.environ["OMP_NUM_THREADS"] = "4"
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

print("Sistema pronto, in attesa di un oggetto...")

try:
    while True:
        #si controlla se funziona la telecamera
        ret, frame = telecamera.read()
        if not ret:
            print("Errore: impossibile aprire la telecamera")
            break
        #va in azione solo se si rileva un oggeto
        distanza = sensore.distance * 100
        if distanza < 10:
            print(f"Oggetto rilevato a distanza: {distanza:1.1f} cm")

            risultati = modello(frame, stream = True, conf = 0.6, verbose = False)
            classe = None
            for i in risultati:
                frame_ai = i.plot(labels=True, boxes=True, conf=False)
                for box in i.boxes:
                    x1,y1,x2,y2 = box.xyxy[0]
                    classe_id = int(box.cls[0])
                    classe = i.names[classe_id]
                    confidenza = box.conf[0]
                    print(f"Oggetto rilevato: {classe}, confidenza: {confidenza:.2%}")
            #cv2.imshow("Telecamera", frame_ai) #mostra il frame
            if classe is not None:
                if classe == "plastic":
                    print("Apertura bidone plastica")
                    motorePlastica.angle = 90
                    sleep(0.5)
                    motorePlastica.angle = None
                    sleep(3)
                    print("Chiusura bidone plastica")
                    motorePlastica.angle = -90
                    sleep(0.5)
                    motorePlastica.angle = None   
                elif classe == "paper":
                    print("Apertura bidone carta")
                    motoreCarta.angle = -90
                    sleep(0.5)
                    motoreCarta.angle = None
                    sleep(3)
                    print("Chiusura bidone carta")
                    motoreCarta.angle = 90
                    sleep(0.5)
                    motoreCarta.angle = None
                
                print("In attesa del prossimo oggetto...")
                sleep(2)
            else:
                print("L'AI non ha riconosciuto, riprova")
                sleep(1)

        sleep(0.05)

except KeyboardInterrupt:
    print("Uscita dal programma in corso...") 
    sleep(1)
finally:
    telecamera.release()
    cv2.destroyAllWindows()
    motorePlastica.angle = -90
    motoreCarta.angle = 90
    sleep(0.5)
    motorePlastica.angle = None
    motoreCarta.angle = None
    print("Uscita completata.")

