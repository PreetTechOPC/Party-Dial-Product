"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Activity,
  TrendingUp,
  Diamond,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveVenue {
  $id: string;
  venueName: string;
  city: string;
  subscriptionPlan: string;
  isVerified: boolean;
  onboardingComplete: boolean;
  status: string;
  totalLeads: number;
  $createdAt: string;
}

interface RealtimeEvent {
  type: string;
  message: string;
  time: string;
  venueId?: string;
}

const PLAN_REVENUE: Record<string, number> = {
  trial_30: 11,
  pax_0_50: Math.round(33 * 365 * 1.18),
  pax_50_100: Math.round(44 * 365 * 1.18),
  pax_100_200: Math.round(77 * 365 * 1.18),
  pax_200_500: Math.round(123 * 365 * 1.18),
  pax_500_1000: Math.round(179 * 365 * 1.18),
  pax_1000_2000: Math.round(249 * 365 * 1.18),
  pax_2000_5000: Math.round(379 * 365 * 1.18),
  pax_5000: Math.round(599 * 365 * 1.18),
};

const PLAN_LABELS: Record<string, string> = {
  trial_30: "Trial",
  pax_0_50: "0–50 PAX",
  pax_50_100: "50–100 PAX",
  pax_100_200: "100–200 PAX",
  pax_200_500: "200–500 PAX",
  pax_500_1000: "500–1000 PAX",
  pax_1000_2000: "1000–2000 PAX",
  pax_2000_5000: "2000–5000 PAX",
  pax_5000: "5000+ PAX",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("Today");
  const [venues, setVenues] = useState<LiveVenue[]>([]);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("Super Admin");
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const rawBase = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5005/api";
  const base = rawBase.replace(/\/+$/, "");
  const serverUrl = base.endsWith("/api") ? base : `${base}/api`;

  const [payments, setPayments] = useState<any[]>([]);

  const fetchLeads = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${serverUrl}/leads/user/${userId}`);
      const result = await res.json();
      if (result.status === "success") {
        setMyLeads(result.data || []);
      }
    } catch (e) {
      console.error("Error fetching employee leads:", e);
    }
  }, [serverUrl]);

  // ── Fetch metadata from server ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const sessionStr = localStorage.getItem("party_admin_session");
      if (!sessionStr) return;

      const session = JSON.parse(sessionStr);
      const user = session.user;
      const role = user.prefs?.role || "Super Admin";
      setUserRole(role);

      if (role === "Super Admin") {
        const [venuesRes, paymentsRes] = await Promise.all([
          fetch(`${serverUrl}/venues`, { cache: "no-store" }).catch(() => null),
          fetch(`${serverUrl}/payments`, { cache: "no-store" }).catch(() => null)
        ]);

        if (venuesRes && venuesRes.ok) {
          const venuesResult = await venuesRes.json().catch(() => ({}));
          if (venuesResult.status === "success") {
            const mapped = (venuesResult.data || []).map((v: any) => {
              if (v.subscriptionPlan === 'trial_30') {
                const createdAt = v.$createdAt ? new Date(v.$createdAt).getTime() : Date.now();
                if ((Date.now() - createdAt) > (30 * 24 * 60 * 60 * 1000)) {
                  return { ...v, subscriptionPlan: 'None' };
                }
              }
              return v;
            });
            setVenues(mapped);
          }
        }

        if (paymentsRes && paymentsRes.ok) {
          const paymentsResult = await paymentsRes.json().catch(() => ({}));
          if (paymentsResult.status === "success") {
            setPayments(paymentsResult.data || []);
          }
        }
      } else {
        await fetchLeads(user.$id);
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      console.warn("Dashboard fetch error:", e?.message || e);
    } finally {
      setLoading(false);
      setMounted(true);
    }
  }, [serverUrl, fetchLeads]);

  // ── Setup Appwrite Realtime Subscription ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const setupRealtime = async () => {
      await fetchData();

      try {
        const { client, DATABASE_ID, VENUES_COLLECTION_ID } = await import("@/lib/appwrite");

        const channel = `databases.${DATABASE_ID}.collections.${VENUES_COLLECTION_ID}.documents`;

        const unsub = client.subscribe(channel, (response: any) => {
          if (!isMounted) return;

          const events: string[] = response.events || [];
          const doc = response.payload as LiveVenue;

          // Update venues list in-place
          if (events.some(e => e.includes(".create"))) {
            setVenues(prev => {
              const exists = prev.find(v => v.$id === doc.$id);
              return exists ? prev : [doc, ...prev];
            });
            setRealtimeEvents(prev => [
              {
                type: "Signup",
                message: `New venue registered: ${doc.venueName || "Unnamed"} (${doc.city || "—"})`,
                time: new Date().toISOString(),
                venueId: doc.$id,
              },
              ...prev.slice(0, 9),
            ]);
          } else if (events.some(e => e.includes(".update"))) {
            setVenues(prev => prev.map(v => v.$id === doc.$id ? { ...v, ...doc } : v));

            let eventMsg = `Venue updated: ${doc.venueName || doc.$id}`;
            let eventType = "Update";

            if (doc.isVerified) {
              eventMsg = `✓ Approved: ${doc.venueName || "Venue"} is now verified`;
              eventType = "Approved";
            } else if (doc.subscriptionPlan && doc.subscriptionPlan !== "None") {
              eventMsg = `💳 Subscription: ${doc.venueName || "Venue"} → ${PLAN_LABELS[doc.subscriptionPlan] || doc.subscriptionPlan}`;
              eventType = "Payment";
            } else if (doc.onboardingComplete) {
              eventMsg = `Onboarding complete: ${doc.venueName || "Venue"} in ${doc.city || "—"}`;
              eventType = "Signup";
            }

            setRealtimeEvents(prev => [
              { type: eventType, message: eventMsg, time: new Date().toISOString(), venueId: doc.$id },
              ...prev.slice(0, 9),
            ]);
          } else if (events.some(e => e.includes(".delete"))) {
            setVenues(prev => prev.filter(v => v.$id !== doc.$id));
          }

          setLastUpdated(new Date());
        });

        unsubRef.current = unsub;
        setIsRealtimeConnected(true);
      } catch (err: any) {
        console.warn("Realtime setup failed:", err?.message || err);
        setIsRealtimeConnected(false);
        // Retry after 10 seconds
        setTimeout(() => { if (isMounted) setupRealtime(); }, 10000);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (unsubRef.current) unsubRef.current();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived Metrics ───────────────────────────────────────────────────────
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = startOfToday - 30 * 24 * 60 * 60 * 1000;
  const startOfYear = startOfToday - 365 * 24 * 60 * 60 * 1000;

  const filteredVenues = venues.filter(v => {
    if (timeFilter === "Lifetime") return true;
    const createdAt = v.$createdAt ? new Date(v.$createdAt).getTime() : 0;
    if (timeFilter === "Today") return createdAt >= startOfToday;
    if (timeFilter === "Weekly") return createdAt >= startOfWeek;
    if (timeFilter === "Monthly") return createdAt >= startOfMonth;
    if (timeFilter === "Yearly") return createdAt >= startOfYear;
    return true;
  });

  const filteredLeads = myLeads.filter(l => {
    if (timeFilter === "Lifetime") return true;
    const createdAt = l.$createdAt ? new Date(l.$createdAt).getTime() : 0;
    if (timeFilter === "Today") return createdAt >= startOfToday;
    if (timeFilter === "Weekly") return createdAt >= startOfWeek;
    if (timeFilter === "Monthly") return createdAt >= startOfMonth;
    if (timeFilter === "Yearly") return createdAt >= startOfYear;
    return true;
  });

  const totalVenues = filteredVenues.length;
  const subscribedVenues = filteredVenues.filter(v => v.subscriptionPlan && v.subscriptionPlan !== "None").length;
  const freeVenues = totalVenues - subscribedVenues;
  const pendingVerification = filteredVenues.filter(v => !v.isVerified).length;
  const onboardedVenues = filteredVenues.filter(v => v.onboardingComplete).length;

  const filteredPayments = payments.filter(p => {
    if (timeFilter === "Lifetime") return true;
    const createdAt = p.paidAt ? new Date(p.paidAt).getTime() : (p.$createdAt ? new Date(p.$createdAt).getTime() : 0);
    if (timeFilter === "Today") return createdAt >= startOfToday;
    if (timeFilter === "Weekly") return createdAt >= startOfWeek;
    if (timeFilter === "Monthly") return createdAt >= startOfMonth;
    if (timeFilter === "Yearly") return createdAt >= startOfYear;
    return true;
  });

  const totalRevenue = filteredPayments.reduce((sum, p) => {
    if (p.status === 'captured' || p.status === 'paid' || p.status === 'Paid') {
      return sum + (Number(p.amount) || 0);
    }
    return sum;
  }, 0);

  const renewalsPending = filteredVenues.filter(v =>
    v.subscriptionPlan && v.subscriptionPlan !== "None" && !v.isVerified
  ).length;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#b66dff] rounded-full" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Intelligence Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg grad-purple flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Building2 size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 m-0">Intelligence Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Realtime indicator */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all",
            isRealtimeConnected
              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
              : "bg-slate-50 border-slate-100 text-slate-400"
          )}>
            {isRealtimeConnected ? (
              <><div className="w-2 h-2 rounded-full bg-emerald-400" /><Wifi size={11} /> Live</>
            ) : (
              <><div className="w-2 h-2 rounded-full bg-slate-300" /><WifiOff size={11} /> Connecting...</>
            )}
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <RefreshCw size={12} className="text-purple-400" />
              Updated {timeAgo(lastUpdated.toISOString())}
            </div>
          )}

          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
            <span>Overview</span>
            <Info size={14} className="text-purple-400" />
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              className="ml-2 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none hover:border-purple-300 transition-colors cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="Lifetime">Lifetime</option>
            </select>
          </div>
        </div>
      </div>

      {/* High-Impact Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">

        {/* Total Revenue / Assigned Leads */}
        <motion.div
          style={{ background: "linear-gradient(to right, #ffbf96, #fe7096)" }}
          className="rounded-xl p-6 text-white relative mesh-bg min-h-[160px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-shadow shadow-sm overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex justify-between items-start relative z-10">
            <p className="text-[13px] font-medium opacity-90 text-white/80">{userRole === "Super Admin" ? "Total Revenue" : "Assigned Leads"}</p>
            <Activity size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold m-0 tracking-tight">
              {loading ? "—" : (userRole === "Super Admin" ? `₹${totalRevenue.toLocaleString("en-IN")}` : filteredLeads.length)}
            </h2>
            <p className="text-[9px] mt-3 font-bold opacity-80 uppercase tracking-widest text-white/70">{userRole === "Super Admin" ? "Yield Index" : "Total Assignment"}</p>
          </div>
        </motion.div>

        {/* Pending Approvals / In-Progress Leads */}
        <Link href={userRole === "Super Admin" ? "/approvals" : "/crm/leads"} className="block outline-none">
          <motion.div
            style={{ background: "linear-gradient(to right, #90caf9, #047edf)" }}
            className="rounded-xl p-6 text-white relative mesh-bg min-h-[160px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-shadow shadow-sm overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[13px] font-medium opacity-90 text-white/80">{userRole === "Super Admin" ? "Pending Approvals" : "In-Progress Leads"}</p>
              <Activity size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold m-0 tracking-tight text-white">
                {loading ? "—" : (userRole === "Super Admin" ? pendingVerification : filteredLeads.filter(l => l.status === "Contacted" || l.status === "Qualified").length)}
              </h2>
              <p className="text-[9px] mt-3 font-bold opacity-80 uppercase tracking-widest text-white/70">{userRole === "Super Admin" ? "Partners" : "Active Follow-ups"}</p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
              <ChevronRight size={14} />
            </div>
          </motion.div>
        </Link>

        {/* Subscribed Venues / Won Leads */}
        <Link href={userRole === "Super Admin" ? "/venues?filter=subscribed" : "/crm/leads"} className="block outline-none">
          <motion.div
            style={{ background: "linear-gradient(to right, #84d9d2, #07cdae)" }}
            className="rounded-xl p-6 text-white relative mesh-bg min-h-[160px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-shadow shadow-sm overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[13px] font-medium opacity-90 text-white/80">{userRole === "Super Admin" ? "Subscribed Venues" : "Total Conversions"}</p>
              <Diamond size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold m-0 tracking-tight text-white">
                {loading ? "—" : (userRole === "Super Admin" ? subscribedVenues : filteredLeads.filter(l => l.status === "Won").length)}
              </h2>
              <p className="text-[9px] mt-3 font-bold opacity-80 uppercase tracking-widest text-white/70">{userRole === "Super Admin" ? "Paid Partners" : "Leads Won"}</p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
              <ChevronRight size={14} />
            </div>
          </motion.div>
        </Link>

        {/* Free Listings */}
        <Link href="/venues?filter=unsubscribed" className="block outline-none">
          <motion.div
            style={{ backgroundColor: "#a855f7" }}
            className="rounded-xl p-6 text-white relative mesh-bg min-h-[160px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-shadow shadow-sm overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[13px] font-medium opacity-90 text-white/80">Free Listings</p>
              <ExternalLink size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold m-0 tracking-tight text-white">
                {loading ? "—" : freeVenues}
              </h2>
              <p className="text-[9px] mt-3 font-bold opacity-80 uppercase tracking-widest text-white/70">Unsubscribed</p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
              <ChevronRight size={14} />
            </div>
          </motion.div>
        </Link>

        {/* Total Venues */}
        <Link href="/venues" className="block outline-none">
          <motion.div
            style={{ backgroundColor: "#334155" }}
            className="rounded-xl p-6 text-white relative mesh-bg min-h-[160px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-shadow shadow-sm overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[13px] font-medium opacity-90 text-white/80">Total Venues</p>
              <Building2 size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold m-0 tracking-tight text-white">
                {loading ? "—" : totalVenues}
              </h2>
              <p className="text-[9px] mt-3 font-bold opacity-80 uppercase tracking-widest text-white/70">All Entities</p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
              <ChevronRight size={14} />
            </div>
          </motion.div>
        </Link>

        {/* Pending KYC */}
        <Link href="/approvals" className="block outline-none">
          <motion.div
            style={{ background: "linear-gradient(to right, #ff719a, #f72365)" }}
            className="rounded-xl p-6 text-white relative mesh-bg min-h-[160px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-shadow shadow-sm overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[13px] font-medium opacity-90 text-white/80">Pending KYC</p>
              <AlertTriangle size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold m-0 tracking-tight text-white">
                {loading ? "—" : pendingVerification}
              </h2>
              <p className="text-[9px] mt-3 font-bold opacity-80 uppercase tracking-widest text-white/70">Action Required</p>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
              <ChevronRight size={14} />
            </div>
          </motion.div>
        </Link>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Subscribed vs Free Chart */}
        <div className="purple-card p-10 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-[#343a40] mb-8">Subscribed vs Free Listing</h3>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="relative w-48 h-48 mb-8">
              <div className="absolute inset-0 rounded-full border-[16px] border-slate-100" />
              {totalVenues > 0 ? (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="12"
                    strokeDasharray={`${subscribedVenues / totalVenues * 251.3} 251.3`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
              ) : (
                <div className="absolute inset-0 rounded-full border-[16px] border-slate-100" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800">{loading ? "—" : subscribedVenues}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscribed</span>
              </div>
            </div>
            <div className="flex gap-12 text-sm font-bold">
              <div className="flex flex-col gap-1">
                <span className="text-emerald-500 ring-2 ring-emerald-500/20 px-3 py-1 rounded-full text-[10px] uppercase">Active Subscriptions</span>
                <span className="text-xl text-slate-800">{loading ? "—" : subscribedVenues} Units</span>
              </div>
              <div className="flex flex-col gap-1 text-slate-400">
                <span className="text-slate-400 ring-2 ring-slate-400/20 px-3 py-1 rounded-full text-[10px] uppercase">Free Listings</span>
                <span className="text-xl text-slate-400">{loading ? "—" : freeVenues} Units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Activity Feed */}
        <div className="purple-card p-10 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-[#343a40]">Live Activity Feed</h3>
              {isRealtimeConnected && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Realtime
                </span>
              )}
            </div>
            <Zap size={16} className="text-[#b66dff]" />
          </div>

          <div className="space-y-3">
            {realtimeEvents.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#b66dff] mb-3">
                  <Wifi size={22} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {isRealtimeConnected ? "Listening for events..." : "Connecting to realtime..."}
                </p>
                <p className="text-[10px] text-slate-300 mt-1">Actions by vendors will appear here instantly</p>
              </div>
            ) : (
              realtimeEvents.map((event, i) => (
                <motion.div
                  key={`${event.time}-${i}`}
                  initial={{ opacity: 0, x: 20, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-slate-100 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className={cn(
                    "w-9 h-9 shrink-0 rounded-full flex items-center justify-center shadow-inner",
                    event.type === "Approved" ? "bg-emerald-50 text-emerald-500" :
                    event.type === "Payment" ? "bg-purple-50 text-purple-500" :
                    event.type === "Signup" ? "bg-blue-50 text-blue-500" :
                    "bg-slate-50 text-slate-400"
                  )}>
                    {event.type === "Approved" ? <CheckCircle2 size={16} /> :
                     event.type === "Payment" ? <CreditCard size={16} /> :
                     event.type === "Signup" ? <Users size={16} /> :
                     <Activity size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded leading-none",
                        event.type === "Approved" ? "bg-emerald-500 text-white" :
                        event.type === "Payment" ? "bg-[#b66dff] text-white" :
                        event.type === "Signup" ? "bg-blue-500 text-white" :
                        "bg-slate-400 text-white"
                      )}>{event.type}</span>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">{timeAgo(event.time)}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1.5 leading-snug">{event.message}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Revenue Intelligence Breakdown — live from real venue subscriptions */}
      <section className="purple-card p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-[#343a40] m-0 ">Revenue Intelligence Breakdown</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-tighter">Plan-Wise Live Distribution</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#b66dff]/10 text-[#b66dff] rounded-full">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Yield</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {[
            { plan: "pax_0_50", label: "0–50 PAX", rate: "₹33/day", color: "bg-blue-400" },
            { plan: "pax_50_100", label: "50–100 PAX", rate: "₹44/day", color: "bg-sky-400" },
            { plan: "pax_100_200", label: "100–200 PAX", rate: "₹77/day", color: "bg-[#b66dff]", popular: true },
            { plan: "pax_200_500", label: "200–500 PAX", rate: "₹123/day", color: "bg-emerald-400" },
            { plan: "pax_500_1000", label: "500–1000 PAX", rate: "₹179/day", color: "bg-amber-400" },
            { plan: "pax_1000_2000", label: "1000–2000 PAX", rate: "₹249/day", color: "bg-orange-400" },
            { plan: "pax_2000_5000", label: "2000–5000 PAX", rate: "₹379/day", color: "bg-rose-400" },
            { plan: "trial_30", label: "Trial (30-day)", rate: "₹11 flat", color: "bg-pink-400" },
          ].map((sub) => {
            const count = filteredVenues.filter(v => v.subscriptionPlan === sub.plan).length;
            const share = totalVenues > 0 ? Math.round((count / totalVenues) * 100) : 0;
            const revenueVal = count * (PLAN_REVENUE[sub.plan] || 0);

            return (
              <div key={sub.plan} className={cn(
                "space-y-4 relative p-4 rounded-2xl transition-all hover:bg-slate-50 border border-transparent",
                sub.popular && "border-[#b66dff]/20 bg-[#b66dff]/5"
              )}>
                {sub.popular && (
                  <span className="absolute -top-3 left-4 px-2 py-0.5 bg-[#b66dff] text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-purple-500/20">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 tracking-tight">{sub.label}</span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{sub.rate}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{share}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${share}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full", sub.color)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-700">
                    {count} venue{count !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    ₹{revenueVal.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
