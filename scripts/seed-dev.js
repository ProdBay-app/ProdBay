import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample data for suppliers (additional to basic seed.sql)
const additionalSuppliers = [
  {
    supplier_name: 'Digital Media Solutions',
    contact_email: 'hello@digitalmedia.com',
    service_categories: ['Video', 'Photography', 'Streaming', 'Content']
  },
  {
    supplier_name: 'Furniture & Décor Co',
    contact_email: 'sales@furnituredécor.com',
    service_categories: ['Furniture', 'Décor', 'Rentals', 'Installation']
  },
  {
    supplier_name: 'Security Services Ltd',
    contact_email: 'security@securityservices.com',
    service_categories: ['Security', 'Crowd Control', 'Event Safety']
  },
  {
    supplier_name: 'Green Energy Solutions',
    contact_email: 'info@greenenergy.com',
    service_categories: ['Solar', 'Sustainable', 'Energy', 'Eco-friendly']
  },
  {
    supplier_name: 'Mobile Tech Rentals',
    contact_email: 'rentals@mobiletech.com',
    service_categories: ['Tablets', 'Computers', 'Mobile Devices', 'Tech Rentals']
  }
];

// Sample data for projects
const sampleProjects = [
  {
    project_name: 'Tech Conference 2024',
    client_name: 'Innovation Corp',
    brief_description: 'Annual technology conference with 500+ attendees, featuring keynote speakers, workshops, and networking sessions.',
    physical_parameters: 'Venue: Convention Center, Duration: 3 days, Capacity: 500 people',
    financial_parameters: 75000,
    timeline_deadline: '2024-11-15',
    project_status: 'In Progress'
  },
  {
    project_name: 'Product Launch Event',
    client_name: 'StartupXYZ',
    brief_description: 'Launch event for new mobile app with press coverage, investor presentations, and user demonstrations.',
    physical_parameters: 'Venue: Downtown Hotel, Duration: 1 day, Capacity: 200 people',
    financial_parameters: 45000,
    timeline_deadline: '2024-10-20',
    project_status: 'Quoting'
  },
  {
    project_name: 'Corporate Training Workshop',
    client_name: 'Global Enterprises',
    brief_description: 'Leadership training workshop for 50 senior managers with interactive sessions and team building activities.',
    physical_parameters: 'Venue: Corporate HQ, Duration: 2 days, Capacity: 50 people',
    financial_parameters: 25000,
    timeline_deadline: '2024-12-10',
    project_status: 'New'
  },
  {
    project_name: 'Music Festival',
    client_name: 'Sound Productions',
    brief_description: '3-day outdoor music festival featuring local and national artists with food vendors and art installations.',
    physical_parameters: 'Venue: City Park, Duration: 3 days, Capacity: 2000 people',
    financial_parameters: 150000,
    timeline_deadline: '2024-09-30',
    project_status: 'In Progress'
  },
  {
    project_name: 'Trade Show Exhibition',
    client_name: 'Industry Leaders',
    brief_description: 'B2B trade show with 100+ exhibitors, conference sessions, and networking opportunities.',
    physical_parameters: 'Venue: Exhibition Center, Duration: 4 days, Capacity: 1000 people',
    financial_parameters: 120000,
    timeline_deadline: '2024-11-30',
    project_status: 'Quoting'
  }
];

// Sample data for assets
const sampleAssets = [
  {
    asset_name: 'Main Stage Setup',
    specifications: '40ft x 20ft stage with professional lighting, sound system, and backdrop',
    timeline: '2024-11-14',
    status: 'In Production',
    assigned_supplier_id: null
  },
  {
    asset_name: 'Audio Visual Equipment',
    specifications: 'Projectors, screens, microphones, and sound reinforcement for 500 people',
    timeline: '2024-11-14',
    status: 'Quoting',
    assigned_supplier_id: null
  },
  {
    asset_name: 'Catering Services',
    specifications: 'Breakfast, lunch, and refreshments for 500 attendees over 3 days',
    timeline: '2024-11-15',
    status: 'Approved',
    assigned_supplier_id: null
  },
  {
    asset_name: 'Marketing Materials',
    specifications: 'Banners, flyers, digital ads, and social media campaign',
    timeline: '2024-11-01',
    status: 'Delivered',
    assigned_supplier_id: null
  },
  {
    asset_name: 'Registration System',
    specifications: 'Online registration platform with check-in kiosks and name badges',
    timeline: '2024-11-10',
    status: 'In Production',
    assigned_supplier_id: null
  }
];

// Sample data for quotes
const sampleQuotes = [
  {
    supplier_id: null,
    asset_id: null,
    cost: 8500,
    notes_capacity: 'Full-service stage setup with professional crew. Available for the entire event duration.',
    status: 'Submitted'
  },
  {
    supplier_id: null,
    asset_id: null,
    cost: 12000,
    notes_capacity: 'Premium AV package with backup equipment. Can accommodate last-minute changes.',
    status: 'Submitted'
  },
  {
    supplier_id: null,
    asset_id: null,
    cost: 18000,
    notes_capacity: 'Gourmet catering with dietary accommodations. Can scale up or down based on final numbers.',
    status: 'Submitted'
  },
  {
    supplier_id: null,
    asset_id: null,
    cost: 4500,
    notes_capacity: 'Complete marketing package including social media management and analytics.',
    status: 'Submitted'
  },
  {
    supplier_id: null,
    asset_id: null,
    cost: 3200,
    notes_capacity: 'Custom registration system with mobile app integration and real-time analytics.',
    status: 'Submitted'
  }
];

async function seedDevelopmentData() {
  try {
    console.log('🌱 Starting development data seeding...\n');

    // Step 1: Insert additional suppliers
    console.log('📦 Inserting additional suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .insert(additionalSuppliers)
      .select();

    if (suppliersError) {
      console.error('❌ Error inserting suppliers:', suppliersError);
      return;
    }
    console.log(`✅ Inserted ${suppliers.length} additional suppliers\n`);

    // Step 2: Insert projects
    console.log('📋 Inserting projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert(sampleProjects)
      .select();

    if (projectsError) {
      console.error('❌ Error inserting projects:', projectsError);
      return;
    }
    console.log(`✅ Inserted ${projects.length} projects\n`);

    // Step 3: Insert assets (linked to projects)
    console.log('🔧 Inserting assets...');
    const assetsWithProjectIds = sampleAssets.map((asset, index) => ({
      ...asset,
      project_id: projects[index % projects.length].id
    }));

    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .insert(assetsWithProjectIds)
      .select();

    if (assetsError) {
      console.error('❌ Error inserting assets:', assetsError);
      return;
    }
    console.log(`✅ Inserted ${assets.length} assets\n`);

    // Step 4: Insert quotes (linked to suppliers and assets)
    console.log('💰 Inserting quotes...');
    const quotesWithIds = sampleQuotes.map((quote, index) => ({
      ...quote,
      supplier_id: suppliers[index % suppliers.length].id,
      asset_id: assets[index % assets.length].id
    }));

    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .insert(quotesWithIds)
      .select();

    if (quotesError) {
      console.error('❌ Error inserting quotes:', quotesError);
      return;
    }
    console.log(`✅ Inserted ${quotes.length} quotes\n`);

    // Step 5: Display summary
    console.log('📊 Development Data Seeding Summary:');
    console.log(`   • Additional Suppliers: ${suppliers.length}`);
    console.log(`   • Projects: ${projects.length}`);
    console.log(`   • Assets: ${assets.length}`);
    console.log(`   • Quotes: ${quotes.length}`);
    console.log('\n🎉 Development data seeding completed successfully!');
    console.log('\n💡 You can now test your app with realistic data.');
    console.log('   • Open Supabase Studio: http://127.0.0.1:54323');
    console.log('   • Test your web app: http://localhost:5173');

  } catch (error) {
    console.error('❌ Development data seeding failed:', error);
  }
}

seedDevelopmentData();
