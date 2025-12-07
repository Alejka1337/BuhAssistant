import React from 'react';
import { Platform, Linking, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  style?: any;
  external?: boolean; // Для внешних ссылок (открыть в новой вкладке)
}

/**
 * Универсальный компонент ссылки
 * - Web: использует <a> теги
 * - Native: использует WebView через router или Linking
 */
export default function Link({ href, children, style, external = false }: LinkProps) {
  if (Platform.OS === 'web') {
    // Для Web используем нативный <a> тег
    return (
      <a
        href={href}
        style={style}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }

  // Для Native используем TouchableOpacity
  const handlePress = () => {
    if (external || href.startsWith('http')) {
      // Внешняя ссылка - открыть в браузере
      Linking.openURL(href);
    } else {
      // Внутренняя навигация - открыть WebView
      router.push(`/webview?url=${encodeURIComponent(href)}` as any);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </TouchableOpacity>
  );
}

