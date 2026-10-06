#!/usr/bin/env python3
"""Shape Persian text with HarfBuzz and export glyph outlines for animation.

Why: per-letter animation in a browser needs each letter in its own box, and boxes
break Persian joining. Shaping ahead of time gives every glyph in its correct joined
form, at its exact position, as SVG path data. Each glyph is also split into its body
and its dots (nuqta), and tagged with the connected letter group it belongs to, so a
sketch can animate bodies, dots and groups separately without breaking the script.

Output (JSON, font units, y up, pen starting at x=0 on the left):
  {"t": text, "w": width, "upem": 2048, "asc": .., "desc": ..,
   "g": [[x, y, advance, cluster, body_d, [dot_d...], [dot_bbox...], group], ...]}
Glyphs are in visual order (left to right); index 0 is the leftmost glyph.

usage:
  python3 shape_persian.py FONT.ttf "کارگردان موشن فارسی" [--wght 800] [--name title]
  python3 shape_persian.py FONT.ttf --lines lines.txt --js glyphs.js   # many lines -> one JS module
needs: pip install uharfbuzz fonttools
"""
import argparse
import json
import sys

import uharfbuzz as hb
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.pointInsidePen import PointInsidePen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.roundingPen import RoundingPen
from fontTools.pens.svgPathPen import SVGPathPen

# Joining classes for the letters Persian uses (Unicode ArabicShaping.txt).
RIGHT_JOINING = set("اآأإدذرزژوؤةۀ")
DUAL_JOINING = set("بپتثجچحخسشصضطظعغفقکگلمنهیئيكـ")
MARKS = set(chr(c) for c in range(0x064B, 0x0660)) | {"ٰ"}


def groups_of(text):
    """Index of the connected letter group (piece of a word) for every character.
    A new group starts after any character that cannot join to the next one."""
    out, g = [], 0
    for i, ch in enumerate(text):
        out.append(g)
        if ch in MARKS:
            continue
        nxt = next((c for c in text[i + 1:] if c not in MARKS), "")
        joins = ch in DUAL_JOINING and (nxt in DUAL_JOINING or nxt in RIGHT_JOINING)
        if not joins:
            g += 1
    return out


def contours(rec):
    out, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def replay(ops, pen):
    for op, args in ops:
        getattr(pen, op)(*args)


def touches(a_ops, b_ops):
    for _, args in a_ops:
        if not args:
            continue
        pen = PointInsidePen(None, args[-1], evenOdd=True)
        replay(b_ops, pen)
        if pen.getResult():
            return True
    return False


def shape(font_path, text, wght=800):
    blob = hb.Blob.from_file_path(font_path)
    face = hb.Face(blob)
    font = hb.Font(face)
    try:
        font.set_variations({"wght": wght})   # ignored by static fonts
    except Exception:
        pass
    buf = hb.Buffer()
    buf.add_str(text)
    buf.direction = "rtl"
    buf.script = "Arab"
    buf.language = "fa"
    hb.shape(font, buf, {"kern": True, "liga": True})
    upem = face.upem
    ext = font.get_font_extents("ltr")
    grp = groups_of(text)
    glyphs, x = [], 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        rec = RecordingPen()
        font.draw_glyph_with_pen(info.codepoint, rec)
        cs = contours(rec)
        parts = []
        for c in cs:
            ap, bp = AreaPen(), BoundsPen(None)
            replay(c, ap)
            replay(c, bp)
            sp = SVGPathPen(None)
            replay(c, RoundingPen(sp))
            parts.append({"d": sp.getCommands(), "area": ap.value, "b": [round(v) for v in bp.bounds], "ops": c})
        small = [max(p["b"][2] - p["b"][0], p["b"][3] - p["b"][1]) < 0.2 * upem and abs(p["area"]) < 0.025 * upem * upem for p in parts]
        dots, body = [], []
        for i, p in enumerate(parts):
            isolated = not any(not small[j] and (touches(p["ops"], parts[j]["ops"]) or touches(parts[j]["ops"], p["ops"]))
                               for j in range(len(parts)) if j != i)
            if small[i] and isolated and not all(small):
                dots.append(p)
            else:
                body.append(p)
        glyphs.append([
            x + pos.x_offset, pos.y_offset, pos.x_advance, info.cluster,
            " ".join(p["d"] for p in body), [p["d"] for p in dots], [p["b"] for p in dots],
            grp[info.cluster] if info.cluster < len(grp) else -1,
        ])
        x += pos.x_advance
    return {"t": text, "w": x, "upem": upem, "asc": ext.ascender, "desc": ext.descender, "g": glyphs}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("font")
    ap.add_argument("text", nargs="?")
    ap.add_argument("--wght", type=float, default=800)
    ap.add_argument("--name", default="line")
    ap.add_argument("--lines", help="file with one 'name<TAB>text' or 'name<TAB>wght<TAB>text' per line")
    ap.add_argument("--js", help="write an ES module exporting GLYPHS instead of printing JSON")
    a = ap.parse_args()
    runs = {}
    if a.lines:
        for raw in open(a.lines, encoding="utf-8"):
            if raw.strip() and "\t" in raw:
                fields = raw.rstrip("\n").split("\t")
                if len(fields) == 3:
                    runs[fields[0]] = shape(a.font, fields[2], float(fields[1]))
                else:
                    runs[fields[0]] = shape(a.font, fields[1], a.wght)
    elif a.text:
        runs[a.name] = shape(a.font, a.text, a.wght)
    else:
        ap.error("give TEXT or --lines")
    if a.js:
        with open(a.js, "w", encoding="utf-8") as f:
            f.write("/* Generated by scripts/shape_persian.py. Do not edit by hand. */\nexport const GLYPHS = ")
            json.dump(runs, f, ensure_ascii=False, separators=(",", ":"))
            f.write(";\n")
    else:
        json.dump(runs, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
