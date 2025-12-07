import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useResponsive } from '@/utils/responsive';

interface ContentContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export default function ContentContainer({ children, scrollable = true, style }: ContentContainerProps) {
  const { isDesktop } = useResponsive();
  
  const containerStyle = [
    isDesktop ? styles.desktopContainer : styles.mobileContainer,
    style
  ];
  
  if (scrollable) {
    return (
      <ScrollView contentContainerStyle={containerStyle}>
        {children}
      </ScrollView>
    );
  }
  
  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  desktopContainer: {
    maxWidth: 1440,
    width: '100%',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
});

