import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from './firebaseConfig';

const { width } = Dimensions.get('window');

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  category: string;
  week: number;
  favorite: boolean;
  tags: string[];
  createdAt: Date;
}

export default function Journal() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('heureuse');
  const [category, setCategory] = useState('souvenir');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState(24);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  
  const moods = [
    { value: 'happy', emoji: '😊', color: '#FFB5E8', labelKey: 'journal.happy' },
    { value: 'tired', emoji: '😴', color: '#C4ABDC', labelKey: 'journal.tired' },
    { value: 'anxious', emoji: '😰', color: '#9B88D3', labelKey: 'journal.anxious' },
    { value: 'excited', emoji: '🤩', color: '#BBA0E8', labelKey: 'journal.excited' },
    { value: 'melancholic', emoji: '🥺', color: '#876BB8', labelKey: 'journal.melancholic' },
  ];

  const categories = [
    { value: 'memory', icon: 'heart-outline', labelKey: 'journal.memory' },
    { value: 'reflection', icon: 'bulb-outline', labelKey: 'journal.reflection' },
    { value: 'milestone', icon: 'star-outline', labelKey: 'journal.milestone' },
    { value: 'dream', icon: 'moon-outline', labelKey: 'journal.dream' },
  ];

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubUser = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        setCurrentWeek(Number(docSnap.data().semaineGrossesse) || 24);
      }
    });

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'journal_entries'),
      orderBy('createdAt', 'desc')
    );

    const unsubEntries = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as JournalEntry[];
      setEntries(data);
    });

    return () => {
      unsubUser();
      unsubEntries();
    };
  }, []);

  const handleSaveEntry = async () => {
    if (!auth.currentUser) return;

    if (!title.trim() || !content.trim()) {
      Alert.alert(t('common.error'), t('journal.fillTitleContent'));
      return;
    }

    const entryData = {
      title,
      content,
      mood,
      category,
      week: currentWeek,
      favorite: false,
      tags,
      createdAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'journal_entries', editingId), entryData);
        Alert.alert(t('common.success'), t('common.modified'));
      } else {
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'journal_entries'), entryData);
        Alert.alert(t('common.success'), t('journal.entryAdded'));
      }
      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('common.cannotSave'));
    }
  };

  const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'journal_entries', id), {
        favorite: !currentStatus,
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('common.cannotUpdate'));
    }
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert(t('common.confirm'), t('journal.deleteEntry'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'journal_entries', id));
            setViewModalVisible(false);
          } catch (error) {
            Alert.alert(t('common.error'), t('common.cannotDelete'));
          }
        },
      },
    ]);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setCategory(entry.category);
    setTags(entry.tags);
    setViewModalVisible(false);
    setModalVisible(true);
  };

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewModalVisible(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setMood('happy');
    setCategory('memory');
    setTagInput('');
    setTags([]);
  };

  const formatDate = (date: Date) => {
    const locale = i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR';
    return date.toLocaleDateString(locale, { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodData = (moodValue: string) => moods.find(m => m.value === moodValue) || moods[0];
  const getCategoryData = (catValue: string) => categories.find(c => c.value === catValue) || categories[0];

  let filteredEntries = entries;
  if (filterCategory) {
    filteredEntries = filteredEntries.filter(e => e.category === filterCategory);
  }
  if (showFavoritesOnly) {
    filteredEntries = filteredEntries.filter(e => e.favorite);
  }

  const favoriteCount = entries.filter(e => e.favorite).length;

  const getEmptyStateText = () => {
    if (showFavoritesOnly) return t('journal.noFavorites');
    if (filterCategory) return t('journal.noCategoryEntry');
    return t('journal.startJournal');
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('journal.title')}</Text>
          <TouchableOpacity
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={styles.favoriteFilterButton}
          >
            <Ionicons 
              name={showFavoritesOnly ? "heart" : "heart-outline"} 
              size={24} 
              color={showFavoritesOnly ? "#FFB5E8" : "#C4ABDC"} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>{t('journal.entries')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{favoriteCount}</Text>
            <Text style={styles.statLabel}>{t('journal.favorites')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>S{currentWeek}</Text>
            <Text style={styles.statLabel}>{t('journal.current')}</Text>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryFilter}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          <TouchableOpacity
            style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
            onPress={() => setFilterCategory(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>
              {t('journal.all')}
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.filterChip, filterCategory === cat.value && styles.filterChipActive]}
              onPress={() => setFilterCategory(cat.value)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={16} 
                color={filterCategory === cat.value ? '#1B0E20' : '#C4ABDC'} 
              />
              <Text style={[styles.filterChipText, filterCategory === cat.value && styles.filterChipTextActive]}>
                {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {filteredEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={60} color="#5D3A7D" />
                <Text style={styles.emptyText}>{t('journal.noEntry')}</Text>
                <Text style={styles.emptySubtext}>{getEmptyStateText()}</Text>
              </View>
            ) : (
              filteredEntries.map(entry => {
                const moodData = getMoodData(entry.mood);
                const catData = getCategoryData(entry.category);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    onPress={() => handleViewEntry(entry)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.entryHeader}>
                      <View style={styles.entryHeaderLeft}>
                        <View style={[styles.categoryIcon, { backgroundColor: moodData.color + '33' }]}>
                          <Ionicons name={catData.icon as any} size={20} color={moodData.color} />
                        </View>
                        <View style={styles.entryHeaderText}>
                          <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
                          <View style={styles.entryMetaRow}>
                            <Text style={styles.entryMood}>{moodData.emoji} {t(moodData.labelKey)}</Text>
                            <Text style={styles.entryWeek}>• {t('home.week')} {entry.week}</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(entry.id, entry.favorite);
                        }}
                      >
                        <Ionicons 
                          name={entry.favorite ? "heart" : "heart-outline"} 
                          size={24} 
                          color={entry.favorite ? "#FFB5E8" : "#9B88D3"} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.entryContent} numberOfLines={3}>
                      {entry.content}
                    </Text>

                    {entry.tags.length > 0 && (
                      <View style={styles.entryTags}>
                        {entry.tags.slice(0, 3).map((tag, idx) => (
                          <View key={idx} style={styles.entryTag}>
                            <Text style={styles.entryTagText}>#{tag}</Text>
                          </View>
                        ))}
                        {entry.tags.length > 3 && (
                          <Text style={styles.entryMoreTags}>+{entry.tags.length - 3}</Text>
                        )}
                      </View>
                    )}

                    <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#BBA0E8', '#9B88D3', '#876BB8']}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId ? t('common.edit') : t('journal.newEntry')}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>{t('journal.entryTitle')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('journal.firstKick')}
                  placeholderTextColor="#9B88D3"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>{t('journal.howDoYouFeel')} *</Text>
                <View style={styles.moodSelector}>
                  {moods.map(m => (
                    <TouchableOpacity
                      key={m.value}
                      style={[styles.moodButton, mood === m.value && { backgroundColor: m.color }]}
                      onPress={() => setMood(m.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>
                        {t(m.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>{t('journal.category')} *</Text>
                <View style={styles.categorySelector}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.categoryButton, category === cat.value && styles.categoryButtonActive]}
                      onPress={() => setCategory(cat.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={20} 
                        color={category === cat.value ? '#1B0E20' : '#C4ABDC'} 
                      />
                      <Text style={[styles.categoryButtonText, category === cat.value && styles.categoryButtonTextActive]}>
                        {t(cat.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>{t('journal.yourStory')} *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={t('journal.storyPlaceholder')}
                  placeholderTextColor="#9B88D3"
                  multiline
                  numberOfLines={8}
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>{t('journal.tags')}</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={t('journal.addTag')}
                    placeholderTextColor="#9B88D3"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={addTag}
                  />
                  <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                    <Ionicons name="add-circle" size={32} color="#C4ABDC" />
                  </TouchableOpacity>
                </View>

                {tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>#{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(idx)}>
                          <Ionicons name="close-circle" size={18} color="#9B88D3" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEntry}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingId ? t('common.edit') : t('common.save')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de visualisation */}
        <Modal visible={viewModalVisible} transparent animationType="fade">
          <View style={styles.viewModalOverlay}>
            <View style={styles.viewModalContent}>
              {selectedEntry && (
                <>
                  <View style={styles.viewModalHeader}>
                    <TouchableOpacity
                      onPress={() => handleToggleFavorite(selectedEntry.id, selectedEntry.favorite)}
                      style={styles.viewModalFavorite}
                    >
                      <Ionicons 
                        name={selectedEntry.favorite ? "heart" : "heart-outline"} 
                        size={28} 
                        color={selectedEntry.favorite ? "#FFB5E8" : "#C4ABDC"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                      <Ionicons name="close" size={28} color="#C4ABDC" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.viewModalTitle}>{selectedEntry.title}</Text>
                    
                    <View style={styles.viewModalMeta}>
                      <View style={styles.viewModalMetaItem}>
                        <Text style={styles.viewModalMetaEmoji}>
                          {getMoodData(selectedEntry.mood).emoji}
                        </Text>
                        <Text style={styles.viewModalMetaText}>
                          {t(getMoodData(selectedEntry.mood).labelKey)}
                        </Text>
                      </View>
                      <View style={styles.viewModalMetaItem}>
                        <Ionicons 
                          name={getCategoryData(selectedEntry.category).icon as any} 
                          size={18} 
                          color="#C4ABDC" 
                        />
                        <Text style={styles.viewModalMetaText}>
                          {t(getCategoryData(selectedEntry.category).labelKey)}
                        </Text>
                      </View>
                      <View style={styles.viewModalMetaItem}>
                        <Ionicons name="calendar-outline" size={18} color="#C4ABDC" />
                        <Text style={styles.viewModalMetaText}>{t('home.week')} {selectedEntry.week}</Text>
                      </View>
                    </View>

                    <Text style={styles.viewModalText}>{selectedEntry.content}</Text>

                    {selectedEntry.tags.length > 0 && (
                      <View style={styles.viewModalTags}>
                        {selectedEntry.tags.map((tag, idx) => (
                          <View key={idx} style={styles.viewModalTag}>
                            <Text style={styles.viewModalTagText}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.viewModalDate}>{formatDate(selectedEntry.createdAt)}</Text>

                    <View style={styles.viewModalActions}>
                      <TouchableOpacity
                        style={styles.viewModalActionButton}
                        onPress={() => handleEditEntry(selectedEntry)}
                      >
                        <Ionicons name="create-outline" size={20} color="#C4ABDC" />
                        <Text style={styles.viewModalActionText}>{t('common.edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.viewModalActionButton, styles.deleteActionButton]}
                        onPress={() => handleDeleteEntry(selectedEntry.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF9AA2" />
                        <Text style={[styles.viewModalActionText, { color: '#FF9AA2' }]}>
                          {t('common.delete')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B0E20' },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  favoriteFilterButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  statValue: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 4 },
  categoryFilter: { marginBottom: 20, maxHeight: 50 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(196,171,220,0.1)', marginRight: 10, gap: 6, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  filterChipActive: { backgroundColor: '#C4ABDC' },
  filterChipText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  filterChipTextActive: { color: '#1B0E20' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
  emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8, textAlign: 'center' },
  entryCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  entryHeaderLeft: { flexDirection: 'row', flex: 1, gap: 12 },
  categoryIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  entryHeaderText: { flex: 1 },
  entryTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 4 },
  entryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryMood: { fontSize: 13, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  entryWeek: { fontSize: 13, color: '#9B88D3', fontFamily: 'Poppins_400Regular' },
  entryContent: { color: '#FFFFFF', fontSize: 14, lineHeight: 22, fontFamily: 'Poppins_400Regular', marginBottom: 12 },
  entryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  entryTag: { backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  entryTagText: { color: '#C4ABDC', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  entryMoreTags: { color: '#9B88D3', fontSize: 11, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 6 },
  entryDate: { color: '#876BB8', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  fab: { position: 'absolute', right: 24, bottom: 24, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  textArea: { height: 180, textAlignVertical: 'top' },
  moodSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  moodButton: { flex: 1, minWidth: 100, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  moodLabelActive: { color: '#1B0E20' },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', gap: 8, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  categoryButtonActive: { backgroundColor: '#C4ABDC' },
  categoryButtonText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  categoryButtonTextActive: { color: '#1B0E20' },
  tagInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addTagButton: { marginTop: 0 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 8 },
  tagChipText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  viewModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', paddingHorizontal: 20 },
  viewModalContent: { backgroundColor: '#2A1A35', borderRadius: 24, padding: 24, maxHeight: '85%' },
  viewModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  viewModalFavorite: { padding: 4 },
  viewModalTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 16 },
  viewModalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  viewModalMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewModalMetaEmoji: { fontSize: 18 },
  viewModalMetaText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  viewModalText: { color: '#FFFFFF', fontSize: 15, lineHeight: 24, fontFamily: 'Poppins_400Regular', marginBottom: 20 },
  viewModalTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  viewModalTag: { backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  viewModalTagText: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  viewModalDate: { color: '#876BB8', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 24 },
  viewModalActions: { flexDirection: 'row', gap: 12 },
  viewModalActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.15)', gap: 8, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  deleteActionButton: { backgroundColor: 'rgba(255,154,162,0.15)', borderColor: 'rgba(255,154,162,0.3)' },
  viewModalActionText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});