from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.tax_requisite import TaxRequisiteType


class TaxRequisiteBase(BaseModel):
    """Базова схема податкових реквізитів"""
    region: str = Field(..., max_length=100, description="Область (Київ, Львів, etc.)")
    type: str = Field(..., description="Тип податку/збору")
    district: Optional[str] = Field(None, max_length=200, description="Район")
    recipient_name: str = Field(..., max_length=500, description="Назва органу ДПС")
    recipient_code: str = Field(..., max_length=50, description="Код за ЄДРПОУ")
    bank_name: str = Field(..., max_length=200, description="Банк отримувача")
    iban: str = Field(..., max_length=34, description="Номер рахунку (IBAN)")
    classification_code: str = Field(..., max_length=50, description="Код класифікації")
    description: Optional[str] = Field(None, description="Опис / Категорії платників")


class TaxRequisiteCreate(TaxRequisiteBase):
    """Схема для створення податкових реквізитів"""
    pass


class TaxRequisiteResponse(TaxRequisiteBase):
    """Схема відповіді з податковими реквізитами"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TaxRequisiteListResponse(BaseModel):
    """Схема для списку податкових реквізитів з пагінацією"""
    items: List[TaxRequisiteResponse]
    total: int
    limit: int
    offset: int


class UploadResponse(BaseModel):
    """Схема відповіді після завантаження файлу"""
    success: bool
    message: str
    imported_count: int


class DeleteResponse(BaseModel):
    """Схема відповіді після видалення"""
    success: bool
    message: str
    deleted_count: int

