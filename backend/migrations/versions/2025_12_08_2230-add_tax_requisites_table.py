"""add_tax_requisites_table

Revision ID: 5a8f9c2d1e3b
Revises: e0771f4d9bb6
Create Date: 2025-12-08 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5a8f9c2d1e3b'
down_revision = 'e0771f4d9bb6'
branch_labels = None
depends_on = None


def upgrade():
    # Create tax_requisites table with String type instead of ENUM
    op.create_table(
        'tax_requisites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('region', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),  # String instead of ENUM
        sa.Column('district', sa.String(length=200), nullable=True),
        sa.Column('recipient_name', sa.String(length=500), nullable=False),
        sa.Column('recipient_code', sa.String(length=50), nullable=False),
        sa.Column('bank_name', sa.String(length=200), nullable=False),
        sa.Column('iban', sa.String(length=34), nullable=False),
        sa.Column('classification_code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_tax_requisites_id', 'tax_requisites', ['id'], unique=False)
    op.create_index('ix_tax_requisites_region', 'tax_requisites', ['region'], unique=False)
    op.create_index('ix_tax_requisites_type', 'tax_requisites', ['type'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index('ix_tax_requisites_type', table_name='tax_requisites')
    op.drop_index('ix_tax_requisites_region', table_name='tax_requisites')
    op.drop_index('ix_tax_requisites_id', table_name='tax_requisites')
    
    # Drop table
    op.drop_table('tax_requisites')

