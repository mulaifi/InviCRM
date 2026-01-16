/**
 * InviCRM Database Seeder
 * Run with: npm run seed (from packages/database)
 */

import 'reflect-metadata';
import { dataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import {
  tenantData,
  usersData,
  pipelineData,
  stagesData,
  companiesData,
  contactsData,
  dealsData,
  activitiesData,
  tasksData,
} from './seed-data';

const DEFAULT_PASSWORD = 'password123';

async function seed() {
  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('Connected!\n');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Seeding database with development data...\n');

    // Check if tenant already exists
    const existingTenant = await queryRunner.query(
      `SELECT id FROM tenants WHERE id = $1`,
      [tenantData.id]
    );

    if (existingTenant.length > 0) {
      console.log('Seed data already exists. Skipping...');
      console.log('To re-seed, first delete existing data or use --force flag.\n');
      await queryRunner.rollbackTransaction();
      await dataSource.destroy();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 1. Seed Tenant
    console.log('1. Creating tenant...');
    await queryRunner.query(
      `INSERT INTO tenants (id, name, slug, settings, subscription_tier, subscription_expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        tenantData.id,
        tenantData.name,
        tenantData.slug,
        JSON.stringify(tenantData.settings),
        tenantData.subscriptionTier,
        tenantData.subscriptionExpiresAt,
      ]
    );
    console.log(`   Created tenant: ${tenantData.name}`);

    // 2. Seed Users
    console.log('\n2. Creating users...');
    for (const user of usersData) {
      await queryRunner.query(
        `INSERT INTO users (id, tenant_id, email, password, first_name, last_name, role, timezone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          user.id,
          user.tenantId,
          user.email,
          passwordHash,
          user.firstName,
          user.lastName,
          user.role,
          user.timezone,
        ]
      );
      console.log(`   Created user: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    // 3. Seed Pipeline
    console.log('\n3. Creating pipeline...');
    await queryRunner.query(
      `INSERT INTO pipelines (id, tenant_id, name, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [pipelineData.id, pipelineData.tenantId, pipelineData.name, pipelineData.isDefault]
    );
    console.log(`   Created pipeline: ${pipelineData.name}`);

    // 4. Seed Stages
    console.log('\n4. Creating stages...');
    for (const stage of stagesData) {
      await queryRunner.query(
        `INSERT INTO stages (id, tenant_id, pipeline_id, name, position, probability, type, color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          stage.id,
          stage.tenantId,
          stage.pipelineId,
          stage.name,
          stage.position,
          stage.probability,
          stage.type,
          stage.color,
        ]
      );
      console.log(`   Created stage: ${stage.name}`);
    }

    // 5. Seed Companies
    console.log('\n5. Creating companies...');
    for (const company of companiesData) {
      await queryRunner.query(
        `INSERT INTO companies (id, tenant_id, name, domain, website, industry, size, city, country, phone, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          company.id,
          company.tenantId,
          company.name,
          company.domain,
          company.website,
          company.industry,
          company.size,
          company.city,
          company.country,
          company.phone,
          company.source,
        ]
      );
      console.log(`   Created company: ${company.name}`);
    }

    // 6. Seed Contacts
    console.log('\n6. Creating contacts...');
    for (const contact of contactsData) {
      await queryRunner.query(
        `INSERT INTO contacts (id, tenant_id, first_name, last_name, email, phone, title, company_id, source, confidence_score, last_contacted_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          contact.id,
          contact.tenantId,
          contact.firstName,
          contact.lastName,
          contact.email,
          contact.phone,
          contact.title,
          contact.companyId,
          contact.source,
          contact.confidenceScore,
          contact.lastContactedAt,
        ]
      );
      console.log(`   Created contact: ${contact.firstName} ${contact.lastName}`);
    }

    // 7. Seed Deals
    console.log('\n7. Creating deals...');
    for (const deal of dealsData) {
      await queryRunner.query(
        `INSERT INTO deals (id, tenant_id, name, amount, currency, probability, expected_close_date, status, closed_at, contact_id, company_id, pipeline_id, stage_id, owner_id, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
        [
          deal.id,
          deal.tenantId,
          deal.name,
          deal.amount,
          deal.currency,
          deal.probability,
          deal.expectedCloseDate,
          deal.status,
          deal.closedAt || null,
          deal.contactId,
          deal.companyId,
          deal.pipelineId,
          deal.stageId,
          deal.ownerId,
          deal.notes,
        ]
      );
      console.log(`   Created deal: ${deal.name} (${deal.currency} ${deal.amount.toLocaleString()})`);
    }

    // 8. Seed Activities
    console.log('\n8. Creating activities...');
    for (const activity of activitiesData) {
      await queryRunner.query(
        `INSERT INTO activities (id, tenant_id, type, direction, subject, body, contact_id, deal_id, user_id, occurred_at, duration_minutes, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          activity.id,
          activity.tenantId,
          activity.type,
          activity.direction,
          activity.subject,
          activity.body,
          activity.contactId,
          activity.dealId,
          activity.userId,
          activity.occurredAt,
          activity.durationMinutes || null,
          activity.source,
        ]
      );
      console.log(`   Created activity: [${activity.type}] ${activity.subject}`);
    }

    // 9. Seed Tasks
    console.log('\n9. Creating tasks...');
    for (const task of tasksData) {
      await queryRunner.query(
        `INSERT INTO tasks (id, tenant_id, title, description, status, priority, due_date, completed_at, contact_id, deal_id, assigned_to_id, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          task.id,
          task.tenantId,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.dueDate,
          task.completedAt || null,
          task.contactId,
          task.dealId,
          task.assignedToId,
          task.createdById,
        ]
      );
      console.log(`   Created task: ${task.title}`);
    }

    await queryRunner.commitTransaction();
    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================\n');
    console.log('Summary:');
    console.log(`  - 1 Tenant: ${tenantData.name}`);
    console.log(`  - ${usersData.length} Users`);
    console.log(`  - 1 Pipeline with ${stagesData.length} Stages`);
    console.log(`  - ${companiesData.length} Companies`);
    console.log(`  - ${contactsData.length} Contacts`);
    console.log(`  - ${dealsData.length} Deals`);
    console.log(`  - ${activitiesData.length} Activities`);
    console.log(`  - ${tasksData.length} Tasks`);
    console.log('\nTest Credentials:');
    console.log(`  Email: admin@lean-demo.com`);
    console.log(`  Password: ${DEFAULT_PASSWORD}`);
    console.log('');

  } catch (error) {
    console.error('\nError during seeding:', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

// Handle --force flag to delete existing data first
async function seedWithForce() {
  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('Connected!\n');

  console.log('Force mode: Deleting existing seed data...\n');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Delete in reverse order of dependencies
    await queryRunner.query(`DELETE FROM tasks WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM activities WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM deals WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM contacts WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM companies WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM stages WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM pipelines WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM user_integrations WHERE user_id IN (SELECT id FROM users WHERE tenant_id = $1)`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantData.id]);
    await queryRunner.query(`DELETE FROM tenants WHERE id = $1`, [tenantData.id]);

    await queryRunner.commitTransaction();
    console.log('Existing data deleted.\n');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error deleting existing data:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }

  // Now run the normal seed
  await seed();
}

// Main entry point
const args = process.argv.slice(2);
const forceMode = args.includes('--force') || args.includes('-f');

if (forceMode) {
  seedWithForce().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
} else {
  seed().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
