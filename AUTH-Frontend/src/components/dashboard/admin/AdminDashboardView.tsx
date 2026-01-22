import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    FileText,
    TrendingUp,
    Users
} from 'lucide-react';

interface KycStats {
    totalSubmitted: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
    resubmissionRequired: number;
    statusDistribution: Array<{ status: string; count: number }>;
    dailyTrend: Array<{ date: string; count: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'];

interface AdminDashboardViewProps {
    onViewChange?: (view: string, id?: number) => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onViewChange }) => {
    const { token, apiBase } = useAuth();
    const [stats, setStats] = useState<KycStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        if (token && apiBase) {
            fetchStats();
        }
    }, [token, apiBase, fromDate, toDate]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fromDate) params.append('fromDate', fromDate);
            if (toDate) params.append('toDate', toDate);

            const query = params.toString();
            const response = await api.get(`/api/KycApproval/dashboard-stats${query ? '?' + query : ''}`);
            if (response.data.success) {
                setStats(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
            } else {
                setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!stats) return null;

    const summaryCards = [
        { title: 'Total Submitted', value: stats.totalSubmitted, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
        { title: 'Pending Approval', value: stats.pendingApproval, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', clickable: true, targetView: 'kyc_workflow' },
        { title: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { title: 'Resubmission', value: stats.resubmissionRequired, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">Overview of system status and KYC analytics.</p>
                </div>

                {/* Search & Date Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 border-r border-gray-100 pr-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Range:</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-gray-50 border-none text-xs font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 outline-none p-2"
                        />
                        <span className="text-gray-300">-</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-gray-50 border-none text-xs font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 outline-none p-2"
                        />
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search applicant..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-50 border-none text-xs font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-8 pr-4 py-2 w-48"
                            />
                            <TrendingUp className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        {(fromDate || toDate || searchTerm) && (
                            <button
                                onClick={() => { setFromDate(''); setToDate(''); setSearchTerm(''); }}
                                className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition"
                            >
                                CLEAR
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {summaryCards.map((card, index) => (
                    <div
                        key={index}
                        onClick={() => card.clickable && onViewChange?.(card.targetView || '')}
                        className={`${card.bg} p-5 rounded-2xl border border-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${card.clickable ? 'cursor-pointer ring-1 ring-blue-100' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <card.icon className={`w-8 h-8 ${card.color} opacity-80`} />
                            <span className={`text-2xl font-black ${card.color}`}>{card.value}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Submission Trend</h3>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">Last 7 Days</span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.dailyTrend}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    dy={10}
                                    tickFormatter={(val: string) => val.split('-').slice(1).join('/')}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 self-start">Approval Status</h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.statusDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {stats.statusDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
                            {stats.statusDistribution.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-sm text-gray-600 font-medium">{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform">
                            <Users className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-white text-lg font-bold mb-1">Collaboration</h3>
                            <p className="text-blue-100 text-sm mb-6">Coordinate with your team for faster audits.</p>

                            {/* <div className="space-y-4">
                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-blue-100">Pending Actions</span>
                                        <span className="bg-white text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">High</span>
                                    </div>
                                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-white h-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (stats.pendingApproval / (stats.totalSubmitted || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div> */}

                            <button className="mt-6 w-full py-2 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition active:scale-95">
                                Team Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Pending Actions</h3>
                        <p className="text-xs text-gray-500 mt-1">Directly action items from your current queue.</p>
                    </div>
                    <button
                        onClick={() => onViewChange?.('kyc_workflow')}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                    >
                        View Full Queue
                    </button>
                </div>
                <PendingList searchTerm={searchTerm} onViewChange={onViewChange} />
            </div>
        </div>
    );
};

const PendingList: React.FC<{ searchTerm: string, onViewChange?: (view: string, id?: number) => void }> = ({ searchTerm, onViewChange }) => {
    const { token, apiBase } = useAuth();
    const [pending, setPending] = useState<any[]>([]);
    const [filteredPending, setFilteredPending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPending = async () => {
            if (!token || !apiBase) return;
            try {
                const response = await api.get('/api/KycApproval/pending');
                if (response.data.success) {
                    setPending(response.data.data.pending || []);
                }
            } catch (err) {
                console.error("Failed to fetch pending list for dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, [token, apiBase]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredPending(pending.slice(0, 5));
            return;
        }
        const filtered = pending.filter(item =>
            item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPending(filtered.slice(0, 5));
    }, [searchTerm, pending]);

    if (loading) return <div className="p-8 text-center text-gray-400">Loading your queue...</div>;

    if (pending.length === 0) return (
        <div className="p-12 text-center text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Your queue is clear. Good job!</p>
        </div>
    );

    if (filteredPending.length === 0 && searchTerm) return (
        <div className="p-12 text-center text-gray-400">
            <p>No pending items match your search "{searchTerm}".</p>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                    <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Level</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Branch</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Submitted</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredPending.map((item, idx) => (
                        <tr
                            key={idx}
                            onClick={() => onViewChange?.('kyc_workflow', item.workflowId || item.id)}
                            className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-700">{item.customerName}</span>
                                    <span className="text-xs text-gray-400">{item.customerEmail}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase border border-amber-100">
                                    {item.currentRoleName}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs text-gray-500">{item.branchName}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboardView;
