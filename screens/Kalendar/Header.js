import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';

const Header = ({ currentDate, onPreviousMonth, onNextMonth }) => {
    return (
        <View style={styles.headerRow}>
            <TouchableOpacity onPress={onPreviousMonth}>
                <Text style={styles.navButton}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>
                {currentDate.format('MMMM YYYY')}
            </Text>
            <TouchableOpacity onPress={onNextMonth}>
                <Text style={styles.navButton}>{">"}</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Header;
