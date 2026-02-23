import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  children: string;
}

export default function MarkdownRenderer({ children }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const styles = StyleSheet.create({
    body: {
      color: isDark ? '#e0e0e0' : '#1a1a1a',
      fontSize: 15,
      lineHeight: 22,
    },
    heading1: {
      color: isDark ? '#fff' : '#000',
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 6,
    },
    heading2: {
      color: isDark ? '#fff' : '#000',
      fontSize: 19,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 4,
    },
    heading3: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
      marginTop: 8,
      marginBottom: 4,
    },
    code_inline: {
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
      color: isDark ? '#e0e0e0' : '#d63384',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 13,
      fontFamily: 'SpaceMono',
    },
    fence: {
      backgroundColor: isDark ? '#1e1e1e' : '#f6f6f6',
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    code_block: {
      color: isDark ? '#d4d4d4' : '#333',
      fontSize: 13,
      fontFamily: 'SpaceMono',
    },
    link: {
      color: isDark ? '#6bb3ff' : '#2f95dc',
    },
    blockquote: {
      backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
      borderLeftWidth: 3,
      borderLeftColor: isDark ? '#555' : '#ddd',
      paddingLeft: 12,
      marginVertical: 6,
    },
    list_item: {
      marginVertical: 2,
    },
    strong: {
      fontWeight: 'bold',
    },
    em: {
      fontStyle: 'italic',
    },
  });

  return <Markdown style={styles}>{children}</Markdown>;
}
