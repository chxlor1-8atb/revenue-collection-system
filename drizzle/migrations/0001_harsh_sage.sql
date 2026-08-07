CREATE TABLE "houses" (
	"id" serial PRIMARY KEY NOT NULL,
	"house_number" text NOT NULL,
	"owner_name" text NOT NULL,
	"zone" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "houses_house_number_unique" UNIQUE("house_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"house_id" integer NOT NULL,
	"month_year" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"transaction_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;