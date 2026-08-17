import { Offer, ServicePricing, User } from '../models/types';
import { db } from '../db/store';

export interface OfferEvaluationResult {
  isValid: boolean;
  appliedOffer: Offer | null;
  discountAmount: number;
  freeUnitsCount: number;
  message: string;
}

/**
 * Robust, configurable Offer Engine for CrownDesk CAD Services.
 * Evaluates buy quantity, free quantity, service eligibility, new customer eligibility,
 * start/end dates, maximum usage limits, and active status.
 */
export function evaluateOffer(params: {
  offerCode?: string;
  service: ServicePricing;
  quantity: number;
  user?: User | null;
}): OfferEvaluationResult {
  const { offerCode, service, quantity, user } = params;

  if (!offerCode || !offerCode.trim()) {
    return {
      isValid: false,
      appliedOffer: null,
      discountAmount: 0,
      freeUnitsCount: 0,
      message: ''
    };
  }

  const cleanCode = offerCode.trim().toUpperCase();
  const offer = db.findOfferByCode(cleanCode, false);

  if (!offer) {
    return {
      isValid: false,
      appliedOffer: null,
      discountAmount: 0,
      freeUnitsCount: 0,
      message: `Promo code "${cleanCode}" is invalid or does not exist.`
    };
  }

  // 1. Active Check
  if (!offer.active) {
    return {
      isValid: false,
      appliedOffer: null,
      discountAmount: 0,
      freeUnitsCount: 0,
      message: `Offer "${offer.code}" is currently inactive.`
    };
  }

  // 2. Date Range Check
  const now = new Date();
  if (offer.startDate && new Date(offer.startDate) > now) {
    return {
      isValid: false,
      appliedOffer: null,
      discountAmount: 0,
      freeUnitsCount: 0,
      message: `Offer "${offer.code}" is not yet active (valid from ${new Date(offer.startDate).toLocaleDateString()}).`
    };
  }
  if (offer.endDate && new Date(offer.endDate) < now) {
    return {
      isValid: false,
      appliedOffer: null,
      discountAmount: 0,
      freeUnitsCount: 0,
      message: `Offer "${offer.code}" expired on ${new Date(offer.endDate).toLocaleDateString()}.`
    };
  }

  // 3. Service Eligibility Check
  if (offer.eligibleServiceCodes && offer.eligibleServiceCodes.length > 0) {
    const isEligible = offer.eligibleServiceCodes.some(
      sc => sc.toUpperCase() === service.code.toUpperCase() || sc === service.id
    );
    if (!isEligible) {
      return {
        isValid: false,
        appliedOffer: null,
        discountAmount: 0,
        freeUnitsCount: 0,
        message: `Offer "${offer.code}" is only valid for: ${offer.eligibleServiceCodes.join(', ')} (Selected: ${service.name}).`
      };
    }
  }

  // 4. New Customer Eligibility Check
  if (offer.isNewCustomerOnly) {
    if (user && user.role === 'DOCTOR_LAB') {
      const userCases = db.getAllCases().filter(c => c.customerId === user.id);
      if (userCases.length > 0) {
        return {
          isValid: false,
          appliedOffer: null,
          discountAmount: 0,
          freeUnitsCount: 0,
          message: `Offer "${offer.code}" is exclusively for new customers on their first case submission.`
        };
      }
    }
  }

  // 5. Maximum Customer Usage Check
  if (user && offer.maxUsagePerCustomer > 0) {
    const previousRedemptions = db.getAllCases().filter(
      c => c.customerId === user.id && c.offerCodeApplied?.toUpperCase() === cleanCode
    ).length;
    if (previousRedemptions >= offer.maxUsagePerCustomer) {
      return {
        isValid: false,
        appliedOffer: null,
        discountAmount: 0,
        freeUnitsCount: 0,
        message: `You have reached the maximum allowed usage limit (${offer.maxUsagePerCustomer}) for offer "${offer.code}".`
      };
    }
  }

  // 6. Buy Quantity & Offer Type Calculation
  const buyQtyRequired = Math.max(1, offer.buyQuantityRequired || 1);
  const units = Math.max(1, quantity || 1);
  const unitPrice = service.unitPriceINR;
  const subtotal = unitPrice * units;

  if (offer.offerType === 'BUY_X_GET_Y') {
    if (units < buyQtyRequired) {
      const needed = buyQtyRequired - units;
      return {
        isValid: false,
        appliedOffer: null,
        discountAmount: 0,
        freeUnitsCount: 0,
        message: `Add ${needed} more unit${needed > 1 ? 's' : ''} to qualify for "${offer.title}" (Requires minimum ${buyQtyRequired} units).`
      };
    }
    const freeQty = offer.freeUnitsCount || 1;
    const freeUnitsGiven = Math.min(units, freeQty);
    const discountAmount = freeUnitsGiven * unitPrice;
    return {
      isValid: true,
      appliedOffer: offer,
      discountAmount,
      freeUnitsCount: freeUnitsGiven,
      message: `✓ Applied "${offer.title}": ${freeUnitsGiven} unit(s) FREE (-₹${discountAmount.toLocaleString()})`
    };
  }

  if (offer.offerType === 'FREE_UNITS') {
    if (units < buyQtyRequired) {
      const needed = buyQtyRequired - units;
      return {
        isValid: false,
        appliedOffer: null,
        discountAmount: 0,
        freeUnitsCount: 0,
        message: `Requires a minimum of ${buyQtyRequired} units to apply "${offer.title}".`
      };
    }
    const freeQty = offer.freeUnitsCount || 1;
    const freeUnitsGiven = Math.min(units, freeQty);
    const discountAmount = freeUnitsGiven * unitPrice;
    return {
      isValid: true,
      appliedOffer: offer,
      discountAmount,
      freeUnitsCount: freeUnitsGiven,
      message: `✓ Applied "${offer.title}": ${freeUnitsGiven} unit(s) FREE (-₹${discountAmount.toLocaleString()})`
    };
  }

  if (offer.offerType === 'PERCENTAGE') {
    if (units < buyQtyRequired) {
      const needed = buyQtyRequired - units;
      return {
        isValid: false,
        appliedOffer: null,
        discountAmount: 0,
        freeUnitsCount: 0,
        message: `Requires a minimum of ${buyQtyRequired} units to apply "${offer.title}".`
      };
    }
    const pct = offer.percentageDiscount || 0;
    const discountAmount = Math.round((subtotal * (pct / 100)) * 100) / 100;
    return {
      isValid: true,
      appliedOffer: offer,
      discountAmount,
      freeUnitsCount: 0,
      message: `✓ Applied "${offer.title}": ${pct}% discount (-₹${discountAmount.toLocaleString()})`
    };
  }

  return {
    isValid: false,
    appliedOffer: null,
    discountAmount: 0,
    freeUnitsCount: 0,
    message: `Invalid offer configuration.`
  };
}
