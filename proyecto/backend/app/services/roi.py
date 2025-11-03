import cv2
import os
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR

def order_points(pts):
    #   order_points: ordena 4 puntos en el orden: [tl, tr, br, bl]

    #   pts: lista de 4 puntos a ordenar;

    #   rect: lista de 4 puntos ordenados;

    ordered_points = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    ordered_points[0] = pts[np.argmin(s)]
    ordered_points[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1).reshape(4,)
    ordered_points[1] = pts[np.argmin(diff)]
    ordered_points[3] = pts[np.argmax(diff)]

    return ordered_points

def roi_img (img, polys, directory_name):
    #   roi_img: guardar imagen con los poligonos graficados;

    #   img: imagen a editar;
    #   polys: lista de poligonos a graficar;
    #   directory_name: nombre del directorio donde se guardara la imagen editada;

    #   aux_img: imagen editada;
    aux_img = img.copy()
    for poly in polys:
        pts_draw = np.array(poly, dtype=np.int32).reshape((-1,1,2))
        cv2.polylines(aux_img, [pts_draw], isClosed=True, color=(0,255,0), thickness=1)
    cv2.imwrite(os.path.join(directory_name, "roi_boxes.png"), aux_img)
    return aux_img

def roi_detection(img_name, img_extension, wants_img):
    #   roi_detection: se detectan regiones de interes de una imagen y se guardan en imagenes individuales;

    #   img_name: nombre de la imagen a procesar;
    #   img_extension: extension de la imagen a procesar;
    #   wants_img: indica si debe crear una copia de la imagen original pero con las regiones graficadas;

    #   imgs: lista de crops;
    
#   se inicia al OCR y trabaja sobre la imagen;
    ocr = PaddleOCR(lang='en')
    img_path = os.path.join('resources', img_name + img_extension)
    result = ocr.predict(img_path)

#   imagen preprocesada que usa el OCR;
    img_for_cropping = result[0].get('doc_preprocessor_res', {})['output_img']

#   se crea directorio donde se guardaran los crops;
    directory_name = ''
    if wants_img :
        directory_name = 'crops_' + img_name
        os.makedirs(directory_name, exist_ok=True)

    imgs = []

    print("PADDLEOCR:")
#   procesamos cada poligono;
    for i, (text, score, poly) in enumerate(zip(
            result[0]['rec_texts'],
            result[0]['rec_scores'],
            result[0]['rec_polys']
        )):

        print(f"Texto {i}: {text}, score: {score}")

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
        if wants_img :
            ruta = os.path.join(directory_name, f"crop_{i}.png")
            cv2.imwrite(ruta, recorte)
        pil_image = Image.fromarray(cv2.cvtColor(recorte, cv2.COLOR_BGR2RGB))
        imgs.append(pil_image)

#   se guarda una imagen con los rectangulos graficados;
    if wants_img : roi_img(img_for_cropping,result[0]['rec_polys'],directory_name)

#   se devuelve array de crops;
    return imgs