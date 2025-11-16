from services.ocr_service import extract_text_from_image
from services.vademecum_loader import get_vademecum
from services.extractor import find_best_window, extract_fields_from_window, normalize_line
import cv2
import os

def extraerTexto(img):

    candidate_threshold = 80.0

    ocr_tuples = extract_text_from_image(img) 
    palabras_ocr = [t for t,_ in ocr_tuples]
    ocr_confs = [c for _,c in ocr_tuples]
    norm_lines = [normalize_line(ln) for ln in palabras_ocr]
    vadem = get_vademecum()

    start, end, window = find_best_window(norm_lines, vadem, ocr_confs=ocr_confs)
    raw_window_lines = palabras_ocr[start:end + 1] if start <= end else []
    result = extract_fields_from_window(window, raw_window_lines, vadem)

    classified = result.get("classified_tokens", [])

    # contenedor para el mejor candidato por categoría: {categoria: (score, value)}
    best_by_cat = {
        "nombre_comercial": None,
        "nombre_generico": None,
        "concentracion": None,
        "presentacion": None
    }

    # 1) recolectar a partir de classified tokens (mismo comportamiento que tenías)
    for item in classified:
        token = item["token"]
        best_score = item.get("best_score_low", 0)
        best_cat = item.get("best_category_low")
        best_match = item.get("best_match_low")

        if not best_cat:
            continue

        # filtrar por umbral de candidato
        if best_score < candidate_threshold:
            continue

        cat_l = best_cat.lower()

        if "comercial" in cat_l:
            key = "nombre_comercial"
        elif "generico" in cat_l or "genérico" in cat_l:
            key = "nombre_generico"
        elif "concentr" in cat_l:
            key = "concentracion"
        elif "present" in cat_l or "presentacion" in cat_l or "presentación" in cat_l:
            key = "presentacion"
        else:
            continue

        value = best_match if best_match else token
        if isinstance(value, str):
            value = value.strip() or None

        prev = best_by_cat.get(key)
        if prev is None or (best_score > prev[0]):
            best_by_cat[key] = (best_score, value)

    # 2) complementar con corrected_fields (si existen) y no hay ya un candidato mejor
    corrected_fields = result.get("corrected_fields", {}) or {}
    for key in ("nombre_generico", "nombre_comercial", "concentracion", "presentacion"):
        val = corrected_fields.get(key)
        if val:
            # si ya hay algo, lo respetamos sólo si el score existente es menor que este "100" artificial
            prev = best_by_cat.get(key)
            if prev is None:
                best_by_cat[key] = (100.0, val)   # score alto artificial para favorecer esta detección
            else:
                # opcional: si prev tiene score < 100, mantenemos el más alto
                if prev[0] < 100.0:
                    best_by_cat[key] = (100.0, val)

    # convertir a la forma final (solo valores)
    corrected = {k: (v[1] if v else None) for k, v in best_by_cat.items()}

    return corrected


if __name__ == "__main__":

    IMG_NAME = "receta7"
    IMG_EXT = ".jpeg"

    img_path = os.path.join('resources', IMG_NAME + IMG_EXT)

    img = cv2.imread(img_path)

    print(extraerTexto(img))
