const SupplyService = require('../../services/housekeeping/supplyService');

const requestSupplies = async (req, res) => {
  try {
    const supplyReq = await SupplyService.requestSupplies(req.body, req.user);
    res.status(201).json({ success: true, data: supplyReq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listSupplyRequests = async (req, res) => {
  try {
    const requests = await SupplyService.listSupplyRequests(req.query);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSupplyRequestById = async (req, res) => {
  try {
    const request = await SupplyService.getSupplyRequestById(req.params.id);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const approveSupplyRequest = async (req, res) => {
  try {
    const request = await SupplyService.approveSupplyRequest(req.params.id, req.user);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const issueSupplyRequest = async (req, res) => {
  try {
    const request = await SupplyService.issueSupplyRequest(req.params.id, req.user);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const returnSupplyRequest = async (req, res) => {
  try {
    const request = await SupplyService.returnSupplyRequest(req.params.id, req.body, req.user);
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestSupplies,
  listSupplyRequests,
  getSupplyRequestById,
  approveSupplyRequest,
  issueSupplyRequest,
  returnSupplyRequest
};
