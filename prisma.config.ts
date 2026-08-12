import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI (generate/migrate/db push) selalu lewat direct connection,
    // karena transaction pooler tidak cocok untuk operasi DDL.
    url: env("DIRECT_URL"),
  },
});