import Items from "@/components/Items";
import { requireAuthServer } from "@/lib/auth-helper";

export default async function ItemsPage() {
  // ✅ التحقق من تسجيل الدخول
  await requireAuthServer();

  return <Items />;
}

