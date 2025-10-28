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
      <StatusBar barStyle="light-content" backgroundColor="#00bfa5" />
      
      {/* Наша шапка */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
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
          <MaterialIcons name="close" size={24} color="#fff" />
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
            color={canGoBack ? '#00bfa5' : '#7f8c8d'}
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
            color={canGoForward ? '#00bfa5' : '#7f8c8d'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReload} style={styles.navButton}>
          <MaterialIcons name="refresh" size={24} color="#00bfa5" />
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
                <ActivityIndicator size="large" color="#00bfa5" />
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
            <MaterialIcons name="error-outline" size={64} color="#e74c3c" />
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
    backgroundColor: '#1a1d21',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerUrl: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  navigationBar: {
    backgroundColor: '#2c3e50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d21',
  },
  navButton: {
    padding: 8,
    marginRight: 20,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1d21',
  },
  loadingText: {
    marginTop: 16,
    color: '#00bfa5',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1d21',
    padding: 40,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#00bfa5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

