import { pgTable, text, boolean, integer, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const examPapers = pgTable('exam_papers', {
  id: uuid('id').defaultRandom().primaryKey(),
  unitName: text('unit_name').notNull(),
  unitCode: text('unit_code').notNull(),
  year: text('year').notNull(),
  price: text('price').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  downloadsCount: integer('downloads_count').default(0).notNull(),
  docId: text('doc_id').notNull(),
  fileName: text('file_name'),
  fileSize: text('file_size'),
  digitizedContent: jsonb('digitized_content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentFirstName: text('student_first_name').notNull(),
  studentSecondName: text('student_second_name').notNull(),
  phone: text('phone').notNull(),
  unitCode: text('unit_code').notNull(),
  unitName: text('unit_name').notNull(),
  price: text('price').notNull(),
  mpesaReceipt: text('mpesa_receipt').notNull(),
  passwordUsed: text('password_used').notNull(),
  status: text('status').notNull(), // 'Completed' | 'Pending' | 'Failed'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  isRead: boolean('is_read').default(false).notNull(),
});

export const affiliatePartners = pgTable('affiliate_partners', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(), // Safaricom M-Pesa for commission payouts
  email: text('email').notNull(),
  university: text('university').notNull(),
  campusCourse: text('campus_course').notNull(),
  referralCode: text('referral_code').notNull().unique(),
  commissionRate: text('commission_rate').default('30%').notNull(),
  totalEarnings: text('total_earnings').default('KSh 0').notNull(),
  totalReferrals: integer('total_referrals').default(0).notNull(),
  status: text('status').default('Active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
