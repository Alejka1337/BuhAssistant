import React, { ReactNode } from 'react';
import { View, Platform } from 'react-native';
import MobileMenu, { MobileMenuWrapper } from './MobileMenu';
import { useResponsive } from '@/utils/responsive';

interface MobileAuthLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function MobileAuthLayout({ children, title }: MobileAuthLayoutProps) {
  const { isMobile } = useResponsive();

  // Только для Mobile Web добавляем бургер-меню
  if (Platform.OS === 'web' && isMobile) {
    return (
      <View style={{ flex: 1 }}>
        <MobileMenu title={title} />
        <MobileMenuWrapper>
          {children}
        </MobileMenuWrapper>
      </View>
    );
  }

  // Для других платформ (iOS/Android) или Desktop - рендерим как есть
  return <>{children}</>;
}

