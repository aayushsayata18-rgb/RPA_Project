const User = require('../../models/User');
const HousekeepingTask = require('../../models/HousekeepingTask');
const TaskService = require('./taskService');

class AssignmentService {
  /**
   * Get eligible staff for housekeeping assignment
   */
  static async getAvailableStaff() {
    const staff = await User.find({
      role: { $in: ['HOUSEKEEPING', 'NURSE', 'SYSTEM_ADMIN'] },
      isActive: true
    })
      .select('userId firstName lastName name role email')
      .lean();

    // Attach active task count to assist workload balancing
    const activeTasks = await HousekeepingTask.aggregate([
      {
        $match: {
          status: { $in: ['ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_INSPECTION'] },
          assignedToUserId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedToUserId',
          count: { $sum: 1 }
        }
      }
    ]);

    const taskCountMap = {};
    activeTasks.forEach((t) => {
      taskCountMap[t._id] = t.count;
    });

    return staff.map((s) => ({
      ...s,
      activeTaskCount: taskCountMap[s.userId] || 0
    }));
  }

  /**
   * Auto-assign task to least loaded staff member
   */
  static async autoAssignTask(taskId, actorUser) {
    const staffList = await AssignmentService.getAvailableStaff();
    if (!staffList || staffList.length === 0) {
      throw new Error('No available housekeeping staff found for auto-assignment.');
    }

    // Sort by fewest active tasks
    staffList.sort((a, b) => a.activeTaskCount - b.activeTaskCount);
    const chosen = staffList[0];

    const assignedName = `${chosen.firstName || ''} ${chosen.lastName || ''}`.trim() || chosen.name || chosen.userId;
    return await TaskService.assignTask(
      taskId,
      {
        assignedToUserId: chosen.userId,
        assignedToName: assignedName
      },
      actorUser
    );
  }
}

module.exports = AssignmentService;
