'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Filter } from 'lucide-react';

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
      const [catsRes, subsRes, usersRes, typesRes] = await Promise.all([
        fetch('/api/main-categories'),
        fetch('/api/sub-categories'),
        fetch('/api/users'),
        fetch('/api/item-types'),
      ]);

      const [catsData, subsData, usersData, typesData] = await Promise.all([
        catsRes.json(),
        subsRes.json(),
        usersRes.json(),
        typesRes.json(),
      ]);

      // Handle different response formats
      setCategories((catsData?.data || catsData || []).map((c: any) => ({ 
        CAT_ID: Number(c.CAT_ID), 
        CAT_NAME: c.CAT_NAME 
      })));

      setSubCategories((subsData?.data || subsData || []).map((s: any) => ({ 
        SUB_CAT_ID: Number(s.SUB_CAT_ID), 
        SUB_CAT_NAME: s.SUB_CAT_NAME, 
        CAT_ID: Number(s.CAT_ID) 
      })));

      const usersArray = usersData?.users || usersData?.data || usersData || [];
      setUsers(usersArray.map((u: any) => ({ 
        USER_ID: Number(u.USER_ID), 
        USER_NAME: u.FULL_NAME || u.USER_NAME || u.USERNAME 
      })));

      setItemTypes((typesData?.data || typesData || []).map((t: any) => ({ 
        ITEM_TYPE_ID: Number(t.ITEM_TYPE_ID), 
        ITEM_TYPE_NAME: t.ITEM_TYPE_NAME, 
        SUB_CAT_ID: t.SUB_CAT_ID ? Number(t.SUB_CAT_ID) : undefined 
      })));

    } catch (error) {
      console.error('Error fetching lookup data:', error);
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
      setFormData(item);
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
      'ITEM_TYPE_ID', 'CAT_ID', 'SUB_CAT_ID', 'USER_ID', 
      'LOCK_NUM', 'DEPT_ID', 'FLOOR_ID',
    ];
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">إدارة الأصناف</h1>
              <p className="text-slate-600">عرض وإدارة جميع الأصناف والأجهزة</p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              <span>إضافة صنف جديد</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="البحث عن صنف، رقم سيريال، أو مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
            >
              <Filter size={20} />
              <span>فلاتر</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="معرف التصنيف الفرعي"
                value={filters.subCatId}
                onChange={(e) => setFilters({ ...filters, subCatId: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="معرف القسم"
                value={filters.deptId}
                onChange={(e) => setFilters({ ...filters, deptId: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder="رقم السيريال"
                value={filters.serial}
                onChange={(e) => setFilters({ ...filters, serial: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={fetchItems}
                className="md:col-span-3 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                تطبيق الفلاتر
              </button>
            </div>
          )}
        </div>

        {/* Items Count */}
        <div className="mb-4 text-slate-600">
          عدد الأصناف: <span className="font-bold text-slate-800">{filteredItems.length}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">جاري تحميل البيانات...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-slate-600 text-lg">لا توجد أصناف</p>
            <p className="text-slate-500 text-sm mt-2">جرب إضافة صنف جديد أو تعديل الفلاتر</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">اسم الصنف</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">النوع</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">السيريال</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">المستخدم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">القسم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">الطابق</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">IP</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredItems.map((item) => (
                    <tr key={item.ITEM_ID} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{item.ITEM_NAME}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.ITEM_TYPE_NAME || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.SERIAL || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.ASSIGNED_USER || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.DEPT_NAME || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.FLOOR_NAME || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.SITUATION || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.IP || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all"
                            title="تعديل"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.ITEM_ID)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
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
        )}

        {/* Modal - نفس الكود السابق */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      اسم الصنف *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ITEM_NAME || ''}
                      onChange={(e) => setFormData({ ...formData, ITEM_NAME: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      التصنيف الفرعي *
                    </label>
                    <select
                      value={formData.SUB_CAT_ID || ''}
                      onChange={(e) => setFormData({ ...formData, SUB_CAT_ID: Number(e.target.value), ITEM_TYPE_ID: undefined })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-100"
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      نوع الصنف
                    </label>
                    <select
                      value={formData.ITEM_TYPE_ID || ''}
                      onChange={(e) => setFormData({ ...formData, ITEM_TYPE_ID: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">اختر نوع الصنف</option>
                      {filteredItemTypes.map(type => (
                        <option key={type.ITEM_TYPE_ID} value={type.ITEM_TYPE_ID}>
                          {type.ITEM_TYPE_NAME}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      المستخدم
                    </label>
                    <select
                      value={formData.USER_ID || ''}
                      onChange={(e) => setFormData({ ...formData, USER_ID: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">اختر المستخدم</option>
                      {users.map(user => (
                        <option key={user.USER_ID} value={user.USER_ID}>
                          {user.USER_NAME}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      رقم السيريال
                    </label>
                    <input
                      type="text"
                      value={formData.SERIAL || ''}
                      onChange={(e) => setFormData({ ...formData, SERIAL: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      النوع
                    </label>
                    <input
                      type="text"
                      value={formData.KIND || ''}
                      onChange={(e) => setFormData({ ...formData, KIND: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      الحالة
                    </label>
                    <input
                      type="text"
                      value={formData.SITUATION || ''}
                      onChange={(e) => setFormData({ ...formData, SITUATION: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      HDD
                    </label>
                    <input
                      type="text"
                      value={formData.HDD || ''}
                      onChange={(e) => setFormData({ ...formData, HDD: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      RAM
                    </label>
                    <input
                      type="text"
                      value={formData.RAM || ''}
                      onChange={(e) => setFormData({ ...formData, RAM: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={formData.IP || ''}
                      onChange={(e) => setFormData({ ...formData, IP: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      اسم الكمبيوتر
                    </label>
                    <input
                      type="text"
                      value={formData.COMP_NAME || ''}
                      onChange={(e) => setFormData({ ...formData, COMP_NAME: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      الخصائص
                    </label>
                    <textarea
                      value={formData.PROPERTIES || ''}
                      onChange={(e) => setFormData({ ...formData, PROPERTIES: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  >
                    <Save size={20} />
                    <span>{editingItem ? 'تحديث' : 'إضافة'}</span>
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
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