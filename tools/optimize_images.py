"""Generate responsive WebP assets from original photographs. Run: python tools/optimize_images.py"""
import base64
import json
import re
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'images' / 'optimized'
SOURCES = [ROOT / 'images/self.jpg', *sorted((ROOT / 'images/Japan-trip').glob('*.jpg')), *sorted((ROOT / 'images/EU-trip').glob('*.jpg'))]
manifest = {}
for source in SOURCES:
    relative = source.relative_to(ROOT).as_posix()
    folder = DEST / source.parent.name if source.parent.name != 'images' else DEST
    folder.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        variants = []
        for width in (480, 960, 1600):
            actual = min(width, image.width)
            if any(v['width'] == actual for v in variants):
                continue
            resized = image.resize((actual, round(image.height * actual / image.width)), Image.Resampling.LANCZOS)
            target = folder / f'{source.stem}-{actual}.webp'
            resized.save(target, 'WEBP', quality=81, method=6)
            variants.append({'src': target.relative_to(ROOT).as_posix(), 'width': actual, 'height': resized.height, 'bytes': target.stat().st_size})
        manifest[relative] = variants
(ROOT / 'images/optimized/manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
used = [k for k in manifest if not k.endswith(('stockholm1.jpg', '1b80cae8af1103a39db8a3bcd5db8da6.jpg'))]
print(json.dumps({'photos':len(manifest), 'original_bytes':sum((ROOT/k).stat().st_size for k in used), 'desktop_bytes':sum(manifest[k][-1]['bytes'] for k in used), 'mobile_bytes':sum(manifest[k][0]['bytes'] for k in used)}, indent=2))

# Keep the tiny, immediately visible gallery previews in sync with the photographs.
page = ROOT / 'life.html'
if page.exists():
    def update_preview(match):
        tag = match.group(0)
        full = re.search(r'data-full="([^"]+)"', tag)
        if not full:
            return tag
        with Image.open(ROOT / full.group(1)) as preview:
            preview.thumbnail((48, 48))
            buffer = BytesIO()
            preview.save(buffer, 'WEBP', quality=35, method=6)
        value = '--photo-preview: url(data:image/webp;base64,' + base64.b64encode(buffer.getvalue()).decode() + ')'
        if '--photo-preview:' in tag:
            return re.sub(r'--photo-preview:\s*url\([^)]*\)', lambda _: value, tag)
        if 'style="' in tag:
            return tag.replace('style="', 'style="' + value + '; ', 1)
        return tag[:-1] + ' style="' + value + '">'
    markup = page.read_text(encoding='utf-8')
    markup = re.sub(r'<button\b(?=[^>]*\bclass="photo-button")[^>]*>', update_preview, markup)
    page.write_text(markup, encoding='utf-8')
