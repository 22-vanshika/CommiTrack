import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ShoppingCartIcon,
  DocumentChartBarIcon,
  ArrowUturnLeftIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import logo from '../../logo.png';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Agent Management', href: '/agents', icon: UsersIcon },
  { name: 'Sales Management', href: '/sales', icon: ShoppingCartIcon },
  { name: 'Commission Reports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Clawback Management', href: '/clawbacks', icon: ArrowUturnLeftIcon },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(to bottom right, var(--color-bgBase), var(--color-bgDark), var(--color-bgBase))',
      }}
    >
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}
      >
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-64 flex-col transform transition-transform bg-bgsidebar ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-9 w-9" />
              <h1 className="text-xl font-bold text-textprimary">
                Commission <span className="text-primary">System</span>
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="transition-colors text-textmuted hover:text-textprimary"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 py-6">
            <h2 className="px-6 text-xs font-semibold uppercase tracking-wider mb-6 text-textSubtle">
              MENU
            </h2>
            <nav>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-6 text-sm font-medium transition-all duration-200 `}
                    style={{
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      backgroundColor: isActive
                        ? 'var(--color-bgDark)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--color-textPrimary)'
                        : 'var(--color-textMuted)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          'var(--color-bgCardHover)';
                        e.currentTarget.style.color =
                          'var(--color-textPrimary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-textMuted)';
                      }
                    }}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                        isActive ? '' : 'group-hover:scale-110'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow overflow-y-auto bg-bgsidebar">
          <div className="flex items-center flex-shrink-0 px-6 py-6 gap-3">
            <img src={logo} alt="Logo" className="h-9 w-9" />
            <h1 className="text-xl font-bold text-textprimary">
              Commission <span className="text-primary">System</span>
            </h1>
          </div>

          <div className="flex-1 py-6">
            <h2 className="px-6 text-xs font-semibold uppercase tracking-wider mb-3 text-textsubtl">
              MENU
            </h2>
            <nav>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex py-5 items-center px-6 text-sm font-medium transition-all duration-200 ${isActive ? 'nav-link-active' : ''}`}
                    style={{
                      backgroundColor: isActive
                        ? 'var(--color-bgDark)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--color-textPrimary)'
                        : 'var(--color-textMuted)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          'var(--color-bgCardHover)';
                        e.currentTarget.style.color =
                          'var(--color-textPrimary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-textMuted)';
                      }
                    }}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                        isActive ? '' : 'group-hover:scale-110'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
        <div
          className="sticky top-0 z-10 flex-shrink-0 flex h-16 backdrop-blur-md lg:hidden shadow-custom-lg"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 focus:outline-none focus:ring-2 focus:ring-inset transition-colors text-textmuted hover:text-textprimary"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-7 w-7" />
              <h1 className="text-lg font-semibold text-textprimary">
                Commission System
              </h1>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
