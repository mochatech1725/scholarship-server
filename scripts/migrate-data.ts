#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { initKnex } from '../src/config/knex.config.js';
import { User } from '../src/types/user.types.js';
import { IApplication } from '../src/types/application.types.js';
import { Recommender } from '../src/types/recommender.types.js';

interface MigrationConfig {
  secretArn: string;
  dataDir: string;
  dryRun?: boolean;
}

interface MigrationResult {
  table: string;
  recordsProcessed: number;
  recordsInserted: number;
  errors: string[];
}

class DataMigrator {
  private knex: any;
  private config: MigrationConfig;
  private results: MigrationResult[] = [];

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('🔌 Initializing Knex connection...');
    this.knex = await initKnex(this.config.secretArn);
    console.log('✅ Knex connection established');
  }

  async migrateAll(): Promise<void> {
    console.log('🚀 Starting data migration...');
    
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be inserted');
    }

    await this.migrateUsers();
    await this.migrateRecommenders();
    await this.migrateApplications();
    
    this.printResults();
  }

  private async migrateUsers(): Promise<void> {
    const result: MigrationResult = {
      table: 'users',
      recordsProcessed: 0,
      recordsInserted: 0,
      errors: []
    };

    try {
      const filePath = path.join(this.config.dataDir, 'users.json');
      if (!fs.existsSync(filePath)) {
        console.log('⚠️  users.json not found, skipping users migration');
        return;
      }

      const usersData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result.recordsProcessed = usersData.length;

      console.log(`📊 Processing ${usersData.length} users...`);

      for (const userData of usersData) {
        try {
          const user: Partial<User> = {
            auth_user_id: userData.userId,
            first_name: userData.firstName,
            last_name: userData.lastName,
            email_address: userData.emailAddress,
            phone_number: userData.phoneNumber,
            created_at: new Date(userData.createdAt || Date.now()),
            updated_at: new Date(userData.updatedAt || Date.now())
          };

          if (!this.config.dryRun) {
            const [savedUser] = await this.knex('users').insert(user).returning('*');
            
            // If profile data exists, migrate search preferences
            if (userData.profile?.userPreferences?.searchPreferences) {
              const searchPrefs = userData.profile.userPreferences.searchPreferences;
              const searchPreferencesData = {
                user_id: savedUser.user_id,
                target_type: searchPrefs.targetType,
                subject_areas: searchPrefs.subjectAreas ? JSON.stringify(searchPrefs.subjectAreas) : undefined,
                gender: searchPrefs.gender,
                ethnicity: searchPrefs.ethnicity,
                academic_gpa: searchPrefs.academicGPA,
                essay_required: searchPrefs.essayRequired,
                recommendation_required: searchPrefs.recommendationRequired,
                academic_level: searchPrefs.academicLevel,
                created_at: new Date(userData.createdAt || Date.now()),
                updated_at: new Date(userData.updatedAt || Date.now())
              };

              await this.knex('user_search_preferences').insert(searchPreferencesData);
            }
          }
          result.recordsInserted++;
        } catch (error) {
          const errorMsg = `Error processing user ${userData.userId}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate users: ${error}`);
      console.error('❌ Error migrating users:', error);
    }

    this.results.push(result);
  }

  private async migrateRecommenders(): Promise<void> {
    const result: MigrationResult = {
      table: 'recommenders',
      recordsProcessed: 0,
      recordsInserted: 0,
      errors: []
    };

    try {
      const filePath = path.join(this.config.dataDir, 'recommenders.json');
      if (!fs.existsSync(filePath)) {
        console.log('⚠️  recommenders.json not found, skipping recommenders migration');
        return;
      }

      const recommendersData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result.recordsProcessed = recommendersData.length;

      console.log(`📊 Processing ${recommendersData.length} recommenders...`);

      for (const recommenderData of recommendersData) {
        try {
          const recommender: Partial<Recommender> = {
            student_id: recommenderData.studentId,
            first_name: recommenderData.firstName,
            last_name: recommenderData.lastName,
            email_address: recommenderData.emailAddress || recommenderData.email,
            relationship: recommenderData.relationship,
            phone_number: recommenderData.phoneNumber || recommenderData.phone,
            created_at: new Date(recommenderData.createdAt || Date.now()),
            updated_at: new Date(recommenderData.updatedAt || Date.now())
          };

          if (!this.config.dryRun) {
            await this.knex('recommenders').insert(recommender);
          }
          result.recordsInserted++;
        } catch (error) {
          const errorMsg = `Error processing recommender ${recommenderData.id}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate recommenders: ${error}`);
      console.error('❌ Error migrating recommenders:', error);
    }

    this.results.push(result);
  }

  private async migrateApplications(): Promise<void> {
    const result: MigrationResult = {
      table: 'applications',
      recordsProcessed: 0,
      recordsInserted: 0,
      errors: []
    };

    try {
      const filePath = path.join(this.config.dataDir, 'applications.json');
      if (!fs.existsSync(filePath)) {
        console.log('⚠️  applications.json not found, skipping applications migration');
        return;
      }

      const applicationsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      result.recordsProcessed = applicationsData.length;

      console.log(`📊 Processing ${applicationsData.length} applications...`);

      for (const applicationData of applicationsData) {
        try {
          const application: Partial<IApplication> = {
            student_id: applicationData.studentId,
            scholarship_name: applicationData.scholarshipName,
            target_type: applicationData.targetType,
            company: applicationData.company,
            company_website: applicationData.companyWebsite,
            platform: applicationData.platform,
            application_link: applicationData.applicationLink,
            theme: applicationData.theme,
            amount: applicationData.amount,
            requirements: applicationData.requirements,
            renewable: applicationData.renewable,
            renewable_terms: applicationData.renewableTerms,
            document_info_link: applicationData.documentInfoLink,
            current_action: applicationData.currentAction,
            status: this.mapApplicationStatus(applicationData.status),
            submission_date: applicationData.submissionDate ? new Date(applicationData.submissionDate) : undefined,
            open_date: new Date(applicationData.openDate || Date.now()),
            due_date: new Date(applicationData.dueDate || Date.now()),
            created_at: new Date(applicationData.createdAt || Date.now()),
            updated_at: new Date(applicationData.updatedAt || Date.now())
          };

          if (!this.config.dryRun) {
            await this.knex('applications').insert(application);
          }
          result.recordsInserted++;
        } catch (error) {
          const errorMsg = `Error processing application ${applicationData.id}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate applications: ${error}`);
      console.error('❌ Error migrating applications:', error);
    }

    this.results.push(result);
  }

  private mapApplicationStatus(oldStatus: string): IApplication['status'] {
    const statusMap: Record<string, IApplication['status']> = {
      'Not Started': 'Not Started',
      'In Progress': 'In Progress',
      'Submitted': 'Submitted',
      'Under Review': 'Submitted', // Map to Submitted since Under Review is not in the enum
      'Accepted': 'Awarded',
      'Rejected': 'Not Awarded'
    };
    return statusMap[oldStatus] || 'Not Started';
  }

  private printResults(): void {
    console.log('\n📋 Migration Results:');
    console.log('====================');
    
    for (const result of this.results) {
      console.log(`\n${result.table.toUpperCase()}:`);
      console.log(`  Processed: ${result.recordsProcessed}`);
      console.log(`  Inserted: ${result.recordsInserted}`);
      
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        result.errors.slice(0, 5).forEach(error => {
          console.log(`    - ${error}`);
        });
        if (result.errors.length > 5) {
          console.log(`    ... and ${result.errors.length - 5} more errors`);
        }
      }
    }
  }

  async close(): Promise<void> {
    if (this.knex) {
      await this.knex.destroy();
      console.log('🔌 Knex connection closed');
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const dataDir = args.find(arg => arg.startsWith('--data-dir='))?.split('=')[1] || './data';
  const secretArn = args.find(arg => arg.startsWith('--secret-arn='))?.split('=')[1] || 'arn:aws:secretsmanager:us-east-1:703290033396:secret:scholarships-dev-jDj86a';

  const config: MigrationConfig = {
    secretArn,
    dataDir,
    dryRun
  };

  console.log('🎯 Data Migration Tool');
  console.log('=====================');
  console.log(`Data Directory: ${config.dataDir}`);
  console.log(`Secret ARN: ${config.secretArn}`);
  console.log(`Dry Run: ${config.dryRun ? 'Yes' : 'No'}`);

  const migrator = new DataMigrator(config);

  try {
    await migrator.initialize();
    await migrator.migrateAll();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { DataMigrator }; 