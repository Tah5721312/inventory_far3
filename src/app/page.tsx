import HomeContent from '@/components/home-content';
import { requireAuthServer } from '@/lib/auth-helper';

export default async function HomePage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <HomeContent />;
}
