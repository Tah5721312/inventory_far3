// app/item-types/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Search, Loader2, CheckCircle, AlertCircle, Package, FolderTree } from 'lucide-react';

interface SubCategory {
  SUB_CAT_ID: number;
  SUB_CAT_NAME: string;
  CAT_ID: number;
}

interface ItemType {
  ITEM_TYPE_ID: number;
  ITEM_TYPE_NAME: string;
  SUB_CAT_ID: number;
  SUB_CAT_NAME?: string;
}

export default function ItemTypesPage() {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemType, setEditingItemType] = useState<ItemType | null>(null);
  const [formData, setFormData] = useState({ ITEM_TYPE_NAME: '', SUB_CAT_ID: '' });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // جلب البيانات
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemTypesResponse, subCategoriesResponse] = await Promise.all([
        fetch('/api/item-types'),
        fetch('/api/sub-categories')
      ]);
      
      const itemTypesResult = await itemTypesResponse.json();
      const subCategoriesResult = await subCategoriesResponse.json();
      
      if (itemTypesResult.success) {
        setItemTypes(itemTypesResult.data);
      }
      if (subCategoriesResult.success) {
        setSubCategories(subCategoriesResult.data);
      }
    } catch (error) {
      showNotification('error', 'فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (itemType?: ItemType) => {
    if (itemType) {
      setEditingItemType(itemType);
      setFormData({
        ITEM_TYPE_NAME: itemType.ITEM_TYPE_NAME,
        SUB_CAT_ID: itemType.SUB_CAT_ID.toString(),
      });
    } else {
      setEditingItemType(null);
      setFormData({ ITEM_TYPE_NAME: '', SUB_CAT_ID: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItemType(null);
    setFormData({ ITEM_TYPE_NAME: '', SUB_CAT_ID: '' });
  };

  const handleSubmit = async () => {
    if (!formData.ITEM_TYPE_NAME.trim() || !formData.SUB_CAT_ID) return;

    setSubmitting(true);
    try {
      const url = editingItemType
        ? `/api/item-types/${editingItemType.ITEM_TYPE_ID}`
        : '/api/item-types';

      const body = {
        ITEM_TYPE_NAME: formData.ITEM_TYPE_NAME.trim(),
        SUB_CAT_ID: parseInt(formData.SUB_CAT_ID),
      };

      const response = await fetch(url, {
        method: editingItemType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
 
      const result = await response.json();
      if (result.success) {
        showNotification('success', editingItemType ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
        fetchData();
        handleCloseModal();
      } else {
        showNotification('error', result.error || 'حدث خطأ');
      }
    } catch (error) {
      showNotification('error', 'فشل في حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;

    try {
      const response = await fetch(`/api/item-types/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        showNotification('success', 'تم الحذف بنجاح');
        fetchData();
      } else {
        showNotification('error', result.error || 'فشل في الحذف');
      }
    } catch (error) {
      showNotification('error', 'فشل في حذف النوع');
    }
  };

  const filteredItemTypes = itemTypes.filter(itemType =>
    itemType.ITEM_TYPE_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
    itemType.SUB_CAT_NAME?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Package className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              إدارة أنواع الأصناف
            </h1>
          </div>
          <p className="text-slate-600 text-lg">إدارة كاملة لأنواع الأصناف مع واجهة عصرية</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث عن نوع صنف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none transition-colors text-right"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              إضافة نوع صنف جديد
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">إجمالي الأنواع</p>
                <p className="text-3xl font-bold">{itemTypes.length}</p>
              </div>
              <Package className="w-12 h-12 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm mb-1">نتائج البحث</p>
                <p className="text-3xl font-bold">{filteredItemTypes.length}</p>
              </div>
              <Search className="w-12 h-12 text-pink-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm mb-1">التصنيفات الفرعية</p>
                <p className="text-3xl font-bold">{subCategories.length}</p>
              </div>
              <FolderTree className="w-12 h-12 text-indigo-200" />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          </div>
        ) : filteredItemTypes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-slate-400 mb-4">
              <Package className="w-16 h-16 mx-auto mb-4" />
            </div>
            <p className="text-slate-600 text-lg">لا توجد أنواع أصناف</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItemTypes.map((itemType) => (
              <div
                key={itemType.ITEM_TYPE_ID}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-purple-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 text-right">
                      {itemType.ITEM_TYPE_NAME}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-500 text-right">
                        رقم النوع: {itemType.ITEM_TYPE_ID}
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                          <FolderTree className="w-4 h-4" />
                          {itemType.SUB_CAT_NAME || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenModal(itemType)}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-4 py-2.5 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(itemType.ITEM_TYPE_ID)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingItemType ? 'تعديل نوع الصنف' : 'إضافة نوع صنف جديد'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-slate-700 font-semibold mb-3 text-right">
                  اسم نوع الصنف
                </label>
                <input
                  type="text"
                  value={formData.ITEM_TYPE_NAME}
                  onChange={(e) => setFormData({ ...formData, ITEM_TYPE_NAME: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none transition-colors text-right"
                  placeholder="أدخل اسم نوع الصنف"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-3 text-right">
                  التصنيف الفرعي
                </label>
                <select
                  value={formData.SUB_CAT_ID}
                  onChange={(e) => setFormData({ ...formData, SUB_CAT_ID: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none transition-colors text-right"
                >
                  <option value="">اختر التصنيف الفرعي</option>
                  {subCategories.map((subCat) => (
                    <option key={subCat.SUB_CAT_ID} value={subCat.SUB_CAT_ID}>
                      {subCat.SUB_CAT_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.ITEM_TYPE_NAME.trim() || !formData.SUB_CAT_ID}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    editingItemType ? 'حفظ التعديلات' : 'إضافة'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}