export type { Paper } from '../../types';

export interface PaperFormValidationErrors {
  unit_code?: string;
  paper_title?: string;
  price?: string;
  pdfFile?: string;
}

export type AdminSection =
  | 'dashboard'
  | 'activate_code'
  | 'orders'
  | 'payments'
  | 'papers'
  | 'paper_sellers'
  | 'customers'
  | 'document_access'
  | 'device_requests'
  | 'admin_users'
  | 'add_admin'
  | 'settings'
  | 'system_status';

export interface TransactionRecord {
  id: string;
  studentFirstName: string;
  studentSecondName: string;
  phone: string;
  unit_code?: string;
  unitCode?: string;
  paper_title?: string;
  unitName?: string;
  price: string;
  mpesaReceipt: string;
  passwordUsed?: string;
  status: 'Completed' | 'Pending' | 'Failed' | string;
  timestamp: string;
}

export interface DeviceRequest {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  current_devices: number;
  device_limit: number;
  Orders?: {
    customers: { first_name: string; second_name: string; phone?: string } | null;
    Papers: { paper_title: string; unit_code: string } | null;
  };
}

export interface PendingActivationOrder {
  id: string;
  customer_id: string;
  paper_id: string;
  amount: number;
  status: string;
  created_at: string;
  customers?: {
    first_name: string;
    second_name: string;
    phone: string;
  };
  payments?: Array<{
    id: string;
    mpesa_receipt: string;
    phone: string;
    status: string;
    created_at: string;
  }>;
  Papers?: {
    id?: string;
    paper_title: string;
    unit_code: string;
  };
}

export interface ActivationResult {
  studentFirstName: string;
  studentSecondName: string;
  studentEmail: string;
  paperTitle: string;
  unitCode: string;
  amount: number;
  mpesaReceipt: string;
  orderId: string;
  activationTimestamp: string;
  openDocumentUrl: string;
  documentAccessStatus: string;
  receiptGenerationStatus: string;
  emailStatus: 'EMAIL SENT' | 'EMAIL FAILED' | 'EMAIL NOT CONFIGURED';
  emailError?: string;
  paymentStatus: string;
  alreadyActivated?: boolean;
}

export interface CustomerSummary {
  id: string;
  fullName: string;
  phoneOrEmail: string;
  ordersCount: number;
  totalSpent: number;
  lastPurchaseDate: string;
  lastPaperTitle?: string;
}

export interface AffiliateRecord {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  university: string;
  campusCourse?: string;
  unitsDescription?: string;
  paperCount?: string;
  academicYears?: string;
  linkedInUrl?: string;
  referralCode?: string;
  status: string;
  created_at?: string;
}

export interface AdminUserRecord {
  id: string;
  account_id: string;
  role: string;
  status: string;
  created_at: string;
}
