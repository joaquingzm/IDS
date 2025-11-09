from services.ocr_service import extract_text_from_image
from services.vademecum_loader import get_vademecum
from services.extractor import find_best_window, extract_fields_from_window, normalize_line
import cv2
import os

def extraerTexto(img):
    ocr_tuples = extract_text_from_image(img) 
    palabras_ocr = [t for t,_ in ocr_tuples]
    ocr_confs = [c for _,c in ocr_tuples]
    norm_lines = [normalize_line(ln) for ln in palabras_ocr]
    vadem = get_vademecum()

  
    start, end, window = find_best_window(norm_lines, vadem, ocr_confs=ocr_confs)
    raw_window_lines = palabras_ocr[start:end + 1] if start <= end else []
    result = extract_fields_from_window(window, raw_window_lines, vadem)
    
    return result["corrected_fields"] 


if __name__ == "__main__":

    IMG_NAME = "joaco1"
    IMG_EXT = ".jpeg"

    img_path = os.path.join('resources', IMG_NAME + IMG_EXT)

    img = cv2.imread(img_path)

    print(extraerTexto(img))
