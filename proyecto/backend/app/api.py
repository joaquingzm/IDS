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

def procesarImagen(img):
    #PROCESAR OCR
    return

@app.post("/ocr")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)) #Pillow, se puede pasar a Numpy
    resultado = procesarImagen(img) # Hay que decidir si texto plano o JSON
    return resultado