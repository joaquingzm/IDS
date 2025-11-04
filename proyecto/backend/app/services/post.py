import os
import re
import unicodedata
from rapidfuzz import process, fuzz
import pandas as pd

def get_vademecum ():
    # Cargar CSV separado por comas
    vademecum_path = os.path.join('resources', 'vademecum.csv')
    vademecum_df = pd.read_csv(vademecum_path, sep=",", dtype=str).fillna("")
    vademecum_dict = {
        "nombre comercial": vademecum_df["NOMBRE COMERCIAL"].dropna().tolist(),
        "nombre generico": vademecum_df["NOMBRE GENERICO"].dropna().tolist(),
        "presentacion": vademecum_df["PRESENTACIÓN"].dropna().tolist(),
        "concentracion": vademecum_df["CONCENTRACIÓN"].dropna().tolist()
    }
    return vademecum_dict


#CLASIFICACION: NOMBRES, DOSIS/CONCENTRACION, PRESENTACION

def classify_token(token, vademecum_dict, threshold):
    best_class = None
    best_match = None
    best_score = 0
    for category, terms in vademecum_dict.items():
        match = process.extractOne(
            token,
            terms,
            scorer=fuzz.ratio
        )
        print(match)
        if match and match[1] > best_score and match[1] >= threshold:
            best_class = category
            best_match = match[0]
            best_score = match[1]
    return best_class, best_match, best_score

