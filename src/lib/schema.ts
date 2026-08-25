import { pgTable, serial, text, boolean, timestamp, integer, numeric, date, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  accountName: text('account_name').notNull(),
  promptPayId: text('prompt_pay_id').notNull(),
  qrCodeImageUrl: text('qr_code_image_url'),
  telegramChatId: text('telegram_chat_id'),
  houseCustomFieldsSchema: jsonb('house_custom_fields_schema').default('[]'),
  autoBillingDay: integer('auto_billing_day'),
  dueDateDays: integer('due_date_days'),
  autoRemindDays: integer('auto_remind_days'),
  receiptBookConfig: jsonb('receipt_book_config').default('{"itemsPerBook": 50, "currentBook": 1, "fiscalYear": "2569"}'),
  lineConfig: jsonb('line_config').default('{"emergencyPhone": "044-631405", "healthDeptPhone": "044-631405", "announcementText": "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา", "isAnnouncementActive": true}'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const feeCategories = pgTable('fee_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  defaultAmount: numeric('default_amount', { precision: 12, scale: 2 }).notNull().default('20.00'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const houses = pgTable('houses', {
  id: serial('id').primaryKey(),
  houseNumber: text('house_number').notNull(), // บ้านเลขที่
  ownerName: text('owner_name').notNull(), // ชื่อเจ้าบ้าน
  zone: text('zone'), // ชุมชน
  moo: text('moo'), // หมู่
  soi: text('soi'), // ซอย
  road: text('road'), // ถนน
  feeCategoryId: integer('fee_category_id').references(() => feeCategories.id), // หมวดหมู่อัตราค่าธรรมเนียม
  defaultBillingAmount: numeric('default_billing_amount', { precision: 12, scale: 2 }), // ยอดจัดเก็บประจำเดือน
  walletBalance: numeric('wallet_balance', { precision: 12, scale: 2 }).default('0'), // ยอดเงินเกิน/ชำระล่วงหน้า
  customFields: jsonb('custom_fields').default('{}'), // เก็บข้อมูล custom fields ในรูปแบบ JSON (key-value)
  lineUserId: text('line_user_id'), // LINE User ID for pushing notifications
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_houses_number').on(table.houseNumber),
  index('idx_houses_zone').on(table.zone),
  index('idx_houses_line_user').on(table.lineUserId),
]);

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),

  amount: numeric('amount', { precision: 12, scale: 2 }),
  amountClaimedByPayer: numeric('amount_claimed', { precision: 12, scale: 2 }),

  slipImageUrl: text('slip_image_url').notNull(),
  slipRefId: text('slip_ref_id').unique(),
  slipStatus: text('slip_status').notNull().default('pending'), // pending, verified, rejected, manual_review

  // Official Municipal Receipt Book Series
  bookNumber: integer('book_number'), // เล่มที่ (เช่น 01)
  receiptNumber: integer('receipt_number'), // เลขที่ (เช่น 01-50)
  fiscalYear: text('fiscal_year'), // ปีงบประมาณ (เช่น 2569)
  receiptCode: text('receipt_code'), // รหัสใบเสร็จกำกับราชการ เช่น "เล่มที่ 01 เลขที่ 05/2569"

  payerNote: text('payer_note'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  notifiedAt: timestamp('notified_at'),
  verifiedBy: text('verified_by'),
  lockKey: text('lock_key').unique(),
  rejectReason: text('reject_reason'),
  lockedBy: text('locked_by'),
  lockedAt: timestamp('locked_at'),
  reconciledAt: timestamp('reconciled_at'), // วันที่กระทบยอดกับธนาคารสำเร็จ
}, (table) => [
  index('idx_transactions_status_paid').on(table.slipStatus, table.paidAt),
  index('idx_transactions_receipt_code').on(table.receiptCode),
]);

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  houseId: integer('house_id').references(() => houses.id).notNull(),
  monthYear: text('month_year').notNull(), // e.g. "2024-01"
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 12, scale: 2 }),
  type: text('type').default('monthly'), // monthly, arrears, custom
  title: text('title'),
  isBroadcasted: boolean('is_broadcasted').default(false),
  status: text('status').notNull().default('unpaid'), // unpaid, pending, paid, pending_advance
  transactionId: integer('transaction_id').references(() => transactions.id), // Link to the payment if any
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_invoices_house_status').on(table.houseId, table.status),
  index('idx_invoices_month_year').on(table.monthYear),
  index('idx_invoices_tx_id').on(table.transactionId),
]);

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('staff'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const lineMessages = pgTable('line_messages', {
  id: serial('id').primaryKey(),
  lineMessageId: text('line_message_id').unique(),
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
}, (table) => [
  index('idx_line_msgs_status').on(table.status),
  index('idx_line_msgs_user').on(table.lineUserId),
]);

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').default('staff'),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, VOID, APPROVE, REJECT, EXPORT, SETTINGS, BROADCAST
  entityType: text('entity_type').notNull(), // HOUSE, INVOICE, TRANSACTION, USER, SETTINGS, BROADCAST, LINE
  entityId: text('entity_id'),
  details: jsonb('details').default('{}'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_audit_action').on(table.action),
  index('idx_audit_entity').on(table.entityType, table.entityId),
  index('idx_audit_created_at').on(table.createdAt),
]);

