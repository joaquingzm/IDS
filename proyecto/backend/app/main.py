from services.roi import roi_detection
from services.ocr import infer_trOCR
from services.post import classify_token, get_vademecum
import cv2
import os
import pandas as pd
from collections import defaultdict

IMG_NAME = "joaco1"
IMG_EXTENSION = ".jpeg"
WANTS_IMG = False


palabras_ocr = roi_detection(IMG_NAME, IMG_EXTENSION, WANTS_IMG)

palabras_ocr.upper()
print("Palabrasocr: ",palabras_ocr)

palabras_ocr_lista = palabras_ocr.split()
vademecum = get_vademecum()
threshold = 70


clasificados = defaultdict(lambda: {"palabras": [], "matches": []})


for palabra in palabras_ocr_lista:
    print('Palabra: ',palabra)
    clasificacion, match, score = classify_token(palabra, vademecum, threshold)
    if clasificacion: 
        clasificados[clasificacion]["palabras"].append(palabra)
        clasificados[clasificacion]["matches"].append(match)

for categoria, datos in clasificados.items():
    datos["palabras"] = " ".join(datos["palabras"])
    datos["matches"] = " ".join(datos["matches"])


print(dict(clasificados))