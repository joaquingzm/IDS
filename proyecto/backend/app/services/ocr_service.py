import cv2
import numpy as np
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch

processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)


def find_text_lines_hp(binary):
    binary_inv = 255 - binary

    horizontal_sum = np.sum(binary_inv, axis=1)

    threshold = np.max(horizontal_sum) * 0.2

    lines = []
    start = None

    for i, val in enumerate(horizontal_sum):
        if val > threshold and start is None:
            start = i
        elif val <= threshold and start is not None:
            end = i
            lines.append((start, end))
            start = None

    return lines

def preprocess_cv_binarizacion_adaptativa(img_path):
    img = cv2.imread(img_path)

    # 0. Imagen sin modificar
    cv2.imshow("Sin procesar", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
    # 1. deskew basic (detectar la rotación con moments o Hough - aquí simple bounding box rot)

    # 2. convertir a gris
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    cv2.imshow("Gray", gray)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # 3. CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    cv2.imshow("CLAHE", enhanced)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # 4. denoise
    denoised = cv2.fastNlMeansDenoising(enhanced, h=10)

    cv2.imshow("denoise", denoised)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # 5. adaptative threshold
    binary = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=11,  # tamaño de la vecindad (debe ser impar)
        C=1            # constante a restar del promedio local
    )
    
    cv2.imshow("binary", binary)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # 6. convertir a PIL RGB (TrOCR espera imagen RGB)
    pil = Image.fromarray(cv2.cvtColor(binary, cv2.COLOR_GRAY2RGB))

    return pil

def infer_trOCR(pil_image):
    pixel_values = processor(images=pil_image, return_tensors="pt").pixel_values.to(device)
    generated_ids = model.generate(pixel_values, max_length=512)
    text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return text



img_path = "blas3_linea2.jpeg"

img = cv2.imread(img_path)

"""
# binarizacion
_, binary = cv2.threshold(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 80, 255, cv2.THRESH_BINARY)
cv2.imshow("binary", binary)
cv2.waitKey(0)
cv2.destroyAllWindows()
"""

def proyeccionHorizontal(binary):
    

    # extraigo líneas de texto
    lines = find_text_lines_hp(binary)

    line_images = []

    for start, end in lines:
        # Agregar un pequeño margen opcional para no cortar partes de letras
        margin = 20
        top = max(0, start - margin)
        bottom = min(img.shape[0], end + margin)

        # Recortar la imagen: todas las columnas, solo filas start:end
        line_img = img[top:bottom, :]
        line_images.append(line_img)

    textoPa = ""

    for i, linea_img in enumerate(line_images):
        cv2.imshow("binary", linea_img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

        textoPa = textoPa + infer_trOCR(linea_img) 

    textoPa = textoPa.lower().replace(".", "")

    return textoPa

def contornos(binary):
    binary_inv = 255 - binary
    contours, _ = cv2.findContours(binary_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    
    line_imgs = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w > 50 and h > 10:  # filtrar áreas muy pequeñas
            line_imgs.append(img[y:y+h, x:x+w])

    textoPa = ""

    for i, linea_img in enumerate(line_imgs):
        cv2.imshow("binary", linea_img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

        textoPa = textoPa + infer_trOCR(linea_img) 

    textoPa = textoPa.lower().replace(".", "")

    return textoPa

#print("OCR PH: ",proyeccionHorizontal(binary))
#print("OCR contornos CV2: ",contornos(binary))

print("OCR: ", infer_trOCR(img))