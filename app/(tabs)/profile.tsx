import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Switch, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserType, FOPGroup, updateUserProfile, deleteAccount, getAccessToken } from '../../utils/authService';
import Select from '../../components/web/Select';
import { NotificationSettings, getNotificationSettings, updateNotificationSettings } from '../../utils/pushNotificationService';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Theme';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import { API_ENDPOINTS, getHeaders } from '../../constants/api';

// Опции для выпадающих списков
const USER_TYPE_OPTIONS = [
  { label: 'Фізична особа-підприємець (ФОП)', value: UserType.FOP },
  { label: 'Юридична особа', value: UserType.LEGAL_ENTITY },
  { label: 'Бухгалтер', value: UserType.ACCOUNTANT },
  { label: 'Фізична особа', value: UserType.INDIVIDUAL },
];

const FOP_GROUP_OPTIONS = [
  { label: 'Група 1', value: FOPGroup.GROUP_1 },
  { label: 'Група 2', value: FOPGroup.GROUP_2 },
  { label: 'Група 3', value: FOPGroup.GROUP_3 },
];

const TAX_SYSTEM_OPTIONS = [
  { label: 'Загальна', value: 'Загальна' },
  { label: 'Спрощена', value: 'Спрощена' },
  { label: 'Інша', value: 'Інша' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [userType, setUserType] = useState<UserType | null>(user?.user_type as UserType || null);
  const [fopGroup, setFopGroup] = useState<FOPGroup | null>(user?.fop_group as FOPGroup || null);
  const [taxSystem, setTaxSystem] = useState<string | null>(user?.tax_system || null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Настройки уведомлений
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  
  // Состояние для раскрытия блока "Про додаток"
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  
  // Состояние для модального окна удаления аккаунта
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Состояние для управления блокировками
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Array<{id: number, blocked_id: number, blocked_user?: {email: string, full_name: string | null}}>>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUserType(user.user_type || null);
      setFopGroup(user.fop_group || null);
      setTaxSystem(user.tax_system || null);
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Вихід',
      'Ви впевнені, що хочете вийти з облікового запису?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Вийти',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updateData: any = {};
      if (fullName !== user.full_name) updateData.full_name = fullName;
      if (userType !== user.user_type) updateData.user_type = userType;
      if (fopGroup !== user.fop_group) updateData.fop_group = fopGroup;
      if (taxSystem !== user.tax_system) updateData.tax_system = taxSystem;

      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(updateData);
        await refreshUser();
        Alert.alert('Успіх', 'Профіль успішно оновлено!');
        setIsEditing(false);
      } else {
        Alert.alert('Інформація', 'Жодних змін для збереження.');
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Save profile error:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося оновити профіль.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadNotificationSettings = async () => {
    setLoadingSettings(true);
    try {
      const settings = await getNotificationSettings();
      setNotificationSettings(settings);
    } catch (error: any) {
      console.error('Load notification settings error:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити налаштування сповіщень.');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleShowNotificationSettings = async () => {
    setShowNotificationSettings(true);
    await loadNotificationSettings();
  };

  const handleUpdateNotificationSetting = async (key: keyof NotificationSettings, value: any) => {
    if (!notificationSettings) return;

    try {
      const updatedSettings = await updateNotificationSettings({ [key]: value });
      setNotificationSettings(updatedSettings);
    } catch (error: any) {
      console.error('Update notification setting error:', error);
      Alert.alert('Помилка', 'Не вдалося оновити налаштування.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      Alert.alert(
        'Успіх',
        'Ваш обліковий запис успішно видалено.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowDeleteModal(false);
              // Перезагружаем состояние через logout
              logout();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Delete account error:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося видалити обліковий запис. Спробуйте ще раз.');
    }
  };

  const loadBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token');

      const response = await fetch(API_ENDPOINTS.BLOCKS.LIST, {
        headers: getHeaders({
          'Authorization': `Bearer ${token}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load blocked users');
      }

      const data = await response.json();
      setBlockedUsers(data);
    } catch (error: any) {
      console.error('Load blocked users error:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити список заблокованих користувачів.');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleShowBlockedUsers = async () => {
    setShowBlockedUsers(true);
    await loadBlockedUsers();
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token');

      const response = await fetch(API_ENDPOINTS.BLOCKS.DELETE(userId), {
        method: 'DELETE',
        headers: getHeaders({
          'Authorization': `Bearer ${token}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unblock user');
      }

      Alert.alert('Успіх', 'Користувача розблоковано');
      await loadBlockedUsers();
    } catch (error: any) {
      console.error('Unblock user error:', error);
      Alert.alert('Помилка', error.message || 'Не вдалося розблокувати користувача.');
    }
  };


  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Неавторизований користувач
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        >
          <View style={styles.guestSection}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="person-outline" size={60} color="#7f8c8d" />
            </View>
            <Text style={styles.guestTitle}>Вітаємо!</Text>
            <Text style={styles.guestSubtitle}>
              Увійдіть або зареєструйтесь, щоб отримати доступ до всіх функцій
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.primaryButtonText}>Увійти</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.secondaryButtonText}>Зареєструватися</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Чому варто зареєструватися?</Text>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="bookmark" size={24} color={Colors.primary} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Збереження налаштувань</Text>
                <Text style={styles.featureDescription}>
                  Персональні фільтри та улюблені розділи
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="notifications-active" size={24} color={Colors.primary} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Push-уведомлення</Text>
                <Text style={styles.featureDescription}>
                  Важливі новини та нагадування про дедлайни
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="forum" size={24} color={Colors.primary} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Участь у форумі</Text>
                <Text style={styles.featureDescription}>
                  Спілкування з іншими користувачами
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Авторизований користувач
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={60} color={Colors.primary} />
          </View>
          {isEditing ? (
            <TextInput
              style={styles.userNameEdit}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ваше повне ім'я"
              placeholderTextColor="#7f8c8d"
            />
          ) : (
            <Text style={styles.userName}>{user.full_name || 'Користувач'}</Text>
          )}
          <Text style={styles.userEmail}>{user.email}</Text>
          
          {user.user_type && !isEditing && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{USER_TYPE_OPTIONS.find(opt => opt.value === user.user_type)?.label || user.user_type}</Text>
            </View>
          )}
          {!user.user_type && !isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.setupProfileButton}>
              <Text style={styles.setupProfileButtonText}>Налаштувати профіль</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Інформація про обліковий запис</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="verified-user" size={20} color="#7f8c8d" />
              <Text style={styles.infoLabel}>Статус:</Text>
              <Text style={[styles.infoValue, user.is_active && { color: Colors.primary }]}>
                {user.is_active ? 'Активний' : 'Неактивний'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="check-circle" size={20} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Верифікація:</Text>
              <Text style={[styles.infoValue, user.is_verified && { color: Colors.primary }]}>
                {user.is_verified ? 'Підтверджено' : 'Не підтверджено'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.textMuted} />
              <Text style={styles.infoLabel}>Дата реєстрації:</Text>
              <Text style={[styles.infoValue, { color: Colors.primary }]}>
                {new Date(user.created_at).toLocaleDateString('uk-UA')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Налаштування</Text>
          
          {isEditing ? (
            <>
              <Text style={styles.label}>Повне ім'я:</Text>
              <TextInput
                style={styles.inputField}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ваше повне ім'я"
                placeholderTextColor="#7f8c8d"
              />

              <View style={styles.pickerBlock}>
                <Text style={styles.label}>Тип користувача:</Text>
                <Select
                  value={userType}
                  onValueChange={(itemValue: UserType | null) => setUserType(itemValue)}
                  items={[
                    { label: 'Оберіть тип', value: null },
                    ...USER_TYPE_OPTIONS
                  ]}
                  style={styles.selectStyle}
                />
              </View>

              {userType === UserType.FOP && (
                <View style={styles.pickerBlock}>
                  <Text style={styles.label}>Група ФОП:</Text>
                  <Select
                    value={fopGroup}
                    onValueChange={(itemValue: FOPGroup | null) => setFopGroup(itemValue)}
                    items={[
                      { label: 'Оберіть групу', value: null },
                      ...FOP_GROUP_OPTIONS
                    ]}
                    style={styles.selectStyle}
                  />
                </View>
              )}

              {userType === UserType.LEGAL_ENTITY && (
                <View style={styles.pickerBlock}>
                  <Text style={styles.label}>Система оподаткування:</Text>
                  <Select
                    value={taxSystem}
                    onValueChange={(itemValue: string | null) => setTaxSystem(itemValue)}
                    items={[
                      { label: 'Оберіть систему', value: null },
                      ...TAX_SYSTEM_OPTIONS
                    ]}
                    style={styles.selectStyle}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.primaryButton, styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Зберегти зміни</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryButton, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.secondaryButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {user.user_type && (
                <View style={styles.menuItem}>
                  <MaterialIcons name="business" size={24} color={Colors.primary} />
                  <Text style={styles.menuItemText}>Тип користувача: {USER_TYPE_OPTIONS.find(opt => opt.value === user.user_type)?.label || user.user_type}</Text>
                </View>
              )}
              {user.user_type === UserType.FOP && user.fop_group && (
                <View style={styles.menuItem}>
                  <MaterialIcons name="group" size={24} color={Colors.primary} />
                  <Text style={styles.menuItemText}>Група ФОП: {FOP_GROUP_OPTIONS.find(opt => opt.value === user.fop_group)?.label || user.fop_group}</Text>
                </View>
              )}
              {user.user_type === UserType.LEGAL_ENTITY && user.tax_system && (
                <View style={styles.menuItem}>
                  <MaterialIcons name="balance" size={24} color={Colors.primary} />
                  <Text style={styles.menuItemText}>Система оподаткування: {TAX_SYSTEM_OPTIONS.find(opt => opt.value === user.tax_system)?.label || user.tax_system}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.menuItem} onPress={() => setIsEditing(true)}>
                <MaterialIcons name="edit" size={24} color={Colors.primary} />
                <Text style={styles.menuItemText}>Редагувати профіль</Text>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleShowNotificationSettings}>
                <MaterialIcons name="notifications" size={24} color={Colors.primary} />
                <Text style={styles.menuItemText}>Сповіщення</Text>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleShowBlockedUsers}>
                <MaterialIcons name="block" size={24} color={Colors.primary} />
                <Text style={styles.menuItemText}>Заблоковані користувачі</Text>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
              
              {/* Блок "Про додаток" с раскрытием */}
              <View>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => setIsAboutExpanded(!isAboutExpanded)}
                >
                  <MaterialIcons name="info" size={24} color={Colors.primary} />
                  <Text style={styles.menuItemText}>Про додаток</Text>
                  <MaterialIcons 
                    name={isAboutExpanded ? "expand-more" : "chevron-right"} 
                    size={24} 
                    color={Colors.textMuted} 
                  />
                </TouchableOpacity>
                
                {isAboutExpanded && (
                  <View style={styles.aboutContent}>
                    <Text style={styles.aboutTitle}>
                      eGlavBuh – надійний помічник у бухгалтерії
                    </Text>
                    
                    <View style={styles.aboutFeatures}>
                      <View style={styles.aboutFeatureItem}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                        <Text style={styles.aboutFeatureText}>Нагадаємо про важливі дедлайни</Text>
                      </View>
                      
                      <View style={styles.aboutFeatureItem}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                        <Text style={styles.aboutFeatureText}>Тільки актуальні новини законодавства</Text>
                      </View>
                      
                      <View style={styles.aboutFeatureItem}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                        <Text style={styles.aboutFeatureText}>Персоналізований пошук</Text>
                      </View>
                      
                      <View style={styles.aboutFeatureItem}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                        <Text style={styles.aboutFeatureText}>Калькулятори та інструменти</Text>
                      </View>
                      
                      <View style={styles.aboutFeatureItem}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                        <Text style={styles.aboutFeatureText}>Спілкування та обговорення</Text>
                      </View>
                      
                      <View style={styles.aboutFeatureItem}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                        <Text style={styles.aboutFeatureText}>Бухгалтерська консультація</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Небезпечна зона */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Небезпечна зона</Text>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <MaterialIcons name="delete-forever" size={24} color={Colors.error} />
            <View style={styles.dangerButtonContent}>
              <Text style={styles.dangerButtonTitle}>Видалити обліковий запис</Text>
              <Text style={styles.dangerButtonSubtitle}>
                Ця дія незворотна. Усі ваші дані будуть видалені назавжди.
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="exit-to-app" size={20} color={Colors.error} />
          <Text style={styles.logoutButtonText}>Вийти з облікового запису</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Модальное окно удаления аккаунта */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email || ''}
      />

      {/* Модальное окно настроек уведомлений */}
      <Modal
        visible={showNotificationSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Налаштування сповіщень</Text>
              <TouchableOpacity onPress={() => setShowNotificationSettings(false)}>
                <MaterialIcons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingSettings ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : notificationSettings ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <MaterialIcons name="event" size={24} color={Colors.primary} />
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>Нагадування про дедлайни</Text>
                      <Text style={styles.settingDescription}>
                        Отримувати сповіщення про терміни подачі звітів
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationSettings.enable_deadline_notifications}
                    onValueChange={(value) => handleUpdateNotificationSetting('enable_deadline_notifications', value)}
                    trackColor={{ false: Colors.textMuted, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <MaterialIcons name="article" size={24} color={Colors.primary} />
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>Персоналізовані новини</Text>
                      <Text style={styles.settingDescription}>
                        Отримувати добірку новин на основі вашого профілю
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationSettings.enable_news_notifications}
                    onValueChange={(value) => handleUpdateNotificationSetting('enable_news_notifications', value)}
                    trackColor={{ false: Colors.textMuted, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                </View>

              </ScrollView>
            ) : (
              <View style={styles.modalError}>
                <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                <Text style={styles.modalErrorText}>Не вдалося завантажити налаштування</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Модальное окно заблокированных пользователей */}
      <Modal
        visible={showBlockedUsers}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBlockedUsers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Заблоковані користувачі</Text>
              <TouchableOpacity onPress={() => setShowBlockedUsers(false)}>
                <MaterialIcons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingBlocked ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : blockedUsers.length > 0 ? (
              <ScrollView style={styles.modalBody}>
                {blockedUsers.map((block) => (
                  <View key={block.id} style={styles.blockedUserItem}>
                    <View style={styles.blockedUserInfo}>
                      <MaterialIcons name="person" size={32} color={Colors.textMuted} />
                      <View style={styles.blockedUserText}>
                        <Text style={styles.blockedUserName}>
                          {block.blocked_user?.full_name || 'Користувач'}
                        </Text>
                        <Text style={styles.blockedUserEmail}>
                          {block.blocked_user?.email || ''}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.unblockButton}
                      onPress={() => handleUnblockUser(block.blocked_id)}
                    >
                      <Text style={styles.unblockButtonText}>Розблокувати</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.modalError}>
                <MaterialIcons name="check-circle" size={48} color={Colors.primary} />
                <Text style={styles.modalErrorText}>Немає заблокованих користувачів</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  guestSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.cardBackground,
    marginBottom: Spacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.cardBackground,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  guestTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 10,
  },
  guestSubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: Spacing.lg,
  },
  userName: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  userNameEdit: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    width: '80%',
    textAlign: 'center',
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
    marginTop: 8,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  setupProfileButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: 10,
  },
  setupProfileButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.md,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  infoLabel: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  featureText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  featureTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  menuItemText: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutButtonText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  label: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  inputField: {
    backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
    fontFamily: Typography.body.fontFamily,
    marginBottom: Spacing.sm,
    minHeight: 48,
  },
  pickerBlock: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  selectStyle: {
    marginTop: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.xxl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  // Стили модального окна настроек уведомлений
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalLoader: {
    padding: 60,
    alignItems: 'center',
  },
  modalError: {
    padding: 60,
    alignItems: 'center',
  },
  modalErrorText: {
    ...Typography.body,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  modalNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  // Стили для блока "Про додаток"
  aboutContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  aboutTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  aboutFeatures: {
    gap: Spacing.sm,
  },
  aboutFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aboutFeatureText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  // Стили для секции "Небезпечна зона"
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  dangerButtonContent: {
    flex: 1,
  },
  dangerButtonTitle: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
    marginBottom: 4,
  },
  dangerButtonSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  // Стили для заблокированных пользователей
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  blockedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  blockedUserText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  blockedUserName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  blockedUserEmail: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  unblockButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  unblockButtonText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
});
