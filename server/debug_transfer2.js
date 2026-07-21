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
    
    // Test create transfer endpoint
    const createData = JSON.stringify({ from_warehouse_id: 1, to_warehouse_id: 1, quantity: 10, status: 'pending' });
    const createOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/inventory/transfers',
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
        console.log('Create Transfer result:', res.statusCode, body);
      });
    });
    createReq.write(createData);
    createReq.end();
  });
});
loginReq.write(loginData);
loginReq.end();