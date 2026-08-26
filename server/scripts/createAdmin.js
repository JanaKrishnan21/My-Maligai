import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      username: 'admin',
    });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Ramesh Kumar (Owner)',
      username: 'admin',
      email: 'owner@mymaligai.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin',
      active: true,
    });

    console.log('Admin user created successfully.');
    console.log('Username:', admin.username);
    console.log('Role:', admin.role);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();