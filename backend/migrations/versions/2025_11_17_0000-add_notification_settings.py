"""Add NotificationSettings model

Revision ID: add_notification_settings
Revises: add_email_activation
Create Date: 2025-11-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_notification_settings'
down_revision = 'add_email_activation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаем таблицу notification_settings
    op.create_table(
        'notification_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('enable_deadline_notifications', sa.Boolean(), nullable=True),
        sa.Column('enable_news_notifications', sa.Boolean(), nullable=True),
        sa.Column('deadline_days_before', sa.JSON(), nullable=True),
        sa.Column('extra_settings', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_notification_settings_id'), 'notification_settings', ['id'], unique=False)


def downgrade() -> None:
    # Удаляем таблицу notification_settings
    op.drop_index(op.f('ix_notification_settings_id'), table_name='notification_settings')
    op.drop_table('notification_settings')

