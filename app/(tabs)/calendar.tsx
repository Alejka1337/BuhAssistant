import React from 'react';
import { StyleSheet, View } from 'react-native';
import AccountingCalendar from '../../components/AccountingCalendar';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <AccountingCalendar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1d21' 
  },
});
