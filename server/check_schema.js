const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ideail.db');

db.all("PRAGMA table_info(stock_transfers)", [], (err, rows) => {
  if (err) {
    console.log("Error:", err.message);
  } else {
    console.log("stock_transfers schema:", rows);
  }
  db.close();
});