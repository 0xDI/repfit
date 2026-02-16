#!/usr/bin/env node

/**
 * Database Setup Script using Supabase Management API
 * Uses the publishable/secret keys to execute SQL directly
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_REF = 'xypnkpsgujjtxedrdahf';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQL(sql: string) {
    // The Supabase REST API doesn't support raw SQL execution
    // We need to use the postgres connection directly or the Management API

    // Management API endpoint for SQL execution
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`SQL execution failed: ${error}`);
    }

    return response.json();
}

async function main() {
    console.log('🚀 RepFit Database Setup');
    console.log('========================\n');

    if (!SERVICE_ROLE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
        console.log('   Run: source .env.local && npx tsx scripts/setup_db_api.ts');
        process.exit(1);
    }

    const sqlPath = join(process.cwd(), 'MASTER_SETUP.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Read MASTER_SETUP.sql');
    console.log(`📊 File size: ${sql.length} characters\n`);

    try {
        console.log('⏳ Executing SQL...');
        await executeSQL(sql);
        console.log('✅ Database setup complete!');
    } catch (error: any) {
        console.log(`\n⚠️  Direct execution not available: ${error.message}`);
        console.log('\n📋 Alternative: Copy the SQL to Supabase Dashboard');
        console.log(`   URL: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    }
}

main();
