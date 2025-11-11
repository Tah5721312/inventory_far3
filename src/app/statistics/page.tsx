'use client';

import { useState, useEffect } from 'react';
import { Printer, BarChart3, RefreshCw, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

interface Statistics {
  mainCategories: Array<{ CAT_ID: number; CAT_NAME: string; ITEM_COUNT: number }>;
  subCategories: Array<{ SUB_CAT_ID: number; SUB_CAT_NAME: string; MAIN_CATEGORY_NAME: string; ITEM_COUNT: number }>;
  itemTypes: Array<{ 
    ITEM_TYPE_ID: number; 
    ITEM_TYPE_NAME: string; 
    SUB_CAT_ID?: number;
    SUB_CAT_NAME?: string;
    CAT_ID?: number;
    MAIN_CATEGORY_NAME?: string;
    ITEM_COUNT: number 
  }>;
  departments: Array<{ DEPT_ID: number; DEPT_NAME: string; ITEM_COUNT: number }>;
  floors: Array<{ FLOOR_ID: number; FLOOR_NAME: string; ITEM_COUNT: number }>;
  situations: Array<{ SITUATION: string; ITEM_COUNT: number }>;
  kinds: Array<{ KIND: string; ITEM_COUNT: number }>;
  users: Array<{ USER_ID: number; USER_NAME: string; ITEM_COUNT: number }>;
  warehouse: { ITEM_COUNT: number };
  totalItems: { TOTAL_COUNT: number };
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      } else {
        setError(data.error || 'فشل في جلب الإحصائيات');
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('حدث خطأ أثناء جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handlePrint = () => {
    // طباعة الصفحة كـ PDF
    window.print();
  };

  const getSituationBadge = (situation: string) => {
    const badges: Record<string, { emoji: string; color: string; bgColor: string }> = {
      'صالح': { emoji: '🟢', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
      'عاطل': { emoji: '🔴', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
      'تحت الإصلاح': { emoji: '🟡', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
      'ورشة': { emoji: '🔧', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
    };
    return badges[situation] || { emoji: '', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg font-medium">جاري تحميل الإحصائيات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-red-600 text-lg font-medium mb-4">{error}</p>
            <button
              onClick={fetchStatistics}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8 print:p-2" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:rounded-lg print:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">الإحصائيات الشاملة</h1>
                <p className="text-blue-100 text-sm sm:text-base">نظرة شاملة على جميع البيانات والإحصائيات</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
              <Link
                href="/items"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold backdrop-blur-sm print:hidden"
              >
                <Home size={18} />
                <span className="hidden sm:inline">الأصناف</span>
              </Link>
              <button
                onClick={fetchStatistics}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-semibold backdrop-blur-sm print:hidden"
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl print:hidden"
              >
                <Printer size={18} />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Total Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6 print:rounded-lg print:shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{statistics.totalItems?.TOTAL_COUNT || 0}</div>
              <div className="text-sm text-slate-600 mt-1">إجمالي الأصناف</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600">{statistics.warehouse?.ITEM_COUNT || 0}</div>
              <div className="text-sm text-slate-600 mt-1">في المخزن</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {(statistics.totalItems?.TOTAL_COUNT || 0) - (statistics.warehouse?.ITEM_COUNT || 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">مخصصة للمستخدمين</div>
            </div>
          </div>
        </div>

        {/* Statistics Sections */}
        <div className="space-y-6 print:space-y-4">
          {/* Main Categories */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              التصنيفات الرئيسية
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statistics.mainCategories.map((cat) => (
                <div
                  key={cat.CAT_ID}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{cat.CAT_NAME}</div>
                      <div className="text-sm text-slate-500 mt-1">ID: {cat.CAT_ID}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 ml-4">{cat.ITEM_COUNT}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub Categories */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              التصنيفات الفرعية
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الرئيسي</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الفرعي</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">عدد الأصناف</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.subCategories.map((sub) => (
                    <tr key={sub.SUB_CAT_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">{sub.MAIN_CATEGORY_NAME || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{sub.SUB_CAT_NAME}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {sub.ITEM_COUNT}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Item Types */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              أنواع الأصناف
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الرئيسي</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">التصنيف الفرعي</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">نوع الصنف</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">عدد الأصناف</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.itemTypes.map((type) => (
                    <tr key={type.ITEM_TYPE_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">{type.MAIN_CATEGORY_NAME || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{type.SUB_CAT_NAME || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{type.ITEM_TYPE_NAME}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {type.ITEM_COUNT}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departments */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              الأقسام
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statistics.departments.map((dept) => (
                <div
                  key={dept.DEPT_ID}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{dept.DEPT_NAME}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 ml-4">{dept.ITEM_COUNT}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floors */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              الطوابق
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statistics.floors.map((floor) => (
                <div
                  key={floor.FLOOR_ID}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{floor.FLOOR_NAME}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 ml-4">{floor.ITEM_COUNT}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Situations */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              الحالات
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statistics.situations.map((situation) => {
                const badge = getSituationBadge(situation.SITUATION);
                return (
                  <div
                    key={situation.SITUATION}
                    className={`p-4 border-2 rounded-xl hover:shadow-md transition-all ${badge.bgColor} border-${badge.color.replace('text-', '')}-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{badge.emoji}</span>
                        <div className={`font-semibold ${badge.color}`}>{situation.SITUATION}</div>
                      </div>
                      <div className={`text-2xl font-bold ml-4 ${badge.color}`}>{situation.ITEM_COUNT}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kinds */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:rounded-lg print:shadow-md print:break-inside-avoid">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              النوع (عهدة/مشتريات)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {statistics.kinds.map((kind) => (
                <div
                  key={kind.KIND}
                  className="p-4 border-2 border-indigo-200 rounded-xl bg-indigo-50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-indigo-800">{kind.KIND}</div>
                    <div className="text-2xl font-bold text-indigo-600 ml-4">{kind.ITEM_COUNT}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users - Hidden in Print */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 print:hidden">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b-2 border-blue-100">
              المستخدمين والأصناف المخصصة
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-slate-700 whitespace-nowrap">اسم المستخدم</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-slate-700 whitespace-nowrap">عدد الأصناف</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.users
                    .filter((user) => user.ITEM_COUNT > 0)
                    .map((user) => (
                      <tr key={user.USER_ID} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">👤 {user.USER_NAME}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                            {user.ITEM_COUNT}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {statistics.users.filter((user) => user.ITEM_COUNT > 0).length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                        لا توجد أصناف مخصصة للمستخدمين
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 print:mt-4 print-footer">
          <p>تم إنشاء هذه الإحصائيات بواسطة محمد عبد الفتاح في: {new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}</p>
          <p className="mt-1">{new Date().toLocaleTimeString('ar-EG')}</p>
        </div>
      </div>

      {/* Table Styles */}
      <style jsx global>{`
        /* تحسين عرض الجداول */
        table {
          display: table;
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          display: table-header-group;
        }
        
        tbody {
          display: table-row-group;
        }
        
        tr {
          display: table-row;
        }
        
        th, td {
          display: table-cell;
        }
        
        /* Print Styles - محسّن للطباعة PDF - موفر للورق */
        @media print {
          @page {
            size: A4;
            margin: 0.8cm 0.8cm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* تصغير حجم الخط بشكل عام */
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 9px !important;
            line-height: 1.3 !important;
          }
          
          h1 {
            font-size: 16px !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.2 !important;
          }
          
          h2 {
            font-size: 12px !important;
            margin-top: 0.8rem !important;
            margin-bottom: 0.4rem !important;
            padding-bottom: 0.3rem !important;
            line-height: 1.3 !important;
          }
          
          h3 {
            font-size: 11px !important;
            margin-top: 0.6rem !important;
            margin-bottom: 0.3rem !important;
          }
          
          p, span, div, td, th {
            font-size: 9px !important;
            line-height: 1.3 !important;
          }
          
          /* تصغير الأرقام الكبيرة في الإحصائيات */
          .text-2xl,
          .text-3xl,
          .text-4xl {
            font-size: 14px !important;
          }
          
          .text-xl {
            font-size: 11px !important;
          }
          
          .text-lg {
            font-size: 10px !important;
          }
          
          .text-sm {
            font-size: 8px !important;
          }
          
          .text-xs {
            font-size: 7px !important;
          }
          
          /* إخفاء الـ Navbar والتنقل عند الطباعة - يجب أن يكون أول شيء */
          body > nav,
          nav,
          nav.sticky,
          nav[class*="sticky"],
          nav[class*="top-0"],
          header[role="navigation"],
          [role="navigation"] {
            display: none !important;
          }
          
          /* إخفاء العناصر غير المرغوبة في الطباعة - يجب أن يكون شامل */
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* إخفاء جميع الأزرار والروابط داخل Header بشكل مطلق */
          .bg-gradient-to-r .flex.flex-wrap,
          .bg-gradient-to-r .flex.flex-wrap > *,
          .bg-gradient-to-r button,
          .bg-gradient-to-r a[href],
          .bg-gradient-to-r a {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          
          /* إخفاء أي أزرار أو روابط أخرى */
          button:not(.print-keep),
          a[href]:not(.print-keep) {
            display: none !important;
          }
          
          /* إخفاء الـ main container padding */
          main.container {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* تحسين البطاقات للطباعة */
          .bg-white,
          .bg-slate-50,
          .bg-gradient-to-r {
            background: white !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          
          /* Header للطباعة - تصغير */
          .bg-gradient-to-r {
            background: #1e40af !important;
            color: white !important;
            padding: 0.5rem 0.8rem !important;
            margin-bottom: 0.6rem !important;
          }
          
          .bg-gradient-to-r * {
            color: white !important;
          }
          
          .bg-gradient-to-r h1 {
            font-size: 14px !important;
            margin-bottom: 0.2rem !important;
          }
          
          .bg-gradient-to-r p {
            font-size: 8px !important;
          }
          
          /* تحسين المسافات في الطباعة - تقليل */
          .print\\:p-2 {
            padding: 0.4rem !important;
          }
          
          .print\\:space-y-4 > * + * {
            margin-top: 0.5rem !important;
          }
          
          /* تقليل padding في البطاقات */
          .bg-white,
          .rounded-2xl,
          .rounded-xl {
            padding: 0.5rem 0.6rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          /* تقليل المسافات بين الأقسام */
          .space-y-6 > * + * {
            margin-top: 0.8rem !important;
          }
          
          .mb-6,
          .mb-8 {
            margin-bottom: 0.6rem !important;
          }
          
          .mt-8 {
            margin-top: 0.6rem !important;
          }
          
          .pb-3 {
            padding-bottom: 0.3rem !important;
          }
          
          .mb-4 {
            margin-bottom: 0.4rem !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .print\\:rounded-lg {
            border-radius: 0.25rem !important;
          }
          
          .print\\:shadow-md {
            box-shadow: none !important;
          }
          
          /* تحسين الجداول للطباعة - تصغير */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-bottom: 0.5rem !important;
            font-size: 8px !important;
          }
          
          table thead {
            display: table-header-group !important;
            background-color: #f9fafb !important;
          }
          
          table thead th {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
            font-weight: bold !important;
            border: 1px solid #d1d5db !important;
            padding: 0.3rem 0.4rem !important;
            text-align: right !important;
            font-size: 8px !important;
            line-height: 1.2 !important;
          }
          
          table tbody td {
            border: 1px solid #e5e7eb !important;
            padding: 0.25rem 0.4rem !important;
            font-size: 8px !important;
            line-height: 1.3 !important;
          }
          
          table tbody tr {
            border-bottom: 1px solid #e5e7eb !important;
          }
          
          table tbody tr:nth-child(even) {
            background-color: #f9fafb !important;
          }
          
          /* تصغير badges في الجداول */
          table .rounded-full,
          table .rounded-lg,
          table .rounded-xl {
            padding: 0.15rem 0.4rem !important;
            font-size: 7px !important;
            min-width: auto !important;
            width: auto !important;
            height: auto !important;
          }
          
          /* إزالة الـ hover effects في الطباعة */
          tr:hover {
            background-color: inherit !important;
          }
          
          /* تحسين البطاقات والإحصائيات */
          .grid {
            display: grid !important;
          }
          
          /* تحسين الألوان للطباعة */
          .text-blue-600,
          .text-blue-700 {
            color: #1e40af !important;
          }
          
          .text-green-600,
          .text-green-700 {
            color: #059669 !important;
          }
          
          .text-red-600,
          .text-red-700 {
            color: #dc2626 !important;
          }
          
          .text-yellow-600,
          .text-yellow-700 {
            color: #d97706 !important;
          }
          
          .text-orange-600,
          .text-orange-700 {
            color: #ea580c !important;
          }
          
          .text-purple-600,
          .text-purple-700 {
            color: #9333ea !important;
          }
          
          .text-indigo-600,
          .text-indigo-700 {
            color: #4338ca !important;
          }
          
          /* تحسين البطاقات الملونة - تصغير */
          .bg-blue-50,
          .bg-green-50,
          .bg-red-50,
          .bg-yellow-50,
          .bg-orange-50,
          .bg-purple-50,
          .bg-indigo-50 {
            background-color: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
            padding: 0.3rem 0.5rem !important;
          }
          
          /* تصغير Grid items */
          .grid {
            gap: 0.4rem !important;
          }
          
          .grid > div {
            padding: 0.3rem 0.4rem !important;
          }
          
          /* Footer للطباعة - تصغير */
          .print-footer {
            margin-top: 0.8rem !important;
            padding-top: 0.4rem !important;
            border-top: 1px solid #e5e7eb !important;
            text-align: center !important;
            font-size: 7px !important;
            color: #6b7280 !important;
          }
          
          .print-footer p {
            font-size: 7px !important;
            margin: 0.2rem 0 !important;
          }
          
          /* تحسين العنوان */
          h2 {
            page-break-after: avoid !important;
          }
          
          /* تقليل المسافات في البطاقات الإحصائية */
          .p-4,
          .p-6,
          .p-8 {
            padding: 0.4rem 0.5rem !important;
          }
          
          /* تصغير الأيقونات والرموز */
          .text-xl,
          .text-2xl {
            font-size: 10px !important;
          }
          
          /* تقليل border thickness */
          .border-2 {
            border-width: 1px !important;
          }
          
          /* تحسين spacing في grid */
          .gap-4 {
            gap: 0.3rem !important;
          }
          
          .gap-5,
          .gap-6 {
            gap: 0.4rem !important;
          }
        }
      `}</style>
    </div>
  );
}

