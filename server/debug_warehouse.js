const http = require('http');

// First login to get token
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
    
    // Test create warehouse endpoint
    const createData = JSON.stringify({ name: 'Main Warehouse', code: 'WH-001' });
    const createOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/inventory/warehouses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(createData),
        'Authorization': 'Bearer ' + token
      }
    };
    
    const createReq = http.request(createOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Create Warehouse result:', res.statusCode, body);
      });
    });
    createReq.write(createData);
    createReq.end();
  });
});
loginReq.write(loginData);
loginReq.end();