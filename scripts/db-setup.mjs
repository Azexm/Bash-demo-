// Usage: DATABASE_URL=... node scripts/db-setup.mjs   (or: npm run db:setup with .env.local loaded by --env-file)
import { neon } from "@neondatabase/serverless";
import fs from "fs";

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("Set DATABASE_URL first.");
    process.exit(1);
}
const sql = neon(url);
const statements = fs
    .readFileSync(new URL("./schema.sql", import.meta.url), "utf8")
    .split(/;\s*\n/)
    .map((s) => s.replace(/^--.*$/gm, "").trim())
    .filter(Boolean);
for (const s of statements) await (typeof sql.query === "function" ? sql.query(s) : sql(s));
console.log(`Done: ran ${statements.length} statements.`);
