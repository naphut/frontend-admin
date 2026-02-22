import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { Eye } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
}

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await adminApi.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Orders</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Order #</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Customer</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Payment</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Total</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Date</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-6 text-sm font-medium text-gray-900">
                  #{order.order_number}
                </td>
                <td className="py-3 px-6 text-sm text-gray-600">User #{order.user_id}</td>
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="py-3 px-6 text-sm text-gray-900">${order.total_amount.toFixed(2)}</td>
                <td className="py-3 px-6 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-6">
                  <Link
                    to={`/orders/${order.id}`}
                    className="p-1 text-gray-600 hover:text-black transition-colors inline-block"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;