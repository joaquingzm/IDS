import numpy as np

#   order_points: ordena 4 puntos en el orden: [tl, tr, br, bl]

#   pts: lista de 4 puntos a ordenar;

#   rect: lista de 4 puntos ordenados;

def order_points(pts):

    ordered_points = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    ordered_points[0] = pts[np.argmin(s)]
    ordered_points[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1).reshape(4,)
    ordered_points[1] = pts[np.argmin(diff)]
    ordered_points[3] = pts[np.argmax(diff)]

    return ordered_points