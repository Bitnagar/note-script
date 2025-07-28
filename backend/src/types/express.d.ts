// backend/src/types/express.d.ts

import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
    }
  }
}

// Add this line to make it a module, which can help with some configurations.
export {};
