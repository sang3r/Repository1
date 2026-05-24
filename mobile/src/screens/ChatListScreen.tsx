import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useApp } from '../context/AppContext';
import { getOnlineUsers } from '../services/api';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ChatList'> };

export default function ChatListScreen({ navigation }: Props) {
  const { username, messages } = useApp();
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const online = await getOnlineUsers();
      setUsers(online.filter(u => u !== username));
    } catch {
      // keep previous list on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const lastMessage = (user: string) => {
    const conv = messages[user];
    if (!conv || conv.length === 0) return 'Tap to start a secure conversation';
    const last = conv[conv.length - 1];
    return `${last.mine ? 'You: ' : ''}${last.text}`;
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4c6ef5" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.e2eeBar}>
        <Text style={styles.e2eeText}>All conversations are end-to-end encrypted</Text>
      </View>
      {users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No other users online</Text>
          <Text style={styles.emptyHint}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4c6ef5" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Chat', { recipient: item })}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item[0].toUpperCase()}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item}</Text>
                <Text style={styles.rowPreview} numberOfLines={1}>{lastMessage(item)}</Text>
              </View>
              <Text style={styles.lockIcon}>🔒</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a' },
  e2eeBar: { backgroundColor: '#1a2a1a', paddingVertical: 8, alignItems: 'center' },
  e2eeText: { fontSize: 12, color: '#4caf50', fontWeight: '500' },
  empty: { fontSize: 16, color: '#666' },
  emptyHint: { fontSize: 13, color: '#444', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4c6ef5', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  rowText: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  rowPreview: { fontSize: 13, color: '#666', marginTop: 2 },
  lockIcon: { fontSize: 14 },
});
