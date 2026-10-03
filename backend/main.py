from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
import os
import io
import requests
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from pattern_generator import generate_pattern_pdf
from database.threads import get_all_threads, get_thread_count
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="Mulina API",
    description="API for converting images to embroidery patterns",
    version="1.0.0"
)

# CORS Configuration
allowed_origins = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:19006,http://localhost:8081,http://localhost:3000,https://mulina-c334d.web.app,https://mulina-c334d.firebaseapp.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ConversionRequest(BaseModel):
    image_url: str
    pattern_type: str = "cross_stitch"  # "cross_stitch" or "outline"
    max_colors: int = 30
    aida_count: int = 14
    target_stitches: Optional[int] = 70
    target_width_cm: Optional[float] = None
    target_height_cm: Optional[float] = None
    canvas_color: str = "white"  # "white", "cream", "black", "linen"
    margin_cm: float = 5.0
    brightness: float = 1.0  # 0.5 to 1.5
    contrast: float = 1.0    # 0.5 to 1.5
    saturation: float = 1.0  # 0.0 to 2.0
    cleanup_confetti: bool = True
    ignore_background: bool = False
    enable_dithering: bool = False
    thread_brand: str = "DMC"
    use_inventory: bool = False

class PatternResponse(BaseModel):
    pattern_id: str
    status: str
    grid_data: Optional[dict] = None
    color_palette: List[dict]
    dimensions: dict
    estimated_time_minutes: int
    materials_summary: Optional[dict] = None

class ThreadInfo(BaseModel):
    thread_id: str
    brand: str
    color_code: str
    color_name: str
    rgb: tuple[int, int, int]
    hex_color: str

class ExportPdfPayload(BaseModel):
    pattern: Optional[dict] = None

# In-memory patterns cache for export
PATTERNS_CACHE = {}

# Health Check
@app.get("/")
async def root():
    thread_count = get_thread_count()
    return {
        "service": "Mulina API",
        "status": "healthy",
        "version": "1.0.0",
        "threads_loaded": thread_count
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "threads": get_thread_count()}

# Endpoints
@app.post("/api/v1/convert", response_model=PatternResponse)
async def convert_image(request: ConversionRequest):
    """
    Konwertuje obraz na wzór hafciarski
    """
    try:
        # Relative imports within backend module
        import sys
        import os
        import numpy as np
        from PIL import Image as PILImage
        sys.path.insert(0, os.path.dirname(__file__))
        
        from image_processor.converter import ImageProcessor
        from color_engine.delta_e import find_closest_thread, Thread
        from database.threads import get_all_threads
        
        # Download or decode image
        if request.image_url.startswith("data:"):
            import base64
            _, encoded = request.image_url.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            image_data = BytesIO(image_bytes)
        else:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            response = requests.get(request.image_url, headers=headers, timeout=30)
            response.raise_for_status()
            image_data = BytesIO(response.content)
        
        # Get thread database
        threads_data = get_all_threads(brand=request.thread_brand)
        thread_database = [
            Thread(
                thread_id=t["thread_id"],
                brand=t["brand"],
                color_code=t["color_code"],
                color_name=t.get("color_name", ""),
                rgb=tuple(t["rgb"]),
                lab=tuple(t.get("lab", [0, 0, 0]))  # Will be calculated if missing
            )
            for t in threads_data
        ]
        
        # Load image with PIL
        pil_img = PILImage.open(image_data)
        if pil_img.mode != 'RGB':
            pil_img = pil_img.convert('RGB')
        
        # Apply pre-processing image enhancements
        from PIL import ImageEnhance
        if request.brightness != 1.0:
            pil_img = ImageEnhance.Brightness(pil_img).enhance(max(0.1, min(2.0, request.brightness)))
        if request.contrast != 1.0:
            pil_img = ImageEnhance.Contrast(pil_img).enhance(max(0.1, min(2.0, request.contrast)))
        if request.saturation != 1.0:
            pil_img = ImageEnhance.Color(pil_img).enhance(max(0.0, min(3.0, request.saturation)))

        # Convert to numpy array for OpenCV
        img_array = np.array(pil_img)
        
        # Resize to target cross-stitch stitches (from target_width_cm or target_stitches)
        if request.target_width_cm and request.target_width_cm > 0:
            stitches_per_cm = request.aida_count / 2.54
            target_size = int(round(request.target_width_cm * stitches_per_cm))
        else:
            target_size = request.target_stitches or 70
        target_size = max(20, min(target_size, 180))

        height, width = img_array.shape[:2]
        scale = target_size / max(height, width)
        new_width = max(10, int(round(width * scale)))
        new_height = max(10, int(round(height * scale)))
        import cv2
        img_array = cv2.resize(img_array, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # Color quantization using k-means
        from sklearn.cluster import KMeans
        pixels = img_array.reshape(-1, 3)
        unique_colors_count = len(np.unique(pixels, axis=0))
        n_clusters = max(1, min(request.max_colors, 35, unique_colors_count))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        kmeans.fit(pixels)
        
        # Get dominant colors
        colors = kmeans.cluster_centers_.astype(int)
        labels = kmeans.labels_
        grid_height, grid_width = img_array.shape[:2]
        grid = labels.reshape(grid_height, grid_width)

        # Confetti reduction filter if enabled
        if request.cleanup_confetti and grid_height >= 3 and grid_width >= 3:
            grid_cleaned = cv2.medianBlur(grid.astype(np.uint8), 3)
            grid = grid_cleaned.astype(int)

        # Count stitches for each color cluster
        unique_labels, counts = np.unique(grid, return_counts=True)
        counts_dict = {int(k): int(v) for k, v in zip(unique_labels, counts)}
        
        # Authentic cross-stitch symbols
        STITCH_SYMBOLS = [
            '◆', '▲', '●', '■', '★', '✚', '✖', '♥', '♦', '✦', 
            '♠', '♣', '▼', '◄', '►', '◈', '◉', '◍', '◎', '◐', 
            '◑', '◒', '◓', '✷', '✸', '✹', '✺', '✻', '✼', '✽'
        ]
        
        # Map colors to threads
        color_palette = []
        thread_map = {}
        
        for idx, rgb in enumerate(colors):
            rgb_tuple = tuple([int(x) for x in rgb])  # Convert numpy int64 to Python int
            thread_match = find_closest_thread(
                rgb_tuple, 
                thread_database,
                brand_filter=request.thread_brand
            )
            symbol = STITCH_SYMBOLS[idx % len(STITCH_SYMBOLS)] if idx < len(STITCH_SYMBOLS) else chr(65 + idx)
            stitch_count = counts_dict.get(idx, 0)
            # Estimate skeins (1 skein of 8m has 6 strands, 2 strands per stitch ~ 1800 stitches)
            skeins_needed = max(1, round(stitch_count / 1800.0, 1))

            color_palette.append({
                "index": idx,
                "rgb": [int(x) for x in rgb],  # Ensure standard int
                "thread_code": thread_match["thread"].color_code,
                "thread_brand": thread_match["thread"].brand,
                "thread_name": thread_match["thread"].color_name,
                "symbol": symbol,
                "delta_e": round(float(thread_match["delta_e"]), 2),
                "stitch_count": stitch_count,
                "skeins_needed": skeins_needed,
            })
            thread_map[idx] = len(color_palette) - 1
        
        # Generate pattern based on type
        grid_data = {
            "grid": [[int(cell) for cell in row] for row in grid.tolist()],  # Convert all to int
            "type": request.pattern_type,
            "width": int(grid_width),
            "height": int(grid_height)
        }
        
        # Calculate dimensions
        width_stitches = int(grid_width)
        height_stitches = int(grid_height)
        
        # Physical dimensions (cm) based on Aida count
        cm_per_stitch = 2.54 / request.aida_count  # Aida count = stitches per inch
        width_cm = round(width_stitches * cm_per_stitch, 1)
        height_cm = round(height_stitches * cm_per_stitch, 1)
        margin = float(request.margin_cm if request.margin_cm is not None else 5.0)
        recommended_cut_width_cm = round(width_cm + 2 * margin, 1)
        recommended_cut_height_cm = round(height_cm + 2 * margin, 1)

        # Estimated time (rough: 1 stitch = 0.5 minute for beginners)
        total_stitches = width_stitches * height_stitches
        estimated_time = int(total_stitches * 0.5)

        total_skeins = sum(c.get("skeins_needed", 1) for c in color_palette)
        estimated_cost_pln = round(total_skeins * 4.50, 2)
        
        pattern_id = f"pattern_{abs(hash(request.image_url)) % 100000}"
        result_dimensions = {
            "width_stitches": width_stitches,
            "height_stitches": height_stitches,
            "width_cm": width_cm,
            "height_cm": height_cm,
            "aida_count": request.aida_count,
            "canvas_color": request.canvas_color,
            "margin_cm": margin,
            "recommended_cut_width_cm": recommended_cut_width_cm,
            "recommended_cut_height_cm": recommended_cut_height_cm,
        }

        materials_summary = {
            "total_stitches": total_stitches,
            "total_skeins": total_skeins,
            "estimated_cost_pln": estimated_cost_pln,
            "fabric_cut_size": f"{recommended_cut_width_cm} × {recommended_cut_height_cm} cm",
            "fabric_type": f"Kanwa Aida {request.aida_count} ct ({round(request.aida_count / 2.54, 1)} ściegów/cm)",
            "canvas_color": request.canvas_color,
        }
        
        # Save to memory cache for instantaneous PDF export
        PATTERNS_CACHE[pattern_id] = {
            "pattern_id": pattern_id,
            "name": f"Wzór Haftu ({width_stitches}×{height_stitches})",
            "grid_data": grid_data,
            "color_palette": color_palette,
            "dimensions": result_dimensions,
            "materials_summary": materials_summary,
            "estimated_time": estimated_time
        }

        return PatternResponse(
            pattern_id=pattern_id,
            status="ready",
            grid_data=grid_data,
            color_palette=color_palette,
            dimensions=result_dimensions,
            materials_summary=materials_summary,
            estimated_time_minutes=estimated_time
        )
        
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")

@app.get("/api/v1/threads", response_model=List[ThreadInfo])
async def get_threads(brand: Optional[str] = None):
    """
    Pobiera listę dostępnych nici
    """
    try:
        threads_data = get_all_threads(brand=brand)
        
        # Konwersja do ThreadInfo model
        threads = []
        for t in threads_data:
            threads.append(ThreadInfo(
                thread_id=t["thread_id"],
                brand=t["brand"],
                color_code=t["color_code"],
                color_name=t["color_name"],
                rgb=t["rgb"],
                hex_color=t["hex_color"]
            ))
        
        return threads
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load threads: {str(e)}")

@app.get("/api/v1/patterns/{pattern_id}")
async def get_pattern(pattern_id: str):
    """
    Pobiera szczegóły wzoru
    """
    if pattern_id in PATTERNS_CACHE:
        return PATTERNS_CACHE[pattern_id]
    raise HTTPException(status_code=404, detail="Pattern not found")

@app.get("/api/v1/patterns/{pattern_id}/export-pdf")
@app.post("/api/v1/patterns/{pattern_id}/export-pdf")
@app.post("/api/v1/patterns/export-pdf")
async def export_pdf(pattern_id: Optional[str] = "current", payload: Optional[ExportPdfPayload] = None):
    """
    Generates professional printable cross-stitch PDF chart and DMC legend.
    """
    pattern_data = None
    if payload and payload.pattern:
        pattern_data = payload.pattern
    elif pattern_id and pattern_id in PATTERNS_CACHE:
        pattern_data = PATTERNS_CACHE[pattern_id]
    else:
        # High quality fallback demo pattern
        pattern_data = {
            "name": f"Wzór demonstracyjny Mulina",
            "dimensions": {"width_stitches": 70, "height_stitches": 46},
            "grid_data": {
                "width": 70,
                "height": 46,
                "grid": [[(r * 2 + c) % 5 for c in range(70)] for r in range(46)]
            },
            "color_palette": [
                {"symbol": "◆", "rgb": [220, 38, 38], "thread_brand": "DMC", "thread_code": "321", "thread_name": "Red", "stitch_count": 644, "skeins_needed": 1.0},
                {"symbol": "▲", "rgb": [34, 197, 94], "thread_brand": "DMC", "thread_code": "702", "thread_name": "Kelly Green", "stitch_count": 644, "skeins_needed": 1.0},
                {"symbol": "●", "rgb": [59, 130, 246], "thread_brand": "DMC", "thread_code": "797", "thread_name": "Royal Blue", "stitch_count": 644, "skeins_needed": 1.0},
                {"symbol": "■", "rgb": [234, 179, 8], "thread_brand": "DMC", "thread_code": "972", "thread_name": "Deep Canary", "stitch_count": 644, "skeins_needed": 1.0},
                {"symbol": "★", "rgb": [168, 85, 247], "thread_brand": "DMC", "thread_code": "550", "thread_name": "Violet", "stitch_count": 644, "skeins_needed": 1.0},
            ],
        }

    try:
        pdf_bytes = generate_pattern_pdf(pattern_data)
        safe_filename = f"mulina_pattern_{pattern_id}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={safe_filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

@app.get("/api/v1/user/inventory")
async def get_user_inventory():
    """
    Pobiera inwentarz nici użytkownika
    """
    # TODO: Implementacja z Firestore
    return {"threads": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
