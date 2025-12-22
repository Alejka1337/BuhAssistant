/**
 * SEO утилиты для управления мета-тегами на веб-страницах
 */

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
}

/**
 * Устанавливает мета-теги для текущей страницы (только для веб)
 */
export const setPageMeta = (meta: PageMeta) => {
  if (typeof document === 'undefined') return;

  // Устанавливаем title
  document.title = meta.title;

  // Устанавливаем description
  setMetaTag('name', 'description', meta.description);

  // Устанавливаем keywords (если указаны)
  if (meta.keywords) {
    setMetaTag('name', 'keywords', meta.keywords);
  }

  // Open Graph теги
  setMetaTag('property', 'og:title', meta.title);
  setMetaTag('property', 'og:description', meta.description);
  if (meta.ogImage) {
    setMetaTag('property', 'og:image', meta.ogImage);
  }

  // Twitter теги
  setMetaTag('name', 'twitter:title', meta.title);
  setMetaTag('name', 'twitter:description', meta.description);
  if (meta.ogImage) {
    setMetaTag('name', 'twitter:image', meta.ogImage);
  }
};

/**
 * Вспомогательная функция для установки мета-тега
 */
const setMetaTag = (attr: 'name' | 'property', key: string, value: string) => {
  let element = document.querySelector(`meta[${attr}="${key}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', value);
};

/**
 * Предопределенные мета-теги для всех страниц
 */
export const PAGE_METAS: Record<string, PageMeta> = {
  home: {
    title: 'eGlavBuh - Бухгалтерський помічник для ФОП та бухгалтерів',
    description: 'eGlavBuh – ваш надійний помічник у бухгалтерії. Нагадування про дедлайни, актуальні новини законодавства, калькулятори податків, персоналізований пошук та форум для спілкування.',
    keywords: 'бухгалтерія, ФОП, податки, звітність, калькулятор податків, ПДФО, ЄСВ, новини законодавства',
  },
  news: {
    title: 'Новини законодавства - eGlavBuh',
    description: 'Актуальні новини бухгалтерського та податкового законодавства України. Будьте в курсі всіх змін та оновлень для ФОП та бухгалтерів.',
    keywords: 'новини бухгалтерії, податкові новини, зміни законодавства, новини для ФОП',
  },
  calendar: {
    title: 'Календар звітності - eGlavBuh',
    description: 'Календар податкової та бухгалтерської звітності. Нагадування про важливі дедлайни для ФОП та бухгалтерів.',
    keywords: 'календар звітності, дедлайни, податкова звітність, звітність ФОП',
  },
  tools: {
    title: 'Калькулятори податків - eGlavBuh',
    description: 'Безкоштовні калькулятори для розрахунку податків: ПДФО, ЄСВ, єдиний податок, військовий збір, чиста зарплата та інші інструменти для ФОП та бухгалтерів.',
    keywords: 'калькулятор податків, калькулятор ПДФО, калькулятор ЄСВ, єдиний податок, військовий збір',
  },
  search: {
    title: 'Пошук інформації - eGlavBuh',
    description: 'Персоналізований пошук бухгалтерської та податкової інформації по найкращим джерелам України.',
    keywords: 'пошук бухгалтерія, пошук податки, бухгалтерська інформація',
  },
  forum: {
    title: 'Форум бухгалтерів - eGlavBuh',
    description: 'Форум для спілкування бухгалтерів та ФОП. Задавайте питання, діліться досвідом, обговорюйте актуальні теми бухгалтерії та оподаткування.',
    keywords: 'форум бухгалтерів, питання бухгалтерія, спілкування ФОП, бухгалтерські питання',
  },
  profile: {
    title: 'Профіль користувача - eGlavBuh',
    description: 'Налаштування профілю користувача eGlavBuh. Керуйте своїми даними та налаштуваннями.',
    keywords: 'профіль, налаштування, особистий кабінет',
  },
  articles: {
    title: 'Статті від експертів - eGlavBuh',
    description: 'Корисні статті від експертів з бухгалтерії та оподаткування. Детальні інструкції, роз\'яснення та поради для ФОП та бухгалтерів.',
    keywords: 'статті бухгалтерія, інструкції податки, поради ФОП, експертні статті',
  },
  taxRequisites: {
    title: 'Реквізити податкових органів - eGlavBuh',
    description: 'База реквізитів податкових органів України для сплати податків та зборів. Швидкий пошук по регіонах та територіальних громадах.',
    keywords: 'реквізити податкових, реквізити ДПС, сплата податків, IBAN податкова',
  },
  login: {
    title: 'Вхід - eGlavBuh',
    description: 'Увійдіть до свого облікового запису eGlavBuh для доступу до всіх функцій бухгалтерського помічника.',
    keywords: 'вхід, авторизація, логін',
  },
  register: {
    title: 'Реєстрація - eGlavBuh',
    description: 'Створіть обліковий запис eGlavBuh та отримайте доступ до калькуляторів, форуму, нагадувань про дедлайни та інших корисних інструментів.',
    keywords: 'реєстрація, створити акаунт, зареєструватися',
  },
  forgotPassword: {
    title: 'Відновлення паролю - eGlavBuh',
    description: 'Відновіть доступ до свого облікового запису eGlavBuh.',
    keywords: 'відновлення паролю, забув пароль',
  },
  privacyPolicy: {
    title: 'Політика конфіденційності - eGlavBuh',
    description: 'Політика конфіденційності eGlavBuh. Інформація про збір, використання та захист персональних даних користувачів.',
    keywords: 'політика конфіденційності, захист даних, приватність',
  },
  termsOfService: {
    title: 'Умови використання - eGlavBuh',
    description: 'Умови використання сервісу eGlavBuh. Правила користування додатком та форумом.',
    keywords: 'умови використання, правила, угода користувача',
  },
};

