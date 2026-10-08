const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditService = require('../services/AuditService');
const { ROLE_PERMISSIONS } = require('../config/permissions');
const { ROLES } = require('../config/roles');
const { v4: uuidv4 } = require('uuid');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'hospital_rpa_jwt_super_secret_key_2026_antigravity',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new system user
// @route   POST /api/auth/register
// @access  Public (for patients) or Admin
exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role = ROLES.PATIENT, linkedEntityId } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
        errorCode: 'EMAIL_ALREADY_REGISTERED'
      });
    }

    const userId = `USR-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;

    const user = await User.create({
      userId,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      linkedEntityId: linkedEntityId || null
    });

    const token = generateToken(user.userId, user.role);

    await AuditService.logEvent({
      userId: user.userId,
      userEmail: user.email,
      role: user.role,
      action: 'USER_REGISTERED',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.userId,
      ipAddress: req.ip,
      details: `New user registration for ${user.email} (${user.role})`
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          linkedEntityId: user.linkedEntityId,
          permissions: ROLE_PERMISSIONS[user.role] || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
        errorCode: 'MISSING_CREDENTIALS'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      await AuditService.logEvent({
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        entityType: 'User',
        entityId: email,
        ipAddress: req.ip,
        status: 'FAILURE',
        details: `Failed login attempt for email: ${email}`
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact hospital administrator.',
        errorCode: 'ACCOUNT_DEACTIVATED'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user.userId, user.role);

    await AuditService.logEvent({
      userId: user.userId,
      userEmail: user.email,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      entityType: 'User',
      entityId: user.userId,
      ipAddress: req.ip,
      details: `Successful login for ${user.email}`
    });

    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    const customPerms = user.customPermissions || [];
    const allPerms = Array.from(new Set([...rolePerms, ...customPerms]));

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          linkedEntityId: user.linkedEntityId,
          permissions: allPerms
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    const customPerms = user.customPermissions || [];
    const allPerms = Array.from(new Set([...rolePerms, ...customPerms]));

    res.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        linkedEntityId: user.linkedEntityId,
        permissions: allPerms,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
};
