import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
}

const TodoScreen: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const todoList: Todo[] = [];
      querySnapshot.forEach((doc) => {
        todoList.push({ id: doc.id, ...doc.data() } as Todo);
      });
      setTodos(todoList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });

    return () => unsubscribe();
  }, [user]);

  const addTodo = async () => {
    if (!newTodo.trim()) {
      Alert.alert('Error', 'Please enter a task');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'todos'), {
        text: newTodo.trim(),
        completed: false,
        userId: user.uid,
        createdAt: Timestamp.now(),
      });
      setNewTodo('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const todoRef = doc(db, 'todos', todo.id);
      await updateDoc(todoRef, {
        completed: !todo.completed,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const deleteTodo = async (todoId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'todos', todoId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <Animated.View style={[styles.todoItem, {
      backgroundColor: theme.card,
      borderColor: theme.border,
      shadowColor: theme.shadow,
    }]}
    >
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => toggleTodo(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: theme.mode === 'dark'
                ? theme.accent
                : (item.completed ? theme.accent : theme.border),
              backgroundColor: item.completed
                ? theme.accent
                : (theme.mode === 'dark' ? '#23262f' : theme.card),
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 2,
            },
          ]}
        >
          {item.completed && <Text style={[styles.checkmark, { color: '#fff' }]}>✓</Text>}
        </View>
        <Text
          style={[
            styles.todoText,
            { color: theme.text },
            item.completed && styles.completedText,
            item.completed && { color: theme.textSecondary, textDecorationLine: 'line-through' },
          ]}
        >
          {item.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: theme.error }]}
        onPress={() => deleteTodo(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.card }]}
      >
        <Text style={[styles.title, { color: theme.text }]}>My Tasks</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          {todos.filter(todo => !todo.completed).length} tasks remaining
        </Text>
      </View>

      <View style={[styles.inputContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
            color: theme.text,
          }]}
          placeholder="Add a new task..."
          value={newTodo}
          onChangeText={setNewTodo}
          onSubmitEditing={addTodo}
          returnKeyType="done"
          placeholderTextColor={theme.textSecondary}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.accent }, loading && styles.addButtonDisabled]}
          onPress={addTodo}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
            {loading ? '...' : '+'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id}
        style={styles.todoList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No tasks yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}
            >
              Add a task to get started!
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 13,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  todoList: {
    flex: 1,
    padding: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todoText: {
    fontSize: 16,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});

export default TodoScreen; 