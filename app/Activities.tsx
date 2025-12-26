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

interface Activity {
  id: string;
  date: Date;
  type: 'exercise' | 'nutrition';
  exerciseType?: string;
  duration?: number;
  mealType?: string;
  foods?: string[];
  calories?: number;
  waterIntake?: number;
  completed: boolean;
  createdAt: Date;
  [key: string]: any;
}

export default function Activities() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'exercise' | 'nutrition'>('exercise');
  const [selectedType, setSelectedType] = useState<'exercise' | 'nutrition'>('exercise');

  const [exerciseType, setExerciseType] = useState('');
  const [duration, setDuration] = useState('');
  const [mealType, setMealType] = useState('');
  const [foodInput, setFoodInput] = useState('');
  const [foods, setFoods] = useState<string[]>([]);
  const [calories, setCalories] = useState('');
  const [waterIntake, setWaterIntake] = useState('');

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'activities'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Activity[];
      setActivities(data);
    });

    return () => unsubscribe();
  }, []);

  const handleAddActivity = async () => {
    if (!auth.currentUser) return;

    const baseData = {
      type: selectedType,
      date: new Date(),
      completed: false,
      createdAt: new Date(),
    };

    let activityData: any = { ...baseData };

    if (selectedType === 'exercise') {
      if (!exerciseType.trim() || !duration) {
        Alert.alert(t('common.error'), t('activities.fillAllFields'));
        return;
      }
      activityData = { ...activityData, exerciseType, duration: parseInt(duration) };
    } else {
      if (!mealType.trim() || foods.length === 0) {
        Alert.alert(t('common.error'), t('activities.fillMealAndFoods'));
        return;
      }
      activityData = {
        ...activityData,
        mealType,
        foods,
        calories: calories ? parseInt(calories) : 0,
        waterIntake: waterIntake ? parseInt(waterIntake) : 0,
      };
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'activities'), activityData);
      resetForm();
      setModalVisible(false);
      Alert.alert(t('common.success'), t('activities.activityAdded'));
    } catch (error) {
      Alert.alert(t('common.error'), t('activities.cannotUpdate'));
    }
  };

  const handleToggleCompleted = async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'activities', id), {
        completed: !currentStatus,
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('activities.cannotUpdate'));
    }
  };

  const handleDeleteActivity = (id: string) => {
    Alert.alert(t('activities.confirmDelete'), t('activities.deleteQuestion'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'activities', id));
          } catch (error) {
            Alert.alert(t('common.error'), t('activities.cannotDelete'));
          }
        },
      },
    ]);
  };

  const addFood = () => {
    if (foodInput.trim()) {
      setFoods([...foods, foodInput.trim()]);
      setFoodInput('');
    }
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setExerciseType('');
    setDuration('');
    setMealType('');
    setFoodInput('');
    setFoods([]);
    setCalories('');
    setWaterIntake('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const exerciseActivities = activities.filter(a => a.type === 'exercise');
  const nutritionActivities = activities.filter(a => a.type === 'nutrition');
  const displayedActivities = selectedTab === 'exercise' ? exerciseActivities : nutritionActivities;

  const todayExerciseTime = exerciseActivities
    .filter(a => a.date.toDateString() === new Date().toDateString())
    .reduce((sum, a) => sum + (a.duration || 0), 0);

  const todayCalories = nutritionActivities
    .filter(a => a.date.toDateString() === new Date().toDateString())
    .reduce((sum, a) => sum + (a.calories || 0), 0);

  const todayWater = nutritionActivities
    .filter(a => a.date.toDateString() === new Date().toDateString())
    .reduce((sum, a) => sum + (a.waterIntake || 0), 0);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('activities.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="timer-outline" size={24} color="#C4ABDC" />
            </View>
            <Text style={styles.statValue}>{todayExerciseTime} min</Text>
            <Text style={styles.statLabel}>{t('activities.exerciseToday')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="flame-outline" size={24} color="#FFB5E8" />
            </View>
            <Text style={styles.statValue}>{todayCalories}</Text>
            <Text style={styles.statLabel}>{t('activities.calories')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="water-outline" size={24} color="#9B88D3" />
            </View>
            <Text style={styles.statValue}>{todayWater} ml</Text>
            <Text style={styles.statLabel}>{t('activities.water')}</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'exercise' && styles.tabActive]}
            onPress={() => setSelectedTab('exercise')}
            activeOpacity={0.7}
          >
            <Ionicons name="fitness-outline" size={20} color={selectedTab === 'exercise' ? '#1B0E20' : '#C4ABDC'} />
            <Text style={[styles.tabText, selectedTab === 'exercise' && styles.tabTextActive]}>{t('activities.exercises')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'nutrition' && styles.tabActive]}
            onPress={() => setSelectedTab('nutrition')}
            activeOpacity={0.7}
          >
            <Ionicons name="nutrition-outline" size={20} color={selectedTab === 'nutrition' ? '#1B0E20' : '#C4ABDC'} />
            <Text style={[styles.tabText, selectedTab === 'nutrition' && styles.tabTextActive]}>{t('activities.nutrition')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {displayedActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name={selectedTab === 'exercise' ? 'fitness-outline' : 'nutrition-outline'}
                  size={60}
                  color="#5D3A7D"
                />
                <Text style={styles.emptyText}>{t('activities.noActivity')}</Text>
                <Text style={styles.emptySubtext}>
                  {selectedTab === 'exercise' ? t('activities.addFirstExercise') : t('activities.addFirstMeal')}
                </Text>
              </View>
            ) : (
              displayedActivities.map(activity => (
                <View key={activity.id} style={styles.activityCard}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => handleToggleCompleted(activity.id, activity.completed)}
                  >
                    <View style={[styles.checkbox, activity.completed && styles.checkboxCompleted]}>
                      {activity.completed && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.activityIconContainer}>
                    <Ionicons
                      name={activity.type === 'exercise' ? 'fitness-outline' : 'nutrition-outline'}
                      size={24}
                      color={activity.type === 'exercise' ? '#C4ABDC' : '#FFB5E8'}
                    />
                  </View>

                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, activity.completed && styles.activityTitleCompleted]}>
                      {activity.type === 'exercise' ? activity.exerciseType : activity.mealType}
                    </Text>
                    <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                    {activity.type === 'exercise' && (
                      <View style={styles.activityDetail}>
                        <Ionicons name="timer-outline" size={14} color="#9B88D3" />
                        <Text style={styles.activityDetailText}>{activity.duration} {t('activities.minutes')}</Text>
                      </View>
                    )}
                    {activity.type === 'nutrition' && (
                      <>
                        {activity.foods && activity.foods.length > 0 && (
                          <View style={styles.foodsList}>
                            {activity.foods.map((food, idx) => (
                              <View key={idx} style={styles.foodTag}>
                                <Text style={styles.foodTagText}>{food}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        <View style={styles.nutritionStats}>
                          {activity.calories ? (
                            <View style={styles.nutritionStat}>
                              <Ionicons name="flame-outline" size={14} color="#FFB5E8" />
                              <Text style={styles.nutritionStatText}>{activity.calories} kcal</Text>
                            </View>
                          ) : null}
                          {activity.waterIntake ? (
                            <View style={styles.nutritionStat}>
                              <Ionicons name="water-outline" size={14} color="#9B88D3" />
                              <Text style={styles.nutritionStatText}>{activity.waterIntake} ml</Text>
                            </View>
                          ) : null}
                        </View>
                      </>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => handleDeleteActivity(activity.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#FF9AA2" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetForm();
            setSelectedType(selectedTab);
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
                  {selectedType === 'exercise' ? t('activities.addExercise') : t('activities.addMeal')}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {selectedType === 'exercise' ? (
                  <>
                    <Text style={styles.inputLabel}>{t('activities.exerciseType')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('activities.exercisePlaceholder')}
                      placeholderTextColor="#9B88D3"
                      value={exerciseType}
                      onChangeText={setExerciseType}
                    />

                    <Text style={styles.inputLabel}>{t('activities.durationMinutes')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('activities.durationPlaceholder')}
                      placeholderTextColor="#9B88D3"
                      keyboardType="numeric"
                      value={duration}
                      onChangeText={setDuration}
                    />

                    <View style={styles.recommendedCard}>
                      <Text style={styles.recommendedTitle}>{t('activities.recommendedExercises')}</Text>
                      <Text style={styles.recommendedText}>{t('activities.prenatalYoga')}</Text>
                      <Text style={styles.recommendedText}>{t('activities.lightWalk')}</Text>
                      <Text style={styles.recommendedText}>{t('activities.gentleSwimming')}</Text>
                      <Text style={styles.recommendedText}>{t('activities.adaptedPilates')}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.inputLabel}>{t('activities.mealType')}</Text>
                    <View style={styles.mealTypeSelector}>
                      {[
                        { key: 'breakfast', label: t('activities.breakfast') },
                        { key: 'lunch', label: t('activities.lunch') },
                        { key: 'dinner', label: t('activities.dinner') },
                        { key: 'snack', label: t('activities.snack') }
                      ].map(meal => (
                        <TouchableOpacity
                          key={meal.key}
                          style={[styles.mealTypeButton, mealType === meal.label && styles.mealTypeButtonActive]}
                          onPress={() => setMealType(meal.label)}
                        >
                          <Text style={[styles.mealTypeText, mealType === meal.label && styles.mealTypeTextActive]}>
                            {meal.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inputLabel}>{t('activities.foods')}</Text>
                    <View style={styles.foodInputContainer}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder={t('activities.addFood')}
                        placeholderTextColor="#9B88D3"
                        value={foodInput}
                        onChangeText={setFoodInput}
                        onSubmitEditing={addFood}
                      />
                      <TouchableOpacity style={styles.addFoodButton} onPress={addFood}>
                        <Ionicons name="add-circle" size={32} color="#C4ABDC" />
                      </TouchableOpacity>
                    </View>

                    {foods.length > 0 && (
                      <View style={styles.foodsListContainer}>
                        {foods.map((food, idx) => (
                          <View key={idx} style={styles.foodChip}>
                            <Text style={styles.foodChipText}>{food}</Text>
                            <TouchableOpacity onPress={() => removeFood(idx)}>
                              <Ionicons name="close-circle" size={18} color="#9B88D3" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.inputLabel}>{t('activities.caloriesOptional')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('activities.caloriesPlaceholder')}
                      placeholderTextColor="#9B88D3"
                      keyboardType="numeric"
                      value={calories}
                      onChangeText={setCalories}
                    />

                    <Text style={styles.inputLabel}>{t('activities.waterIntakeOptional')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('activities.waterPlaceholder')}
                      placeholderTextColor="#9B88D3"
                      keyboardType="numeric"
                      value={waterIntake}
                      onChangeText={setWaterIntake}
                    />

                    <View style={styles.recommendedCard}>
                      <Text style={styles.recommendedTitle}>{t('activities.hydration')}</Text>
                      <Text style={styles.recommendedText}>{t('activities.hydrationGoal')}</Text>
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleAddActivity}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
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
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 11, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 4 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', gap: 8, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  tabActive: { backgroundColor: '#C4ABDC' },
  tabText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  tabTextActive: { color: '#1B0E20' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
  emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  activityCard: { flexDirection: 'row', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)', alignItems: 'flex-start' },
  checkboxContainer: { marginRight: 12, paddingTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C4ABDC', justifyContent: 'center', alignItems: 'center' },
  checkboxCompleted: { backgroundColor: '#C4ABDC', borderColor: '#C4ABDC' },
  activityIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  activityTitleCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },
  activityDate: { color: '#9B88D3', fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  activityDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activityDetailText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  foodsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  foodTag: { backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  foodTagText: { color: '#C4ABDC', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  nutritionStats: { flexDirection: 'row', gap: 16 },
  nutritionStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nutritionStatText: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  deleteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  fab: { position: 'absolute', right: 24, bottom: 24, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  mealTypeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealTypeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  mealTypeButtonActive: { backgroundColor: '#C4ABDC' },
  mealTypeText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  mealTypeTextActive: { color: '#1B0E20' },
  foodInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addFoodButton: { marginTop: 0 },
  foodsListContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  foodChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 8 },
  foodChipText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  recommendedCard: { backgroundColor: 'rgba(196,171,220,0.08)', borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  recommendedTitle: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_700Bold', marginBottom: 8 },
  recommendedText: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});