import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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

interface Post {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  category: string;
  week: number;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  isAnonymous: boolean;
  createdAt: Date;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
}

const categories = [
  { value: 'conseil', label: 'Conseil', icon: 'bulb-outline', color: '#C4ABDC' },
  { value: 'question', label: 'Question', icon: 'help-circle-outline', color: '#9B88D3' },
  { value: 'témoignage', label: 'Témoignage', icon: 'heart-outline', color: '#FFB5E8' },
  { value: 'soutien', label: 'Soutien', icon: 'people-outline', color: '#876BB8' },
];

export default function Community() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('question');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(24);
  const [userName, setUserName] = useState('');

  const [commentInput, setCommentInput] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubUser = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentWeek(Number(data.semaineGrossesse) || 24);
        setUserName(data.prenom || 'Anonyme');
      }
    });

    const q = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubPosts = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Post[];
      setPosts(data);
    });

    return () => {
      unsubUser();
      unsubPosts();
    };
  }, []);

  const handleCreatePost = async () => {
    if (!auth.currentUser) return;

    if (!title.trim() || !content.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const postData = {
      userId: auth.currentUser.uid,
      userName: isAnonymous ? 'Anonyme' : userName,
      title,
      content,
      category,
      week: currentWeek,
      likes: 0,
      likedBy: [],
      commentsCount: 0,
      isAnonymous,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'community_posts'), postData);
      resetForm();
      setModalVisible(false);
      Alert.alert('Succès', 'Publication partagée avec la communauté');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier');
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!auth.currentUser) return;

    const postRef = doc(db, 'community_posts', post.id);
    const hasLiked = post.likedBy.includes(auth.currentUser.uid);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(auth.currentUser.uid),
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(auth.currentUser.uid),
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le like');
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Confirmation', 'Supprimer cette publication ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'community_posts', postId));
            setCommentsModalVisible(false);
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);

    const commentsRef = collection(db, 'community_posts', post.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubComments = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Comment[];
      setComments(data);
    });

    return unsubComments;
  };

  const handleAddComment = async () => {
    if (!auth.currentUser || !selectedPost) return;

    if (!commentInput.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire un commentaire');
      return;
    }

    const commentData = {
      userId: auth.currentUser.uid,
      userName: commentAnonymous ? 'Anonyme' : userName,
      content: commentInput,
      isAnonymous: commentAnonymous,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'community_posts', selectedPost.id, 'comments'), commentData);
      await updateDoc(doc(db, 'community_posts', selectedPost.id), {
        commentsCount: increment(1),
      });
      setCommentInput('');
      setCommentAnonymous(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!auth.currentUser || !selectedPost) return;

    Alert.alert('Confirmation', 'Supprimer ce commentaire ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'community_posts', selectedPost.id, 'comments', commentId));
            await updateDoc(doc(db, 'community_posts', selectedPost.id), {
              commentsCount: increment(-1),
            });
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('question');
    setIsAnonymous(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getCategoryData = (catValue: string) => categories.find(c => c.value === catValue) || categories[0];

  let filteredPosts = posts;
  if (filterCategory) {
    filteredPosts = filteredPosts.filter(p => p.category === filterCategory);
  }

  const myPosts = posts.filter(p => p.userId === auth.currentUser?.uid);
  const totalLikesReceived = myPosts.reduce((sum, p) => sum + p.likes, 0);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Communauté</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myPosts.length}</Text>
            <Text style={styles.statLabel}>Mes posts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalLikesReceived}</Text>
            <Text style={styles.statLabel}>Likes reçus</Text>
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
              Tout
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
                color={filterCategory === cat.value ? '#1B0E20' : cat.color} 
              />
              <Text style={[styles.filterChipText, filterCategory === cat.value && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {filteredPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={60} color="#5D3A7D" />
                <Text style={styles.emptyText}>Aucune publication</Text>
                <Text style={styles.emptySubtext}>
                  Soyez la première à partager !
                </Text>
              </View>
            ) : (
              filteredPosts.map(post => {
                const catData = getCategoryData(post.category);
                const hasLiked = post.likedBy.includes(auth.currentUser?.uid || '');
                const isMyPost = post.userId === auth.currentUser?.uid;

                return (
                  <View key={post.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.postHeaderLeft}>
                        <View style={[styles.avatarCircle, { backgroundColor: catData.color + '33' }]}>
                          <Text style={[styles.avatarText, { color: catData.color }]}>
                            {post.userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.postHeaderInfo}>
                          <View style={styles.postHeaderRow}>
                            <Text style={styles.postUserName}>{post.userName}</Text>
                            {post.isAnonymous && (
                              <View style={styles.anonymousBadge}>
                                <Ionicons name="eye-off-outline" size={10} color="#876BB8" />
                              </View>
                            )}
                          </View>
                          <View style={styles.postMetaRow}>
                            <View style={[styles.categoryBadge, { backgroundColor: catData.color + '33' }]}>
                              <Ionicons name={catData.icon as any} size={12} color={catData.color} />
                              <Text style={[styles.categoryBadgeText, { color: catData.color }]}>
                                {catData.label}
                              </Text>
                            </View>
                            <Text style={styles.postWeek}>• S{post.week}</Text>
                            <Text style={styles.postDate}>• {formatDate(post.createdAt)}</Text>
                          </View>
                        </View>
                      </View>
                      {isMyPost && (
                        <TouchableOpacity onPress={() => handleDeletePost(post.id)} style={styles.deletePostButton}>
                          <Ionicons name="trash-outline" size={18} color="#FF9AA2" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postContent} numberOfLines={4}>{post.content}</Text>

                    <View style={styles.postActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleToggleLike(post)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={hasLiked ? "heart" : "heart-outline"} 
                          size={20} 
                          color={hasLiked ? "#FFB5E8" : "#C4ABDC"} 
                        />
                        <Text style={[styles.actionText, hasLiked && { color: '#FFB5E8' }]}>
                          {post.likes}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleOpenComments(post)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color="#C4ABDC" />
                        <Text style={styles.actionText}>{post.commentsCount}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
                <Text style={styles.modalTitle}>Nouvelle publication</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Titre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Besoin de conseils pour..."
                  placeholderTextColor="#9B88D3"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Catégorie *</Text>
                <View style={styles.categorySelector}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryButton,
                        category === cat.value && { backgroundColor: cat.color }
                      ]}
                      onPress={() => setCategory(cat.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={18} 
                        color={category === cat.value ? '#1B0E20' : cat.color} 
                      />
                      <Text style={[
                        styles.categoryButtonText,
                        category === cat.value && styles.categoryButtonTextActive
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Votre message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Partagez votre expérience, posez une question..."
                  placeholderTextColor="#9B88D3"
                  multiline
                  numberOfLines={8}
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.anonymousToggle}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                  activeOpacity={0.7}
                >
                  <View style={styles.anonymousToggleLeft}>
                    <Ionicons name="eye-off-outline" size={20} color="#C4ABDC" />
                    <Text style={styles.anonymousToggleText}>Publier en anonyme</Text>
                  </View>
                  <View style={[styles.toggle, isAnonymous && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, isAnonymous && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>

                <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={20} color="#9B88D3" />
                  <Text style={styles.infoText}>
                    Votre publication sera visible par toutes les utilisatrices. 
                    Soyez respectueuse et bienveillante.
                  </Text>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleCreatePost}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Publier</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        
        <Modal visible={commentsModalVisible} transparent animationType="slide">
          <View style={styles.commentsModalOverlay}>
            <View style={styles.commentsModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Commentaires</Text>
                <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              {selectedPost && (
                <>
                  <View style={styles.selectedPostPreview}>
                    <Text style={styles.selectedPostTitle} numberOfLines={2}>
                      {selectedPost.title}
                    </Text>
                    <Text style={styles.selectedPostMeta}>
                      Par {selectedPost.userName} • S{selectedPost.week}
                    </Text>
                  </View>

                  <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                    {comments.length === 0 ? (
                      <View style={styles.emptyComments}>
                        <Ionicons name="chatbubble-outline" size={40} color="#5D3A7D" />
                        <Text style={styles.emptyCommentsText}>Aucun commentaire</Text>
                        <Text style={styles.emptyCommentsSubtext}>Soyez la première à réagir</Text>
                      </View>
                    ) : (
                      comments.map(comment => {
                        const isMyComment = comment.userId === auth.currentUser?.uid;
                        return (
                          <View key={comment.id} style={styles.commentCard}>
                            <View style={styles.commentHeader}>
                              <View style={styles.commentAvatar}>
                                <Text style={styles.commentAvatarText}>
                                  {comment.userName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.commentHeaderInfo}>
                                <View style={styles.commentNameRow}>
                                  <Text style={styles.commentUserName}>{comment.userName}</Text>
                                  {comment.isAnonymous && (
                                    <View style={styles.anonymousBadgeSmall}>
                                      <Ionicons name="eye-off-outline" size={8} color="#876BB8" />
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                              </View>
                              {isMyComment && (
                                <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                                  <Ionicons name="trash-outline" size={16} color="#FF9AA2" />
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={styles.commentContent}>{comment.content}</Text>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>

                  <View style={styles.commentInputContainer}>
                    <TouchableOpacity
                      onPress={() => setCommentAnonymous(!commentAnonymous)}
                      style={styles.commentAnonymousButton}
                    >
                      <Ionicons 
                        name={commentAnonymous ? "eye-off" : "eye-off-outline"} 
                        size={20} 
                        color={commentAnonymous ? "#876BB8" : "#9B88D3"} 
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Écrire un commentaire..."
                      placeholderTextColor="#9B88D3"
                      value={commentInput}
                      onChangeText={setCommentInput}
                      multiline
                    />
                    <TouchableOpacity
                      onPress={handleAddComment}
                      style={styles.sendCommentButton}
                      disabled={!commentInput.trim()}
                    >
                      <Ionicons 
                        name="send" 
                        size={20} 
                        color={commentInput.trim() ? "#C4ABDC" : "#5D3A7D"} 
                      />
                    </TouchableOpacity>
                  </View>
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
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  statValue: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 11, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 4, textAlign: 'center' },
  categoryFilter: { marginBottom: 20, maxHeight: 50 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(196,171,220,0.1)', marginRight: 10, gap: 6, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  filterChipActive: { backgroundColor: '#C4ABDC' },
  filterChipText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  filterChipTextActive: { color: '#1B0E20' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
  emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  postCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  postHeaderLeft: { flexDirection: 'row', flex: 1, gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  postHeaderInfo: { flex: 1 },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  postUserName: { fontSize: 15, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  anonymousBadge: { backgroundColor: 'rgba(135,107,184,0.3)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  postMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  categoryBadgeText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  postWeek: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_400Regular' },
  postDate: { fontSize: 12, color: '#876BB8', fontFamily: 'Poppins_400Regular' },
  deletePostButton: { padding: 4 },
  postTitle: { fontSize: 17, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 10 },
  postContent: { color: '#FFFFFF', fontSize: 14, lineHeight: 22, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  postActions: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: 'rgba(196,171,220,0.2)', paddingTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  fab: { position: 'absolute', right: 24, bottom: 24, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  textArea: { height: 150, textAlignVertical: 'top' },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', gap: 8, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  categoryButtonText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  categoryButtonTextActive: { color: '#1B0E20' },
  anonymousToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  anonymousToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  anonymousToggleText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'rgba(196,171,220,0.3)', padding: 2, justifyContent: 'center' },
  toggleActive: { backgroundColor: '#C4ABDC' },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  infoCard: { flexDirection: 'row', backgroundColor: 'rgba(155,136,211,0.15)', borderRadius: 12, padding: 14, marginTop: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(155,136,211,0.3)' },
  infoText: { flex: 1, color: '#C4ABDC', fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  commentsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  commentsModalContent: { flex: 1, backgroundColor: '#2A1A35', paddingTop: 60 },
  selectedPostPreview: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, marginHorizontal: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  selectedPostTitle: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
  selectedPostMeta: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_400Regular' },
  commentsList: { flex: 1, paddingHorizontal: 24 },
  emptyComments: { alignItems: 'center', paddingVertical: 60 },
  emptyCommentsText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 12 },
  emptyCommentsSubtext: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 6 },
  commentCard: { backgroundColor: 'rgba(196,171,220,0.08)', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.15)' },
  commentHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(196,171,220,0.2)', justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { fontSize: 14, color: '#C4ABDC', fontFamily: 'Poppins_700Bold' },
  commentHeaderInfo: { flex: 1 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  commentUserName: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  anonymousBadgeSmall: { backgroundColor: 'rgba(135,107,184,0.3)', borderRadius: 6, padding: 3 },
  commentDate: { fontSize: 11, color: '#876BB8', fontFamily: 'Poppins_400Regular' },
  commentContent: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontFamily: 'Poppins_400Regular' },
  commentInputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#1B0E20', borderTopWidth: 1, borderTopColor: 'rgba(196,171,220,0.2)', gap: 10 },
  commentAnonymousButton: { padding: 8, backgroundColor: 'rgba(196,171,220,0.15)', borderRadius: 12 },
  commentInput: { flex: 1, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', maxHeight: 80, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  sendCommentButton: { padding: 10, backgroundColor: 'rgba(196,171,220,0.15)', borderRadius: 12 },
});