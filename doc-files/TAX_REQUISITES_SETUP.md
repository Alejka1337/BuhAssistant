# Tax Requisites System - Documentation

## Overview

Система податкових реквізитів дозволяє бухгалтерам швидко знаходити реквізити для сплати податків та зборів по всім областям України.

## Features

- ✅ Завантаження CSV файлів з реквізитами (ЄСВ та інші податки)
- ✅ Пошук реквізитів по області та типу податку
- ✅ 6 типів податків та зборів
- ✅ Копіювання IBAN одним кліком
- ✅ Пагінація результатів (10 на сторінку)
- ✅ Доступно тільки у веб-версії

## Tax Types Supported

1. **ЄСВ за працівників** (Символ звітності: 204)
2. **ЄСВ ФОП 2/3 група** (Символ звітності: 201)
3. **ПДФО за працівників** (Код класифікації: 11010100)
4. **Військовий збір за працівників** (Код класифікації: 11011000)
5. **Військовий збір ФОП 2 група** (Код класифікації: 11011700)
6. **Єдиний податок ФОП 2 група** (Код класифікації: 18050400)

## CSV File Formats

### 1. ESV File (Малий файл з ЄСВ)

**Example filename:** `Київ ЄСВ.csv`

**Columns (tab-separated):**
- Банк отримувача
- Назва органу ДПС (отримувач)
- Код за ЄДРПОУ органу ДПС (код отримувача)
- Номер рахунку (IBAN)
- Символ звітності (201 або 204)
- Категорії платників єдиного внеску

**Example row:**
```
Казначейство України (ЕАП)	Головне управління ДПС у м. Києві	44116011	UA888999980000355669201022615	201	Єдиний внесок ФОП 2/3 група
```

### 2. Tax File (Великий файл з іншими податками)

**Example filename:** `Київ.csv`

**Columns (tab-separated):**
- Код обл.
- Найменування адміністративно-териториальної одиниці України
- Отримувач (найменування органу Казначейства)
- Код отримувача (ЄДРПОУ)
- Банк отримувача
- Номер рахунку (IBAN)
- Код класифікації доходів бюджету
- Найменування коду класифікації доходів бюджету

**Example row:**
```
26	ГОЛОСІЇВСЬКИЙ	ГУК у м.Києві/Голосіїв.р-н/11010100	37993783	Казначейство України(ел. адм. подат.)	UA638999980333129340000026002	11010100	Податок на доходи фізичних осіб
```

### Converting XLS to CSV

1. Open the `.xls` file in Excel
2. File → Save As → CSV (Tab delimited) (*.csv)
3. Save with UTF-8 encoding if possible

## API Endpoints

### 1. Upload ESV File

```
POST /api/tax-requisites/upload-esv
```

**Authorization:** Required (Moderator/Admin role)

**Parameters:**
- `file` (multipart/form-data): CSV file
- `region` (form-data): Region name (e.g., "Київ")

**Response:**
```json
{
  "success": true,
  "message": "Успішно імпортовано 5 реквізитів для Київ",
  "imported_count": 5
}
```

### 2. Upload Tax File

```
POST /api/tax-requisites/upload-tax
```

**Authorization:** Required (Moderator/Admin role)

**Parameters:**
- `file` (multipart/form-data): CSV file
- `region` (form-data): Region name (e.g., "Київ")

**Response:**
```json
{
  "success": true,
  "message": "Успішно імпортовано 24 реквізити для Київ",
  "imported_count": 24
}
```

### 3. Get Requisites

```
GET /api/tax-requisites
```

**Authorization:** Not required (public endpoint)

**Query Parameters:**
- `region` (required): Region name
- `type` (optional): Tax type filter
- `limit` (optional, default: 50): Items per page
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "region": "Київ",
      "type": "esv_employees",
      "district": null,
      "recipient_name": "Головне управління ДПС у м. Києві",
      "recipient_code": "44116011",
      "bank_name": "Казначейство України (ЕАП)",
      "iban": "UA888999980000355669201022615",
      "classification_code": "204",
      "description": "Єдиний внесок за працівників",
      "created_at": "2025-12-08T20:30:00Z"
    }
  ],
  "total": 29,
  "limit": 50,
  "offset": 0
}
```

### 4. Get Regions

```
GET /api/tax-requisites/regions
```

**Authorization:** Not required

**Response:**
```json
["Київ", "Львів", "Одеса", ...]
```

### 5. Delete All Requisites

```
DELETE /api/tax-requisites
```

**Authorization:** Required (Admin password)

**Headers:**
- `X-Admin-Password`: Admin password (from env variable)

**Response:**
```json
{
  "success": true,
  "message": "Успішно видалено 150 реквізитів",
  "deleted_count": 150
}
```

## Upload Instructions (via Swagger)

1. **Open Swagger UI:**
   - Local: http://localhost:8000/api/docs
   - Production: https://api.eglavbuh.com.ua/api/docs

2. **Authenticate:**
   - Click "Authorize" button
   - Enter JWT token (get from login endpoint)
   - Must have moderator or admin role

3. **Upload ESV File:**
   - Expand `POST /api/tax-requisites/upload-esv`
   - Click "Try it out"
   - Choose CSV file
   - Enter region name (e.g., "Київ")
   - Click "Execute"

4. **Upload Tax File:**
   - Expand `POST /api/tax-requisites/upload-tax`
   - Click "Try it out"
   - Choose CSV file
   - Enter region name (same as ESV file)
   - Click "Execute"

5. **Verify Upload:**
   - Expand `GET /api/tax-requisites`
   - Enter region name
   - Click "Execute"
   - Should see imported requisites

## Frontend Usage

### Web Interface

1. **Access:** https://eglavbuh.com/tax-requisites

2. **Search:**
   - Select region from dropdown
   - Optionally select tax type
   - Click "Знайти"

3. **Results:**
   - Table with all matching requisites
   - Click copy icon to copy IBAN
   - Navigate pages if more than 10 results

4. **Features:**
   - Responsive table
   - IBAN copy with success feedback
   - Pagination (10 items per page)
   - Empty state with helpful message

### Mobile App

Mobile apps will show a message that this feature is web-only, with a link to open the website.

## Environment Variables

Add to `backend/.env`:

```bash
# Tax Requisites Admin Password (for delete endpoint)
TAX_REQUISITES_DELETE_PASSWORD=your-secure-password-here
```

## Database

### Table: `tax_requisites`

**Columns:**
- `id` (INTEGER) - Primary key
- `region` (VARCHAR(100)) - Region name, indexed
- `type` (ENUM) - Tax type, indexed
- `district` (VARCHAR(200)) - District (optional)
- `recipient_name` (VARCHAR(500)) - Recipient organization
- `recipient_code` (VARCHAR(50)) - EDRPOU code
- `bank_name` (VARCHAR(200)) - Bank name
- `iban` (VARCHAR(34)) - IBAN account number
- `classification_code` (VARCHAR(50)) - Classification code
- `description` (TEXT) - Description (optional)
- `created_at` (TIMESTAMP) - Created timestamp

**Indexes:**
- Primary key on `id`
- Index on `region`
- Index on `type`

## Deployment Checklist

### Backend

- [ ] Apply Alembic migration: `alembic upgrade head`
- [ ] Install chardet: `pip install -r requirements.txt`
- [ ] Set `TAX_REQUISITES_DELETE_PASSWORD` in `.env`
- [ ] Restart backend: `docker-compose restart backend`
- [ ] Verify endpoints in Swagger

### Frontend

- [ ] Build web version: `npx expo export -p web`
- [ ] Deploy to web server
- [ ] Test navigation links (sidebar, mobile menu)
- [ ] Test search functionality
- [ ] Test IBAN copy

### Data Import

- [ ] Prepare CSV files for all 25 regions
- [ ] Upload ESV files via Swagger
- [ ] Upload Tax files via Swagger
- [ ] Verify data in database
- [ ] Test search for each region

## Troubleshooting

### Issue: CSV parsing fails

**Solution:**
- Check file encoding (should be UTF-8)
- Verify column names match expected format
- Ensure delimiter is tab (`\t`)
- Remove BOM if present

### Issue: No results found

**Solution:**
- Verify region name matches exactly (case-sensitive)
- Check database has data: `SELECT * FROM tax_requisites LIMIT 5;`
- Verify filters are correct

### Issue: Authentication errors on upload

**Solution:**
- Ensure user has moderator or admin role
- Check JWT token is valid and not expired
- Verify `Authorization: Bearer <token>` header

### Issue: Delete endpoint returns 403

**Solution:**
- Check `X-Admin-Password` header is correct
- Verify `TAX_REQUISITES_DELETE_PASSWORD` is set in `.env`
- Restart backend after changing `.env`

## Future Enhancements

- [ ] Admin upload UI (instead of Swagger)
- [ ] Export requisites to PDF
- [ ] Search by EDRPOU code
- [ ] History of changes (audit log)
- [ ] Automatic updates from tax.gov.ua
- [ ] English translations
- [ ] Mobile app support (read-only)

## Support

For questions or issues, contact: dmitrjialekseev16@gmail.com

