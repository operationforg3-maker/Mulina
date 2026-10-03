import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import math

def generate_pattern_pdf(pattern: dict) -> bytes:
    """
    Generates a high-quality printable PDF for cross-stitch patterns.
    Includes:
    1. Cover page with pattern details, fabric counts, and total stitches
    2. DMC thread legend & skein shopping list
    3. Cross-stitch symbol chart with 10x10 bold grid lines and coordinates
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    page_w, page_h = A4

    # Extract pattern properties
    name = pattern.get("name", "Wzór Mulina")
    dims = pattern.get("dimensions", {})
    w_stitches = dims.get("width_stitches", pattern.get("grid_data", {}).get("width", 50))
    h_stitches = dims.get("height_stitches", pattern.get("grid_data", {}).get("height", 50))
    color_palette = pattern.get("color_palette", [])
    grid = pattern.get("grid_data", {}).get("grid", [])

    total_stitches = sum(c.get("stitch_count", 0) for c in color_palette)
    if total_stitches == 0:
        total_stitches = w_stitches * h_stitches

    # ================= PAGE 1: COVER PAGE =================
    c.saveState()
    
    # Header bar
    c.setFillColor(colors.HexColor("#4f46e5"))
    c.rect(0, page_h - 100, page_w, 100, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(40, page_h - 60, "Mulina — Studio Haftu Krzyżykowego")
    
    c.setFont("Helvetica", 12)
    c.drawString(40, page_h - 82, "Profesjonalny schemat graficzny i lista mulin DMC")

    # Title & Subtitle
    c.setFillColor(colors.HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", 20)
    c.drawString(40, page_h - 140, f"Wzór: {name}")

    # Pattern Overview Box
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.roundRect(40, page_h - 320, page_w - 80, 150, 8, fill=1, stroke=1)

    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, page_h - 170, "PARAMETRY WZORU:")

    c.setFont("Helvetica", 10)
    y_info = page_h - 195
    c.drawString(60, y_info, f"• Wymiary w ściegach: {w_stitches} × {h_stitches} (łącznie {total_stitches:,} ściegów)")
    
    # Fabric calculations
    aida_count = dims.get("aida_count", 14)
    canvas_color = dims.get("canvas_color", "Biała")
    active_w = dims.get("width_cm", round(w_stitches * 2.54 / aida_count, 1))
    active_h = dims.get("height_cm", round(h_stitches * 2.54 / aida_count, 1))
    cut_w = dims.get("recommended_cut_width_cm", round(active_w + 10, 1))
    cut_h = dims.get("recommended_cut_height_cm", round(active_h + 10, 1))

    y_info -= 18
    c.drawString(60, y_info, f"• Wybrana kanwa: Aida {aida_count} ct (kolor: {canvas_color})")
    y_info -= 18
    c.drawString(60, y_info, f"• Rozmiar motywu: {active_w} × {active_h} cm")
    y_info -= 18
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0f766e"))
    c.drawString(60, y_info, f"• Rekomendowany wymiar płótna do ucięcia (zapas +5 cm na ramkę): {cut_w} × {cut_h} cm")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#334155"))
    y_info -= 18
    c.drawString(60, y_info, f"• Liczba unikalnych kolorów nici: {len(color_palette)} odcieni")

    # Estimated stitching time
    est_hours = round((total_stitches * 0.5) / 60, 1)
    y_info -= 18
    c.drawString(60, y_info, f"• Szacowany czas haftowania: ok. {est_hours} godzin")

    # Instructions box
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setFillColor(colors.HexColor("#f1f5f9"))
    c.roundRect(40, page_h - 480, page_w - 80, 130, 8, fill=1, stroke=1)

    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, page_h - 350, "JAK KORZYSTAĆ ZE SCHEMATU:")
    c.setFont("Helvetica", 9)
    c.drawString(60, page_h - 375, "1. Zacznij haftowanie od środka kanwy — na diagramie środek oznaczony jest strzałkami na krawędziach.")
    c.drawString(60, page_h - 395, "2. Pogrubione linie na schemacie wyznaczają kwadraty 10×10 ściegów, ułatwiając liczenie.")
    c.drawString(60, page_h - 415, "3. Każdemu symbolowi na schemacie odpowiada konkretny numer muliny DMC podany w legendzie.")
    c.drawString(60, page_h - 435, "4. Jedno standardowe pasemko muliny (8 metrów, 6 nitek) wystarcza na ok. 1800 ściegów (przy 2 nitkach).")
    c.drawString(60, page_h - 455, "5. Aplikacja Mulina pozwala także na śledzenie postępów na żywo na ekranie telefonu lub tabletu.")

    # Footer
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawString(40, 40, "Wygenerowano automatycznie przez Mulina App (http://mulina-c334d.web.app)")
    c.drawRightString(page_w - 40, 40, "Strona 1")

    c.restoreState()
    c.showPage()

    # ================= PAGE 2: THREAD LEGEND / SHOPPING LIST =================
    c.saveState()
    
    c.setFillColor(colors.HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, page_h - 50, "Lista Mulin DMC i Legenda Symboli")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(40, page_h - 68, "Wykaz nici potrzebnych do wykonania haftu wraz z kalkulatorem pasemek:")

    # Table Header
    y_table = page_h - 100
    row_height = 20
    
    c.setFillColor(colors.HexColor("#e2e8f0"))
    c.rect(40, y_table, page_w - 80, row_height, fill=1, stroke=0)
    
    c.setFillColor(colors.HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(45, y_table + 6, "Symbol")
    c.drawString(90, y_table + 6, "Kolor")
    c.drawString(140, y_table + 6, "Marka")
    c.drawString(190, y_table + 6, "Nr nici")
    c.drawString(250, y_table + 6, "Nazwa koloru")
    c.drawString(420, y_table + 6, "Ściegów")
    c.drawString(485, y_table + 6, "Ilość pasemek (8m)")

    y_table -= row_height

    for idx, col in enumerate(color_palette):
        # Background zebra striping
        if idx % 2 == 1:
            c.setFillColor(colors.HexColor("#f8fafc"))
            c.rect(40, y_table, page_w - 80, row_height, fill=1, stroke=0)

        # Symbol
        symbol = str(col.get("symbol", chr(65 + idx)))
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(55, y_table + 5, symbol)

        # Color swatch
        rgb = col.get("rgb", [200, 200, 200])
        c.setFillColorRGB(*(v / 255.0 for v in rgb))
        c.rect(95, y_table + 3, 25, 14, fill=1, stroke=1)

        # Details
        c.setFillColor(colors.HexColor("#1e293b"))
        c.setFont("Helvetica", 9)
        c.drawString(140, y_table + 5, str(col.get("thread_brand", "DMC")))
        c.drawString(190, y_table + 5, str(col.get("thread_code", "")))
        
        name_str = str(col.get("thread_name", ""))
        if len(name_str) > 28:
            name_str = name_str[:26] + ".."
        c.drawString(250, y_table + 5, name_str)
        
        count = col.get("stitch_count", 0)
        c.drawString(425, y_table + 5, f"{count}")
        
        skeins = col.get("skeins_needed", max(1, round(count / 1800.0, 1)))
        c.drawString(500, y_table + 5, f"{skeins} szt.")

        y_table -= row_height

        # New page if overflowing
        if y_table < 60 and idx < len(color_palette) - 1:
            c.setFont("Helvetica", 8)
            c.setFillColor(colors.HexColor("#94a3b8"))
            c.drawString(40, 30, "Mulina Studio — Legenda nici DMC")
            c.restoreState()
            c.showPage()
            c.saveState()
            y_table = page_h - 70

    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawString(40, 30, "Mulina Studio — Legenda nici DMC")
    c.restoreState()
    c.showPage()

    # ================= PAGE 3: CROSS STITCH SYMBOL CHART =================
    if grid and len(grid) > 0 and len(grid[0]) > 0:
        c.saveState()
        
        c.setFillColor(colors.HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(40, page_h - 40, f"Schemat haftu: {name}")
        c.setFont("Helvetica", 8)
        c.drawString(40, page_h - 52, "Grube linie co 10 ściegów • W komórkach symbole DMC")

        # Available area for chart
        margin_left = 40
        margin_bottom = 50
        avail_w = page_w - margin_left - 40
        avail_h = page_h - margin_bottom - 70

        num_rows = len(grid)
        num_cols = len(grid[0])

        # Cell size in points
        cell_size = min(avail_w / num_cols, avail_h / num_rows)
        # Cap cell size between 4pt and 14pt
        cell_size = max(4.0, min(14.0, cell_size))

        chart_w = num_cols * cell_size
        chart_h = num_rows * cell_size
        
        start_x = margin_left + (avail_w - chart_w) / 2
        start_y = margin_bottom + (avail_h - chart_h) / 2

        # Draw cells
        c.setFont("Helvetica", max(3.5, cell_size * 0.65))

        for r in range(num_rows):
            row_y = start_y + (num_rows - 1 - r) * cell_size
            for col_idx in range(num_cols):
                cell_x = start_x + col_idx * cell_size
                color_idx = grid[r][col_idx]
                
                # Fetch color info
                col_data = color_palette[color_idx] if color_idx < len(color_palette) else {}
                rgb = col_data.get("rgb", [255, 255, 255])
                symbol = str(col_data.get("symbol", chr(65 + color_idx)))

                # Light background tint of thread color
                c.setFillColorRGB(*(0.85 + 0.15 * (v / 255.0) for v in rgb))
                c.rect(cell_x, row_y, cell_size, cell_size, fill=1, stroke=0)

                # Symbol text
                if cell_size >= 6.0:
                    c.setFillColor(colors.black)
                    c.drawCentredString(cell_x + cell_size / 2, row_y + cell_size * 0.22, symbol)

        # Thin grid lines
        c.setLineWidth(0.3)
        c.setStrokeColor(colors.HexColor("#94a3b8"))
        for col_idx in range(num_cols + 1):
            x = start_x + col_idx * cell_size
            c.line(x, start_y, x, start_y + chart_h)
        for r in range(num_rows + 1):
            y = start_y + r * cell_size
            c.line(start_x, y, start_x + chart_w, y)

        # 10x10 Bold grid lines
        c.setLineWidth(1.2)
        c.setStrokeColor(colors.HexColor("#0f172a"))
        for col_idx in range(0, num_cols + 1, 10):
            x = start_x + col_idx * cell_size
            c.line(x, start_y, x, start_y + chart_h)
            # Ruler coordinate
            c.setFont("Helvetica-Bold", 6)
            c.setFillColor(colors.HexColor("#0f172a"))
            c.drawCentredString(x, start_y + chart_h + 3, str(col_idx))

        for r_from_top in range(0, num_rows + 1, 10):
            y = start_y + (num_rows - r_from_top) * cell_size
            c.line(start_x, y, start_x + chart_w, y)
            # Ruler coordinate
            c.setFont("Helvetica-Bold", 6)
            c.setFillColor(colors.HexColor("#0f172a"))
            c.drawRightString(start_x - 3, y - 2, str(r_from_top))

        # Center markers (arrows at midpoints)
        mid_col = num_cols // 2
        mid_x = start_x + mid_col * cell_size
        c.setFillColor(colors.HexColor("#dc2626"))
        p1 = c.beginPath()
        p1.moveTo(mid_x - 3, start_y + chart_h + 10)
        p1.lineTo(mid_x + 3, start_y + chart_h + 10)
        p1.lineTo(mid_x, start_y + chart_h + 4)
        p1.close()
        c.drawPath(p1, fill=1, stroke=0)

        mid_row = num_rows // 2
        mid_y = start_y + (num_rows - mid_row) * cell_size
        p2 = c.beginPath()
        p2.moveTo(start_x - 10, mid_y - 3)
        p2.lineTo(start_x - 10, mid_y + 3)
        p2.lineTo(start_x - 4, mid_y)
        p2.close()
        c.drawPath(p2, fill=1, stroke=0)

        # Footer
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor("#94a3b8"))
        c.drawString(40, 25, "Mulina Studio — Schemat krzyżykowy")
        c.drawRightString(page_w - 40, 25, "Mulina App")

        c.restoreState()
        c.showPage()

    c.save()
    buffer.seek(0)
    return buffer.read()
