import { pgTable, serial, text, boolean, timestamp, integer, numeric, date, uniqueIndex } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  accountName: text('account_name').notNull(),
  promptPayId: text('prompt_pay_id').notNull(),
  qrCodeImageUrl: text('qr_code_image_url'),
  telegramChatId: text('telegram_chat_id'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const houses = pgTable('houses', {
  id: serial('id').primaryKey(),
  houseNumber: text('house_number').notNull(), // บ้านเลขที่
  ownerName: text('owner_name').notNull(), // ชื่อเจ้าบ้าน
  zone: text('zone'), // ชุมชน/หมู่
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),

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
  lockKey: text('lock_key').unique(),
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
}, (table) => {
  return {
    uniqueHouseMonth: uniqueIndex('unique_house_month').on(table.houseId, table.monthYear),
  };
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('staff'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const lineMessages = pgTable('line_messages', {
  id: serial('id').primaryKey(),
  lineUserId: text('line_user_id').notNull(),
  type: text('type').notNull(), // 'image' or 'text'
  imageUrl: text('image_url'),
  houseNumber: text('house_number'),
  
  // Slip2Go verification data
  amount: numeric('amount', { precision: 12, scale: 2 }),
  senderName: text('sender_name'),
  isVerified: boolean('is_verified').default(false),
  
  status: text('status').notNull().default('pending'), // 'pending', 'processed', 'rejected', 'verified_auto'
  transactionId: integer('transaction_id').references(() => transactions.id),
  createdAt: timestamp('created_at').defaultNow(),
});

