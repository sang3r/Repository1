import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useApp, Message } from '../context/AppContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ route }: Props) {
  const { recipient } = route.params;
  const { messages, sendMessage } = useApp();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const conversation: Message[] = messages[recipient] ?? [];

  useEffect(() => {
    if (conversation.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [conversation.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    try {
      await sendMessage(recipient, text);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.bubbleText, item.mine ? styles.mineText : styles.theirsText]}>
        {item.text}
      </Text>
      <Text style={[styles.time, item.mine ? styles.mineTime : styles.theirsTime]}>
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.e2eeBar}>
        <Text style={styles.e2eeText}>🔒 Messages are end-to-end encrypted</Text>
      </View>

      <FlatList
        ref={listRef}
        data={conversation}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No messages yet — say hello!</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#555"
          multiline
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={handleSend}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  e2eeBar: { backgroundColor: '#1a2a1a', paddingVertical: 8, alignItems: 'center' },
  e2eeText: { fontSize: 12, color: '#4caf50', fontWeight: '500' },
  list: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#444', fontSize: 14 },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 18, marginBottom: 8 },
  mine: { backgroundColor: '#4c6ef5', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: '#1e1e2e', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  mineText: { color: '#fff' },
  theirsText: { color: '#ddd' },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  mineTime: { color: 'rgba(255,255,255,0.55)' },
  theirsTime: { color: '#555' },
  inputRow: { flexDirection: 'row', padding: 10, backgroundColor: '#1e1e2e', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#2a2a3e' },
  input: { flex: 1, backgroundColor: '#2a2a3e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#fff', maxHeight: 120, marginRight: 8 },
  sendBtn: { backgroundColor: '#4c6ef5', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 11 },
  sendBtnDisabled: { backgroundColor: '#2a2a3e' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
