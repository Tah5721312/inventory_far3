'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Filter, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface Item {
  ITEM_ID: number;
  ITEM_NAME: string;
  SERIAL?: string;
  KIND?: string;
  SITUATION?: string;
  PROPERTIES?: string;
  HDD?: string;
  RAM?: string;
  IP?: string;
  COMP_NAME?: string;
  LOCK_NUM?: number;
  USER_ID?: number;
  ASSIGNED_USER?: string;
  DEPT_ID?: number;
  DEPT_NAME?: string;
  FLOOR_ID?: number;
  FLOOR_NAME?: string;
  SUB_CAT_ID?: number;
  SUB_CAT_NAME?: string;
  CAT_ID?: number;
  MAIN_CATEGORY_NAME?: string;
  ITEM_TYPE_ID?: number;
  ITEM_TYPE_NAME?: string;
}

interface Category {
  CAT_ID: number;
  CAT_NAME: string;
}

interface SubCategory {
  SUB_CAT_ID: number;
  SUB_CAT_NAME: string;
  CAT_ID: number;
}

interface User {
  USER_ID: number;
  USER_NAME: string;
}

interface ItemType {
  ITEM_TYPE_ID: number;
  ITEM_TYPE_NAME: string;
  SUB_CAT_ID?: number;
}

interface Department {
  DEPT_ID: number;
  DEPT_NAME: string;
}

interface Floor {
  FLOOR_ID: number;
  FLOOR_NAME: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<Partial<Item>>({});
  
  // Lookup data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [filteredItemTypes, setFilteredItemTypes] = useState<ItemType[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  
  const [filters, setFilters] = useState({
    subCatId: '',
    deptId: '',
    serial: '',
  });

  useEffect(() => {
    fetchItems();
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (formData.CAT_ID) {
      setFilteredSubCategories(
        subCategories.filter(sub => sub.CAT_ID === formData.CAT_ID)
      );
    } else {
      setFilteredSubCategories(subCategories);
    }
  }, [formData.CAT_ID, subCategories]);

  useEffect(() => {
    if (formData.SUB_CAT_ID) {
      setFilteredItemTypes(itemTypes.filter(t => t.SUB_CAT_ID === formData.SUB_CAT_ID));
    } else {
      setFilteredItemTypes(itemTypes);
    }
  }, [formData.SUB_CAT_ID, itemTypes]);

  const fetchLookupData = async () => {
    try {
      const [catsRes, subsRes, usersRes, typesRes, deptsRes, floorsRes] = await Promise.all([
        fetch('/api/main-categories'),
        fetch('/api/sub-categories'),
        fetch('/api/users'),
        fetch('/api/item-types'),
        fetch('/api/departments'),
        fetch('/api/floors'),
      ]);

      const [catsData, subsData, usersData, typesData, deptsData, floorsData] = await Promise.all([
        catsRes.json(),
        subsRes.json(),
        usersRes.json(),
        typesRes.json(),
        deptsRes.json(),
        floorsRes.json(),
      ]);

      // Helper function to safely extract array from response
      const getArrayFromResponse = (data: any, fallback: any[] = [], dataType: string = 'data'): any[] => {
        if (!data) {
          console.warn(`⚠️ ${dataType}: No data received`);
          return fallback;
        }
        if (data.success === false) {
          console.warn(`⚠️ ${dataType}: API returned success: false`, data.error);
          return fallback; // Handle error responses
        }
        if (Array.isArray(data)) {
          console.log(`✅ ${dataType}: Data is already an array`, data.length);
          return data;
        }
        if (Array.isArray(data.data)) {
          console.log(`✅ ${dataType}: Found data in data.data`, data.data.length);
          return data.data;
        }
        if (Array.isArray(data.users)) {
          console.log(`✅ ${dataType}: Found data in data.users`, data.users.length);
          return data.users;
        }
        console.warn(`⚠️ ${dataType}: Could not find array in response`, data);
        return fallback;
      };

      // Handle categories
      const categoriesArray = getArrayFromResponse(catsData);
      setCategories(categoriesArray.map((c: any) => ({ 
        CAT_ID: Number(c.CAT_ID), 
        CAT_NAME: c.CAT_NAME 
      })));

      // Handle sub-categories
      const subCategoriesArray = getArrayFromResponse(subsData);
      setSubCategories(subCategoriesArray.map((s: any) => ({ 
        SUB_CAT_ID: Number(s.SUB_CAT_ID), 
        SUB_CAT_NAME: s.SUB_CAT_NAME, 
        CAT_ID: Number(s.CAT_ID) 
      })));

      // Handle users (special case: returns { users: [...] })
      const usersArray = getArrayFromResponse(usersData);
      setUsers(usersArray.map((u: any) => ({ 
        USER_ID: Number(u.USER_ID), 
        USER_NAME: u.FULL_NAME || u.USER_NAME || u.USERNAME 
      })));

      // Handle item types
      const itemTypesArray = getArrayFromResponse(typesData);
      setItemTypes(itemTypesArray.map((t: any) => ({ 
        ITEM_TYPE_ID: Number(t.ITEM_TYPE_ID), 
        ITEM_TYPE_NAME: t.ITEM_TYPE_NAME, 
        SUB_CAT_ID: t.SUB_CAT_ID ? Number(t.SUB_CAT_ID) : undefined 
      })));

      // Handle departments
      console.log('📦 Departments response:', deptsData);
      const departmentsArray = getArrayFromResponse(deptsData, [], 'Departments');
      console.log('📦 Departments array:', departmentsArray);
      const mappedDepartments = departmentsArray.map((d: any) => ({ 
        DEPT_ID: Number(d.DEPT_ID), 
        DEPT_NAME: d.DEPT_NAME || 'Unknown'
      }));
      console.log('📦 Mapped departments:', mappedDepartments, `(${mappedDepartments.length} items)`);
      setDepartments(mappedDepartments);

      // Handle floors
      console.log('🏢 Floors response:', floorsData);
      const floorsArray = getArrayFromResponse(floorsData, [], 'Floors');
      console.log('🏢 Floors array:', floorsArray);
      const mappedFloors = floorsArray.map((f: any) => ({ 
        FLOOR_ID: Number(f.FLOOR_ID), 
        FLOOR_NAME: f.FLOOR_NAME || 'Unknown'
      }));
      console.log('🏢 Mapped floors:', mappedFloors, `(${mappedFloors.length} items)`);
      setFloors(mappedFloors);

    } catch (error) {
      console.error('❌ Error fetching lookup data:', error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.subCatId) queryParams.append('subCatId', filters.subCatId);
      if (filters.deptId) queryParams.append('deptId', filters.deptId);
      if (filters.serial) queryParams.append('serial', filters.serial);

      const response = await fetch(`/api/items?${queryParams}`);
      const result = await response.json();
      
      console.log('📥 API Response:', result);

      // ✅ إصلاح: التعامل مع الـ response بشكل صحيح
      if (result.success && Array.isArray(result.data)) {
        setItems(result.data);
        console.log('✅ Items loaded:', result.data.length);
      } else if (Array.isArray(result)) {
        // في حالة كان الـ response array مباشر
        setItems(result);
      } else if (result.error) {
        const errorMsg = result.details ? `${result.error}: ${result.details}` : result.error;
        console.error('Server error:', errorMsg);
        alert(errorMsg);
        setItems([]);
      } else {
        console.warn('Unexpected response format:', result);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('فشل في جلب البيانات');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.ITEM_NAME?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.SERIAL?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ASSIGNED_USER?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      // If USER_ID is null or undefined, don't set it so the warehouse option is selected
      const formDataForItem = { ...item };
      if (formDataForItem.USER_ID === null || formDataForItem.USER_ID === undefined) {
        formDataForItem.USER_ID = undefined;
      }
      setFormData(formDataForItem);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.ITEM_NAME) {
      alert('اسم الصنف مطلوب');
      return;
    }
    
    if (!formData.SUB_CAT_ID) {
      alert('التصنيف الفرعي مطلوب');
      return;
    }

    const payload: any = { ...formData };
    const numericKeys = [
      'ITEM_TYPE_ID', 'CAT_ID', 'SUB_CAT_ID', 
      'LOCK_NUM', 'DEPT_ID', 'FLOOR_ID',
    ];
    
    // Handle numeric keys (except USER_ID which needs special handling)
    numericKeys.forEach((k) => {
      const v = payload[k];
      if (v === '' || v === undefined || v === null) {
        delete payload[k];
      } else {
        const n = Number(v);
        if (Number.isNaN(n) || n === 0) {
          delete payload[k];
        } else {
          payload[k] = n;
        }
      }
    });

    // Handle USER_ID separately - allow null for warehouse items
    if (payload.USER_ID === '' || payload.USER_ID === undefined || payload.USER_ID === null) {
      // If USER_ID is empty, set it to null (for warehouse items)
      payload.USER_ID = null;
    } else {
      const userId = Number(payload.USER_ID);
      if (Number.isNaN(userId) || userId === 0) {
        payload.USER_ID = null;
      } else {
        payload.USER_ID = userId;
      }
    }

    const readOnlyKeys = [
      'ITEM_TYPE_NAME', 'ASSIGNED_USER', 'DEPT_NAME', 'FLOOR_NAME',
      'SUB_CAT_NAME', 'MAIN_CATEGORY_NAME', 'CREATED_AT', 'UPDATED_AT',
    ];
    readOnlyKeys.forEach((k) => delete payload[k]);

    console.log('📤 Sending payload:', payload);

    try {
      if (editingItem) {
        const response = await fetch('/api/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, ITEM_ID: editingItem.ITEM_ID }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.details || result.error || 'فشل التحديث');
        }
      } else {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.details || result.error || 'فشل الإضافة');
        }
      }

      setShowModal(false);
      await fetchItems();
      alert(editingItem ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Error saving item:', errMsg);
      alert(errMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const response = await fetch(`/api/items?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'فشل الحذف');
      }

      await fetchItems();
      alert('تم الحذف بنجاح');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('فشل في حذف الصنف');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-3 sm:p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Modern */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Plus size={24} className="text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">إدارة الأصناف</h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-base ml-14 sm:ml-0">عرض وإدارة جميع الأصناف والأجهزة في النظام</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/statistics"
                className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap backdrop-blur-sm border border-white/30"
              >
                <BarChart3 size={20} />
                <span>الإحصائيات</span>
              </Link>
              <button
                onClick={() => openModal()}
                className="flex items-center justify-center gap-2 bg-white text-blue-600 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Plus size={20} />
                <span>إضافة صنف جديد</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters - Modern */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              <input
                type="text"
                placeholder="🔍 ابحث عن صنف، رقم سيريال، أو مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white text-sm sm:text-base"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 border-2 rounded-xl font-semibold transition-all duration-200 ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <Filter size={18} />
              <span className="whitespace-nowrap">فلاتر</span>
              {showFilters && <span className="ml-1 text-xs">✓</span>}
            </button>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t-2 border-slate-100 space-y-4 animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">التصنيف الفرعي</label>
                  <input
                    type="number"
                    placeholder="معرف التصنيف الفرعي"
                    value={filters.subCatId}
                    onChange={(e) => setFilters({ ...filters, subCatId: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">القسم</label>
                  <input
                    type="number"
                    placeholder="معرف القسم"
                    value={filters.deptId}
                    onChange={(e) => setFilters({ ...filters, deptId: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">رقم السيريال</label>
                  <input
                    type="text"
                    placeholder="رقم السيريال"
                    value={filters.serial}
                    onChange={(e) => setFilters({ ...filters, serial: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => {
                    setFilters({ subCatId: '', deptId: '', serial: '' });
                    fetchItems();
                  }}
                  className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
                >
                  مسح الفلاتر
                </button>
                <button
                  onClick={fetchItems}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  تطبيق الفلاتر
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items Display - Modern & Responsive */}
        {loading ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 p-12 sm:p-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg font-medium">جاري تحميل البيانات...</p>
            <p className="text-slate-400 text-sm mt-2">يرجى الانتظار</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 p-12 sm:p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Search size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-700 text-xl font-semibold mb-2">لا توجد أصناف</p>
            <p className="text-slate-500 text-sm mb-6">جرب إضافة صنف جديد أو تعديل الفلاتر</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              إضافة صنف جديد
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">اسم الصنف</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">النوع</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">السيريال</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">المستخدم</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">القسم</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">الطابق</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">الحالة</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">رقم القفل</th>
                      <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">IP</th>
                      <th className="px-4 xl:px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.ITEM_ID} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                        <td className="px-4 xl:px-6 py-4" style={{ maxWidth: '250px', width: '250px' }}>
                          <div 
                            className="text-sm font-semibold text-slate-900 break-words" 
                            title={item.ITEM_NAME}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word',
                              lineHeight: '1.4',
                              maxHeight: '2.8em'
                            }}
                          >
                            {item.ITEM_NAME}
                          </div>
                        </td>
                        <td className="px-4 xl:px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {item.ITEM_TYPE_NAME && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 w-fit">
                                {item.ITEM_TYPE_NAME}
                              </span>
                            )}
                            {item.KIND && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
                                {item.KIND}
                              </span>
                            )}
                            {!item.ITEM_TYPE_NAME && !item.KIND && (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-sm text-slate-600 font-mono">
                          {item.SERIAL || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-4 xl:px-6 py-4">
                          {item.ASSIGNED_USER ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                              <span>👤</span>
                              {item.ASSIGNED_USER}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                              <span>📦</span>
                              المخزن
                            </span>
                          )}
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-sm text-slate-600">
                          {item.DEPT_NAME || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-sm text-slate-600">
                          {item.FLOOR_NAME || <span className="text-slate-400">-</span>}
                        </td>
                      <td className="px-4 xl:px-6 py-4">
                        {item.SITUATION ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              item.SITUATION === 'صالح' ? 'bg-green-100 text-green-700 border border-green-200' :
                              item.SITUATION === 'عاطل' ? 'bg-red-100 text-red-700 border border-red-200' :
                              item.SITUATION === 'تحت الإصلاح' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              item.SITUATION === 'ورشة' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.SITUATION === 'صالح' && '🟢'}
                              {item.SITUATION === 'عاطل' && '🔴'}
                              {item.SITUATION === 'تحت الإصلاح' && '🟡'}
                              {item.SITUATION === 'ورشة' && '🔧'}
                              {item.SITUATION}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-sm text-slate-600">
                          {item.LOCK_NUM ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              🔒 {item.LOCK_NUM}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-sm text-slate-600 font-mono">
                          {item.IP || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-4 xl:px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="تعديل"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.ITEM_ID)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div key={item.ITEM_ID} className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-5 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-base font-bold text-slate-900 mb-1 line-clamp-2 break-words" 
                        title={item.ITEM_NAME}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.ITEM_NAME}
                      </h3>
                      {item.ITEM_TYPE_NAME && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                          {item.ITEM_TYPE_NAME}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.ITEM_ID)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5">
                    {item.SERIAL && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-20">السيريال:</span>
                        <span className="font-mono text-slate-900">{item.SERIAL}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-600 w-20">المستخدم:</span>
                      {item.ASSIGNED_USER ? (
                        <span className="inline-flex items-center gap-1 text-slate-900">
                          <span>👤</span>
                          {item.ASSIGNED_USER}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          <span>📦</span>
                          المخزن
                        </span>
                      )}
                    </div>
                    {item.DEPT_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-20">القسم:</span>
                        <span>{item.DEPT_NAME}</span>
                      </div>
                    )}
                    {item.FLOOR_NAME && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-20">الطابق:</span>
                        <span>{item.FLOOR_NAME}</span>
                      </div>
                    )}
                    {item.SITUATION && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-600 w-20">الحالة:</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          item.SITUATION === 'صالح' ? 'bg-green-100 text-green-700 border border-green-200' :
                          item.SITUATION === 'عاطل' ? 'bg-red-100 text-red-700 border border-red-200' :
                          item.SITUATION === 'تحت الإصلاح' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          item.SITUATION === 'ورشة' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.SITUATION === 'صالح' && '🟢'}
                          {item.SITUATION === 'عاطل' && '🔴'}
                          {item.SITUATION === 'تحت الإصلاح' && '🟡'}
                          {item.SITUATION === 'ورشة' && '🔧'}
                          {item.SITUATION}
                        </span>
                      </div>
                    )}
                    {item.KIND && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-20">النوع:</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.KIND}
                        </span>
                      </div>
                    )}
                    {item.LOCK_NUM && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-20">رقم القفل:</span>
                        <span className="font-semibold text-slate-900">🔒 {item.LOCK_NUM}</span>
                      </div>
                    )}
                    {item.IP && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium w-20">IP:</span>
                        <span className="font-mono text-slate-900">{item.IP}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal - Modern & Responsive */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 z-50 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
              {/* Header with Gradient */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center shadow-lg z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Save size={20} className="text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
                  aria-label="إغلاق"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Basic Information Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-blue-100">
                      المعلومات الأساسية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                          <span className="text-red-500">*</span>
                          اسم الصنف
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.ITEM_NAME || ''}
                          onChange={(e) => setFormData({ ...formData, ITEM_NAME: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل اسم الصنف"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          التصنيف الرئيسي
                        </label>
                        <select
                          value={formData.CAT_ID || ''}
                          onChange={(e) => {
                            setFormData({ 
                              ...formData, 
                              CAT_ID: Number(e.target.value),
                              SUB_CAT_ID: undefined,
                              ITEM_TYPE_ID: undefined
                            });
                          }}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر التصنيف الرئيسي</option>
                          {categories.map(cat => (
                            <option key={cat.CAT_ID} value={cat.CAT_ID}>
                              {cat.CAT_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                          <span className="text-red-500">*</span>
                          التصنيف الفرعي
                        </label>
                        <select
                          value={formData.SUB_CAT_ID || ''}
                          onChange={(e) => setFormData({ ...formData, SUB_CAT_ID: Number(e.target.value), ITEM_TYPE_ID: undefined })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!formData.CAT_ID}
                        >
                          <option value="">اختر التصنيف الفرعي</option>
                          {filteredSubCategories.map(sub => (
                            <option key={sub.SUB_CAT_ID} value={sub.SUB_CAT_ID}>
                              {sub.SUB_CAT_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          نوع الصنف
                        </label>
                        <select
                          value={formData.ITEM_TYPE_ID || ''}
                          onChange={(e) => setFormData({ ...formData, ITEM_TYPE_ID: Number(e.target.value) })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر نوع الصنف</option>
                          {filteredItemTypes.map(type => (
                            <option key={type.ITEM_TYPE_ID} value={type.ITEM_TYPE_ID}>
                              {type.ITEM_TYPE_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Assignment Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-blue-100">
                      التخصيص والموقع
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          المستخدم
                        </label>
                        <select
                          value={formData.USER_ID !== undefined && formData.USER_ID !== null ? formData.USER_ID : 'warehouse'}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'warehouse') {
                              setFormData({ ...formData, USER_ID: undefined });
                            } else if (value === '') {
                              setFormData({ ...formData, USER_ID: undefined });
                            } else {
                              setFormData({ ...formData, USER_ID: Number(value) });
                            }
                          }}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="warehouse">📦 المخزن (لا يوجد مستخدم)</option>
                          {users.map(user => (
                            <option key={user.USER_ID} value={user.USER_ID}>
                              👤 {user.USER_NAME}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          القسم {departments.length > 0 && <span className="text-slate-500 text-xs">({departments.length})</span>}
                        </label>
                        <select
                          value={formData.DEPT_ID || ''}
                          onChange={(e) => setFormData({ ...formData, DEPT_ID: Number(e.target.value) })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر القسم</option>
                          {departments.length === 0 ? (
                            <option value="" disabled>لا توجد أقسام</option>
                          ) : (
                            departments.map(dept => (
                              <option key={dept.DEPT_ID} value={dept.DEPT_ID}>
                                {dept.DEPT_NAME}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الطابق {floors.length > 0 && <span className="text-slate-500 text-xs">({floors.length})</span>}
                        </label>
                        <select
                          value={formData.FLOOR_ID || ''}
                          onChange={(e) => setFormData({ ...formData, FLOOR_ID: Number(e.target.value) })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر الطابق</option>
                          {floors.length === 0 ? (
                            <option value="" disabled>لا توجد طوابق</option>
                          ) : (
                            floors.map(floor => (
                              <option key={floor.FLOOR_ID} value={floor.FLOOR_ID}>
                                {floor.FLOOR_NAME}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          رقم القفل
                        </label>
                        <input
                          type="number"
                          value={formData.LOCK_NUM || ''}
                          onChange={(e) => setFormData({ ...formData, LOCK_NUM: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل رقم القفل"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b-2 border-blue-100">
                      التفاصيل والمعلومات
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          رقم السيريال
                        </label>
                        <input
                          type="text"
                          value={formData.SERIAL || ''}
                          onChange={(e) => setFormData({ ...formData, SERIAL: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل رقم السيريال"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          النوع
                        </label>
                        <select
                          value={formData.KIND || ''}
                          onChange={(e) => setFormData({ ...formData, KIND: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر النوع</option>
                          <option value="عهدة">عهدة</option>
                          <option value="مشتريات">مشتريات</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الحالة
                        </label>
                        <select
                          value={formData.SITUATION || ''}
                          onChange={(e) => setFormData({ ...formData, SITUATION: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white cursor-pointer"
                        >
                          <option value="">اختر الحالة</option>
                          <option value="عاطل">🔴 عاطل</option>
                          <option value="تحت الإصلاح">🟡 تحت الإصلاح</option>
                          <option value="صالح">🟢 صالح</option>
                          <option value="ورشة">🔧 ورشة</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          HDD
                        </label>
                        <input
                          type="text"
                          value={formData.HDD || ''}
                          onChange={(e) => setFormData({ ...formData, HDD: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="مثال: 500GB, 1TB"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          RAM
                        </label>
                        <input
                          type="text"
                          value={formData.RAM || ''}
                          onChange={(e) => setFormData({ ...formData, RAM: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="مثال: 8GB, 16GB"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          IP Address
                        </label>
                        <input
                          type="text"
                          value={formData.IP || ''}
                          onChange={(e) => setFormData({ ...formData, IP: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="مثال: 192.168.1.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          اسم الكمبيوتر
                        </label>
                        <input
                          type="text"
                          value={formData.COMP_NAME || ''}
                          onChange={(e) => setFormData({ ...formData, COMP_NAME: e.target.value })}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="أدخل اسم الكمبيوتر"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                          الخصائص
                        </label>
                        <textarea
                          value={formData.PROPERTIES || ''}
                          onChange={(e) => setFormData({ ...formData, PROPERTIES: e.target.value })}
                          rows={4}
                          className="w-full px-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-200 bg-slate-50 focus:bg-white resize-none"
                          placeholder="أدخل أي خصائص إضافية..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Save size={20} />
                    <span>{editingItem ? 'تحديث الصنف' : 'إضافة الصنف'}</span>
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 sm:flex-initial sm:w-auto px-6 py-3.5 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}