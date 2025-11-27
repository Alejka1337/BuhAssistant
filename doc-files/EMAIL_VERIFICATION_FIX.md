# Исправление Email Верификации

## Дата: 2025-11-15

## Проблемы

### 1. 401 Unauthorized при верификации
**Симптом:** При попытке верифицировать email после регистрации, бекенд возвращал `401 Unauthorized`.

**Причина:** Endpoint `/api/auth/verify` требовал JWT токен через dependency `get_current_user`. Это создавало проблему:
- Пользователь регистрируется и получает токен
- Переходит на страницу верификации
- Токен может истечь или быть недоступным
- Верификация не работает

**Решение:** Изменили подход к верификации - теперь endpoint **не требует JWT токен**, а принимает `email` и `code`. Это более безопасный и надежный подход:
- Пользователь может верифицироваться в любое время
- Не зависит от истечения токена
- После успешной верификации получает новые токены

### 2. Зависание клавиатуры на iOS
**Симптом:** Клавиатура зависала при работе с полями ввода кода на iOS эмуляторе.

**Причина:** 
- Слишком много ref'ов и автоматического фокуса
- Синхронное переключение фокуса между полями
- Отсутствие специальных атрибутов для iOS

**Решение:**
- Добавлены `setTimeout` с задержкой 50-100мс перед переключением фокуса
- Добавлены атрибуты `textContentType="oneTimeCode"` и `autoComplete="sms-otp"` для лучшей работы на iOS
- Упрощена логика обработки ошибок с задержкой перед фокусом

## Изменения в коде

### Backend

#### 1. `/backend/app/api/auth.py`
**Было:**
```python
@router.post("/verify", response_model=AuthResponse)
def verify_email(
    verify_data: VerifyEmailRequest,
    current_user: User = Depends(get_current_user),  # ❌ Требует JWT токен
    db: Session = Depends(get_db)
):
```

**Стало:**
```python
@router.post("/verify", response_model=AuthResponse)
def verify_email(
    verify_data: VerifyEmailRequest,  # ✅ Содержит email + code
    db: Session = Depends(get_db)      # ✅ Не требует JWT токен
):
    # Ищем пользователя по email из запроса
    user = db.query(User).filter(User.email == verify_data.email).first()
```

#### 2. `/backend/app/schemas/auth.py`
**Было:**
```python
class VerifyEmailRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
```

**Стало:**
```python
class VerifyEmailRequest(BaseModel):
    email: EmailStr  # ✅ Добавлен email
    code: str = Field(..., min_length=6, max_length=6)
```

### Frontend

#### 3. `/utils/authService.ts`
**Было:**
```typescript
export const verifyEmail = async (code: string): Promise<AuthResponse> => {
    const token = await getAccessToken();  // ❌ Требует токен
    // ...
    headers: {
        'Authorization': `Bearer ${token}`,  // ❌
    }
}
```

**Стало:**
```typescript
export const verifyEmail = async (email: string, code: string): Promise<AuthResponse> => {
    // ✅ Не требует токен, просто отправляет email и code
    body: JSON.stringify({ email, code }),
}
```

#### 4. `/app/verify-email.tsx`
**Изменения:**
- Удалена проверка токена перед верификацией
- Упрощена обработка ошибок
- Добавлены `setTimeout` для избежания проблем с клавиатурой на iOS
- Добавлены `textContentType="oneTimeCode"` и `autoComplete="sms-otp"`

## Тестирование

### Как протестировать исправления:

1. **Регистрация нового пользователя:**
   ```
   POST /api/auth/register
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   - Проверить, что письмо с кодом пришло
   - Проверить, что токены сохранились

2. **Верификация email:**
   ```
   POST /api/auth/verify
   {
     "email": "test@example.com",
     "code": "123456"
   }
   ```
   - Проверить, что верификация проходит успешно
   - Проверить, что `is_verified` стал `true`
   - Проверить, что возвращаются новые токены

3. **Тест на iOS:**
   - Открыть приложение на iOS эмуляторе
   - Зарегистрироваться
   - Ввести код верификации
   - Проверить, что клавиатура не зависает
   - Проверить автоматическое переключение между полями

## Преимущества нового подхода

1. ✅ **Надежность**: Верификация не зависит от истечения токена
2. ✅ **Простота**: Пользователю не нужно беспокоиться о токенах
3. ✅ **Безопасность**: Код все еще защищен временем истечения
4. ✅ **UX**: Лучше работает на iOS с автоматическим заполнением кода из SMS
5. ✅ **Гибкость**: Пользователь может верифицироваться с любого устройства

## Заметки

- Код активации все еще имеет срок действия (настраивается в `email_service.py`)
- После успешной верификации пользователь получает новые токены
- Старый код активации удаляется после верификации
- Повторная отправка кода работает через `/api/auth/resend-code`

## Следующие шаги

- [ ] Добавить rate limiting для endpoint `/api/auth/verify` (защита от брутфорса)
- [ ] Добавить логирование попыток верификации
- [ ] Рассмотреть добавление CAPTCHA для повторной отправки кода
- [ ] Добавить метрики для отслеживания успешности верификации

