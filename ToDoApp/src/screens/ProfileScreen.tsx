import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../config/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { useTheme } from '../contexts/ThemeContext';

interface UserProfile {
  username: string;
  profileImageUrl: string;
}

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    profileImageUrl: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);
        setNewUsername(userData.username || '');
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          username: user.email?.split('@')[0] || 'User',
          profileImageUrl: '',
        };
        await setDoc(doc(db, 'users', user.uid), defaultProfile);
        setProfile(defaultProfile);
        setNewUsername(defaultProfile.username);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const imageRef = ref(storage, `profile-images/${user.uid}`);
      await uploadBytes(imageRef, blob);
      
      const downloadURL = await getDownloadURL(imageRef);
      
      await updateDoc(doc(db, 'users', user.uid), {
        profileImageUrl: downloadURL,
      });
      
      setProfile(prev => ({ ...prev, profileImageUrl: downloadURL }));
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const saveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: newUsername.trim(),
      });
      setProfile(prev => ({ ...prev, username: newUsername.trim() }));
      setIsEditing(false);
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setNewUsername(profile.username);
    setIsEditing(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.card }]}
      >
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      <View style={[styles.profileSection, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
      >
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={pickImage}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {profile.profileImageUrl ? (
            <Image
              source={{ uri: profile.profileImageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: theme.inputBackground }]}
            >
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>👤</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={theme.buttonText} />
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.editBadgeText, { color: theme.buttonText }]}>Edit</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.text }]}>Username</Text>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.editInput, {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  }]}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoFocus
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.success }]}
                  onPress={saveUsername}
                  disabled={loading}
                >
                  <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>
                    {loading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: theme.error }]}
                  onPress={cancelEdit}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.buttonText }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: theme.text }]}>{profile.username}</Text>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.accent }]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={[styles.editButtonText, { color: theme.buttonText }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <Text style={[styles.value, { color: theme.textSecondary }]}>{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? theme.accent : theme.inputBorder}
              trackColor={{ false: theme.inputBorder, true: theme.accent }}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.error }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutButtonText, { color: theme.buttonText }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginRight: 8,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 