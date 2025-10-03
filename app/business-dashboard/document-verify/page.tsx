'use client';

import { useState } from 'react';
import { Shield, Upload, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';
import BusinessSidebar from '@/components/dashboard/BusinessSidebar';
import BusinessDashboardHeader from '@/components/dashboard/BusinessDashboardHeader';

export default function DocumentVerifyPage() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState('');

  const documentTypes = [
    { 
      id: 'gstin', 
      name: 'GSTIN', 
      icon: FileText, 
      description: 'Preferred for businesses',
      placeholder: 'Enter 15-digit GSTIN'
    },
    { 
      id: 'pan', 
      name: 'PAN Card', 
      icon: FileText, 
      description: 'Alternative for startups',
      placeholder: 'Enter 10-character PAN'
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleVerify = async () => {
    if (!selectedDoc || !documentNumber) {
      alert('Please select document type and enter document number');
      return;
    }

    setIsVerifying(true);
    
    // Simulate API verification
    setTimeout(() => {
      setIsVerifying(false);
      // Simulate different verification outcomes
      const outcomes = ['verified', 'partially-verified', 'not-verified'];
      const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      setVerificationStatus(randomOutcome);
    }, 3000);
  };

  // Handle sidebar collapse change
  const handleSidebarCollapseChange = (isCollapsed: boolean) => {
    setSidebarCollapsed(isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-rubik">
      {isSidebarVisible && <BusinessSidebar onCollapseChange={handleSidebarCollapseChange} />}
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 w-full ${isSidebarVisible ? (sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-[310px]') : 'ml-0'}`}>
        <BusinessDashboardHeader 
          title="My Identity" 
          onMenuClick={() => setIsSidebarVisible(!isSidebarVisible)} 
        />
        
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 pb-20 lg:pb-6 w-full">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-green-600" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Organization Document Verification
                </h1>
                <p className="text-gray-600">
                  Verify your organization authenticity with government-issued documents
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mt-2">
                  Enhances credibility with clients
                </div>
              </div>

              {!verificationStatus ? (
                <div className="space-y-4">
                  {/* Document Type Selection */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Select Document Type</h3>
                    <div className="space-y-3">
                      {documentTypes.map((doc) => {
                        const Icon = doc.icon;
                        return (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              selectedDoc === doc.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className={selectedDoc === doc.id ? 'text-blue-600' : 'text-gray-600'} size={20} />
                              <div>
                                <p className="font-medium text-gray-900">{doc.name}</p>
                                <p className="text-sm text-gray-600">{doc.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document Number Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Number
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder={selectedDoc ? documentTypes.find(d => d.id === selectedDoc)?.placeholder : "Select document type first"}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      disabled={!selectedDoc}
                    />
                  </div>

                  {/* Document Upload */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Upload Document Scan</h3>
                    <label className="block w-full">
                      <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        uploadedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                      }`}>
                        {!uploadedFile ? (
                          <>
                            <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                            <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (max 5MB)</p>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mx-auto text-green-500 mb-2" size={24} />
                            <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
                            <p className="text-xs text-green-600 mt-1">File uploaded successfully</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Verify Button */}
                  <div className="flex items-center justify-center">
                  <button
                    onClick={handleVerify}
                    disabled={!selectedDoc || !documentNumber || isVerifying}
                    className={`w-60 flex items-center justify-center bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 transition-all duration-300 ${
                      !selectedDoc || !documentNumber || isVerifying ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying with Government Database...
                      </>
                    ) : (
                      'Verify Document'
                    )}
                  </button>
                  </div>

                  {/* Security Note */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Shield className="text-blue-600 mt-0.5" size={16} />
                      <div className="text-sm">
                        <p className="text-blue-900 font-medium mb-1">Secure Verification Process</p>
                        <p className="text-blue-700">
                          We use authorized government APIs for real-time verification. Your documents are encrypted and only verification status is stored.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {verificationStatus === 'verified' && (
                    <>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Complete!</h3>
                      <p className="text-gray-600 mb-4">Your business document has been successfully verified</p>
                      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <p className="text-green-800 font-medium">✓ Verified Business Status</p>
                        <p className="text-green-700 text-sm">Enhanced credibility and trust with clients</p>
                      </div>
                    </>
                  )}

                  {verificationStatus === 'partially-verified' && (
                    <>
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-yellow-600" size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Partially Verified</h3>
                      <p className="text-gray-600 mb-4">Your document has been validated through basic checks</p>
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <p className="text-yellow-800 font-medium">⚠ Partially Verified Status</p>
                        <p className="text-yellow-700 text-sm">Basic validation completed, enhanced verification available later</p>
                      </div>
                    </>
                  )}

                  {verificationStatus === 'not-verified' && (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="text-red-600" size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h3>
                      <p className="text-gray-600 mb-4">Unable to verify the document. You can retry or continue without verification</p>
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <p className="text-red-800 font-medium">✗ Verification Failed</p>
                        <p className="text-red-700 text-sm">Please check document details or try alternative verification</p>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => setVerificationStatus('')}
                    className="mt-4 bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 transition-all duration-300"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
