"""Unwrap the label of the reference jar into a clean full-wrap texture + ORM map.

Gold ornament and stripes are lifted from the photo by local contrast; the base becomes a flat dark
colour, so the 3D lighting (not the photo) decides where the label shines.
Reference: F:/com/origo.life/reference/jar-reference-3d.webp
Out: prototype/hero-3d/assets/label.png (sRGB), label-orm.png (G=roughness, B=metalness)
"""
import numpy as np
from PIL import Image, ImageFilter

SRC = 'F:/com/origo.life/reference/jar-reference-3d.webp'
OUT = 'F:/com/origo.life/prototype/hero-3d/assets/'
CX, R = 426.5, 321.5           # jar axis and body radius in px
Y0, Y1 = 428, 1024             # label band rows
TH_MAX = np.deg2rad(72)        # how far around the visible front we trust the photo
FULL_W = 2048                  # texture width = full circumference
BASE = np.array([24, 16, 11], np.float32)        # dark label paper
GOLD_LO = np.array([120, 82, 38], np.float32)
GOLD_HI = np.array([246, 214, 150], np.float32)

img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
band = img[Y0:Y1]
h = band.shape[0]

# unwrap the visible front: uniform angle -> x = cx + R sin(theta)
front_w = int(round(FULL_W * (2 * TH_MAX) / (2 * np.pi)))
theta = np.linspace(-TH_MAX, TH_MAX, front_w)
xs = CX + R * np.sin(theta)
x0 = np.floor(xs).astype(int); fx = (xs - x0)[None, :, None]
front = band[:, x0] * (1 - fx) + band[:, np.minimum(x0 + 1, img.shape[1] - 1)] * fx

# gold = thin bright warm lines: luminance well above its blurred neighbourhood
lum = front @ np.array([0.3, 0.59, 0.11], np.float32)
lum_img = Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8))
local = np.asarray(lum_img.filter(ImageFilter.GaussianBlur(9))).astype(np.float32)
top = lum - local
warm = front[..., 0] - front[..., 2]
g = np.clip((top - 6) / 30, 0, 1) * np.clip((warm - 20) / 40, 0, 1)
g = np.maximum(g, np.clip((lum - 150) / 60, 0, 1) * np.clip((warm - 40) / 40, 0, 1))  # bright solid gold
g = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255

# gold tone from the photo's own brightness, normalised so edges are not darker than the centre
shade = np.clip((lum - 60) / 150, 0, 1)
gold_rgb = GOLD_LO[None, None] + (GOLD_HI - GOLD_LO)[None, None] * shade[..., None]
front_clean = BASE[None, None] * (1 - g[..., None]) + gold_rgb * g[..., None]

# stripes continue around the back: rows where the front is mostly gold across its width
row_gold = g[:, int(front_w * 0.1):int(front_w * 0.9)].mean(1)
stripe = np.clip((row_gold - 0.35) / 0.3, 0, 1)
band_rows = np.zeros(h, bool); band_rows[:70] = True; band_rows[-70:] = True  # only the edge stripes wrap around
stripe = stripe * band_rows
back_rgb = BASE[None] * (1 - stripe[:, None]) + (GOLD_LO * 0.4 + GOLD_HI * 0.6)[None] * stripe[:, None]

full = np.repeat(back_rgb[:, None, :], FULL_W, axis=1)
full_g = np.repeat(stripe[:, None], FULL_W, axis=1)
start = (FULL_W - front_w) // 2
ramp = int(front_w * 0.06)
w = np.ones(front_w, np.float32)
w[:ramp] = np.linspace(0, 1, ramp); w[-ramp:] = np.linspace(1, 0, ramp)
full[:, start:start + front_w] = front_clean * w[None, :, None] + full[:, start:start + front_w] * (1 - w[None, :, None])
full_g[:, start:start + front_w] = g * w[None] + full_g[:, start:start + front_w] * (1 - w[None])

Image.fromarray(np.clip(full, 0, 255).astype(np.uint8)).save(OUT + 'label.png')
rough = 0.66 - 0.36 * full_g
orm = np.dstack([np.ones_like(rough), rough, full_g]) * 255
Image.fromarray(orm.astype(np.uint8)).save(OUT + 'label-orm.png')
print('label', FULL_W, h, 'front_w', front_w, 'gold share %.3f' % full_g.mean(), 'stripe rows', int((stripe > 0.5).sum()))
