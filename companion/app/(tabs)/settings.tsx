import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  View as RNView,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import {
  getServerConfig,
  setServerConfig,
  getClaudeApiKey,
  setClaudeApiKey,
  getModel,
  setModel,
} from '../../services/auth';
import { checkServerHealth } from '../../services/api';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [serverUrl, setServerUrl] = useState('');
  const [serverApiKey, setServerApiKey] = useState('');
  const [claudeApiKey, setClaudeApiKeyState] = useState('');
  const [model, setModelState] = useState('');
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    (async () => {
      const config = await getServerConfig();
      if (config) {
        setServerUrl(config.url);
        setServerApiKey(config.apiKey);
      }
      const key = await getClaudeApiKey();
      if (key) setClaudeApiKeyState(key);
      const m = await getModel();
      setModelState(m);
    })();
  }, []);

  const handleSave = useCallback(async () => {
    await setServerConfig({ url: serverUrl.trim(), apiKey: serverApiKey.trim() });
    if (claudeApiKey.trim()) {
      await setClaudeApiKey(claudeApiKey.trim());
    }
    if (model.trim()) {
      await setModel(model.trim());
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [serverUrl, serverApiKey, claudeApiKey, model]);

  const handleTestConnection = useCallback(async () => {
    if (!serverUrl.trim()) {
      setTestResult('fail');
      return;
    }
    setTestResult('testing');
    const ok = await checkServerHealth(serverUrl.trim());
    setTestResult(ok ? 'ok' : 'fail');
    setTimeout(() => setTestResult('idle'), 3000);
  }, [serverUrl]);

  const inputStyle = [styles.input, isDark && styles.inputDark];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Home Server</Text>
        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={inputStyle}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://192.168.1.x:3001"
          placeholderTextColor={isDark ? '#555' : '#aaa'}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>Server API Key</Text>
        <TextInput
          style={inputStyle}
          value={serverApiKey}
          onChangeText={setServerApiKey}
          placeholder="Optional — leave blank for dev mode"
          placeholderTextColor={isDark ? '#555' : '#aaa'}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Pressable
          onPress={handleTestConnection}
          style={({ pressed }) => [
            styles.testButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.testButtonText}>
            {testResult === 'testing' ? 'Testing...' :
             testResult === 'ok' ? 'Connected!' :
             testResult === 'fail' ? 'Failed — check URL & server' :
             'Test Connection'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Local Claude (Direct API)</Text>
        <Text style={styles.hint}>
          Used when the home server is unreachable. Calls Claude API directly from
          your device.
        </Text>

        <Text style={styles.label}>Anthropic API Key</Text>
        <TextInput
          style={inputStyle}
          value={claudeApiKey}
          onChangeText={setClaudeApiKeyState}
          placeholder="sk-ant-..."
          placeholderTextColor={isDark ? '#555' : '#aaa'}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={inputStyle}
          value={model}
          onChangeText={setModelState}
          placeholder="claude-sonnet-4-20250514"
          placeholderTextColor={isDark ? '#555' : '#aaa'}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.saveButtonText}>
          {saved ? 'Saved!' : 'Save Settings'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 12,
    color: '#888',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
  },
  testButton: {
    marginTop: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007aff',
  },
  saveButton: {
    backgroundColor: '#007aff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
