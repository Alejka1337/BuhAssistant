from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from enum import Enum
from app.db.database import Base


class TaxRequisiteType(str, Enum):
    """Тип податкових реквізитів"""
    ESV_EMPLOYEES = "esv_employees"  # ЄСВ за працівників (204)
    ESV_FOP = "esv_fop"  # ЄСВ ФОП 2/3 група (201)
    PDFO_EMPLOYEES = "pdfo_employees"  # ПДФО за працівників (11010100)
    MILITARY_EMPLOYEES = "military_employees"  # Військовий збір за працівників (11011000)
    MILITARY_FOP = "military_fop"  # Військовий збір ФОП 2 група (11011700)
    SINGLE_TAX_FOP = "single_tax_fop"  # Єдиний податок ФОП 2 група (18050400)


class TaxRequisite(Base):
    """Податкові реквізити для сплати податків та зборів"""
    __tablename__ = "tax_requisites"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String(100), nullable=False, index=True)  # Область (Київ, Львів, etc.)
    type = Column(String(50), nullable=False, index=True)  # Тип податку/збору (строка, не enum)
    district = Column(String(200), nullable=True)  # Район (для великих файлів)
    recipient_name = Column(String(500), nullable=False)  # Назва органу ДПС / Отримувач
    recipient_code = Column(String(50), nullable=False)  # Код за ЄДРПОУ
    bank_name = Column(String(200), nullable=False)  # Банк отримувача
    iban = Column(String(34), nullable=False)  # Номер рахунку (IBAN)
    classification_code = Column(String(50), nullable=False)  # Символ звітності / Код класифікації
    description = Column(Text, nullable=True)  # Категорії платників / Найменування коду
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<TaxRequisite(region='{self.region}', type='{self.type}', iban='{self.iban}')>"

