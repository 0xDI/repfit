// Script to create a test user via Supabase Admin API
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createTestUser() {
    const testEmail = 'testuser@repfit.local'
    const testPassword = 'TestPassword123!'

    console.log('Creating test user:', testEmail)

    // Create user via Admin API
    const { data: user, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            full_name: 'Test User'
        }
    })

    if (error) {
        console.error('Error creating user:', error.message)

        // If user exists, try to get them
        if (error.message.includes('already')) {
            console.log('User might already exist, checking...')
            const { data: users } = await supabase.auth.admin.listUsers()
            const existingUser = users?.users.find(u => u.email === testEmail)
            if (existingUser) {
                console.log('User already exists:', existingUser.id)
                console.log('\nLogin credentials:')
                console.log('Email:', testEmail)
                console.log('Password:', testPassword)
                return
            }
        }
        return
    }

    console.log('User created successfully!')
    console.log('User ID:', user.user.id)
    console.log('\nLogin credentials:')
    console.log('Email:', testEmail)
    console.log('Password:', testPassword)

    // Check if profile was created
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

    if (profile) {
        console.log('\nProfile created via trigger:')
        console.log(profile)
    } else {
        console.log('\nNote: Profile may not have been created yet')
    }
}

createTestUser()
