import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Wrench,
  Users,
  BellRing,
  PhoneCall,
  Settings,
  ShieldCheck,
  AlertTriangle,
  History,
  BarChart3,
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getNavLinks = () => {
    switch (role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Raise Complaint', path: '/complaints/new', icon: PlusCircle, highlight: true },
          { name: 'My Complaints', path: '/complaints', icon: ClipboardList },
          { name: 'Hostel Notices', path: '/notices', icon: BellRing },
          { name: 'Hostel Contacts', path: '/contacts', icon: PhoneCall },
        ];

      case 'STAFF':
        return [
          { name: 'Staff Workboard', path: '/staff/dashboard', icon: LayoutDashboard },
          { name: 'Assigned Complaints', path: '/complaints', icon: Wrench },
          { name: 'Hostel Notices', path: '/notices', icon: BellRing },
          { name: 'Hostel Contacts', path: '/contacts', icon: PhoneCall },
        ];

      case 'CARETAKER':
        return [
          { name: 'Caretaker Board', path: '/caretaker/dashboard', icon: LayoutDashboard },
          { name: 'All Complaints', path: '/complaints', icon: ClipboardList },
          { name: 'Overdue Tickets', path: '/complaints?status=overdue', icon: AlertTriangle },
          { name: 'Staff Management', path: '/staff-assignment', icon: Wrench },
          { name: 'Hostel Notices', path: '/notices', icon: BellRing },
          { name: 'Hostel Contacts', path: '/contacts', icon: PhoneCall },
        ];

      case 'HOSTEL_REPRESENTATIVE':
        return [
          { name: 'Representative Desk', path: '/rep/dashboard', icon: LayoutDashboard },
          { name: 'Hostel Complaints', path: '/complaints', icon: ClipboardList },
          { name: 'Unresolved Issues', path: '/complaints?status=unresolved', icon: AlertTriangle },
          { name: 'Hostel Notices', path: '/notices', icon: BellRing },
          { name: 'Hostel Contacts', path: '/contacts', icon: PhoneCall },
        ];

      case 'ADMIN':
      case 'WARDEN':
        return [
          { name: 'Administrative Center', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'All Complaints', path: '/complaints', icon: ClipboardList },
          { name: 'Overdue Complaints', path: '/complaints?status=overdue', icon: AlertTriangle },
          { name: 'SLA Configuration', path: '/admin/sla', icon: Settings },
          { name: 'Manage Users', path: '/admin/users', icon: Users },
          { name: 'Publish Notices', path: '/notices', icon: BellRing },
          { name: 'Hostel Directory', path: '/contacts', icon: PhoneCall },
          { name: 'Audit Logs', path: '/admin/audit', icon: History },
        ];

      default:
        return [
          { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden backdrop-blur-xs"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } pt-16 flex flex-col justify-between border-r border-slate-800`}
      >
        <div className="px-4 py-4 space-y-6 overflow-y-auto">
          {/* User profile snippet */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center font-bold text-white text-base shadow">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">
                {user.role.toLowerCase().replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Navigation Menu
            </div>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      item.highlight
                        ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm font-semibold'
                        : isActive
                        ? 'bg-slate-800 text-white border-l-4 border-brand-500 pl-2.5'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Hostel Ops System Active</span>
          </div>
          <div className="mt-1 text-slate-400">Campus Residence Services v1.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
