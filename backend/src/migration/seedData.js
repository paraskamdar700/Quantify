import database from '../config/database.js';
import bcrypt from 'bcryptjs';

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...');
    
    // Check if firm table exists and is empty
    const [existingFirms] = await database.query('SELECT COUNT(*) as count FROM firm');
    
    if (existingFirms.count > 0) {
      console.log('⚠️  Database already has data. Skipping seeding.');
      return;
    }
    
    // Start transaction for data consistency
    await database.query('START TRANSACTION');
    
    try {
      // 1. Insert sample firm
      const firmResult = await database.query(
        'INSERT INTO firm (firm_name, gst_no, firm_city, firm_street) VALUES (?, ?, ?, ?)',
        ['Demo Traders', 'GST123456789012', 'Mumbai', '123 Main Street']
      );
      
      const firmId = firmResult.insertId;
      console.log(`✅ Firm created with ID: ${firmId}`);
      
      // 2. Hash password for user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // 3. Insert sample owner user
      const userResult = await database.query(
        `INSERT INTO user (fullname, contact_no, email, password_hash, role, firm_id, bio) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'Rajesh Kumar', 
          '9876543210', 
          'rajesh@demotraders.com', 
          hashedPassword, 
          'OWNER', 
          firmId,
          'Founder and owner of Demo Traders'
        ]
      );
      
      const ownerUserId = userResult.insertId;
      console.log(`✅ Owner user created with ID: ${ownerUserId}`);
      
      // 4. Insert sample admin user
      const adminResult = await database.query(
        `INSERT INTO user (fullname, contact_no, email, password_hash, role, firm_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Priya Sharma', 
          '9876543211', 
          'priya@demotraders.com', 
          await bcrypt.hash('admin123', 10), 
          'ADMIN', 
          firmId
        ]
      );
      
      const adminUserId = adminResult.insertId;
      
      // 5. Insert sample staff user
      const staffResult = await database.query(
        `INSERT INTO user (fullname, contact_no, email, password_hash, role, firm_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Amit Patel', 
          '9876543212', 
          'amit@demotraders.com', 
          await bcrypt.hash('staff123', 10), 
          'STAFF', 
          firmId
        ]
      );
      
      const staffUserId = staffResult.insertId;
      console.log(`✅ Users created: Owner, Admin, Staff`);
      
      // 6. Insert sample customers
      await database.query(
        `INSERT INTO customer (fullname, firm_name, contact_no, gst_no, city, street, firm_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'ABC Suppliers', 
          'ABC Corporation', 
          '9876543220', 
          'GST987654321012', 
          'Delhi', 
          'Trade Street', 
          firmId
        ]
      );
      
      await database.query(
        `INSERT INTO customer (fullname, firm_name, contact_no, gst_no, city, street, firm_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'XYZ Enterprises', 
          'XYZ Ltd', 
          '9876543221', 
          'GST987654321013', 
          'Bangalore', 
          'Industrial Area', 
          firmId
        ]
      );
      
      console.log(`✅ Customers created`);
      
      // 7. Insert sample categories - FIXED THE ERROR HERE
      await database.query(
        `INSERT INTO category (category_name, description, firm_id, created_by) 
         VALUES (?, ?, ?, ?)`,
        ['Electronics', 'Electronic items and gadgets', firmId, ownerUserId]
      );
      
      await database.query(
        `INSERT INTO category (category_name, description, firm_id, created_by) 
         VALUES (?, ?, ?, ?)`,
        ['Clothing', 'Apparel and fashion items', firmId, adminUserId]
      );
      
      await database.query(
        `INSERT INTO category (category_name, description, firm_id, created_by) 
         VALUES (?, ?, ?, ?)`, // CHANGED: Removed extra parameter
        ['Groceries', 'Food and daily essentials', firmId, staffUserId]
      );
      
      console.log(`✅ Categories created`);
      
      // 8. Insert sample stock items
      const categories = await database.query('SELECT id, category_name FROM category WHERE firm_id = ?', [firmId]);
      
      const electronicsCat = categories.find(c => c.category_name === 'Electronics');
      const clothingCat = categories.find(c => c.category_name === 'Clothing');
      const groceriesCat = categories.find(c => c.category_name === 'Groceries');
      
      // Electronics stock
      await database.query(
        `INSERT INTO stock (stock_name, sku_code, unit, quantity_available, buy_price, low_unit_threshold, weight_per_unit, weight_unit, firm_id, category_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Smartphone X1', 
          'SKU-ELEC-001', 
          'pcs', 
          50.00, 
          15000.00, 
          5.00, 
          0.200, 
          'kg', 
          firmId, 
          electronicsCat.id
        ]
      );
      
      await database.query(
        `INSERT INTO stock (stock_name, sku_code, unit, quantity_available, buy_price, low_unit_threshold, weight_per_unit, weight_unit, firm_id, category_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Wireless Headphones', 
          'SKU-ELEC-002', 
          'pcs', 
          100.00, 
          2500.00, 
          10.00, 
          0.300, 
          'kg', 
          firmId, 
          electronicsCat.id
        ]
      );
      
      // Clothing stock
      await database.query(
        `INSERT INTO stock (stock_name, sku_code, unit, quantity_available, buy_price, low_unit_threshold, weight_per_unit, weight_unit, firm_id, category_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Cotton T-Shirt', 
          'SKU-CLOTH-001', 
          'pcs', 
          200.00, 
          500.00, 
          20.00, 
          0.150, 
          'kg', 
          firmId, 
          clothingCat.id
        ]
      );
      
      // Groceries stock
      await database.query(
        `INSERT INTO stock (stock_name, sku_code, unit, quantity_available, buy_price, low_unit_threshold, weight_per_unit, weight_unit, firm_id, category_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Basmati Rice', 
          'SKU-GROC-001', 
          'kg', 
          500.00, 
          80.00, 
          50.00, 
          1.000, 
          'kg', 
          firmId, 
          groceriesCat.id
        ]
      );
      
      console.log(`✅ Stock items created`);
      
      // Commit transaction
      await database.query('COMMIT');
      console.log('✅ All sample data seeded successfully!');
      console.log('📧 Login credentials:');
      console.log('   Owner: rajesh@demotraders.com / password123');
      console.log('   Admin: priya@demotraders.com / admin123');
      console.log('   Staff: amit@demotraders.com / staff123');
      
    } catch (error) {
      // Rollback transaction in case of error
      await database.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedData();