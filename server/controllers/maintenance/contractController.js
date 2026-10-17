const ContractService = require('../../services/maintenance/contractService');

exports.createContract = async (req, res, next) => {
  try {
    const contract = await ContractService.createContract(req.body, req.user?._id || req.user?.id);
    res.status(201).json({
      success: true,
      data: contract,
      message: 'AMC / Service contract created'
    });
  } catch (err) {
    next(err);
  }
};

exports.getContracts = async (req, res, next) => {
  try {
    const result = await ContractService.getContracts(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

exports.getContractById = async (req, res, next) => {
  try {
    const contract = await ContractService.getContractById(req.params.id);
    res.json({
      success: true,
      data: contract
    });
  } catch (err) {
    next(err);
  }
};

exports.updateContract = async (req, res, next) => {
  try {
    const contract = await ContractService.updateContract(req.params.id, req.body, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: contract,
      message: 'Contract details updated'
    });
  } catch (err) {
    next(err);
  }
};

exports.renewContract = async (req, res, next) => {
  try {
    const contract = await ContractService.renewContract(req.params.id, req.body, req.user?._id || req.user?.id);
    res.json({
      success: true,
      data: contract,
      message: 'Contract renewed successfully'
    });
  } catch (err) {
    next(err);
  }
};
