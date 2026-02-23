import { StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from '@/components/Themed';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <FontAwesome name="dashboard" size={48} color="#ccc" />
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        Agent status cards will appear here in Phase 2.
      </Text>
      <Text style={styles.detail}>
        Heartbeat, Newsbot, Mailbot, and more.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  detail: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },
});
