from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from pattern_generator import generate_pattern_pdf
load_dotenv()

app = FastAPI(
    title="Mulina API",
    description="API for converting images to embroidery patterns",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:19006").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ConversionRequest(BaseModel):
    image_url: str
    pattern_type: str  # "cross_stitch" or "outline"
    max_colors: int = 50
    aida_count: int = 14
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

class ThreadInfo(BaseModel):
    thread_id: str
    brand: str
    color_code: str
    color_name: str
    rgb: tuple[int, int, int]
    hex_color: str

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
        
        # Download image
        response = requests.get(request.image_url, timeout=30)
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
        
        # Convert to numpy array for OpenCV
        img_array = np.array(pil_img)
        
        # Create processor with modified approach - we'll use methods directly
        # For now, simplified version without full ImageProcessor class
        
        # Resize if too large
        max_size = 600
        height, width = img_array.shape[:2]
        if max(height, width) > max_size:
            scale = max_size / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            import cv2
            img_array = cv2.resize(img_array, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # Simple color quantization using k-means
        from sklearn.cluster import KMeans
        pixels = img_array.reshape(-1, 3)
        kmeans = KMeans(n_clusters=min(request.max_colors, 30), random_state=42, n_init=10)
        kmeans.fit(pixels)
        
        # Get dominant colors
        colors = kmeans.cluster_centers_.astype(int)
        labels = kmeans.labels_
        
        # Create grid based on labels
        grid_height, grid_width = img_array.shape[:2]
        grid = labels.reshape(grid_height, grid_width)
        
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
            color_palette.append({
                "rgb": [int(x) for x in rgb],  # Ensure standard int
                "thread_code": thread_match["thread"].color_code,
                "thread_brand": thread_match["thread"].brand,
                "thread_name": thread_match["thread"].color_name,
                "symbol": chr(65 + idx) if idx < 26 else chr(97 + idx - 26),  # A-Z, then a-z
                "delta_e": round(float(thread_match["delta_e"]), 2)
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
        width_cm = width_stitches * cm_per_stitch
        height_cm = height_stitches * cm_per_stitch
        
        # Estimated time (rough: 1 stitch = 0.5 minute for beginners)
        total_stitches = width_stitches * height_stitches
        estimated_time = int(total_stitches * 0.5)
        
        return PatternResponse(
            pattern_id=f"pattern_{hash(request.image_url) % 10000}",
            status="ready",
            grid_data=grid_data,
            color_palette=color_palette,
            dimensions={
                "width_stitches": width_stitches,
                "height_stitches": height_stitches,
                "width_cm": round(width_cm, 1),
                "height_cm": round(height_cm, 1)
            },
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

@app.get("/api/v1/patterns/{pattern_id}")
async def get_pattern(pattern_id: str):
    """
    Pobiera szczegóły wzoru
    """
    # TODO: Pobieranie z Firestore
    raise HTTPException(status_code=404, detail="Pattern not found")

@app.post("/api/v1/patterns/{pattern_id}/export-pdf")
async def export_pdf(pattern_id: str):
    """
    Generuje PDF wzoru (wymaga tokenów)
    """
    # TODO: Pobierz pattern z bazy (na razie demo)
    # Demo pattern (do podmiany na realne pobieranie)
    pattern = {
        "name": f"Wzór {pattern_id}",
        "dimensions": {"width_stitches": 100, "height_stitches": 80},
        "color_palette": [
            {"rgb": [255,0,0], "thread_brand": "DMC", "thread_code": "321", "thread_name": "Red", "symbol": "A"},
            {"rgb": [0,255,0], "thread_brand": "DMC", "thread_code": "702", "thread_name": "Green", "symbol": "B"},
            {"rgb": [0,0,255], "thread_brand": "DMC", "thread_code": "797", "thread_name": "Blue", "symbol": "C"},
        ],
    }
    pdf_bytes = generate_pattern_pdf(pattern)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=pattern_{pattern_id}.pdf"})

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
