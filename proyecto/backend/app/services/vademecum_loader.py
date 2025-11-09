import os
import pandas as pd
from .text_utils import normalize_text


def get_vademecum():
    path = os.path.join('resources', 'vademecum.csv')
    df = pd.read_csv(path, sep=",", dtype=str).fillna("")

    def col_to_list(col):
        return [normalize_text(x) for x in df[col].dropna().tolist() if str(x).strip()]

     # Mapeos para resolver relaciones directas
    vadem_map = {
        normalize_text(row["NOMBRE COMERCIAL"]): normalize_text(row["NOMBRE GENERICO"])
        for _, row in df.iterrows()
        if row["NOMBRE COMERCIAL"] and row["NOMBRE GENERICO"]
    }

    vadem_map_inverse = {
        normalize_text(row["NOMBRE GENERICO"]): [
            normalize_text(x) for x in df.loc[df["NOMBRE GENERICO"] == row["NOMBRE GENERICO"], "NOMBRE COMERCIAL"].tolist()
        ]
        for _, row in df.iterrows()
        if row["NOMBRE GENERICO"]
    }

    vademecum_dict = {
        "nombre comercial": col_to_list("NOMBRE COMERCIAL"),
        "nombre generico": col_to_list("NOMBRE GENERICO"),
        "presentacion": col_to_list("PRESENTACIÓN"),
        "concentracion": col_to_list("CONCENTRACIÓN"),
        "_map": vadem_map,
        "_map_inverse": vadem_map_inverse
    }

   # auxiliar sin dígitos
    vademecum_dict["_presentacion_nodigits"] = [
        ''.join([c for c in p if not c.isdigit()]).strip()
        for p in vademecum_dict["presentacion"]
    ]
    return vademecum_dict