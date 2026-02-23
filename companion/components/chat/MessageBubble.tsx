import React from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import type { Message } from '../../types';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const isUser = message.role === 'user';

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

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
            : [styles.assistantBubble, isDark && styles.assistantBubbleDark],
        ]}
      >
        {isUser ? (
          <Text style={[styles.userText, isDark && styles.userTextDark]}>
            {message.content}
          </Text>
        ) : (
          <MarkdownRenderer>
            {message.content || '...'}
          </MarkdownRenderer>
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
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  userTextDark: {
    color: '#fff',
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
