import { pgTable, serial, text, boolean, timestamp, integer, numeric } from 'drizzle-orm/pg-core';

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

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  qrCodeId: integer('qr_code_id').references(() => qrCodes.id).notNull(),
  collectorId: integer('collector_id').references(() => collectors.id).notNull(),

  amount: numeric('amount', { precision: 12, scale: 2 }),
  amountClaimedByPayer: numeric('amount_claimed', { precision: 12, scale: 2 }),

  slipImageUrl: text('slip_image_url').notNull(),
  slipRefId: text('slip_ref_id').unique(),
  slipStatus: text('slip_status').notNull().default('pending'),

  payerNote: text('payer_note'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  notifiedAt: timestamp('notified_at'),
  verifiedBy: text('verified_by'),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('collector'),
  collectorId: integer('collector_id').references(() => collectors.id),
  createdAt: timestamp('created_at').defaultNow(),
});
