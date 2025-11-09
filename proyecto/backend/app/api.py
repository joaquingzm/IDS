from services.ocr_service import extract_text_from_image
from services.vademecum_loader import get_vademecum
from services.extractor import find_best_window, extract_fields_from_window, normalize_line
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import cv2
import numpy as np

app = FastAPI()

# CORS: permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/ocr")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    pil_img = Image.open(io.BytesIO(contents)) #Pillow, se puede pasar a Numpy
    img = np.array(pil_img)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    resultado = extraerTexto(img) # Hay que decidir si texto plano o JSON
    return resultado