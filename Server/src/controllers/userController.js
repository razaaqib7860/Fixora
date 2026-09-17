const User = require('../models/User');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update own user profile (phone, profilePicture)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { phoneNumber, profilePicture, branch, year } = req.body;

    const updates = {};
    if (phoneNumber) updates.phoneNumber = phoneNumber.trim();
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (branch !== undefined) updates.branch = branch;
    if (year !== undefined) updates.year = year;

    // Security: Do NOT allow role, email, block or roomNumber changes here without administrative verification
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get staff members list (for ticket assignment by Caretaker/Admin)
 * @route   GET /api/users/staff
 * @access  Private (CARETAKER, ADMIN, WARDEN)
 */
const getStaffList = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { role: 'STAFF', isActive: true };
    if (category) {
      filter.assignedCategory = category;
    }

    const staffMembers = await User.find(filter).select(
      '_id name email phoneNumber assignedCategory role'
    );

    res.status(200).json({
      success: true,
      count: staffMembers.length,
      staff: staffMembers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with filtering (Admin/Warden only)
 * @route   GET /api/admin/users
 * @access  Private (ADMIN, WARDEN)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, block, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (block) query.block = block;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create staff / warden / admin user
 * @route   POST /api/admin/users
 * @access  Private (ADMIN, WARDEN)
 */
const createUserByAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      assignedCategory,
      phoneNumber,
      block,
    } = req.body;

    if (!name || !email || !password || !role || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, role, and phone number are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      assignedCategory: assignedCategory ? assignedCategory.trim() : '',
      phoneNumber: phoneNumber.trim(),
      block: block ? block.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (ADMIN, WARDEN)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStaffList,
  getAllUsers,
  createUserByAdmin,
  toggleUserStatus,
};
