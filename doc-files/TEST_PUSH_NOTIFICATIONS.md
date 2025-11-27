# 🧪 Тестирование автоматических Push Notifications

## 🎉 СТАТУС: Тестовые уведомления работают! ✅

Теперь нужно протестировать автоматические уведомления:
1. **Дедлайны** (за 1 и 3 дня до отчетности)
2. **Персонализированные новости** (2 раза в неделю)

---

## 📋 Способ 1: Ручной запуск задач через Python

### 1. Проверить дедлайны

```bash
docker-compose exec backend python -c "
from app.tasks.notification_tasks import send_deadline_notifications
result = send_deadline_notifications()
print('Result:', result)
"
```

**Что проверяется:**
- Загрузка календаря из JSON файлов
- Поиск дедлайнов через 1 и 3 дня
- Отправка уведомлений пользователям с включенными настройками
- Форматирование текста уведомления

**Ожидаемый результат:**
```
Result: {'status': 'success', 'notifications_sent': 1}
```

**На iPhone должно прийти:**
```
⏰ Нагадування про дедлайн
[Название отчета] - завтра (DD.MM.YYYY)
```

---

### 2. Проверить новости

```bash
docker-compose exec backend python -c "
from app.tasks.notification_tasks import send_news_notifications
result = send_news_notifications()
print('Result:', result)
"
```

**Что проверяется:**
- Загрузка новостей за последнюю неделю из БД
- Фильтрация по целевой аудитории (user_type)
- Персонализация через OpenAI
- Отправка уведомления с самой релевантной новостью

**Ожидаемый результат:**
```
Result: {'status': 'success', 'notifications_sent': 1}
```

**На iPhone должно прийти:**
```
📰 Нова стаття для вас
[Заголовок новости]
```

---

## 📋 Способ 2: Запуск через Celery (более реалистично)

### 1. Проверить, что Celery работает

```bash
docker-compose logs celery | tail -20
```

Должно быть:
```
[INFO] celery@XXXXX ready.
```

### 2. Запустить задачу дедлайнов вручную

```bash
docker-compose exec backend celery -A app.celery_app call app.tasks.notification_tasks.send_deadline_notifications
```

### 3. Запустить задачу новостей вручную

```bash
docker-compose exec backend celery -A app.celery_app call app.tasks.notification_tasks.send_news_notifications
```

### 4. Проверить логи Celery

```bash
docker-compose logs celery -f
```

Должно показать:
```
[INFO] Task app.tasks.notification_tasks.send_deadline_notifications succeeded
[INFO] Deadline notifications task completed. Sent: 1
```

---

## 📋 Способ 3: Добавить тестовую кнопку в профиль (временно)

### Добавить кнопки для тестирования в `app/(tabs)/profile.tsx`

**После кнопки "Надіслати тестове повідомлення" добавить:**

```tsx
<TouchableOpacity 
  style={[styles.testButton, { marginTop: 10 }]} 
  onPress={handleTestDeadlineNotification}
>
  <MaterialIcons name="event" size={20} color={Colors.white} />
  <Text style={styles.testButtonText}>Тест: Дедлайн уведомление</Text>
</TouchableOpacity>

<TouchableOpacity 
  style={[styles.testButton, { marginTop: 10 }]} 
  onPress={handleTestNewsNotification}
>
  <MaterialIcons name="article" size={20} color={Colors.white} />
  <Text style={styles.testButtonText}>Тест: Новость уведомление</Text>
</TouchableOpacity>
```

**Добавить функции:**

```tsx
const handleTestDeadlineNotification = async () => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.PUSH.TEST_DEADLINE, {
      method: 'POST',
    });
    
    if (response.ok) {
      Alert.alert('Успіх', 'Уведомление о дедлайне отправлено!');
    }
  } catch (error) {
    console.error('Test deadline notification error:', error);
    Alert.alert('Помилка', 'Не вдалося відправити уведомлення.');
  }
};

const handleTestNewsNotification = async () => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.PUSH.TEST_NEWS, {
      method: 'POST',
    });
    
    if (response.ok) {
      Alert.alert('Успіх', 'Уведомление о новости отправлено!');
    }
  } catch (error) {
    console.error('Test news notification error:', error);
    Alert.alert('Помилка', 'Не вдалося відправити уведомлення.');
  }
};
```

**Добавить endpoints в `constants/api.ts`:**

```typescript
PUSH: {
  // ...existing endpoints
  TEST_DEADLINE: `${API_URL}/api/push/test-deadline`,
  TEST_NEWS: `${API_URL}/api/push/test-news`,
}
```

**Добавить endpoints на бэкенде `backend/app/api/push.py`:**

```python
@router.post("/test-deadline", response_model=NotificationResponse)
def test_deadline_notification(
    current_user: User = Depends(get_current_user)
):
    """
    Тестовая отправка уведомления о дедлайне
    """
    if not current_user.push_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Push token not registered for this user"
        )
    
    try:
        result = push_service.send_push_notification(
            push_token=current_user.push_token,
            title="⏰ Нагадування про дедлайн",
            body="Подача звіту ЄСВ - завтра (28.11.2025)",
            data={
                "type": "deadline",
                "report": {"name": "ЄСВ"},
                "date": "28.11.2025",
                "days_before": 1
            }
        )
        
        if result["success"]:
            return NotificationResponse(
                success=True,
                message="Test deadline notification sent successfully",
                details=result
            )
        else:
            return NotificationResponse(
                success=False,
                message=f"Failed to send notification: {result.get('error')}",
                details=result
            )
            
    except Exception as e:
        logger.error(f"Error sending test deadline notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test notification: {str(e)}"
        )


@router.post("/test-news", response_model=NotificationResponse)
def test_news_notification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Тестовая отправка уведомления о новости
    """
    if not current_user.push_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Push token not registered for this user"
        )
    
    try:
        # Получаем последнюю новость из БД
        latest_news = db.query(News).order_by(News.published_at.desc()).first()
        
        if not latest_news:
            # Если нет новостей, отправляем тестовое
            result = push_service.send_push_notification(
                push_token=current_user.push_token,
                title="📰 Нова стаття для вас",
                body="Тестова новина з eGlavBuh",
                data={
                    "type": "news",
                    "news_id": 0,
                    "source": "test"
                }
            )
        else:
            result = push_service.send_push_notification(
                push_token=current_user.push_token,
                title="📰 Нова стаття для вас",
                body=latest_news.title,
                data={
                    "type": "news",
                    "news_id": latest_news.id,
                    "news_url": latest_news.url,
                    "source": latest_news.source
                }
            )
        
        if result["success"]:
            return NotificationResponse(
                success=True,
                message="Test news notification sent successfully",
                details=result
            )
        else:
            return NotificationResponse(
                success=False,
                message=f"Failed to send notification: {result.get('error')}",
                details=result
            )
            
    except Exception as e:
        logger.error(f"Error sending test news notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test notification: {str(e)}"
        )
```

---

## ✅ Checklist для тестирования

### Дедлайны:
- [ ] Запустить вручную через Python
- [ ] Уведомление пришло на iPhone
- [ ] Текст уведомления правильный (название отчета + дата)
- [ ] Data payload правильный (type: "deadline")

### Новости:
- [ ] Запустить вручную через Python
- [ ] Уведомление пришло на iPhone
- [ ] Текст уведомления содержит заголовок новости
- [ ] Data payload правильный (type: "news", news_url)

### Проверка персонализации:
- [ ] Изменить user_type в профиле
- [ ] Запустить send_news_notifications
- [ ] Убедиться, что приходят релевантные новости

---

## 🎯 После успешного теста

1. **Убрать тестовую кнопку** из `profile.tsx`
2. **Убрать тестовые endpoints** с бэкенда (или оставить для отладки)
3. **Проверить расписание Celery Beat:**
   ```bash
   docker-compose logs celery-beat | grep -i "deadline\|news"
   ```
4. **Деплой на AWS!** 🚀

---

## 📊 Настройка Celery Beat (если еще не настроено)

Проверить `backend/app/celery_app.py`:

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'send-deadline-notifications': {
        'task': 'send_deadline_notifications',
        'schedule': crontab(hour=9, minute=0),  # Каждый день в 9:00
    },
    'send-news-notifications': {
        'task': 'send_news_notifications',
        'schedule': crontab(day_of_week='1,4', hour=10, minute=0),  # Пн и Чт в 10:00
    },
}
```

---

## 🎉 Итог

После успешного теста автоматических уведомлений:
- ✅ Push Notifications полностью работают
- ✅ Дедлайны отправляются автоматически
- ✅ Новости персонализируются через OpenAI
- ✅ Можно убирать тестовую кнопку
- ✅ Готово к деплою на AWS!

**Следующий этап: AWS Deployment!** 🚀☁️

