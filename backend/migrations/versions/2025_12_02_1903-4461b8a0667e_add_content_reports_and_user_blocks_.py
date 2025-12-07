"""add content_reports and user_blocks tables

Revision ID: 4461b8a0667e
Revises: 7383bcdef3b8
Create Date: 2025-12-02 19:03:03.443239

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4461b8a0667e'
down_revision = '7383bcdef3b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаём таблицу content_reports
    op.create_table(
        'content_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=False),
        sa.Column('reported_user_id', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(length=20), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reported_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_content_reports_id', 'content_reports', ['id'], unique=False)
    op.create_index('ix_content_reports_status', 'content_reports', ['status'], unique=False)
    op.create_index('ix_content_reports_content', 'content_reports', ['content_type', 'content_id'], unique=False)
    
    # Создаём таблицу user_blocks
    op.create_table(
        'user_blocks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('blocker_id', sa.Integer(), nullable=False),
        sa.Column('blocked_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_blocker_blocked')
    )
    op.create_index('ix_user_blocks_id', 'user_blocks', ['id'], unique=False)
    op.create_index('ix_user_blocks_blocker', 'user_blocks', ['blocker_id'], unique=False)


def downgrade() -> None:
    # Удаляем таблицы в обратном порядке
    op.drop_index('ix_user_blocks_blocker', table_name='user_blocks')
    op.drop_index('ix_user_blocks_id', table_name='user_blocks')
    op.drop_table('user_blocks')
    
    op.drop_index('ix_content_reports_content', table_name='content_reports')
    op.drop_index('ix_content_reports_status', table_name='content_reports')
    op.drop_index('ix_content_reports_id', table_name='content_reports')
    op.drop_table('content_reports')

