const mongoose = require('mongoose');

/**
 * Module 28: ReportQueryService
 * Authoritative Cross-Module Aggregation & Masking Engine
 * (28_REPORTS_ANALYTICS.md Section 14-63, 122-126)
 */
class ReportQueryService {
  static getModel(modelName) {
    if (mongoose.models[modelName]) return mongoose.models[modelName];
    const modelMap = {
      Patient: 'Patient',
      Appointment: 'Appointment',
      OpdQueueToken: 'OPDToken',
      OPDToken: 'OPDToken',
      Bed: 'Bed',
      Admission: 'Admission',
      Discharge: 'Discharge',
      Invoice: 'Invoice',
      Payment: 'PaymentTransaction',
      PaymentTransaction: 'PaymentTransaction',
      InsuranceVerification: 'InsuranceVerification',
      InsuranceClaim: 'InsuranceClaim',
      PharmacyOrder: 'PharmacyOrder',
      StockItem: 'InventoryItem',
      InventoryItem: 'InventoryItem',
      PurchaseOrder: 'PurchaseOrder',
      Attendance: 'Attendance',
      ShiftRoster: 'Roster',
      Roster: 'Roster',
      LeaveRequest: 'LeaveRequest',
      LabOrder: 'LabOrder',
      RadiologyOrder: 'RadiologyOrder',
      MaintenanceWorkOrder: 'MaintenanceWorkOrder',
      HousekeepingTask: 'HousekeepingTask',
      Feedback: 'Feedback',
      Notification: 'Notification',
      GeneratedDocument: 'GeneratedDocument',
      RPAJob: 'RPAJob',
      ExceptionCase: 'ExceptionCase',
      Employee: 'Employee'
    };
    const target = modelMap[modelName] || modelName;
    try {
      return require(`../models/${target}`);
    } catch (e) {
      return mongoose.model(modelName);
    }
  }

  /**
   * Helper to parse date filters
   */
  static parseDateRange(filters = {}) {
    let { dateFrom, dateTo, period = 'TODAY' } = filters;
    const now = new Date();

    if (dateFrom && dateTo) {
      return {
        start: new Date(dateFrom),
        end: new Date(dateTo)
      };
    }

    let start = new Date();
    let end = new Date();

    switch (period.toUpperCase()) {
      case 'TODAY':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'YESTERDAY':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'THIS_WEEK':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case 'THIS_MONTH':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'LAST_MONTH':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'THIS_YEAR':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
        end = new Date();
    }

    return { start, end };
  }

  /**
   * Mask sensitive PII for unauthorized roles (Section 125-126)
   */
  static maskRecord(record, userRole) {
    const isPrivileged = ['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT'].includes(userRole);
    if (isPrivileged) return record;

    const masked = { ...record };
    if (masked.phone && typeof masked.phone === 'string' && masked.phone.length > 4) {
      masked.phone = '******' + masked.phone.slice(-4);
    }
    if (masked.email && typeof masked.email === 'string') {
      const parts = masked.email.split('@');
      if (parts.length === 2) {
        masked.email = parts[0].slice(0, 2) + '****@' + parts[1];
      }
    }
    return masked;
  }

  /**
   * Execute report query based on report code
   */
  static async executeQuery(reportCode, filters = {}, userRole = 'SYSTEM_ADMIN') {
    const { start, end } = this.parseDateRange(filters);
    const dateQuery = { createdAt: { $gte: start, $lte: end } };

    switch (reportCode.toUpperCase()) {
      case 'PATIENT_REGISTRATION_SUMMARY':
        return await this.queryPatientRegistration(dateQuery, filters, userRole);

      case 'APPOINTMENT_SUMMARY':
        return await this.queryAppointmentSummary(dateQuery, filters, userRole);

      case 'OPD_QUEUE_SUMMARY':
        return await this.queryOpdSummary(dateQuery, filters, userRole);

      case 'BED_OCCUPANCY':
        return await this.queryBedOccupancy(filters, userRole);

      case 'ADMISSION_SUMMARY':
        return await this.queryAdmissionSummary(dateQuery, filters, userRole);

      case 'DISCHARGE_SUMMARY':
        return await this.queryDischargeSummary(dateQuery, filters, userRole);

      case 'BILLING_SUMMARY':
        return await this.queryBillingSummary(dateQuery, filters, userRole);

      case 'PAYMENT_SUMMARY':
        return await this.queryPaymentSummary(dateQuery, filters, userRole);

      case 'INSURANCE_VERIFICATION_SUMMARY':
        return await this.queryInsuranceSummary(dateQuery, filters, userRole);

      case 'PHARMACY_DISPENSING_SUMMARY':
        return await this.queryPharmacySummary(dateQuery, filters, userRole);

      case 'INVENTORY_STOCK_SUMMARY':
        return await this.queryInventorySummary(filters, userRole);

      case 'PROCUREMENT_SUMMARY':
        return await this.queryProcurementSummary(dateQuery, filters, userRole);

      case 'ATTENDANCE_SUMMARY':
        return await this.queryAttendanceSummary(dateQuery, filters, userRole);

      case 'SHIFT_COVERAGE':
        return await this.queryShiftCoverage(dateQuery, filters, userRole);

      case 'LEAVE_SUMMARY':
        return await this.queryLeaveSummary(dateQuery, filters, userRole);

      case 'LAB_ORDER_SUMMARY':
        return await this.queryLabSummary(dateQuery, filters, userRole);

      case 'RADIOLOGY_ORDER_SUMMARY':
        return await this.queryRadiologySummary(dateQuery, filters, userRole);

      case 'MAINTENANCE_SUMMARY':
        return await this.queryMaintenanceSummary(dateQuery, filters, userRole);

      case 'HOUSEKEEPING_SUMMARY':
        return await this.queryHousekeepingSummary(dateQuery, filters, userRole);

      case 'PATIENT_FEEDBACK_SUMMARY':
        return await this.queryFeedbackSummary(dateQuery, filters, userRole);

      case 'NOTIFICATION_DELIVERY':
        return await this.queryNotificationSummary(dateQuery, filters, userRole);

      case 'DOCUMENT_GENERATION':
        return await this.queryDocumentSummary(dateQuery, filters, userRole);

      case 'RPA_EXECUTION':
        return await this.queryRpaSummary(dateQuery, filters, userRole);

      case 'EXCEPTION_SUMMARY':
        return await this.queryExceptionSummary(dateQuery, filters, userRole);

      default:
        return {
          rows: [],
          summary: {},
          rowCount: 0,
          period: { periodStart: start, periodEnd: end }
        };
    }
  }

  // --- SPECIFIC REPORT IMPLEMENTATIONS ---

  static async queryPatientRegistration(dateQuery, filters, userRole) {
    const Patient = this.getModel('Patient');
    const patients = await Patient.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const total = patients.length;
    const online = patients.filter((p) => p.registrationSource === 'ONLINE' || p.source === 'ONLINE').length;
    const frontDesk = total - online;

    const rows = patients.map((p) =>
      this.maskRecord(
        {
          patientId: p.patientId,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.fullName || 'Unknown',
          phone: p.phone,
          email: p.email,
          gender: p.gender,
          age: p.age,
          registrationType: p.registrationSource || 'FRONT_DESK',
          status: p.status || 'ACTIVE',
          registeredAt: p.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalRegistrations: total, onlineRegistrations: online, frontDeskRegistrations: frontDesk },
      rowCount: rows.length
    };
  }

  static async queryAppointmentSummary(dateQuery, filters, userRole) {
    const Appointment = this.getModel('Appointment');
    const appointments = await Appointment.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    const noShow = appointments.filter((a) => a.status === 'NO_SHOW').length;
    const confirmed = appointments.filter((a) => ['CONFIRMED', 'SCHEDULED', 'BOOKED'].includes(a.status)).length;

    const rows = appointments.map((a) =>
      this.maskRecord(
        {
          appointmentId: a.appointmentId,
          patientId: a.patientId,
          patientName: a.patientName,
          doctorName: a.doctorName,
          department: a.department,
          appointmentDate: a.appointmentDate,
          timeSlot: a.timeSlot,
          status: a.status,
          createdAt: a.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalAppointments: appointments.length, completed, confirmed, cancelled, noShow },
      rowCount: rows.length
    };
  }

  static async queryOpdSummary(dateQuery, filters, userRole) {
    const OpdQueueToken = this.getModel('OpdQueueToken');
    const tokens = await OpdQueueToken.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const completed = tokens.filter((t) => t.status === 'COMPLETED').length;
    const inConsultation = tokens.filter((t) => t.status === 'IN_CONSULTATION').length;
    const waiting = tokens.filter((t) => ['WAITING', 'CALLED'].includes(t.status)).length;

    const rows = tokens.map((t) =>
      this.maskRecord(
        {
          tokenId: t.tokenId,
          tokenNumber: t.tokenNumber,
          patientId: t.patientId,
          doctorName: t.doctorName,
          department: t.department,
          priority: t.priority,
          status: t.status,
          waitTimeMinutes: t.waitTimeMinutes || 0,
          createdAt: t.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalTokens: tokens.length, completed, inConsultation, waiting },
      rowCount: rows.length
    };
  }

  static async queryBedOccupancy(filters, userRole) {
    const Bed = this.getModel('Bed');
    const beds = await Bed.find().lean();

    const total = beds.length;
    const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
    const available = beds.filter((b) => b.status === 'AVAILABLE').length;
    const cleaning = beds.filter((b) => ['CLEANING_IN_PROGRESS', 'DISINFECTING', 'DIRTY'].includes(b.status)).length;
    const maintenance = beds.filter((b) => ['MAINTENANCE_REQUIRED', 'UNDER_MAINTENANCE'].includes(b.status)).length;
    const occupancyRate = total > 0 ? Number(((occupied / total) * 100).toFixed(1)) : 0;

    const rows = beds.map((b) => ({
      bedId: b.bedId,
      bedNumber: b.bedNumber,
      ward: b.wardName || b.wardId,
      roomNumber: b.roomNumber,
      category: b.category,
      status: b.status,
      currentPatientId: b.currentPatientId || 'None',
      occupancyState: b.isOccupied ? 'OCCUPIED' : 'VACANT'
    }));

    return {
      rows,
      summary: { totalBeds: total, occupiedBeds: occupied, availableBeds: available, cleaningBeds: cleaning, maintenanceBeds: maintenance, occupancyRatePercent: occupancyRate },
      rowCount: rows.length
    };
  }

  static async queryAdmissionSummary(dateQuery, filters, userRole) {
    const Admission = this.getModel('Admission');
    const admissions = await Admission.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const admitted = admissions.filter((a) => a.status === 'ADMITTED').length;
    const discharged = admissions.filter((a) => a.status === 'DISCHARGED').length;

    const rows = admissions.map((a) =>
      this.maskRecord(
        {
          admissionId: a.admissionId,
          patientId: a.patientId,
          patientName: a.patientName,
          ward: a.ward,
          bedNumber: a.bedNumber,
          admittedAt: a.admittedAt || a.createdAt,
          dischargeAt: a.dischargedAt,
          status: a.status
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalAdmissions: admissions.length, activeInpatients: admitted, dischargedCount: discharged },
      rowCount: rows.length
    };
  }

  static async queryDischargeSummary(dateQuery, filters, userRole) {
    const Discharge = this.getModel('Discharge');
    const discharges = await Discharge.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const cleared = discharges.filter((d) => d.status === 'CLEARED' || d.status === 'COMPLETED').length;

    const rows = discharges.map((d) =>
      this.maskRecord(
        {
          dischargeId: d.dischargeId,
          patientId: d.patientId,
          patientName: d.patientName,
          dischargeType: d.dischargeType || 'NORMAL',
          clinicalClearance: d.clinicalClearance?.cleared ? 'CLEARED' : 'PENDING',
          financialClearance: d.financialClearance?.settled ? 'SETTLED' : 'PENDING',
          status: d.status,
          dischargedAt: d.dischargedAt || d.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalDischarges: discharges.length, clearedDischarges: cleared },
      rowCount: rows.length
    };
  }

  static async queryBillingSummary(dateQuery, filters, userRole) {
    const Invoice = this.getModel('Invoice');
    const invoices = await Invoice.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const paidAmount = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const balanceAmount = totalAmount - paidAmount;

    const rows = invoices.map((i) =>
      this.maskRecord(
        {
          invoiceNumber: i.invoiceNumber,
          patientId: i.patientId,
          patientName: i.patientName,
          totalAmount: i.totalAmount,
          paidAmount: i.paidAmount,
          balanceAmount: i.balanceAmount || (i.totalAmount - i.paidAmount),
          paymentStatus: i.paymentStatus || i.status,
          createdAt: i.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalInvoices: invoices.length, totalBilledINR: totalAmount, totalCollectedINR: paidAmount, totalOutstandingINR: balanceAmount },
      rowCount: rows.length
    };
  }

  static async queryPaymentSummary(dateQuery, filters, userRole) {
    const Payment = this.getModel('Payment');
    const payments = await Payment.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const rows = payments.map((p) =>
      this.maskRecord(
        {
          receiptNumber: p.receiptNumber || p.paymentId,
          invoiceNumber: p.invoiceNumber,
          patientId: p.patientId,
          amount: p.amount,
          paymentMethod: p.paymentMethod || p.method,
          transactionId: p.transactionId,
          status: p.status,
          paidAt: p.paidAt || p.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalTransactions: payments.length, totalCollectedINR: totalCollected },
      rowCount: rows.length
    };
  }

  static async queryInsuranceSummary(dateQuery, filters, userRole) {
    const InsuranceVerification = this.getModel('InsuranceVerification');
    const verifications = await InsuranceVerification.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const verified = verifications.filter((v) => v.status === 'VERIFIED').length;
    const rejected = verifications.filter((v) => v.status === 'REJECTED').length;

    const rows = verifications.map((v) =>
      this.maskRecord(
        {
          verificationId: v.verificationId,
          patientId: v.patientId,
          providerName: v.providerName || v.insuranceCompany,
          policyNumber: v.policyNumber,
          coverageAmount: v.coverageAmount,
          status: v.status,
          createdAt: v.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalVerifications: verifications.length, verifiedCount: verified, rejectedCount: rejected },
      rowCount: rows.length
    };
  }

  static async queryPharmacySummary(dateQuery, filters, userRole) {
    const PharmacyOrder = this.getModel('PharmacyOrder');
    const orders = await PharmacyOrder.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const dispensed = orders.filter((o) => o.status === 'DISPENSED').length;
    const pending = orders.filter((o) => ['PENDING', 'ORDERED', 'READY_FOR_DISPENSING'].includes(o.status)).length;

    const rows = orders.map((o) =>
      this.maskRecord(
        {
          orderNumber: o.orderNumber,
          patientId: o.patientId,
          patientName: o.patientName,
          doctorName: o.doctorName,
          status: o.status,
          itemCount: Array.isArray(o.items) ? o.items.length : 0,
          totalAmount: o.totalAmount,
          orderedAt: o.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalOrders: orders.length, dispensedCount: dispensed, pendingCount: pending },
      rowCount: rows.length
    };
  }

  static async queryInventorySummary(filters, userRole) {
    const StockItem = this.getModel('StockItem');
    const items = await StockItem.find().sort({ currentStock: 1 }).lean();

    const lowStock = items.filter((i) => i.currentStock <= (i.reorderLevel || 10)).length;
    const totalValuation = items.reduce((sum, i) => sum + (i.currentStock || 0) * (i.unitPrice || 0), 0);

    const rows = items.map((i) => ({
      itemCode: i.itemCode,
      name: i.name,
      category: i.category,
      currentStock: i.currentStock,
      reorderLevel: i.reorderLevel,
      unit: i.unit,
      unitPrice: i.unitPrice,
      isLowStock: i.currentStock <= (i.reorderLevel || 10)
    }));

    return {
      rows,
      summary: { totalItems: items.length, lowStockCount: lowStock, totalValuationINR: totalValuation },
      rowCount: rows.length
    };
  }

  static async queryProcurementSummary(dateQuery, filters, userRole) {
    const PurchaseOrder = this.getModel('PurchaseOrder');
    const pos = await PurchaseOrder.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const approved = pos.filter((p) => ['APPROVED', 'COMPLETED', 'RECEIVED'].includes(p.status)).length;
    const totalSpend = pos.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const rows = pos.map((p) => ({
      poNumber: p.poNumber,
      vendorName: p.vendorName,
      status: p.status,
      totalAmount: p.totalAmount,
      itemCount: Array.isArray(p.items) ? p.items.length : 0,
      createdAt: p.createdAt
    }));

    return {
      rows,
      summary: { totalPurchaseOrders: pos.length, approvedPOs: approved, totalSpendINR: totalSpend },
      rowCount: rows.length
    };
  }

  static async queryAttendanceSummary(dateQuery, filters, userRole) {
    const Attendance = this.getModel('Attendance');
    const records = await Attendance.find(dateQuery).sort({ date: -1 }).limit(filters.limit || 500).lean();

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.isLate || r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;

    const rows = records.map((r) => ({
      attendanceId: r.attendanceId,
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      department: r.department,
      date: r.date,
      status: r.status,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      workHours: r.workHours || 0
    }));

    return {
      rows,
      summary: { totalRecords: records.length, presentCount: present, lateCount: late, absentCount: absent },
      rowCount: rows.length
    };
  }

  static async queryShiftCoverage(dateQuery, filters, userRole) {
    const ShiftRoster = this.getModel('ShiftRoster');
    const rosters = await ShiftRoster.find(dateQuery).sort({ date: -1 }).limit(filters.limit || 500).lean();

    const rows = rosters.map((s) => ({
      rosterId: s.rosterId,
      employeeId: s.employeeId,
      employeeName: s.employeeName,
      shiftName: s.shiftName || s.shiftCode,
      department: s.department,
      date: s.date,
      status: s.status
    }));

    return {
      rows,
      summary: { totalRosteredShifts: rosters.length },
      rowCount: rows.length
    };
  }

  static async queryLeaveSummary(dateQuery, filters, userRole) {
    const LeaveRequest = this.getModel('LeaveRequest');
    const leaves = await LeaveRequest.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const approved = leaves.filter((l) => l.status === 'APPROVED').length;
    const pending = leaves.filter((l) => l.status === 'PENDING').length;

    const rows = leaves.map((l) => ({
      leaveId: l.leaveId,
      employeeId: l.employeeId,
      employeeName: l.employeeName,
      leaveType: l.leaveType,
      daysCount: l.daysCount,
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status
    }));

    return {
      rows,
      summary: { totalLeaveRequests: leaves.length, approvedLeaves: approved, pendingLeaves: pending },
      rowCount: rows.length
    };
  }

  static async queryLabSummary(dateQuery, filters, userRole) {
    const LabOrder = this.getModel('LabOrder');
    const orders = await LabOrder.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const pending = orders.filter((o) => ['ORDERED', 'COLLECTED', 'PROCESSING'].includes(o.status)).length;

    const rows = orders.map((o) =>
      this.maskRecord(
        {
          orderNumber: o.orderNumber,
          patientId: o.patientId,
          testName: o.testName || (Array.isArray(o.tests) ? o.tests.map((t) => t.testName).join(', ') : 'Lab Test'),
          status: o.status,
          priority: o.priority,
          createdAt: o.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalLabOrders: orders.length, completedOrders: completed, pendingOrders: pending },
      rowCount: rows.length
    };
  }

  static async queryRadiologySummary(dateQuery, filters, userRole) {
    const RadiologyOrder = this.getModel('RadiologyOrder');
    const orders = await RadiologyOrder.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const completed = orders.filter((o) => o.status === 'COMPLETED').length;

    const rows = orders.map((o) =>
      this.maskRecord(
        {
          orderNumber: o.orderNumber,
          patientId: o.patientId,
          examName: o.examName,
          modality: o.modality,
          status: o.status,
          createdAt: o.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalRadiologyOrders: orders.length, completedOrders: completed },
      rowCount: rows.length
    };
  }

  static async queryMaintenanceSummary(dateQuery, filters, userRole) {
    const MaintenanceWorkOrder = this.getModel('MaintenanceWorkOrder');
    const orders = await MaintenanceWorkOrder.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const open = orders.filter((o) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(o.status)).length;

    const rows = orders.map((o) => ({
      workOrderId: o.workOrderId,
      assetName: o.assetName,
      category: o.category,
      priority: o.priority,
      status: o.status,
      assignedTo: o.assignedToName || o.assignedTo,
      createdAt: o.createdAt
    }));

    return {
      rows,
      summary: { totalWorkOrders: orders.length, completedWorkOrders: completed, openWorkOrders: open },
      rowCount: rows.length
    };
  }

  static async queryHousekeepingSummary(dateQuery, filters, userRole) {
    const HousekeepingTask = this.getModel('HousekeepingTask');
    const tasks = await HousekeepingTask.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;

    const rows = tasks.map((t) => ({
      taskId: t.taskId,
      area: t.areaName || t.roomNumber,
      taskType: t.taskType,
      status: t.status,
      assignedTo: t.assignedToName || t.assignedTo,
      createdAt: t.createdAt
    }));

    return {
      rows,
      summary: { totalTasks: tasks.length, completedTasks: completed },
      rowCount: rows.length
    };
  }

  static async queryFeedbackSummary(dateQuery, filters, userRole) {
    const Feedback = this.getModel('Feedback');
    const feedbacks = await Feedback.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const complaints = feedbacks.filter((f) => f.type === 'COMPLAINT').length;
    const suggestions = feedbacks.filter((f) => f.type === 'SUGGESTION').length;
    const compliments = feedbacks.filter((f) => f.type === 'COMPLIMENT').length;
    const resolved = feedbacks.filter((f) => ['RESOLVED', 'CLOSED'].includes(f.status)).length;
    const avgRating =
      feedbacks.filter((f) => f.rating).length > 0
        ? Number(
            (
              feedbacks.filter((f) => f.rating).reduce((sum, f) => sum + f.rating, 0) /
              feedbacks.filter((f) => f.rating).length
            ).toFixed(1)
          )
        : 0;

    const rows = feedbacks.map((f) =>
      this.maskRecord(
        {
          feedbackId: f.feedbackId,
          type: f.type,
          category: f.category,
          rating: f.rating,
          assignedDepartment: f.assignedDepartmentName,
          status: f.status,
          slaStatus: f.slaStatus,
          createdAt: f.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalFeedbacks: feedbacks.length, complaints, suggestions, compliments, resolvedCount: resolved, averageRating: avgRating },
      rowCount: rows.length
    };
  }

  static async queryNotificationSummary(dateQuery, filters, userRole) {
    const Notification = this.getModel('Notification');
    const notifications = await Notification.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const delivered = notifications.filter((n) => n.status === 'DELIVERED').length;
    const failed = notifications.filter((n) => n.status === 'FAILED').length;

    const rows = notifications.map((n) =>
      this.maskRecord(
        {
          notificationId: n.notificationId,
          type: n.type,
          channels: n.channels ? n.channels.join(', ') : n.channel,
          recipientPhone: n.recipientPhone,
          status: n.status,
          priority: n.priority,
          createdAt: n.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalNotifications: notifications.length, deliveredCount: delivered, failedCount: failed },
      rowCount: rows.length
    };
  }

  static async queryDocumentSummary(dateQuery, filters, userRole) {
    const GeneratedDocument = this.getModel('GeneratedDocument');
    const docs = await GeneratedDocument.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const released = docs.filter((d) => d.status === 'RELEASED').length;

    const rows = docs.map((d) =>
      this.maskRecord(
        {
          documentId: d.documentId,
          documentType: d.documentType,
          title: d.title,
          patientId: d.patientId,
          format: d.format,
          status: d.status,
          fileChecksum: d.fileChecksum,
          createdAt: d.createdAt
        },
        userRole
      )
    );

    return {
      rows,
      summary: { totalDocuments: docs.length, releasedDocuments: released },
      rowCount: rows.length
    };
  }

  static async queryRpaSummary(dateQuery, filters, userRole) {
    const RPAJob = this.getModel('RPAJob');
    const jobs = await RPAJob.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const completed = jobs.filter((j) => j.status === 'COMPLETED').length;
    const failed = jobs.filter((j) => j.status === 'FAILED').length;
    const running = jobs.filter((j) => j.status === 'RUNNING').length;

    const rows = jobs.map((j) => ({
      jobId: j.jobId,
      jobType: j.jobType,
      name: j.name,
      status: j.status,
      durationMs: j.durationMs || 0,
      recordsProcessed: j.recordsProcessed || 0,
      createdAt: j.createdAt
    }));

    return {
      rows,
      summary: { totalJobs: jobs.length, completedJobs: completed, failedJobs: failed, runningJobs: running },
      rowCount: rows.length
    };
  }

  static async queryExceptionSummary(dateQuery, filters, userRole) {
    const ExceptionCase = this.getModel('ExceptionCase');
    const exceptions = await ExceptionCase.find(dateQuery).sort({ createdAt: -1 }).limit(filters.limit || 500).lean();

    const open = exceptions.filter((e) => ['OPEN', 'IN_PROGRESS'].includes(e.status)).length;
    const resolved = exceptions.filter((e) => e.status === 'RESOLVED').length;

    const rows = exceptions.map((e) => ({
      exceptionId: e.exceptionId,
      module: e.module,
      exceptionType: e.exceptionType,
      severity: e.severity,
      status: e.status,
      assignedTo: e.assignedTo,
      createdAt: e.createdAt
    }));

    return {
      rows,
      summary: { totalExceptions: exceptions.length, openExceptions: open, resolvedExceptions: resolved },
      rowCount: rows.length
    };
  }
}

module.exports = ReportQueryService;
