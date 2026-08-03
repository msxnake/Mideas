#!/usr/bin/env python3
"""
Generador del PDF "Estudio Tecnico del Chip SCC de Konami".
ReportLab + A4. Contenido en scc_content.py.
"""
import os
import sys
import re
import hashlib

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Frame,
    HRFlowable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scc_content as C

# ============================================================================
# FUENTES (Windows)
# ============================================================================
FONTS_DIR = "C:/Windows/Fonts"

# Serif: Cambria (es .ttc, hay que usar subfontIndex). Fallback a Times.
def _try_register(name, path, subfontIndex=0):
    try:
        pdfmetrics.registerFont(TTFont(name, path, subfontIndex=subfontIndex))
        return True
    except Exception:
        return False

# Serif body: Cambria si carga, si no Times New Roman
def _reg_fallback(name, primary, fallback, subfontIndex=0):
    """Registrar fuente con primaria y fallback si la primaria falla."""
    for path, idx in [(primary, subfontIndex), (fallback, 0)]:
        if _try_register(name, path, subfontIndex=idx):
            return

_reg_fallback("Serif", f"{FONTS_DIR}/cambria.ttc", f"{FONTS_DIR}/times.ttf")
_reg_fallback("Serif-Bold", f"{FONTS_DIR}/cambriab.ttf", f"{FONTS_DIR}/timesbd.ttf")
_reg_fallback("Serif-Italic", f"{FONTS_DIR}/cambriai.ttf", f"{FONTS_DIR}/timesi.ttf")
registerFontFamily(
    "Serif", normal="Serif", bold="Serif-Bold", italic="Serif-Italic",
)

# Sans: Calibri
pdfmetrics.registerFont(TTFont("Sans", f"{FONTS_DIR}/calibri.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", f"{FONTS_DIR}/calibrib.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Italic", f"{FONTS_DIR}/calibrii.ttf"))
registerFontFamily(
    "Sans", normal="Sans", bold="Sans-Bold", italic="Sans-Italic",
)

# Mono: Consolas
pdfmetrics.registerFont(TTFont("Mono", f"{FONTS_DIR}/consola.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", f"{FONTS_DIR}/consolab.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Italic", f"{FONTS_DIR}/consolai.ttf"))
registerFontFamily(
    "Mono", normal="Mono", bold="Mono-Bold", italic="Mono-Italic",
)

BODY_FONT = "Serif"
BODY_BOLD = "Serif-Bold"
SANS_FONT = "Sans"
SANS_BOLD = "Sans-Bold"
MONO_FONT = "Mono"

# ============================================================================
# PALETA
# ============================================================================
PAGE_BG = colors.HexColor("#FBFBFA")
CARD_BG = colors.HexColor("#F5F4F0")
TABLE_STRIPE = colors.HexColor("#F2F0EB")
HEADER_FILL = colors.HexColor("#1E2A38")
COVER_BLOCK = colors.HexColor("#0E1A26")
BORDER = colors.HexColor("#C9C5B8")
ACCENT = colors.HexColor("#B8860B")
ACCENT_2 = colors.HexColor("#1E5A7A")
TEXT_PRIMARY = colors.HexColor("#1A1917")
TEXT_MUTED = colors.HexColor("#6B6862")
CODE_BG = colors.HexColor("#F4F2EC")
CODE_BORDER = colors.HexColor("#D7D2C4")

# ============================================================================
# ESCAPE XML SEGURO (sin bytes nulos)
# ============================================================================
# Tags simples permitidos en contenido
_ALLOWED_TAG_RE = re.compile(
    r"<(/?)(b|i|u|super|sub)(\s[^>]*)?/?>",
    re.IGNORECASE,
)
_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
_MONO_FONT_RE = re.compile(
    r"<font\s+face=['\"]?Mono['\"]?\>(.*?)</font>",
    re.DOTALL | re.IGNORECASE,
)
_KEEP_BLOCK_RE = re.compile(
    r'<font\s+name=["\'][^"\']+["\']>.*?</font>|<a\s+name=[^>]+>',
    re.DOTALL | re.IGNORECASE,
)


def _xml_escape(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def esc(t):
    """Escapar texto para ReportLab Paragraph preservando tags intencionales."""
    if not isinstance(t, str):
        t = str(t)
    # 1. Convertir <font face='Mono'>X</font> -> tag con nombre
    def _mono_sub(m):
        inner = _xml_escape(m.group(1))
        return f'<font name="{MONO_FONT}">{inner}</font>'
    t = _MONO_FONT_RE.sub(_mono_sub, t)
    # 2. Tokenizar: separar bloques a conservar del texto libre
    parts = []
    last = 0
    for m in _KEEP_BLOCK_RE.finditer(t):
        if m.start() > last:
            parts.append(("text", t[last:m.start()]))
        parts.append(("keep", m.group(0)))
        last = m.end()
    if last < len(t):
        parts.append(("text", t[last:]))
    if not parts:
        parts = [("text", t)]
    # 3. Procesar cada parte de texto: preservar tags permitidos, escapar resto
    out = []
    for kind, piece in parts:
        if kind == "keep":
            out.append(piece)
            continue
        sub_last = 0
        for m in _ALLOWED_TAG_RE.finditer(piece):
            if m.start() > sub_last:
                out.append(_xml_escape(piece[sub_last:m.start()]))
            out.append(m.group(0))
            sub_last = m.end()
        if sub_last < len(piece):
            out.append(_xml_escape(piece[sub_last:]))
        # <br/> ya esta cubierto por _ALLOWED_TAG_RE? no. Tratar aparte:
    result = "".join(out)
    # Restaurar cualquier <br/> que viniera escapado ya no aplica porque
    # _ALLOWED_TAG_RE no cubre br. Lo anadimos a continuacion reemplazando
    # en el texto plano antes del escape. Simplificamos: tratamos br aparte.
    return result


def esc_br(t):
    """Como esc() pero preservando tambien <br/>."""
    # Primero proteger <br/> reemplazandolo por marca textual unica
    marker = "@@BR@@"
    t2 = _BR_RE.sub(marker, t)
    return esc(t2).replace(marker, "<br/>")


# ============================================================================
# ESTILOS
# ============================================================================
def make_styles():
    s = getSampleStyleSheet()
    body = ParagraphStyle(
        "Body", parent=s["Normal"],
        fontName=BODY_FONT, fontSize=10.5, leading=15.5,
        alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
        spaceBefore=0, spaceAfter=6,
    )
    kicker = ParagraphStyle(
        "Kicker", parent=body,
        fontName=SANS_FONT, fontSize=8.5, leading=11,
        textColor=ACCENT, alignment=TA_LEFT,
        spaceBefore=0, spaceAfter=2,
    )
    h1 = ParagraphStyle(
        "H1", parent=s["Heading1"],
        fontName=SANS_BOLD, fontSize=22, leading=26,
        textColor=HEADER_FILL, alignment=TA_LEFT,
        spaceBefore=10, spaceAfter=2, keepWithNext=1,
    )
    h2 = ParagraphStyle(
        "H2", parent=s["Heading2"],
        fontName=SANS_BOLD, fontSize=14, leading=18,
        textColor=HEADER_FILL, alignment=TA_LEFT,
        spaceBefore=14, spaceAfter=4, keepWithNext=1,
    )
    h3 = ParagraphStyle(
        "H3", parent=s["Heading3"],
        fontName=BODY_BOLD, fontSize=11.5, leading=14,
        textColor=ACCENT_2, alignment=TA_LEFT,
        spaceBefore=8, spaceAfter=2, keepWithNext=1,
    )
    code_style = ParagraphStyle(
        "Code", parent=body,
        fontName=MONO_FONT, fontSize=8.2, leading=10.5,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT,
        spaceBefore=0, spaceAfter=0,
    )
    callout_style = ParagraphStyle(
        "Callout", parent=body,
        fontName=BODY_FONT, fontSize=10, leading=14,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT,
        leftIndent=10, rightIndent=10,
        spaceBefore=4, spaceAfter=4,
    )
    formula_style = ParagraphStyle(
        "Formula", parent=body,
        fontName=MONO_FONT, fontSize=11, leading=15,
        textColor=HEADER_FILL, alignment=TA_CENTER,
        spaceBefore=6, spaceAfter=6,
    )
    num_style = ParagraphStyle(
        "Num", parent=body,
        fontName=BODY_FONT, fontSize=10.5, leading=14.5,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT,
        leftIndent=22, firstLineIndent=-18,
        spaceBefore=2, spaceAfter=2,
    )
    bullet_style = ParagraphStyle(
        "Bullet", parent=body,
        fontName=BODY_FONT, fontSize=10, leading=14,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT,
        leftIndent=18, firstLineIndent=-12,
        spaceBefore=1, spaceAfter=2,
    )
    cell = ParagraphStyle(
        "Cell", parent=body,
        fontName=BODY_FONT, fontSize=9, leading=11.5,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT,
        spaceBefore=0, spaceAfter=0,
    )
    cell_center = ParagraphStyle(
        "CellCenter", parent=cell, alignment=TA_CENTER,
    )
    header_cell = ParagraphStyle(
        "HCell", parent=cell,
        fontName=SANS_BOLD, fontSize=9.5, leading=12,
        textColor=colors.white, alignment=TA_LEFT,
    )
    header_cell_center = ParagraphStyle(
        "HCellC", parent=header_cell, alignment=TA_CENTER,
    )
    cover_title = ParagraphStyle(
        "CoverTitle", parent=body,
        fontName=SANS_BOLD, fontSize=42, leading=48,
        textColor=colors.white, alignment=TA_LEFT,
    )
    cover_sub = ParagraphStyle(
        "CoverSub", parent=body,
        fontName=BODY_FONT, fontSize=15, leading=20,
        textColor=colors.HexColor("#D7C68C"), alignment=TA_LEFT,
    )
    cover_meta = ParagraphStyle(
        "CoverMeta", parent=body,
        fontName=SANS_FONT, fontSize=10, leading=14,
        textColor=colors.HexColor("#A8A29A"), alignment=TA_LEFT,
    )
    cover_kicker = ParagraphStyle(
        "CoverKicker", parent=body,
        fontName=SANS_BOLD, fontSize=10, leading=13,
        textColor=ACCENT, alignment=TA_LEFT,
    )
    cover_summary = ParagraphStyle(
        "CoverSummary", parent=body,
        fontName=BODY_FONT, fontSize=10.5, leading=16,
        textColor=colors.HexColor("#E8E4DA"), alignment=TA_LEFT,
    )
    toc_h1 = ParagraphStyle(
        "TOC1", parent=body,
        fontName=SANS_BOLD, fontSize=11, leading=16,
        textColor=HEADER_FILL, leftIndent=0, spaceBefore=4,
    )
    toc_h2 = ParagraphStyle(
        "TOC2", parent=body,
        fontName=BODY_FONT, fontSize=10, leading=14,
        textColor=TEXT_PRIMARY, leftIndent=18, spaceBefore=0,
    )
    return dict(
        body=body, kicker=kicker, h1=h1, h2=h2, h3=h3,
        code=code_style, callout=callout_style,
        formula=formula_style, num=num_style, bullet=bullet_style,
        cell=cell, cell_center=cell_center,
        header_cell=header_cell, header_cell_center=header_cell_center,
        cover_title=cover_title, cover_sub=cover_sub,
        cover_meta=cover_meta, cover_kicker=cover_kicker,
        cover_summary=cover_summary,
        toc_h1=toc_h1, toc_h2=toc_h2,
    )

# ============================================================================
# DIMENSIONES
# ============================================================================
PAGE_W, PAGE_H = A4
LEFT_M = RIGHT_M = 2.0 * cm
TOP_M = 2.3 * cm
BOTTOM_M = 2.0 * cm
AVAIL_W = PAGE_W - LEFT_M - RIGHT_M

# ============================================================================
# BLOQUES
# ============================================================================

def make_table_block(spec, S):
    headers = spec["headers"]
    rows = spec["rows"]
    n_cols = len(headers)
    max_cell_len = max((len(str(c)) for r in rows for c in r), default=0)
    header_cells = []
    for h in headers:
        style = S["header_cell_center"] if max_cell_len <= 12 else S["header_cell"]
        header_cells.append(Paragraph(f"<b>{esc(h)}</b>", style))
    data = [header_cells]
    for r in rows:
        row_cells = []
        for c in r:
            style = S["cell_center"] if (len(str(c)) <= 10 and max_cell_len <= 14) else S["cell"]
            row_cells.append(Paragraph(esc(c), style))
        data.append(row_cells)
    if n_cols <= 2:
        col_ratios = [0.35, 0.65]
    elif n_cols == 3:
        col_ratios = ([0.18, 0.18, 0.64] if max_cell_len > 30
                      else [0.33, 0.33, 0.34])
    elif n_cols == 4:
        col_ratios = [0.22, 0.28, 0.25, 0.25]
    else:
        col_ratios = [1.0 / n_cols] * n_cols
    col_widths = [r * AVAIL_W for r in col_ratios[:n_cols]]
    tbl = Table(data, colWidths=col_widths, hAlign="CENTER", repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), TABLE_STRIPE))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def make_reg_table(rows, S):
    header_cells = [
        Paragraph("<b>Rango</b>", S["header_cell_center"]),
        Paragraph("<b>Tam.</b>", S["header_cell_center"]),
        Paragraph("<b>Funcion</b>", S["header_cell"]),
    ]
    data = [header_cells]
    for r in rows:
        data.append([
            Paragraph(esc(r[0]), S["cell_center"]),
            Paragraph(esc(r[1]), S["cell_center"]),
            Paragraph(esc(r[2]), S["cell"]),
        ])
    col_widths = [0.18 * AVAIL_W, 0.10 * AVAIL_W, 0.72 * AVAIL_W]
    tbl = Table(data, colWidths=col_widths, hAlign="CENTER", repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), TABLE_STRIPE))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def make_code_block(code, S):
    code_escaped = code.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    pre = Preformatted(
        code_escaped,
        ParagraphStyle(
            "CodePre", parent=S["code"],
            fontName=MONO_FONT, fontSize=8.2, leading=10.5,
            textColor=TEXT_PRIMARY,
            leftIndent=8, rightIndent=4,
        ),
    )
    tbl = Table([[pre]], colWidths=[AVAIL_W], hAlign="CENTER")
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
        ("BOX", (0, 0), (-1, -1), 0.4, CODE_BORDER),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return tbl


def make_callout(text, S):
    callout_p = Paragraph(esc(text), S["callout"])
    tbl = Table([[callout_p]], colWidths=[AVAIL_W], hAlign="CENTER")
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return tbl


def make_formula(formula, S):
    return Paragraph(esc(formula), S["formula"])


def render_block(kind, payload, S):
    if kind == "p":
        return [Paragraph(esc(payload), S["body"])]
    if kind == "h2":
        return [Paragraph(esc(payload), S["h2"])]
    if kind == "h3":
        return [Paragraph(esc(payload), S["h3"])]
    if kind == "callout":
        return [Spacer(1, 4), make_callout(payload, S), Spacer(1, 6)]
    if kind == "formula":
        return [make_formula(payload, S)]
    if kind == "code":
        return [Spacer(1, 4), make_code_block(payload, S), Spacer(1, 8)]
    if kind == "table":
        return [Spacer(1, 6), make_table_block(payload, S), Spacer(1, 10)]
    if kind == "table_reg":
        return [Spacer(1, 6), make_reg_table(payload, S), Spacer(1, 10)]
    if kind == "num":
        return [Paragraph(f"<b>-</b>&nbsp;&nbsp;{esc(payload)}", S["num"])]
    if kind == "bullet":
        return [Paragraph(f"<b>+</b>&nbsp;&nbsp;{esc(payload)}", S["bullet"])]
    return []

# ============================================================================
# DOC TEMPLATE
# ============================================================================

class SccDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, **kw)
        frame = Frame(
            LEFT_M, BOTTOM_M, AVAIL_W, PAGE_H - TOP_M - BOTTOM_M,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            id="body",
        )
        cover_frame = Frame(
            0, 0, PAGE_W, PAGE_H,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
            id="cover",
        )
        self.addPageTemplates([
            PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover_bg),
            PageTemplate(id="Body", frames=[frame], onPage=draw_header_footer),
        ])

    def afterFlowable(self, flowable):
        if hasattr(flowable, "toc_level"):
            self.notify(
                "TOCEntry",
                (flowable.toc_level, flowable.toc_text, self.page, flowable.toc_key),
            )


def draw_cover_bg(canvas, doc):
    import math
    canvas.saveState()
    canvas.setFillColor(COVER_BLOCK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, 0, 8 * mm, PAGE_H, fill=1, stroke=0)
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(0.6)
    canvas.line(LEFT_M, PAGE_H - 4.2 * cm, PAGE_W - RIGHT_M, PAGE_H - 4.2 * cm)
    canvas.setStrokeColor(colors.HexColor("#2A3744"))
    canvas.setLineWidth(0.5)
    base_y = 3.2 * cm
    bar_w = (PAGE_W - LEFT_M - RIGHT_M) / 32.0
    for i in range(32):
        x = LEFT_M + i * bar_w
        h = 8 * mm * abs(
            math.sin(i * 0.4) * 0.6 + math.sin(i * 1.3) * 0.4
        )
        canvas.line(x, base_y, x, base_y + h)
    canvas.setFillColor(colors.HexColor("#6E7783"))
    canvas.setFont(SANS_FONT, 8)
    canvas.drawString(LEFT_M, 1.2 * cm, "K051649 - K052539 - MSX - Konami")
    canvas.drawRightString(PAGE_W - RIGHT_M, 1.2 * cm, "Estudio Mideas - 2026")
    canvas.restoreState()


def draw_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(SANS_FONT, 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_M, PAGE_H - 1.3 * cm, "El Chip SCC de Konami")
    canvas.drawRightString(
        PAGE_W - RIGHT_M, PAGE_H - 1.3 * cm,
        "Estudio tecnico y guia de programacion",
    )
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(LEFT_M, PAGE_H - 1.5 * cm, PAGE_W - RIGHT_M, PAGE_H - 1.5 * cm)
    canvas.setFont(SANS_FONT, 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_M, 1.2 * cm, "Estudio Mideas")
    canvas.drawRightString(PAGE_W - RIGHT_M, 1.2 * cm, f"Pagina {doc.page - 1}")
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.3)
    canvas.line(LEFT_M, 1.5 * cm, PAGE_W - RIGHT_M, 1.5 * cm)
    canvas.restoreState()

# ============================================================================
# PORTADA / TOC
# ============================================================================

def build_cover(S):
    # La portada tiene una banda dorada de 8mm a la izquierda + margen.
    # Empaquetamos todo en una tabla 1x1 con padding izquierdo amplio.
    inner = []
    inner.append(Spacer(1, 5.5 * cm))
    inner.append(Paragraph("ESTUDIO TECNICO MSX", S["cover_kicker"]))
    inner.append(Spacer(1, 0.4 * cm))
    inner.append(Paragraph("El Chip SCC", S["cover_title"]))
    inner.append(Paragraph("de Konami", S["cover_title"]))
    inner.append(Spacer(1, 0.5 * cm))
    inner.append(Paragraph(
        "Estudio tecnico y guia de programacion para MSX", S["cover_sub"]
    ))
    inner.append(Spacer(1, 2.2 * cm))
    inner.append(Paragraph("RESUMEN", S["cover_kicker"]))
    inner.append(Spacer(1, 0.2 * cm))
    inner.append(Paragraph(C.SUMMARY, S["cover_summary"]))
    inner.append(Spacer(1, 2.5 * cm))
    inner.append(Paragraph("AUTOR", S["cover_kicker"]))
    inner.append(Spacer(1, 0.15 * cm))
    inner.append(Paragraph(C.AUTHOR, S["cover_meta"]))
    inner.append(Spacer(1, 0.4 * cm))
    inner.append(Paragraph("FUENTES VERIFICADAS", S["cover_kicker"]))
    inner.append(Spacer(1, 0.15 * cm))
    inner.append(Paragraph(
        "openMSX - libmsx - BiFi/msxnet - MSX Wiki - Implementacion Mideas",
        S["cover_meta"],
    ))
    # Envolver en tabla con padding izquierdo generoso (despues de banda dorada)
    wrapper = Table([[inner]], colWidths=[PAGE_W], rowHeights=[PAGE_H])
    wrapper.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), LEFT_M),
        ("RIGHTPADDING", (0, 0), (-1, -1), RIGHT_M),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return [wrapper]


def build_toc(S):
    story = []
    story.append(Paragraph("Indice", S["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceBefore=4, spaceAfter=12))
    toc = TableOfContents()
    toc.levelStyles = [S["toc_h1"], S["toc_h2"]]
    story.append(toc)
    return story

# ============================================================================
# CUERPO
# ============================================================================

def build_chapter(title, kicker, blocks, num, S):
    story = []
    story.append(CondPageBreak(6 * cm))
    if num > 0:
        cap_label = f"CAPITULO {num:02d}"
    elif num == 0:
        cap_label = "INTRODUCCION"
    else:
        cap_label = "APENDICE"
    story.append(Paragraph(cap_label, S["kicker"]))
    key = "h_" + hashlib.md5(title.encode("utf-8")).hexdigest()[:8]
    h1 = Paragraph(f'<a name="{key}"/>{esc(title)}', S["h1"])
    h1.toc_level = 0
    h1.toc_text = title
    h1.toc_key = key
    story.append(h1)
    story.append(Paragraph(esc(kicker), ParagraphStyle(
        "ChKicker", parent=S["body"], fontName=BODY_FONT,
        fontSize=11, leading=15, textColor=TEXT_MUTED,
        alignment=TA_LEFT, spaceBefore=0, spaceAfter=10,
    )))
    story.append(HRFlowable(width="40%", thickness=0.8, color=ACCENT, hAlign="LEFT", spaceBefore=0, spaceAfter=10))
    for kind, payload in blocks:
        story.extend(render_block(kind, payload, S))
    return story

# ============================================================================
# MAIN
# ============================================================================

def main():
    out_pdf = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "SCC_Konami_Estudio_Tecnico.pdf",
    )
    S = make_styles()
    doc = SccDocTemplate(
        out_pdf, pagesize=A4,
        leftMargin=LEFT_M, rightMargin=RIGHT_M,
        topMargin=TOP_M, bottomMargin=BOTTOM_M,
        title=C.TITLE, author="Z.ai", creator="Z.ai",
        subject=C.SUBJECT,
    )
    story = []
    story.extend(build_cover(S))
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())
    story.extend(build_toc(S))
    story.append(PageBreak())
    for title, kicker, blocks, num in C.CHAPTERS:
        story.extend(build_chapter(title, kicker, blocks, num, S))
    doc.multiBuild(story)
    print(f"PDF generado: {out_pdf}")
    print(f"Tamano: {os.path.getsize(out_pdf) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
