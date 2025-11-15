import StatisticsPageContent from './content';
import { requireAuthServer } from '@/lib/auth-helper';

export default async function StatisticsPage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <StatisticsPageContent />;
}
