from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.services.auth_service import get_current_user
from app.api.schemas.user_schema import UserResponse
from app.api.schemas.export_schema import ExportFormat, ExportInclude
from app.api.services import export_service


router = APIRouter(
    prefix="/export",
    tags=["Data Export"]
)


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Export user workout data",
    description="Export user's workout data, statistics, and streaks in CSV or PDF format"
)
def export_user_data(
    format: ExportFormat = Query(..., description="Export format (csv or pdf)"),
    include: List[ExportInclude] = Query(
        default=[ExportInclude.ALL],
        description="Data to include: workouts, stats, streaks, exercises, or all"
    ),
    start_date: str = Query(None, description="Start date for filtering (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date for filtering (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Export user data in CSV or PDF format.
    
    **Query Parameters:**
    - format: csv or pdf
    - include: workouts, stats, streaks, exercises, all (can specify multiple)
    - start_date: Optional filter for workout history
    - end_date: Optional filter for workout history
    
    **Returns:** Downloadable file (CSV or PDF)
    """
    
    if format == ExportFormat.CSV:
        # Generate CSV
        csv_data = export_service.generate_csv_export(
            db=db,
            user_id=current_user.id,
            include=include,
            start_date=start_date,
            end_date=end_date
        )
        
        filename = f"fittrack_export_{current_user.id}_{format.value}.csv"
        
        return StreamingResponse(
            iter([csv_data.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    elif format == ExportFormat.PDF:
        # Generate PDF
        pdf_data = export_service.generate_pdf_export(
            db=db,
            user_id=current_user.id,
            include=include,
            start_date=start_date,
            end_date=end_date
        )
        
        filename = f"fittrack_export_{current_user.id}_{format.value}.pdf"
        
        return StreamingResponse(
            iter([pdf_data.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
