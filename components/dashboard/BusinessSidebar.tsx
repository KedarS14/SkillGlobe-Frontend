'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';

const allMenuItems = [
  { icon: Home, label: 'Dashboard', href: '/business-dashboard', roles: ['Business Admin'] },
  { icon: Briefcase, label: 'Opportunity Postings', href: '/business-dashboard/job-postings', roles: ['Business Admin', 'Business User'] },
  { icon: Shield, label: 'Document Verify', href: '/business-dashboard/document-verify', roles: ['Business Admin'] },
  { icon: Settings, label: 'Admin Access', href: '/business-dashboard/business-team-member', roles: ['Business Admin'] },
];

// Helper function to get user role from localStorage
const getUserRole = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      const entityDataStr = localStorage.getItem('entity_data');
      const userDataStr = localStorage.getItem('user_data');
      
      if (entityDataStr && userDataStr) {
        const entityData = JSON.parse(entityDataStr);
        const userData = JSON.parse(userDataStr);
        
        // Get current user's email
        const currentUserEmail = userData.email;
        
        // Find user's role in business_users array
        const businessUsers = entityData.details?.business_users;
        if (businessUsers && Array.isArray(businessUsers)) {
          const currentUser = businessUsers.find(user => user.email === currentUserEmail);
          return currentUser?.role || null;
        }
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  }
  return null;
};

// Custom hook to detect mobile
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

interface BusinessSidebarProps {
  mobileOpen?: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

// Helper function to get user name from localStorage
const getUserName = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.full_name || userData.name || 'User';
      }
    } catch (error) {
      console.error('Error getting user name:', error);
    }
  }
  return 'User';
};

export default function BusinessSidebar({ mobileOpen, onCollapseChange }: BusinessSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  // Use mobileOpen prop if provided, otherwise default to true
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // open by default on desktop, closed on mobile
    }
    return false;
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  
  // Get user role and name on component mount
  useEffect(() => {
    const role = getUserRole();
    const name = getUserName();
    setUserRole(role);
    setUserName(name);
  }, []);
  
  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    if (!userRole) return true; // Show all items if role is not determined
    return item.roles.includes(userRole);
  });
  
  // Update isOpen when mobileOpen prop changes
  useEffect(() => {
    if (mobileOpen !== undefined && isMobile) {
      setIsOpen(mobileOpen);
    }
  }, [mobileOpen, isMobile]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Close sidebar on mobile when navigating
  const handleNavigate = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 h-full
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${isCollapsed && !isMobile ? 'w-24' : 'w-[310px]'}
        `}
      >
        <div className="flex flex-col h-full font-rubik overflow-hidden">
          {/* Header */}
          <div className={`flex items-center h-[85px] justify-between border-b border-gray-200 ${isCollapsed && !isMobile ? 'p-3' : 'p-4'}`}>
            {(!isCollapsed || isMobile) && (
              <Link 
                href={userRole === 'Business User' ? '/business-dashboard/job-postings' : '/business-dashboard'} 
                className="flex items-center space-x-2"
              >
                <div className="relative w-40 h-40">
                  <Image 
                    src="/Images/logo_image.jpg" 
                    alt="SkillGlobe Logo" 
                    fill 
                    className="object-contain"
                  />
                </div>
              </Link>
            )}
            
            {isCollapsed && !isMobile && (
              <div className="relative w-8 h-8 mx-auto">
                <Image 
                  src="/Images/favicon/apple-touch-icon.png"
                  alt="SkillGlobe Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
            )}
            
            {isMobile && (
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            )}
            
            {!isMobile && (
              <button 
                onClick={() => {
                  const newCollapsed = !isCollapsed;
                  setIsCollapsed(newCollapsed);
                  onCollapseChange?.(newCollapsed);
                }}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
          </div>
          
          {/* Welcome Section */}
          {(!isCollapsed || isMobile) && (
            <div className="p-4 space-y-4">
              {/* Welcome Message */}
              {/* <div className="bg-blue-100 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Welcome back, {userName.split(' ')[0]}
                </h3>
              </div> */}

              {/* Early Access Member */}
              <div className="bg-green-500 rounded-lg p-4 text-white">
                <div className="flex items-center space-x-2 mb-2">
                  <Star size={20} className="fill-current" />
                  <span className="font-semibold">Early Access Member</span>
                </div>
                <p className="text-sm text-green-100">
                  You're helping us build SkillGlobe
                </p>
              </div>

              {/* Boost Your Chances */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star size={16} className="text-pink-500" />
                    <span className="font-semibold text-gray-900">Boost Your Chances</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center relative group cursor-pointer min-h-[180px]">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star size={24} className="text-white fill-current" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Section Coming Soon
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Enhance your profile visibility with personalized recommendations
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Hover to preview</span> upcoming features
                  </p>
                  
                  {/* Hover Preview */}
                  <div className="absolute inset-0 bg-white rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-gray-200 shadow-xl z-10 overflow-y-auto min-h-[450px]">
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 mb-4 text-sm text-center">
                        Boost Your Chances
                      </h5>
                      
                      {/* Feature 1 */}
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Briefcase size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Enhanced Job Matching</p>
                          <p className="text-xs text-blue-600">Find better candidates</p>
                          <p className="text-xs text-gray-500">Coming soon →</p>
                        </div>
                      </div>

                      {/* Feature 2 */}
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrendingUp size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Analytics Dashboard</p>
                          <p className="text-xs text-green-600">Track performance</p>
                          <p className="text-xs text-gray-500">Add now →</p>
                        </div>
                      </div>

                      {/* Feature 3 */}
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Team Collaboration</p>
                          <p className="text-xs text-orange-600">Streamline hiring</p>
                          <p className="text-xs text-gray-500">Upload →</p>
                        </div>
                      </div>

                      {/* Feature 4 */}
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Smart Verification</p>
                          <p className="text-xs text-purple-600">Auto-verify profiles</p>
                          <p className="text-xs text-gray-500">Start test →</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
