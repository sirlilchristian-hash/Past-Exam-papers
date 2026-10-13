export type PagePricingModel = 'fixed' | 'ranges' | 'custom';

export interface PagePriceRange {
  start_page: number;
  end_page: number;
  price_per_page: number;
}

export interface ItemizedPagePrice {
  page: number;
  price: number;
  rule: string;
}

export interface PricingCalculationResult {
  totalAmount: number;
  pricingModel: PagePricingModel;
  breakdown: string;
  unitPriceSummary: string;
  itemizedDetails: ItemizedPagePrice[];
  isValid: boolean;
  validationError?: string;
}

/**
 * Authoritative Selected-Pages Pricing Calculator
 * Computes price based on the paper's configured pricing model:
 * 1. Fixed price per page
 * 2. Administrator-defined price ranges (e.g. pages 1–5 at KSh 8, 6–10 at KSh 5)
 * 3. Administrator-defined custom page pricing (individual price per page)
 */
export function calculateAuthoritativePagesPrice(
  paper: {
    price?: number | string;
    eligible_pages?: number[] | null;
    pricing_model?: PagePricingModel | string;
    fixed_page_price?: number;
    page_price_ranges?: PagePriceRange[];
    custom_page_prices?: Record<string | number, number>;
  },
  selectedPages: number[],
  minPagesRequired: number = 6
): PricingCalculationResult {
  const rawEligible = Array.isArray(paper.eligible_pages) ? paper.eligible_pages : [];
  const eligible = rawEligible.length >= minPagesRequired ? rawEligible : Array.from({ length: 12 }, (_, i) => i + 1);
  const normalizedPages = Array.from(new Set(selectedPages.map((p) => Number(p))))
    .filter((p) => !isNaN(p) && p > 0)
    .sort((a, b) => a - b);

  // Validate eligible pages
  const ineligiblePages = normalizedPages.filter((p) => !eligible.includes(p));
  if (ineligiblePages.length > 0) {
    return {
      totalAmount: 0,
      pricingModel: 'fixed',
      breakdown: `Pages [${ineligiblePages.join(', ')}] are not eligible for purchase.`,
      unitPriceSummary: 'Invalid pages',
      itemizedDetails: [],
      isValid: false,
      validationError: `Pages [${ineligiblePages.join(', ')}] are not in the paper's eligible page list.`,
    };
  }

  // Validate minimum page count if paper has at least minPagesRequired eligible pages
  if (eligible.length >= minPagesRequired && normalizedPages.length < minPagesRequired) {
    return {
      totalAmount: 0,
      pricingModel: 'fixed',
      breakdown: `Minimum of ${minPagesRequired} pages required (currently selected: ${normalizedPages.length}).`,
      unitPriceSummary: `Minimum ${minPagesRequired} pages`,
      itemizedDetails: [],
      isValid: false,
      validationError: `Please select at least ${minPagesRequired} pages to proceed with page-based purchase.`,
    };
  }

  if (normalizedPages.length === 0) {
    return {
      totalAmount: 0,
      pricingModel: 'fixed',
      breakdown: 'No pages selected.',
      unitPriceSummary: 'Select pages to see price',
      itemizedDetails: [],
      isValid: false,
      validationError: 'Please select at least one eligible page.',
    };
  }

  const model: PagePricingModel =
    paper.pricing_model === 'ranges'
      ? 'ranges'
      : paper.pricing_model === 'custom'
      ? 'custom'
      : 'fixed';

  const defaultFixedRate = Number(paper.fixed_page_price) || 5;

  // --- MODEL 1: FIXED PRICE PER PAGE ---
  if (model === 'fixed') {
    const unitPrice = defaultFixedRate;
    const totalAmount = normalizedPages.length * unitPrice;
    const itemizedDetails: ItemizedPagePrice[] = normalizedPages.map((p) => ({
      page: p,
      price: unitPrice,
      rule: `Fixed KSh ${unitPrice}/page`,
    }));

    return {
      totalAmount,
      pricingModel: 'fixed',
      breakdown: `${normalizedPages.length} pages × KSh ${unitPrice} = KSh ${totalAmount}`,
      unitPriceSummary: `KSh ${unitPrice} per page`,
      itemizedDetails,
      isValid: true,
    };
  }

  // --- MODEL 2: PRICE RANGES ---
  if (model === 'ranges') {
    const ranges: PagePriceRange[] = Array.isArray(paper.page_price_ranges)
      ? paper.page_price_ranges
      : [];

    const itemizedDetails: ItemizedPagePrice[] = [];
    let totalAmount = 0;
    const rangeCounts = new Map<string, { count: number; unitPrice: number; subtotal: number }>();

    for (const page of normalizedPages) {
      const matchedRange = ranges.find(
        (r) => page >= Number(r.start_page) && page <= Number(r.end_page)
      );

      const price = matchedRange ? Number(matchedRange.price_per_page) : defaultFixedRate;
      const ruleName = matchedRange
        ? `Pages ${matchedRange.start_page}–${matchedRange.end_page}`
        : 'Default Rate';

      totalAmount += price;
      itemizedDetails.push({ page, price, rule: ruleName });

      const current = rangeCounts.get(ruleName) || { count: 0, unitPrice: price, subtotal: 0 };
      current.count += 1;
      current.subtotal += price;
      rangeCounts.set(ruleName, current);
    }

    const breakdownParts: string[] = [];
    rangeCounts.forEach((info, label) => {
      breakdownParts.push(`${info.count}p in ${label} (@ KSh ${info.unitPrice}) = KSh ${info.subtotal}`);
    });

    return {
      totalAmount,
      pricingModel: 'ranges',
      breakdown: `${breakdownParts.join(' + ')} = KSh ${totalAmount} total`,
      unitPriceSummary: 'Tiered price ranges',
      itemizedDetails,
      isValid: true,
    };
  }

  // --- MODEL 3: CUSTOM PAGE PRICING ---
  const customMap = paper.custom_page_prices || {};
  let totalAmount = 0;
  const itemizedDetails: ItemizedPagePrice[] = [];

  for (const page of normalizedPages) {
    const customRate = customMap[page] ?? customMap[String(page)];
    const price = typeof customRate === 'number' && customRate > 0 ? customRate : defaultFixedRate;
    totalAmount += price;
    itemizedDetails.push({
      page,
      price,
      rule: customRate !== undefined ? `Custom (KSh ${price})` : `Default (KSh ${price})`,
    });
  }

  return {
    totalAmount,
    pricingModel: 'custom',
    breakdown: `Custom page rates: ${normalizedPages.length} pages selected = KSh ${totalAmount}`,
    unitPriceSummary: 'Custom per-page pricing',
    itemizedDetails,
    isValid: true,
  };
}
