ALTER TABLE "transactions" ADD COLUMN "lock_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_house_month" ON "invoices" USING btree ("house_id","month_year");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_lock_key_unique" UNIQUE("lock_key");