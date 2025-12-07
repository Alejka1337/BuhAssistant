import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Colors, Fonts, Spacing } from '../constants/Theme';

// Тип для секций
interface Section {
  id: string;
  title: string;
  subsections?: Section[];
}

// Структура документа
const sections: Section[] = [
  { id: 'intro', title: 'Умови використання' },
  { id: 'section-1', title: '1. Загальні положення' },
  { id: 'section-2', title: '2. Реєстрація та облікові записи' },
  { id: 'section-3', title: '3. Правила використання форуму' },
  { id: 'section-4', title: '4. Система модерації' },
  { id: 'section-5', title: '5. Система жалоб' },
  { id: 'section-6', title: '6. Блокування користувачів' },
  { id: 'section-7', title: '7. Наслідки порушень' },
  { id: 'section-8', title: '8. Використання AI-асистента' },
  { id: 'section-9', title: '9. Інтелектуальна власність' },
  { id: 'section-10', title: '10. Обмеження відповідальності' },
  { id: 'section-11', title: '11. Конфіденційність' },
  { id: 'section-12', title: '12. Видалення облікового запису' },
  { id: 'section-13', title: '13. Зміни в Умовах' },
  { id: 'section-14', title: '14. Припинення доступу' },
  { id: 'section-15', title: '15. Контактна інформація' },
  { id: 'section-16', title: '16. Юридичні положення' },
];

export default function TermsOfService() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const checkMobile = () => {
      const width = Dimensions.get('window').width;
      setIsMobile(width < 768);
    };

    checkMobile();
    const subscription = Dimensions.addEventListener('change', checkMobile);

    return () => subscription?.remove();
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (Platform.OS === 'web') {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const renderSidebarItem = (section: Section, level: number = 0) => {
    const isActive = activeSection === section.id;

    return (
      <View key={section.id}>
        <TouchableOpacity
          style={[
            styles.sidebarItem,
            { paddingLeft: Spacing.md + (level * Spacing.md) },
            isActive && styles.sidebarItemActive,
          ]}
          onPress={() => scrollToSection(section.id)}
        >
          <Text
            style={[
              styles.sidebarItemText,
              { fontSize: level === 0 ? Fonts.sizes.base : Fonts.sizes.sm },
              isActive && styles.sidebarItemTextActive,
            ]}
            numberOfLines={2}
          >
            {section.title}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSidebar = () => {
    // Не показываем sidebar на мобильных
    if (isMobile) {
      return null;
    }

    return (
      <View style={styles.sidebar}>
        <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
          {sections.map(section => renderSidebarItem(section))}
        </ScrollView>
      </View>
    );
  };

  const renderContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View id="intro" style={styles.section}>
        <Text style={styles.title}>Умови використання eGlavBuh</Text>
        <Text style={styles.subtitle}>Дата останнього оновлення: 3 грудня 2025 року</Text>
      </View>

      {/* Section 1 */}
      <View id="section-1" style={styles.section}>
        <Text style={styles.heading1}>1. ЗАГАЛЬНІ ПОЛОЖЕННЯ</Text>

        <Text style={styles.heading2}>1.1 Прийняття умов</Text>
        <Text style={styles.paragraph}>
          Використовуючи мобільний додаток <Text style={styles.bold}>eGlavBuh</Text> (далі — "Додаток"), ви 
          погоджуєтесь дотримуватися цих Умов використання (далі — "Умови"). Якщо ви не згодні з будь-якою 
          частиною цих Умов, не використовуйте Додаток.
        </Text>

        <Text style={styles.heading2}>1.2 Про Додаток</Text>
        <Text style={styles.paragraph}>
          eGlavBuh — це бухгалтерський помічник для фізичних осіб-підприємців (ФОП) та юридичних осіб в Україні, 
          який надає:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Актуальні новини законодавства</Text>
          <Text style={styles.listItem}>• Календар звітності</Text>
          <Text style={styles.listItem}>• Калькулятори податків</Text>
          <Text style={styles.listItem}>• Форум для обговорення бухгалтерських питань</Text>
          <Text style={styles.listItem}>• Пошук по базі знань</Text>
          <Text style={styles.listItem}>• AI-асистент для консультацій</Text>
        </View>

        <Text style={styles.heading2}>1.3 Вікові обмеження</Text>
        <Text style={styles.paragraph}>
          Ви повинні бути старше 18 років для використання Додатку. Реєструючись, ви підтверджуєте, що вам 
          виповнилося 18 років.
        </Text>
      </View>

      {/* Section 2 */}
      <View id="section-2" style={styles.section}>
        <Text style={styles.heading1}>2. РЕЄСТРАЦІЯ ТА ОБЛІКОВІ ЗАПИСИ</Text>

        <Text style={styles.heading2}>2.1 Створення облікового запису</Text>
        <Text style={styles.paragraph}>
          Для доступу до деяких функцій Додатку ви повинні створити обліковий запис, надавши:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Адресу електронної пошти</Text>
          <Text style={styles.listItem}>• Пароль</Text>
          <Text style={styles.listItem}>• Повне ім'я (необов'язково)</Text>
        </View>

        <Text style={styles.heading2}>2.2 Безпека облікового запису</Text>
        <Text style={styles.paragraph}>Ви несете відповідальність за:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Збереження конфіденційності вашого пароля</Text>
          <Text style={styles.listItem}>• Всі дії, що виконуються через ваш обліковий запис</Text>
          <Text style={styles.listItem}>• Негайне повідомлення нас про будь-яке несанкціоноване використання</Text>
        </View>

        <Text style={styles.heading2}>2.3 Точність інформації</Text>
        <Text style={styles.paragraph}>
          Ви зобов'язуєтесь надавати точну, актуальну та повну інформацію при реєстрації та підтримувати її в 
          актуальному стані.
        </Text>
      </View>

      {/* Section 3 */}
      <View id="section-3" style={styles.section}>
        <Text style={styles.heading1}>3. ПРАВИЛА ВИКОРИСТАННЯ ФОРУМУ</Text>

        <Text style={styles.heading2}>3.1 Загальні правила</Text>
        <Text style={styles.paragraph}>
          Форум eGlavBuh призначений для професійного обговорення бухгалтерських та податкових питань. 
          Використовуючи форум, ви зобов'язуєтесь:
        </Text>

        <Text style={[styles.paragraph, styles.bold, { color: Colors.success }]}>✅ ДОЗВОЛЕНО:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Ставити питання з бухгалтерії та оподаткування</Text>
          <Text style={styles.listItem}>• Ділитися досвідом та корисною інформацією</Text>
          <Text style={styles.listItem}>• Допомагати іншим користувачам</Text>
          <Text style={styles.listItem}>• Вести конструктивний діалог</Text>
          <Text style={styles.listItem}>• Посилатися на офіційні джерела законодавства</Text>
        </View>

        <Text style={[styles.paragraph, styles.bold, { color: Colors.error }]}>❌ ЗАБОРОНЕНО:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Образи, погрози, дискримінація</Text>
          <Text style={styles.listItem}>• Спам, реклама без дозволу адміністрації</Text>
          <Text style={styles.listItem}>• Поширення неправдивої інформації</Text>
          <Text style={styles.listItem}>• Публікація конфіденційної інформації третіх осіб</Text>
          <Text style={styles.listItem}>• Порушення авторських прав</Text>
          <Text style={styles.listItem}>• Публікація неприйнятного контенту</Text>
        </View>

        <Text style={styles.heading2}>3.2 Неприйнятний контент</Text>
        <Text style={[styles.paragraph, styles.bold]}>Категорично заборонено публікувати:</Text>

        <Text style={styles.heading3}>1. Незаконний контент:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Порушення законодавства України</Text>
          <Text style={styles.listItem}>• Заклики до насильства або терористичної діяльності</Text>
          <Text style={styles.listItem}>• Інформація про незаконну діяльність</Text>
        </View>

        <Text style={styles.heading3}>2. Образливий контент:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Образи користувачів або третіх осіб</Text>
          <Text style={styles.listItem}>• Дискримінація за будь-якою ознакою</Text>
          <Text style={styles.listItem}>• Погрози, залякування, булінг</Text>
        </View>

        <Text style={styles.heading3}>3. Спам та реклама:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Масові повторювані повідомлення</Text>
          <Text style={styles.listItem}>• Реклама товарів/послуг без дозволу</Text>
          <Text style={styles.listItem}>• Посилання на сторонні ресурси з метою заробітку</Text>
        </View>

        <Text style={styles.heading3}>4. Дезінформація:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Свідомо неправдива інформація</Text>
          <Text style={styles.listItem}>• Маніпуляція фактами</Text>
          <Text style={styles.listItem}>• Поширення фейків</Text>
        </View>
      </View>

      {/* Section 4 */}
      <View id="section-4" style={styles.section}>
        <Text style={styles.heading1}>4. СИСТЕМА МОДЕРАЦІЇ</Text>

        <Text style={styles.heading2}>4.1 Модератори</Text>
        <Text style={styles.paragraph}>Модератори eGlavBuh мають право:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Переглядати весь контент на форумі</Text>
          <Text style={styles.listItem}>• Видаляти контент, що порушує ці Умови</Text>
          <Text style={styles.listItem}>• Попереджати користувачів про порушення</Text>
          <Text style={styles.listItem}>• Тимчасово або назавжди блокувати користувачів</Text>
          <Text style={styles.listItem}>• Редагувати або переміщувати пости для кращої організації</Text>
        </View>

        <Text style={styles.heading2}>4.2 Процес модерації</Text>

        <Text style={styles.heading3}>1. Автоматична модерація:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Система може автоматично приховувати підозрілий контент</Text>
          <Text style={styles.listItem}>• AI-фільтри перевіряють тексти на наявність спаму</Text>
        </View>

        <Text style={styles.heading3}>2. Ручна модерація:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Модератори переглядають скарги користувачів</Text>
          <Text style={styles.listItem}>• Всі рішення приймаються індивідуально</Text>
          <Text style={styles.listItem}>• Враховується контекст та історія користувача</Text>
        </View>

        <Text style={styles.heading3}>3. Апеляція:</Text>
        <Text style={styles.paragraph}>
          Ви можете звернутися до адміністрації, якщо вважаєте рішення модератора несправедливим. 
          Контакт:{' '}
          <Text style={styles.link} onPress={() => handleLinkPress('mailto:manager@eglavbuh.com.ua')}>
            manager@eglavbuh.com.ua
          </Text>
        </Text>

        <Text style={styles.heading2}>4.3 Швидкість реагування</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Критичні порушення: до 2 годин</Text>
          <Text style={styles.listItem}>• Звичайні скарги: до 24 годин</Text>
          <Text style={styles.listItem}>• Складні випадки: до 3 робочих днів</Text>
        </View>
      </View>

      {/* Section 5 */}
      <View id="section-5" style={styles.section}>
        <Text style={styles.heading1}>5. СИСТЕМА ЖАЛОБ</Text>

        <Text style={styles.heading2}>5.1 Як поскаржитися</Text>
        <Text style={styles.paragraph}>Якщо ви виявили контент, що порушує ці Умови:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>1. Натисніть на кнопку "..." (три крапки) біля поста</Text>
          <Text style={styles.listItem}>2. Оберіть "Поскаржитися"</Text>
          <Text style={styles.listItem}>3. Вкажіть причину (Спам, Образа, Дезінформація, тощо)</Text>
          <Text style={styles.listItem}>4. Додайте деталі (необов'язково)</Text>
          <Text style={styles.listItem}>5. Надішліть скаргу</Text>
        </View>

        <Text style={styles.heading2}>5.2 Обробка скарг</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Всі скарги розглядаються модераторами</Text>
          <Text style={styles.listItem}>• Ви отримаєте сповіщення про результат</Text>
          <Text style={styles.listItem}>• Повторні необґрунтовані скарги можуть призвести до попередження</Text>
        </View>

        <Text style={styles.heading2}>5.3 Конфіденційність</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Ваша скарга є конфіденційною</Text>
          <Text style={styles.listItem}>• Автор контенту не дізнається, хто поскаржився</Text>
          <Text style={styles.listItem}>• Модератори не розголошують деталі скарг</Text>
        </View>
      </View>

      {/* Section 6 */}
      <View id="section-6" style={styles.section}>
        <Text style={styles.heading1}>6. БЛОКУВАННЯ КОРИСТУВАЧІВ</Text>

        <Text style={styles.heading2}>6.1 Блокування іншими користувачами</Text>
        <Text style={styles.paragraph}>Ви можете заблокувати будь-якого користувача.</Text>

        <Text style={styles.heading3}>Що відбувається при блокуванні:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Ви не бачите пости та коментарі заблокованого користувача</Text>
          <Text style={styles.listItem}>• Заблокований користувач не отримує сповіщення</Text>
          <Text style={styles.listItem}>• Заблокований може нормально користуватися Додатком</Text>
          <Text style={styles.listItem}>• Ви можете розблокувати користувача в будь-який момент</Text>
        </View>

        <Text style={styles.heading3}>Як заблокувати:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>1. Натисніть "..." біля поста користувача</Text>
          <Text style={styles.listItem}>2. Оберіть "Заблокувати автора"</Text>
          <Text style={styles.listItem}>3. Підтвердіть дію</Text>
        </View>

        <Text style={styles.heading3}>Управління блокуваннями:</Text>
        <Text style={styles.paragraph}>
          Перейдіть в <Text style={styles.bold}>Профіль → Заблоковані користувачі</Text>, щоб переглядати список 
          заблокованих та розблоковувати при потребі.
        </Text>

        <Text style={styles.heading2}>6.2 Блокування модераторами</Text>
        <Text style={styles.paragraph}>
          За порушення цих Умов ви можете бути заблоковані модераторами:
        </Text>

        <Text style={styles.heading3}>Типи блокувань:</Text>

        <Text style={styles.bold}>1. Попередження:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Перше незначне порушення</Text>
          <Text style={styles.listItem}>• Контент видаляється</Text>
          <Text style={styles.listItem}>• Користувач отримує попередження</Text>
        </View>

        <Text style={styles.bold}>2. Тимчасове блокування (1-30 днів):</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Повторні порушення</Text>
          <Text style={styles.listItem}>• Публікація спаму</Text>
          <Text style={styles.listItem}>• Образи користувачів</Text>
          <Text style={styles.listItem}>• Доступ до форуму обмежено</Text>
        </View>

        <Text style={styles.bold}>3. Постійне блокування:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Систематичні порушення</Text>
          <Text style={styles.listItem}>• Публікація незаконного контенту</Text>
          <Text style={styles.listItem}>• Загрози, дискримінація</Text>
          <Text style={styles.listItem}>• Обхід тимчасового блокування</Text>
          <Text style={styles.listItem}>• Повний доступ до Додатку заборонено</Text>
        </View>
      </View>

      {/* Section 7 */}
      <View id="section-7" style={styles.section}>
        <Text style={styles.heading1}>7. НАСЛІДКИ ПОРУШЕНЬ</Text>

        <Text style={styles.heading2}>7.1 Градація покарань</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• <Text style={styles.bold}>1-е порушення:</Text> Попередження + видалення контенту</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>2-е порушення:</Text> Тимчасове блокування (3-7 днів)</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>3-є порушення:</Text> Тимчасове блокування (14-30 днів)</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>4-е порушення:</Text> Постійне блокування</Text>
        </View>

        <Text style={[styles.paragraph, styles.bold, { color: Colors.error, marginTop: Spacing.md }]}>
          Критичні порушення (одразу постійне блокування):
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Незаконний контент</Text>
          <Text style={styles.listItem}>• Погрози насильством</Text>
          <Text style={styles.listItem}>• Дискримінація</Text>
          <Text style={styles.listItem}>• Публікація персональних даних без згоди</Text>
          <Text style={styles.listItem}>• Спроби злому або DDOS</Text>
        </View>
      </View>

      {/* Section 8 */}
      <View id="section-8" style={styles.section}>
        <Text style={styles.heading1}>8. ВИКОРИСТАННЯ AI-АСИСТЕНТА</Text>

        <Text style={styles.heading2}>8.1 Обмеження відповідальності</Text>
        <Text style={styles.paragraph}>AI-асистент в eGlavBuh:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Надає загальну інформацію про бухгалтерію</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>НЕ замінює</Text> професійну консультацію</Text>
          <Text style={styles.listItem}>• Може помилятися</Text>
          <Text style={styles.listItem}>• Базується на даних, актуальних на момент навчання</Text>
        </View>

        <Text style={styles.heading2}>8.2 Відповідальність користувача</Text>
        <Text style={styles.paragraph}>Ви несете відповідальність за:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Перевірку інформації з офіційних джерел</Text>
          <Text style={styles.listItem}>• Консультацію з професійним бухгалтером</Text>
          <Text style={styles.listItem}>• Рішення, прийняті на основі відповідей AI</Text>
        </View>

        <Text style={styles.heading2}>8.3 Конфіденційність</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Не надсилайте конфіденційну інформацію AI-асистенту</Text>
          <Text style={styles.listItem}>• Не діліться персональними даними клієнтів</Text>
          <Text style={styles.listItem}>• Ваші запити можуть оброблятися третіми сторонами (OpenAI)</Text>
        </View>
      </View>

      {/* Section 9-11 - shorter versions */}
      <View id="section-9" style={styles.section}>
        <Text style={styles.heading1}>9. ІНТЕЛЕКТУАЛЬНА ВЛАСНІСТЬ</Text>
        <Text style={styles.paragraph}>
          Всі матеріали в Додатку (дизайн, логотип, код, контент) є власністю eGlavBuh та захищені законами про 
          авторське право. Публікуючи контент, ви надаєте eGlavBuh невиключну ліцензію на використання вашого 
          контенту в рамках Додатку.
        </Text>
      </View>

      <View id="section-10" style={styles.section}>
        <Text style={styles.heading1}>10. ОБМЕЖЕННЯ ВІДПОВІДАЛЬНОСТІ</Text>
        <Text style={styles.paragraph}>
          Додаток надається "як є" без будь-яких гарантій. Ми не несемо відповідальності за контент, опублікований 
          користувачами, технічні збої, або втрату даних.
        </Text>
      </View>

      <View id="section-11" style={styles.section}>
        <Text style={styles.heading1}>11. КОНФІДЕНЦІЙНІСТЬ</Text>
        <Text style={styles.paragraph}>
          Ми збираємо та обробляємо ваші персональні дані відповідно до нашої Політики конфіденційності. Ви маєте 
          право запитувати доступ до ваших даних, вимагати виправлення та видалити ваш обліковий запис.
        </Text>
      </View>

      {/* Section 12 */}
      <View id="section-12" style={styles.section}>
        <Text style={styles.heading1}>12. ВИДАЛЕННЯ ОБЛІКОВОГО ЗАПИСУ</Text>

        <Text style={styles.heading2}>12.1 Як видалити</Text>
        <Text style={styles.paragraph}>Ви можете видалити обліковий запис у будь-який час:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>1. Перейдіть в <Text style={styles.bold}>Профіль</Text></Text>
          <Text style={styles.listItem}>2. Прокрутіть до <Text style={styles.bold}>"Небезпечна зона"</Text></Text>
          <Text style={styles.listItem}>3. Натисніть <Text style={styles.bold}>"Видалити обліковий запис"</Text></Text>
          <Text style={styles.listItem}>4. Підтвердіть дію</Text>
        </View>

        <Text style={styles.heading2}>12.2 Наслідки видалення</Text>
        <Text style={styles.paragraph}>При видаленні облікового запису:</Text>
        <View style={styles.list}>
          <Text style={[styles.listItem, { color: Colors.success }]}>✅ Всі ваші персональні дані видаляються назавжди</Text>
          <Text style={[styles.listItem, { color: Colors.success }]}>✅ Всі ваші пости та коментарі видаляються</Text>
          <Text style={[styles.listItem, { color: Colors.success }]}>✅ Налаштування сповіщень видаляються</Text>
          <Text style={[styles.listItem, { color: Colors.warning }]}>⚠️ Дія є <Text style={styles.bold}>незворотною</Text></Text>
        </View>
      </View>

      {/* Section 13-16 */}
      <View id="section-13" style={styles.section}>
        <Text style={styles.heading1}>13. ЗМІНИ В УМОВАХ</Text>
        <Text style={styles.paragraph}>
          Ми залишаємо за собою право змінювати ці Умови в будь-який час. При внесенні змін ви отримаєте сповіщення. 
          Продовження використання означає згоду з новими Умовами.
        </Text>
      </View>

      <View id="section-14" style={styles.section}>
        <Text style={styles.heading1}>14. ПРИПИНЕННЯ ДОСТУПУ</Text>
        <Text style={styles.paragraph}>
          Ви можете припинити використання Додатку в будь-який час. Ми можемо призупинити або припинити ваш доступ 
          за порушення цих Умов або якщо ваші дії створюють ризик для інших користувачів.
        </Text>
      </View>

      <View id="section-15" style={styles.section}>
        <Text style={styles.heading1}>15. КОНТАКТНА ІНФОРМАЦІЯ</Text>
        <Text style={styles.paragraph}>
          Якщо у вас є питання щодо цих Умов:
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Email:</Text>{' '}
          <Text style={styles.link} onPress={() => handleLinkPress('mailto:manager@eglavbuh.com.ua')}>
            manager@eglavbuh.com.ua
          </Text>
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Поштова адреса:</Text>
        </Text>
        <View style={styles.addressBlock}>
          <Text style={styles.paragraph}>eGlavBuh</Text>
          <Text style={styles.paragraph}>Херсонський провулок 1</Text>
          <Text style={styles.paragraph}>Київ, 02000</Text>
          <Text style={styles.paragraph}>Україна</Text>
        </View>
      </View>

      <View id="section-16" style={styles.section}>
        <Text style={styles.heading1}>16. ЮРИДИЧНІ ПОЛОЖЕННЯ</Text>
        <Text style={styles.paragraph}>
          Ці Умови регулюються законодавством України. Всі спори вирішуються шляхом переговорів, а у разі 
          неможливості — в судовому порядку.
        </Text>
      </View>

      {/* Summary Box */}
      <View style={styles.summaryBox}>
        <Text style={[styles.heading2, { marginBottom: Spacing.md }]}>ПІДСУМОК: КЛЮЧОВІ МОМЕНТИ</Text>

        <Text style={[styles.paragraph, styles.bold, { color: Colors.success }]}>✅ Дозволено:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Професійні обговорення бухгалтерії</Text>
          <Text style={styles.listItem}>• Допомога іншим користувачам</Text>
          <Text style={styles.listItem}>• Конструктивна критика</Text>
        </View>

        <Text style={[styles.paragraph, styles.bold, { color: Colors.error }]}>❌ Заборонено:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Образи та погрози</Text>
          <Text style={styles.listItem}>• Спам та реклама</Text>
          <Text style={styles.listItem}>• Дезінформація</Text>
        </View>

        <Text style={[styles.paragraph, styles.bold, { color: Colors.warning }]}>⚠️ Наслідки порушень:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Попередження → Тимчасове блокування → Постійне блокування</Text>
        </View>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Контакт:</Text>{' '}
          <Text style={styles.link} onPress={() => handleLinkPress('mailto:manager@eglavbuh.com.ua')}>
            manager@eglavbuh.com.ua
          </Text>
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Дякуємо за використання eGlavBuh! Разом ми створюємо корисну та безпечну спільноту для бухгалтерів. 💚
        </Text>
        <Text style={[styles.footerText, { marginTop: Spacing.sm }]}>
          © 2025 eGlavBuh. Всі права захищені.
        </Text>
        <Text style={[styles.footerText, { marginTop: Spacing.sm }]}>
          Контакт: manager@eglavbuh.com.ua
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.layout}>
        {renderSidebar()}
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  layout: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 280,
    backgroundColor: Colors.cardBackground,
    borderRightWidth: 1,
    borderRightColor: Colors.borderColor,
  },
  sidebarScroll: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  sidebarItem: {
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(34, 136, 34, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sidebarItemText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
  },
  sidebarItemTextActive: {
    color: Colors.primary,
    fontWeight: Fonts.weights.semibold as any,
  },

  // Content
  content: {
    flex: 1,
  },

  // Sections
  section: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },

  // Typography
  title: {
    fontSize: Fonts.sizes.xxxl + 8,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    fontFamily: Fonts.body,
  },
  heading1: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  heading2: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  heading3: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  paragraph: {
    fontSize: Fonts.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Fonts.sizes.base * 1.6,
    marginBottom: Spacing.md,
    fontFamily: Fonts.body,
  },
  bold: {
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Lists
  list: {
    marginLeft: Spacing.md,
    marginBottom: Spacing.md,
  },
  listItem: {
    fontSize: Fonts.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Fonts.sizes.base * 1.6,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.body,
  },

  // Address Block
  addressBlock: {
    marginLeft: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Summary Box
  summaryBox: {
    margin: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  // Footer
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: Fonts.body,
  },
});
