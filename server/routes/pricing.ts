import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { ServicePricing, Offer } from '../models/types';
import { evaluateOffer } from '../services/offerEngine';

const router = express.Router();

// 0. GET /api/pricing/tax-settings - Public live tax configuration
router.get('/tax-settings', (req: Request, res: Response): void => {
  try {
    const taxSettings = db.getTaxSettings();
    res.json({ taxSettings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tax settings.' });
  }
});

// 1. GET /api/services - Public list of services
router.get('/services', (req: Request, res: Response): void => {
  try {
    const services = db.getAllServices();
    res.json({ services });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// 2. POST /api/services - Admin Add Service
router.post('/services', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const {
      name,
      code,
      description,
      unitType = 'Per Tooth',
      unitPriceINR,
      unitPriceUSD,
      taxPercent = 18,
      materials = [],
      shades = [],
      standardTurnaroundHours = 24
    } = req.body;

    if (!name || !code || !unitPriceINR) {
      res.status(400).json({ error: 'Name, code, and INR unit price are required.' });
      return;
    }

    const newService: ServicePricing = {
      id: `srv-${Date.now()}`,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      description: description || '',
      unitType,
      unitPriceINR: Number(unitPriceINR),
      unitPriceUSD: Number(unitPriceUSD || (unitPriceINR / 75).toFixed(2)),
      taxPercent: Number(taxPercent),
      discountPercent: 0,
      materials: materials.length ? materials : ['Zirconia Multi-Layer', 'Lithium Disilicate', 'PMMA'],
      shades: shades.length ? shades : ['A1', 'A2', 'A3', 'B1', 'Bleach BL1'],
      standardTurnaroundHours: Number(standardTurnaroundHours),
      active: true,
      featured: false
    };

    db.addService(newService);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SERVICE_CREATED',
      details: `Created new dental service: ${newService.name} (₹${newService.unitPriceINR})`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.status(201).json({ message: 'Service created successfully.', service: newService });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create service.' });
  }
});

// 3. PUT /api/services/:id - Admin Update Service
router.put('/services/:id', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const updated = db.updateService(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SERVICE_UPDATED',
      details: `Updated service ${updated.name}: Price ₹${updated.unitPriceINR}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: 'Service updated successfully.', service: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update service.' });
  }
});

// 4. DELETE /api/services/:id - Admin Delete Service
router.delete('/services/:id', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const ok = db.deleteService(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SERVICE_DELETED',
      details: `Deleted service ID ${req.params.id}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: 'Service deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete service.' });
  }
});

// 5. GET /api/offers - Promotional Offers List
router.get('/offers', (req: Request, res: Response): void => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const offers = db.getAllOffers(includeInactive);
    res.json({ offers });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
});

// 6. POST /api/offers - Admin Create Offer
router.post('/offers', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const {
      code,
      title,
      description,
      offerType = 'FREE_UNITS',
      freeUnitsCount = 1,
      percentageDiscount = 0,
      buyQuantityRequired = 1,
      eligibleServiceCodes = [],
      isNewCustomerOnly = false,
      maxUsagePerCustomer = 1,
      startDate,
      endDate,
      active = true
    } = req.body;

    if (!code || !title) {
      res.status(400).json({ error: 'Offer code and title are required.' });
      return;
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = db.findOfferByCode(cleanCode, false);
    if (existing) {
      res.status(400).json({ error: `An offer with promo code "${cleanCode}" already exists.` });
      return;
    }

    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      code: cleanCode,
      title: title.trim(),
      description: description || '',
      offerType: (offerType === 'BUY_X_GET_Y' || offerType === 'PERCENTAGE' || offerType === 'FREE_UNITS') ? offerType : 'FREE_UNITS',
      buyQuantityRequired: Math.max(1, Number(buyQuantityRequired) || 1),
      freeUnitsCount: Math.max(0, Number(freeUnitsCount) || 0),
      percentageDiscount: Number(percentageDiscount) || 0,
      eligibleServiceCodes: Array.isArray(eligibleServiceCodes) ? eligibleServiceCodes : [],
      isNewCustomerOnly: Boolean(isNewCustomerOnly),
      maxUsagePerCustomer: Math.max(1, Number(maxUsagePerCustomer) || 1),
      active: active !== undefined ? Boolean(active) : true,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 365 * 86400000).toISOString(),
      timesRedeemed: 0
    };

    db.addOffer(newOffer);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'OFFER_CREATED',
      details: `Created promotion: ${newOffer.code} - ${newOffer.title} (${newOffer.offerType})`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.status(201).json({ message: 'Offer created successfully.', offer: newOffer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create offer.' });
  }
});

// 7. PUT /api/offers/:id - Admin Update Offer
router.put('/offers/:id', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const { id } = req.params;
    const existing = db.findOfferById(id);
    if (!existing) {
      res.status(404).json({ error: 'Offer not found.' });
      return;
    }

    const {
      code,
      title,
      description,
      offerType,
      freeUnitsCount,
      percentageDiscount,
      buyQuantityRequired,
      eligibleServiceCodes,
      isNewCustomerOnly,
      maxUsagePerCustomer,
      startDate,
      endDate,
      active
    } = req.body;

    const updates: Partial<Offer> = {};
    if (code !== undefined) updates.code = code.toUpperCase().trim();
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (offerType !== undefined) updates.offerType = offerType;
    if (freeUnitsCount !== undefined) updates.freeUnitsCount = Number(freeUnitsCount);
    if (percentageDiscount !== undefined) updates.percentageDiscount = Number(percentageDiscount);
    if (buyQuantityRequired !== undefined) updates.buyQuantityRequired = Math.max(1, Number(buyQuantityRequired));
    if (eligibleServiceCodes !== undefined) updates.eligibleServiceCodes = Array.isArray(eligibleServiceCodes) ? eligibleServiceCodes : [];
    if (isNewCustomerOnly !== undefined) updates.isNewCustomerOnly = Boolean(isNewCustomerOnly);
    if (maxUsagePerCustomer !== undefined) updates.maxUsagePerCustomer = Math.max(1, Number(maxUsagePerCustomer));
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (active !== undefined) updates.active = Boolean(active);

    const updated = db.updateOffer(id, updates);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'OFFER_UPDATED',
      details: `Updated promotion ${updated?.code}: ${updated?.title}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: 'Offer updated successfully.', offer: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update offer.' });
  }
});

// 8. PATCH /api/offers/:id/toggle - Admin Toggle Active/Inactive
router.patch('/offers/:id/toggle', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const { id } = req.params;
    const toggled = db.toggleOfferActive(id);
    if (!toggled) {
      res.status(404).json({ error: 'Offer not found.' });
      return;
    }

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'OFFER_STATUS_TOGGLED',
      details: `Toggled status of offer ${toggled.code} to ${toggled.active ? 'ACTIVE' : 'INACTIVE'}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: `Offer ${toggled.code} is now ${toggled.active ? 'Active' : 'Inactive'}.`, offer: toggled });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle offer status.' });
  }
});

// 9. DELETE /api/offers/:id - Admin Delete Offer
router.delete('/offers/:id', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const { id } = req.params;
    const existing = db.findOfferById(id);
    if (!existing) {
      res.status(404).json({ error: 'Offer not found.' });
      return;
    }

    db.deleteOffer(id);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'OFFER_DELETED',
      details: `Deleted offer ${existing.code} (${existing.title})`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: 'Offer deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete offer.' });
  }
});

// 10. POST /api/pricing/calculate - Robust Server-side Unit Price & Offer Calculation
router.post('/calculate', (req: Request, res: Response): void => {
  try {
    const { serviceId, quantity = 1, offerCode } = req.body;
    const authUser = getAuthenticatedUser(req);

    if (!serviceId) {
      res.status(400).json({ error: 'Service ID is required.' });
      return;
    }

    const service = db.findServiceById(serviceId);
    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    const units = Math.max(1, Number(quantity) || 1);
    const unitPrice = service.unitPriceINR;
    const subtotal = unitPrice * units;
    let serviceDiscountAmount = (subtotal * (service.discountPercent || 0)) / 100;

    let offerDiscountAmount = 0;
    let appliedOffer: Offer | null = null;
    let offerValidationMessage = '';

    if (offerCode && typeof offerCode === 'string' && offerCode.trim()) {
      const evaluation = evaluateOffer({
        offerCode: offerCode.trim(),
        service,
        quantity: units,
        user: authUser
      });

      offerValidationMessage = evaluation.message;
      if (evaluation.isValid && evaluation.appliedOffer) {
        appliedOffer = evaluation.appliedOffer;
        offerDiscountAmount = evaluation.discountAmount;
      }
    }

    const taxSettings = db.getTaxSettings();
    const effectiveTaxPercent = taxSettings.taxEnabled ? (service.taxPercent !== undefined ? service.taxPercent : taxSettings.taxPercent) : 0;
    const taxableAmount = Math.max(0, subtotal - serviceDiscountAmount - offerDiscountAmount);
    const taxAmount = Math.round((taxableAmount * (effectiveTaxPercent / 100)) * 100) / 100;
    const finalTotalAmount = Math.max(0, taxableAmount + taxAmount);

    res.json({
      serviceName: service.name,
      serviceCode: service.code,
      unitType: service.unitType,
      unitPrice,
      currency: 'INR',
      unitsQuantity: units,
      subtotal,
      discountAmount: serviceDiscountAmount,
      offerDiscountAmount,
      appliedOfferCode: appliedOffer?.code,
      appliedOfferTitle: appliedOffer?.title,
      offerValidationMessage,
      isOfferValid: Boolean(appliedOffer),
      taxPercent: effectiveTaxPercent,
      taxName: taxSettings.taxName,
      taxEnabled: taxSettings.taxEnabled,
      taxAmount,
      finalTotalAmount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Price calculation failed.' });
  }
});

export default router;
