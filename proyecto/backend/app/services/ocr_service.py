import os
from paddleocr import PaddleOCR
import cv2

def preprocess_image(img):

   

    # Escala de grises + mejora de contraste local
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # # clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    # # gray = clahe.apply(gray)

    den = cv2.bilateralFilter(gray, 7, 50, 50)
    blurred = cv2.GaussianBlur(den, (3, 3), 0)


    # # Binarizar
    # _, bin = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    img = cv2.cvtColor(blurred, cv2.COLOR_GRAY2BGR)
    cv2.imshow("Original", img)
    cv2.waitKey(0)
    return img

def extract_text_from_image(img):


    preprocessed = preprocess_image(img)

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