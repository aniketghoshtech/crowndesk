import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { ServicePricing, Offer } from '../models/types';
import { evaluateOffer } from '../services/offerEngine';

export const servicesRouter = express.Router();
export const offersRouter = express.Router();
export const pricingRouter = express.Router();

// ==========================================
// Services Router (Handles /api/services and /api/pricing/services)
// ==========================================

// GET /api/services
function handleGetServices(req: Request, res: Response): void {
  try {
    const services = typeof db.getAllServices === 'function' 
      ? db.getAllServices() 
      : ((db.getRawData && db.getRawData().services) || []);
    res.json({ services: services || [] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
}

// POST /api/services
function handleCreateService(req: Request, res: Response): void {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const {
      name,
      code,
      category = 'Crown',
      description,
      unitType = 'Per Tooth',
      currency = 'INR',
      unitPriceINR,
      unitPriceUSD,
      unitPriceEUR,
      unitPriceGBP,
      taxPercent = 18,
      materials = [],
      shades = [],
      standardTurnaroundHours = 24,
      active = true,
      featured = false
    } = req.body;

    if (!name || !code || unitPriceINR === undefined) {
      res.status(400).json({ error: 'Service name, unique code, and base INR price are required.' });
      return;
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = db.findServiceById(cleanCode);
    if (existing) {
      res.status(400).json({ error: `Service code "${cleanCode}" is already in use.` });
      return;
    }

    const inrVal = Number(unitPriceINR);
    const newService: ServicePricing = {
      id: `srv-${Date.now()}`,
      code: cleanCode,
      name: name.trim(),
      category: category.trim(),
      description: description || '',
      unitType: unitType || 'Per Tooth',
      currency: currency || 'INR',
      unitPriceINR: inrVal,
      unitPriceUSD: unitPriceUSD ? Number(unitPriceUSD) : Math.round((inrVal / 83) * 10) / 10,
      unitPriceEUR: unitPriceEUR ? Number(unitPriceEUR) : Math.round((inrVal / 90) * 10) / 10,
      unitPriceGBP: unitPriceGBP ? Number(unitPriceGBP) : Math.round((inrVal / 105) * 10) / 10,
      taxPercent: Number(taxPercent) || 18,
      discountPercent: 0,
      materials: Array.isArray(materials) && materials.length > 0 ? materials : ['Zirconia Multi-Layer', 'Lithium Disilicate (E-Max)'],
      shades: Array.isArray(shades) && shades.length > 0 ? shades : ['A1', 'A2', 'A3', 'B1', 'Bleach BL1'],
      standardTurnaroundHours: Number(standardTurnaroundHours) || 24,
      active: Boolean(active),
      isActive: Boolean(active),
      featured: Boolean(featured),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addService(newService);

    // Track pricing history
    if (typeof (db as any).addPricingHistory === 'function') {
      (db as any).addPricingHistory({
        serviceId: newService.id,
        serviceName: newService.name,
        previousPriceINR: inrVal,
        newPriceINR: inrVal,
        changedBy: user.name,
        reason: 'Initial service creation'
      });
    }

    res.status(201).json({ message: 'Service added successfully.', service: newService });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create service.' });
  }
}

// PUT /api/services/:id
function handleUpdateService(req: Request, res: Response): void {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const { changeReason, ...updates } = req.body;
    const existing = db.findServiceById(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    if (updates.unitPriceINR !== undefined) updates.unitPriceINR = Number(updates.unitPriceINR);
    if (updates.unitPriceUSD !== undefined) updates.unitPriceUSD = Number(updates.unitPriceUSD);
    if (updates.unitPriceEUR !== undefined) updates.unitPriceEUR = Number(updates.unitPriceEUR);
    if (updates.unitPriceGBP !== undefined) updates.unitPriceGBP = Number(updates.unitPriceGBP);
    if (updates.taxPercent !== undefined) updates.taxPercent = Number(updates.taxPercent);
    if (updates.standardTurnaroundHours !== undefined) updates.standardTurnaroundHours = Number(updates.standardTurnaroundHours);

    // Record price change history if price updated
    if (updates.unitPriceINR !== undefined && updates.unitPriceINR !== existing.unitPriceINR) {
      if (typeof (db as any).addPricingHistory === 'function') {
        (db as any).addPricingHistory({
          serviceId: existing.id,
          serviceName: existing.name,
          previousPriceINR: existing.unitPriceINR,
          newPriceINR: updates.unitPriceINR,
          changedBy: user.name,
          reason: changeReason || 'Price updated by administrator'
        });
      }
    }

    const updated = db.updateService(existing.id, updates);

    res.json({ message: 'Service updated successfully.', service: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update service.' });
  }
}

// PATCH /api/services/:id/toggle
function handleToggleService(req: Request, res: Response): void {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const service = db.findServiceById(req.params.id);
    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    const newStatus = !(service.active ?? service.isActive ?? true);
    const updated = db.updateService(service.id, { active: newStatus, isActive: newStatus });

    res.json({
      message: `Service "${service.name}" is now ${newStatus ? 'Active' : 'Disabled'}.`,
      service: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle service.' });
  }
}

// DELETE /api/services/:id
function handleDeleteService(req: Request, res: Response): void {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const service = db.findServiceById(req.params.id);
    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    const cases = typeof db.getAllCases === 'function' ? db.getAllCases() : [];
    const inUseCount = cases.filter(c => c.serviceId === service.id || c.serviceCode === service.code).length;

    if (inUseCount > 0) {
      db.updateService(service.id, { active: false, isActive: false });
      res.json({
        message: `Service has ${inUseCount} case(s) on record. It has been disabled/archived to maintain historical case pricing snapshots.`,
        archived: true,
        inUseCount
      });
      return;
    }

    db.deleteService(service.id);
    res.json({ message: 'Service deleted permanently from database.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete service.' });
  }
}

servicesRouter.get('/', handleGetServices);
servicesRouter.post('/', handleCreateService);
servicesRouter.put('/:id', handleUpdateService);
servicesRouter.patch('/:id/toggle', handleToggleService);
servicesRouter.delete('/:id', handleDeleteService);

// ==========================================
// Offers Router (Handles /api/offers and /api/pricing/offers)
// ==========================================

// GET /api/offers
function handleGetOffers(req: Request, res: Response): void {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const offers = typeof db.getAllOffers === 'function'
      ? db.getAllOffers(includeInactive)
      : ((db.getRawData && db.getRawData().offers) || []);
    res.json({ offers: offers || [] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
}

// POST /api/offers
function handleCreateOffer(req: Request, res: Response): void {
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
      endDate
    } = req.body;

    if (!code || !title) {
      res.status(400).json({ error: 'Promo code and offer title are required.' });
      return;
    }

    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      code: code.toUpperCase().trim(),
      title: title.trim(),
      description: description || '',
      offerType: offerType as any,
      buyQuantityRequired: Math.max(1, Number(buyQuantityRequired) || 1),
      freeUnitsCount: Number(freeUnitsCount) || 0,
      percentageDiscount: Number(percentageDiscount) || 0,
      eligibleServiceCodes: Array.isArray(eligibleServiceCodes) ? eligibleServiceCodes : [],
      isNewCustomerOnly: Boolean(isNewCustomerOnly),
      maxUsagePerCustomer: Math.max(1, Number(maxUsagePerCustomer) || 1),
      active: true,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    db.addOffer(newOffer);

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'OFFER_CREATED',
      details: `Created promotion: ${newOffer.code} (${newOffer.title})`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.status(201).json({ message: 'Offer created successfully.', offer: newOffer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create offer.' });
  }
}

// PUT /api/offers/:id
function handleUpdateOffer(req: Request, res: Response): void {
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
}

// PATCH /api/offers/:id/toggle
function handleToggleOffer(req: Request, res: Response): void {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const { id } = req.params;
    const offer = db.findOfferById(id);
    if (!offer) {
      res.status(404).json({ error: 'Offer not found.' });
      return;
    }

    const newActive = !offer.active;
    const toggled = db.updateOffer(id, { active: newActive });

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'OFFER_STATUS_TOGGLED',
      details: `Toggled status of offer ${offer.code} to ${newActive ? 'ACTIVE' : 'INACTIVE'}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: `Offer ${offer.code} is now ${newActive ? 'Active' : 'Inactive'}.`, offer: toggled });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle offer status.' });
  }
}

// DELETE /api/offers/:id
function handleDeleteOffer(req: Request, res: Response): void {
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
}

offersRouter.get('/', handleGetOffers);
offersRouter.post('/', handleCreateOffer);
offersRouter.put('/:id', handleUpdateOffer);
offersRouter.patch('/:id/toggle', handleToggleOffer);
offersRouter.delete('/:id', handleDeleteOffer);

// ==========================================
// Pricing Router (Handles /api/pricing)
// ==========================================

// GET /api/pricing/tax-settings
pricingRouter.get('/tax-settings', (req: Request, res: Response): void => {
  try {
    const taxSettings = db.getTaxSettings();
    res.json({ taxSettings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tax settings.' });
  }
});

// PUT /api/pricing/tax-settings
pricingRouter.put('/tax-settings', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required.' });
      return;
    }

    const { taxEnabled, taxName, taxPercent } = req.body;
    const current = db.getTaxSettings();
    const updated = db.updateTaxSettings({
      taxEnabled: taxEnabled !== undefined ? Boolean(taxEnabled) : current.taxEnabled,
      taxName: taxName !== undefined ? String(taxName).trim() : current.taxName,
      taxPercent: taxPercent !== undefined ? Number(taxPercent) : current.taxPercent
    });

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'TAX_SETTINGS_UPDATED',
      details: `Updated tax settings: ${updated.taxName} (${updated.taxPercent}%), Enabled: ${updated.taxEnabled}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: 'Tax settings updated successfully.', taxSettings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update tax settings.' });
  }
});

// GET /api/pricing/history - Pricing audit history
pricingRouter.get('/history', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Administrative permission required to view pricing history.' });
      return;
    }

    const { serviceId } = req.query;
    let history: any[] = [];
    if (typeof (db as any).getAllPricingHistory === 'function') {
      history = (db as any).getAllPricingHistory();
    } else if (typeof (db as any).getRawData === 'function') {
      history = (db as any).getRawData()?.pricingHistory || [];
    }

    if (serviceId && typeof serviceId === 'string') {
      const sId = serviceId.toUpperCase().trim();
      history = history.filter((h: any) => 
        (h.serviceId && h.serviceId.toUpperCase() === sId) ||
        (h.serviceCode && h.serviceCode.toUpperCase() === sId)
      );
    }

    res.json({ history: history || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch pricing history.' });
  }
});

// POST /api/pricing/calculate - Robust Server-side Unit Price & Offer Calculation
pricingRouter.post('/calculate', (req: Request, res: Response): void => {
  try {
    const { serviceId, quantity = 1, offerCode } = req.body;
    const authUser = getAuthenticatedUser(req);

    if (!serviceId) {
      res.status(400).json({ error: 'Service ID is required.' });
      return;
    }

    const service = db.findServiceById(serviceId);
    if (!service) {
      res.status(404).json({ error: 'Service not found in master catalog.' });
      return;
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const taxSettings = db.getTaxSettings();

    const offerResult = evaluateOffer({
      offerCode,
      service,
      quantity: qty,
      user: authUser
    });

    const subtotal = service.unitPriceINR * qty;
    const discount = offerResult.discountAmount || 0;
    const chargeableAmount = Math.max(0, subtotal - discount);
    const effectiveTaxRate = taxSettings.taxEnabled ? (taxSettings.taxPercent ?? service.taxPercent) : 0;
    const taxAmount = Math.round(chargeableAmount * (effectiveTaxRate / 100));
    const finalTotal = chargeableAmount + taxAmount;

    res.json({
      service: {
        id: service.id,
        name: service.name,
        code: service.code,
        unitType: service.unitType,
        unitPriceINR: service.unitPriceINR,
        unitPriceUSD: service.unitPriceUSD,
        taxPercent: effectiveTaxRate
      },
      quantity: qty,
      subtotalINR: subtotal,
      offerCalculation: {
        isValidOffer: offerResult.isValid,
        offerCode: offerResult.appliedOffer?.code || null,
        offerTitle: offerResult.appliedOffer?.title || null,
        message: offerResult.message,
        freeUnitsGiven: offerResult.freeUnitsCount,
        discountAmountINR: offerResult.discountAmount,
        chargeableUnits: Math.max(0, qty - offerResult.freeUnitsCount),
        chargeableAmountINR: chargeableAmount
      },
      taxAmountINR: taxAmount,
      finalTotalINR: finalTotal,
      taxSettings
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Pricing calculation failed.' });
  }
});

// Mount services and offers subroutes inside pricing router as well
pricingRouter.use('/services', servicesRouter);
pricingRouter.use('/offers', offersRouter);

export default pricingRouter;