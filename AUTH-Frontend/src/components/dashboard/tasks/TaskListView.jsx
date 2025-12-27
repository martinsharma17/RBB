// src/components/dashboard/tasks/TaskListView.jsx
import React, { useState } from 'react';

const TaskListView = ({ permissions }) => {
    const [tasks, setTasks] = useState([
        { id: 1, title: "Design System Update", status: "In Progress", assignee: "User 1" },
        { id: 2, title: "API Integration", status: "Pending", assignee: "User 2" },
        { id: 3, title: "Unit Tests", status: "Completed", assignee: "User 3" },
    ]);

    const displayForbidden = (action) => {
        alert(`Access Denied: You do not have permission to ${action} tasks.`);
    };

    const handleDelete = (id) => {
        if (!permissions.delete) return displayForbidden('DELETE');
        if (window.confirm("Are you sure you want to delete this task?")) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const handleEdit = (id) => {
        if (!permissions.update) return displayForbidden('UPDATE');
        const task = tasks.find(t => t.id === id);
        const newTitle = prompt("Edit Task Title:", task.title);
        if (newTitle) {
            setTasks(tasks.map(t => t.id === id ? { ...t, title: newTitle } : t));
        }
    };

    const handleCreate = () => {
        if (!permissions.create) return displayForbidden('CREATE');
        const title = prompt("Enter Task Title:");
        if (title) {
            const newTask = {
                id: Math.max(0, ...tasks.map(t => t.id)) + 1,
                title,
                status: "Pending",
                assignee: "Unassigned"
            };
            setTasks([...tasks, newTask]);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Task List</h2>
                    <p className="text-sm text-gray-500">Manage your team tasks efficiently.</p>
                </div>
                {permissions.create && (
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Add Task
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignee}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-3">
                                        {permissions.update && (
                                            <button onClick={() => handleEdit(task.id)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        )}
                                        {permissions.delete && (
                                            <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskListView;
