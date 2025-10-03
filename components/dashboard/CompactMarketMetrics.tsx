'use client';

import { useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, Target, DollarSign, Brain, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useIndividualDashboardStore } from '@/store/dashboard/individualdashboardStore';

interface CompactMarketMetricsProps {
  onViewDetails?: () => void;
}

export default function CompactMarketMetrics({ onViewDetails }: CompactMarketMetricsProps) {
  const { 
    profileInsights, 
    isLoading, 
    error, 
    fetchProfileInsights, 
    clearError 
  } = useIndividualDashboardStore();

  // Fetch data on component mount
  useEffect(() => {
    fetchProfileInsights();
  }, [fetchProfileInsights]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full">
        <div className="flex items-center justify-center h-[200px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading profile insights...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state - but we'll use default values instead of showing an error
  // This ensures new users always see a clean UI with zeros
  if (error) {
    console.log('Profile insights error, using default values:', error);
    // Continue to the next section where we'll use default values
  }

  // Default values if no data
  const data = profileInsights || {
    total_matches: 0,
    great_matches: 0,
    interest_shown: 0,
    current_week_matches: 0
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full">
      {/* Compact Header with Key Metric */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Profile Insights</h3>
        </div>
      </div>

      {/* Horizontal Metrics Grid - 5 Cards based on API data */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 h-[120px]">
        {/* Total Matches */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1 mt-1">
            <Eye className="text-blue-500" size={16} />
            <span className="text-xs font-medium text-gray-600">
              →
            </span>
          </div>
          <p className="text-4xl font-bold text-blue-600">
            {data.total_matches.toLocaleString()}
          </p>
          <p className="text-sm text-gray-700 font-medium mt-1">Total Matches</p>
        </div>

        {/* Great Matches */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1 mt-1">
            <Target className="text-green-500" size={16} />
            <span className="text-xs font-medium text-green-600">
              ↑
            </span>
          </div>
          <p className="text-4xl font-bold text-green-600">
            {data.great_matches}
          </p>
          <p className="text-sm text-gray-700 font-medium mt-1">Great Matches</p>
        </div>

        {/* Interest Shown - Always 0% as per requirement */}
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1 mt-1">
            <Brain className="text-purple-500" size={16} />
            <span className="text-xs font-medium text-gray-600">
              0%
            </span>
          </div>
          <p className="text-4xl font-bold text-purple-600">
            {data.interest_shown}
          </p>
          <p className="text-sm text-gray-700 font-medium mt-1">Interest Shown</p>
        </div>

        {/* Current Week Matches */}
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1 mt-1">
            <TrendingUp className="text-yellow-600" size={16} />
            <span className="text-xs font-medium text-blue-600">
              New
            </span>
          </div>
          <p className="text-4xl font-bold text-yellow-600">
            {data.current_week_matches}
          </p>
          <p className="text-sm text-gray-700 font-medium mt-1">This Week</p>
        </div>

        {/* Response Rate - Always 0% */}
        {/* <div className="bg-indigo-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1 mt-1">
            <Brain className="text-indigo-500" size={16} />
            <span className="text-xs font-medium text-gray-600">
              0%
            </span>
          </div>
          <p className="text-4xl font-bold text-indigo-600">
            0%
          </p>
          <p className="text-sm text-gray-700 font-medium mt-1">Response Rate</p>
        </div> */}
      </div>
    </div>
  );
}