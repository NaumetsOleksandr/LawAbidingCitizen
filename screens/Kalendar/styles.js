import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    todayButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginBottom: 16,
        alignSelf: 'center',
    },
    todayButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 4,
    },
    dayContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
        borderRadius: 4,
        position: 'relative',
    },
    violationDot: {
        position: 'absolute',
        bottom: 5,
        alignSelf: 'center',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
      },
    dayText: {
        fontSize: 16,
    },
    weekDayText: {
        fontWeight: 'bold',
        color: '#333',
    },
    currentMonthDay: {
        backgroundColor: '#f0f0f0',
    },
    otherMonthDay: {
        backgroundColor: '#e0e0e0',
    },
    currentMonthText: {
        color: '#333',
    },
    otherMonthText: {
        color: '#999',
    },
    taskIndicator: {
        position: 'absolute',
        bottom: 2,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4CAF50',
    },
    navButton: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    monthText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
    },
    taskList: {
        flex: 1,
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginBottom: 8,
        elevation: 2,
    },
    taskText: {
        backgroundColor: 'Gray',
        fontSize: 16,
        flex: 1,
    },
    taskButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        backgroundColor: '#2196F3',
        padding: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#F44336',
        padding: 8,
        borderRadius: 4,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
    },
    noTasksText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
    logoutButton: {
        backgroundColor: '#F44336',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 20,
        alignSelf: 'center',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#000',
    },
    darkInput: {
        backgroundColor: '#7a7a7a',
        color: '#fff',
    },
});

export default styles;