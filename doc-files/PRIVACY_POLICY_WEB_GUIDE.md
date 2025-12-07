# 📱 Privacy Policy Web - Інструкція

## Що створено

✅ **Файл:** `app/privacy-policy.tsx`

**Функціонал:**
- 📱 Адаптивний дизайн (мобільний + десктоп)
- 🎨 Темна тема (з вашої айдентики)
- 📑 Sidebar з навігацією (десктоп)
- 🍔 Burger menu (мобільний)
- 🔗 Smooth scroll до секцій
- ✨ Красива типографіка (Unbounded + Inter)

---

## Структура документа

### Основні секції (вже є в коді):

1. **Privacy Policy** (intro)
2. **Summary of Key Points** (summary)
3. **Table of Contents** (toc)
4. **What Information Do We Collect?**
5. **How Do We Process Your Information?**
6. **When and With Whom Do We Share Your Personal Information?**
7. **Do We Offer Artificial Intelligence-Based Products?**
8. **How Long Do We Keep Your Information?**
9. **How Do We Keep Your Information Safe?**
10. **Do We Collect Information From Minors?**
11. **What Are Your Privacy Rights?**
    - Account Deletion
    - Withdrawing Your Consent
    - Account Information
12. **User-Generated Content Moderation** 🆕
    - Content Reporting
    - User Blocking
    - Content Moderation
13. **Controls for Do-Not-Track Features**
14. **Do We Make Updates to This Notice?**
15. **How Can You Contact Us About This Notice?**
16. **How Can You Review, Update, or Delete the Data We Collect?**

---

## Як заповнити контент

### Крок 1: Підготувати текст
Дайте мені текст Privacy Policy, і я його структурую для кожної секції.

### Крок 2: Формат тексту
Текст можна давати:
- Простим текстом
- HTML
- Markdown
- По секціях

### Крок 3: Я оновлю код
Після того, як ви дасте текст, я:
1. Створю компоненти для кожної секції
2. Відформатую текст
3. Додам списки, підсекції, посилання
4. Перевірю адаптивність

---

## Приклад структури секції

```typescript
// Зараз (заглушка):
<View id="info-collect" style={styles.section}>
  <Text style={styles.heading1}>1. What Information Do We Collect?</Text>
  <Text style={styles.paragraph}>
    [Content will be added here]
  </Text>
</View>

// Після заповнення буде:
<View id="info-collect" style={styles.section}>
  <Text style={styles.heading1}>1. What Information Do We Collect?</Text>
  
  <Text style={styles.heading2}>Personal Information You Disclose to Us</Text>
  <Text style={styles.paragraph}>
    <Text style={styles.bold}>In Short:</Text>
    <Text style={styles.italic}> We collect personal information that you provide to us.</Text>
  </Text>
  
  <Text style={styles.paragraph}>
    We collect personal information that you voluntarily provide to us when you register 
    on the Services...
  </Text>
  
  <Text style={styles.heading3}>Personal Information Provided by You</Text>
  <View style={styles.list}>
    <Text style={styles.listItem}>• Email addresses</Text>
    <Text style={styles.listItem}>• Names</Text>
    <Text style={styles.listItem}>• Passwords</Text>
  </View>
</View>
```

---

## Особливості дизайну

### Кольори (з Theme.ts)
- **Background:** `#1a1d21` (темний)
- **Card/Sidebar:** `#22262c` (темніший сірий)
- **Primary:** `#282` (зелений)
- **Text Primary:** `#ecf0f1` (світлий)
- **Text Secondary:** `#bdc3c7` (сірий)
- **Text Muted:** `#95a5a6` (темніший сірий)

### Шрифти
- **Заголовки:** Unbounded (bold/semibold)
- **Текст:** Inter (regular/medium)
- **Моноширинний:** SpaceMono (для коду)

### Відступи
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **xxl:** 48px

---

## Responsive дизайн

### Десктоп (≥768px)
```
┌─────────────────────────────────────┐
│         Mobile Header (hidden)       │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │      Main Content        │
│ (280px)  │      (max 900px)         │
│          │                          │
│  - Intro │  ┌──────────────────┐   │
│  - Summ  │  │  Privacy Policy  │   │
│  - TOC   │  │                  │   │
│  - 1.    │  │  [Content...]    │   │
│  - 2.    │  │                  │   │
│  - ...   │  └──────────────────┘   │
│          │                          │
└──────────┴──────────────────────────┘
```

### Мобільний (<768px)
```
┌─────────────────────┐
│  ☰  Privacy Policy  │ ← Header з бургер-меню
├─────────────────────┤
│                     │
│   Main Content      │
│                     │
│  ┌───────────────┐  │
│  │ Privacy Pol.. │  │
│  │               │  │
│  │ [Content...]  │  │
│  │               │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘

При кліку на ☰:
┌─────────────────────┐
│ Contents        [X] │ ← Sidebar header
├─────────────────────┤
│ • Intro             │
│ • Summary           │
│ • TOC               │
│ • 1. What Info...   │
│ • 2. How Process... │
│ • ...               │
└─────────────────────┘
     ↑
  Overlay (затемнення)
```

---

## Функціонал навігації

### Sidebar
- Клік на секцію → scroll до неї
- Активна секція підсвічується зеленим
- Вкладені секції (subsections) з відступом

### Mobile
- Бургер-меню відкриває sidebar зліва
- Overlay (затемнення) закриває sidebar
- Клік на секцію → scroll + закриття sidebar

### Smooth Scroll
```typescript
const element = document.getElementById(sectionId);
element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
```

---

## Стилі тексту

### Доступні стилі:
```typescript
styles.title          // Головний заголовок (40px, bold)
styles.subtitle       // Підзаголовок (15px, muted)
styles.heading1       // H1 (24px, bold)
styles.heading2       // H2 (20px, semibold)
styles.paragraph      // Параграф (15px, regular)
styles.bold           // Жирний текст
styles.italic         // Курсив
styles.link           // Посилання (зелений, underline)
styles.tocLink        // Посилання в TOC
```

### Приклади використання:
```typescript
// Жирний текст в параграфі:
<Text style={styles.paragraph}>
  <Text style={styles.bold}>Important:</Text> This is regular text.
</Text>

// Посилання:
<Text style={styles.paragraph}>
  Contact us at <Text style={styles.link}>email@example.com</Text>
</Text>

// Курсив:
<Text style={[styles.paragraph, styles.italic]}>
  This text is italic
</Text>
```

---

## Додаткові компоненти (можу додати)

### Списки:
```typescript
<View style={styles.list}>
  <Text style={styles.listItem}>• Item 1</Text>
  <Text style={styles.listItem}>• Item 2</Text>
  <Text style={styles.listItem}>• Item 3</Text>
</View>
```

### Цитати:
```typescript
<View style={styles.quote}>
  <Text style={styles.quoteText}>
    "This is a quote or important notice"
  </Text>
</View>
```

### Кнопки/Посилання:
```typescript
<TouchableOpacity style={styles.button}>
  <Text style={styles.buttonText}>Contact Us</Text>
</TouchableOpacity>
```

### Інформаційні блоки:
```typescript
<View style={styles.infoBox}>
  <MaterialIcons name="info" size={20} color={Colors.info} />
  <Text style={styles.infoText}>Important information</Text>
</View>
```

---

## Як тестувати

### Веб (Expo)
```bash
npx expo start
# Відкрити в браузері
# Перейти на /privacy-policy.web
```

### Перевірити:
- [ ] Sidebar працює на десктопі
- [ ] Burger menu працює на мобільному
- [ ] Scroll до секцій працює
- [ ] Активна секція підсвічується
- [ ] Overlay закриває sidebar
- [ ] Текст читабельний на обох версіях
- [ ] Responsive працює (змінити розмір вікна)

---

## Наступні кроки

1. **Дайте мені текст Privacy Policy**
   - Весь одразу або по секціях
   - У будь-якому форматі (текст/HTML/markdown)

2. **Я заповню контент**
   - Структурую кожну секцію
   - Додам форматування
   - Перевірю адаптивність

3. **Додам потрібні стилі**
   - Списки
   - Цитати
   - Інформаційні блоки
   - Що ще потрібно

4. **Фінальна перевірка**
   - Тестування на desktop/mobile
   - Перевірка посилань
   - Перевірка навігації

---

## Приклад заповненої секції

Коли дасте текст, кожна секція буде виглядати приблизно так:

```typescript
<View id="account-deletion" style={styles.subsection}>
  <Text style={styles.heading2}>Account Deletion</Text>
  
  <Text style={styles.paragraph}>
    You have the right to delete your account at any time directly from the application. 
    When you delete your account:
  </Text>
  
  <View style={styles.list}>
    <Text style={styles.listItem}>
      • All your personal information (email, name, profile data) will be permanently deleted
    </Text>
    <Text style={styles.listItem}>
      • All your forum posts, comments, and user-generated content will be removed
    </Text>
    <Text style={styles.listItem}>
      • Your notification settings and preferences will be deleted
    </Text>
    <Text style={styles.listItem}>
      • This action is irreversible and cannot be undone
    </Text>
  </View>
  
  <Text style={styles.paragraph}>
    To delete your account, navigate to{' '}
    <Text style={styles.bold}>Profile → Danger Zone → Delete Account</Text>
    {' '}in the application.
  </Text>
</View>
```

---

**Готово до заповнення контентом!** 🎉

Дайте текст Privacy Policy, і я його інтегрую в красивий дизайн.

