const VendorContact = require('../models/VendorContact');
const VendorAddress = require('../models/VendorAddress');
const Vendor = require('../models/Vendor');
const IdGeneratorService = require('../services/IdGeneratorService');

class VendorContactController {
  /**
   * GET /api/vendors/:id/contacts
   */
  static async getContacts(req, res, next) {
    try {
      const contacts = await VendorContact.find({ vendorId: req.params.id }).sort({ isPrimary: -1, createdAt: 1 });
      res.json({
        success: true,
        data: contacts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/contacts
   */
  static async createContact(req, res, next) {
    try {
      const vendorId = req.params.id;
      const contactId = await IdGeneratorService.generateVendorContactId();

      if (req.body.isPrimary) {
        // Demote previous primary
        await VendorContact.updateMany({ vendorId, isPrimary: true }, { isPrimary: false });
      }

      const contact = new VendorContact({
        vendorContactId: contactId,
        vendorId,
        name: req.body.name,
        designation: req.body.designation || '',
        department: req.body.department || '',
        email: req.body.email,
        phone: req.body.phone,
        alternatePhone: req.body.alternatePhone || '',
        contactType: req.body.contactType || 'PRIMARY',
        isPrimary: !!req.body.isPrimary,
        status: req.body.status || 'ACTIVE'
      });

      await contact.save();

      if (contact.isPrimary) {
        await Vendor.updateOne({ vendorId }, { primaryContactId: contactId });
      }

      res.status(201).json({
        success: true,
        message: 'Contact added successfully',
        data: contact
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/vendors/:id/contacts/:contactId
   */
  static async updateContact(req, res, next) {
    try {
      const { contactId, id: vendorId } = req.params;
      const contact = await VendorContact.findOne({ vendorContactId: contactId, vendorId });
      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' });
      }

      if (req.body.isPrimary && !contact.isPrimary) {
        await VendorContact.updateMany({ vendorId, isPrimary: true }, { isPrimary: false });
        await Vendor.updateOne({ vendorId }, { primaryContactId: contactId });
      }

      const allowed = ['name', 'designation', 'department', 'email', 'phone', 'alternatePhone', 'contactType', 'isPrimary', 'status'];
      allowed.forEach((f) => {
        if (req.body[f] !== undefined) contact[f] = req.body[f];
      });

      await contact.save();

      res.json({
        success: true,
        message: 'Contact updated successfully',
        data: contact
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/vendors/:id/contacts/:contactId
   */
  static async deleteContact(req, res, next) {
    try {
      const { contactId, id: vendorId } = req.params;
      const contact = await VendorContact.findOneAndDelete({ vendorContactId: contactId, vendorId });
      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' });
      }

      // If deleted primary contact, clear from vendor
      await Vendor.updateOne({ vendorId, primaryContactId: contactId }, { primaryContactId: null });

      res.json({
        success: true,
        message: 'Contact removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Address endpoints
   * GET /api/vendors/:id/addresses
   */
  static async getAddresses(req, res, next) {
    try {
      const addresses = await VendorAddress.find({ vendorId: req.params.id }).sort({ isPrimary: -1, createdAt: 1 });
      res.json({
        success: true,
        data: addresses
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vendors/:id/addresses
   */
  static async createAddress(req, res, next) {
    try {
      const vendorId = req.params.id;
      const addressId = await IdGeneratorService.generateVendorAddressId();

      if (req.body.isPrimary) {
        await VendorAddress.updateMany({ vendorId, isPrimary: true }, { isPrimary: false });
      }

      const address = new VendorAddress({
        addressId,
        vendorId,
        addressType: req.body.addressType || 'REGISTERED',
        line1: req.body.line1,
        line2: req.body.line2 || '',
        city: req.body.city,
        state: req.body.state,
        country: req.body.country || 'India',
        postalCode: req.body.postalCode,
        isPrimary: !!req.body.isPrimary,
        status: req.body.status || 'ACTIVE'
      });

      await address.save();

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: address
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorContactController;
