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
    
    // Test clients API
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/clients',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Clients API:', res.statusCode);
        try {
          const json = JSON.parse(body);
          console.log('Total clients:', json.pagination?.total || json.length);
          console.log('Data:', json.data || json);
        } catch (e) {
          console.log('Response:', body);
        }
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