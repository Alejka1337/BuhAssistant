"""Add email activation fields

Revision ID: add_email_activation
Revises: a2649ea01d0f
Create Date: 2025-11-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_email_activation'
down_revision = 'a2649ea01d0f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем поля для активации email
    op.add_column('users', sa.Column('activation_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('activation_code_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f('ix_users_activation_code'), 'users', ['activation_code'], unique=False)


def downgrade() -> None:
    # Удаляем индекс и поля
    op.drop_index(op.f('ix_users_activation_code'), table_name='users')
    op.drop_column('users', 'activation_code_expires_at')
    op.drop_column('users', 'activation_code')

