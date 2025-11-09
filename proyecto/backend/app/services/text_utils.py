import re
import unidecode

CONC_REGEX = re.compile(r'\b\d+(?:[.,]\d+)?\s*(?:MG|G|ML|MCG|UI|%)\b', re.I)
PRESENT_REGEX = re.compile(r'\b(TAB|CAPS|COMP|SOL|AMP|CREM|SOBR|JAR|INYE|PARCH|UNGU)\w*', re.I)
PRESENT_WORDS = ["COMPRIMID","TAB","CAPSUL","BLISTER","SOBRE"]
UNITS = ["MG", "G", "ML", "MCG", "UI", "%"]
UNIT_FIXES = {
    'M6': 'MG', 'M0': 'MG', 'M G': 'MG', 'MGG': 'MG', 
    'MLL': 'ML', 'COPSULAS': 'CAPSULAS', 'COPSULOS': 'CAPSULAS'
}
STOP_TOKENS = {
    "DR", "DRA", "D", "SR", "SRA", "SRTA", "COL", "ESQ", "ESQUINA",
    "TEL", "TELEFONO", "CP", "C P", "COMPLETO", "FIRMA",
    "CEDULA", "PACIENTE", "FECHA", "PROXIMA", "HORA", "ANIO", "ANO",
    "NOMBRE", "MEDICO", "DOCTOR","CITA", "DIRECCION", "DIRECCIÓN"
}

def normalize_text(s: str) -> str:
    if not s:
        return ""
    s = unidecode.unidecode(str(s)).upper()
    s = re.sub(r'[\:\,\(\)\[\]\.\/\-]+', ' ', s)
    s = re.sub(r'[^A-Z0-9 %/]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s
