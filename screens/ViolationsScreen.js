import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert, TextInput, Linking, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.108:5000/api';
const VIOLATIONS_KEY = '@violations';
const UNSYNCED_VIOLATIONS_KEY = '@unsynced_violations';

const ViolationsScreen = ({ route, navigation }) => {
    const { date, onViolationsUpdated } = route.params;
    const [violations, setViolations] = useState([]);
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [hasLocationPermission, setHasLocationPermission] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const generateLocalId = () => `local_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    useEffect(() => {
        const initialize = async () => {
            try {
                const state = await NetInfo.fetch();
                setIsOnline(state.isConnected);

                const unsubscribe = NetInfo.addEventListener(state => {
                    const wasOffline = !isOnline;
                    setIsOnline(state.isConnected);
                    if (state.isConnected && wasOffline) {
                        syncUnsyncedViolations();
                    }
                });

                const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                setHasCameraPermission(cameraStatus === 'granted');

                const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
                setHasLocationPermission(locationStatus === 'granted');

                const token = await AsyncStorage.getItem('userToken');
                const storedUserId = await AsyncStorage.getItem('userId');
                
                setIsAuthenticated(!!token);
                setUserId(storedUserId);
                
                await fetchViolations();

                return () => unsubscribe();
            } catch (error) {
                console.error('Initialization error:', error);
            }
        };

        initialize();
    }, [date]);

    const fetchViolations = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/violations/public?date=${date}`);
            
            if (!response.ok) {
                throw new Error('Помилка сервера');
            }
            
            const data = await response.json();
            console.log('Received data:', data);
            setViolations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Помилка завантаження:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити правопорушення');
        } finally {
            setIsLoading(false);
        }
    };

    const loadLocalViolations = async () => {
        try {
            const violationsJson = await AsyncStorage.getItem(VIOLATIONS_KEY);
            const localViolations = violationsJson ? JSON.parse(violationsJson) : [];
            
            if (date) {
                const filtered = localViolations.filter(v => v.date.startsWith(date));
                setViolations(filtered);
            } else {
                setViolations(localViolations);
            }
        } catch (error) {
            console.error('Load local violations error:', error);
            setViolations([]);
        }
    };

    const syncUnsyncedViolations = async () => {
        if (!isAuthenticated || !isOnline || syncing) return;
        
        setSyncing(true);
        try {
            const unsyncedJson = await AsyncStorage.getItem(UNSYNCED_VIOLATIONS_KEY);
            let unsyncedViolations = unsyncedJson ? JSON.parse(unsyncedJson) : [];
            
            if (unsyncedViolations.length === 0) {
                setSyncing(false);
                return;
            }

            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/violations/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ violations: unsyncedViolations })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const { results } = await response.json();
            const successfulSyncs = results.filter(r => r.status === 'success');

            if (successfulSyncs.length > 0) {
                const violationsJson = await AsyncStorage.getItem(VIOLATIONS_KEY);
                let localViolations = violationsJson ? JSON.parse(violationsJson) : [];
                
                localViolations = localViolations.map(v => {
                    const syncResult = successfulSyncs.find(r => r.localId === v.localId);
                    if (syncResult) {
                        return {
                            ...v,
                            id: syncResult.serverId,
                            isPending: false,
                            synced: true
                        };
                    }
                    return v;
                });

                await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(localViolations));
                
                unsyncedViolations = unsyncedViolations.filter(v => 
                    !successfulSyncs.some(s => s.localId === v.localId)
                );
                await AsyncStorage.setItem(UNSYNCED_VIOLATIONS_KEY, JSON.stringify(unsyncedViolations));
                
                setViolations(localViolations.filter(v => date ? v.date.startsWith(date) : true));
                
                if (onViolationsUpdated) onViolationsUpdated();
                Alert.alert('Успіх', `Синхронізовано ${successfulSyncs.length} правопорушень`);
            }
        } catch (error) {
            console.error('Sync error:', error);
            Alert.alert('Помилка', 'Не вдалося синхронізувати правопорушення');
        } finally {
            setSyncing(false);
        }
    };

    const pickImage = async () => {
        if (!isAuthenticated) {
            Alert.alert('Увага', 'Для додавання правопорушень необхідно увійти', [
                { text: 'Скасувати', style: 'cancel' },
                { text: 'Увійти', onPress: () => navigation.navigate('Auth2') }
            ]);
            return;
        }

        if (!hasCameraPermission) {
            Alert.alert(
                'Дозвіл не надано',
                'Для роботи з камерою необхідно надати дозвіл',
                [
                    { text: 'Скасувати', style: 'cancel' },
                    { text: 'Налаштування', onPress: () => Linking.openSettings() }
                ]
            );
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: true
            });

            if (!result.canceled && result.assets?.[0]?.base64) {
                setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        } catch (error) {
            console.error('Помилка камери:', error);
            Alert.alert('Помилка', 'Не вдалося відкрити камеру');
        }
    };

    const getLocation = async () => {
        if (!isAuthenticated) {
            Alert.alert('Увага', 'Для додавання правопорушень необхідно увійти', [
                { text: 'Скасувати', style: 'cancel' },
                { text: 'Увійти', onPress: () => navigation.navigate('Auth2') }
            ]);
            return;
        }

        if (!hasLocationPermission) {
            Alert.alert(
                'Дозвіл не надано',
                'Для визначення місця необхідно надати дозвіл',
                [
                    { text: 'Скасувати', style: 'cancel' },
                    { text: 'Налаштування', onPress: () => Linking.openSettings() }
                ]
            );
            return;
        }

        try {
            setIsLoading(true);
            const locationData = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            setLocation({
                latitude: locationData.coords.latitude,
                longitude: locationData.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            });
        } catch (error) {
            console.error('Помилка геолокації:', error);
            Alert.alert('Помилка', 'Не вдалося визначити місцезнаходження');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddViolation = async () => {
        if (!isAuthenticated || !userId) {
            Alert.alert('Помилка', 'Необхідно увійти для додавання правопорушення');
            return;
        }

        if (!description || !image || !location) {
            Alert.alert('Помилка', 'Будь ласка, заповніть всі поля');
            return;
        }

        setIsLoading(true);
        try {
            const localId = generateLocalId();
            const violationData = {
                id: localId,
                description,
                image,
                date: date || new Date().toISOString(),
                userId,
                latitude: location.latitude,
                longitude: location.longitude,
                isPending: !isOnline,
                synced: isOnline,
                localId
            };

            const violationsJson = await AsyncStorage.getItem(VIOLATIONS_KEY);
            const localViolations = violationsJson ? JSON.parse(violationsJson) : [];
            localViolations.push(violationData);
            await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(localViolations));
            
            if (!isOnline) {
                const unsyncedJson = await AsyncStorage.getItem(UNSYNCED_VIOLATIONS_KEY);
                const unsyncedViolations = unsyncedJson ? JSON.parse(unsyncedJson) : [];
                unsyncedViolations.push(violationData);
                await AsyncStorage.setItem(UNSYNCED_VIOLATIONS_KEY, JSON.stringify(unsyncedViolations));
            }
            
            setViolations(prev => [...prev, violationData]);
            
            if (isOnline) {
                const token = await AsyncStorage.getItem('userToken');
                const response = await fetch(`${API_URL}/violations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(violationData)
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    const updatedViolations = localViolations.map(v => 
                        v.localId === localId ? { ...v, id: data.id, isPending: false, synced: true } : v
                    );
                    await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(updatedViolations));
                    
                    setViolations(updatedViolations.filter(v => date ? v.date.startsWith(date) : true));
                }
            }

            setDescription('');
            setImage(null);
            setLocation(null);
            
            if (onViolationsUpdated) onViolationsUpdated();
            Alert.alert('Успіх', 'Правопорушення успішно додано');
        } catch (error) {
            console.error('Add violation error:', error);
            Alert.alert('Помилка', error.message || 'Не вдалося додати правопорушення');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteViolation = async (id) => {
        if (!isAuthenticated) {
            Alert.alert('Помилка', 'Необхідно увійти для видалення правопорушень');
            return;
        }

        try {
            setIsLoading(true);
            
            setViolations(prev => prev.filter(v => v.id !== id));
            
            if (isOnline) {
                const token = await AsyncStorage.getItem('userToken');
                await fetch(`${API_URL}/violations/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }

            const violationsJson = await AsyncStorage.getItem(VIOLATIONS_KEY);
            let localViolations = violationsJson ? JSON.parse(violationsJson) : [];
            localViolations = localViolations.filter(v => v.id !== id);
            await AsyncStorage.setItem(VIOLATIONS_KEY, JSON.stringify(localViolations));
            
            const unsyncedJson = await AsyncStorage.getItem(UNSYNCED_VIOLATIONS_KEY);
            let unsyncedViolations = unsyncedJson ? JSON.parse(unsyncedJson) : [];
            unsyncedViolations = unsyncedViolations.filter(v => v.id !== id);
            await AsyncStorage.setItem(UNSYNCED_VIOLATIONS_KEY, JSON.stringify(unsyncedViolations));
            
            if (onViolationsUpdated) onViolationsUpdated();
            Alert.alert('Успіх', 'Правопорушення видалено');
        } catch (error) {
            console.error('Delete violation error:', error);
            Alert.alert('Помилка', 'Не вдалося видалити правопорушення');
            await fetchViolations();
        } finally {
            setIsLoading(false);
        }
    };

    const renderMap = (coordinates) => {
        if (!coordinates || !coordinates.latitude || !coordinates.longitude) return null;
        
        return (
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                        latitudeDelta: coordinates.latitudeDelta || 0.01,
                        longitudeDelta: coordinates.longitudeDelta || 0.01,
                    }}
                />
                <Text style={styles.coordinatesText}>
                    Координати: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </Text>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.networkStatus}>
                <Text style={isOnline ? styles.onlineText : styles.offlineText}>
                    {isOnline ? 'Онлайн' : 'Офлайн'}
                </Text>
                {syncing && <ActivityIndicator size="small" color="#4a90e2" />}
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Додати нове правопорушення</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder={isAuthenticated ? "Опишіть правопорушення..." : "Увійдіть для додавання"}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    editable={isAuthenticated}
                />
                
                <View style={styles.buttonRow}>
                    <Button
                        title="Зробити фото"
                        onPress={pickImage}
                        disabled={isLoading}
                        color="#4a90e2"
                    />
                    <Button
                        title="Отримати локацію"
                        onPress={getLocation}
                        disabled={isLoading}
                        color="#4a90e2"
                    />
                </View>
                
                {image && (
                    <Image
                        source={{ uri: image }}
                        style={styles.imagePreview}
                        resizeMode="contain"
                    />
                )}
                
                {renderMap(location)}
                
                {isLoading ? (
                    <ActivityIndicator size="large" color="#4a90e2" />
                ) : isAuthenticated ? (
                    <Button
                        title="Додати правопорушення"
                        onPress={handleAddViolation}
                        disabled={!description || !image || !location}
                        color="#4a90e2"
                    />
                ) : (
                    <Button
                        title="Увійти для додавання"
                        onPress={() => navigation.navigate('Auth2')}
                        color="#4a90e2"
                    />
                )}
            </View>
            
            <View style={styles.violationsContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>Зафіксовані правопорушення</Text>
                    <TouchableOpacity onPress={fetchViolations} disabled={isLoading || syncing}>
                        <MaterialIcons name="refresh" size={24} color="#4a90e2" />
                    </TouchableOpacity>
                </View>
                
                {isLoading ? (
                    <ActivityIndicator size="large" color="#4a90e2" />
                ) : violations.length === 0 ? (
                    <Text style={styles.noViolations}>Правопорушень не знайдено</Text>
                ) : (
                    violations.map((violation) => (
                        <View key={violation.id} style={styles.violationItem}>
                            <View style={styles.violationHeader}>
                                <Text style={styles.violationDate}>
                                    {new Date(violation.date).toLocaleDateString()} - {new Date(violation.date).toLocaleTimeString()}
                                    {violation.isPending && !violation.synced && (
                                        <Text style={styles.unsyncedBadge}> (Очікує синхронізації)</Text>
                                    )}
                                </Text>
                                {isAuthenticated && (
                                    <TouchableOpacity 
                                        onPress={() => handleDeleteViolation(violation.id)}
                                        disabled={isLoading || syncing}
                                    >
                                        <MaterialIcons name="delete" size={24} color="#ff4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.violationDescription}>{violation.description}</Text>
                            
                            {violation.image && (
                                <Image
                                    source={{ uri: violation.image }}
                                    style={styles.violationImage}
                                    resizeMode="contain"
                                />
                            )}
                            
                            {violation.latitude && violation.longitude && renderMap({
                                latitude: violation.latitude,
                                longitude: violation.longitude
                            })}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    networkStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        marginBottom: 8,
    },
    onlineText: {
        color: 'green',
        fontWeight: 'bold',
        marginRight: 8,
    },
    offlineText: {
        color: 'red',
        fontWeight: 'bold',
        marginRight: 8,
    },
    formContainer: {
        marginBottom: 24,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
    },
    violationsContainer: {
        marginBottom: 24,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: '#fafafa',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    imagePreview: {
        width: '100%',
        height: 250,
        marginBottom: 12,
        borderRadius: 6,
        backgroundColor: '#eee',
    },
    mapContainer: {
        height: 250,
        marginBottom: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
    coordinatesText: {
        textAlign: 'center',
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        color: '#666',
    },
    violationItem: {
        marginBottom: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 6,
    },
    violationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    violationDescription: {
        marginBottom: 12,
        fontSize: 16,
        color: '#444',
    },
    violationImage: {
        width: '100%',
        height: 200,
        marginBottom: 12,
        borderRadius: 6,
        backgroundColor: '#eee',
    },
    violationDate: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    unsyncedBadge: {
        color: 'orange',
        fontWeight: 'bold',
    },
    noViolations: {
        textAlign: 'center',
        color: '#888',
        paddingVertical: 20,
        fontSize: 16,
    },
});

export default ViolationsScreen;