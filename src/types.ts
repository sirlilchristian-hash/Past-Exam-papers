declare module "*.jpg";

export type PagePricingModel = 'fixed' | 'ranges' | 'custom';

export interface PagePriceRange {
  start_page: number;
  end_page: number;
  price_per_page: number;
}

export interface Paper {
  id: string;
  created_at?: string;
  unit_code: string;
  paper_title: string;
  price: number | string;
  file_path: string | null;
  status: string;
  eligible_pages?: number[]; // Configuration for page-based purchases
  total_pages?: number;
  pricing_model?: PagePricingModel;
  fixed_page_price?: number;
  page_price_ranges?: PagePriceRange[];
  custom_page_prices?: Record<string | number, number>;
  min_page_limit?: number;
  // Compatibility fields for existing preview components
  fileName?: string;
  fileSize?: string;
  year?: string;
  isAvailable?: boolean;
  downloadsCount?: number;
  docId?: string;
  digitizedContent?: any;
  localFile?: File | null;
}

export interface Order {
  id: string;
  customer_id: string;
  paper_id: string;
  amount: number;
  status: string;
  purchased_pages?: number[] | null;
  page_quantity?: number | null;
  unit_price?: number | null;
  total_amount?: number | null;
  total_pages?: number;
  pricing_model?: PagePricingModel;
  created_at?: string;
}

export type ExamPaperAdminItem = Paper;

/**
 * Payload structure prepared for the secure backend upload & database creation service
 */
export interface PaperUploadPayload {
  paperId?: string; // Present when updating an existing paper
  unit_code: string;
  paper_title: string;
  price: string;
  status: string;
  pdfFile: File | null; // Raw PDF file object retained in frontend state only
  existingFilePath?: string | null; // Retained when editing without replacing PDF
  eligible_pages?: number[];
}

/**
 * Field-level validation errors for the paper creation / editing form
 */
export interface PaperFormValidationErrors {
  unit_code?: string;
  paper_title?: string;
  price?: string;
  status?: string;
  pdfFile?: string;
  file_path?: string;
  [key: string]: string | undefined;
}
