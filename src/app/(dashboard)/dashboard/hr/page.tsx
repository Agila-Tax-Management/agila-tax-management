import { connection } from 'next/server';

export default async function HRPage() {
  await connection();
  return <div>page</div>;
}