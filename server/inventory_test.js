const http = require('http');

const tests = [
  // Warehouses
  { path: '/inventory/warehouses', method: 'GET', name: 'Warehouses List', requiresAuth: true },
  { path: '/inventory/warehouses', method: 'POST', data: JSON.stringify({ name: 'Test Warehouse ' + Date.now(), code: 'WH-' + Date.now() }), name: 'Create Warehouse', requiresAuth: true },
  { path: '/inventory/warehouses/1', method: 'PUT', data: JSON.stringify({ name: 'Updated Warehouse' }), name: 'Update Warehouse', requiresAuth: true },
  
  // Warehouse Locations
  { path: '/inventory/warehouses/1/locations', method: 'GET', name: 'Warehouse Locations', requiresAuth: true },
  { path: '/inventory/warehouses/1/locations', method: 'POST', data: JSON.stringify({ name: 'Aisle A', aisle: 'A', shelf: '1' }), name: 'Create Location', requiresAuth: true },
  
  // Stock Transfers
  { path: '/inventory/transfers', method: 'GET', name: 'Transfers List', requiresAuth: true },
  { path: '/inventory/transfers', method: 'POST', data: JSON.stringify({ from_warehouse_id: 1, to_warehouse_id: 1, quantity: 10, status: 'pending' }), name: 'Create Transfer', requiresAuth: true },
  
  // Stock Adjustments
  { path: '/inventory/adjustments', method: 'GET', name: 'Adjustments List', requiresAuth: true },
  { path: '/inventory/adjustments', method: 'POST', data: JSON.stringify({ quantity_change: 5, reason: 'Inventory correction' }), name: 'Create Adjustment', requiresAuth: true },
  
  // Inventory Batches
  { path: '/inventory/batches', method: 'GET', name: 'Batches List', requiresAuth: true },
  { path: '/inventory/batches', method: 'POST', data: JSON.stringify({ batch_number: 'BATCH-' + Date.now(), quantity: 100, unit: 'kg' }), name: 'Create Batch', requiresAuth: true },
  
  // Inventory Serials
  { path: '/inventory/serials', method: 'GET', name: 'Serials List', requiresAuth: true },
  { path: '/inventory/serials', method: 'POST', data: JSON.stringify({ serial_number: 'SN-' + Date.now(), status: 'available' }), name: 'Create Serial', requiresAuth: true },
  
  // Inventory Dashboard
  { path: '/inventory/dashboard', method: 'GET', name: 'Inventory Dashboard', requiresAuth: true },
  
  // Low Stock
  { path: '/inventory/low-stock', method: 'GET', name: 'Low Stock', requiresAuth: true },
  
  // Expired Products
  { path: '/inventory/expired', method: 'GET', name: 'Expired Products', requiresAuth: true },
  
  // Inventory Valuation
  { path: '/inventory/valuation', method: 'GET', name: 'Inventory Valuation', requiresAuth: true },
];

let token = null;
let passed = 0;
let failed = 0;

function makeRequest(test, callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: test.path,
    method: test.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (test.requiresAuth && token) {
    options.headers['Authorization'] = 'Bearer ' + token;
  }
  
  if (test.data) {
    options.headers['Content-Length'] = Buffer.byteLength(test.data);
  }
  
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      const status = res.statusCode;
      const success = status >= 200 && status < 300;
      if (success) passed++;
      else failed++;
      
      console.log(`${success ? '✅' : '❌'} ${test.name}: ${status}`);
      setTimeout(callback, 100);
    });
  });
  
  req.on('error', (e) => {
    failed++;
    console.log(`❌ ${test.name}: ERROR - ${e.message}`);
    setTimeout(callback, 100);
  });
  
  if (test.data) {
    req.write(test.data);
  }
  req.end();
}

function runTests(index) {
  if (index >= tests.length) {
    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    process.exit(0);
  }
  
  makeRequest(tests[index], () => {
    runTests(index + 1);
  });
}

// First login
const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });
const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    const data = JSON.parse(body);
    token = data.token;
    console.log('Login successful, running Inventory tests...\n');
    runTests(0);
  });
});
loginReq.write(loginData);
loginReq.end();