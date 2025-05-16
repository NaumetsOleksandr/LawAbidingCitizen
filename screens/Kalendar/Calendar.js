import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import dayjs from 'dayjs';
import Header from './Header';
import styles from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.108:5000/api';

const Calendar = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [calendarMatrix, setCalendarMatrix] = useState([]);
  const [datesWithViolations, setDatesWithViolations] = useState([]);

  const fetchMonthViolations = async (month, year) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      let response = await fetch(
        `${API_URL}/violations/public/dates?month=${month}&year=${year}`,
        { headers }
      );
      
      if (response.status === 404 && token) {
        response = await fetch(
          `${API_URL}/violations/dates?month=${month}&year=${year}`,
          { headers }
        );
      }
      
      if (!response.ok) {
        throw new Error('Не вдалося отримати дані');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.log('Помилка отримання даних:', error.message);
      return [];
    }
  };

  const loadMonthViolations = async (date) => {
    const month = date.month() + 1;
    const year = date.year();
    const dates = await fetchMonthViolations(month, year);
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
    const matrix = generateCalendarMatrix(currentDate);
    setCalendarMatrix(matrix);
    loadMonthViolations(currentDate);
  }, [currentDate]);

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
        onViolationsUpdated: () => loadMonthViolations(currentDate)
      });
    }
  };

  const hasViolationsForDate = (day) => {
    if (!day || !Array.isArray(datesWithViolations)) return false;
    const date = currentDate.startOf('month').add(day - 1, 'day').format('YYYY-MM-DD');
    return datesWithViolations.some(d => d.includes(date));
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
                <View style={styles.violationDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default Calendar;