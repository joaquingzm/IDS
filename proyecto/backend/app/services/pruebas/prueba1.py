from paddleocr import PaddleOCR
from matplotlib import pyplot as plt
import cv2
import os
import numpy as np

IMG_NAME = 'receta1'
IMG_EXTENSION = '.jpeg'

def ROI_detection():

    ocr = PaddleOCR(lang='en')
    img_path = os.path.join('images',IMG_NAME+IMG_EXTENSION)
    result = ocr.predict(img_path)
    #result[0].save_to_img('results')

    img = cv2.imread(img_path)

    for i, (text, score, poly) in enumerate(zip(
            result[0]['rec_texts'],
            result[0]['rec_scores'],
            result[0]['rec_polys']
        )):

        # Aseguramos tipo float32 para transformaciones
        pts_src = poly.astype(np.float32)

        # Calcular ancho y alto del rectángulo
        width = int(np.linalg.norm(pts_src[0] - pts_src[1]))
        height = int(np.linalg.norm(pts_src[0] - pts_src[3]))

        # Coordenadas destino (rectángulo corregido)
        pts_dst = np.array([
            [0, 0],
            [width - 1, 0],
            [width - 1, height - 1],
            [0, height - 1]
        ], dtype=np.float32)

        # Obtener la matriz de transformación (perspectiva)
        M = cv2.getPerspectiveTransform(pts_src, pts_dst)

        # Aplicar la transformación para "enderezar" el rectángulo
        recorte = cv2.warpPerspective(img, M, (width, height))

        # Guardar o mostrar el resultado
        directory_name = 'crops_'+IMG_NAME
        os.makedirs(directory_name, exist_ok=True)
        directory = os.path.join(directory_name, f"crop_{i}.png")
        cv2.imwrite(directory, recorte)

ROI_detection()