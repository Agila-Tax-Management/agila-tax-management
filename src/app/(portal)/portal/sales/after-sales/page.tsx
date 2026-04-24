import { connection } from 'next/server';
import { AfterSales } from '@/components/sales/AfterSales';

export default async function AfterSalesPage() {
  await connection();
  return <AfterSales />;
}
