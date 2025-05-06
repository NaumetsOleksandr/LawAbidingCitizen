import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert, TextInput, Linking, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.108:5000/api';

const ViolationsScreen = ({ route, navigation }) => {
    const { date, onViolationsUpdated, userId } = route.params;
    const [violations, setViolations] = useState([]);
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [hasLocationPermission, setHasLocationPermission] = useState(null);

    useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus === 'granted');

            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            setHasLocationPermission(locationStatus === 'granted');

            fetchViolations();
        })();
    }, []);

    const fetchViolations = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          const response = await fetch(`${API_URL}/violations?date=${date}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setViolations(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Помилка завантаження:', error);
          setViolations([]);
        }
      };

    const pickImage = async () => {
        if (!hasCameraPermission) {
            Alert.alert(
                'Дозвіл не надано',
                'Будь ласка, надайте дозвіл на камеру в налаштуваннях',
                [
                    { text: 'Скасувати' },
                    { text: 'Відкрити налаштування', onPress: () => Linking.openSettings() }
                ]
            );
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
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
        if (!hasLocationPermission) {
            Alert.alert(
                'Дозвіл не надано',
                'Будь ласка, надайте дозвіл на геолокацію в налаштуваннях',
                [
                    { text: 'Скасувати' },
                    { text: 'Відкрити налаштування', onPress: () => Linking.openSettings() }
                ]
            );
            return;
        }

        try {
            setIsLoading(true);
            const locationData = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: locationData.coords.latitude,
                longitude: locationData.coords.longitude
            });
        } catch (error) {
            console.error('Помилка геолокації:', error);
            Alert.alert('Помилка', 'Не вдалося отримати локацію');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddViolation = async () => {
        if (!description || !image || !location) {
            Alert.alert('Помилка', 'Заповніть всі поля');
            return;
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/violations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    description,
                    image,
                    date,
                    userId,
                    latitude: location.latitude,
                    longitude: location.longitude
                })
            });

            if (response.ok) {
                setDescription('');
                setImage(null);
                setLocation(null);
                await fetchViolations();
                onViolationsUpdated?.();
                Alert.alert('Успіх', 'Правопорушення додано');
            } else {
                throw new Error('Помилка сервера');
            }
        } catch (error) {
            console.error('Помилка додавання:', error);
            Alert.alert('Помилка', 'Не вдалося додати правопорушення');
        } finally {
            setIsLoading(false);
        }
    };

    const renderMap = (coordinates) => {
        if (!coordinates) return null;
        
        return (
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                />
                <Text style={styles.coordinatesText}>
                    Широта: {coordinates.latitude.toFixed(6)}, Довгота: {coordinates.longitude.toFixed(6)}
                </Text>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Додати правопорушення</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Опис"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
                
                <View style={styles.buttonRow}>
                    <Button
                        title="Зробити фото"
                        onPress={pickImage}
                        disabled={isLoading}
                    />
                    <Button
                        title="Отримати локацію"
                        onPress={getLocation}
                        disabled={isLoading}
                    />
                </View>
                
                {image && (
                    <Image
                        source={{ uri: image }}
                        style={styles.imagePreview}
                    />
                )}
                
                {renderMap(location)}
                
                <Button
                    title="Додати"
                    onPress={handleAddViolation}
                    disabled={!description || !image || !location || isLoading}
                />
            </View>
            
            <View style={styles.violationsContainer}>
                <Text style={styles.sectionTitle}>Список правопорушень</Text>
                
                {violations.length === 0 ? (
                    <Text style={styles.noViolations}>Немає правопорушень</Text>
                ) : (
                    violations.map((violation) => (
                        <View key={violation.id} style={styles.violationItem}>
                            <Text style={styles.violationDescription}>{violation.description}</Text>
                            <Image
                                source={{ uri: violation.image }}
                                style={styles.violationImage}
                            />
                            {renderMap({
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
    },
    formContainer: {
        marginBottom: 20,
    },
    violationsContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 10,
        marginBottom: 10,
        minHeight: 100,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        marginBottom: 10,
        borderRadius: 4,
    },
    mapContainer: {
        height: 250,
        marginBottom: 10,
        borderRadius: 4,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
    coordinatesText: {
        textAlign: 'center',
        paddingVertical: 5,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    violationItem: {
        marginBottom: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 4,
    },
    violationDescription: {
        marginBottom: 10,
    },
    violationImage: {
        width: '100%',
        height: 200,
        marginBottom: 10,
        borderRadius: 4,
    },
    noViolations: {
        textAlign: 'center',
        color: '#666',
    },
});

export default ViolationsScreen;