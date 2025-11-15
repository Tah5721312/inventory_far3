import MainCategoriesPage from '@/components/maincategories';
import { requireAuthServer } from '@/lib/auth-helper';

export default async function MainCategoriesPage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <MainCategoriesPage />;
}