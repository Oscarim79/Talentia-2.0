"""Genera el wordmark de TALENTIA como SVG con trazados (sin depender de fuentes instaladas)."""
import io, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/public/brand"
BRICOLAGE = f"{ROOT}/node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2"
PLEX = f"{ROOT}/node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2"

def load(path, **axes):
    t = TTFont(path)
    if axes and 'fvar' in t:
        t = instancer.instantiateVariableFont(t, axes, inplace=False)
    t.flavor = None
    buf = io.BytesIO(); t.save(buf)
    return t, buf.getvalue()

def shape(ttf, blob, text, size, tracking=0.0):
    """Devuelve [(glyph_name, x, y)] en unidades de 'size' px y el ancho total."""
    face = hb.Face(blob); font = hb.Font(face)
    upem = ttf['head'].unitsPerEm
    font.scale = (upem, upem)
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(font, b, {"kern": True, "liga": True})
    gs = ttf.getGlyphSet(); order = ttf.getGlyphOrder()
    k = size / upem
    x = 0.0; out = []
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        name = order[info.codepoint]
        out.append((name, (x + pos.x_offset) * k, pos.y_offset * k))
        x += pos.x_advance + tracking * upem
    return out, (x - tracking * upem) * k, gs, k

def glyph_path(gs, name, k, dx, dy):
    pen = SVGPathPen(gs)
    # y invertida para SVG
    tp = TransformPen(pen, (k, 0, 0, -k, dx, dy))
    gs[name].draw(tp)
    return pen.getCommands()

def word_paths(ttf, blob, text, size, baseline_y, x0, tracking, fills):
    """fills: función índice->color."""
    glyphs, width, gs, k = shape(ttf, blob, text, size, tracking)
    paths = []
    for i, (name, gx, gy) in enumerate(glyphs):
        d = glyph_path(gs, name, k, x0 + gx, baseline_y - gy)
        if d:
            paths.append((fills(i), d))
    return paths, width

def svg(width, height, body, bg=None):
    bgrect = f'<rect width="{width}" height="{height}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" '
            f'width="{width:g}" height="{height:g}" role="img" aria-label="TALENTIA">\n'
            f'{bgrect}{body}</svg>\n')

def group(paths):
    # agrupa trazados consecutivos por color
    out = []; cur = None; buf = []
    for fill, d in paths:
        if fill != cur:
            if buf: out.append((cur, buf))
            cur, buf = fill, []
        buf.append(d)
    if buf: out.append((cur, buf))
    return ''.join(f'  <path fill="{f}" d="{" ".join(ds)}"/>\n' for f, ds in out)

# --- Tipografía principal: Bricolage Grotesque, peso 680, tamaño óptico grande
bri, bri_blob = load(BRICOLAGE, wght=680, opsz=96)
plex, plex_blob = load(PLEX)

TEXT = "talentia"
SIZE = 100            # px de la fuente en el SVG base
TRACK = -0.018        # tracking negativo (em) para un wordmark compacto
PAD = 12
SPLIT = 6             # "talent" | "ia"

def build(variant, with_tagline=False):
    palettes = {
        'color': dict(main='#0a4936', accent='#c99043', tag='#0c5b44', bg=None),
        'dark':  dict(main='#ffffff', accent='#d9ac60', tag='#addcc6', bg=None),
        'mono':  dict(main='currentColor', accent='currentColor', tag='currentColor', bg=None),
    }[variant]
    fills = lambda i: palettes['main'] if i < SPLIT else palettes['accent']
    # medir
    _, width, _, _ = shape(bri, bri_blob, TEXT, SIZE, TRACK)
    asc = 0.72 * SIZE; desc = 0.03 * SIZE   # 'talentia' no tiene descendentes; dejamos aire
    baseline = PAD + asc
    paths, _ = word_paths(bri, bri_blob, TEXT, SIZE, baseline, PAD, TRACK, fills)
    body = group(paths)
    H = baseline + desc + PAD
    W = width + 2 * PAD
    if with_tagline:
        TAG = "RECLUTAMIENTO CON IA"
        tsize = 13.5; ttrack = 0.2
        tpaths, twidth = word_paths(plex, plex_blob, TAG, tsize, baseline + 32, PAD + 4, ttrack, lambda i: palettes['tag'])
        body += group(tpaths)
        H = baseline + 32 + PAD
        W = max(W, twidth + 2 * PAD + 4)
    return svg(round(W, 1), round(H, 1), body, palettes['bg'])

files = {
    'talentia-logo.svg':         build('color'),
    'talentia-logo-dark.svg':    build('dark'),
    'talentia-logo-mono.svg':    build('mono'),
    'talentia-logo-tagline.svg': build('color', True),
    'talentia-logo-tagline-dark.svg': build('dark', True),
}
for name, content in files.items():
    with open(f"{OUT}/{name}", 'w') as f: f.write(content)
    print(name, len(content), 'bytes')
