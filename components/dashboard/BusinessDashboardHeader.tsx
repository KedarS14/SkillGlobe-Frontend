'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  MessageCircle,
  ChevronDown,
  Settings,
  User,
  HelpCircle,
  LogOut,
  Building2,
  Menu,
  Home,
  Briefcase,
  Shield
} from 'lucide-react';
import useOutsideClick from '@/hooks/useOutsideClick';
import { useAuthStore } from '@/store/authStore';

interface BusinessDashboardHeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

// Menu items for sidebar navigation
const sidebarMenuItems = [
  { icon: Home, label: 'Dashboard', href: '/business-dashboard' },
  { icon: Briefcase, label: 'Opportunity Posting', href: '/business-dashboard/job-postings' },
  { icon: Shield, label: 'Document Verify', href: '/business-dashboard/document-verify' },
  { icon: Settings, label: 'Admin Access', href: '/business-dashboard/business-team-member' },
];

export default function BusinessDashboardHeader({ title, onMenuClick }: BusinessDashboardHeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Get user data from auth store
  const { user: authUser, isAuthenticated } = useAuthStore();
  
  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    if (!name) return 'B';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useOutsideClick(profileRef, () => setShowProfile(false));
  useOutsideClick(notificationsRef, () => setShowNotifications(false));

  const notifications = [
    { id: 1, title: 'New applicant for Frontend Developer', time: '5 min ago', unread: true },
    { id: 2, title: 'Interview scheduled with John Doe', time: '1 hour ago', unread: true },
    { id: 3, title: 'Job posting expires tomorrow', time: '2 hours ago', unread: false },
  ];

  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);

      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }, []);

    return isMobile;
  };

  const isMobile = useIsMobile();

  return (
    <>
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-30 font-rubik h-[85px] w-full">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 w-full">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button - Toggle Sidebar */}
          <div className="relative">
           {isMobile && ( 
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            )}
            {/* Menu button now toggles the sidebar directly */}
          </div>
          
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center">
            <div className="relative w-32 h-8">
              <Image 
                src="/Images/logo_image.jpg" 
                alt="SkillGlobe Logo" 
                fill 
                className="object-contain"
              />
            </div>
          </div>

          {/* Sidebar Navigation Menu - Desktop */}
          <div className="hidden lg:flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
            {sidebarMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.href;
              
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>


          {/* Search Bar - Desktop */}
          {/* <div className="hidden md:block relative ml-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search opportunities, documents..."
              className="pl-10 pr-4 py-2 w-80 bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
          </div> */}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Mobile Search */}
          {/* <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" aria-label="Search">
            <Search size={20} />
          </button> */}

          {/* Messages */}
          {/* <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" aria-label="Messages (2 unread)">
            <MessageCircle size={20} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </button> */}

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            {/* <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Notifications (2 unread)"
              aria-expanded={showNotifications}
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </button> */}

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${notification.unread ? 'bg-blue-50' : ''}`}>
                      <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <button className="text-orange-600 text-sm font-medium hover:text-orange-700">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {authUser?.user_image ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={authUser.user_image}
                    alt="Profile"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials(authUser?.full_name || authUser?.name || 'Business User')}
                </div>
              )}
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">{authUser?.full_name || authUser?.name || 'Business User'}</p>
                  <p className="text-sm text-gray-600">{authUser?.email}</p>
                  {/* {authUser?.user_type && (
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Building2 size={12} className="mr-1" />
                      <span>{authUser.user_type}</span>
                    </div>
                  )} */}
                </div>
                <div className="py-2">
                  <button
                    onClick={() => router.push('/business-dashboard/company-profile')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User size={16} className="mr-3 text-gray-500" />
                    Organization Profile
                  </button>

                  {/* <button
                    onClick={() => router.push('/business-dashboard/settings')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings size={16} className="mr-3 text-gray-500" />
                    Settings
                  </button> */}

                  {/* <button
                    onClick={() => router.push('/help')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <HelpCircle size={16} className="mr-3 text-gray-500" />
                    Help & Support
                  </button> */}

                  <hr className="my-2" />

                  <button
                    onClick={() => {
                      // Use the logout function from auth store
                      useAuthStore.getState().logout();
                      // Redirect to login page
                      router.push('/auth/login');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-3 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {sidebarMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = window.location.pathname === item.href;
          
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full px-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-600'} />
              <span className="text-xs mt-1 whitespace-nowrap text-center">{item.label}</span>
            </a>
          );
        })}
      </div>
    </div>
    </>
  );
}
