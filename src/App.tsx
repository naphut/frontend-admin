import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { Toaster } from 'react-hot-toast';
import AdminNavbar from './components/AdminNavbar';
import AdminSidebar from './components/AdminSidebar';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import ProductForm from './pages/Products/ProductForm';
import ProductEdit from './pages/Products/ProductEdit';
import CategoryList from './pages/Categories/CategoryList';
import CategoryForm from './pages/Categories/CategoryForm';
import OrderList from './pages/Orders/OrderList';
import UserList from './pages/Users/UserList';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AdminRegister from './pages/AdminRegister';
import { useAdminAuth } from './context/AdminAuthContext';

import OrderDetail from './pages/Orders/OrderDetail';
// import UserDetail from './pages/Users/UserDetail';
import ReviewList from './pages/Reviews/ReviewList';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAdminAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AdminRegister />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </PrivateRoute>
          } />
          
          <Route path="/products" element={
            <PrivateRoute>
              <AdminLayout>
                <ProductList />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/products/new" element={
            <PrivateRoute>
              <AdminLayout>
                <ProductForm />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/products/:id/edit" element={
            <PrivateRoute>
              <AdminLayout>
                <ProductEdit />
              </AdminLayout>
            </PrivateRoute>
          } />
          
          <Route path="/categories" element={
            <PrivateRoute>
              <AdminLayout>
                <CategoryList />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/categories/new" element={
            <PrivateRoute>
              <AdminLayout>
                <CategoryForm />
              </AdminLayout>
            </PrivateRoute>
          } />
          
          <Route path="/orders" element={
            <PrivateRoute>
              <AdminLayout>
                <OrderList />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/orders/:id" element={
            <PrivateRoute>
              <AdminLayout>
                <OrderDetail />
              </AdminLayout>
            </PrivateRoute>
          } />
          
          <Route path="/users" element={
            <PrivateRoute>
              <AdminLayout>
                <UserList />
              </AdminLayout>
            </PrivateRoute>
          } />
          {/* លុប Route /users/:id ចេញសិន */}
          
          <Route path="/reviews" element={
            <PrivateRoute>
              <AdminLayout>
                <ReviewList />
              </AdminLayout>
            </PrivateRoute>
          } />
          
          <Route path="/settings" element={
            <PrivateRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;