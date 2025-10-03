'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, X, Eye, EyeOff, Search } from 'lucide-react';
import BusinessSidebar from '@/components/dashboard/BusinessSidebar';
import BusinessDashboardHeader from '@/components/dashboard/BusinessDashboardHeader';
import Image from 'next/image';
import { useAddMemberStore } from '@/store/add-member/addmemberStore';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
};

export default function AdminAccessPage() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);

  // Store state
  const { 
    addMemberToTeam, 
    isLoading, 
    error, 
    success, 
    resetState,
    members,
    isLoadingMembers,
    membersError,
    fetchBusinessMembers,
    deactivateMember,
    isDeactivating,
    deactivateError,
    deactivateSuccess,
    searchQuery,
    setSearchQuery
  } = useAddMemberStore();

  // Fetch members on component mount
  useEffect(() => {
    fetchBusinessMembers();
  }, [fetchBusinessMembers]);
  
  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinessMembers();
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [searchQuery, fetchBusinessMembers]);

  // Handle success state
  useEffect(() => {
    if (success) {
      // Refresh the members list after successful addition
      fetchBusinessMembers();
      setTimeout(() => {
        closeModal();
      }, 1500); // Close modal after showing success message
    }
  }, [success, fetchBusinessMembers]);

  // Convert API members to TeamMember format for UI compatibility
  const teamMembers: TeamMember[] = members.map((member, index) => ({
    id: member.name, // Using the BTM ID as unique identifier
    name: member.full_name,
    role: member.role,
    email: member.email,
    avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
  }));

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentMember(null);
    setName('');
    setPassword('');
    setEmail('');
    setSendWelcomeEmail(false);
    resetState();
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setIsEditMode(true);
    setCurrentMember(member);
    setName(member.name);
    setPassword('');
    setEmail(member.email);
    setSendWelcomeEmail(false);
    resetState();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !password || !email) {
      alert('Please fill in all fields');
      return;
    }

    if (isEditMode && currentMember) {
      // TODO: Implement edit member API call
      // For now, just close the modal and refresh the list
      closeModal();
      fetchBusinessMembers();
    } else {
      // Add new member via API
      await addMemberToTeam({
        email,
        full_name: name,
        password,
        send_welcome_email: sendWelcomeEmail
      });
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setMemberToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMemberToDelete('');
  };

  const handleRemove = async () => {
    try {
      // Call the deactivateMember function from the store
      await deactivateMember(memberToDelete);
      
      // Close the modal after successful deactivation
      closeDeleteModal();
      fetchBusinessMembers();
    } catch (error) {
      console.error('Error deactivating member:', error);
      // Keep the modal open if there's an error
    }
  };

  // Handle sidebar collapse change
  const handleSidebarCollapseChange = (isCollapsed: boolean) => {
    setSidebarCollapsed(isCollapsed);
  };

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
    <div className="flex h-screen bg-gray-50 font-rubik">
      {isSidebarVisible && <BusinessSidebar onCollapseChange={handleSidebarCollapseChange} />}
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 w-full ${isSidebarVisible ? (sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-[310px]') : 'ml-0'}`}>
        <BusinessDashboardHeader 
          title="Admin Access" 
          onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} 
        />
        
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 pb-20 lg:pb-6 w-full">
          <div className="max-w-full mx-auto bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
            <div className="flex justify-between items-center mb-6 mt-5">
           
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <button
  onClick={openAddModal}
  className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center justify-center
             p-3 md:py-2 md:px-4"
>
  <UserPlus size={18} className="mr-0 md:mr-2" />
  <span className="hidden md:inline">Add Member</span>
</button>

            </div>

            {/* Loading State */}
            {isLoadingMembers && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading team members...</span>
              </div>
            )}

            {/* Error State */}
            {membersError && !isLoadingMembers && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <Users size={48} className="mx-auto mb-2" />
                  <p className="text-lg font-medium">Failed to load team members</p>
                  <p className="text-sm text-gray-600 mt-1">{membersError}</p>
                </div>
                <button
                  onClick={() => fetchBusinessMembers()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingMembers && !membersError && teamMembers.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto mb-4 text-gray-400" />
                {searchQuery ? (
                  <>
                    <p className="text-lg font-medium text-gray-600">No team members match your search</p>
                    <p className="text-sm text-gray-500 mt-1">Try a different search term or clear the search</p>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        fetchBusinessMembers('');
                      }}
                      className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-600">No team members found</p>
                    <p className="text-sm text-gray-500 mt-1">Add your first team member to get started</p>
                  </>
                )}
              </div>
            )}

            {/* Team Members Table */}
            {!isLoadingMembers && !membersError && teamMembers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-[95%] justify-center mx-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-8 font-medium text-gray-600">NAME</th>
                      <th className="text-left py-3 px-8 font-medium text-gray-600">ROLE</th>
                      <th className="text-left py-3 px-8 font-medium text-gray-600">EMAIL</th>
                      <th className="text-left py-3 px-8 font-medium text-gray-600">STATUS</th>
                      <th className="text-left py-3 px-8 font-medium text-gray-600">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">{member.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-8 text-gray-700">{member.role}</td>
                        <td className="py-4 px-8 text-gray-700">{member.email}</td>
                        <td className="py-4 px-8">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            members.find(m => m.name === member.id)?.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {members.find(m => m.name === member.id)?.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-8 text-right">
                          <div className="flex justify-start space-x-3">
                            <button 
                              onClick={() => openDeleteModal(member.id, member.name)}
                              className="p-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors"
                              title="Deactivate member"
                            >
                              Inactive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-rubik">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Confirm inactivate
              </h3>
              <p className="text-gray-600">
                Are you sure you want to inactivate this team member?
              </p>
              
              {deactivateError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  {deactivateError}
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={closeDeleteModal}
                disabled={isDeactivating}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={isDeactivating}
                className="px-6 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              >
                {isDeactivating ? (
                  <>
                    Processing...
                  </>
                ) : (
                  'Inactivate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-rubik">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
                    Send email to member
                  </label>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  Member added successfully!
                </div>
              )}
              
              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-32 bg-[#007BCA] text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Adding...' : (isEditMode ? 'Save Changes' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}