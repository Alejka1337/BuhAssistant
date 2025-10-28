import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';

interface ConsultationModalProps {
  visible: boolean;
  onClose: () => void;
}

// !!! ЗАМЕНИТЕ НА АКТУАЛЬНЫЙ URL ВАШЕЙ РАЗВЕРНУТОЙ ФУНКЦИИ VERCEL !!!
// Пример: 'https://your-project-name.vercel.app/api/sendEmail'
const VERCEL_API_URL = 'https://buhassistant.vercel.app/api/sendEmail'; // Временно используем localhost для разработки

export default function ConsultationModal({ visible, onClose }: ConsultationModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert('Помилка', "Будь ласка, заповніть обов'язкові поля: Ім'я та Email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(VERCEL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message, recordedUri }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Дякуємо!', 'Ваш запит надіслано. Ми зв`яжемося з вами найближчим часом.');
        onClose();
      } else {
        Alert.alert('Помилка', result.error || 'Не вдалося надіслати запит.');
      }
    } catch (error) {
      console.error('Ошибка при отправке:', error);
      Alert.alert('Помилка', 'Произошла ошибка при отправке запроса.');
    } finally {
      setIsSubmitting(false);
    }
  };

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Помилка', 'Для запису аудіо потрібен дозвіл на використання мікрофона.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
    setRecording(null);
    console.log('Recording stopped and stored at', uri);
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Форма для консультації</Text>

          <TextInput
            style={styles.input}
            placeholder="Ім'я*"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#7f8c8d"
          />
          <TextInput
            style={styles.input}
            placeholder="Email*"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor="#7f8c8d"
          />
          
          <View style={styles.messageContainer}>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Ваше повідомлення (або використайте голосовий ввід)"
              value={message}
              onChangeText={setMessage}
              multiline={true}
              placeholderTextColor="#7f8c8d"
            />
            <TouchableOpacity style={styles.micButton} onPress={recording ? stopRecording : startRecording}>
              <FontAwesome name="microphone" size={24} color={isRecording ? '#e74c3c' : '#00bfa5'} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Надсилання...' : 'Відправити'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalView: {
        width: '90%',
        backgroundColor: '#2c3e50',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 15,
    },
    closeButtonText: {
        fontSize: 30,
        color: '#ecf0f1',
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ecf0f1',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#00bfa5',
        backgroundColor: '#1a1d21',
        padding: 12,
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 16,
        color: '#ecf0f1',
    },
    messageContainer: {
        width: '100%',
        position: 'relative',
        marginBottom: 15,
    },
    messageInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingRight: 50, // Make space for mic icon
        marginBottom: 0,
    },
    micButton: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        backgroundColor: '#1a1d21',
        padding: 8,
        borderRadius: 20,
    },
    submitButton: {
        backgroundColor: '#00bfa5',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 30,
        elevation: 2,
        width: '100%',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});
