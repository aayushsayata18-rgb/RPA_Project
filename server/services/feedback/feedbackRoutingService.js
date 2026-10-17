const Department = require('../../models/Department');
const User = require('../../models/User');
const ConfigService = require('../ConfigService');

class FeedbackRoutingService {
  /**
   * Deterministic category-to-department routing
   * (Section 61-62 of 25_PATIENT_FEEDBACK.md)
   */
  static async resolveRouting(category, type) {
    const normCat = (category || '').toUpperCase().trim();
    const normType = (type || '').toUpperCase().trim();

    let targetDepartmentCode = 'ADMIN';

    if (normCat.includes('HOUSEKEEPING') || normType === 'HOUSEKEEPING_FEEDBACK') {
      targetDepartmentCode = 'HOUSEKEEPING';
    } else if (normCat.includes('MAINTENANCE') || normType === 'MAINTENANCE_FEEDBACK' || normType === 'FACILITY_FEEDBACK' || normCat.includes('FACILIT')) {
      targetDepartmentCode = 'MAINTENANCE';
    } else if (normCat.includes('BILLING') || normType === 'BILLING_FEEDBACK' || normCat.includes('INVOICE') || normCat.includes('PAYMENT')) {
      targetDepartmentCode = 'FINANCE';
    } else if (normCat.includes('PHARMACY') || normType === 'PHARMACY_FEEDBACK' || normCat.includes('MEDICINE')) {
      targetDepartmentCode = 'PHARMACY';
    } else if (normCat.includes('LAB') || normType === 'LAB_FEEDBACK' || normCat.includes('DIAGNOSTIC')) {
      targetDepartmentCode = 'LABORATORY';
    } else if (normCat.includes('RADIOLOGY') || normType === 'RADIOLOGY_FEEDBACK' || normCat.includes('IMAGING') || normCat.includes('SCAN')) {
      targetDepartmentCode = 'RADIOLOGY';
    } else if (normCat.includes('NURS') || normCat.includes('WARD')) {
      targetDepartmentCode = 'NURSING';
    } else if (normCat.includes('RECEPTION') || normCat.includes('FRONT') || normCat.includes('OPD') || normCat.includes('QUEUE') || normCat.includes('APPOINTMENT')) {
      targetDepartmentCode = 'RECEPTION';
    } else if (normCat.includes('STAFF') || normType === 'STAFF_FEEDBACK' || normCat.includes('CONDUCT')) {
      targetDepartmentCode = 'HR';
    }

    // Attempt to lookup department by code or uppercase name
    let department = await Department.findOne({
      $or: [
        { code: targetDepartmentCode },
        { departmentId: targetDepartmentCode },
        { name: new RegExp(targetDepartmentCode, 'i') }
      ],
      isActive: true
    }).lean();

    // If department not found, check fallback
    if (!department) {
      department = await Department.findOne({ isActive: true }).lean();
    }

    // Find default responsible manager/user for the department
    let assignedUser = null;
    if (department) {
      if (department.headOfDepartment) {
        assignedUser = await User.findOne({
          $or: [{ userId: department.headOfDepartment }, { email: department.headOfDepartment }],
          isActive: true
        }).lean();
      }

      if (!assignedUser) {
        // Find staff with role matching department
        const roleMap = {
          HOUSEKEEPING: 'HOUSEKEEPING',
          MAINTENANCE: 'MAINTENANCE',
          PHARMACY: 'PHARMACIST',
          LABORATORY: 'LAB_TECHNICIAN',
          RADIOLOGY: 'RADIOLOGY_TECHNICIAN',
          FINANCE: 'BILLING_STAFF',
          RECEPTION: 'RECEPTIONIST'
        };
        const candidateRole = roleMap[targetDepartmentCode];
        if (candidateRole) {
          assignedUser = await User.findOne({ role: candidateRole, isActive: true }).lean();
        }
      }
    }

    // Fallback to ADMIN_MANAGER or SYSTEM_ADMIN
    if (!assignedUser) {
      assignedUser = await User.findOne({
        role: { $in: ['ADMIN_MANAGER', 'SYSTEM_ADMIN'] },
        isActive: true
      }).lean();
    }

    return {
      departmentId: department ? department.departmentId || department._id : null,
      departmentName: department ? department.name : targetDepartmentCode,
      assignedTo: assignedUser ? assignedUser.userId : null,
      assignedToName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : null
    };
  }

  /**
   * Determine confidentiality level based on category and sensitive keywords
   * (Section 16-17 of 25_PATIENT_FEEDBACK.md)
   */
  static assessConfidentiality(category, subject, description) {
    const text = `${category} ${subject} ${description}`.toLowerCase();
    const sensitiveWords = [
      'negligence',
      'harassment',
      'abuse',
      'malpractice',
      'legal',
      'lawsuit',
      'privacy',
      'confidential',
      'bribe',
      'misconduct',
      'fraud'
    ];

    const isSensitive = sensitiveWords.some((word) => text.includes(word));
    if (isSensitive) {
      return {
        level: 'RESTRICTED',
        restricted: true
      };
    }

    return {
      level: 'NORMAL',
      restricted: false
    };
  }
}

module.exports = FeedbackRoutingService;
