import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  View as RNView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from '@/components/Themed';
import ConnectionBadge from './ConnectionBadge';
import MessageBubble from './MessageBubble';
import { useChat } from '../../hooks/useChat';
import { useConnection } from '../../hooks/useConnection';
import type { Message } from '../../types';

export default function ChatView() {
  const { mode, isChecking, recheckConnection } = useConnection();
  const { messages, isStreaming, error, sendMessage, clearChat } = useChat(mode);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !(e as any).shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  const renderEmpty = () => (
    <RNView style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Remote Companion</Text>
      <Text style={styles.emptySubtitle}>
        {mode === 'offline'
          ? 'Configure a Claude API key or server URL in Settings to get started.'
          : 'Send a message to start chatting.'}
      </Text>
    </RNView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ConnectionBadge
        mode={mode}
        isChecking={isChecking}
        onPress={recheckConnection}
      />

      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={
          messages.length === 0 ? styles.emptyList : styles.messageList
        }
        ListEmptyComponent={renderEmpty}
      />

      {error && (
        <RNView style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </RNView>
      )}

      <RNView
        style={[
          styles.inputContainer,
          isDark && styles.inputContainerDark,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={input}
          onChangeText={setInput}
          placeholder="Message..."
          placeholderTextColor={isDark ? '#666' : '#999'}
          multiline
          maxLength={10000}
          editable={!isStreaming}
          onSubmitEditing={handleSend}
          onKeyPress={handleKeyPress}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || isStreaming}
          style={({ pressed }) => [
            styles.sendButton,
            (!input.trim() || isStreaming) && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed,
          ]}
        >
          <FontAwesome
            name="arrow-up"
            size={16}
            color="#fff"
          />
        </Pressable>
      </RNView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    // Inverted FlatList flips content, so we flip the empty state back
    transform: [{ scaleY: -1 }],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBar: {
    backgroundColor: '#ff3b3020',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  inputContainerDark: {
    backgroundColor: '#000',
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#c0c0c0',
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
});
