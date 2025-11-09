from rapidfuzz import process, fuzz
import re
from .text_utils import CONC_REGEX, PRESENT_REGEX, normalize_text

STRONG_MATCH_THRESHOLD = 85
MIN_TOKEN_LETTERS_FOR_NAME = 5

def classify_token(token, vadem):
    if not token:
        return token, None, None, 0, {k: (None, 0) for k in vadem.keys()}

    token_orig = token.strip()
    t = normalize_text(token_orig)
    t_no_nums = re.sub(r'^\d+\s*', '', t).strip()
    t_for_match = t_no_nums if t_no_nums else t

    is_conc = bool(CONC_REGEX.search(t))
    is_pres = bool(PRESENT_REGEX.search(t))

    per_category = {}
    for cat, vocab in vadem.items():
        if cat.startswith("_"):  # <-- evita usar los mapas y auxiliares
            continue

        if is_conc and cat != "concentracion":
            per_category[cat] = (None, 0)
            continue

        if cat == "_presentacion_nodigits":
            sample = re.sub(r'\d+', '', t_for_match).strip()
            m = process.extractOne(sample, vocab, scorer=fuzz.WRatio)
        else:
            m = process.extractOne(t_for_match, vocab, scorer=fuzz.WRatio)

        if m:
            # extractOne puede devolver (match, score) o (match, score, idx)
            match_val = m[0]
            score_val = m[1] if len(m) > 1 else 0

            # --- Length-based scaling ---
            token_letters = len(re.sub(r'[^A-Z]', '', t_for_match))
            match_letters = len(re.sub(r'[^A-Z]', '', match_val)) if match_val else 0

            if match_letters > 0 and isinstance(score_val, (int, float)):
                length_ratio = token_letters / match_letters
                # limitar factor entre 0.25 y 1.0
                scale = max(0.25, min(1.0, length_ratio))
                # penalización adicional para tokens muy cortos
                if token_letters < 4:
                    scale *= 0.6

                score_val = float(score_val) * scale
            else:
                # si no podemos calcular bien, garantizamos número
                score_val = float(score_val) if isinstance(score_val, (int, float)) else 0.0

            per_category[cat] = (match_val, score_val)
        else:
            per_category[cat] = (None, 0.0)

    # elegir la mejor categoría (per_category: cat -> (match, score))
    # max devuelve (best_cat, (best_match, best_score))
    best_cat, (best_match, best_score) = max(
        per_category.items(),
        key=lambda kv: kv[1][1]
    )

    # fallback a nombre comercial si todo es débil
    if not is_conc and not is_pres and (best_score is None or best_score < STRONG_MATCH_THRESHOLD):
        if re.search(r'[A-Z]{%d,}' % MIN_TOKEN_LETTERS_FOR_NAME, t_for_match):
            best_cat = 'nombre comercial'
            best_match = None

    return token_orig, best_cat, best_match, best_score, per_category
