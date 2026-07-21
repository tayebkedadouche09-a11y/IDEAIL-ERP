const http = require('http');

let token = null;
let passed = 0;
let failed = 0;

function makeRequest(options, test, callback) {
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

const tests = [
  { path: '/notifications', method: 'GET', name: 'Notifications List', requiresAuth: true },
  { path: '/notifications/unread', method: 'GET', name: 'Unread Notifications', requiresAuth: true },
  { path: '/notifications/count', method: 'GET', name: 'Notifications Count', requiresAuth: true },
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
  
  if (test.data) {
    options.headers['Content-Length'] = Buffer.byteLength(test.data);
  }
  
  makeRequest(options, test, () => runTests(index + 1));
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
    console.log('Login successful, running Notifications tests...\n');
    runTests(0);
  });
});
loginReq.write(loginData);
loginReq.end();