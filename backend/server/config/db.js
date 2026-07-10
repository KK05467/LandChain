const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const dbFile = path.join(__dirname, "..", "data", "db.json");
const adapter = new FileSync(dbFile);
const db = low(adapter);

db.defaults({ users: [] }).write();

module.exports = db;
