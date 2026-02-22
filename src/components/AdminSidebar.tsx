import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Star,
  Tag,
  Settings,
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-black text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-black'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{children}</span>
    </NavLink>
  );
};

const AdminSidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-2">
        <SidebarItem to="/" icon={LayoutDashboard}>
          Dashboard
        </SidebarItem>
        
        <SidebarItem to="/products" icon={Package}>
          Products
        </SidebarItem>
        
        <SidebarItem to="/categories" icon={Tag}>
          Categories
        </SidebarItem>
        
        <SidebarItem to="/orders" icon={ShoppingBag}>
          Orders
        </SidebarItem>
        
        <SidebarItem to="/users" icon={Users}>
          Users
        </SidebarItem>
        
        <SidebarItem to="/reviews" icon={Star}>
          Reviews
        </SidebarItem>
        
        <div className="pt-4 mt-4 border-t border-gray-200">
          <SidebarItem to="/settings" icon={Settings}>
            Settings
          </SidebarItem>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;