import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import notifee from '@notifee/react-native';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  dueDate: Date | null;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const createNotificationChannel = async () => {
      try {
        await notifee.createChannel({
          id: 'todo_reminders',
          name: 'Todo Reminders',
          sound: 'default',
          vibration: true,
        });
      } catch (error) {
        console.log('Channel creation error:', error);
      }
    };

    createNotificationChannel();

    // Handle notification foreground event (when app is open)
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      console.log('Notification event type:', type);
      console.log('Notification detail:', detail);

      // Type 1 = PRESS, Type 2 = ACTION_PRESS
      if (type === 2 && detail.pressAction?.id === 'mark_completed') {
        const todoId = detail.notification?.data?.todoId;
        console.log('Mark completed pressed for todo:', todoId);
        if (todoId) {
          setTodos(prevTodos =>
            prevTodos.map(todo =>
              todo.id === todoId ? { ...todo, completed: true } : todo
            )
          );
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent todos={todos} setTodos={setTodos} />
    </SafeAreaProvider>
  );
}

function AppContent({ todos: parentTodos, setTodos: setParentTodos }: { todos: Todo[]; setTodos: React.Dispatch<React.SetStateAction<Todo[]>> }) {
  const safeAreaInsets = useSafeAreaInsets();
  const [todos, setTodos] = useState<Todo[]>(parentTodos);
  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const isDarkMode = useColorScheme() === 'dark';

  // Sync parent todos to local state
  useEffect(() => {
    setTodos(parentTodos);
  }, [parentTodos]);

  // Sync local todos to parent
  useEffect(() => {
    setParentTodos(todos);
  }, [todos, setParentTodos]);

  // Check for due notifications periodically
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      todos.forEach(todo => {
        if (
          todo.dueDate &&
          !todo.completed &&
          todo.dueDate.getTime() <= now.getTime() &&
          todo.dueDate.getTime() > now.getTime() - 60000
        ) {
          // Send notification
          sendNotification(todo);
        }
      });
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [todos]);

  const sendNotification = async (todo: Todo) => {
    try {
      await notifee.displayNotification({
        id: todo.id,
        title: '📋 Todo Reminder',
        body: `Time to: ${todo.text}`,
        data: {
          todoId: todo.id,
        },
        android: {
          channelId: 'todo_reminders',
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          actions: [
            {
              title: 'Mark Completed',
              icon: 'ic_launcher',
              pressAction: {
                id: 'mark_completed',
                launchActivity: 'default',
              },
            },
            {
              title: 'Dismiss',
              pressAction: {
                id: 'dismiss',
                launchActivity: 'default',
              },
            },
          ],
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.log('Notification error:', error);
    }
  };

  const handleDateChange = (event: any, date: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      if (datePickerMode === 'date') {
        setSelectedDate(date);
        // On iOS, show time picker after selecting date
        if (Platform.OS === 'ios') {
          setDatePickerMode('time');
        }
      } else {
        setShowTimePicker(false);
      }
    }
  };

  const handleTimeChange = (event: any, date: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date && selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes());
      setSelectedDate(newDate);
      if (Platform.OS === 'ios') {
        setDatePickerMode('date');
      }
    }
  };

  const openDatePicker = () => {
    setDatePickerMode('date');
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const openTimePicker = () => {
    if (!selectedDate) {
      Alert.alert('Please select a date first');
      return;
    }
    setDatePickerMode('time');
    if (Platform.OS === 'android') {
      setShowTimePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const formatDateTime = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    const isAfterTomorrow =
      date.getDate() === afterTomorrow.getDate() &&
      date.getMonth() === afterTomorrow.getMonth() &&
      date.getFullYear() === afterTomorrow.getFullYear();

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return `Today, ${dateStr} at ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${dateStr} at ${timeStr}`;
    if (isAfterTomorrow) return `After Tomorrow, ${dateStr} at ${timeStr}`;

    return `${dayName}, ${dateStr} at ${timeStr}`;
  };

  const scheduleNotification = (todo: Todo) => {
    if (!todo.dueDate) return;
    console.log(`Notification scheduled for: ${todo.text} at ${todo.dueDate}`);
  };

  const handleDateTimePress = () => {
    openDatePicker();
  };

  const handleConfirmDateTime = () => {
    if (selectedDate) {
      // Already handled in date/time picker
    }
  };

  const addTodo = () => {
    if (inputValue.trim() === '') return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
      dueDate: selectedDate,
    };
    setTodos([newTodo, ...todos]);
    
    // Schedule notification if due date is set
    if (selectedDate) {
      scheduleNotification(newTodo);
    }
    
    setInputValue('');
    setSelectedDate(null);
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={[styles.todoItem, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleTodo(item.id)}
      >
        <Text style={styles.checkboxText}>
          {item.completed ? '✓' : ''}
        </Text>
      </TouchableOpacity>
      <View style={styles.todoContent}>
        <Text
          style={[
            styles.todoText,
            item.completed && styles.completedText,
            { color: isDarkMode ? '#fff' : '#000' },
          ]}
        >
          {item.text}
        </Text>
        {item.dueDate && (
          <Text
            style={[
              styles.dueDateText,
              { color: isDarkMode ? '#aaa' : '#666' },
            ]}
          >
            📅 {formatDateTime(item.dueDate)}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteTodo(item.id)}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' },
        ]}
      >
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
          My Todos
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: isDarkMode ? '#aaa' : '#666' },
          ]}
        >
          {completedCount} of {todos.length} completed
        </Text>
      </View>

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: safeAreaInsets.bottom },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', color: isDarkMode ? '#fff' : '#000' },
            ]}
            placeholder="Add a new todo..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={addTodo}
          />
          <TouchableOpacity
            style={[styles.dateBtn, { backgroundColor: selectedDate ? '#34C759' : '#999' }]}
            onPress={openDatePicker}
          >
            <Text style={styles.dateBtnText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeBtn, { backgroundColor: selectedDate ? '#34C759' : '#999' }]}
            onPress={openTimePicker}
          >
            <Text style={styles.timeBtnText}>⏰</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {selectedDate && (
        <View style={[styles.datePreview, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.datePreviewText, { color: isDarkMode ? '#fff' : '#000' }]}>
            Due: {formatDateTime(selectedDate)}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDate(null)}>
            <Text style={styles.clearDateText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && selectedDate && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text
            style={[
              styles.emptyText,
              { color: isDarkMode ? '#666' : '#999' },
            ]}
          >
            No todos yet. Add one to get started!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dateBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBtnText: {
    fontSize: 20,
  },
  timeBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBtnText: {
    fontSize: 20,
  },
  addBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  datePreview: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  datePreviewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearDateText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerWrapper: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerDoneText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#999',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 24,
  },
});

export default App;
