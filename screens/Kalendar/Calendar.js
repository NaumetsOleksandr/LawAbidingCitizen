import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import styles from './styles';

const API_URL = 'http://192.168.1.108:5000/api';

const Calendar = ({ navigation }) => {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [calendarMatrix, setCalendarMatrix] = useState([]);
    const [datesWithViolations, setDatesWithViolations] = useState([]);
    const [userId, setUserId] = useState(null);

    const fetchMonthViolations = async (startDate, endDate, userId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(
                `${API_URL}/violations/month?startDate=${startDate}&endDate=${endDate}&userId=${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            return data.map(violation => violation.date);
        } catch (error) {
            console.error('Error fetching violations:', error);
            return [];
        }
    };

    const loadMonthViolations = async (date) => {
        const startOfMonth = date.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = date.endOf('month').format('YYYY-MM-DD');
        const dates = await fetchMonthViolations(startOfMonth, endOfMonth, userId);
        setDatesWithViolations(dates);
    };

    const generateCalendarMatrix = (date) => {
        const startOfMonth = date.startOf('month');
        const startDayOfWeek = startOfMonth.day();
        const daysInMonth = date.daysInMonth();
        const prevMonth = date.subtract(1, 'month');
        const daysInPrevMonth = prevMonth.daysInMonth();

        let matrix = [];
        let dayCounter = 1;
        let nextMonthDayCounter = 1;

        for (let row = 0; row < 6; row++) {
            let weekRow = [];
            for (let col = 0; col < 7; col++) {
                const cellIndex = row * 7 + col;

                if (cellIndex < startDayOfWeek) {
                    weekRow.push({
                        day: daysInPrevMonth - (startDayOfWeek - cellIndex - 1),
                        inCurrentMonth: false,
                    });
                } else if (dayCounter <= daysInMonth) {
                    weekRow.push({
                        day: dayCounter,
                        inCurrentMonth: true,
                    });
                    dayCounter++;
                } else {
                    weekRow.push({
                        day: nextMonthDayCounter,
                        inCurrentMonth: false,
                    });
                    nextMonthDayCounter++;
                }
            }
            matrix.push(weekRow);
        }
        return matrix;
    };

    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem('userId');
            setUserId(id);
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        if (userId) {
            setCalendarMatrix(generateCalendarMatrix(currentDate));
            loadMonthViolations(currentDate);
        }
    }, [currentDate, userId]);

    const handlePreviousMonth = () => {
        setCurrentDate(currentDate.subtract(1, 'month'));
    };

    const handleNextMonth = () => {
        setCurrentDate(currentDate.add(1, 'month'));
    };

    const handleToday = () => {
        setCurrentDate(dayjs());
    };

    const handleDayPress = (day, inCurrentMonth) => {
        if (inCurrentMonth) {
            const selectedDate = currentDate.startOf('month').add(day - 1, 'day').format('YYYY-MM-DD');
            navigation.navigate('Violations', {
                date: selectedDate,
                onViolationsUpdated: () => loadMonthViolations(currentDate),
                userId: userId
            });
        }
    };

    const hasViolationsForDate = (day) => {
        if (!day) return false;
        const date = currentDate.startOf('month').add(day - 1, 'day').format('YYYY-MM-DD');
        return datesWithViolations.includes(date);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerContainer}>
                <Header
                    currentDate={currentDate}
                    onPreviousMonth={handlePreviousMonth}
                    onNextMonth={handleNextMonth}
                />
            </View>
            <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
                <Text style={styles.todayButtonText}>Сьогодні</Text>
            </TouchableOpacity>
            <View style={styles.weekRow}>
                {['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, index) => (
                    <Text key={index} style={[styles.dayText, styles.weekDayText]}>
                        {day}
                    </Text>
                ))}
            </View>
            {calendarMatrix.map((week, rowIndex) => (
                <View key={rowIndex} style={styles.weekRow}>
                    {week.map((dayObj, colIndex) => (
                        <TouchableOpacity
                            key={colIndex}
                            style={[
                                styles.dayContainer,
                                dayObj.inCurrentMonth ? styles.currentMonthDay : styles.otherMonthDay
                            ]}
                            onPress={() => handleDayPress(dayObj.day, dayObj.inCurrentMonth)}
                        >
                            <Text style={[
                                styles.dayText,
                                dayObj.inCurrentMonth ? styles.currentMonthText : styles.otherMonthText
                            ]}>
                                {dayObj.day}
                            </Text>
                            {dayObj.inCurrentMonth && hasViolationsForDate(dayObj.day) && (
                                <View style={styles.violationIndicator} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
        </ScrollView>
    );
};

export default Calendar;