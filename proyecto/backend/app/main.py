from services.roi_detection import roi_detection
from services.text_detection import text_detection

IMG_NAME = "receta1"
IMG_EXTENSION = ".jpeg"
WANTS_IMG = False

imgs = roi_detection(IMG_NAME, IMG_EXTENSION, WANTS_IMG)
for img in imgs:
    print(text_detection)
