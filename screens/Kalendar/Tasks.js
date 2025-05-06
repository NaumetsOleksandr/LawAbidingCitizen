import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import styles from './styles';

const Tasks = ({ route, navigation }) => {
    const { date, onTasksUpdated, userId } = route.params;
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const formattedDate = dayjs(date).format('DD MMMM YYYY');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const allTasks = await fetchTasks(date, userId);
        setTasks(allTasks);
        if (onTasksUpdated) {
            onTasksUpdated();
        }
    };

    const addTaskHandle = async () => {
        if (name.trim()) {
            await insertTask(name, date, userId);
            setName('');
            loadTasks();
        }
    };

    const updateTaskHandle = async () => {
        if (editingId && name.trim()) {
            await updateTask(editingId, name);
            setEditingId(null);
            setName('');
            loadTasks();
        }
    };

    const deleteTaskHandle = async (id) => {
        await deleteTask(id);
        loadTasks();
    };

    useEffect(() => {
        navigation.setOptions({
            title: `Tasks for ${formattedDate}`
        });
    }, [navigation, formattedDate]);

    return (
        <View style={[styles.container]}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input]}
                    placeholder="Enter task name"
                    value={name}
                    onChangeText={setName}
                />
                {editingId ? (
                    <Button title="Update Task" onPress={updateTaskHandle} />
                ) : (
                    <Button title="Add Task" onPress={addTaskHandle} />
                )}
            </View>

            {tasks.length === 0 ? (
                <Text style={styles.noTasksText}>Ніяких планів немає</Text>
            ) : (
                <FlatList
                    style={styles.taskList}
                    data={tasks}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={[styles.taskItem]}>
                            <Text style={styles.taskText}>{item.name}</Text>
                            <View style={styles.taskButtons}>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => {
                                        setEditingId(item.id);
                                        setName(item.name);
                                    }}
                                >
                                    <Text style={styles.buttonText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => deleteTaskHandle(item.id)}
                                >
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default Tasks;