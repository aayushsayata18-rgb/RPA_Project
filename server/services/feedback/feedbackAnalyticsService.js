const Feedback = require('../../models/Feedback');
const FeedbackSLA = require('../../models/FeedbackSLA');

class FeedbackAnalyticsService {
  /**
   * Overall summary KPI metrics for management dashboards
   */
  static async getSummary() {
    const total = await Feedback.countDocuments();
    const complaints = await Feedback.countDocuments({ type: 'COMPLAINT' });
    const suggestions = await Feedback.countDocuments({ type: 'SUGGESTION' });
    const compliments = await Feedback.countDocuments({ type: 'COMPLIMENT' });
    const serviceFeedback = await Feedback.countDocuments({ type: 'SERVICE_FEEDBACK' });

    const openComplaints = await Feedback.countDocuments({
      type: 'COMPLAINT',
      status: { $in: ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'UNDER_REVIEW', 'INVESTIGATION', 'RESPONSE_DRAFT', 'RESPONSE_PENDING_APPROVAL'] }
    });

    const escalated = await Feedback.countDocuments({ status: 'ESCALATED' });
    const resolved = await Feedback.countDocuments({ status: 'RESOLVED' });
    const closed = await Feedback.countDocuments({ status: 'CLOSED' });
    const reopened = await Feedback.countDocuments({ status: 'REOPENED' });

    const slaBreached = await Feedback.countDocuments({ slaStatus: 'BREACHED' });
    const slaAtRisk = await Feedback.countDocuments({ slaStatus: 'AT_RISK' });

    // Average rating
    const ratingAggregation = await Feedback.aggregate([
      { $match: { rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const averageRating = ratingAggregation.length > 0 ? Number(ratingAggregation[0].avgRating.toFixed(2)) : 0;

    return {
      total,
      complaints,
      suggestions,
      compliments,
      serviceFeedback,
      openComplaints,
      escalated,
      resolved,
      closed,
      reopened,
      slaBreached,
      slaAtRisk,
      averageRating
    };
  }

  /**
   * Group feedback metrics by category
   */
  static async getByCategory() {
    return await Feedback.aggregate([
      {
        $group: {
          _id: '$category',
          totalCount: { $sum: 1 },
          complaintCount: {
            $sum: { $cond: [{ $eq: ['$type', 'COMPLAINT'] }, 1, 0] }
          },
          avgRating: { $avg: '$rating' },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] }
          }
        }
      },
      { $sort: { totalCount: -1 } }
    ]);
  }

  /**
   * Performance metrics broken down by department
   */
  static async getByDepartment() {
    return await Feedback.aggregate([
      {
        $group: {
          _id: {
            departmentId: '$assignedDepartmentId',
            departmentName: '$assignedDepartmentName'
          },
          totalCases: { $sum: 1 },
          complaintCount: {
            $sum: { $cond: [{ $eq: ['$type', 'COMPLAINT'] }, 1, 0] }
          },
          breachedCount: {
            $sum: { $cond: [{ $eq: ['$slaStatus', 'BREACHED'] }, 1, 0] }
          },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] }
          },
          reopenedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'REOPENED'] }, 1, 0] }
          },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          _id: 0,
          departmentId: '$_id.departmentId',
          departmentName: { $ifNull: ['$_id.departmentName', 'Unassigned / General'] },
          totalCases: 1,
          complaintCount: 1,
          breachedCount: 1,
          resolvedCount: 1,
          reopenedCount: 1,
          avgRating: { $round: [{ $ifNull: ['$avgRating', 0] }, 2] },
          slaCompliance: {
            $cond: [
              { $gt: ['$totalCases', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ['$totalCases', '$breachedCount'] },
                          '$totalCases'
                        ]
                      },
                      100
                    ]
                  },
                  1
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { totalCases: -1 } }
    ]);
  }

  /**
   * Rating distribution analysis (1 to 5 stars)
   */
  static async getRatingDistribution() {
    const ratings = await Feedback.aggregate([
      { $match: { rating: { $ne: null } } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => {
      if (r._id >= 1 && r._id <= 5) distribution[r._id] = r.count;
    });

    const totalRatings = Object.values(distribution).reduce((a, b) => a + b, 0);
    const weightedSum = Object.entries(distribution).reduce((acc, [stars, count]) => acc + stars * count, 0);
    const average = totalRatings > 0 ? Number((weightedSum / totalRatings).toFixed(2)) : 0;

    return {
      distribution,
      totalRatings,
      average
    };
  }

  /**
   * SLA Performance breakdown
   */
  static async getSLAPerformance() {
    const totalWithSLA = await Feedback.countDocuments({ dueAt: { $ne: null } });
    const onTrack = await Feedback.countDocuments({ slaStatus: 'ON_TRACK', dueAt: { $ne: null } });
    const atRisk = await Feedback.countDocuments({ slaStatus: 'AT_RISK' });
    const breached = await Feedback.countDocuments({ slaStatus: 'BREACHED' });
    const paused = await Feedback.countDocuments({ slaStatus: 'PAUSED' });

    const complianceRate = totalWithSLA > 0 ? Number((((totalWithSLA - breached) / totalWithSLA) * 100).toFixed(1)) : 100;

    return {
      totalWithSLA,
      onTrack,
      atRisk,
      breached,
      paused,
      complianceRate
    };
  }
}

module.exports = FeedbackAnalyticsService;
