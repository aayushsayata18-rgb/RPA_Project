const HousekeepingTask = require('../../models/HousekeepingTask');
const HousekeepingArea = require('../../models/HousekeepingArea');
const HousekeepingInspection = require('../../models/HousekeepingInspection');
const HousekeepingException = require('../../models/HousekeepingException');
const HousekeepingSupplyRequest = require('../../models/HousekeepingSupplyRequest');

const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalTasks,
      openTasks,
      inProgress,
      pendingInspection,
      completedToday,
      totalAreas,
      restrictedAreas,
      totalTurnovers,
      openExceptions,
      pendingSupplies,
      inspections
    ] = await Promise.all([
      HousekeepingTask.countDocuments(),
      HousekeepingTask.countDocuments({ status: { $in: ['PENDING', 'ASSIGNED', 'SCHEDULED', 'REQUESTED', 'REOPENED'] } }),
      HousekeepingTask.countDocuments({ status: 'IN_PROGRESS' }),
      HousekeepingTask.countDocuments({ status: { $in: ['PENDING_INSPECTION', 'CLEANING_COMPLETED'] } }),
      HousekeepingTask.countDocuments({ status: { $in: ['COMPLETED', 'VERIFIED', 'CLOSED'] }, updatedAt: { $gte: today } }),
      HousekeepingArea.countDocuments({ active: true }),
      HousekeepingArea.countDocuments({ status: 'RESTRICTED' }),
      HousekeepingTask.countDocuments({ taskType: 'PATIENT_ROOM_TURNOVER', status: { $nin: ['CLOSED', 'CANCELLED'] } }),
      HousekeepingException.countDocuments({ status: 'OPEN' }),
      HousekeepingSupplyRequest.countDocuments({ status: 'REQUESTED' }),
      HousekeepingInspection.find().select('status rating').lean()
    ]);

    const passedInspections = inspections.filter((i) => i.status === 'PASSED').length;
    const inspectionPassRate = inspections.length > 0 ? Math.round((passedInspections / inspections.length) * 100) : 100;
    const avgRating =
      inspections.length > 0
        ? (inspections.reduce((sum, i) => sum + (i.rating || 5), 0) / inspections.length).toFixed(1)
        : '5.0';

    res.json({
      success: true,
      data: {
        totalTasks,
        openTasks,
        inProgress,
        pendingInspection,
        completedToday,
        totalAreas,
        restrictedAreas,
        totalTurnovers,
        openExceptions,
        pendingSupplies,
        inspectionPassRate,
        avgRating,
        totalInspections: inspections.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskAnalytics = async (req, res) => {
  try {
    const tasksByType = await HousekeepingTask.aggregate([
      { $group: { _id: '$taskType', count: { $sum: 1 } } }
    ]);
    const tasksByPriority = await HousekeepingTask.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const tasksByStatus = await HousekeepingTask.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        tasksByType,
        tasksByPriority,
        tasksByStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSlaAnalytics = async (req, res) => {
  try {
    const slaBreakdown = await HousekeepingTask.aggregate([
      { $group: { _id: '$slaStatus', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { slaBreakdown } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffAnalytics = async (req, res) => {
  try {
    const staffWorkload = await HousekeepingTask.aggregate([
      { $match: { assignedToUserId: { $ne: null } } },
      {
        $group: {
          _id: { userId: '$assignedToUserId', name: '$assignedToName' },
          totalAssigned: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $in: ['$status', ['COMPLETED', 'VERIFIED', 'CLOSED']] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
          }
        }
      }
    ]);
    res.json({ success: true, data: { staffWorkload } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTurnoverAnalytics = async (req, res) => {
  try {
    const turnovers = await HousekeepingTask.find({
      taskType: { $in: ['PATIENT_ROOM_TURNOVER', 'BED_CLEANING', 'DISCHARGE_CLEANING'] }
    })
      .select('status actualStart actualEnd createdAt updatedAt priority')
      .lean();

    res.json({
      success: true,
      data: {
        totalTurnovers: turnovers.length,
        turnovers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardMetrics,
  getTaskAnalytics,
  getSlaAnalytics,
  getStaffAnalytics,
  getTurnoverAnalytics
};
