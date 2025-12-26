import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
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

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  purchased: boolean;
  createdAt: Date;
}

type Category = 'baby' | 'mom' | 'house' | 'other';

export default function ShoppingList() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('baby');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  const categories: Category[] = ['baby', 'mom', 'house', 'other'];

  const getCategoryLabel = (cat: Category | 'all') => {
    if (cat === 'all') return t('shoppingList.all');
    return t(`shoppingList.${cat}`);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'shopping_items'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        purchased: doc.data().purchased || false,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as ShoppingItem[];
      setItems(data);
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async () => {
    if (!auth.currentUser) return;

    if (!itemName.trim()) {
      Alert.alert(t('common.error'), t('shoppingList.enterItem'));
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'shopping_items'), {
        name: itemName.trim(),
        category: selectedCategory,
        purchased: false,
        createdAt: new Date(),
      });

      setItemName('');
      setModalVisible(false);
      Alert.alert(t('common.success'), t('shoppingList.itemAdded'));
    } catch (error) {
      Alert.alert(t('common.error'), t('activities.cannotUpdate'));
    }
  };

  const handleTogglePurchased = async (itemId: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'shopping_items', itemId), {
        purchased: !currentStatus,
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('activities.cannotUpdate'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!auth.currentUser) return;

    Alert.alert(t('common.delete'), t('shoppingList.deleteItem'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'shopping_items', itemId));
          } catch (error) {
            Alert.alert(t('common.error'), t('activities.cannotDelete'));
          }
        },
      },
    ]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'baby':
        return 'body-outline';
      case 'mom':
        return 'heart-outline';
      case 'house':
        return 'home-outline';
      case 'other':
        return 'ellipsis-horizontal-outline';
      default:
        return 'bag-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'baby':
        return '#FFB5E8';
      case 'mom':
        return '#C4ABDC';
      case 'house':
        return '#9B88D3';
      case 'other':
        return '#876BB8';
      default:
        return '#C4ABDC';
    }
  };

  const filteredItems =
    filterCategory === 'all' ? items : items.filter(item => item.category === filterCategory);

  const purchasedCount = items.filter(item => item.purchased).length;
  const totalCount = items.length;

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('shoppingList.title')}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#C4ABDC" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Ionicons name="checkmark-circle" size={32} color="#C4ABDC" />
                <View style={styles.progressTextContainer}>
                  <Text style={styles.progressTitle}>
                    {purchasedCount}/{totalCount} {t('shoppingList.itemsPurchased')}
                  </Text>
                  <Text style={styles.progressSubtitle}>
                    {totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0}% {t('shoppingList.completed')}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0}%` },
                  ]}
                />
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <TouchableOpacity
                style={[styles.categoryChip, filterCategory === 'all' && styles.categoryChipActive]}
                onPress={() => setFilterCategory('all')}
              >
                <Text
                  style={[styles.categoryChipText, filterCategory === 'all' && styles.categoryChipTextActive]}
                >
                  {getCategoryLabel('all')} ({items.length})
                </Text>
              </TouchableOpacity>
              {categories.map(cat => {
                const count = items.filter(item => item.category === cat).length;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, filterCategory === cat && styles.categoryChipActive]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat) as any}
                      size={16}
                      color={filterCategory === cat ? '#1B0E20' : '#C4ABDC'}
                    />
                    <Text
                      style={[styles.categoryChipText, filterCategory === cat && styles.categoryChipTextActive]}
                    >
                      {getCategoryLabel(cat)} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={60} color="#5D3A7D" />
                <Text style={styles.emptyText}>{t('shoppingList.noItem')}</Text>
                <Text style={styles.emptySubtext}>
                  {filterCategory === 'all'
                    ? t('shoppingList.addFirstItem')
                    : `${t('shoppingList.noItemInCategory')} ${getCategoryLabel(filterCategory)}`}
                </Text>
              </View>
            ) : (
              filteredItems.map(item => (
                <View key={item.id} style={styles.itemCard}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => handleTogglePurchased(item.id, item.purchased)}
                  >
                    <View style={[styles.checkbox, item.purchased && styles.checkboxActive]}>
                      {item.purchased && <Ionicons name="checkmark" size={16} color="#1B0E20" />}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, item.purchased && styles.itemNamePurchased]}>
                      {item.name}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Ionicons
                        name={getCategoryIcon(item.category) as any}
                        size={12}
                        color={getCategoryColor(item.category)}
                      />
                      <Text style={[styles.categoryBadgeText, { color: getCategoryColor(item.category) }]}>
                        {getCategoryLabel(item.category as Category)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('shoppingList.newItem')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('shoppingList.itemName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('shoppingList.itemPlaceholder')}
                    placeholderTextColor="#9B88D3"
                    value={itemName}
                    onChangeText={setItemName}
                  />
                </View>

                <Text style={styles.inputLabel}>{t('journal.category')}</Text>
                <View style={styles.categoryGrid}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        selectedCategory === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Ionicons
                        name={getCategoryIcon(cat) as any}
                        size={24}
                        color={selectedCategory === cat ? '#1B0E20' : getCategoryColor(cat)}
                      />
                      <Text
                        style={[
                          styles.categoryButtonText,
                          selectedCategory === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {getCategoryLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleAddItem}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>{t('shoppingList.addToList')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(196,171,220,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(196,171,220,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  progressCard: {
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.2)',
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  progressTextContainer: { marginLeft: 12, flex: 1 },
  progressTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  progressSubtitle: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(196,171,220,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#C4ABDC', borderRadius: 4 },
  categoryScroll: { marginBottom: 24 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.2)',
  },
  categoryChipActive: { backgroundColor: '#C4ABDC' },
  categoryChipText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  categoryChipTextActive: { color: '#1B0E20' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
  emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196,171,220,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.2)',
  },
  checkboxContainer: { marginRight: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C4ABDC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#C4ABDC', borderColor: '#C4ABDC' },
  itemContent: { flex: 1 },
  itemName: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  itemNamePurchased: {
    color: '#9B88D3',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryBadgeText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,107,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#2A1A35',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalBody: { paddingHorizontal: 24 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.3)',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, marginTop: 8 },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.3)',
    gap: 8,
  },
  categoryButtonActive: { backgroundColor: '#C4ABDC', borderColor: '#C4ABDC' },
  categoryButtonText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  categoryButtonTextActive: { color: '#1B0E20' },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});