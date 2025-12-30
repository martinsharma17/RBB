// src/components/dashboard/tasks/TaskKanbanView.jsx
import React, { useState } from 'react';

const TaskKanbanView = ({ permissions }) => {
    const [tasks, setTasks] = useState([
        { id: 1, title: "Design System", status: "In Progress", color: "blue" },
        { id: 2, title: "API Structure", status: "To Do", color: "gray" },
        { id: 3, title: "Deployment", status: "Done", color: "green" },
    ]);

    const columns = [
        { id: 'To Do', title: 'To Do', color: 'gray' },
        { id: 'In Progress', title: 'In Progress', color: 'blue' },
        { id: 'Done', title: 'Done', color: 'green' }
    ];

    const displayForbidden = (action) => {
        alert(`Access Denied: You do not have permission to ${action} tasks.`);
    };

    const handleCreate = () => {
        if (!permissions.create) return displayForbidden('CREATE');
        const title = prompt("Enter Task Title:");
        if (title) {
            const newTask = {
                id: Math.max(0, ...tasks.map(t => t.id)) + 1,
                title,
                status: "To Do",
                color: "gray"
            };
            setTasks([...tasks, newTask]);
        }
    };

    const handleDelete = (id) => {
        if (!permissions.delete) return displayForbidden('DELETE');
        if (window.confirm("Delete this card?")) {
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

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Kanban Board</h2>
                    <p className="text-sm text-gray-500">Visual task management.</p>
                </div>
                {permissions.create && (
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Add Card
                    </button>
                )}
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 h-full">
                {columns.map((col) => {
                    const colTasks = tasks.filter(t => t.status === col.id);

                    return (
                        <div key={col.id} className="min-w-[320px] bg-gray-100/80 rounded-xl p-4 flex flex-col h-full border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full bg-${col.color}-500`}></span>
                                    {col.title}
                                </h3>
                                <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full shadow-sm">{colTasks.length}</span>
                            </div>

                            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                                {colTasks.map((task) => (
                                    <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-medium text-gray-800">{task.title}</p>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {permissions.update && (
                                                    <button onClick={() => handleEdit(task.id)} className="text-gray-400 hover:text-indigo-600 p-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                )}
                                                {permissions.delete && (
                                                    <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-600 p-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="text-xs text-gray-400">Dec 12</div>
                                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] text-gray-500 font-bold">U1</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskKanbanView;
