from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from app.watermarking import embed_watermark_in_pdf, extract_watermark_from_image

router = APIRouter()

@router.post("/embed")
async def embed_watermark(
    center_code: str = Form(...),
    candidate_roll: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Accepts a PDF, applies DWT-SVD robust and visible watermarks for center/candidate,
    and returns the watermarked PDF.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for watermarking.")
        
    try:
        content = await file.read()
        watermarked_pdf = embed_watermark_in_pdf(content, center_code, candidate_roll)
        
        return Response(
            content=watermarked_pdf,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=watermarked_{file.filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watermark embedding failed: {str(e)}")

@router.post("/extract")
async def extract_watermark(
    file: UploadFile = File(...)
):
    """
    Accepts a scanned image page, extracts the embedded watermark, and returns metadata.
    """
    try:
        content = await file.read()
        # For simplicity, we can extract from either pdf or image bytes
        result = extract_watermark_from_image(content)
        if result.get("status") == "ERROR":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watermark extraction failed: {str(e)}")
