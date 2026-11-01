// Casa Lola — database schema (idempotent).
module.exports = [
  "CREATE TABLE IF NOT EXISTS \"DemoState\" ( \"slug\"      TEXT PRIMARY KEY, \"data\"      JSONB NOT NULL, \"version\"   INTEGER NOT NULL DEFAULT 1, \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP )"
];
