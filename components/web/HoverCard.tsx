import React, { useState } from 'react';
import { TouchableOpacity, Platform, ViewStyle } from 'react-native';

interface HoverCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  hoverStyle?: ViewStyle;
  onPress?: () => void;
}

/**
 * Компонент с hover эффектом для Web
 * На Native работает как обычный TouchableOpacity
 */
export default function HoverCard({ children, style, hoverStyle, onPress }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        style={[style, isHovered && hoverStyle]}
        onPress={onPress}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // @ts-ignore - className работает только на веб
        className="hover-card-container"
      >
        {children}
      </TouchableOpacity>
    );
  }

  // На Native просто TouchableOpacity без hover
  return (
    <TouchableOpacity style={style} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
}

