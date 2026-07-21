const db = require("./database");

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  if (err) {
    console.log("Error:", err.message);
  } else {
    console.log("Tables:", rows.map(r => r.name));
  }
  db.close();
});