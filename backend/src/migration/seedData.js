import database from '../config/database.js';

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...');
    
    // Check if firm table exists and is empty
    const [existingFirms] = await database.query('SELECT COUNT(*) as count FROM firm');
    
    if (existingFirms[0].count > 0) {
      console.log('⚠️  Database already has data. Skipping seeding.');
      return;
    }
    
    // Insert sample firm
    const [firmResult] = await database.query(
      'INSERT INTO firm (firm_name, gst_no, firm_city, firm_street) VALUES (?, ?, ?, ?)',
      ['Demo Firm', 'GST123456789', 'Mumbai', 'Main Street']
    );
    
    const firmId = firmResult.insertId;
    
    // Insert sample user
    await database.query(
      `INSERT INTO user (fullname, contact_no, email, password_hash, role, firm_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['John Doe', '9876543210', 'john@demo.com', 'hashed_password', 'OWNER', firmId]
    );
    
    // Insert sample customer
    await database.query(
      `INSERT INTO customer (name, firm_name, contact_no, gst_no, city, street, firm_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ABC Suppliers', 'ABC Corp', '9876543211', 'GST987654321', 'Delhi', 'Trade Street', firmId]
    );
    
    console.log('✅ Sample data seeded successfully');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seedData();