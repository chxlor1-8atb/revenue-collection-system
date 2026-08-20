import fs from 'fs';
import path from 'path';

const file = path.resolve('src/lib/schema.ts');
let content = fs.readFileSync(file, 'utf-8');

// system_settings
content = content.replace(
  "houseCustomFieldsSchema: jsonb('house_custom_fields_schema').default('[]'),",
  `houseCustomFieldsSchema: jsonb('house_custom_fields_schema').default('[]'),
  autoBillingDay: integer('auto_billing_day'),
  dueDateDays: integer('due_date_days'),
  autoRemindDays: integer('auto_remind_days'),`
);

// invoices
content = content.replace(
  "amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),",
  `amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: text('type').default('monthly'), // monthly, arrears, custom
  title: text('title'),
  isBroadcasted: boolean('is_broadcasted').default(false),`
);

// Drop unique index to avoid conflict with custom/arrears bills in the same month
// We will handle idempotency manually or via other constraints
content = content.replace(
  /, \(table\) => \{\s*return \{\s*uniqueHouseMonth: uniqueIndex\('unique_house_month'\)\.on\(table\.houseId, table\.monthYear\),\s*\};\s*\}/g,
  ""
);

fs.writeFileSync(file, content);
console.log('Schema updated');
