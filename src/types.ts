declare module "*.jpg";

export interface Paper {
  id: string;
  created_at?: string;
  unit_code: string;
  paper_title: string;
  price: number | string;
  file_path: string | null;
  status: string;
  // Compatibility fields for existing preview components
  fileName?: string;
  fileSize?: string;
  year?: string;
  isAvailable?: boolean;
  downloadsCount?: number;
  docId?: string;
  digitizedContent?: any;
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
