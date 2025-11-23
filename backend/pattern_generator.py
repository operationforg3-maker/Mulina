import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle


def generate_pattern_pdf(pattern: dict) -> bytes:
    """
    Generates a PDF for the given pattern dict and returns PDF bytes.
    Layout: Cover, Color Legend, Symbol Chart (grid), Material List.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Cover Page
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2, height-60, pattern.get("name", "Wzór Mulina"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width/2, height-90, f"{pattern['dimensions']['width_stitches']} x {pattern['dimensions']['height_stitches']} ściegów")
    c.drawCentredString(width/2, height-110, f"{pattern['color_palette'].__len__()} kolorów")
    c.showPage()

    # Color Legend
    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, height-60, "Legenda kolorów")
    c.setFont("Helvetica", 12)
    y = height-90
    for idx, color in enumerate(pattern['color_palette']):
        c.setFillColorRGB(*(v/255 for v in color['rgb']))
        c.rect(40, y-8, 16, 16, fill=1)
        c.setFillColor(colors.black)
        c.drawString(62, y, f"{color['thread_brand']} {color['thread_code']} {color['thread_name']}  Symbol: {color['symbol']}")
        y -= 22
        if y < 80:
            c.showPage()
            y = height-60
    c.showPage()

    # TODO: Symbol Chart (grid) and Material List
    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, height-60, "Symbol Chart i Materiały - WKRÓTCE")
    c.showPage()

    c.save()
    buffer.seek(0)
    return buffer.read()
