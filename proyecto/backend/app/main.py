from services.ocr_service import extract_text_from_image
from services.vademecum_loader import get_vademecum
from services.extractor import find_best_window, extract_fields_from_window, normalize_line



def extraerTexto(IMG_NAME:str , IMG_EXT:str):
    ocr_tuples = extract_text_from_image(IMG_NAME, IMG_EXT) 
    palabras_ocr = [t for t,_ in ocr_tuples]
    ocr_confs = [c for _,c in ocr_tuples]
    norm_lines = [normalize_line(ln) for ln in palabras_ocr]
    vadem = get_vademecum()

  
    start, end, window = find_best_window(norm_lines, vadem, ocr_confs=ocr_confs)
    raw_window_lines = palabras_ocr[start:end + 1] if start <= end else []
    result = extract_fields_from_window(window, raw_window_lines, vadem)

    print("\nCampos corregidos:")
    for k, v in result["corrected_fields"].items():
        print(f" • {k}: {v}")
    
    return result["corrected_fields"] 


if __name__ == "__main__":

    IMG_NAME = "joaco3"
    IMG_EXT = ".jpeg"

    print(extraerTexto(IMG_NAME, IMG_EXT))
