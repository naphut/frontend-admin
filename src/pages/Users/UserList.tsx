import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { Eye, Shield, User as UserIcon } from 'lucide-react';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Users</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">ID</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Username</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Email</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Full Name</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Role</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Joined</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-6 text-sm text-gray-900">#{user.id}</td>
                <td className="py-3 px-6 text-sm font-medium text-gray-900">{user.username}</td>
                <td className="py-3 px-6 text-sm text-gray-600">{user.email}</td>
                <td className="py-3 px-6 text-sm text-gray-600">{user.full_name || '-'}</td>
                <td className="py-3 px-6">
                  {user.is_admin ? (
                    <span className="flex items-center space-x-1 text-purple-700">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Admin</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-gray-600">
                      <UserIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">User</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-6 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-6">
                  <Link
                    to={`/users/${user.id}`}
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

export default UserList;