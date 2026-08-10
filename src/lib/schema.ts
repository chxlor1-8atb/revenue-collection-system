import { pgTable, serial, text, boolean, timestamp, integer, numeric, date } from 'drizzle-orm/pg-core';

export const collectors = pgTable('collectors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  promptPayId: text('prompt_pay_id').notNull(),
  telegramChatId: text('telegram_chat_id'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const qrCodes = pgTable('qr_codes', {
  id: serial('id').primaryKey(),
  collectorId: integer('collector_id').references(() => collectors.id).notNull(),
  label: text('label'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const houses = pgTable('houses', {
  id: serial('id').primaryKey(),
  houseNumber: text('house_number').notNull().unique(), // บ้านเลขที่
  ownerName: text('owner_name').notNull(), // ชื่อเจ้าบ้าน
  zone: text('zone'), // ชุมชน/หมู่
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  qrCodeId: integer('qr_code_id').references(() => qrCodes.id).notNull(),
  collectorId: integer('collector_id').references(() => collectors.id).notNull(),

  amount: numeric('amount', { precision: 12, scale: 2 }),
  amountClaimedByPayer: numeric('amount_claimed', { precision: 12, scale: 2 }),

  slipImageUrl: text('slip_image_url').notNull(),
  slipRefId: text('slip_ref_id').unique(),
  slipStatus: text('slip_status').notNull().default('pending'), // pending, verified, rejected, manual_review

  payerNote: text('payer_note'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  notifiedAt: timestamp('notified_at'),
  verifiedBy: text('verified_by'),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  houseId: integer('house_id').references(() => houses.id).notNull(),
  monthYear: text('month_year').notNull(), // e.g. "2024-01"
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('unpaid'), // unpaid, pending, paid
  transactionId: integer('transaction_id').references(() => transactions.id), // Link to the payment if any
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('collector'),
  collectorId: integer('collector_id').references(() => collectors.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const lineMessages = pgTable('line_messages', {
  id: serial('id').primaryKey(),
  lineUserId: text('line_user_id').notNull(),
  type: text('type').notNull(), // 'image' or 'text'
  imageUrl: text('image_url'),
  houseNumber: text('house_number'),
  status: text('status').notNull().default('pending'), // 'pending', 'processed', 'rejected'
  transactionId: integer('transaction_id').references(() => transactions.id),
  createdAt: timestamp('created_at').defaultNow(),
});

