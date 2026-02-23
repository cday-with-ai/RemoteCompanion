import React, { useState } from 'react';
import { StyleSheet, Pressable, Alert, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { openSmsCompose } from '../../services/sms';
import type { Message } from '../../types';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const isUser = message.role === 'user';
  const isPush = message.source === 'push';
  const [smsSending, setSmsSending] = useState(false);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSms = async () => {
    if (message.action?.type !== 'sms' || smsSending) return;
    setSmsSending(true);
    try {
      const { sent, error } = await openSmsCompose(
        message.action.recipient,
        message.action.body,
      );
      if (error) {
        Alert.alert('SMS', error);
      }
    } catch {
      Alert.alert('SMS', 'Failed to open SMS compose');
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <RNView
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <RNView
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, isDark && styles.userBubbleDark]
            : [
                styles.assistantBubble,
                isDark && styles.assistantBubbleDark,
                isPush && styles.pushBubble,
                isPush && isDark && styles.pushBubbleDark,
              ],
        ]}
      >
        {isPush && (
          <RNView style={styles.pushBadge}>
            <FontAwesome name="bell" size={10} color="#ff9500" />
            <Text style={styles.pushBadgeText}>Push</Text>
          </RNView>
        )}
        {isUser ? (
          <Text style={[styles.userText, isDark && styles.userTextDark]}>
            {message.content}
          </Text>
        ) : (
          <MarkdownRenderer>
            {message.content || '...'}
          </MarkdownRenderer>
        )}
        {message.action?.type === 'sms' && (
          <Pressable
            onPress={handleSms}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <FontAwesome name="commenting" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Send as Text Message</Text>
          </Pressable>
        )}
      </RNView>
      <Text
        style={[
          styles.time,
          isUser ? styles.timeRight : styles.timeLeft,
        ]}
      >
        {time}
      </Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#007aff',
    borderBottomRightRadius: 4,
  },
  userBubbleDark: {
    backgroundColor: '#0a5fcc',
  },
  assistantBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  assistantBubbleDark: {
    backgroundColor: '#1c1c1e',
  },
  pushBubble: {
    borderLeftWidth: 3,
    borderLeftColor: '#ff9500',
  },
  pushBubbleDark: {
    borderLeftColor: '#ff9500',
  },
  pushBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pushBadgeText: {
    fontSize: 10,
    color: '#ff9500',
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  userTextDark: {
    color: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34c759',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  time: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  timeRight: {
    marginRight: 4,
  },
  timeLeft: {
    marginLeft: 4,
  },
});
