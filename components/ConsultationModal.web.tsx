import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../constants/api';

interface ConsultationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ConsultationModalWeb({ visible, onClose }: ConsultationModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Состояния для записи аудио
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<any>(null);

  const removeAudioFile = () => {
    setAudioFile(null);
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      // Запрашиваем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Определяем поддерживаемый MIME тип
      let mimeType = 'audio/webm';
      let fileExtension = 'webm';
      
      // Пробуем найти более совместимый формат
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
        fileExtension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
        fileExtension = 'webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
        fileExtension = 'ogg';
      }
      
      console.log('Используется MIME тип:', mimeType);
      
      // Создаем MediaRecorder с выбранным MIME типом
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        // Создаем файл из записанных chunks
        const audioBlob = new Blob(chunks, { type: mimeType });
        const audioFile = new File([audioBlob], `recording_${Date.now()}.${fileExtension}`, { type: mimeType });
        setAudioFile(audioFile);
        
        // Останавливаем все треки
        stream.getTracks().forEach(track => track.stop());
        
        // Очищаем интервал
        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingInterval(null);
        }
      };
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setRecordingTime(0);
      
      // Запускаем запись
      recorder.start();
      setIsRecording(true);
      
      // Таймер для отображения времени записи
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error('Ошибка при запуске записи:', error);
      setError('Не вдалося отримати доступ до мікрофона');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    // Останавливаем запись если она идет
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
    
    // Очищаем интервал
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    // Очищаем форму
    setName('');
    setEmail('');
    setMessage('');
    setAudioFile(null);
    setError('');
    setSuccess('');
    setRecordingTime(0);
    
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Валидация
    if (!name.trim() || !email.trim()) {
      setError('Будь ласка, заповніть обов\'язкові поля');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Будь ласка, введіть коректний email');
      return;
    }

    if (!message.trim() && !audioFile) {
      setError('Будь ласка, введіть повідомлення або прикріпіть аудіо файл');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('message', message || '');

      // Если есть аудио файл, добавляем его
      if (audioFile) {
        formData.append('audio_file', audioFile);
        console.log('Отправка с аудио файлом:', audioFile.name, audioFile.type, audioFile.size);
      }

      const response = await fetch(API_ENDPOINTS.CONSULTATION.SUBMIT, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Дякуємо! Ваш запит надіслано. Ми зв\'яжемося з вами найближчим часом.');
        // Очищаем форму
        setName('');
        setEmail('');
        setMessage('');
        setAudioFile(null);
        setRecordingTime(0);
        
        // Закрываем модалку через 2 секунды
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 2000);
      } else {
        setError(result.detail || 'Не вдалося надіслати запит.');
      }
    } catch (error) {
      console.error('Помилка при відправці:', error);
      setError('Сталася помилка при відправці запиту.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Форма для консультації</Text>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <FontAwesome name="exclamation-circle" size={16} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Message */}
          {success ? (
            <View style={styles.successContainer}>
              <FontAwesome name="check-circle" size={16} color="#282" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Ім'я*"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#7f8c8d"
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Email*"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor="#7f8c8d"
            editable={!isSubmitting}
          />
          
          <View style={styles.messageContainer}>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Ваше повідомлення (або використайте голосовий ввід)"
              value={message}
              onChangeText={setMessage}
              multiline={true}
              placeholderTextColor="#7f8c8d"
              editable={!isSubmitting}
            />
            <TouchableOpacity 
              style={styles.micButton} 
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isSubmitting}
            >
              <FontAwesome 
                name="microphone" 
                size={24} 
                color={isRecording ? '#e74c3c' : '#282'} 
              />
            </TouchableOpacity>
          </View>

          {/* Recording Status */}
          {isRecording && (
            <View style={styles.recordingStatus}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Запис... {formatTime(recordingTime)}</Text>
            </View>
          )}

          {/* Recorded Audio File */}
          {audioFile && !isRecording && (
            <View style={styles.recordedContainer}>
              <FontAwesome name="check-circle" size={16} color="#282" />
              <Text style={styles.recordedText}>
                {audioFile.name} ({(audioFile.size / 1024).toFixed(0)} KB)
              </Text>
              <TouchableOpacity onPress={removeAudioFile} disabled={isSubmitting}>
                <FontAwesome name="times-circle" size={16} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
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
    maxWidth: 500,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#e74c3c',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 136, 34, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#282',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#282',
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
    outlineStyle: 'none' as any,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingRight: 50,
    marginBottom: 0,
  },
  messageContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 15,
  },
  micButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(40, 136, 34, 0.1)',
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  recordingText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  recordedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(40, 136, 34, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    gap: 10,
  },
  recordedText: {
    flex: 1,
    fontSize: 14,
    color: '#ecf0f1',
  },
  submitButton: {
    backgroundColor: '#282',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: '600',
  },
});

