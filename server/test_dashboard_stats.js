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
    
    // Now test dashboard stats
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Dashboard Stats:', res.statusCode, body);
      });
    });
    
    req.on('error', (e) => {
      console.log('Error:', e.message);
    });
    
    req.end();
  });
});

loginReq.on('error', (e) => {
  console.log('Login Error:', e.message);
});

loginReq.write(loginData);
loginReq.end();