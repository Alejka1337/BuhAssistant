import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserType, FOPGroup, updateUserProfile } from '../../utils/authService';
import MobileSelect from '../../components/web/MobileSelect';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Theme';

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

export default function ProfileScreenWeb() {
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [userType, setUserType] = useState<UserType | null>(user?.user_type as UserType || null);
  const [fopGroup, setFopGroup] = useState<FOPGroup | null>(user?.fop_group as FOPGroup || null);
  const [taxSystem, setTaxSystem] = useState<string | null>(user?.tax_system || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Состояние для раскрытия блока "Про додаток"
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  
  // Состояние для модального окна подтверждения выхода
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Определяем мобильную версию
  const isMobile = Dimensions.get('window').width < 768;

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUserType(user.user_type || null);
      setFopGroup(user.fop_group || null);
      setTaxSystem(user.tax_system || null);
    }
  }, [user]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setError('Не вдалося вийти з облікового запису');
      setShowLogoutConfirm(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const updateData: any = {};
      if (fullName !== user.full_name) updateData.full_name = fullName;
      if (userType !== user.user_type) updateData.user_type = userType;
      if (fopGroup !== user.fop_group) updateData.fop_group = fopGroup;
      if (taxSystem !== user.tax_system) updateData.tax_system = taxSystem;

      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(updateData);
        await refreshUser();
        setSuccess('Профіль успішно оновлено!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Жодних змін для збереження.');
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Save profile error:', error);
      setError(error.message || 'Не вдалося оновити профіль.');
    } finally {
      setIsSaving(false);
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
            contentContainerStyle={styles.scrollContent}
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
          contentContainerStyle={styles.scrollContent}
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

          {/* Error and Success Messages */}
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          {success ? (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

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
                  {isMobile ? (
                    <MobileSelect
                      value={userType}
                      onValueChange={(itemValue: UserType | null) => setUserType(itemValue)}
                      items={[
                        { label: 'Оберіть тип', value: null },
                        ...USER_TYPE_OPTIONS
                      ]}
                      placeholder="Тип користувача"
                    />
                  ) : (
                    <select
                      value={userType || ''}
                      onChange={(e) => setUserType(e.target.value as UserType || null)}
                      style={htmlSelectStyles as any}
                    >
                      <option value="">Оберіть тип</option>
                      {USER_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                </View>

                {userType === UserType.FOP && (
                  <View style={styles.pickerBlock}>
                    <Text style={styles.label}>Група ФОП:</Text>
                    {isMobile ? (
                      <MobileSelect
                        value={fopGroup}
                        onValueChange={(itemValue: FOPGroup | null) => setFopGroup(itemValue)}
                        items={[
                          { label: 'Оберіть групу', value: null },
                          ...FOP_GROUP_OPTIONS
                        ]}
                        placeholder="Група ФОП"
                      />
                    ) : (
                      <select
                        value={fopGroup || ''}
                        onChange={(e) => setFopGroup(e.target.value as FOPGroup || null)}
                        style={htmlSelectStyles as any}
                      >
                        <option value="">Оберіть групу</option>
                        {FOP_GROUP_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </View>
                )}

                {userType === UserType.LEGAL_ENTITY && (
                  <View style={styles.pickerBlock}>
                    <Text style={styles.label}>Система оподаткування:</Text>
                    {isMobile ? (
                      <MobileSelect
                        value={taxSystem}
                        onValueChange={(itemValue: string | null) => setTaxSystem(itemValue)}
                        items={[
                          { label: 'Оберіть систему', value: null },
                          ...TAX_SYSTEM_OPTIONS
                        ]}
                        placeholder="Система оподаткування"
                      />
                    ) : (
                      <select
                        value={taxSystem || ''}
                        onChange={(e) => setTaxSystem(e.target.value || null)}
                        style={htmlSelectStyles as any}
                      >
                        <option value="">Оберіть систему</option>
                        {TAX_SYSTEM_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
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

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="exit-to-app" size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>Вийти з облікового запису</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Модальное окно подтверждения выхода */}
        <Modal
          visible={showLogoutConfirm}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.logoutModalContent}>
              <View style={styles.logoutModalHeader}>
                <MaterialIcons name="exit-to-app" size={48} color={Colors.error} />
                <Text style={styles.logoutModalTitle}>Вихід з облікового запису</Text>
                <Text style={styles.logoutModalMessage}>
                  Ви впевнені, що хочете вийти?
                </Text>
              </View>

              <View style={styles.logoutModalButtons}>
                <TouchableOpacity
                  style={[styles.logoutModalButton, styles.cancelLogoutButton]}
                  onPress={() => setShowLogoutConfirm(false)}
                >
                  <Text style={styles.cancelLogoutButtonText}>Скасувати</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.logoutModalButton, styles.confirmLogoutButton]}
                  onPress={confirmLogout}
                >
                  <Text style={styles.confirmLogoutButtonText}>Вийти</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
  );
}

// Стили для HTML select (только для Desktop версии)
const htmlSelectStyles = {
  backgroundColor: Colors.cardBackground,
  color: Colors.textPrimary,
  borderRadius: BorderRadius.md,
  paddingTop: Spacing.md,
  paddingBottom: Spacing.md,
  paddingLeft: Spacing.md,
  paddingRight: '40px',
  fontSize: 16,
  fontFamily: Typography.body.fontFamily,
  lineHeight: '24px',
  border: 'none',
  outlineStyle: 'none',
  cursor: 'pointer',
  width: '100%',
  height: 56,
  display: 'flex',
  alignItems: 'center',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '20px',
};

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
  scrollContent: {
    maxWidth: 900,
    width: '100%',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  guestSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.cardBackground,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  profileSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.cardBackground,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
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
    outlineStyle: 'none' as any,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successText: {
    ...Typography.body,
    color: Colors.primary,
    flex: 1,
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
    marginBottom: Spacing.lg,
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
    marginTop: Spacing.sm,
  },
  inputField: {
    backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
    borderRadius: BorderRadius.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    fontSize: 16,
    fontFamily: Typography.body.fontFamily,
    lineHeight: '24px' as any,
    height: 56,
    marginBottom: Spacing.sm,
    outlineStyle: 'none' as any,
  },
  pickerBlock: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  saveButton: {
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    marginTop: 10,
    marginBottom: 10,
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
    textAlign: 'left',
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
  // Стили модального окна подтверждения выхода
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  logoutModalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutModalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoutModalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  logoutModalMessage: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cancelLogoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.textMuted,
  },
  cancelLogoutButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  confirmLogoutButton: {
    backgroundColor: Colors.error,
  },
  confirmLogoutButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
});

