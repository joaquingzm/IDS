import re
import unicodedata
from rapidfuzz import process, fuzz

# Normalización simple
def normalize(s):
    s = unicodedata.normalize("NFKD", s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    return s

# Regex para dosis/unidades
DOSE_RE = re.compile(r'\b\d+(?:[\.,]\d+)?\s*(mg|ml|ui|g|mcg|mcg|tab|comprimido|mg/ml|mg/kg|cc|ml)\b')
FREQ_RE = re.compile(r'\b(c\/\d+h|cada\s*\d+\s*(h|hs)|una\s*vez|dos\s*veces|x\s*día|por\s*dia)\b')

def is_dose_or_freq(token):
    return bool(DOSE_RE.search(token) or FREQ_RE.search(token))



# vademecum: lista de nombres canon (pre-normalizados)
vademecum_names = [normalize(n) for n in vademecum_df['name'].tolist()]

# matching para n-grams
def match_vademecum(tokens, max_ngram=4, score_cutoffs=(50,80,90)):
    """
    tokens: lista de tokens normalizados
    devuelve: lista de dicts con span, matched_name, score, action
    """
    results = []
    n = len(tokens)
    i = 0
    while i < n:
        matched = False
        # probar el mayor ngram posible primero
        for L in range(min(max_ngram, n-i), 0, -1):
            span = tokens[i:i+L]
            span_text = " ".join(span)
            if is_dose_or_freq(span_text):
                # marcar y avanzar
                results.append({'start':i,'end':i+L,'type':'DOSE/FREQ','text':span_text})
                i += L
                matched = True
                break
            # fuzzy match
            cand = process.extractOne(span_text, vademecum_names, scorer=fuzz.token_set_ratio)
            if cand:
                name, score, idx = cand
                if score >= score_cutoffs[2]:
                    action = 'CORRECT'
                elif score >= score_cutoffs[1]:
                    action = 'SUGGEST_REVIEW'
                elif score >= score_cutoffs[0]:
                    action = 'TAG_POSSIBLE'
                else:
                    action = None
                if action:
                    results.append({
                        'start': i, 'end': i+L, 'type':'DRUG',
                        'text': span_text, 'match': name, 'score': score, 'action': action
                    })
                    i += L
                    matched = True
                    break
        if not matched:
            # token sin match -> avanzar 1
            results.append({'start': i, 'end': i+1, 'type':'OTHER', 'text': tokens[i]})
            i += 1
    return results