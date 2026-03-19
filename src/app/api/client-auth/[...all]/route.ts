// src/app/api/client-auth/[...all]/route.ts
import { clientPortalAuth } from "@/lib/auth-client-portal";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(clientPortalAuth);
