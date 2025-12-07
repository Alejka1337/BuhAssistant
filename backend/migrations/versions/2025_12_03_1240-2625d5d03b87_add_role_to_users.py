"""add role to users

Revision ID: 2625d5d03b87
Revises: 4461b8a0667e
Create Date: 2025-12-03 12:40:39.391754

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '2625d5d03b87'
down_revision = '4461b8a0667e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаём enum тип для роли
    user_role_enum = postgresql.ENUM('user', 'moderator', 'admin', name='userrole', create_type=True)
    user_role_enum.create(op.get_bind(), checkfirst=True)
    
    # Добавляем колонку role с дефолтным значением 'user'
    op.add_column('users', sa.Column('role', sa.Enum('user', 'moderator', 'admin', name='userrole'), nullable=False, server_default='user'))
    
    # Убираем server_default после создания (best practice)
    op.alter_column('users', 'role', server_default=None)


def downgrade() -> None:
    # Удаляем колонку
    op.drop_column('users', 'role')
    
    # Удаляем enum тип
    user_role_enum = postgresql.ENUM('user', 'moderator', 'admin', name='userrole')
    user_role_enum.drop(op.get_bind(), checkfirst=True)

