import cv2
from ultralytics import YOLO #cervello della telecamera (AI)

modello = YOLO("yolov8s.pt") #carica il modello pre-addestrato

telecamera = cv2.VideoCapture(0)

while True:
    ret, frame = telecamera.read()

    if not ret:
        print("Errore: impossibile aprire la camera")
        break

    risultati = modello(frame,stream = True,  ) #anallizza il frame
    for i in risultati:
        frame_ai = i.plot() #disegna cornici attorno all'immagine

    cv2.imshow("Telecamera", frame_ai)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

telecamera.release()
cv2.destroyAllWindows()