const mongoose = require('mongoose');

const hostelContactSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    availability: {
      type: String,
      trim: true,
      default: '9:00 AM - 6:00 PM',
    },
    isEmergency: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

hostelContactSchema.statics.seedDefaults = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const contacts = [
      {
        title: 'Chief Hostel Warden',
        role: 'WARDEN',
        name: 'Dr. S. K. Warden',
        phoneNumber: '+91 9876543202',
        email: 'warden@hostel.edu',
        location: 'Central Administrative Building, Room 102',
        availability: '10:00 AM - 5:00 PM (Mon-Fri)',
        isEmergency: false,
        sortOrder: 1,
      },
      {
        title: 'Hostel Caretaker (Operations & Rooms)',
        role: 'CARETAKER',
        name: 'Ramesh Verma',
        phoneNumber: '+91 9876543203',
        email: 'caretaker@hostel.edu',
        location: 'Block A Ground Floor Office',
        availability: '8:00 AM - 8:00 PM (Daily)',
        isEmergency: false,
        sortOrder: 2,
      },
      {
        title: 'Hostel Student Representative',
        role: 'HOSTEL_REPRESENTATIVE',
        name: 'Aman Verma',
        phoneNumber: '+91 9876543204',
        email: 'rep@hostel.edu',
        location: 'Room A-302',
        availability: 'Evenings 6:00 PM - 10:00 PM',
        isEmergency: false,
        sortOrder: 3,
      },
      {
        title: 'Campus Emergency Ambulance & Medical Center',
        role: 'MEDICAL_EMERGENCY',
        name: 'Campus Health Center',
        phoneNumber: '+91 9876543999',
        email: 'medical@college.edu',
        location: 'Adjacent to Sports Complex',
        availability: '24/7 Round the Clock',
        isEmergency: true,
        sortOrder: 4,
      },
      {
        title: 'Hostel Security Desk & Main Gate',
        role: 'SECURITY_DESK',
        name: 'Senior Security Supervisor',
        phoneNumber: '+91 9876543220',
        email: 'security@hostel.edu',
        location: 'Hostel Main Gate 1',
        availability: '24/7 Round the Clock',
        isEmergency: true,
        sortOrder: 5,
      },
      {
        title: 'Campus Electrical Maintenance Desk',
        role: 'ELECTRICIAN_DESK',
        name: 'Sunil Kumar (Duty Electrician)',
        phoneNumber: '+91 9876543210',
        email: 'electrician@hostel.edu',
        location: 'Substation Control Room',
        availability: '8:00 AM - 10:00 PM',
        isEmergency: false,
        sortOrder: 6,
      },
      {
        title: 'Plumbing & Water Supply Desk',
        role: 'PLUMBER_DESK',
        name: 'Mahesh Sharma (Duty Plumber)',
        phoneNumber: '+91 9876543211',
        email: 'plumber@hostel.edu',
        location: 'Pump House Maintenance Yard',
        availability: '8:00 AM - 6:00 PM',
        isEmergency: false,
        sortOrder: 7,
      },
    ];
    await this.insertMany(contacts);
    console.log('[HostelContact] Default contacts directory seeded.');
  }
};

module.exports = mongoose.model('HostelContact', hostelContactSchema);
