import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../constants/api';

interface ConsultationModalProps {
  visible: boolean;
  onClose: () => void;
}

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
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('message', message || '');

      // Если есть запись, добавляем файл (только для нативных платформ)
      if (recordedUri && Platform.OS !== 'web') {
        try {
          // Получаем имя файла из URI
          const uriParts = recordedUri.split('/');
          const fileName = uriParts[uriParts.length - 1];
          
          // Создаем объект файла для FormData
          const audioFile = {
            uri: recordedUri,
            type: 'audio/m4a',
            name: fileName,
          } as any;
          
          formData.append('audio_file', audioFile);
          console.log('Аудио файл добавлен к запросу:', fileName);
        } catch (error) {
          console.error('Ошибка при подготовке аудио файла:', error);
          // Продолжаем без файла
        }
      }

      const response = await fetch(API_ENDPOINTS.CONSULTATION.SUBMIT, {
        method: 'POST',
        body: formData,
        // НЕ указываем Content-Type - браузер/RN сам установит правильный для multipart/form-data
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Дякуємо!', 'Ваш запит надіслано. Ми зв\'яжемося з вами найближчим часом.');
        // Очищаем форму
        setName('');
        setEmail('');
        setMessage('');
        setRecordedUri(null);
        onClose();
      } else {
        Alert.alert('Помилка', result.detail || 'Не вдалося надіслати запит.');
      }
    } catch (error) {
      console.error('Помилка при відправці:', error);
      Alert.alert('Помилка', 'Сталася помилка при відправці запиту.');
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
              placeholder={Platform.OS === 'web' ? "Ваше повідомлення" : "Ваше повідомлення (або використайте голосовий ввід)"}
              value={message}
              onChangeText={setMessage}
              multiline={true}
              placeholderTextColor="#7f8c8d"
            />
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.micButton} onPress={recording ? stopRecording : startRecording}>
                <FontAwesome name="microphone" size={24} color={isRecording ? '#e74c3c' : '#282'} />
              </TouchableOpacity>
            )}
          </View>
          
          {recordedUri && (
            <View style={styles.recordedContainer}>
              <FontAwesome name="check-circle" size={16} color="#282" />
              <Text style={styles.recordedText}>Голосове повідомлення записано</Text>
              <TouchableOpacity onPress={() => setRecordedUri(null)}>
                <FontAwesome name="times-circle" size={16} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          )}
          
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
        backgroundColor: '#22262c',
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
        borderColor: '#282',
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
        backgroundColor: '#282',
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
    recordedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1d21',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        gap: 8,
    },
    recordedText: {
        flex: 1,
        color: '#ecf0f1',
        fontSize: 14,
    },
});
