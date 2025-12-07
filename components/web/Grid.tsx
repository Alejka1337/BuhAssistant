import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive, getGridColumns } from '@/utils/responsive';
import { Spacing } from '@/constants/Theme';

interface GridProps {
  children: React.ReactNode;
  columns?: { mobile?: number; tablet?: number; desktop?: number };
}

export function Grid({ children, columns = { mobile: 1, tablet: 2, desktop: 3 } }: GridProps) {
  const { screenWidth } = useResponsive();
  
  const cols = getGridColumns(screenWidth, columns);
  
  return (
    <View style={[styles.grid, { gridTemplateColumns: `repeat(${cols}, 1fr)` } as any]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    display: 'grid' as any,
    gap: Spacing.md as any,
    width: '100%',
  },
});

