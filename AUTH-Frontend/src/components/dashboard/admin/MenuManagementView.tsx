import React, { useState, useEffect } from 'react';

/**
 * Menu Management View - Admin UI for managing menu items
 * 
 * Allows SuperAdmin to:
 * - Add new menu items via form
 * - Edit existing menu items
 * - Delete menu items
 * - Reorder menu items
 * - Assign permissions and icons
 * 
 * No code editing required!
 */

interface MenuItem {
    id: number;
    title: string;
    viewId: string;
    url?: string;
    icon?: string;
    permission?: string;
    parentId?: number;
    order: number;
    isVisible: boolean;
    children?: MenuItem[];
}

interface MenuManagementViewProps {
    apiBase: string;
    token: string;
}

const MenuManagementView: React.FC<MenuManagementViewProps> = ({ apiBase, token }) => {
    // State
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [availableIcons, setAvailableIcons] = useState<string[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        viewId: '',
        url: '',
        icon: '',
        permission: '',
        parentId: null as number | null,
        order: 1,
        isVisible: true
    });

    // Load menu items on mount
    useEffect(() => {
        fetchMenuItems();
        fetchAvailableIcons();
        fetchAvailablePermissions();
    }, []);

    /**
     * Fetch all menu items from API
     */
    const fetchMenuItems = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/menu-management`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setMenuItems(result.data || []);
            } else {
                alert('Failed to load menu items');
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
            alert('Error loading menu items');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch available icon names from API
     */
    const fetchAvailableIcons = async () => {
        try {
            const response = await fetch(`${apiBase}/api/menu-management/icons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setAvailableIcons(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching icons:', error);
        }
    };

    /**
     * Fetch available permissions from API
     */
    const fetchAvailablePermissions = async () => {
        try {
            const response = await fetch(`${apiBase}/api/menu-management/permissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setAvailablePermissions(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    /**
     * Open modal for adding new menu item
     */
    const handleAddNew = () => {
        setEditingItem(null);
        setFormData({
            title: '',
            viewId: '',
            url: '',
            icon: '',
            permission: '',
            parentId: null,
            order: 1,
            isVisible: true
        });
        setShowModal(true);
    };

    /**
     * Open modal for editing existing menu item
     */
    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            viewId: item.viewId,
            url: item.url || '',
            icon: item.icon || '',
            permission: item.permission || '',
            parentId: item.parentId || null,
            order: item.order,
            isVisible: item.isVisible
        });
        setShowModal(true);
    };

    /**
     * Save menu item (create or update)
     */
    const handleSave = async () => {
        try {
            const url = editingItem
                ? `${apiBase}/api/menu-management/${editingItem.id}`
                : `${apiBase}/api/menu-management`;

            const method = editingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(editingItem ? 'Menu item updated!' : 'Menu item created!');
                setShowModal(false);
                fetchMenuItems(); // Refresh list
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save menu item');
            }
        } catch (error) {
            console.error('Error saving menu item:', error);
            alert('Error saving menu item');
        }
    };

    /**
     * Delete menu item
     */
    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this menu item?')) return;

        try {
            const response = await fetch(`${apiBase}/api/menu-management/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Menu item deleted!');
                fetchMenuItems(); // Refresh list
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to delete menu item');
            }
        } catch (error) {
            console.error('Error deleting menu item:', error);
            alert('Error deleting menu item');
        }
    };

    /**
     * Auto-generate ViewId from Title (lowercase with underscores)
     */
    const handleTitleChange = (title: string) => {
        setFormData({
            ...formData,
            title,
            viewId: title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        });
    };

    /**
     * Render menu items recursively (tree structure)
     */
    const renderMenuItem = (item: MenuItem, depth: number = 0) => {
        const indent = depth * 24;

        return (
            <React.Fragment key={item.id}>
                <tr className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="py-3 px-4" style={{ paddingLeft: `${indent + 16}px` }}>
                        <div className="flex items-center gap-2">
                            {depth > 0 && <span className="text-gray-400">└─</span>}
                            <span className="font-medium text-gray-900">{item.title}</span>
                        </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.icon || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.url || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.permission || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.order}</td>
                    <td className="py-3 px-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(item)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
                {/* Render children recursively */}
                {item.children && item.children.map(child => renderMenuItem(child, depth + 1))}
            </React.Fragment>
        );
    };

    if (loading) {
        return <div className="p-8 text-center">Loading menu items...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Manage menu items without editing code
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Menu Item
                </button>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Icon</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">URL</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Permission</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-gray-500">
                                    No menu items found. Click "Add Menu Item" to create one.
                                </td>
                            </tr>
                        ) : (
                            menuItems.map(item => renderMenuItem(item))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., User Management"
                                />
                            </div>

                            {/* ViewId (auto-generated) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    View ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.viewId}
                                    onChange={(e) => setFormData({ ...formData, viewId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., user_management (auto-generated)"
                                />
                                <p className="text-xs text-gray-500 mt-1">Auto-generated from title, but you can edit it</p>
                            </div>

                            {/* URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL Path</label>
                                <div className="flex items-center">
                                    <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">/</span>
                                    <input
                                        type="text"
                                        value={formData.url.replace(/^\//, '')}
                                        onChange={(e) => setFormData({ ...formData, url: `/${e.target.value}` })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., users"
                                    />
                                </div>
                            </div>

                            {/* Icon Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                                <select
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select an icon...</option>
                                    {availableIcons.map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Permission Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permission</label>
                                <select
                                    value={formData.permission}
                                    onChange={(e) => setFormData({ ...formData, permission: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">No permission required</option>
                                    {availablePermissions.map(perm => (
                                        <option key={perm.policyKey} value={perm.policyKey}>
                                            {perm.displayName} ({perm.category})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="1"
                                />
                            </div>

                            {/* Is Visible */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isVisible}
                                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Visible in menu</label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {editingItem ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagementView;
