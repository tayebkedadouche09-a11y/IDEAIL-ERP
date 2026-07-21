const express = require('express');
const projects = require('./routes/projects');
const app = express();
app.use('/projects', projects);
app.listen(3010, () => {
  const http = require('http');
  http.get('http://127.0.0.1:3010/projects', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('status', res.statusCode);
      console.log(data);
      process.exit(0);
    });
  });
});
