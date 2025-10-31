import cv2
import os
import numpy as np
from paddleocr import PaddleOCR
from services.roi_img import roi_img
from services.order_points import order_points

#   roi_detection: se detectan regiones de interes de una imagen y se guardan en imagenes individuales;

#   img_name: nombre de la imagen a procesar;
#   img_extension: extension de la imagen a procesar;
#   wants_img: indica si debe crear una copia de la imagen original pero con las regiones graficadas;

#   imgs: lista de crops;

def roi_detection(img_name, img_extension, wants_img):
    
#   se inicia al OCR y trabaja sobre la imagen;
    ocr = PaddleOCR(lang='en')
    img_path = os.path.join('images', img_name + img_extension)
    result = ocr.predict(img_path)

#   imagen preprocesada que usa el OCR;
    img_for_cropping = result[0].get('doc_preprocessor_res', {})['output_img']

#   se crea directorio donde se guardaran los crops;
    directory_name = 'crops_' + img_name
    os.makedirs(directory_name, exist_ok=True)

    imgs = []

#   procesamos cada poligono;
    for i, (text, score, poly) in enumerate(zip(
            result[0]['rec_texts'],
            result[0]['rec_scores'],
            result[0]['rec_polys']
        )):

#       numpy necesita el formato float32 (4,2);
        pts = np.array(poly, dtype=np.float32)
        if pts.shape != (4,2) : continue

#       ordenar puntos;
        pts_ordered = order_points(pts)

#       calcular dimensiones del poligono;
        widthA = np.linalg.norm(pts_ordered[2] - pts_ordered[3])
        widthB = np.linalg.norm(pts_ordered[1] - pts_ordered[0])
        maxWidth = max(int(round(widthA)), int(round(widthB)))
        heightA = np.linalg.norm(pts_ordered[1] - pts_ordered[2])
        heightB = np.linalg.norm(pts_ordered[0] - pts_ordered[3])
        maxHeight = max(int(round(heightA)), int(round(heightB)))
        if maxWidth <= 0 or maxHeight <= 0 : continue

#       transformar poligono para que el texto este recto;
        pts_dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype=np.float32)
        M = cv2.getPerspectiveTransform(pts_ordered, pts_dst)
        recorte = cv2.warpPerspective(img_for_cropping, M, (maxWidth, maxHeight), flags=cv2.INTER_CUBIC)

#       agregar un margen para que no corte caracteres;
        pad = 2
        rh, rw = recorte.shape[:2]
        padded = np.zeros((rh + 2*pad, rw + 2*pad, recorte.shape[2]), dtype=recorte.dtype)
        padded[pad:pad+rh, pad:pad+rw] = recorte
        recorte = padded

#       se guarda imagen cropeada;
        ruta = os.path.join(directory_name, f"crop_{i}.png")
        cv2.imwrite(ruta, recorte)
        imgs.append(recorte)

#   se guarda una imagen con los rectangulos graficados;
    if wants_img : roi_img(img_for_cropping,result[0]['rec_polys'],directory_name)

#   se devuelve array de crops;
    return imgs