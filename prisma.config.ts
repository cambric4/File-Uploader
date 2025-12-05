import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    db: {
      adapter: 'postgresql',
      url: process.env.DATABASE_URL, // uses your .env
    },
  },
});
