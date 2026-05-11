"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/utils/api";
import { CalendarDays, Wallet, ArrowUpRight, ArrowDownRight, IndianRupee, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

type ReportData = {
  period: string;
  admissions: {
    total: number;
    pending: number;
    approved: number;
  };
  fees: {
    collectedInPeriod: number;
    totalCollectedOverall: number;
    totalDuesOverall: number;
    totalExpectedFee: number;
    upcomingAmount: number;
  };
  chartData: Array<{
    label: string;
    admissions: number;
    revenue: number;
  }>;
  courseDistribution: Array<{
    name: string;
    value: number;
  }>;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AtcReports() {
  const [period, setPeriod] = useState<"today" | "weekly" | "monthly" | "all-time">("all-time");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch(`/api/atc/reports?period=${period}`)
      .then(r => r.json())
      .then(res => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [period]);

  if (!data && loading) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-3xl border border-slate-100">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-green-600 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const maxRevenue = Math.max(...data.chartData.map(d => d.revenue), 1);
  const maxAdmissions = Math.max(...data.chartData.map(d => d.admissions), 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
             <CalendarDays className="text-green-600" /> Analytical Reports
           </h3>
           <p className="text-xs text-slate-500 font-medium">Detailed breakdown of admissions and revenue collection.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["today", "weekly", "monthly", "all-time"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-1.5 text-xs font-bold capitalize rounded-lg transition-all ${
                period === p 
                  ? "bg-white text-green-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Admission Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Users size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admissions ({period})</p>
            <div className="flex items-end gap-2">
               <h4 className="text-3xl font-black text-slate-800">{data.admissions.total}</h4>
               {data.admissions.total > 0 ? (
                 <span className="flex items-center text-xs font-bold text-emerald-600 mb-1"><ArrowUpRight size={14} /> Active</span>
               ) : (
                 <span className="flex items-center text-xs font-bold text-slate-400 mb-1">No data</span>
               )}
            </div>
          </div>
        </div>

        {/* Revenue Collected in Period */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-100 transition">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <IndianRupee size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Collection ({period})</p>
            <h4 className="text-3xl font-black text-emerald-700">₹{data.fees.collectedInPeriod.toLocaleString()}</h4>
          </div>
        </div>

        {/* Remaining Dues */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-100 transition">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <ArrowDownRight size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Dues (Overall)</p>
            <h4 className="text-3xl font-black text-rose-600">₹{data.fees.totalDuesOverall.toLocaleString()}</h4>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
               <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.fees.totalDuesOverall / (data.fees.totalExpectedFee || 1)) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Upcoming Installments */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-100 transition">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <Wallet size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upcoming Collections</p>
            <h4 className="text-3xl font-black text-amber-600">₹{data.fees.upcomingAmount.toLocaleString()}</h4>
            <p className="text-xs text-amber-700/70 font-medium mt-1">Expected soon</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Revenue Trend</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fee collected over time</p>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee size={16} />
             </div>
           </div>

           <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                    labelStyle={{ fontWeight: 'black', color: '#1e293b', marginBottom: '4px' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Admissions Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Admissions Volume</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Student enrollment trend</p>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={16} />
             </div>
           </div>

           <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                    labelStyle={{ fontWeight: 'black', color: '#1e293b', marginBottom: '4px' }}
                    formatter={(value: any) => [value, 'Students Enrolled']}
                  />
                  <Bar dataKey="admissions" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* Course & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Popular Courses Donut Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm lg:col-span-2 flex flex-col sm:flex-row gap-6 items-center">
           <div className="w-full sm:w-1/2">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users size={16} />
               </div>
               <div>
                 <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Popular Courses</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top Enrolled Courses</p>
               </div>
             </div>
             <p className="text-sm text-slate-500 font-medium mb-4">
               This chart breaks down your admissions based on the course enrolled. Use this data to optimize your training offerings.
             </p>
           </div>
           
           <div className="h-64 w-full sm:w-1/2">
             {data.courseDistribution && data.courseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.courseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.courseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                      itemStyle={{ fontWeight: 'black', color: '#1e293b' }}
                      formatter={(val: any) => [`${val} Students`, 'Enrolled']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No Course Data
                </div>
             )}
           </div>
        </div>

        {/* Admission Approval Status */}
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 shadow-sm text-white flex flex-col justify-between">
           <div>
             <h4 className="font-black text-lg uppercase tracking-tight text-white mb-1">Approval Status</h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Period ({period})</p>
           </div>
           
           <div className="space-y-6 mt-8">
             <div>
               <div className="flex justify-between text-xs font-bold mb-2">
                 <span className="text-emerald-400">Approved</span>
                 <span>{data.admissions.approved}</span>
               </div>
               <div className="w-full bg-white/10 rounded-full h-2">
                 <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, (data.admissions.approved / (data.admissions.total || 1)) * 100)}%` }}></div>
               </div>
             </div>
             
             <div>
               <div className="flex justify-between text-xs font-bold mb-2">
                 <span className="text-amber-400">Pending Review</span>
                 <span>{data.admissions.pending}</span>
               </div>
               <div className="w-full bg-white/10 rounded-full h-2">
                 <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, (data.admissions.pending / (data.admissions.total || 1)) * 100)}%` }}></div>
               </div>
             </div>
             
             <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
               <span className="text-xs font-bold text-slate-400">Total Admissions</span>
               <span className="text-2xl font-black">{data.admissions.total}</span>
             </div>
           </div>
        </div>

      </div>

    </div>
  );
}
