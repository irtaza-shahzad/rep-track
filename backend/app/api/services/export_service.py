import csv
import io
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.models.user_model import User
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.streak_model import Streak
from app.api.schemas.export_schema import ExportInclude


def get_user_workout_data(
    db: Session, 
    user_id: int, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None
):
    """Fetch all workout data for a user with optional date filtering."""
    query = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id)
    
    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(WorkoutSession.start_time >= start_dt)
    
    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        query = query.filter(WorkoutSession.start_time <= end_dt)
    
    return query.order_by(WorkoutSession.start_time.desc()).all()


def get_user_stats(db: Session, user_id: int):
    """Calculate user statistics."""
    workouts = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id).all()
    
    total_workouts = len(workouts)
    total_volume = 0
    total_sets = 0
    total_exercises = 0
    
    for workout in workouts:
        for exercise in workout.workout_exercises:
            total_exercises += 1
            for set_data in exercise.workout_sets:
                total_sets += 1
                if set_data.weight and set_data.reps:
                    total_volume += set_data.weight * set_data.reps
    
    return {
        "total_workouts": total_workouts,
        "total_volume": round(total_volume, 2),
        "total_sets": total_sets,
        "total_exercises": total_exercises,
        "avg_sets_per_workout": round(total_sets / total_workouts, 2) if total_workouts > 0 else 0,
        "avg_exercises_per_workout": round(total_exercises / total_workouts, 2) if total_workouts > 0 else 0
    }


def get_user_streak_data(db: Session, user_id: int):
    """Fetch user streak information."""
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    
    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "workouts_this_week": 0,
            "target_days_per_week": 0,
            "week_start_date": None
        }
    
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "workouts_this_week": streak.workouts_this_week,
        "target_days_per_week": streak.target_days_per_week,
        "week_start_date": streak.week_start_date.strftime("%Y-%m-%d") if streak.week_start_date else None
    }


def generate_csv_export(
    db: Session,
    user_id: int,
    include: List[ExportInclude],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> io.StringIO:
    """Generate CSV export with user data."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Get user info
    user = db.query(User).filter(User.id == user_id).first()
    
    # Header
    writer.writerow(["FitTrack - Workout Data Export"])
    writer.writerow([f"User: {user.name} ({user.email})"])
    writer.writerow([f"Export Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
    writer.writerow([])
    
    # Include workouts
    if ExportInclude.WORKOUTS in include or ExportInclude.ALL in include:
        writer.writerow(["=== WORKOUT HISTORY ==="])
        writer.writerow(["Date", "Workout Name", "Duration (min)", "Exercise", "Sets", "Reps", "Weight", "Notes"])
        
        workouts = get_user_workout_data(db, user_id, start_date, end_date)
        for workout in workouts:
            workout_date = workout.start_time.strftime("%Y-%m-%d %H:%M") if workout.start_time else "N/A"
            duration = round((workout.end_time - workout.start_time).total_seconds() / 60) if workout.end_time and workout.start_time else 0
            
            for exercise in workout.workout_exercises:
                exercise_name = exercise.exercise.name if exercise.exercise else "Unknown"
                
                for set_data in exercise.workout_sets:
                    writer.writerow([
                        workout_date,
                        workout.name or "Unnamed Workout",
                        duration,
                        exercise_name,
                        set_data.set_number,
                        set_data.reps or "",
                        set_data.weight or "",
                        set_data.notes or ""
                    ])
        
        writer.writerow([])
    
    # Include stats
    if ExportInclude.STATS in include or ExportInclude.ALL in include:
        writer.writerow(["=== STATISTICS ==="])
        stats = get_user_stats(db, user_id)
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Workouts", stats["total_workouts"]])
        writer.writerow(["Total Volume (lbs)", stats["total_volume"]])
        writer.writerow(["Total Sets", stats["total_sets"]])
        writer.writerow(["Total Exercises", stats["total_exercises"]])
        writer.writerow(["Avg Sets per Workout", stats["avg_sets_per_workout"]])
        writer.writerow(["Avg Exercises per Workout", stats["avg_exercises_per_workout"]])
        writer.writerow([])
    
    # Include streaks
    if ExportInclude.STREAKS in include or ExportInclude.ALL in include:
        writer.writerow(["=== STREAK DATA ==="])
        streak = get_user_streak_data(db, user_id)
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Current Streak (days)", streak["current_streak"]])
        writer.writerow(["Longest Streak (days)", streak["longest_streak"]])
        writer.writerow(["Workouts This Week", streak["workouts_this_week"]])
        writer.writerow(["Target Days Per Week", streak["target_days_per_week"]])
        writer.writerow(["Week Start Date", streak["week_start_date"] or "N/A"])
        writer.writerow([])
    
    output.seek(0)
    return output


def generate_pdf_export(
    db: Session,
    user_id: int,
    include: List[ExportInclude],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> io.BytesIO:
    """Generate PDF export with user data."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                          topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a56db'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1a56db'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Get user info
    user = db.query(User).filter(User.id == user_id).first()
    
    # Title
    elements.append(Paragraph("FitTrack Workout Report", title_style))
    elements.append(Spacer(1, 12))
    
    # User info
    user_info = f"<b>User:</b> {user.name}<br/><b>Email:</b> {user.email}<br/><b>Export Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    elements.append(Paragraph(user_info, styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Statistics Section
    if ExportInclude.STATS in include or ExportInclude.ALL in include:
        elements.append(Paragraph("Statistics Overview", heading_style))
        stats = get_user_stats(db, user_id)
        
        stats_data = [
            ['Metric', 'Value'],
            ['Total Workouts', str(stats['total_workouts'])],
            ['Total Volume', f"{stats['total_volume']} lbs"],
            ['Total Sets', str(stats['total_sets'])],
            ['Total Exercises', str(stats['total_exercises'])],
            ['Avg Sets/Workout', str(stats['avg_sets_per_workout'])],
            ['Avg Exercises/Workout', str(stats['avg_exercises_per_workout'])]
        ]
        
        stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(stats_table)
        elements.append(Spacer(1, 20))
    
    # Streak Section
    if ExportInclude.STREAKS in include or ExportInclude.ALL in include:
        elements.append(Paragraph("Streak Information", heading_style))
        streak = get_user_streak_data(db, user_id)
        
        streak_data = [
            ['Metric', 'Value'],
            ['Current Streak', f"{streak['current_streak']} days"],
            ['Longest Streak', f"{streak['longest_streak']} days"],
            ['Workouts This Week', str(streak['workouts_this_week'])],
            ['Weekly Target', f"{streak['target_days_per_week']} days"],
            ['Week Start', streak['week_start_date'] or 'N/A']
        ]
        
        streak_table = Table(streak_data, colWidths=[3*inch, 2*inch])
        streak_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(streak_table)
        elements.append(Spacer(1, 20))
    
    # Workout History Section
    if ExportInclude.WORKOUTS in include or ExportInclude.ALL in include:
        elements.append(PageBreak())
        elements.append(Paragraph("Workout History", heading_style))
        
        workouts = get_user_workout_data(db, user_id, start_date, end_date)
        
        for workout in workouts[:20]:  # Limit to 20 most recent workouts for PDF
            workout_date = workout.start_time.strftime("%Y-%m-%d %H:%M") if workout.start_time else "N/A"
            duration = round((workout.end_time - workout.start_time).total_seconds() / 60) if workout.end_time and workout.start_time else 0
            
            workout_title = f"<b>{workout.name or 'Unnamed Workout'}</b> - {workout_date} ({duration} min)"
            elements.append(Paragraph(workout_title, styles['Normal']))
            elements.append(Spacer(1, 6))
            
            workout_data = [['Exercise', 'Set', 'Reps', 'Weight', 'Notes']]
            
            for exercise in workout.workout_exercises:
                exercise_name = exercise.exercise.name if exercise.exercise else "Unknown"
                
                for set_data in exercise.workout_sets:
                    workout_data.append([
                        exercise_name,
                        str(set_data.set_number),
                        str(set_data.reps or '-'),
                        f"{set_data.weight or '-'} lbs" if set_data.weight else '-',
                        set_data.notes[:20] + '...' if set_data.notes and len(set_data.notes) > 20 else (set_data.notes or '-')
                    ])
            
            workout_table = Table(workout_data, colWidths=[1.5*inch, 0.7*inch, 0.7*inch, 1*inch, 2.5*inch])
            workout_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            
            elements.append(workout_table)
            elements.append(Spacer(1, 15))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
