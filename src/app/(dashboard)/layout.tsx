// src/app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
