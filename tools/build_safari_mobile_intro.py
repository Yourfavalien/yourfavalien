from pathlib import Path
from PIL import Image


source = Path("assets/yfa-intro-mobile.webp")
destination = Path("assets/yfa-intro-mobile-safari.webp")
frame_count = 16

with Image.open(source) as animation:
    final_index = animation.n_frames - 1
    indexes = [round(position * final_index / (frame_count - 1)) for position in range(frame_count)]
    frames = []
    for index in indexes:
        animation.seek(index)
        frames.append(animation.convert("RGB").copy())

frames[0].save(
    destination,
    format="WEBP",
    save_all=True,
    append_images=frames[1:],
    duration=[100] * frame_count,
    loop=0,
    quality=86,
    method=4,
)

print(f"Created {destination}: {frame_count} phone frames, 1.6 seconds total")
