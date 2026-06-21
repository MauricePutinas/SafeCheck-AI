from PIL import Image
import os

frames = [f"scripts/frames/f{i}.png" for i in range(6)]
frames = [f for f in frames if os.path.exists(f)]
durations = [1100, 1500, 2200, 1600, 1600, 2400][: len(frames)]

W = 880  # Zielbreite fuer README (kompakte Dateigroesse)
imgs = []
for f in frames:
    im = Image.open(f).convert("RGB")
    h = int(im.height * W / im.width)
    im = im.resize((W, h), Image.LANCZOS)
    # Adaptive Palette je Frame -> gute Qualitaet bei UI + Verlauf
    imgs.append(im.convert("P", palette=Image.ADAPTIVE, colors=256))

out = "docs/demo.gif"
imgs[0].save(
    out,
    save_all=True,
    append_images=imgs[1:],
    duration=durations,
    loop=0,
    optimize=True,
    disposal=2,
)
size = os.path.getsize(out)
print(f"GIF: {out}  frames={len(imgs)}  {W}px  {size/1024:.0f} KB")
