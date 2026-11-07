"""Derive PWA icons from existing approved native Tirak artwork."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'assets/images/icon.png').convert('RGB')
public = root / 'public'
for name, size in [('favicon-16.png',16),('favicon-32.png',32),('favicon-48.png',48),('favicon.png',32),('apple-touch-icon.png',180),('icon-96.png',96),('icon-192.png',192),('icon-512.png',512),('icon.png',512)]:
    source.resize((size,size),Image.Resampling.LANCZOS).save(public/name)
source.resize((48,48),Image.Resampling.LANCZOS).save(public/'favicon.ico',sizes=[(16,16),(32,32),(48,48)])
# Native artwork is an opaque full-bleed gradient with its essential Tirak
# mark centered within x=25..75%, y=26..72%. Its farthest essential corner
# lies inside radius 36% of the canvas, within the 40% maskable safe circle.
# Preserve the full gradient so platform masks never expose a square inset.
for size in (192,512):
    source.resize((size,size),Image.Resampling.LANCZOS).save(public/f'icon-maskable-{size}.png')
