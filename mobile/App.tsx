import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<any>(null);

  const openStudentSpace = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return Alert.alert('Code requis', 'Entre ton code élève.');
    setLoading(true);
    const { data, error } = await supabase.rpc('get_student_portal', { p_code: normalized });
    setLoading(false);
    if (error || !data?.student) {
      Alert.alert('Code invalide', 'Impossible de trouver cet espace élève.');
      return;
    }
    setStudent(data.student);
  };

  if (student) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.brand}>Centre Les Profs</Text>
          <Text style={styles.title}>Bonjour 👋</Text>
          <Text style={styles.name}>{student.full_name || 'Élève'}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>🎓 Niveau</Text>
            <Text style={styles.value}>{student.level || '-'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>📚 Matières</Text>
            <Text style={styles.value}>{student.subjects?.length ? student.subjects.join(', ') : 'Aucune matière'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>📅 Présences</Text>
            <Text style={styles.value}>{student.attendance?.length ?? 0} enregistrements</Text>
          </View>
          <Pressable style={styles.secondaryButton} onPress={() => setStudent(null)}>
            <Text style={styles.secondaryText}>Changer de compte</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.brand}>Centre Les Profs</Text>
        <Text style={styles.title}>Espace Élève</Text>
        <Text style={styles.subtitle}>Connecte-toi avec ton code élève</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="Ex. CLP-1234"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <Pressable style={styles.button} onPress={openStudentSpace} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrer dans mon espace</Text>}
        </Pressable>
        <Text style={styles.footer}>Site web + application mobile indépendants · même plateforme Centre Les Profs</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 22 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 28 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 14, padding: 16, fontSize: 17, marginBottom: 14 },
  button: { backgroundColor: '#111', borderRadius: 14, padding: 17, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12 },
  label: { fontSize: 14, color: '#777', marginBottom: 6 },
  value: { fontSize: 17, fontWeight: '600' },
  secondaryButton: { marginTop: 18, alignItems: 'center', padding: 14 },
  secondaryText: { fontWeight: '700' },
  footer: { textAlign: 'center', color: '#888', fontSize: 12, marginTop: 28 }
});
