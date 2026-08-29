import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to initialize PostgreSQL.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const schema = await readFile(join(here, "..", "render-schema.sql"), "utf8");
const client = new pg.Client({ connectionString });

try {
  await client.connect();
  await client.query(schema);
  console.log("Samarthya database is ready.");
} finally {
  await client.end();
}
