from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from database.threads import get_all_threads, get_thread_count

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
    # TODO: Implementacja algorytmu konwersji
    raise HTTPException(status_code=501, detail="Not implemented yet")

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
    # TODO: Generowanie PDF, dedukcja tokenów
    raise HTTPException(status_code=501, detail="Not implemented yet")

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
