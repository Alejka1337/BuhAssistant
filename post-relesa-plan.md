# План: Исправление замечаний Apple App Store

## Этап 1: Удаление аккаунта (Guideline 5.1.1v)

### Backend (FastAPI)

**1.1. API endpoint для удаления аккаунта**

Создать новый endpoint в `backend/app/api/auth.py`:

```python
@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Полное удаление аккаунта пользователя.
    - Удаляет все посты и комментарии пользователя
    - Удаляет push token
    - Удаляет notification settings
    - Удаляет самого пользователя
    """
    # 1. Удалить все посты и комментарии
    db.query(Post).filter(Post.author_id == current_user.id).delete()
    db.query(Thread).filter(Thread.author_id == current_user.id).delete()
    
    # 2. Удалить push token и notification settings
    db.query(PushToken).filter(PushToken.user_id == current_user.id).delete()
    db.query(NotificationSettings).filter(NotificationSettings.user_id == current_user.id).delete()
    
    # 3. Удалить пользователя
    db.delete(current_user)
    db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

**1.2. Добавить schema для подтверждения**

В `backend/app/schemas/user.py`:

```python
class AccountDeletionConfirm(BaseModel):
    email: str
    confirmation_text: str  # Пользователь должен ввести "DELETE"
```

### Frontend (React Native)

**1.3. UI для удаления аккаунта в профиле**

Обновить `app/(tabs)/profile.tsx`:

- Добавить секцию "Небезпечна зона" внизу экрана (после "Про додаток")
- Кнопка "Видалити обліковий запис" (красная)
- При клике открывать модальное окно подтверждения

**1.4. Модальное окно подтверждения**

Создать компонент `components/DeleteAccountModal.tsx`:

- Заголовок: "Ви впевнені?"
- Текст предупреждения с последствиями (невозможно восстановить)
- Чекбокс: "Я розумію, що це незворотна дія"
- Input для ввода email для подтверждения
- Две кнопки: "Скасувати" (серая) и "Видалити назавжди" (красная, активна только если чекбокс и email совпадает)

**1.5. Сервис для удаления аккаунта**

В `utils/authService.ts`:

```typescript
export const deleteAccount = async (): Promise<void> => {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}/auth/account`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete account');
  }
  
  // Очистить локальные токены
  await clearTokens();
};
```

---

## Этап 2: Terms of Service / EULA (Guideline 1.2 - требование 1)

### Backend

**2.1. Добавить поле `accepted_terms` в User модель**

В `backend/app/models/user.py`:

```python
class User(Base):
    # ... existing fields
    accepted_terms: bool = Column(Boolean, default=False, nullable=False)
    terms_accepted_at: datetime = Column(DateTime(timezone=True), nullable=True)
```

**2.2. Создать миграцию Alembic**

```bash
alembic revision -m "add accepted_terms to users"
```

**2.3. API endpoint для принятия условий**

В `backend/app/api/auth.py`:

```python
@router.post("/accept-terms")
async def accept_terms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.accepted_terms = True
    current_user.terms_accepted_at = datetime.utcnow()
    db.commit()
    return {"status": "accepted"}
```

### Frontend

**2.4. Создать экран Terms of Service**

Создать файл `app/terms-of-service.tsx`:

- Полный текст EULA на украинском языке
- Секции: Загальні положення, Модерація контенту, Неприпустимий контент, Блокування, Відповідальність
- Кнопка "Погоджуюсь з умовами" внизу (если пришли из регистрации)

**2.5. Обновить регистрацию**

В `app/register.tsx`:

- Добавить чекбокс "Я погоджуюсь з Умовами використання" (с ссылкой на Terms)
- Кнопка регистрации активна только если чекбокс отмечен
- После успешной регистрации отправить `POST /auth/accept-terms`

**2.6. Проверка при входе**

В `contexts/AuthContext.tsx`:

- После логина проверять `user.accepted_terms`
- Если `false`, редиректить на `/terms-of-service` (принудительно)
- После принятия условий вернуть на главную

---

## Этап 3: Жалобы и блокировка (Guideline 1.2 - требования 3 и 4)

### Backend

**3.1. Модель для жалоб**

Создать `backend/app/models/report.py`:

```python
class ContentReport(Base):
    __tablename__ = "content_reports"
    
    id: int = Column(Integer, primary_key=True, index=True)
    reporter_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_type: str = Column(String, nullable=False)  # "thread" or "post"
    content_id: int = Column(Integer, nullable=False)
    reason: str = Column(String, nullable=False)
    details: str = Column(Text, nullable=True)
    status: str = Column(String, default="pending")  # pending, reviewed, dismissed
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: datetime = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id: int = Column(Integer, ForeignKey("users.id"), nullable=True)
```

**3.2. Модель для блокировок**

Создать `backend/app/models/block.py`:

```python
class UserBlock(Base):
    __tablename__ = "user_blocks"
    
    id: int = Column(Integer, primary_key=True, index=True)
    blocker_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    blocked_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now())
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('blocker_id', 'blocked_id'),)
```

**3.3. API endpoints для жалоб**

Создать `backend/app/api/reports.py`:

```python
# POST /api/reports - создать жалобу
# GET /api/reports - список жалоб (только для модераторов)
# PATCH /api/reports/{id} - обработать жалобу (только для модераторов)
```

**3.4. API endpoints для блокировок**

Создать `backend/app/api/blocks.py`:

```python
# POST /api/blocks - заблокировать пользователя
# DELETE /api/blocks/{user_id} - разблокировать пользователя
# GET /api/blocks - список заблокированных пользователей
```

**3.5. Обновить forum endpoints**

В `backend/app/api/forum.py`:

- Фильтровать топики и комментарии заблокированных пользователей
- Не показывать контент от заблокированных пользователей

### Frontend

**3.6. Кнопка "Поскаржитися" для топиков**

В `app/forum/thread/[id].tsx`:

- Добавить меню (три точки) для каждого топика/комментария
- Пункт меню "Поскаржитися"
- Открывает модальное окно с причинами

**3.7. Модальное окно жалобы**

Создать `components/ReportModal.tsx`:

- Выбор причины: Спам, Образа, Неприйнятний контент, Інше
- Текстовое поле для дополнительной информации
- Кнопка "Надіслати скаргу"

**3.8. Кнопка "Заблокувати користувача"**

В меню топика/комментария:

- Пункт "Заблокувати користувача"
- Подтверждение: "Ви не побачите контент цього користувача"
- После блокировки контент исчезает из списка

**3.9. Управление блокировками в профиле**

В `app/(tabs)/profile.tsx`:

- Новая секция "Заблоковані користувачі"
- Список заблокированных с кнопкой "Розблокувати"

---

## Этап 4: Роль модератора (Guideline 1.2 - требование 5)

### Backend

**4.1. Добавить роль модератора**

В `backend/app/models/user.py`:

```python
class User(Base):
    # ... existing fields
    role: str = Column(String, default="user", nullable=False)  # "user", "moderator", "admin"
```

**4.2. Dependency для проверки роли модератора**

В `backend/app/core/deps.py`:

```python
def get_current_moderator(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in ["moderator", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user
```

**4.3. Endpoint для удаления контента**

В `backend/app/api/forum.py`:

```python
@router.delete("/threads/{thread_id}/moderate")
async def moderate_delete_thread(
    thread_id: int,
    ban_user: bool = False,
    moderator: User = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Удалить топик и опционально забанить автора.
    """
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    author_id = thread.author_id
    
    # Удалить топик
    db.delete(thread)
    
    # Забанить пользователя если нужно
    if ban_user:
        author = db.query(User).filter(User.id == author_id).first()
        author.is_active = False
    
    db.commit()
    return {"status": "deleted"}
```

### Frontend

**4.4. Админ-панель для модерации (опционально)**

Создать `app/admin/reports.tsx` (доступно только модераторам):

- Список всех жалоб
- Фильтр по статусу (pending, reviewed, dismissed)
- Для каждой жалобы: контент, причина, кнопки "Видалити контент", "Заблокувати користувача", "Відхилити"

---

## Этап 5: Обновление текстов и документации

**5.1. Создать файл с EULA**

Создать `assets/docs/terms-of-service-uk.md`:

- Полный текст условий использования на украинском
- Акцент на правила модерации и последствия нарушений

**5.2. Обновить Privacy Policy (если есть)**

Добавить информацию о:

- Удалении аккаунта
- Обработке жалоб
- Блокировке пользователей

**5.3. Подготовить ответ для App Review**

После реализации написать в App Store Connect:

```
Dear App Review Team,

We have implemented the following features to comply with Guidelines 5.1.1(v) and 1.2:

1. Account Deletion (Guideline 5.1.1v):
   - Users can now delete their account directly from the Profile screen
   - Path: Profile → Danger Zone → Delete Account
   - The deletion is permanent and removes all user data

2. User-Generated Content Moderation (Guideline 1.2):
   - Users must accept Terms of Service before using the app
   - Report button available for all forum posts and comments
   - Users can block other users to hide their content
   - Dedicated moderation team reviews reports within 24 hours
   - Violating users are banned and content is removed

Thank you for your review.
```

---

## Этап 6: Тестирование и сборка

**6.1. Тестирование удаления аккаунта**

- Создать тестовый аккаунт
- Создать контент (топики, комментарии)
- Удалить аккаунт
- Проверить что контент удален и нельзя войти

**6.2. Тестирование модерации**

- Создать жалобу на контент
- Заблокировать пользователя
- Проверить что контент скрыт
- Разблокировать и проверить что контент появился

**6.3. Обновить buildNumber**

В `app.json`:

```json
"ios": {
  "buildNumber": "11"
}
```

**6.4. Создать новый build**

```bash
eas build --platform ios --profile production
```

**6.5. Отправить на TestFlight**

```bash
eas submit --platform ios --latest
```

---

## Последовательность выполнения

1. Backend: Модели и миграции (User.accepted_terms, ContentReport, UserBlock)
2. Backend: API endpoints (delete account, reports, blocks, moderation)
3. Frontend: Terms of Service экран и интеграция
4. Frontend: Удаление аккаунта (UI + модальное окно)
5. Frontend: Жалобы (кнопка + модальное окно)
6. Frontend: Блокировка пользователей (UI + API интеграция)
7. Backend: Роль модератора и админ endpoints
8. Frontend: Админ-панель (опционально, можно позже)
9. Тестирование всех функций
10. Инкремент buildNumber, сборка, отправка в App Store

## Приоритеты

**Критично для первой отправки:**

- Удаление аккаунта ✅ (быстро, ~2-3 часа)
- Terms of Service ✅ (средне, ~2-3 часа)
- Жалобы на контент ✅ (средне, ~3-4 часа)
- Блокировка пользователей ✅ (средне, ~2-3 часа)

**Можно добавить позже:**

- Админ-панель для модерации (можно временно модерировать через БД)
- Автоматическая фильтрация контента (AI)

**Общее время реализации: ~10-15 часов работы**