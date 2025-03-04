'use strict';

const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
  async up(queryInterface, Sequelize) {
    // Generate a hashed password using bcrypt
    const hashedPassword = await bcrypt.hash('Password@123', saltRounds);

    // Insert admin user into the users table
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@mail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove the admin user (optional, or you can adjust as needed)
    await queryInterface.bulkDelete('users', {
      email: 'admin@example.com',
    });
  },
};
