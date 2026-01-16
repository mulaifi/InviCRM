import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1768592956964 implements MigrationInterface {
    name = 'InitialSchema1768592956964'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_integrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "access_token" text, "refresh_token" text, "token_expires_at" TIMESTAMP, "external_id" character varying(255), "metadata" jsonb, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_c3de1a91ed82f698dbb15248eb0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ba16fd52c8caabef00b75ddcc1" ON "user_integrations" ("user_id", "provider") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255), "first_name" character varying(100) NOT NULL, "last_name" character varying(100), "role" character varying(20) NOT NULL DEFAULT 'rep', "google_id" character varying(255), "timezone" character varying(50), "avatar_url" character varying(500), "last_login_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_109638590074998bb72a2f2cf0" ON "users" ("tenant_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "slug" character varying(50) NOT NULL, "settings" jsonb, "subscription_tier" character varying(20) NOT NULL DEFAULT 'free', "subscription_expires_at" TIMESTAMP, CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2310ecc5cb8be427097154b18f" ON "tenants" ("slug") `);
        await queryRunner.query(`CREATE TABLE "stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "pipeline_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "position" integer NOT NULL, "probability" integer NOT NULL DEFAULT '0', "type" character varying(20) NOT NULL DEFAULT 'open', "color" character varying(7), CONSTRAINT "PK_16efa0f8f5386328944769b9e6d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_36b1476d5a8c92831da5b0c4f1" ON "stages" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "pipelines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_e38ea171cdfad107c1f3db2c036" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_842def49e3f739e3c9dd786819" ON "pipelines" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "deals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "amount" numeric(15,2), "currency" character varying(3) NOT NULL DEFAULT 'KWD', "probability" integer NOT NULL DEFAULT '0', "expected_close_date" date, "status" character varying(20) NOT NULL DEFAULT 'open', "closed_at" TIMESTAMP, "contact_id" uuid, "company_id" uuid, "pipeline_id" uuid NOT NULL, "stage_id" uuid NOT NULL, "owner_id" uuid NOT NULL, "notes" text, "lost_reason" character varying(500), "custom_fields" jsonb, CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d40aeaababdbc39be4820cd1f5" ON "deals" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9e8ce2b9d84c7fb97105ce7f00" ON "deals" ("pipeline_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_23f5265469e4b4daea988d9146" ON "deals" ("stage_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_39cb9fb7b130a5e5f7c5e29066" ON "deals" ("owner_id") `);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "type" character varying(20) NOT NULL, "direction" character varying(20), "subject" character varying(500) NOT NULL, "body" text, "contact_id" uuid, "deal_id" uuid, "user_id" uuid, "occurred_at" TIMESTAMP NOT NULL, "duration_minutes" integer, "external_id" character varying(255), "thread_id" character varying(255), "source" character varying(50) NOT NULL DEFAULT 'manual', "metadata" jsonb, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d93b88829c6e18be67ebf2e7f1" ON "activities" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_11fdf4277eb8458723eec35e10" ON "activities" ("contact_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_04fa1883f5dc10f9a9661074ae" ON "activities" ("deal_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ca2f7453ecb5ee87fb05f608c" ON "activities" ("occurred_at") `);
        await queryRunner.query(`CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100), "email" character varying(255), "phone" character varying(50), "title" character varying(100), "company_id" uuid, "linkedin" character varying(500), "source" character varying(50) NOT NULL DEFAULT 'manual', "confidence_score" double precision NOT NULL DEFAULT '1', "last_contacted_at" TIMESTAMP, "custom_fields" jsonb, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_71ec7d68cfafa5f3d93c959b80" ON "contacts" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_752866c5247ddd34fd05559537" ON "contacts" ("email") `);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "domain" character varying(255), "website" character varying(255), "industry" character varying(100), "size" character varying(50), "address" character varying(500), "city" character varying(100), "country" character varying(100), "phone" character varying(50), "logo_url" character varying(500), "source" character varying(50) NOT NULL DEFAULT 'manual', "custom_fields" jsonb, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1afe500bd3d442583371738b22" ON "companies" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_89a223b4d883067d909eedd355" ON "companies" ("domain") `);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "title" character varying(500) NOT NULL, "description" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "priority" character varying(20) NOT NULL DEFAULT 'medium', "due_date" TIMESTAMP, "completed_at" TIMESTAMP, "contact_id" uuid, "deal_id" uuid, "assigned_to_id" uuid NOT NULL, "created_by_id" uuid NOT NULL, "reminder_at" TIMESTAMP, "slack_message_ts" character varying(100), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_93edccfc42408754c4b5957105" ON "tasks" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_707cfc415c7c12d38dfc2ec8eb" ON "tasks" ("due_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_9430f12c5a1604833f64595a57" ON "tasks" ("assigned_to_id") `);
        await queryRunner.query(`CREATE TABLE "email_sync_states" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "history_id" character varying(100), "last_sync_at" TIMESTAMP, "initial_import_completed" boolean NOT NULL DEFAULT false, "messages_synced" integer NOT NULL DEFAULT '0', "sync_status" character varying(20) NOT NULL DEFAULT 'pending', "error_message" text, "error_count" integer NOT NULL DEFAULT '0', "last_error_at" TIMESTAMP, CONSTRAINT "PK_f1c5d0e214879ef61ccce52caac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3bf23c522e58788956760644d5" ON "email_sync_states" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "slack_installations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "team_id" character varying(50) NOT NULL, "team_name" character varying(200) NOT NULL, "bot_user_id" character varying(50) NOT NULL, "bot_access_token" text NOT NULL, "installed_by_user_id" uuid, "installed_at" TIMESTAMP NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "scopes" jsonb, CONSTRAINT "PK_a42f0b5616ec82c4ce6e819f39e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b76cc8efa2e79d5039a684eef2" ON "slack_installations" ("tenant_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bb810a3457b1d38c12a30fb493" ON "slack_installations" ("team_id") `);
        await queryRunner.query(`ALTER TABLE "user_integrations" ADD CONSTRAINT "FK_cf28b44f6692a32fd41ebdab48e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stages" ADD CONSTRAINT "FK_ea5edc95a1956539edaa4b7e5e7" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_76e504b6bb116e6cdc2ee6a0cb5" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_eb4869da6d8f7121b269140994d" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_9e8ce2b9d84c7fb97105ce7f007" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_23f5265469e4b4daea988d91465" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deals" ADD CONSTRAINT "FK_39cb9fb7b130a5e5f7c5e290665" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_11fdf4277eb8458723eec35e107" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_04fa1883f5dc10f9a9661074ae0" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_b82f1d8368dd5305ae7e7e664c2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_b53945f3dfe982678bfeb5e1b4f" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_5489b511b5347d806677939151f" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_a14d7d609f64c45c3a054b97ba4" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9430f12c5a1604833f64595a57f" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_0804c9432857e4d333583f5afe1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_sync_states" ADD CONSTRAINT "FK_3bf23c522e58788956760644d58" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_sync_states" DROP CONSTRAINT "FK_3bf23c522e58788956760644d58"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_0804c9432857e4d333583f5afe1"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9430f12c5a1604833f64595a57f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_a14d7d609f64c45c3a054b97ba4"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_5489b511b5347d806677939151f"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_b53945f3dfe982678bfeb5e1b4f"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_b82f1d8368dd5305ae7e7e664c2"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_04fa1883f5dc10f9a9661074ae0"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_11fdf4277eb8458723eec35e107"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_39cb9fb7b130a5e5f7c5e290665"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_23f5265469e4b4daea988d91465"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_9e8ce2b9d84c7fb97105ce7f007"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_eb4869da6d8f7121b269140994d"`);
        await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_76e504b6bb116e6cdc2ee6a0cb5"`);
        await queryRunner.query(`ALTER TABLE "stages" DROP CONSTRAINT "FK_ea5edc95a1956539edaa4b7e5e7"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_109638590074998bb72a2f2cf08"`);
        await queryRunner.query(`ALTER TABLE "user_integrations" DROP CONSTRAINT "FK_cf28b44f6692a32fd41ebdab48e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb810a3457b1d38c12a30fb493"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b76cc8efa2e79d5039a684eef2"`);
        await queryRunner.query(`DROP TABLE "slack_installations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3bf23c522e58788956760644d5"`);
        await queryRunner.query(`DROP TABLE "email_sync_states"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9430f12c5a1604833f64595a57"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_707cfc415c7c12d38dfc2ec8eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_93edccfc42408754c4b5957105"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89a223b4d883067d909eedd355"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1afe500bd3d442583371738b22"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_752866c5247ddd34fd05559537"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71ec7d68cfafa5f3d93c959b80"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ca2f7453ecb5ee87fb05f608c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04fa1883f5dc10f9a9661074ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11fdf4277eb8458723eec35e10"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d93b88829c6e18be67ebf2e7f1"`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39cb9fb7b130a5e5f7c5e29066"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23f5265469e4b4daea988d9146"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e8ce2b9d84c7fb97105ce7f00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d40aeaababdbc39be4820cd1f5"`);
        await queryRunner.query(`DROP TABLE "deals"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_842def49e3f739e3c9dd786819"`);
        await queryRunner.query(`DROP TABLE "pipelines"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36b1476d5a8c92831da5b0c4f1"`);
        await queryRunner.query(`DROP TABLE "stages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2310ecc5cb8be427097154b18f"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_109638590074998bb72a2f2cf0"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba16fd52c8caabef00b75ddcc1"`);
        await queryRunner.query(`DROP TABLE "user_integrations"`);
    }

}
