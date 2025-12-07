import React from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from './Sidebar';
import { Colors } from '@/constants/Theme';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: Colors.background,
    height: '100vh' as any,
  },
  content: {
    flex: 1,
    overflow: 'auto' as any,
  },
});

