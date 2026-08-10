ALTER TABLE "line_messages" ADD COLUMN "amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "line_messages" ADD COLUMN "sender_name" text;--> statement-breakpoint
ALTER TABLE "line_messages" ADD COLUMN "is_verified" boolean DEFAULT false;