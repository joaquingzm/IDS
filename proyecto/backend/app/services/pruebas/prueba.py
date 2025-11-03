import cv2
import numpy as np
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch

processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

def preprocess_cv_binarizacion(img_path):
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

    # 5. binarización
    _, binary = cv2.threshold(denoised, 80, 255, cv2.THRESH_BINARY)

    cv2.imshow("binary", binary)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # 6. convertir a PIL RGB (TrOCR espera imagen RGB)
    pil = Image.fromarray(cv2.cvtColor(binary, cv2.COLOR_GRAY2RGB))

    return pil

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

if __name__ == "__main__":
    img_path = "test1.png"
    pil_b = preprocess_cv_binarizacion(img_path)
    pil_a_b = preprocess_cv_binarizacion_adaptativa(img_path);
    texto_p_b = infer_trOCR(pil_b)
    texto_p_a_b = infer_trOCR(pil_a_b)
    texto = infer_trOCR(cv2.imread(img_path))
    print("OCR Con preprocesado (binarización):", texto_p_b)
    print("OCR Con preprocesado (binarización adapt):", texto_p_a_b)
    print("OCR sin preprocesado:", texto)
