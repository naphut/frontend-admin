import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import toast from 'react-hot-toast';

interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  recent_orders: any[];
  orders_by_status: Record<string, number>;
  revenue_by_day: { date: string; revenue: number }[];
  top_products: { id: number; name: string; total_sold: number }[];
}

const Dashboard = () => {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total_products: 0,
    total_orders: 0,
    total_users: 0,
    total_revenue: 0,
    recent_orders: [],
    orders_by_status: {},
    revenue_by_day: [],
    top_products: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-sm text-green-600 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.full_name || user?.username}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/settings"
            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.total_products}
          icon={Package}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Orders"
          value={stats.total_orders}
          icon={ShoppingBag}
          color="bg-green-600"
        />
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={Users}
          color="bg-purple-600"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.total_revenue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-yellow-600"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status</h2>
          <div className="space-y-3">
            {Object.entries(stats.orders_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {status === 'delivered' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {status === 'shipped' && <Package className="w-4 h-4 text-blue-600" />}
                  {status === 'processing' && <Clock className="w-4 h-4 text-yellow-600" />}
                  {status === 'cancelled' && <XCircle className="w-4 h-4 text-red-600" />}
                  {!['delivered', 'shipped', 'processing', 'cancelled'].includes(status) && 
                    <AlertCircle className="w-4 h-4 text-gray-600" />
                  }
                  <span className="text-sm text-gray-700 capitalize">{status}</span>
                </div>
                <span className="font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {stats.top_products.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                  <span className="text-sm text-gray-700">{product.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{product.total_sold} sold</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/products/new"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="text-sm font-medium">Add New Product</span>
              <Package className="w-4 h-4 text-gray-600" />
            </Link>
            <Link
              to="/categories/new"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="text-sm font-medium">Add New Category</span>
              <ShoppingBag className="w-4 h-4 text-gray-600" />
            </Link>
            <Link
              to="/orders"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="text-sm font-medium">View All Orders</span>
              <ShoppingBag className="w-4 h-4 text-gray-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-black hover:underline">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-600">Order #</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Total</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">#{order.order_number}</td>
                  <td className="py-3 text-sm text-gray-600">User #{order.user_id}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-gray-900">${order.total_amount.toFixed(2)}</td>
                  <td className="py-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-sm text-black hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;