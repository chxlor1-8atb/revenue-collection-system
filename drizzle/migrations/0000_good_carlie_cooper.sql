CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'collector' NOT NULL,
	"collector_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "collectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"prompt_pay_id" text NOT NULL,
	"telegram_chat_id" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"collector_id" integer NOT NULL,
	"label" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"qr_code_id" integer NOT NULL,
	"collector_id" integer NOT NULL,
	"amount" numeric(12, 2),
	"amount_claimed" numeric(12, 2),
	"slip_image_url" text NOT NULL,
	"slip_ref_id" text,
	"slip_status" text DEFAULT 'pending' NOT NULL,
	"payer_note" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"notified_at" timestamp,
	"verified_by" text,
	CONSTRAINT "transactions_slip_ref_id_unique" UNIQUE("slip_ref_id")
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_collector_id_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."collectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_collector_id_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."collectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_collector_id_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."collectors"("id") ON DELETE no action ON UPDATE no action;