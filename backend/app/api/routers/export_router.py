from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import io

from app.core.database import get_db
from app.api.services.auth_service import get_current_user
from app.models.user_model import User
from app.api.schemas.export_schema import ExportRequest, ExportFormat
from app.api.services.export_service import get_workout_data, generate_csv, generate_pdf
from app.api.common.response import APIResponse

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.post("/workout-data")
async def export_workout_data(
    export_request: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export workout data in CSV or PDF format.
    
    Security Features:
    - JWT authentication required (only authenticated users)
    - User can only export their own data (user_id from JWT token)
    - No data from cache, always fresh from database
    
    Parameters:
    - format: 'csv' or 'pdf'
    - time_range: 'last_week', 'last_month', 'last_3_months', 'last_6_months', 
                  'last_year', 'last_2_years', 'all_time'
    """
    
    try:
        # SECURITY: Always use current_user.id from JWT token (not from request body)
        # This ensures users can ONLY export their own data
        data = get_workout_data(db, current_user.id, export_request.time_range)
        
        if export_request.format == ExportFormat.CSV:
            csv_content = generate_csv(data)
            
            # Return as downloadable file
            return StreamingResponse(
                io.StringIO(csv_content),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=workout_data_{export_request.time_range.value}_{datetime.now().strftime('%Y%m%d')}.csv"
                }
            )
        
        elif export_request.format == ExportFormat.PDF:
            pdf_content = generate_pdf(data)
            
            # Return as downloadable file
            return StreamingResponse(
                io.BytesIO(pdf_content),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename=workout_data_{export_request.time_range.value}_{datetime.now().strftime('%Y%m%d')}.pdf"
                }
            )
    
    except Exception as e:
        import traceback
        print(f"Export error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate export: {str(e)}"
        )
