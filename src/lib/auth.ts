import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";

export const auth = betterAuth({
    baseURL: {
		allowedHosts: [
			"localhost:3000",
            "localhost:3001",
			"localhost:5173",
			"portal.agilaworkspace.com",
			"*.vercel.app",
		],
		protocol: process.env.NODE_ENV === "development" ? "http" : "https",
	},
    basePath: "/api/auth",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes - balances freshness with performance
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "EMPLOYEE",
                input: false,
            },
            active: {
                type: "boolean",
                required: true,
                defaultValue: true,
                input: false,
            },
        },
    },
});