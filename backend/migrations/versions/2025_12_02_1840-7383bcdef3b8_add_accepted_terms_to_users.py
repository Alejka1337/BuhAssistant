"""add accepted_terms to users

Revision ID: 7383bcdef3b8
Revises: 412120d6733a
Create Date: 2025-12-02 18:40:28.249723

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7383bcdef3b8'
down_revision = '412120d6733a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем поле accepted_terms
    op.add_column('users', sa.Column('accepted_terms', sa.Boolean(), nullable=False, server_default='false'))
    
    # Добавляем поле terms_accepted_at
    op.add_column('users', sa.Column('terms_accepted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Удаляем поля в обратном порядке
    op.drop_column('users', 'terms_accepted_at')
    op.drop_column('users', 'accepted_terms')

