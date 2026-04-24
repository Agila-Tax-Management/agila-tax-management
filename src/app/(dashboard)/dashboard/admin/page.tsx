import { connection } from 'next/server';

export default async function AdminPage() {
  await connection();
  return <div>page</div>;
}