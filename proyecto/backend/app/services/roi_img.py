import cv2
import os
import numpy as np

#   roi_img: guardar imagen con los poligonos graficados;

#   img: imagen a editar;
#   polys: lista de poligonos a graficar;
#   directory_name: nombre del directorio donde se guardara la imagen editada;

#   aux_img: imagen editada;
def roi_img (img, polys, directory_name) :
    aux_img = img.copy()
    for poly in polys:
        pts_draw = np.array(poly, dtype=np.int32).reshape((-1,1,2))
        cv2.polylines(aux_img, [pts_draw], isClosed=True, color=(0,255,0), thickness=1)
    cv2.imwrite(os.path.join(directory_name, "roi_boxes.png"), aux_img)
    return aux_img