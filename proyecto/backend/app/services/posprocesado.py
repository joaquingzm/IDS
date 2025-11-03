from rapidfuzz import process, fuzz

# --- 1. Definir vademécum ---
vademecum = [
    "ibuprofeno", "paracetamol", "amoxicilina",
    "omeprazol", "diclofenac", "azitromicina"
]

# --- 2. Texto OCRizado ---
ocr_text = "Ibuprofemo 600 mg cada 8h y para dolor Paracetmol"

# --- 3. Función de corrección ---
def correct_text_with_vademecum(ocr_text, vademecum, threshold=75):
    words = ocr_text.split()  # tokenizamos por espacios
    corrected_words = []

    for word in words:
        # buscar la palabra más parecida en el vademécum
        match = process.extractOne(word, vademecum, scorer=fuzz.ratio)
        if match:
            matched_word, score, _ = match  # score = 0..100
            if score >= threshold:
                corrected_words.append(matched_word)  # reemplazar
            else:
                corrected_words.append(word)  # mantener original
        else:
            corrected_words.append(word)  # mantener original si no hay match

    return " ".join(corrected_words)

# --- 4. Aplicar ---
corrected_text = correct_text_with_vademecum(ocr_text, vademecum)
print("OCR original:", ocr_text)
print("Corregido   :", corrected_text)
