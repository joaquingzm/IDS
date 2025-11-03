#from services.roi import roi_detection
#from services.ocr import infer_trOCR
from services.post import classify_token, get_vademecum
import cv2
import os
import pandas as pd

IMG_NAME = "blas3"
IMG_EXTENSION = ".jpeg"
WANTS_IMG = False

"""
imgs = roi_detection(IMG_NAME, IMG_EXTENSION, WANTS_IMG)

for i, img in enumerate(imgs):
    print(f"Texto {i}: {infer_trOCR(img)}")
"""
vademecum = get_vademecum()
palabra = "Ibuprofeno"
threshold = 50
res = classify_token(palabra,vademecum,threshold)
for i in res :
    print (i)

