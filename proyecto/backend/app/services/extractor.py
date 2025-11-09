import re
from rapidfuzz import process, fuzz

from services.text_utils import (
    CONC_REGEX,
    PRESENT_WORDS,
    UNIT_FIXES,
    UNITS,
    STOP_TOKENS,
    normalize_text,
)
from services.token_classifier import classify_token


# ---- parámetros locales (ajustables) ----
WINDOW_K = 3
TOKEN_LOW_THRESHOLD = 70
TOKEN_HIGH_THRESHOLD = 90
MIN_WINDOW_SCORE = 1.0
MIN_TOKEN_LEN = 3
MIN_TOKEN_LEN_FOR_MATCH = 4
MIN_NGRAM_TOKENS_FOR_NAME = 2

# scoring thresholds / weights
NAME_STRONG, NAME_WEAK = 92, 80
PRES_STRONG, CONC_STRONG = 88, 95
W_NAME_STRONG, W_NAME_WEAK = 3.0, 1.2
W_PRES, W_CONC, W_LONG_TOKEN = 2.0, 2.0, 0.6
W_STOP_TOK_PEN, W_SHORT_TOKEN_PEN, W_NUMERIC_PEN = -1.5,-0.8 ,-1.0 ,



def normalize_line(s: str) -> str:
    if not s:
        return ""
    s = normalize_text(s)
    for wrong, right in UNIT_FIXES.items():
        if wrong in s:
            s = s.replace(wrong, right)
    s = re.sub(r'[^A-Z0-9 %]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def line_is_mostly_numeric(line):
    toks = [t for t in line.split() if t]
    if not toks:
        return False
    num_like = sum(1 for t in toks if re.fullmatch(r'[\d/:\-.,]+', t))
    return (num_like / len(toks)) >= 0.6

def score_line(line, vadem, ocr_conf=1.0):

    score = 0.0
    tokens = [t for t in line.split() if t]

    # premiar tokens largos
    long_tokens = [t for t in tokens if len(re.sub(r'[^A-Z]', '', t)) >= MIN_TOKEN_LEN]
    score += W_LONG_TOKEN * len(long_tokens)

    # penalizar tokens demasiado cortos (ruido)
    short_tokens = [t for t in tokens
                if len(re.sub(r'[^A-Z]', '', t)) < MIN_TOKEN_LEN and t not in STOP_TOKENS]
    score += W_SHORT_TOKEN_PEN * len(short_tokens)



    stop_count = sum(1 for t in tokens if t in STOP_TOKENS)
    if stop_count > 2:
        score += W_STOP_TOK_PEN  # penalización adicional para líneas claramente de header/dirección

    # concentration (regex)
    conc_regex_match = CONC_REGEX.search(line)
    if conc_regex_match:
        score += W_CONC  # evidencia por regex
    else:
        # fallback fuzzy sobre vocabulario de concentraciones (si existe)
        conc_list = vadem.get("concentracion", [])
        if conc_list:
            best_conc_score = 0
            for t in tokens:
                m = process.extractOne(t, conc_list, scorer=fuzz.WRatio)
                if m and m[1] > best_conc_score:
                    best_conc_score = m[1]
            if best_conc_score >= CONC_STRONG:
                score += W_CONC * 0.9

    # presentation evidence (keywords + fuzzy)
    if any(p in line for p in PRESENT_WORDS):
        score += W_PRES
    else:
        pres_list = vadem.get("presentacion", []) + vadem.get("_presentacion_nodigits", [])
        if pres_list:
            # check tokens for fuzzy match
            for t in tokens:
                m = process.extractOne(t, pres_list, scorer=fuzz.token_set_ratio)
                if m and m[1] >= PRES_STRONG:
                    score += W_PRES
                    break

    # name evidence: per-token fuzzy against combined names
    name_list = vadem.get("nombre generico", []) + vadem.get("nombre comercial", [])
    strong_count = 0
    weak_count = 0
    for t in tokens:
        if len(t) < MIN_TOKEN_LEN:
            continue
        m = process.extractOne(t, name_list, scorer=fuzz.WRatio)
        if m:
            if m[1] >= NAME_STRONG:
                strong_count += 1
            elif m[1] >= NAME_WEAK:
                weak_count += 1
    score += strong_count * W_NAME_STRONG + weak_count * W_NAME_WEAK

    # penalizar si la línea es mayormente numérica (fechas, folios)
    if line_is_mostly_numeric(line):
        score += W_NUMERIC_PEN

    # mezclar con confianza del OCR (0..1) pero no anular evidencia
    score = score * max(0.5, ocr_conf)

    return score


def find_best_window(norm_lines, vadem, ocr_confs=None, window_k=WINDOW_K):
    n = len(norm_lines)
    if n == 0:
        return 0, -1, []
    
    # compute per-line scores and also name evidence flags
    line_scores = []
    line_name_flags = []  # True if line has any token with fuzzy >= NAME_WEAK
    name_list = vadem.get("nombre generico", []) + vadem.get("nombre comercial", [])
    
    for idx, ln in enumerate(norm_lines):
        conf = ocr_confs[idx] if ocr_confs and idx < len(ocr_confs) else 1.0
        s = score_line(ln, vadem, ocr_conf=conf)
        line_scores.append(s)

        has_name = any(
            (process.extractOne(t, name_list, scorer=fuzz.WRatio) or (None, 0))[1] >= NAME_WEAK
            for t in ln.split() if len(t) >= MIN_TOKEN_LEN
        )
        line_name_flags.append(has_name)

    best_sum = -1
    best_pair = (0, -1)
    best_window = []

    # probar todas las ventanas de tamaños 1..window_k
    for k in range(1, min(window_k, n)+1):
        for i in range(0, n - k + 1):
            s = sum(line_scores[i:i+k])
            window_lines = norm_lines[i:i+k]
            contains_name = any(line_name_flags[i:i+k])
            wtxt = " ".join(window_lines)
            has_conc = bool(CONC_REGEX.search(wtxt))
            toks = [t for t in wtxt.split() if t]
            numeric_ratio = 0.0
            if toks:
                numeric_ratio = sum(1 for t in toks if re.fullmatch(r'[\d/:\-.,]+', t)) / len(toks)
            
            numeric_penalty = -1.5 if numeric_ratio > 0.6 else 0.0
            bonus = 1.5 if contains_name else 0.0
            total_score = s + bonus + numeric_penalty
           
            if total_score > best_sum:
                 # regla de aceptación: preferir ventanas con evidencia de nombre
                if (contains_name) or (has_conc and any(len(re.sub(r'[^A-Z]', '', t)) >= MIN_TOKEN_LEN for t in toks)):
                    best_sum = total_score
                    best_pair = (i, i+k-1)
                    best_window = window_lines
                else:
                    # si no hay evidencia, aceptar solo si el score es claramente alto
                    if total_score > max(MIN_WINDOW_SCORE, 2.0):
                        best_sum = total_score
                        best_pair = (i, i+k-1)
                        best_window = window_lines

    if not best_window:
        return 0, -1, []
    return best_pair[0], best_pair[1], best_window


def group_numbers(tokens: list) -> list:
    out = []
    i = 0
    while i < len(tokens):
        t_raw = tokens[i]
        t = re.sub(r',', '.', t_raw)
        # número seguido de unidad
        if re.match(r'^\d+(\.\d+)?$', t) and i + 1 < len(tokens):
            nxt = UNIT_FIXES.get(tokens[i + 1].upper(), tokens[i + 1].upper())
            if nxt in UNITS:
                out.append(f"{t} {nxt}")
                i += 2
                continue
        # token con número+unidad pegado
        m = re.match(r'^(\d+(?:[.,]\d+)?)([A-Z]+)$', t)
        if m:
            num, unit = m.groups()
            unit = UNIT_FIXES.get(unit, unit)
            if unit in UNITS:
                out.append(f"{num} {unit}")
                i += 1
                continue
        out.append(t)
        i += 1
    return out

def get_ngrams(tokens, max_n=3):
    n = len(tokens)
    for size in range(max_n, 0, -1):
        for i in range(0, n - size + 1):
            yield i, size, " ".join(tokens[i:i+size])


def window_has_alpha_token(window_lines):
    for ln in window_lines:
        for t in ln.split():
            if len(re.sub(r'[^A-Z]', '', t)) >= MIN_TOKEN_LEN:
                return True
    return False


def extract_fields_from_window(window_lines, raw_lines, vadem,
                               low_threshold=TOKEN_LOW_THRESHOLD, high_threshold=TOKEN_HIGH_THRESHOLD):
    text = " ".join(window_lines)
    concs = CONC_REGEX.findall(text)
    concentration = concs[0].strip().upper() if concs else None

    # si la ventana solo tiene números (ej: fecha/folio), descartamos la concentración detectada por regex
    if concentration and not window_has_alpha_token(window_lines):
        concentration = None

    # tokenizar (solo A-Z0-9 y %)
    tokens_raw = [t for t in re.sub(r'[^A-Z0-9 %]', ' ', text).split() if t]
    tokens = []
    for t in tokens_raw:
        if len(t) < MIN_TOKEN_LEN:
            if CONC_REGEX.match(t):
                tokens.append(t)
            else:
                continue
        else:
            tokens.append(t)
    tokens = group_numbers(tokens)

    # clasificación token a token
    classified = []
    for tok in tokens:
        token_orig, best_cat, best_match, best_score, per_category = classify_token(tok, vadem)
        classified.append({
            "token": token_orig,
            "best_category_low": best_cat if best_score >= low_threshold else None,
            "best_match_low": best_match if best_score >= low_threshold else None,
            "best_score_low": best_score,
            "per_category": per_category
        })

    # ngram search para nombres (priorizar ngram > 1)
    name_match = None
    name_cat = None
    combined_names = vadem.get("nombre generico", []) + vadem.get("nombre comercial", [])
    for i, size, ngram in get_ngrams(tokens, max_n=3):
        if not combined_names:
            continue
        if size < MIN_NGRAM_TOKENS_FOR_NAME and len(ngram) < 6:
            m = process.extractOne(ngram, combined_names, scorer=fuzz.WRatio)
            if not (m and m[1] >= 95):
                continue
        m = process.extractOne(ngram, combined_names, scorer=fuzz.WRatio)
        if m and m[1] >= high_threshold:
            matched = m[0]
            name_cat = "nombre generico" if matched in vadem.get("nombre generico", []) else "nombre comercial"
            name_match = {"matched": matched, "score": m[1], "ngram": ngram, "range": (i, i+size-1)}
            break

    # presentación: keywords o fuzzy (preservando números si ya vienen en token)
    presentation = None
    for t in tokens:
        for p in PRESENT_WORDS:
            if p in t:
                # si token contiene dígito lo preservamos ("40 CAPSULAS")
                if re.search(r'\d', t):
                    presentation = t
                else:
                    if "TAB" in t or "TABS" in t:
                        presentation = "TABLETAS"
                    elif "COMPRIMID" in t:
                        presentation = "COMPRIMIDOS"
                    elif "CAPSUL" in t:
                        presentation = "CÁPSULAS"
                    else:
                        presentation = t
                break
        if presentation:
            break

    if not presentation:
        pres_list = vadem.get("presentacion", [])
        if pres_list:
            m = process.extractOne(" ".join(tokens[:4]), pres_list, scorer=fuzz.token_set_ratio)
            if m and m[1] >= high_threshold:
                presentation = m[0]

    # fallback búsqueda de concentración por fuzzy si no hubo regex
    if not concentration:
        conc_list = vadem.get("concentracion", [])
        if conc_list:
            m = process.extractOne(" ".join(tokens), conc_list, scorer=fuzz.WRatio)
            if m and m[1] >= high_threshold:
                concentration = m[0].upper()

    # armado del resultado corregido
    corrected = {
        "nombre_generico": None,
        "nombre_comercial": None,
        "concentracion": concentration,
        "presentacion": presentation
    }

    # si encontramos ngram fuerte lo usamos como corrección
    if name_match:
        corrected_field_value = name_match["matched"]
        if name_cat == "nombre generico":
            corrected["nombre_generico"] = corrected_field_value
        else:
            corrected["nombre_comercial"] = corrected_field_value

    # si no hubo ngram, intentar por tokens individuales con umbral alto
    if not corrected["nombre_comercial"] and not corrected["nombre_generico"]:
        for item in classified:
            if item["best_category_low"] in ["nombre comercial", "nombre generico"] and item["best_score_low"] >= high_threshold:
                field = "nombre_generico" if item["best_category_low"] == "nombre generico" else "nombre_comercial"
                corrected[field] = item["best_match_low"]

    # construir texto para matching pero ignorar tokens muy cortos (ruido)
    filtered_tokens_for_window = [t for t in tokens if len(re.sub(r'[^A-Z]', '', t)) >= MIN_TOKEN_LEN]
    window_text_for_name = " ".join(filtered_tokens_for_window).strip()

    if window_text_for_name and combined_names:
        m = process.extractOne(window_text_for_name, combined_names, scorer=fuzz.WRatio)
        if m:
            matched_val = m[0]
            matched_score = m[1] if len(m) > 1 else 0

           
            strong_threshold = max(NAME_STRONG, high_threshold)
            if matched_score >= strong_threshold:
                # decidir si es genérico o comercial por pertenencia a listas
                if matched_val in vadem.get("nombre generico", []):
                    corrected["nombre_generico"] = matched_val
                else:
                    corrected["nombre_comercial"] = matched_val

    # si se detectó un nombre comercial, completar el genérico asociado
    if corrected["nombre_comercial"] and not corrected["nombre_generico"]:
        vmap = vadem.get("_map", {})
        gen = vmap.get(normalize_text(corrected["nombre_comercial"]))
        if gen:
            corrected["nombre_generico"] = gen

    return {
        "selected_lines": window_lines,
        "raw_lines": raw_lines,
        "classified_tokens": classified,
        "corrected_fields": corrected
    }



# ----- DEBUG -----

if __name__ == "__main__":

    from services.vademecum_loader import get_vademecum
    from services.ocr_service import extract_text_from_image

    IMG_NAME, IMG_EXTENSION = "receta3", ".jpeg"
    ocr_tuples = extract_text_from_image(IMG_NAME, IMG_EXTENSION)  
    palabras_ocr = [t for t,_ in ocr_tuples]
    ocr_confs = [c for _,c in ocr_tuples]
    norm_lines = [normalize_line(ln) for ln in palabras_ocr]
    vadem = get_vademecum()

  
    start, end, window = find_best_window(norm_lines, vadem, ocr_confs=ocr_confs)
    raw_window_lines = palabras_ocr[start:end + 1] if start <= end else []
    extracted = extract_fields_from_window(window, raw_window_lines, vadem)

    print("\n LINEAS LEIDAS: ")
    i = 0
    for t in norm_lines:
        i=i+1
        print(f" Linea{i}: {t}")

    print("\nFINAL RESULT: ")

    print("\n Windows lines:")
    for t in extracted["selected_lines"]:
        print(f" • Linea: {t}")

    print("\n Raw lines:")
    for t in extracted["raw_lines"]:
        print(f" • Linea: {t}")

    print("\nCampos corregidos:")
    for k, v in extracted["corrected_fields"].items():
        print(f" • {k}: {v}")

    print("\nTokens clasificados:")
    for t in extracted["classified_tokens"]:
        print(f"  • {t['token']} → {t['best_category_low']} ({t['best_score_low']:.1f}) - Best match: {t['best_match_low']}")

