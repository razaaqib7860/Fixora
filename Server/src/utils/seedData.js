const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');

const seedUsers = [
  {
    name: 'Chief Admin',
    email: 'admin@hostel.edu',
    password: 'Password@123',
    role: 'ADMIN',
    phoneNumber: '+91 9876543201',
    block: 'Admin Office',
  },
  {
    name: 'Dr. S. K. Warden',
    email: 'warden@hostel.edu',
    password: 'Password@123',
    role: 'WARDEN',
    phoneNumber: '+91 9876543202',
    block: 'Warden Office',
  },
  {
    name: 'Ramesh Verma (Caretaker)',
    email: 'caretaker@hostel.edu',
    password: 'Password@123',
    role: 'CARETAKER',
    phoneNumber: '+91 9876543203',
    block: 'Block A / B',
  },
  {
    name: 'Aman Verma (Hostel Rep)',
    email: 'rep@hostel.edu',
    password: 'Password@123',
    role: 'HOSTEL_REPRESENTATIVE',
    phoneNumber: '+91 9876543204',
    block: 'Block A',
    roomNumber: 'A-302',
    branch: 'Computer Science',
    year: 3,
  },
  {
    name: 'Sunil Kumar (Electrician)',
    email: 'electrician@hostel.edu',
    password: 'Password@123',
    role: 'STAFF',
    assignedCategory: 'Electrical',
    phoneNumber: '+91 9876543210',
  },
  {
    name: 'Mahesh Sharma (Plumber)',
    email: 'plumber@hostel.edu',
    password: 'Password@123',
    role: 'STAFF',
    assignedCategory: 'Plumbing',
    phoneNumber: '+91 9876543211',
  },
  {
    name: 'Rajesh Yadav (Cleaning Supervisor)',
    email: 'cleaner@hostel.edu',
    password: 'Password@123',
    role: 'STAFF',
    assignedCategory: 'Cleaning',
    phoneNumber: '+91 9876543212',
  },
  {
    name: 'Rahul Sharma (Student)',
    email: 'rahul.sharma@college.edu',
    password: 'Password@123',
    role: 'STUDENT',
    phoneNumber: '+91 9876543301',
    block: 'Block A',
    roomNumber: 'A-204',
    branch: 'Computer Science',
    year: 3,
  },
  {
    name: 'Priya Patel (Student)',
    email: 'priya.patel@college.edu',
    password: 'Password@123',
    role: 'STUDENT',
    phoneNumber: '+91 9876543302',
    block: 'Block B',
    roomNumber: 'B-108',
    branch: 'Electronics',
    year: 2,
  },
];

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB.');

    // Clear existing users or update
    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`[Seed] Created user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`[Seed] User already exists: ${userData.email} (${userData.role})`);
      }
    }

    console.log('[Seed] Database seeding completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
