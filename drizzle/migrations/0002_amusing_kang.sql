CREATE TABLE "line_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"line_user_id" text NOT NULL,
	"type" text NOT NULL,
	"image_url" text,
	"house_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "line_messages" ADD CONSTRAINT "line_messages_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;