const ReservationService = require('../services/inventory/reservationService');

class ReservationController {
  static async createReservation(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const reservation = await ReservationService.createReservation(req.body, user);
      res.status(201).json({ success: true, reservation });
    } catch (err) {
      next(err);
    }
  }

  static async releaseReservation(req, res, next) {
    try {
      const user = req.user || { userId: 'SYSTEM' };
      const { id } = req.params;
      const { reason } = req.body;
      const reservation = await ReservationService.releaseReservation(id, reason, user);
      res.json({ success: true, reservation });
    } catch (err) {
      next(err);
    }
  }

  static async getReservations(req, res, next) {
    try {
      const result = await ReservationService.getReservations(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReservationController;
