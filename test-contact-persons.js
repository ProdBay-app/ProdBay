#!/usr/bin/env node

/**
 * Test script to verify the contact persons implementation
 * This script tests the database migration and basic functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContactPersons() {
  console.log('🧪 Testing Contact Persons Implementation...\n');

  try {
    // Test 1: Check if contact_persons column exists
    console.log('1. Testing database schema...');
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, supplier_name, contact_persons')
      .limit(1);

    if (error) {
      console.error('❌ Database schema test failed:', error.message);
      return;
    }

    console.log('✅ Database schema is correct - contact_persons column exists');

    // Test 2: Check if we can insert contact persons
    console.log('\n2. Testing contact persons insertion...');
    
    const testSupplier = {
      supplier_name: 'Test Supplier',
      contact_email: 'test@example.com',
      service_categories: ['Test'],
      contact_persons: [
        {
          name: 'John Doe',
          email: 'john@test.com',
          role: 'Sales Manager',
          phone: '+1-555-0123',
          is_primary: true
        },
        {
          name: 'Jane Smith',
          email: 'jane@test.com',
          role: 'Project Coordinator',
          phone: '+1-555-0124',
          is_primary: false
        }
      ]
    };

    const { data: insertedSupplier, error: insertError } = await supabase
      .from('suppliers')
      .insert(testSupplier)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Contact persons insertion test failed:', insertError.message);
      return;
    }

    console.log('✅ Contact persons insertion successful');
    console.log('   Inserted supplier:', insertedSupplier.supplier_name);
    console.log('   Contact persons count:', insertedSupplier.contact_persons.length);

    // Test 3: Check if we can query contact persons
    console.log('\n3. Testing contact persons query...');
    
    const { data: queriedSupplier, error: queryError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', insertedSupplier.id)
      .single();

    if (queryError) {
      console.error('❌ Contact persons query test failed:', queryError.message);
      return;
    }

    console.log('✅ Contact persons query successful');
    console.log('   Primary contact:', queriedSupplier.contact_persons.find(p => p.is_primary)?.name);

    // Test 4: Check if we can update contact persons
    console.log('\n4. Testing contact persons update...');
    
    const updatedContactPersons = [
      ...queriedSupplier.contact_persons,
      {
        name: 'Bob Wilson',
        email: 'bob@test.com',
        role: 'Technical Lead',
        phone: '+1-555-0125',
        is_primary: false
      }
    ];

    const { data: updatedSupplier, error: updateError } = await supabase
      .from('suppliers')
      .update({ contact_persons: updatedContactPersons })
      .eq('id', insertedSupplier.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Contact persons update test failed:', updateError.message);
      return;
    }

    console.log('✅ Contact persons update successful');
    console.log('   Updated contact persons count:', updatedSupplier.contact_persons.length);

    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', insertedSupplier.id);

    if (deleteError) {
      console.error('⚠️  Failed to clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n🎉 All tests passed! Contact persons implementation is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testContactPersons();
