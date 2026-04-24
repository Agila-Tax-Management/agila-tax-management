import { connection } from 'next/server';

export default async function PortalRootPage() {
  await connection();
  return <div>page</div>;
}