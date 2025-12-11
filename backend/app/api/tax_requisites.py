from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
import os

from app.db.database import get_db
from app.models.tax_requisite import TaxRequisite, TaxRequisiteType
from app.schemas.tax_requisite import (
    TaxRequisiteResponse,
    TaxRequisiteListResponse,
    UploadResponse,
    DeleteResponse
)
from app.services.tax_requisite_parser import (
    parse_esv_csv, parse_tax_csv, 
    parse_esv_xlsx, parse_esv_xlsx_simple, parse_tax_xlsx_simple,
    parse_esv_xls, parse_esv_xls_simple, parse_tax_xls_simple,
    is_xls_file
)


router = APIRouter(prefix="/api/tax-requisites", tags=["tax-requisites"])


@router.post("/upload-esv", response_model=UploadResponse)
async def upload_esv_file(
    file: UploadFile = File(..., description="CSV або XLSX файл з реквізитами ЄСВ"),
    region: str = Form(..., description="Область (наприклад: Київ)"),
    x_admin_password: str = Header(..., description="Пароль адміністратора"),
    db: Session = Depends(get_db)
):
    """
    Завантаження CSV або XLSX файлу з реквізитами ЄСВ
    
    Потрібен пароль адміністратора в заголовку X-Admin-Password
    
    Файл повинен містити колонки:
    - Банк отримувача
    - Назва органу ДПС
    - Код за ЄДРПОУ
    - Номер рахунку (IBAN)
    - Символ звітності (201 або 204)
    - Категорії платників
    """
    # Перевірка пароля
    expected_password = os.getenv("TAX_REQUISITES_DELETE_PASSWORD")
    
    if not expected_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Пароль для завантаження не налаштовано на сервері"
        )
    
    if x_admin_password != expected_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Невірний пароль адміністратора"
        )
    
    try:
        # Читання файлу
        file_content = await file.read()
        
        # Визначити тип файлу за розширенням та вмістом
        file_extension = file.filename.lower().split('.')[-1]
        
        # Парсинг CSV або XLSX/XLS
        if file_extension in ['xlsx', 'xls']:
            # Автоматичне визначення формату Excel
            if is_xls_file(file_content):
                # Старий формат .xls - використовуємо спрощений парсер
                requisites = parse_esv_xls_simple(file_content, region)
            else:
                # Новий формат .xlsx - використовуємо спрощений парсер
                requisites = parse_esv_xlsx_simple(file_content, region)
        elif file_extension == 'csv':
            requisites = parse_esv_csv(file_content, region)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Непідтримуваний формат файлу: {file_extension}. Підтримуються: CSV, XLSX, XLS"
            )
        
        if not requisites:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл не містить даних з символами звітності 201 або 204"
            )
        
        # Збереження в БД (bulk insert)
        db_requisites = [
            TaxRequisite(**requisite.model_dump())
            for requisite in requisites
        ]
        db.bulk_save_objects(db_requisites)
        db.commit()
        
        return UploadResponse(
            success=True,
            message=f"Успішно імпортовано {len(requisites)} реквізитів для {region}",
            imported_count=len(requisites)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Помилка обробки файлу: {str(e)}"
        )


@router.post("/upload-tax", response_model=UploadResponse)
async def upload_tax_file(
    file: UploadFile = File(..., description="CSV або XLSX файл з реквізитами для податків"),
    region: str = Form(..., description="Область (наприклад: Київ)"),
    x_admin_password: str = Header(..., description="Пароль адміністратора"),
    db: Session = Depends(get_db)
):
    """
    Завантаження CSV або XLSX файлу з реквізитами для податків (ПДФО, Військовий збір, ЄП)
    
    Потрібен пароль адміністратора в заголовку X-Admin-Password
    
    Файл повинен містити колонки:
    - Код обл.
    - Найменування АТО
    - Отримувач
    - Код отримувача (ЄДРПОУ)
    - Банк отримувача
    - Номер рахунку (IBAN)
    - Код класифікації доходів (11010100, 11011000, 11011700, 18050400)
    - Найменування коду класифікації
    """
    # Перевірка пароля
    expected_password = os.getenv("TAX_REQUISITES_DELETE_PASSWORD")
    
    if not expected_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Пароль для завантаження не налаштовано на сервері"
        )
    
    if x_admin_password != expected_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Невірний пароль адміністратора"
        )
    
    try:
        # Читання файлу
        file_content = await file.read()
        
        # Визначити тип файлу за розширенням та вмістом
        file_extension = file.filename.lower().split('.')[-1]
        
        # Парсинг CSV або XLSX/XLS
        if file_extension in ['xlsx', 'xls']:
            # Автоматичне визначення формату Excel
            if is_xls_file(file_content):
                # Старий формат .xls
                requisites = parse_tax_xls_simple(file_content, region)
            else:
                # Новий формат .xlsx
                requisites = parse_tax_xlsx_simple(file_content, region)
        elif file_extension == 'csv':
            requisites = parse_tax_csv(file_content, region)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Непідтримуваний формат файлу: {file_extension}. Підтримуються: CSV, XLSX, XLS"
            )
        
        # Файл повинен мати хоча б ОДИН потрібний код
        if not requisites:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл не містить даних з потрібними кодами класифікації (11010100, 11011000, 11011700, 18050400)"
            )
        
        # Збереження в БД (bulk insert)
        db_requisites = [
            TaxRequisite(**requisite.model_dump())
            for requisite in requisites
        ]
        db.bulk_save_objects(db_requisites)
        db.commit()
        
        return UploadResponse(
            success=True,
            message=f"Успішно імпортовано {len(requisites)} реквізитів для {region}",
            imported_count=len(requisites)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Помилка обробки файлу: {str(e)}"
        )


@router.delete("", response_model=DeleteResponse)
async def delete_all_requisites(
    x_admin_password: str = Header(..., description="Пароль адміністратора"),
    db: Session = Depends(get_db)
):
    """
    Видалення всіх податкових реквізитів з БД
    
    Потрібен пароль адміністратора в заголовку X-Admin-Password
    """
    # Перевірка пароля
    expected_password = os.getenv("TAX_REQUISITES_DELETE_PASSWORD")
    
    if not expected_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Пароль для видалення не налаштовано на сервері"
        )
    
    if x_admin_password != expected_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Невірний пароль адміністратора"
        )
    
    try:
        # Підрахунок записів перед видаленням
        count = db.query(TaxRequisite).count()
        
        # Видалення всіх записів
        db.query(TaxRequisite).delete()
        db.commit()
        
        return DeleteResponse(
            success=True,
            message=f"Успішно видалено {count} реквізитів",
            deleted_count=count
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Помилка видалення: {str(e)}"
        )


@router.get("", response_model=TaxRequisiteListResponse)
async def get_requisites(
    district: str = Query(..., description="Місто/село для пошуку (наприклад: м.Вінниця, с.Агрономічне)"),
    region: str = Query(..., description="Область (наприклад: Вінниця)"),
    type: Optional[TaxRequisiteType] = Query(None, description="Тип податку/збору"),
    limit: int = Query(50, ge=1, le=100, description="Кількість результатів"),
    offset: int = Query(0, ge=0, description="Зміщення для пагінації"),
    db: Session = Depends(get_db)
):
    """
    Отримання податкових реквізитів з фільтрацією
    
    Обов'язкові параметри:
    - district: місто або село (наприклад: м.Вінниця, с.Агрономічне)
    - region: область (наприклад: Вінниця)
    
    Опціональні параметри:
    - type: тип податку/збору для фільтрації
    - limit: кількість результатів на сторінку (1-100, за замовчуванням 50)
    - offset: зміщення для пагінації (за замовчуванням 0)
    
    Логіка:
    - Показуються реквізити для обраного міста/села (district = вказане значення)
    - + реквізити для області (district = NULL, region = вказана область)
    - Це дозволяє бачити як місцеві реквізити (ПДФО, ЄП), так і обласні (ЄСВ, ВЗ)
    """
    try:
        from sqlalchemy import or_, and_
        
        # Базовий запит: реквізити для міста/села АБО реквізити області
        # Військовий збір (military_employees, military_fop) зберігається з district як назвою області,
        # тому для них шукаємо тільки по region
        query = db.query(TaxRequisite).filter(
            or_(
                # Реквізити для конкретного міста/села
                TaxRequisite.district == district,
                # Реквізити області (ЄСВ та інші з district = NULL)
                and_(TaxRequisite.district.is_(None), TaxRequisite.region == region),
                # Військовий збір (зберігається з district як назвою області)
                and_(
                    TaxRequisite.type.in_(['military_employees', 'military_fop']),
                    TaxRequisite.region == region
                )
            )
        )
        
        # Фільтр по типу якщо вказано
        if type:
            query = query.filter(TaxRequisite.type == type)
        
        # Підрахунок загальної кількості
        total = query.count()
        
        # Отримання результатів з пагінацією
        requisites = query.offset(offset).limit(limit).all()
        
        return TaxRequisiteListResponse(
            items=[TaxRequisiteResponse.model_validate(r) for r in requisites],
            total=total,
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Помилка отримання даних: {str(e)}"
        )


@router.get("/districts", response_model=List[str])
async def get_districts(region: Optional[str] = Query(None, description="Фільтр по області")):
    """
    Отримання списку доступних міст/сел
    
    Опціонально можна вказати область для фільтрації
    """
    try:
        from app.db.database import SessionLocal
        db = SessionLocal()
        try:
            query = db.query(TaxRequisite.district).filter(TaxRequisite.district.isnot(None)).distinct()
            
            # Фільтр по області якщо вказано
            if region:
                query = query.filter(TaxRequisite.region == region)
            
            districts = query.order_by(TaxRequisite.district).all()
            return [d[0] for d in districts]
        finally:
            db.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Помилка отримання списку міст/сел: {str(e)}"
        )


@router.get("/regions-with-districts")
async def get_regions_with_districts():
    """
    Отримання структури: область -> [міста/села]
    
    Повертає словник де ключ - область, значення - список міст/сел
    """
    try:
        from app.db.database import SessionLocal
        db = SessionLocal()
        try:
            # Отримати всі унікальні пари (region, district)
            results = db.query(
                TaxRequisite.region,
                TaxRequisite.district
            ).filter(
                TaxRequisite.district.isnot(None)
            ).distinct().order_by(
                TaxRequisite.region,
                TaxRequisite.district
            ).all()
            
            # Згрупувати по регіонах
            regions_dict = {}
            for region, district in results:
                if region not in regions_dict:
                    regions_dict[region] = []
                if district not in regions_dict[region]:
                    regions_dict[region].append(district)
            
            return regions_dict
        finally:
            db.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Помилка отримання структури регіонів: {str(e)}"
        )

