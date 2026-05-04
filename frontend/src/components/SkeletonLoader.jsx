import React from 'react'

export const RouteSkeleton = () => (
  <div className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5 animate-pulse">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-6 w-32 rounded-lg bg-slate-200"></div>
          <div className="h-5 w-16 rounded-full bg-slate-200"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200"></div>
          <div className="h-4 w-24 rounded bg-slate-200"></div>
          <div className="h-4 w-2 rounded bg-slate-200"></div>
          <div className="h-4 w-20 rounded bg-slate-200"></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="h-12 rounded-2xl bg-slate-200"></div>
          <div className="h-12 rounded-2xl bg-slate-200"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200"></div>
          <div className="h-4 w-28 rounded bg-slate-200"></div>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <div className="mb-2 h-4 w-12 rounded bg-slate-200"></div>
        <div className="h-8 w-16 rounded-lg bg-slate-200"></div>
        <div className="mt-2 h-4 w-20 rounded bg-slate-200"></div>
      </div>
    </div>
  </div>
)

export const TicketSkeleton = () => (
  <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:p-5 animate-pulse">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-6 w-24 rounded-lg bg-slate-200"></div>
          <div className="h-5 w-16 rounded-full bg-slate-200"></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="h-16 rounded-2xl bg-slate-200"></div>
          <div className="h-16 rounded-2xl bg-slate-200"></div>
          <div className="h-16 rounded-2xl bg-slate-200"></div>
          <div className="h-16 rounded-2xl bg-slate-200"></div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
        <div>
          <div className="mb-1 h-4 w-16 rounded bg-slate-200"></div>
          <div className="h-4 w-20 rounded bg-slate-200"></div>
          <div className="h-3 w-16 rounded bg-slate-200"></div>
        </div>
        <div className="h-10 w-24 rounded-2xl bg-slate-200"></div>
      </div>
    </div>
  </div>
)

export const SeatSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-slate-200"></div>
          <div className="h-4 w-16 rounded bg-slate-200"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-slate-200"></div>
          <div className="h-4 w-12 rounded bg-slate-200"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-slate-200"></div>
          <div className="h-4 w-12 rounded bg-slate-200"></div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 rounded bg-slate-200"></div>
        <div className="h-6 w-16 rounded-lg bg-slate-200"></div>
      </div>
    </div>
    
    <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="mb-4 h-10 w-32 rounded-xl bg-slate-200 mx-auto"></div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((row) => (
          <div key={row} className="rounded-2xl bg-white/80 px-3 py-3">
            <div className="mb-2 flex justify-between">
              <div className="h-4 w-12 rounded bg-slate-200"></div>
              <div className="h-4 w-8 rounded bg-slate-200"></div>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((seat) => (
                <div key={seat} className="h-8 w-8 rounded bg-slate-200"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-5 h-2 rounded-full bg-slate-200"></div>
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 px-5 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="h-6 w-32 rounded-full bg-white/20"></div>
          <div className="h-10 w-64 rounded bg-white/20"></div>
          <div className="h-4 w-96 rounded bg-white/20"></div>
        </div>
        <div className="h-12 w-32 rounded-2xl bg-white/20"></div>
      </div>
    </div>

    {/* Metrics */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-white/70 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-emerald-200"></div>
              <div className="h-8 w-16 rounded-lg bg-emerald-200"></div>
              <div className="h-3 w-24 rounded bg-emerald-200"></div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-200"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Recent Tickets */}
    <div className="rounded-2xl border border-white/70 bg-white/90 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-32 rounded-lg bg-slate-200"></div>
        <div className="h-6 w-24 rounded-full bg-slate-200"></div>
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 rounded bg-slate-200"></div>
                  <div className="h-4 w-16 rounded bg-slate-200"></div>
                </div>
                <div className="h-4 w-48 rounded bg-slate-200"></div>
                <div className="h-3 w-32 rounded bg-slate-200"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-5 w-16 rounded bg-slate-200"></div>
                <div className="h-3 w-12 rounded bg-slate-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const FormInputSkeleton = () => (
  <div className="h-12 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse"></div>
)

export const CardSkeleton = ({ height = 'h-24' }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-4 animate-pulse ${height}`}></div>
)

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="overflow-x-auto">
    <div className="w-full">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex gap-4">
          <div className="h-4 w-20 rounded bg-slate-200"></div>
          <div className="h-4 w-24 rounded bg-slate-200"></div>
          <div className="h-4 w-16 rounded bg-slate-200"></div>
        </div>
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="border-b border-slate-100 py-3">
          <div className="flex gap-4">
            <div className="h-4 w-20 rounded bg-slate-200"></div>
            <div className="h-4 w-24 rounded bg-slate-200"></div>
            <div className="h-4 w-16 rounded bg-slate-200"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default {
  RouteSkeleton,
  TicketSkeleton,
  SeatSkeleton,
  DashboardSkeleton,
  FormInputSkeleton,
  CardSkeleton,
  TableSkeleton
}
