const { AsyncStorage } = require('react-native');

module.exports = {
  async getUserByEmail(email) {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email);
  },

  async getAllUsers() {
    const usersJson = await AsyncStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
  },

  async saveUser(user) {
    const users = await this.getAllUsers();
    users.push(user);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    return user;
  }
};