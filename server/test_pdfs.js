const http = require('http');

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
    const token = data.token;
    
    // Test all PDF endpoints
    const endpoints = [
      '/pdf/invoice/1',
      '/pdf/devis/1',
      '/pdf/expense/1',
      '/pdf/payment/1',
      '/pdf/project/1/profitability',
      '/pdf/financial-report'
    ];
    
    let index = 0;
    let passed = 0;
    let failed = 0;
    
    function testNext() {
      if (index >= endpoints.length) {
        console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
        process.exit(0);
      }
      
      const path = endpoints[index];
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      
      const req = http.request(options, (res) => {
        const status = res.statusCode;
        const success = status === 200;
        if (success) passed++;
        else failed++;
        
        console.log(`${success ? '✅' : '❌'} ${path}: ${status}`);
        index++;
        testNext();
      });
      
      req.on('error', (e) => {
        failed++;
        console.log(`❌ ${path}: ERROR - ${e.message}`);
        index++;
        testNext();
      });
      
      req.end();
    }
    
    console.log('Testing PDF endpoints...\n');
    testNext();
  });
});

loginReq.on('error', (e) => {
  console.log('Login Error:', e.message);
});

loginReq.write(loginData);
loginReq.end();