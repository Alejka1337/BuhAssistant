import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Theme';

export default function WebViewScreen() {
  const params = useLocalSearchParams();
  const url = params.url as string;
  const title = params.title as string;
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webViewRef = useRef<WebView | null>(null);

  const handleBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    } else {
      router.back();
    }
  };

  const handleForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Наша шапка */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Завантаження...'}
          </Text>
          <Text style={styles.headerUrl} numberOfLines={1}>
            {url}
          </Text>
        </View>

        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <MaterialIcons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Навигационная панель WebView */}
      <View style={styles.navigationBar}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={!canGoBack}
          style={styles.navButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={canGoBack ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleForward}
          disabled={!canGoForward}
          style={styles.navButton}
        >
          <MaterialIcons
            name="arrow-forward"
            size={24}
            color={canGoForward ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReload} style={styles.navButton}>
          <MaterialIcons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <View style={styles.webviewContainer}>
        {url ? (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
              setCanGoForward(navState.canGoForward);
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Завантаження...</Text>
              </View>
            )}
            // Дополнительные настройки
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
            // Для iOS
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        ) : (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={Colors.error} />
            <Text style={styles.errorText}>Помилка: URL не вказано</Text>
            <TouchableOpacity onPress={handleClose} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Повернутися назад</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerUrl: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  navigationBar: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  navButton: {
    padding: 8,
    marginRight: Spacing.lg,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 40,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.error,
    marginTop: Spacing.lg,
    marginBottom: 30,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  errorButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
});

