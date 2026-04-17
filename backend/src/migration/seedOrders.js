import database from '../config/database.js';

async function seedOrders() {
  try {
    console.log('🌱 Seeding bulk order data for dashboard testing...');
    
    // Connect and get base data
    const firms = await database.query('SELECT id FROM firm LIMIT 1');
    if (firms.length === 0) {
      console.log('⚠️ No firm found. Run seedData.js first.');
      return;
    }
    const firmId = firms[0].id;

    const users = await database.query('SELECT id FROM user WHERE firm_id = ? LIMIT 1', [firmId]);
    if (users.length === 0) {
      console.log('⚠️ No users found. Run seedData.js first.');
      return;
    }
    const userId = users[0].id;

    const customers = await database.query('SELECT id FROM customer WHERE firm_id = ?', [firmId]);
    if (customers.length === 0) {
      console.log('⚠️ No customers found. Run seedData.js first.');
      return;
    }

    const stocks = await database.query('SELECT id, buy_price FROM stock WHERE firm_id = ?', [firmId]);
    if (stocks.length === 0) {
      console.log('⚠️ No stocks found. Run seedData.js first.');
      return;
    }

    // Get the maximum invoice number currently in DB to avoid collisions
    const maxInvoiceRes = await database.query('SELECT MAX(invoice_no) as max_invoice FROM ORDERS WHERE firm_id = ?', [firmId]);
    let currentInvoiceNo = (maxInvoiceRes[0].max_invoice || 1000) + 1;

    // Generate dates: from 6 months ago up to today
    const endDate = new Date('2026-04-17'); // Based on system time 
    const startDate = new Date(endDate);
    startDate.setMonth(endDate.getMonth() - 6);

    let currentDate = new Date(startDate);
    
    let totalOrdersInserted = 0;

    await database.query('START TRANSACTION');

    try {
      while (currentDate <= endDate) {
        // Random number of orders per day: 0 to 5
        const numOrdersThisDay = Math.floor(Math.random() * 6);
        
        for (let i = 0; i < numOrdersThisDay; i++) {
          const customerId = customers[Math.floor(Math.random() * customers.length)].id;
          
          // Select 1 to 3 random stocks
          const numStocks = Math.floor(Math.random() * 3) + 1;
          // Shuffle stock array and pick first `numStocks`
          const shuffledStocks = [...stocks].sort(() => 0.5 - Math.random());
          const selectedStocks = shuffledStocks.slice(0, numStocks);
          
          let totalAmount = 0;
          const orderItems = [];
          
          for (const stock of selectedStocks) {
            // Random quantity: 1 to 10
            const quantity = Math.floor(Math.random() * 10) + 1;
            // Selling price a bit higher than buy price (e.g., 20% to 50% markup)
            const margin = 1 + (Math.random() * 0.3 + 0.2); 
            const sellingPrice = Math.round((Number(stock.buy_price) * margin) * 100) / 100;
            const subtotal = sellingPrice * quantity;
            
            totalAmount += subtotal;
            orderItems.push({
              stockId: stock.id,
              sellingPrice,
              quantity,
              subtotal,
              quantity_delivered: quantity // Assume fully delivered for simplicity
            });
          }

          // Randomize status and payment
          const statusRandomizer = Math.random();
          let orderStatus = 'COMPLETED';
          let deliveryStatus = 'DELIVERED';
          let paymentStatus = 'PAID';
          let amountPaid = totalAmount;

          if (statusRandomizer > 0.8) {
            orderStatus = 'PENDING';
            deliveryStatus = 'PENDING';
            paymentStatus = 'UNPAID';
            amountPaid = 0;
          } else if (statusRandomizer > 0.6) {
            // Partially paid
            paymentStatus = 'PARTIALLY_PAID';
            amountPaid = Math.round(totalAmount * 0.5 * 100) / 100; // Pay half
          }
          
          const orderDateStr = currentDate.toISOString().split('T')[0];
          
          // Insert order
          const orderResult = await database.query(
            `INSERT INTO ORDERS (
              order_date, total_amount, total_amount_paid, invoice_no, 
              order_status, payment_status, delivery_status, 
              firm_id, customer_id, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              orderDateStr, totalAmount, amountPaid, currentInvoiceNo++, 
              orderStatus, paymentStatus, deliveryStatus, 
              firmId, customerId, userId,
              `${orderDateStr} 10:00:00`, `${orderDateStr} 10:00:00` // Mock created_at
            ]
          );
          
          const orderId = orderResult.insertId;
          
          // Insert order stock items
          for (const item of orderItems) {
            await database.query(
              `INSERT INTO order_stock (
                selling_price, quantity, quantity_delivered, subtotal, 
                order_id, stock_id, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.sellingPrice, item.quantity, item.quantity_delivered, item.subtotal,
                orderId, item.stockId, `${orderDateStr} 10:00:00`, `${orderDateStr} 10:00:00`
              ]
            );
          }
          
          // Insert payment record if some amount was paid
          if (amountPaid > 0) {
            const methods = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'];
            const paymentMethod = methods[Math.floor(Math.random() * methods.length)];
            
            await database.query(
              `INSERT INTO payment (
                payment_date, amount_paid, payment_method, reference_no, 
                order_id, firm_id, customer_id, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `${orderDateStr} 10:05:00`, amountPaid, paymentMethod, `REF-${orderId}-${currentInvoiceNo}`,
                orderId, firmId, customerId, `${orderDateStr} 10:05:00`, `${orderDateStr} 10:05:00`
              ]
            );
          }
          
          totalOrdersInserted++;
        }
        
        // Next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      await database.query('COMMIT');
      console.log(`✅ Successfully seeded ${totalOrdersInserted} orders spanning the last 6 months!`);

    } catch (error) {
      await database.query('ROLLBACK');
      throw error;
    }
    
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

seedOrders();
