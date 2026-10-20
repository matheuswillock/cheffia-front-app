import "dotenv/config";
import { defineConfig } from "prisma/config";

const directUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma CLI needs a direct Supabase connection. Runtime uses DATABASE_URL.
    url: directUrl,
  },
});
