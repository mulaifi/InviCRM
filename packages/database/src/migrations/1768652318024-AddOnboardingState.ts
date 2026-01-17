import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnboardingState1768652318024 implements MigrationInterface {
    name = 'AddOnboardingState1768652318024'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."onboarding_states_current_step_enum" AS ENUM('gmail', 'calendar', 'slack', 'whatsapp', 'complete')`);
        await queryRunner.query(`CREATE TABLE "onboarding_states" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "tenant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "current_step" "public"."onboarding_states_current_step_enum" NOT NULL DEFAULT 'gmail', "gmail_connected" boolean NOT NULL DEFAULT false, "calendar_connected" boolean NOT NULL DEFAULT false, "slack_connected" boolean NOT NULL DEFAULT false, "whatsapp_prompted" boolean NOT NULL DEFAULT false, "completed_at" TIMESTAMP, "skipped_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_6d6c8e47268bb17679e7c724dfb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_71a04d8c389743c1e6120bb203" ON "onboarding_states" ("tenant_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "onboarding_states" ADD CONSTRAINT "FK_ee2438d1c3313ba5f58d4aeb5d2" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "onboarding_states" ADD CONSTRAINT "FK_25dcf7732f0dd1356abd19fab59" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "onboarding_states" DROP CONSTRAINT "FK_25dcf7732f0dd1356abd19fab59"`);
        await queryRunner.query(`ALTER TABLE "onboarding_states" DROP CONSTRAINT "FK_ee2438d1c3313ba5f58d4aeb5d2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71a04d8c389743c1e6120bb203"`);
        await queryRunner.query(`DROP TABLE "onboarding_states"`);
        await queryRunner.query(`DROP TYPE "public"."onboarding_states_current_step_enum"`);
    }

}
