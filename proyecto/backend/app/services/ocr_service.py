import os
from paddleocr import PaddleOCR
import cv2

def preprocess_image(img_path):

    img = cv2.imread(img_path)

    # Escala de grises + mejora de contraste local
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)


    # Binarizar
    _, img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    cv2.imshow("Original", img)
    cv2.waitKey(0)
    return img

def extract_text_from_image(img_name, img_extension):

    img_path = os.path.join('resources', img_name + img_extension)

    preprocessed = preprocess_image(img_path)

    ocr = PaddleOCR(lang='es')
    result = ocr.predict(preprocessed)


    textos = []
    for text, score, poly in zip(
        result[0]['rec_texts'],
        result[0]['rec_scores'],
        result[0]['rec_polys']
    ):
        textos.append((text, float(score)))
    return textos