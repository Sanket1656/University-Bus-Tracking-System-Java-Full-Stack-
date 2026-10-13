import React, { useState } from 'react';
import AdminSidebarNew from '../components/admin/AdminSidebarNew';
import TopNavbar from '../components/admin/TopNavbar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebarNew
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar
          onMobileMenuToggle={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
