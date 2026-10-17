const Patient = require('../models/Patient');
const Employee = require('../models/Employee');
const User = require('../models/User');

/**
 * Recipient Resolution Service (26_NOTIFICATION_SERVICE.md Section 53-56)
 * Resolves contact details (phone, email, userId) from Patient, Employee, User, Role, or Department
 */
class RecipientService {
  /**
   * Resolve single or normalized recipient target
   * @param {Object} recipientInput e.g. { userId, patientId, employeeId, phone, email, role, department }
   */
  static async resolveRecipient(recipientInput = {}) {
    const resolved = {
      userId: recipientInput.userId || null,
      patientId: recipientInput.patientId || null,
      employeeId: recipientInput.employeeId || null,
      phone: recipientInput.phone || null,
      email: recipientInput.email || null,
      name: recipientInput.name || null
    };

    // If patientId is provided, look up patient record
    if (resolved.patientId && (!resolved.phone || !resolved.email || !resolved.name)) {
      try {
        const patient = await Patient.findOne({ patientId: resolved.patientId }).lean();
        if (patient) {
          resolved.phone = resolved.phone || patient.phoneNumber || patient.phone;
          resolved.email = resolved.email || patient.email;
          resolved.name = resolved.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        }
      } catch (e) {
        console.warn(`[RecipientService] Failed to look up patient: ${resolved.patientId}`, e.message);
      }
    }

    // If employeeId is provided, look up employee record
    if (resolved.employeeId && (!resolved.phone || !resolved.email || !resolved.name)) {
      try {
        const emp = await Employee.findOne({ employeeId: resolved.employeeId }).lean();
        if (emp) {
          resolved.phone = resolved.phone || emp.phone || emp.mobileNumber;
          resolved.email = resolved.email || emp.email;
          resolved.name = resolved.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
          resolved.userId = resolved.userId || emp.userId;
        }
      } catch (e) {
        console.warn(`[RecipientService] Failed to look up employee: ${resolved.employeeId}`, e.message);
      }
    }

    // If userId is provided, look up user record
    if (resolved.userId && (!resolved.phone || !resolved.email || !resolved.name)) {
      try {
        const user = await User.findById(resolved.userId).lean();
        if (user) {
          resolved.email = resolved.email || user.email;
          resolved.phone = resolved.phone || user.phone;
          resolved.name = resolved.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      } catch (e) {
        console.warn(`[RecipientService] Failed to look up user: ${resolved.userId}`, e.message);
      }
    }

    // Role-based recipient resolution (e.g. system alert to System Admin or Grievance Officer)
    if (recipientInput.role && (!resolved.email && !resolved.phone && !resolved.userId)) {
      try {
        const roleUsers = await User.find({ role: recipientInput.role, isActive: true }).limit(5).lean();
        if (roleUsers.length > 0) {
          resolved.userId = roleUsers[0]._id;
          resolved.email = roleUsers[0].email;
          resolved.name = `${roleUsers[0].firstName || ''} ${roleUsers[0].lastName || ''}`.trim();
        }
      } catch (e) {
        console.warn(`[RecipientService] Failed to resolve role: ${recipientInput.role}`, e.message);
      }
    }

    return resolved;
  }
}

module.exports = RecipientService;
