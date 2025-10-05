"""Initial database schema for Sales Call Analysis System

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-01-05

Creates tables:
- users: User registration, voice model metadata, retention settings
- calls: Uploaded call metadata, processing status, deletion schedule
- segments: Per-segment transcription, speaker, emotion scores
- alerts: Generated recommendations with timestamps
- emotion_feedback: User corrections for continuous learning
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('role', sa.String(), server_default='seller', nullable=True),
        sa.Column('voice_trained', sa.Boolean(), server_default=text('0'), nullable=True),
        sa.Column('model_path', sa.String(), nullable=True),
        sa.Column('gmm_threshold', sa.Float(), nullable=True),
        sa.Column('audio_retention_days', sa.Integer(), server_default=text('7'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    
    # Note: CHECK constraint for retention days removed due to SQLite limitations
    
    # Calls table
    op.create_table(
        'calls',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('audio_path', sa.String(), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('detected_language', sa.String(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('analyzed', sa.Boolean(), server_default=text('0'), nullable=True),
        sa.Column('audio_deleted', sa.Boolean(), server_default=text('0'), nullable=True),
        sa.Column('auto_delete_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for calls table
    op.create_index('idx_calls_user_uploaded', 'calls', ['user_id', 'uploaded_at'])
    op.create_index(
        'idx_calls_auto_delete',
        'calls',
        ['auto_delete_at'],
        postgresql_where=text('audio_deleted = 0')
    )
    
    # Segments table
    op.create_table(
        'segments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('call_id', sa.String(), nullable=False),
        sa.Column('segment_number', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Float(), nullable=False),
        sa.Column('end_time', sa.Float(), nullable=False),
        sa.Column('speaker', sa.String(), nullable=False),
        sa.Column('transcript', sa.String(), nullable=True),
        sa.Column('enthusiasm', sa.Float(), nullable=True),
        sa.Column('agreement', sa.Float(), nullable=True),
        sa.Column('stress', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['call_id'], ['calls.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add CHECK constraints for emotion scores (0-10 range)
    op.create_check_constraint(
        'chk_enthusiasm',
        'segments',
        'enthusiasm IS NULL OR (enthusiasm >= 0 AND enthusiasm <= 10)'
    )
    op.create_check_constraint(
        'chk_agreement',
        'segments',
        'agreement IS NULL OR (agreement >= 0 AND agreement <= 10)'
    )
    op.create_check_constraint(
        'chk_stress',
        'segments',
        'stress IS NULL OR (stress >= 0 AND stress <= 10)'
    )
    
    # Create index for segments
    op.create_index('idx_segments_call', 'segments', ['call_id', 'segment_number'])
    
    # Alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('call_id', sa.String(), nullable=False),
        sa.Column('timestamp', sa.Float(), nullable=False),
        sa.Column('alert_type', sa.String(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('recommendation', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['call_id'], ['calls.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for alerts
    op.create_index('idx_alerts_call', 'alerts', ['call_id', 'timestamp'])
    
    # Emotion Feedback table
    op.create_table(
        'emotion_feedback',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('segment_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('original_enthusiasm', sa.Float(), nullable=True),
        sa.Column('corrected_enthusiasm', sa.Float(), nullable=True),
        sa.Column('original_agreement', sa.Float(), nullable=True),
        sa.Column('corrected_agreement', sa.Float(), nullable=True),
        sa.Column('original_stress', sa.Float(), nullable=True),
        sa.Column('corrected_stress', sa.Float(), nullable=True),
        sa.Column('feedback_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('used_for_training', sa.Boolean(), server_default=text('0'), nullable=True),
        sa.ForeignKeyConstraint(['segment_id'], ['segments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for feedback
    op.create_index(
        'idx_feedback_unused',
        'emotion_feedback',
        ['used_for_training'],
        postgresql_where=text('used_for_training = 0')
    )


def downgrade() -> None:
    op.drop_index('idx_feedback_unused', table_name='emotion_feedback')
    op.drop_table('emotion_feedback')
    
    op.drop_index('idx_alerts_call', table_name='alerts')
    op.drop_table('alerts')
    
    op.drop_index('idx_segments_call', table_name='segments')
    op.drop_table('segments')
    
    op.drop_index('idx_calls_auto_delete', table_name='calls')
    op.drop_index('idx_calls_user_uploaded', table_name='calls')
    op.drop_table('calls')
    
    op.drop_table('users')
