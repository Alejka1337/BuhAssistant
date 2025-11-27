import React from 'react';
import { StyleSheet, View } from 'react-native';
import InteractiveCalendar from '../../components/InteractiveCalendar';
import { Colors } from '@/constants/Theme';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <InteractiveCalendar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
});
