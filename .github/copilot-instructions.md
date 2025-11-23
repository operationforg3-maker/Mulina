# Mulina - AI Agent Instructions

## Project Overview
Mulina is a mobile/web application for hand embroidery enthusiasts that converts digital images into professional embroidery patterns (cross-stitch and surface embroidery). The core value proposition is precise color matching using physical thread palettes (DMC, Anchor, Ariadna) with integrated project management tools.

## Architecture & Tech Stack

**Backend/Processing:**
- Python with OpenCV, Pillow, scikit-learn for image processing
- SQLite/Realm for offline-first local data storage

**Frontend:**
- React Native (Expo SDK 50) mobile-first design; Expo Web enabled
- Offline-capable with local pattern caching

**Key Architectural Decisions:**
- **Offline First:** All pattern editing and viewing must work without internet
- **Color Precision:** Use CIELAB color space (Delta E) for thread matching, NOT RGB/HSL
- **Modular Pipeline:** Image processing → Color quantization → Thread mapping → Pattern generation

## Core Modules & Data Flow

### 1. Image Processing Pipeline (`core_engine/`)
```
Input (JPG/PNG/HEIC) → Pre-processing → Converter → Color Matching → Pattern Output
```

**Cross-Stitch Converter:**
- Pixelization with Aida count parameters (14, 16, 18, 20)
- K-means clustering for color reduction (max colors: 20-100)
- Optional Floyd-Steinberg dithering

**Outline Converter (Surface Embroidery):**
- Edge detection algorithms for artistic embroidery sketches
- Non-grid based output

### 2. Color Matching Engine (`color_engine/`)
**Critical Implementation Details:**
- Thread database schema: `thread_id`, `brand` (DMC/Anchor/Ariadna/Madeira), `color_code`, `rgb_values`, `lab_values`
- Use Delta E (CIELAB) for perceptual color distance: `deltaE = sqrt((L2-L1)^2 + (a2-a1)^2 + (b2-b1)^2)`
- Brand conversion: Map equivalent colors across manufacturers using pre-computed conversion tables

**Optimization Algorithm:**
- When user enables "My Thread Inventory" mode, add weighted scoring: `score = deltaE * (inventory_match ? 0.8 : 1.0)`
- Cache color matches in pattern metadata to avoid recalculation

### 3. Pattern Editor (`editor/`)
**Tools to Implement:**
- Pixel-level editing (pencil, eraser, fill bucket)
- Backstitch layer (vector lines on grid overlay)
- "Confetti Removal": Flood-fill algorithm to detect isolated single-stitch pixels

**State Management:**
- Store edit history for undo/redo (max 50 steps)
- Pattern state: `{ grid: [], stitches: [], backstitches: [], metadata: {} }`

### 4. Export System (`export/`)
**PDF Generation Requirements:**
- Multi-page layout: Cover → Color Legend → Symbol Chart (paginated) → Material List
- Calculate thread consumption: `meters_per_stitch = 0.06` (average for Aida 14)
- Symbol chart must support 100+ unique symbols with high contrast (use Wingdings + custom glyphs)

**Companion Mode:**
- Real-time progress tracking with SQLite persistence
- Highlight active color/symbol with touch events
- Export progress snapshots (resume on different devices)

## Development Workflows

### Setup & Build
```bash
# Backend setup (Python/FastAPI)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup (Expo React Native + Web)
cd mobile
npm install
npm start  # press i/a/w for iOS/Android/Web
```

### Testing Color Algorithms
```python
# Test color matching with known thread samples
from color_engine import find_closest_thread
test_rgb = (185, 45, 72)  # Example color
result = find_closest_thread(test_rgb, brand='DMC')
assert result['deltaE'] < 5.0  # Acceptable perceptual difference
```

### Database Initialization
```bash
# Populate thread database from CSV files in data/threads/
python scripts/init_thread_database.py --brands DMC,Anchor,Ariadna
```

## Project-Specific Conventions

### Naming & Code Style
- **Thread Codes:** Always store as strings, not integers (e.g., DMC "310", not 310)
- **Coordinates:** Grid positions as `(row, col)` tuples, NOT `(x, y)`
- **Color Formats:** Store RGB as tuples `(0-255, 0-255, 0-255)`, LAB as floats

### File Organization
```
/backend
  /color_engine       # Color matching, thread databases
  /image_processor    # OpenCV pipelines
  /pattern_generator  # Grid/symbol generation
/mobile
  /src
    /screens          # UI views
    /components       # Reusable UI elements
    /services         # API/database adapters
/data
  /threads            # CSV files with thread color data
  /test_images        # Sample embroidery images
```

### Common Pitfalls
- **DO NOT** use RGB distance for color matching (perceptually inaccurate)
- **DO NOT** store patterns as images (use structured grid data for editability)
- **ALWAYS** validate Aida count before pixelization (affects physical pattern size)
- **REMEMBER** thread inventory is user-specific (check local storage before optimization)

## Business Logic Integration Points

### Monetization Hooks
- **Token System:** Export to PDF requires token deduction (implement in `export/pdf_generator.py`)
- **Affiliate Links:** Thread purchase suggestions in `MaterialList` component (track conversions)
- **Marketplace:** Pattern sharing API endpoints (CRUD for user-generated patterns)

### Third-Party Integrations
- **Image Upload:** Support cloud storage (S3/Firebase) for pattern backup
- **Payment Processing:** Stripe/PayPal for token purchases and kit orders
- **Analytics:** Track conversion funnel: Image Upload → Pattern Generation → PDF Export → Purchase

## Key Files & Entry Points
- `backend/main.py` - Mulina API server entry point
- `backend/color_engine/delta_e.py` - Color matching core algorithm
- `mobile/src/screens/PatternEditorScreen.tsx` - Main editing interface
- `data/threads/dmc_colors.csv` - DMC thread reference database
- `scripts/optimize_confetti.py` - Standalone tool for pattern cleanup

## Resources & References
- [CIELAB Color Space](https://en.wikipedia.org/wiki/CIELAB_color_space) - Understanding Delta E
- [Aida Fabric Guide](https://www.thecrossstitchguild.com/cross-stitch-basics/aida-fabric.aspx) - Stitch count calculations
- DMC Thread Chart API (if available) - Automated thread data updates

## Questions for Product Owner
- Should color matching prioritize speed (<100ms) or accuracy (<2.0 Delta E)?
- Max pattern size limits for mobile devices (memory constraints)?
- Offline thread database update strategy (bundle vs incremental)?
