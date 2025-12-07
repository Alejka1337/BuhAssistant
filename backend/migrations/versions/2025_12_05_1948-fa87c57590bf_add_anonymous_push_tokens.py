"""add_anonymous_push_tokens

Revision ID: fa87c57590bf
Revises: 2625d5d03b87
Create Date: 2025-12-05 19:48:39.729669

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fa87c57590bf'
down_revision = '2625d5d03b87'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаём таблицу anonymous_push_tokens
    op.create_table(
        'anonymous_push_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('device_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_active_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_linked_to_user', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Создаём индексы для быстрого поиска
    op.create_index(op.f('ix_anonymous_push_tokens_id'), 'anonymous_push_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_anonymous_push_tokens_token'), 'anonymous_push_tokens', ['token'], unique=True)
    op.create_index(op.f('ix_anonymous_push_tokens_device_id'), 'anonymous_push_tokens', ['device_id'], unique=False)


def downgrade() -> None:
    # Удаляем индексы
    op.drop_index(op.f('ix_anonymous_push_tokens_device_id'), table_name='anonymous_push_tokens')
    op.drop_index(op.f('ix_anonymous_push_tokens_token'), table_name='anonymous_push_tokens')
    op.drop_index(op.f('ix_anonymous_push_tokens_id'), table_name='anonymous_push_tokens')
    
    # Удаляем таблицу
    op.drop_table('anonymous_push_tokens')

