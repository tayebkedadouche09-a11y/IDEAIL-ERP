const http = require('http');

let token = null;
let clientId = null;
let projectId = null;
let devisId = null;
let invoiceId = null;
let passed = 0;
let failed = 0;

function makeRequest(options, test, callback, requestData) {
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      const status = res.statusCode;
      const success = status >= 200 && status < 300;
      if (success) passed++;
      else failed++;
      
      console.log(`${success ? '✅' : '❌'} ${test.name}: ${status}`);
      try {
        const data = JSON.parse(body);
        if (test.extractId) {
          if (data.id) test.extractId(data.id);
          else if (data.data && data.data[0] && data.data[0].id) test.extractId(data.data[0].id);
        }
      } catch (e) {}
      setTimeout(callback, 100);
    });
  });

  req.on('error', (e) => {
    failed++;
    console.log(`❌ ${test.name}: ERROR - ${e.message}`);
    setTimeout(callback, 100);
  });

  if (requestData) {
    req.write(requestData);
  }
  req.end();
}

const tests = [
  // 1. Create Client
  { 
    path: '/clients', 
    method: 'POST', 
    data: JSON.stringify({ name: 'Test Client ' + Date.now(), phone: '0123456789' }), 
    name: 'Create Client', 
    requiresAuth: true,
    extractId: (id) => { clientId = id; }
  },
  
  // 2. Create Project
  { 
    path: '/projects', 
    method: 'POST', 
    data: null, // Will be set dynamically
    name: 'Create Project', 
    requiresAuth: true,
    extractId: (id) => { projectId = id; }
  },
  
  // 3. Create Devis
  { 
    path: '/devis', 
    method: 'POST', 
    data: null, // Will be set dynamically
    name: 'Create Devis', 
    requiresAuth: true,
    extractId: (id) => { devisId = id; }
  },
  
  // 4. Create Invoice
  { 
    path: '/invoices', 
    method: 'POST', 
    data: null, // Will be set dynamically
    name: 'Create Invoice', 
    requiresAuth: true,
    extractId: (id) => { invoiceId = id; }
  },
  
  // 5. Create Payment
  { 
    path: '/financial/payments', 
    method: 'POST', 
    data: null, // Will be set dynamically
    name: 'Create Payment', 
    requiresAuth: true
  },
  
  // 6. Create Expense
  { 
    path: '/financial/expenses', 
    method: 'POST', 
    data: null, // Will be set dynamically
    name: 'Create Expense', 
    requiresAuth: true
  },
  
  // 7. Get Project Profitability
  { 
    path: '/profitability/project/' + projectId, 
    method: 'GET', 
    name: 'Get Project Profitability', 
    requiresAuth: true
  },
  
  // 8. Get Dashboard Stats
  { 
    path: '/dashboard/stats', 
    method: 'GET', 
    name: 'Get Dashboard Stats', 
    requiresAuth: true
  },
];

function runTests(index) {
  if (index >= tests.length) {
    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    process.exit(0);
  }
  
  const test = tests[index];
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
  
  // Set data dynamically based on test index
  let data = test.data;
  if (index === 1) {
    // Create Project
    data = JSON.stringify({ 
      name: 'Test Project ' + Date.now(), 
      client_id: clientId,
      amount: 10000,
      start_date: new Date().toISOString().slice(0, 10)
    });
  } else if (index === 2) {
    // Create Devis
    data = JSON.stringify({ 
      client_id: clientId,
      project_id: projectId,
      title: 'Test Devis ' + Date.now(),
      items: [{ description: 'Service', quantity: 1, unit_price: 10000 }]
    });
  } else if (index === 3) {
    // Create Invoice
    data = JSON.stringify({ 
      client_id: clientId,
      project_id: projectId,
      devis_id: devisId,
      amount: 10000,
      status: 'مدفوعة'
    });
  } else if (index === 4) {
    // Create Payment
    data = JSON.stringify({ 
      payment_type: 'client_payment',
      client_id: clientId,
      invoice_id: invoiceId,
      amount: 10000,
      payment_method: 'cash'
    });
  } else if (index === 5) {
    // Create Expense
    data = JSON.stringify({ 
      title: 'Test Expense ' + Date.now(),
      amount: 2000,
      total_amount: 2000,
      project_id: projectId
    });
  } else if (index === 6) {
    // Get Project Profitability
    test.path = '/profitability/project/' + projectId;
  }
  
  if (data) {
    options.headers['Content-Length'] = Buffer.byteLength(data);
  }
  
  makeRequest(options, test, () => runTests(index + 1), data);
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
    console.log('Login successful, running Workflow tests...\n');
    runTests(0);
  });
});
loginReq.write(loginData);
loginReq.end();