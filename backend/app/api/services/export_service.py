from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.exercise_model import Exercise
from app.models.user_stats_model import UserStats
from app.api.schemas.export_schema import ExportTimeRange

def get_date_range(time_range: ExportTimeRange) -> datetime:
    """Calculate the start date based on the time range."""
    now = datetime.now()
    
    if time_range == ExportTimeRange.LAST_WEEK:
        return now - timedelta(days=7)
    elif time_range == ExportTimeRange.LAST_MONTH:
        return now - timedelta(days=30)
    elif time_range == ExportTimeRange.LAST_3_MONTHS:
        return now - timedelta(days=90)
    elif time_range == ExportTimeRange.LAST_6_MONTHS:
        return now - timedelta(days=180)
    elif time_range == ExportTimeRange.LAST_YEAR:
        return now - timedelta(days=365)
    elif time_range == ExportTimeRange.LAST_2_YEARS:
        return now - timedelta(days=730)
    else:  # ALL_TIME
        return datetime(2000, 1, 1)  # Arbitrary old date

def get_workout_data(db: Session, user_id: int, time_range: ExportTimeRange) -> Dict[str, Any]:
    """Fetch workout data for the specified user and time range."""
    start_date = get_date_range(time_range)
    
    # Convert datetime to Unix timestamp in MILLISECONDS (bigint) for comparison
    # Database stores timestamps in milliseconds
    start_timestamp = int(start_date.timestamp() * 1000)
    
    # Get all workout sessions
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.start_time >= start_timestamp
    ).order_by(WorkoutSession.start_time.desc()).all()
    
    # Compile workout details
    workout_details = []
    total_volume = 0
    total_sets = 0
    total_reps = 0
    total_duration = 0
    
    for session in sessions:
        exercises = db.query(WorkoutExercise).filter(
            WorkoutExercise.workout_session_id == session.id
        ).all()
        
        for workout_exercise in exercises:
            # Try to get muscle group from Exercise library, but use exercise_name from WorkoutExercise
            exercise_info = db.query(Exercise).filter(Exercise.name == workout_exercise.exercise_name).first()
            
            sets = db.query(WorkoutSet).filter(
                WorkoutSet.workout_exercise_id == workout_exercise.id
            ).all()
            
            for set_data in sets:
                # Convert Unix timestamp to datetime for display
                # Handle both seconds and milliseconds timestamps
                if isinstance(session.start_time, (int, float)):
                    timestamp = session.start_time / 1000 if session.start_time > 10000000000 else session.start_time
                    session_datetime = datetime.fromtimestamp(timestamp)
                else:
                    session_datetime = session.start_time
                
                # Calculate stats from filtered data
                try:
                    weight_val = float(set_data.weight) if set_data.weight else 0
                    reps_val = int(set_data.reps) if set_data.reps and str(set_data.reps).isdigit() else 0
                    total_volume += weight_val * reps_val
                    total_sets += 1
                    total_reps += reps_val
                except (ValueError, TypeError):
                    pass  # Skip if weight/reps can't be converted
                    
                workout_details.append({
                    'date': session_datetime.strftime('%Y/%m/%d %H:%M') if hasattr(session_datetime, 'strftime') else str(session.start_time),
                    'exercise': workout_exercise.exercise_name,
                    'muscle_group': exercise_info.muscle_group.value if exercise_info and exercise_info.muscle_group else 'N/A',
                    'weight': str(set_data.weight) if set_data.weight else '0',
                    'reps': str(set_data.reps) if set_data.reps else '0',
                    'set_number': set_data.position + 1,  # Convert 0-indexed position to 1-indexed set number
                    'duration': round(session.elapsed_seconds / 60, 1) if session.elapsed_seconds else 0
                })
        
        # Add to total duration
        if session.elapsed_seconds:
            total_duration += session.elapsed_seconds
    
    # Calculate average workout duration for filtered workouts
    avg_duration = (total_duration / 60 / len(sessions)) if sessions else 0
    
    return {
        'workouts': workout_details,
        'stats': {
            'total_workouts': len(sessions),
            'total_volume': total_volume,
            'total_sets': total_sets,
            'total_reps': total_reps,
            'avg_workout_duration': round(avg_duration, 1)
        },
        'user_id': user_id,
        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'time_range': time_range.value
    }

def generate_csv(data: Dict[str, Any]) -> str:
    """Generate CSV file from workout data."""
    output = io.StringIO()
    
    # Write stats summary
    writer = csv.writer(output)
    writer.writerow(['Workout Data Export'])
    writer.writerow(['Generated:', data['generated_at']])
    writer.writerow(['Time Range:', data['time_range'].replace('_', ' ').title()])
    writer.writerow([])
    
    # Write statistics
    writer.writerow(['Statistics'])
    writer.writerow(['Total Workouts:', data['stats']['total_workouts']])
    writer.writerow(['Total Volume (lbs):', f"{data['stats']['total_volume']:.1f}"])
    writer.writerow(['Total Sets:', data['stats']['total_sets']])
    writer.writerow(['Total Reps:', data['stats']['total_reps']])
    writer.writerow(['Avg Workout Duration (min):', f"{data['stats']['avg_workout_duration']:.1f}"])
    writer.writerow([])
    
    # Write workout details
    writer.writerow(['Workout Details'])
    writer.writerow(['Date', 'Exercise', 'Muscle Group', 'Set Number', 'Weight (lbs)', 'Reps', 'Duration (min)'])
    
    # Group workouts by date/session for better separation
    current_date = None
    for workout in data['workouts']:
        # Add separator row between different workout sessions
        if current_date and current_date != workout['date']:
            writer.writerow(['---', '---', '---', '---', '---', '---', '---'])
        
        writer.writerow([
            workout['date'],
            workout['exercise'],
            str(workout['muscle_group']) if workout['muscle_group'] else 'N/A',
            workout['set_number'],
            str(workout['weight']) if workout['weight'] else '0',
            str(workout['reps']) if workout['reps'] else '0',
            workout['duration']
        ])
        current_date = workout['date']
    
    return output.getvalue()

def generate_pdf(data: Dict[str, Any]) -> bytes:
    """Generate PDF file from workout data."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Build content
    content = []
    
    # Title
    content.append(Paragraph("Workout Data Export", title_style))
    content.append(Spacer(1, 0.2*inch))
    
    # Metadata
    meta_data = [
        ['Generated:', data['generated_at']],
        ['Time Range:', data['time_range'].replace('_', ' ').title()],
    ]
    meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(meta_table)
    content.append(Spacer(1, 0.3*inch))
    
    # Statistics Section
    content.append(Paragraph("Statistics Summary", heading_style))
    
    stats_data = [
        ['Metric', 'Value'],
        ['Total Workouts', str(data['stats']['total_workouts'])],
        ['Total Volume (lbs)', f"{data['stats']['total_volume']:.1f}"],
        ['Total Sets', str(data['stats']['total_sets'])],
        ['Total Reps', str(data['stats']['total_reps'])],
        ['Avg Duration (min)', f"{data['stats']['avg_workout_duration']:.1f}"],
    ]
    
    stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    
    content.append(stats_table)
    content.append(Spacer(1, 0.4*inch))
    
    # Workout Details Section
    if data['workouts']:
        content.append(Paragraph("Workout Details", heading_style))
        content.append(Spacer(1, 0.1*inch))
        
        # Split into chunks for pagination
        workout_data = [['Date', 'Exercise', 'Muscle', 'Set', 'Weight', 'Reps']]
        
        # Group workouts by session for alternating colors
        current_date = None
        row_colors = []
        color_toggle = True
        
        for workout in data['workouts']:
            muscle_str = str(workout['muscle_group']) if workout['muscle_group'] else 'N/A'
            exercise_str = str(workout['exercise']) if workout['exercise'] else 'Unknown'
            
            # Toggle color when workout session changes
            if current_date and current_date != workout['date']:
                color_toggle = not color_toggle
            
            workout_data.append([
                workout['date'],
                exercise_str[:20],  # Truncate long names
                muscle_str[:12],
                str(workout['set_number']),
                str(workout['weight']) if workout['weight'] else '0',
                str(workout['reps']) if workout['reps'] else '0'
            ])
            
            # Assign color based on workout session
            row_colors.append(colors.white if color_toggle else colors.Color(0.95, 0.95, 0.95))
            current_date = workout['date']
        
        # Create table with proper column widths for letter size
        workout_table = Table(workout_data, colWidths=[1.3*inch, 1.8*inch, 1*inch, 0.5*inch, 0.7*inch, 0.5*inch])
        
        # Build style with alternating colors per workout session
        table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]
        
        # Add alternating row colors per workout session
        for i, color in enumerate(row_colors, start=1):
            table_style.append(('BACKGROUND', (0, i), (-1, i), color))
        
        workout_table.setStyle(TableStyle(table_style))
        
        content.append(workout_table)
    else:
        content.append(Paragraph("No workout data available for the selected time range.", styles['Normal']))
    
    # Build PDF
    doc.build(content)
    
    return buffer.getvalue()
