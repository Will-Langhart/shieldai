import React, { useState } from 'react';
import { X, Calendar, Tag, Zap, Clock, Filter } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  topic: string;
  responseMode: 'all' | 'fast' | 'accurate';
  sortBy: 'date' | 'title' | 'length';
  sortOrder: 'asc' | 'desc';
}

export default function FilterModal({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      dateRange: 'all',
      topic: '',
      responseMode: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    onApplyFilters(defaultFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-shield-gray/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-shield-white flex items-center space-x-2">
            <Filter size={20} />
            <span>Filter Conversations</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-shield-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
              <Calendar size={16} />
              <span>Date Range</span>
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
              className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="px-3 py-2 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
                />
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="px-3 py-2 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
              <Tag size={16} />
              <span>Topic</span>
            </label>
            <input
              type="text"
              value={filters.topic}
              onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              placeholder="Filter by topic (e.g., theology, philosophy)"
              className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
            />
          </div>

          {/* Response Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
              <Zap size={16} />
              <span>Response Mode</span>
            </label>
            <select
              value={filters.responseMode}
              onChange={(e) => setFilters({ ...filters, responseMode: e.target.value as any })}
              className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
            >
              <option value="all">All Modes</option>
              <option value="fast">Fast</option>
              <option value="accurate">Accurate</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                <Clock size={16} />
                <span>Sort By</span>
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="length">Length</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
                className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-3 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-shield-light-gray/30 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 bg-shield-blue text-shield-white rounded-lg hover:bg-shield-blue/90 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
} 