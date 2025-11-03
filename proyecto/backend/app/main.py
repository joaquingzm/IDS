from services.roi import roi_detection
from services.ocr import infer_trOCR
import cv2

IMG_NAME = "blas3"
IMG_EXTENSION = ".jpeg"
WANTS_IMG = False

imgs = roi_detection(IMG_NAME, IMG_EXTENSION, WANTS_IMG)

for i, img in enumerate(imgs):
    print(f"Texto {i}: {infer_trOCR(img)}")

