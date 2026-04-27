from gpiozero import DistanceSensor, AngularServo
from time import sleep

#configuriamo sensore di distanza
sensore = DistanceSensor(echo = 17, trigger = 14)

#configurare servomotore
motorePlastica = AngularServo(12,min_angle = -90, max_angle = 90)
motoreCarta = AngularServo(13, min_angle = -90, max_angle = 90)
print("Test motore avviato")

try:
    motorePlastica.angle = 0
    motoreCarta.angle = 0
    sleep(1)

    while True:
        distanza = sensore.distance * 100

        if distanza < 10:
            print(f"Oggetto rilevato a distanza: {distanza:.1f} cm")
            scelta = input("plastica, carta oppure q(uscire): ")

            if scelta.lower() == "plastica":
                print("Apertura bidone plastica")
                motorePlastica.angle = 90
                sleep(3)
                print("Chiusura bidone plastica")
                motorePlastica.angle = 0

            elif scelta.lower() == "carta":
                print("Apertura bidone carta")
                motoreCarta.angle = 90
                sleep(3)
                print("Chiusura bidone carta")
                motoreCarta.angle = 0
            elif scelta.lower() == 'q':
                print("Uscita dal programma in corso...")
                sleep(1)
                break
            else:
                print("Scelta non valida riprova")
            
            print("In attesa del prossimo oggetto...")
            sleep(2)
        sleep(0.1)
except KeyboardInterrupt:
    print("Programma interrotto")
finally:
    motorePlastica.angle = 0
    motoreCarta.angle = 0
        

