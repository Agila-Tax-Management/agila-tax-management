import { nextCookies } from "better-auth/next-js"
import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    basePath: "/app/api/auth",
    plugins: [
        nextCookies()
    ]
})