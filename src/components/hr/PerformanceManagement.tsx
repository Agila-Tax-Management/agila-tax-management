'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Star, TrendingUp } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  PERFORMANCE_REVIEWS, PerformanceReview, PerformanceRating,
} from '@/lib/mock-hr-data';

const RATING_VARIANT: Record<PerformanceRating, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  Outstanding: 'success',
  'Exceeds Expectations': 'info',
  'Meets Expectations': 'neutral',
  'Needs Improvement': 'warning',
  Unsatisfactory: 'danger',
};

const RATING_STARS: Record<PerformanceRating, number> = {
  Outstanding: 5,
  'Exceeds Expectations': 4,
  'Meets Expectations': 3,
  'Needs Improvement': 2,
  Unsatisfactory: 1,
};

export function PerformanceManagement() {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('All');
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const filtered = useMemo(() => {
    return PERFORMANCE_REVIEWS.filter(review => {
      const matchSearch = review.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        review.department.toLowerCase().includes(search.toLowerCase());
      const matchRating = ratingFilter === 'All' || review.rating === ratingFilter;
      return matchSearch && matchRating;
    });
  }, [search, ratingFilter]);

  const ratingCounts = PERFORMANCE_REVIEWS.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Performance Management</h1>
        <p className="text-sm text-slate-500 mt-1">Track employee performance reviews & ratings</p>
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory'] as PerformanceRating[]).map(rating => (
          <Card key={rating} className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRatingFilter(ratingFilter === rating ? 'All' : rating)}>
            <div className="flex justify-center mb-2">
              {Array.from({ length: RATING_STARS[rating] }).map((_, i) => (
                <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
              ))}
              {Array.from({ length: 5 - RATING_STARS[rating] }).map((_, i) => (
                <Star key={i} size={14} className="text-slate-200" />
              ))}
            </div>
            <p className="text-xl font-black text-slate-900">{ratingCounts[rating] || 0}</p>
            <p className="text-[9px] text-slate-400 uppercase font-bold mt-1 leading-tight">{rating}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or department..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
            >
              <option value="All">All Ratings</option>
              <option value="Outstanding">Outstanding</option>
              <option value="Exceeds Expectations">Exceeds Expectations</option>
              <option value="Meets Expectations">Meets Expectations</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="Unsatisfactory">Unsatisfactory</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(review => (
          <Card key={review.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-black">
                  {review.employeeName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{review.employeeName}</p>
                  <p className="text-[11px] text-slate-400">{review.department} • {review.reviewPeriod}</p>
                </div>
              </div>
              <Badge variant={RATING_VARIANT[review.rating]} className="text-[9px]">{review.rating}</Badge>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: RATING_STARS[review.rating] }).map((_, i) => (
                <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
              ))}
              {Array.from({ length: 5 - RATING_STARS[review.rating] }).map((_, i) => (
                <Star key={i} size={14} className="text-slate-200" />
              ))}
            </div>

            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{review.comments}</p>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400">Reviewed by: {review.reviewerName}</p>
              <Button variant="ghost" onClick={() => setSelectedReview(review)} className="text-xs">
                <Eye size={14} className="mr-1" /> View
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">No reviews found</div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedReview} onClose={() => setSelectedReview(null)} title="Performance Review Details" size="lg">
        {selectedReview && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-4rem)]">
            <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-xl">
              <div className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center text-lg font-black">
                {selectedReview.employeeName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900">{selectedReview.employeeName}</h3>
                <p className="text-sm text-slate-500">{selectedReview.department} • {selectedReview.reviewPeriod}</p>
              </div>
              <div className="text-right">
                <Badge variant={RATING_VARIANT[selectedReview.rating]}>{selectedReview.rating}</Badge>
                <div className="flex gap-0.5 mt-1 justify-end">
                  {Array.from({ length: RATING_STARS[selectedReview.rating] }).map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Review Date</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{selectedReview.reviewDate}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Reviewer</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{selectedReview.reviewerName}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Goals</p>
              <ul className="space-y-1">
                {selectedReview.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <TrendingUp size={14} className="text-rose-500 mt-0.5 shrink-0" />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Strengths</p>
                <ul className="space-y-1">
                  {selectedReview.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Areas for Improvement</p>
                <ul className="space-y-1">
                  {selectedReview.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Comments</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedReview.comments}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
