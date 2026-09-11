'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Star, 
  Zap, 
  Building2, 
  ImageIcon, 
  IndianRupee, 
  MessageSquare, 
  ExternalLink,
  Bell,
  Search,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  CalendarDays,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldCheck,
  Settings,
  LogOut,
  User,
  CheckCircle2,
  Smartphone,
  X,
  Sparkle,
  Wallet,
  PieChart,
  HelpCircle,
  MessageSquareQuote,
  Filter,
  Download,
  Plus,
  Minus,
  Menu,
  ArrowLeft,
  ChevronLeft,
  History,
  FileText,
  Calculator,
  Send,
  Phone,
  MessageCircle,
  Mail,
  ChevronDown,
  Trello,
  LayoutList,
  Target,
  XCircle,
  Shield,
  CreditCard,
  Globe,
  Key,
  Database,
  Coffee,
  Utensils,
  Music,
  Wind,
  Wifi,
  Car,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


import QuotationManager from '@/vendor/components/dashboard/QuotationManager';
import DashboardOverview from '@/vendor/components/dashboard/DashboardOverview';
import LeadInbox from '@/vendor/components/dashboard/LeadInbox';
import LeadPipeline from '@/vendor/components/dashboard/LeadPipeline';
import ReviewManager from '@/vendor/components/dashboard/ReviewManager';
import FinanceHub from '@/vendor/components/dashboard/FinanceHub';
import AnalyticsCenter from '@/vendor/components/dashboard/AnalyticsCenter';
import QuickSupport from '@/vendor/components/dashboard/QuickSupport';
import SystemHistory from '@/vendor/components/dashboard/SystemHistory';
import DashboardSettings from '@/vendor/components/dashboard/DashboardSettings';
import VenueCalendar from '@/vendor/components/dashboard/VenueCalendar';
import LeadExplorer from '@/vendor/components/dashboard/LeadExplorer';
import NotificationDropdown from '@/vendor/components/dashboard/NotificationDropdown';
import PaymentReminderPopup from '@/vendor/components/PaymentReminderPopup';
import PartnerInquiryPopup from '@/vendor/components/PartnerInquiryPopup';
import VerificationModal from '@/vendor/components/dashboard/VerificationModal';

import logo from '../logo.jpg';

const tabs = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
  { id: 'leads', label: 'Leads', icon: <Zap size={18} /> },
  { id: 'pipeline', label: 'Pipeline', icon: <Target size={18} /> },
  { id: 'quotations', label: 'Quotations', icon: <FileText size={18} /> },
  { id: 'reviews', label: 'Reviews', icon: <MessageSquareQuote size={18} /> },
];

const secondaryTabs = [
  { id: 'support', label: 'Support', icon: <HelpCircle size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

const planLabels: {[key: string]: string} = {
  'pax_0_50': 'Starter Live',
  'pax_50_100': 'Growth Live',
  'pax_100_200': 'Priority Live',
  'pax_200_500': 'Featured Live',
  'pax_500_1000': 'Premium Live',
  'pax_1000_2000': 'Elite Live',
  'pax_2000_5000': 'Platinum Live',
  'pax_5000': 'Enterprise Live',
  '0-50 PAX Membership': 'Starter Live',
  '50-100 PAX Membership': 'Growth Live',
  '100-200 PAX Membership': 'Priority Live',
  '200-500 PAX Membership': 'Featured Live',
  '500-1000 PAX Membership': 'Premium Live',
  '1000-2000 PAX Membership': 'Elite Live',
  '2000-5000 PAX Membership': 'Platinum Live',
  '5000+ PAX Membership': 'Enterprise Live',
  'Upto 50 PAX': 'Starter Live',
  'Upto 100 PAX': 'Growth Live',
  'Upto 200 PAX': 'Priority Live',
  'Upto 500 PAX': 'Featured Live',
  'Upto 1000 PAX': 'Premium Live',
  'Upto 2000 PAX': 'Elite Live',
  'Upto 5000 PAX': 'Platinum Live',
  '5000+ PAX': 'Enterprise Live',
  'trial_30': 'Introductory Offer',
  'free': 'Free Live'
};

export default function VendorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showInquiryPopup, setShowInquiryPopup] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [settingsSection, setSettingsSection] = useState('profile');
  const [leadFilter, setLeadFilter] = useState('All');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPaymentReminder, setShowPaymentReminder] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [venueProfile, setVenueProfile] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  
  // Fetch reviews to compute Average Rating in Overview
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  React.useEffect(() => {
    if (!venueProfile?.$id) return;
    const fetchReviews = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || 'https://party-dial-product-server.onrender.com/api';
        const baseUrl = base.endsWith('/api') ? base : `${base}/api`;
        const res = await fetch(`${baseUrl}/venues/${venueProfile.$id}/reviews`);
        
        if (!res.ok) return; // Fail silently on 404/500
        
        const json = await res.json();
        if (json?.status === 'success') {
          setReviewsData(json.data || []);
        }
      } catch (e) {
        // Mute console.error to prevent Next.js overlay popups during local dev
        // when the backend server is offline.
        console.warn('Backend unavailable, using default local reviews.');
      }
    };
    fetchReviews();
  }, [venueProfile?.$id]);


  // Helper to format date consistent with dashboard design
  const formatLeadDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatLeadTime = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };


  // Calculate Realtime Stats
  const stats = useMemo(() => {
    // 1. Active Leads calculation (All leads not closed/cancelled)
    const activeLeadsCount = recentLeads.filter(l => 
      ['New', 'In-Progress', 'Contacted', 'Followups', 'Quoted'].includes(l.status)
    ).length;

    // 2. Today's Leads calculation
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const todayLeadsCount = recentLeads.filter(l => l.date === today).length;

    // 3. Average Rating
    const calculatedRating = reviewsData.length > 0
      ? reviewsData.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviewsData.length
      : 0.0;
    const rating = venueProfile?.rating || calculatedRating;

    // 4. Total Bookings calculation
    const bookedLeads = recentLeads.filter(l => l.status === 'Booked');
    const totalBookingsCount = bookedLeads.length;

    return [
      { 
        label: 'Active Leads', 
        value: activeLeadsCount.toString(), 
        icon: <Zap size={20} />, 
        color: 'bg-emerald-50 text-emerald-600', 
        trend: activeLeadsCount > 0 ? '+100%' : '0%', 
        isUp: activeLeadsCount > 0 
      },
      { 
        label: "Today's Leads", 
        value: todayLeadsCount.toString(), 
        icon: <Users size={20} />, 
        color: 'bg-blue-50 text-blue-600', 
        trend: todayLeadsCount > 0 ? 'New' : 'Static', 
        isUp: todayLeadsCount > 0 
      },
      { 
        label: 'Average Rating', 
        value: rating.toFixed(1), 
        icon: <Star size={20} />, 
        color: 'bg-amber-50 text-amber-600', 
        trend: '0.0%', 
        isUp: true 
      },
      { 
        label: 'Total Bookings', 
        value: totalBookingsCount.toString(), 
        icon: <CheckCircle2 size={20} />, 
        color: 'bg-pink-50 text-pink-600', 
        trend: totalBookingsCount > 0 ? 'Growing' : '0%', 
        isUp: totalBookingsCount > 0 
      },
    ];
  }, [recentLeads, venueProfile, reviewsData]);

  // Subscription Expiry Calculation
  const expiryInfo = useMemo(() => {
    if (!venueProfile) return null;
    const plan = venueProfile.subscriptionPlan;
    // New accounts, unassigned plans, or explicitly free/None plans do not have a paid Live Pack
    if (!plan || plan === 'None' || plan === 'free' || plan === '') {
      return null;
    }

    const now = new Date();
    
    // Priority 1: Check for explicit subscriptionExpiry from the database
    if (venueProfile.subscriptionExpiry) {
      const end = new Date(venueProfile.subscriptionExpiry);
      const remainingTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
      
      // Calculate percentage assuming a 30-day window for visual progress if we don't have start date
      // or just cap it. For better visuals, we can assume a standard month if it's a short trial.
      const totalWindow = 30 * 24 * 60 * 60 * 1000; 
      const percent = Math.max(0, Math.min(100, (remainingTime / totalWindow) * 100));
      
      return { 
        daysLeft: diffDays, 
        percent, 
        label: plan === 'trial_30' ? 'Trial Access' : (planLabels[plan] || plan || 'Live Pack')
      };
    }
    
    // Fallback: Trial Plan specific logic (Hardcoded Legacy)
    if (plan === 'trial_30') {
      const end = new Date('2026-04-30T23:59:59');
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const percent = Math.max(0, Math.min(100, (diffDays / 30) * 100));
      return { daysLeft: diffDays, percent, label: 'Introductory Offer' };
    }
    
    // Fallback: Paid Plans (Assuming 1 Year duration from creation/verification if expiry attribute is missing)
    if (plan && plan !== 'free' && plan !== 'None') {
      const start = new Date(venueProfile.$createdAt || Date.now());
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      
      const totalTime = end.getTime() - start.getTime();
      const remainingTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
      const percent = Math.max(0, Math.min(100, (remainingTime / totalTime) * 100));
      
      return { daysLeft: diffDays, percent, label: 'Live Pack' };
    }

    return null;
  }, [venueProfile]);
 
  const hasActivePaidPlan = !!(venueProfile?.subscriptionPlan && venueProfile.subscriptionPlan !== 'free' && venueProfile.subscriptionPlan !== 'None' && (!expiryInfo || expiryInfo.daysLeft > 0));

  // Unified Activity History Generation
  const pastActivities = useMemo(() => {
    return recentLeads.map((lead, idx) => ({
      id: idx + 1,
      type: lead.status === 'Booked' ? 'Booking Confirmed' : (lead.status === 'Quotation Send' ? 'Proposal Dispatched' : 'Inquiry Received'),
      title: lead.status === 'Booked' ? `Event booked for ${lead.name}` : `${lead.name} requested details for ${lead.event}`,
      time: `${lead.date} • ${lead.time}`,
      icon: lead.status === 'Booked' ? <CheckCircle2 size={18} className="text-emerald-500" /> : (lead.status === 'Quotation Send' ? <FileText size={18} className="text-blue-500" /> : <Zap size={18} className="text-pd-pink" />)
    }));
  }, [recentLeads]);

  // Automatic Onboarding Completion Check
  const isOnboardingComplete = useMemo(() => {
    if (!venueProfile) return false;
    if (venueProfile.onboardingComplete) return true;

    // Check individual fields for completion
    const hasName = venueProfile.venueName && venueProfile.venueName.length > 3;
    const hasCapacity = parseInt(venueProfile.capacity) > 0;
    const hasPricing = (parseFloat(venueProfile.perPlateVeg) > 0 || parseFloat(venueProfile.perPlateNonVeg) > 0);
    
    let photosCount = 0;
    try {
      const photos = typeof venueProfile.photos === 'string' ? JSON.parse(venueProfile.photos) : (Array.isArray(venueProfile.photos) ? venueProfile.photos : []);
      photosCount = photos.length;
    } catch (e) {}

    let eventTypesCount = 0;
    try {
      const et = typeof venueProfile.eventTypes === 'string' ? JSON.parse(venueProfile.eventTypes) : (Array.isArray(venueProfile.eventTypes) ? venueProfile.eventTypes : []);
      eventTypesCount = et.length;
    } catch (e) {}

    // We consider onboarding complete if name, capacity, pricing, and at least 3 photos & 1 event type are present
    const isComplete = hasName && hasCapacity && hasPricing && photosCount >= 3 && eventTypesCount >= 1;

    return isComplete || venueProfile.onboardingComplete;
  }, [venueProfile]);

  // Auto-update onboarding status in database
  useEffect(() => {
    if (isOnboardingComplete && venueProfile?.$id && !venueProfile?.onboardingComplete) {
      const syncOnboarding = async () => {
        try {
          const { databases, DATABASE_ID, VENUES_COLLECTION_ID } = await import('@/lib/appwrite');
          await databases.updateDocument(DATABASE_ID, VENUES_COLLECTION_ID, venueProfile.$id, {
            onboardingComplete: true
          });
          setVenueProfile((prev: any) => ({ ...prev, onboardingComplete: true }));
          showToast('Onboarding completed! Listing Management moved to Settings.', 'success');
        } catch (err) {
          console.error('Failed to auto-complete onboarding:', err);
        }
      };
      syncOnboarding();
    }
  }, [isOnboardingComplete, venueProfile?.$id, venueProfile?.onboardingComplete]);

  const handleLogout = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://party-dial-product-server.onrender.com/api';
      const serverUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      await fetch(`${serverUrl}/auth/logout`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
    } catch (err) {
      console.warn('Backend logout call failed:', err);
    } finally {
      try {
        const { account } = await import('@/lib/appwrite');
        await account.deleteSession('current');
      } catch (err) { }
      localStorage.removeItem('auth_session');
      localStorage.removeItem('user');
      localStorage.removeItem('onboardingComplete');
      router.push('/login');
    }
  };

  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const updateDate = () => {
      setFormattedDate(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateDate();
    const interval = setInterval(updateDate, 1000 * 60 * 60); // Check every hour if day changed
    return () => clearInterval(interval);
  }, []);
  
  // Mobile responsiveness effect
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [guestRange, setGuestRange] = useState({ min: 0, max: 10000 });
  const [calendarView, setCalendarView] = useState('Monthly');
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [lastClearedTime, setLastClearedTime] = useState(Date.now());
  const unreadLeadsCount = recentLeads.filter(l => l.unread && new Date(l.rawDate).getTime() > lastClearedTime).length;

  useEffect(() => {
    if (activeTab === 'leads' || activeTab === 'pipeline') {
      setLastClearedTime(Date.now());
    }
  }, [activeTab]);
  
  const [quoteData, setQuoteData] = useState({
    client: '',
    contact: '',
    email: '',
    event: 'Wedding Ceremony',
    eventDate: new Date().toISOString().split('T')[0],
    guestCount: '0',
    specialRequests: '',
    gstRate: 18,
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    extraCharges: 0,
    lineItems: [
       { id: 1, label: 'Venue Rental', amount: 0 },
       { id: 2, label: 'Catering Service', amount: 0 },
       { id: 3, label: 'Decoration & Setup', amount: 0 },
    ],
    selectedImages: [] as string[],
    leadId: '',
    signatory: ''
  });

  const filteredAdvancedLeads = useMemo(() => {
    return [...recentLeads].filter(lead => {
      const matchesStatus = leadFilter === 'All' || lead.status === leadFilter;
      const matchesSearch = searchTerm === '' || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        lead.event.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEvent = selectedEventTypes.length === 0 || 
        selectedEventTypes.some(t => lead.event.includes(t));
      const matchesGuests = parseInt(lead.guests) <= guestRange.max;
      return matchesStatus && matchesSearch && matchesEvent && matchesGuests;
    }).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  }, [searchTerm, leadFilter, selectedEventTypes, guestRange, recentLeads]);

  // Derived calculations moved to component for complex logic
  const subtotal = 0;
  const gstAmount = 0;
  const totalWithTax = 0;

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [qtnSuccess, setQtnSuccess] = useState(false);
  const [leadView, setLeadView] = useState<'list' | 'pipeline'>('list');

  const PIPELINE_STAGES = [
    { id: 'New', color: 'bg-blue-500', text: 'text-blue-600', icon: <Zap size={14} /> },
    { id: 'Contacted', color: 'bg-purple-500', text: 'text-purple-600', icon: <Phone size={14} /> },
    { id: 'Followups', color: 'bg-amber-500', text: 'text-amber-600', icon: <CalendarDays size={14} /> },
    { id: 'Quotation Send', color: 'bg-pink-500', text: 'text-pink-600', icon: <IndianRupee size={14} /> },
    { id: 'Booked', color: 'bg-emerald-500', text: 'text-emerald-600', icon: <CheckCircle2 size={14} /> },
    { id: 'Lost', color: 'bg-red-500', text: 'text-red-600', icon: <XCircle size={14} /> }
  ];

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    // 1. Optimistic Update (UI becomes "realtime" instantly)
    const previousLeads = [...recentLeads];
    setRecentLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    showToast(`Lead successfully moved to ${newStatus}`, 'success');

    try {
      const { databases, DATABASE_ID, LEADS_COLLECTION_ID } = await import('@/lib/appwrite');
      await databases.updateDocument(DATABASE_ID, LEADS_COLLECTION_ID, leadId, {
        status: newStatus
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert if failed
      setRecentLeads(previousLeads);
      showToast('Offline mode: Could not sync status with server.', 'error');
    }
  };

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const handleAmenityToggle = (amenityId: string) => {
    setVenueProfile((prev: any) => {
       let current = [];
       try {
          current = typeof prev?.amenities === 'string' ? JSON.parse(prev.amenities) : (Array.isArray(prev?.amenities) ? prev.amenities : []);
       } catch (e) { current = []; }
       const updated = current.includes(amenityId) ? current.filter((a: any) => a !== amenityId) : [...current, amenityId];
       return { ...prev, amenities: JSON.stringify(updated) };
    });
  };

  const handleEventTypeToggle = (eventTypeId: string) => {
    setVenueProfile((prev: any) => {
       let current = [];
       try {
          current = typeof prev?.eventTypes === 'string' ? JSON.parse(prev.eventTypes) : (Array.isArray(prev?.eventTypes) ? prev.eventTypes : []);
       } catch (e) { current = []; }
       const updated = current.includes(eventTypeId) ? current.filter((a: any) => a !== eventTypeId) : [...current, eventTypeId];
       return { ...prev, eventTypes: JSON.stringify(updated) };
    });
  };

  const handleProfileUpdate = (field: string, value: any) => {
    setVenueProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveProfileSettings = async () => {
    if (!venueProfile?.$id) return;
    setIsUpdatingProfile(true);
    try {
      const { databases, DATABASE_ID, VENUES_COLLECTION_ID } = await import('@/lib/appwrite');
      const currentBillingDetails = typeof venueProfile.billingDetails === 'string' 
        ? JSON.parse(venueProfile.billingDetails || '{}') 
        : (venueProfile.billingDetails || {});
      
      const updatedBillingDetails = {
        ...currentBillingDetails,
        ownerName: venueProfile.ownerName || '',
        address: venueProfile.address || '',
        city: venueProfile.city || '',
        state: venueProfile.state || ''
      };

      await databases.updateDocument(DATABASE_ID, VENUES_COLLECTION_ID, venueProfile.$id, {
        venueName: venueProfile.venueName,
        capacity: !isNaN(parseInt(String(venueProfile.capacity))) ? Math.max(1, Math.min(10000, parseInt(String(venueProfile.capacity)))) : 1, 
        perPlateVeg: String(parseInt(String(venueProfile.perPlateVeg || 0)) || 0),
        perPlateNonVeg: String(parseInt(String(venueProfile.perPlateNonVeg || 0)) || 0),
        description: venueProfile.description || '',
        amenities: venueProfile.amenities,
        eventTypes: venueProfile.eventTypes,
        landmark: venueProfile.landmark || '',
        billingDetails: JSON.stringify(updatedBillingDetails),
        packages: JSON.stringify({
           packages: Array.isArray(venueProfile.packages) ? venueProfile.packages : [],
           halls: Array.isArray(venueProfile.halls) ? venueProfile.halls : []
        })
      });
      showToast('Profile successfully synchronized with the portal.', 'success');
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFinalize = () => {
    setIsFinalizing(true);
    setTimeout(() => {
       setIsFinalizing(false);
       setQtnSuccess(true);
       // Reset or show success
       setTimeout(() => setQtnSuccess(false), 3000);
    }, 1500);
  };

  const handleDownload = () => {
     window.print(); // Simple way for the user to download as PDF immediately
  };

  const handleSend = () => {
     showToast(`Quotation successfully dispatched to ${quoteData.client}`, 'success');
  };

  // Connection Status Monitor
  useEffect(() => {
    const handleOnline = () => {
      showToast('Internet connection restored.', 'success');
      // Re-trigger connection attempt
      setConnectionVersion(v => v + 1);
    };
    const handleOffline = () => {
      showToast('You are currently offline. Realtime updates suspended.', 'error');
      setIsRealtimeConnected(false);
    };
 
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
 
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [connectionVersion, setConnectionVersion] = useState(0);

  // Initialization & Realtime Sync
  useEffect(() => {
    let isMounted = true;
    
    const initializeDashboard = async () => {
      try {
        const { account, databases, DATABASE_ID, VENUES_COLLECTION_ID, LEADS_COLLECTION_ID, Query } = await import('@/lib/appwrite');
        
        // 1. Auth Check
        const user = await account.get().catch(() => null);
        if (!isMounted) return;
        if (!user) { router.push('/login'); return; }

        // --- Added: Role-Based Access Control ---
        // Check if user has vendor label or if they are the master admin
        const labels = user.labels || [];
        const isVendor = labels.includes('vendor');
        const isMasterAdmin = user.$id === 'master_admin';

        setUserData(user);
        setIsAuthorized(true);

        // 2. Fetch Profile
        const result = await databases.listDocuments(DATABASE_ID, VENUES_COLLECTION_ID, [Query.equal('userId', user.$id)]);
        if (!isMounted) return;

        if (result.documents.length > 0) {
          const profile = result.documents[0];
          
          // Unified packages/halls storage workaround
          let p_data: any = { packages: [], halls: [] };
          try {
             if (profile.packages) {
                const parsed = JSON.parse(profile.packages);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                   p_data = parsed;
                } else {
                   p_data.packages = Array.isArray(parsed) ? parsed : [];
                }
             }
          } catch(e) { console.warn('Failed to parse merged packages data'); }
          
          let billing_data: any = {};
          try {
             if (profile.billingDetails) {
                 billing_data = typeof profile.billingDetails === 'string' ? JSON.parse(profile.billingDetails) : profile.billingDetails;
             }
          } catch(e) {}

          setVenueProfile({
             ...profile,
             packages: p_data.packages || [],
             halls: p_data.halls || [],
             ownerName: billing_data.ownerName || profile.ownerName || '',
             address: billing_data.address || profile.address || '',
             city: billing_data.city || profile.city || '',
             state: billing_data.state || profile.state || ''
          });


          setIsLoadingLeads(true);
          let leadsDocuments: any[] = [];
          
          // Only fetch leads for active paid subscriptions
          if (profile.subscriptionPlan && profile.subscriptionPlan !== 'free') {
            try {
              let paidSince = null;
              try {
                 const billing = typeof profile.billingDetails === 'string' ? JSON.parse(profile.billingDetails) : profile.billingDetails;
                 paidSince = billing?.paidSince;
              } catch (e) {}

              const registrationDate = profile.createdAt || profile.$createdAt;
              let restrictedSince = registrationDate;

              if (paidSince) {
                // Use the later of the two dates to be most restrictive
                const regTime = new Date(registrationDate).getTime();
                const paidTime = new Date(paidSince).getTime();
                if (paidTime > regTime) {
                  restrictedSince = paidSince;
                }
              }

              const queries = [
                Query.or([
                  Query.equal('venueId', profile.$id),
                  Query.equal('venueId', 'BROADCAST')
                ]),
                Query.greaterThan('$createdAt', restrictedSince),
                Query.orderDesc('$createdAt')
              ];

              const leadsResult = await databases.listDocuments(DATABASE_ID, LEADS_COLLECTION_ID, queries);
              leadsDocuments = leadsResult.documents;
            } catch (leadFetchErr) {
              console.warn('Failed to fetch leads:', leadFetchErr);
            }
          }

          if (isMounted) {
            const leads = leadsDocuments.map(doc => {
              const notes = doc.notes || '';
              
              // More robust regex: finds "Label: value" until next pipe or end of string
              const findInNotes = (label: string) => {
                const regex = new RegExp(`${label}:\\s*([^|]+)`, 'i');
                return notes.match(regex)?.[1]?.trim();
              };

              const extractedDate = findInNotes('Event Date');
              const extractedCity = findInNotes('City');
              const extractedPin = findInNotes('Pin(?:code)?');

              return {
                id: doc.$id,
                name: doc.name,
                phone: doc.phone || '+91 98765 43210',
                event: doc.eventType,
                guests: doc.guests ? doc.guests.toString() : '0',
                date: formatLeadDate(doc.$createdAt),
                time: formatLeadTime(doc.$createdAt),
                rawDate: doc.$createdAt,
                updatedAt: doc.$updatedAt || doc.$createdAt,
                eventDate: doc.eventDate || extractedDate || null,
                status: (() => {
                  if (doc.status === 'Lost') return 'Lost';
                  if (doc.status === 'Booked') return 'Booked';
                  
                  // Auto-Lost check: immediately after event date
                  const eventDateStr = doc.eventDate || extractedDate;
                  if (eventDateStr) {
                    const eventDate = new Date(eventDateStr);
                    const now = new Date();
                    if (now > eventDate) return 'Lost';
                  }

                  if (doc.status === 'Quoted') return 'Quotation Send';
                  if (doc.status === 'In-Progress') return 'Contacted';
                  return doc.status || 'New';
                })(),
                location: doc.city || extractedCity || (extractedPin ? `PIN: ${extractedPin}` : 'Haldwani'),
                email: doc.email || 'client@mail.com',
                title: 'Direct Inquiry',
                starred: false,
                unread: doc.status === 'New',
                color: (doc.status === 'Booked') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              };
            });
            
            setRecentLeads(leads);

            // Deriving calendar events from booked leads for the current month
            const events = leads
              .filter(l => l.status === 'Booked' && l.rawDate)
              .map(l => {
                const leadDate = new Date(l.rawDate);
                return {
                  day: leadDate.getDate(),
                  type: l.event || 'Event',
                  host: l.name,
                  pax: parseInt(l.guests) || 0,
                  time: l.time || 'TBD',
                  status: 'Confirmed'
                };
              });
            setCalendarEvents(events);
            setIsLoadingLeads(false);
          }

          // Handle Onboarding & Payment Status
          const alreadyDismissed = localStorage.getItem('paymentReminderDismissed') === 'true';
          const plan = profile.subscriptionPlan || '';
          
          // isPaidStatus: Venue has an active, lead-eligible plan
          const isPaidStatus = !!(plan && plan !== 'free' && plan !== 'None');
          
          // Admin deactivation check: If the admin has rejected/deactivated this venue,
          // never show the payment reminder popup or email them.
          const isAdminDeactivated = profile.isVerified === false || profile.status === 'rejected';
          
          // needsPaymentPrompt: Venue has NO plan assigned yet (typical for new users)
          // If the plan is explicitly 'free', we assume the Admin has downgraded them 
          // deliberately and we should stay silent.
          // If admin has deactivated the venue, we also stay silent.
          const needsPaymentPrompt = (!plan || plan === 'None') && !isPaidStatus && !isAdminDeactivated;

          // Mobile check - suppress disruptive popups on small screens if requested or already dismissed
          const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 1024;

          if (!profile.onboardingComplete) {
            router.push('/onboarding');
            return;
          } else if (needsPaymentPrompt && !alreadyDismissed && !isMobileDevice) {
            // Use localStorage for precise timing, fallback to $updatedAt for cross-device
            const storedTime = localStorage.getItem('onboardingCompletedAt');
            const completionTime = new Date(storedTime || profile.$updatedAt).getTime();
            const thirtyMinutes = 30 * 60 * 1000;
            const now = Date.now();

            if (now - completionTime >= thirtyMinutes) {
               setShowPaymentReminder(true);
            } else {
               // Schedule popup for later
               const remaining = Math.max(0, thirtyMinutes - (now - completionTime));
               setTimeout(() => {
                  // Final safety check before showing
                  const freshDismissed = localStorage.getItem('paymentReminderDismissed') === 'true';
                  if (!freshDismissed && !isPaidStatus) {
                    setShowPaymentReminder(true);
                  }
               }, remaining);
            }
          }
        } else {
          // If no venue document found, we check if they are actually a vendor
          // This prevents Clients (from port 3000) from seeing the onboarding screen
          // Allow any authenticated user without a profile to proceed to onboarding.
          // This allows new accounts to complete their profile setup.
          if (!isVendor && !isMasterAdmin) {
            console.log('User is new or client, proceeding to onboarding.');
          }
          router.push('/onboarding');
          return;
        }
      } catch (err: any) {
        console.error('Dashboard initialization failed:', err);
        if (isMounted) {
          // If the error is explicitly an authentication error, redirect to login
          if (err?.code === 401) {
            router.push('/login');
          } else {
            // Otherwise, it's a database or permission error. Route to onboarding to allow them to complete profile.
            router.push('/onboarding');
          }
        }
      }
    };

    initializeDashboard();
    return () => { isMounted = false; };
  }, [router]);

  // Separate Effect for Realtime to avoid WebSocket "Still in CONNECTING" error
  const subscribedId = useRef<string | null>(null);
  useEffect(() => {
    if (!venueProfile?.$id) return;
    
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    subscribedId.current = venueProfile.$id;

    const connectRealtime = async () => {
      try {
        const { client, DATABASE_ID, VENUES_COLLECTION_ID, LEADS_COLLECTION_ID } = await import('@/lib/appwrite');
        
        // Safety delay for WebSocket handshake
        await new Promise(resolve => setTimeout(resolve, 800));
        if (!isMounted) return;

        unsubscribe = client.subscribe([
          `databases.${DATABASE_ID}.collections.${VENUES_COLLECTION_ID}.documents.${venueProfile.$id}`,
          `databases.${DATABASE_ID}.collections.${LEADS_COLLECTION_ID}.documents`
        ], (response) => {
          try {
            if (!isMounted) return;
            setIsRealtimeConnected(true); // Confirmed activity
            const payload = response.payload as any;
            if (!payload) return;

            if (response.events.some(e => e.includes('databases.*.collections.' + VENUES_COLLECTION_ID))) {
              let p_data: any = { packages: [], halls: [] };
              try {
                 if (payload.packages) {
                    const parsed = JSON.parse(payload.packages);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                       p_data = parsed;
                    } else {
                       p_data.packages = Array.isArray(parsed) ? parsed : [];
                    }
                 }
              } catch(e) { console.warn('Failed to parse merged packages data'); }
              
              let billing_data: any = {};
              try {
                 if (payload.billingDetails) {
                     billing_data = typeof payload.billingDetails === 'string' ? JSON.parse(payload.billingDetails) : payload.billingDetails;
                 }
              } catch(e) {}

              setVenueProfile({
                 ...payload,
                 packages: p_data.packages || [],
                 halls: p_data.halls || [],
                 ownerName: billing_data.ownerName || payload.ownerName || '',
                 address: billing_data.address || payload.address || '',
                 city: billing_data.city || payload.city || '',
                 state: billing_data.state || payload.state || ''
              });

              if (!payload.onboardingComplete) {
                router.push('/onboarding');
                return;
              }
              // Auto-hide payment reminder if payment is now complete
              if (payload.subscriptionPlan && payload.subscriptionPlan !== 'free') {
                setShowPaymentReminder(false);
              }
            } else if (response.events.some(e => e.includes('databases.*.collections.' + LEADS_COLLECTION_ID))) {
              const isPaid = venueProfile?.subscriptionPlan && venueProfile?.subscriptionPlan !== 'free';
              if (isPaid && (payload.venueId === venueProfile?.$id || payload.venueId === 'BROADCAST')) {
                 const notes = payload.notes || '';
                 const extractedDate = notes.match(/Event Date: ([^|]+)/)?.[1]?.trim();
                 const extractedCity = notes.match(/City: ([^|]+)/)?.[1]?.trim();
                 const extractedPin = notes.match(/Pin(?:code)?: ([^|]+)/)?.[1]?.trim();

                 const mapped = {
                    id: payload.$id,
                    name: payload.name || 'Anonymous',
                    phone: payload.phone || '+91 98765 43210',
                    event: payload.eventType || 'Event',
                    guests: payload.guests ? payload.guests.toString() : '0',
                    date: formatLeadDate(payload.$createdAt || new Date().toISOString()),
                    time: formatLeadTime(payload.$createdAt || new Date().toISOString()),
                    rawDate: payload.$createdAt || new Date().toISOString(),
                    updatedAt: payload.$updatedAt || payload.$createdAt || new Date().toISOString(),
                    eventDate: payload.eventDate || extractedDate || null,
                    status: payload.status === 'Quoted' ? 'Quotation Send' : (payload.status === 'In-Progress' ? 'Contacted' : (payload.status === 'Lost' || payload.status === 'Lost Leads' ? 'Lost' : (payload.status || 'New'))),
                    location: payload.city || extractedCity || (extractedPin ? `PIN: ${extractedPin}` : 'Haldwani'),
                    email: payload.email || 'client@mail.com',
                    title: 'Direct Inquiry',
                    starred: false,
                    unread: payload.status === 'New',
                    color: payload.status === 'Booked' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                 };

                 if (response.events.some(e => e.includes('create'))) {
                   // 1. Play Lead Arrival Sound
                   try {
                     const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                     audio.volume = 0.5;
                     audio.play().catch(() => {}); // Play() might be blocked
                     showToast(`New Inquiry from ${payload.name || 'someone'}!`, 'success');
                   } catch (audioErr) {
                     console.log('Audio notification blocked by browser.');
                   }

                   setRecentLeads(prev => {
                     if (prev.some(l => l.id === payload.$id)) return prev;
                     return [mapped, ...prev];
                   });
                 } else if (response.events.some(e => e.includes('update'))) {
                   setRecentLeads(prev => prev.map(l => l.id === payload.$id ? mapped : l));
                 } else if (response.events.some(e => e.includes('delete'))) {
                   setRecentLeads(prev => prev.filter(l => l.id !== payload.$id));
                 }
              }
            }
          } catch (handlerErr) {
            console.error('Realtime message handler failed:', handlerErr);
          }
        });
      } catch (err) { 
        console.warn('Realtime sync dormant:', err); 
        setIsRealtimeConnected(false);
        subscribedId.current = null;
      }
    };

    connectRealtime();
    return () => { 
      isMounted = false; 
      if (unsubscribe) {
        unsubscribe();
        subscribedId.current = null;
      }
    };
  }, [venueProfile?.$id, connectionVersion]);

  const [selectedDay, setSelectedDay] = useState(20);
  const [currentMonth, setCurrentMonth] = useState('March');
  // Calendar events moved to state and derived from leads

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [newBookingDay, setNewBookingDay] = useState<number | null>(null);

  const selectedDayEvents = calendarEvents.filter(e => e.day === selectedDay);

  const completeOnboarding = async () => {
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
    setShowOnboarding(false);
    
    // Sync with database if profile exists
    if (venueProfile?.$id) {
       try {
          const { databases, DATABASE_ID, VENUES_COLLECTION_ID } = await import('@/lib/appwrite');
          await databases.updateDocument(DATABASE_ID, VENUES_COLLECTION_ID, venueProfile.$id, {
            onboardingComplete: true
          });
       } catch (err) {
          console.error('Failed to sync onboarding status:', err);
       }
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-pd flex relative">
      


      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-60 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarOpen ? (isMobile ? 280 : 280) : (isMobile ? 0 : 88), 
          opacity: sidebarOpen ? 1 : (isMobile ? 0 : 1),
          x: isMobile && !sidebarOpen ? -280 : 0
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={`bg-white border-r border-slate-200/60 flex flex-col fixed md:sticky top-0 h-dvh z-70 md:z-50 overflow-hidden no-print shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
         <div className={`py-8 pb-4 flex-1 w-full scrollbar-hide overflow-y-auto overflow-x-hidden ${sidebarOpen ? 'px-8' : 'px-4'}`}>
            <div className={`flex items-center ${sidebarOpen ? 'justify-between mb-16 px-2' : 'justify-center mb-16'}`}>
               <Link href="/" className={`group ${sidebarOpen ? 'block' : 'hidden'}`}>
                  <div className="flex flex-col items-start gap-1">
                     <div className="w-40 h-10 relative">
                        <Image 
                           src={logo} 
                           alt="PartyDial" 
                           fill 
                           className="object-contain object-left group-hover:scale-105 transition-transform duration-500" 
                        />
                     </div>
                     <div className="flex items-center gap-2 ml-1">
                        <div className="w-4 h-px bg-pd-pink/50"></div>
                        <span className="text-[10px] font-black uppercase text-pd-pink tracking-[0.5em]  opacity-90">Partner</span>
                     </div>
                  </div>
               </Link>
               <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-md hover:bg-slate-50 active:scale-90 group/close border border-slate-50/50 ${!sidebarOpen ? 'mx-auto' : ''}`}
                  title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
               >
                  {sidebarOpen ? (
                    <PanelLeftClose size={20} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
                  ) : (
                    <PanelLeftOpen size={20} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                  )}
               </button>
            </div>

            <div className="space-y-1">
               <span className={`text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 block opacity-50 ${sidebarOpen ? 'pl-4' : 'text-center pl-0'}`}>
                  {sidebarOpen ? 'Main Menu' : 'Menu'}
               </span>
                {tabs
                  .filter(item => {
                    const isFree = venueProfile?.subscriptionPlan === 'free';
                    if (isFree) {
                      return ['overview', 'reviews'].includes(item.id);
                    }
                    return true;
                  })
                  .map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-4 justify-start' : 'justify-center px-0'} py-3.5 rounded-2xl text-[14px] font-semibold transition-colors duration-200 ${
                      activeTab === item.id 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110 text-pd-pink' : ''}`}>
                      {item.icon}
                    </div>
                    {sidebarOpen && (
                      <span className="tracking-wide whitespace-nowrap">
                        {venueProfile?.subscriptionPlan === 'free' && item.id === 'overview' ? 'My Listing' : item.label}
                      </span>
                    )}
                  </button>
                ))}
             </div>

              {/* Listing Management - Only visible during onboarding */}
             {!isOnboardingComplete && (
               <div className="space-y-1 mt-6 px-2">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block opacity-60 ${sidebarOpen ? 'pl-4' : 'text-center pl-0'}`}>
                    {sidebarOpen ? 'Listing Management' : 'Listing'}
                  </span>
                  {[
                    { id: 'profile', label: 'Set Profile', icon: <User size={18} />, href: '/dashboard/onboarding/profile' },
                    { id: 'photos', label: 'Upload Photos', icon: <ImageIcon size={18} />, href: '/dashboard/onboarding/photos' },
                    { id: 'pricing', label: 'Manage Pricing', icon: <IndianRupee size={18} />, href: '/dashboard/onboarding/pricing' },
                  ].map(item => (
                    <Link key={item.id} href={item.href || '#'} onClick={() => isMobile && setSidebarOpen(false)}>
                      <div className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-4 justify-start' : 'justify-center px-0'} py-3 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-pd-pink transition-all cursor-pointer`} title={!sidebarOpen ? item.label : undefined}>
                        <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                           {item.icon}
                        </div>
                        {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                      </div>
                    </Link>
                  ))}
               </div>
             )}

             <div className="space-y-1 mt-6">
                <span className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ${sidebarOpen ? 'pl-4' : 'text-center pl-0'}`}>
                  System
                </span>
                {secondaryTabs.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-4 justify-start' : 'justify-center px-0'} py-3.5 rounded-2xl text-[14px] font-semibold transition-colors duration-200 ${
                      activeTab === item.id 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110 text-pd-pink' : ''}`}>
                      {item.icon}
                    </div>
                    {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                ))}
             </div>

         </div>

         <div className={`mt-auto ${sidebarOpen ? 'p-6' : 'p-4 flex flex-col items-center'}`}>
            {sidebarOpen ? (
               <div className="bg-white border border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-xl p-3 flex flex-col w-full relative overflow-hidden group mb-4">
                  {/* Subtle background glow based on status */}
                  {expiryInfo && (
                    <div className={`absolute -inset-1 opacity-20 blur-xl transition-all group-hover:opacity-30 ${expiryInfo.daysLeft < 7 ? 'bg-rose-500' : 'bg-emerald-400'}`}></div>
                  )}
                  <div className="relative z-10">
                  {expiryInfo && expiryInfo.daysLeft > 0 ? (
                     <>
                       <div className="flex items-center justify-between w-full mb-3 gap-1">
                          <div className="flex items-center gap-2">
                             <div className="relative flex items-center justify-center bg-slate-50 p-1.5 rounded-lg border border-slate-100 shrink-0">
                                <span className={`absolute w-2 h-2 rounded-full ${expiryInfo.daysLeft < 7 ? 'bg-rose-500' : 'bg-emerald-500'} animate-ping opacity-60`}></span>
                                <span className={`relative w-1.5 h-1.5 rounded-full ${expiryInfo.daysLeft < 7 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                             </div>
                             <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-800 leading-none block mb-0.5 truncate">
                                   {expiryInfo.label}
                                </span>
                                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 leading-none block">
                                   Validity
                                </span>
                             </div>
                          </div>
                          <div className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[9px] font-black tracking-tight border shrink-0 ${
                             expiryInfo.daysLeft < 7 
                               ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.1)]' 
                               : 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                          }`}>
                             <Clock size={10} className={expiryInfo.daysLeft < 7 ? 'animate-pulse' : ''} />
                             <span>{expiryInfo.daysLeft}d left</span>
                          </div>
                       </div>
                       <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${expiryInfo.percent}%` }}
                             transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                             className={`absolute top-0 left-0 h-full rounded-full shadow-sm ${
                                expiryInfo.daysLeft < 7 
                                  ? 'bg-linear-to-r from-rose-500 to-red-500' 
                                  : 'bg-linear-to-r from-pd-pink via-amber-400 to-emerald-400'
                             }`}
                          />
                       </div>
                     </>
                  ) : (
                     <div className="flex flex-col items-center justify-center w-full py-1 gap-2.5">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-600 leading-none text-center">
                              Plan Expired
                           </span>
                        </div>
                        <Link href="/dashboard/onboarding/pricing" className="bg-slate-900 hover:bg-pd-pink transition-colors text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-95 text-center w-full">
                           Upgrade Now
                        </Link>
                     </div>
                  )}
                  </div>
               </div>
            ) : (
               <div className="mb-4 relative group" title={expiryInfo && expiryInfo.daysLeft > 0 ? `${expiryInfo.label}: ${expiryInfo.daysLeft} days left` : 'Plan Expired'}>
                  <div className="relative flex items-center justify-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                     <span className={`absolute w-3 h-3 rounded-full ${!expiryInfo || expiryInfo.daysLeft < 7 ? 'bg-rose-500' : 'bg-emerald-500'} animate-ping opacity-60`}></span>
                     <span className={`relative w-2 h-2 rounded-full ${!expiryInfo || expiryInfo.daysLeft < 7 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  </div>
               </div>
            )}
            
            <button 
               onClick={handleLogout}
               className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-4 justify-start' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold  text-red-500 hover:bg-red-50 transition-colors`}
               title={!sidebarOpen ? "Sign Out" : undefined}
            >
               <LogOut size={20} />
               {sidebarOpen && <span>Sign Out</span>}
            </button>
         </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-screen flex flex-col max-h-screen overflow-y-scroll printable-main relative bg-slate-50">
         
          <header className="shrink-0 h-20 lg:h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 no-print transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.02)]">
            
            {/* Left Section: Context & Navigation */}
            <div className="flex items-center gap-4 lg:gap-6">
               {isMobile && !sidebarOpen && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSidebarOpen(true)}
                    className="w-11 h-11 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900 transition-all"
                    title="Open sidebar"
                  >
                     <PanelLeftOpen size={20} strokeWidth={2} />
                  </motion.button>
               )}
               
               <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                     <div className="px-2 py-0.5 bg-slate-100/80 rounded-md border border-slate-200/50 text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        {formattedDate || 'Loading...'}
                     </div>
                  </div>
                  <div className="text-xl lg:text-2xl font-extrabold tracking-tight leading-none flex items-center gap-2.5">
                     <span className="capitalize text-slate-800 font-bold">{activeTab}</span>
                  </div>
               </div>
            </div>

            {/* Center Section: Plan Validity Status */}


            <div className="flex items-center gap-3 lg:gap-5">

               <div className="hidden sm:flex items-center gap-3 mr-2">

                 <div className="relative flex">
                   <button 
                     onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                     className="w-10 h-10 rounded-full bg-white border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-center text-slate-600 hover:text-pd-pink hover:bg-slate-50 transition-all relative group"
                   >
                     <Bell size={18} className="group-hover:scale-110 transition-transform duration-300" />
                     {unreadLeadsCount > 0 && (
                       <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-linear-to-tr from-pd-pink to-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-md">
                         {unreadLeadsCount}
                       </span>
                     )}
                   </button>

                   <NotificationDropdown 
                     isOpen={showNotifDropdown}
                     onClose={() => setShowNotifDropdown(false)}
                     notifications={recentLeads}
                     onViewAll={() => setActiveTab('leads')}
                     lastClearedTime={lastClearedTime}
                   />
                 </div>
               </div>
               
               <div className="hidden lg:block h-8 w-px bg-slate-200/50"></div>

               {venueProfile && !venueProfile.isVerified && venueProfile.onboardingComplete && (
                  <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        setShowVerificationModal(true);
                     }}
                     className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black tracking-widest uppercase shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                     Verify Profile
                  </button>
               )}
               <div 
                  onClick={() => { setActiveTab('settings'); setSettingsSection('profile'); }}
                  className="flex items-center gap-3 lg:gap-4 pl-1 cursor-pointer group hover:opacity-90 active:scale-[0.98] transition-all"
               >
                  <div className="text-right hidden md:flex flex-col items-end">
                     <p className="text-[14px] font-black text-slate-900 leading-none mb-1 group-hover:text-pd-pink transition-colors">{venueProfile?.venueName || userData?.name || "Your Venue"}</p>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${hasActivePaidPlan ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-100/70 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${!isRealtimeConnected ? 'bg-rose-500' : hasActivePaidPlan ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></span>
                        <p className={`text-[9px] ${!isRealtimeConnected ? 'text-rose-600' : hasActivePaidPlan ? 'text-emerald-600' : 'text-slate-600'} font-black uppercase tracking-widest leading-none`}>
                            {!isRealtimeConnected 
                              ? 'Reconnecting' 
                              : (planLabels[venueProfile?.subscriptionPlan] || (hasActivePaidPlan ? 'Live' : 'Standard'))}
                        </p>
                      </div>
                  </div>
                  <div className="relative">
                     <div className="w-11.5 h-11.5 lg:w-12.5 lg:h-12.5 rounded-2xl bg-linear-to-tr from-pd-pink via-purple-500 to-emerald-400 p-0.5 shadow-lg shadow-slate-200/50 group-hover:shadow-pd-pink/20 group-hover:scale-105 transition-all duration-300">
                        <div className="w-full h-full rounded-[14px] bg-white overflow-hidden flex items-center justify-center border-2 border-white">
                           {(() => {
                              try {
                                 const photos = typeof venueProfile?.photos === 'string' ? JSON.parse(venueProfile.photos) : venueProfile?.photos;
                                 let avatar = null;
                                 if (Array.isArray(photos)) {
                                     let firstPhoto = null;
                                     for (const p of photos) {
                                         if (typeof p === 'object' && p !== null) {
                                             if (!firstPhoto) firstPhoto = p;
                                             if (p.category === 'Profile') { avatar = p; break; }
                                         }
                                         if (typeof p === 'string') {
                                             try {
                                                 const obj = JSON.parse(p);
                                                 if (!firstPhoto && obj) firstPhoto = obj;
                                                 if (obj && obj.category === 'Profile') { avatar = obj; break; }
                                             } catch(e) {
                                                 if (!firstPhoto) firstPhoto = { id: p };
                                             }
                                         }
                                     }
                                     if (!avatar) avatar = firstPhoto;
                                 }
                                 if (avatar) {
                                    return (
                                       <Image 
                                          src={`https://sgp.cloud.appwrite.io/v1/storage/buckets/venues_photos/files/${avatar.id}/view?project=69ae84bc001ca4edf8c2`} 
                                          alt="Venue Profile" 
                                          width={48} 
                                          height={48} 
                                          className="object-cover w-full h-full" 
                                       />
                                    );
                                 }
                              } catch (e) { console.error('Failed to parse avatar:', e); }
                              return (
                                 <Image 
                                    src={`https://i.pravatar.cc/100?u=${encodeURIComponent((venueProfile?.venueName || 'partner').trim())}`} 
                                    alt="Default Profile" 
                                    width={48} 
                                    height={48} 
                                    className="grayscale-[0.4]" 
                                 />
                              );
                           })()}
                        </div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                     </div>
                  </div>
               </div>
            </div>
         </header>

         {/* DASHBOARD CONTENT */}
         <div className="p-4 lg:p-8">
            
            {/* Profile Status Indicator */}
            {activeTab === 'overview' && venueProfile && (
               <div className="mb-6 lg:mb-8 flex">
                 {(() => {
                   const status = venueProfile.isVerified 
                     ? { label: "Approved Profile", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <ShieldCheck size={14} className="text-emerald-500" /> }
                     : venueProfile.status === 'rejected'
                     ? { label: "Rejected – Please Update Your Profile", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: <XCircle size={14} className="text-rose-500" /> }
                     : { label: "Waiting for Approval", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Clock size={14} className="text-amber-500" /> };
                   
                   return (
                     <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 px-5 py-3 rounded-[20px] border ${status.color} backdrop-blur-sm shadow-sm transition-all group hover:scale-[1.02] cursor-default`}
                     >
                        <div className="flex items-center justify-center">
                           {status.icon}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black opacity-60 uppercase tracking-[0.2em] leading-none mb-1">Listing Status</span>
                           <p className="text-[10px] font-black uppercase tracking-widest ">{status.label}</p>
                        </div>
                     </motion.div>
                   );
                 })()}
               </div>
            )}

            {activeTab === 'overview' && (
              <DashboardOverview 
                venueProfile={venueProfile}
                userName={userData?.name}
                recentLeads={recentLeads}
                setActiveTab={setActiveTab}
                averageRating={venueProfile?.rating || (reviewsData.length > 0 ? reviewsData.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviewsData.length : 0.0)}
                setShowInquiryPopup={setShowInquiryPopup}
              />
            )}

            {activeTab === 'leads' && (
              hasActivePaidPlan ? (
                <LeadInbox 
                  filteredAdvancedLeads={filteredAdvancedLeads}
                  leadFilter={leadFilter}
                  setLeadFilter={setLeadFilter}
                  updateLeadStatus={updateLeadStatus}
                  setActiveTab={setActiveTab}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-125 bg-white rounded-[40px] border border-slate-100 shadow-pd-soft p-12 text-center"
                >
                   <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-8 mx-auto shadow-inner">
                      <Zap size={45} className="fill-amber-500 animate-pulse" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase  tracking-tighter mb-4">Direct Leads Restricted</h3>
                   <p className="text-slate-500 font-medium  max-w-md mx-auto mb-12 leading-relaxed">
                      Your profile is currently on the <span className="text-slate-900 font-bold">Free Plan</span>. Purchase a subscription to unlock real-time inquiries, lead management tools, and customer contact details.
                   </p>
                   <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <button 
                         onClick={() => setShowInquiryPopup(true)}
                         className="px-10 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-3xl hover:bg-pd-pink transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                       >
                          Unlock All Features <ArrowUpRight size={18} />
                       </button>
                      <button onClick={() => setActiveTab('support')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                         Talk to Support
                      </button>
                   </div>
                </motion.div>
              )
            )}

            {activeTab === 'quotations' && (
              hasActivePaidPlan ? (
              <QuotationManager 
                quoteData={quoteData}
                setQuoteData={setQuoteData}
                handleFinalize={handleFinalize}
                isFinalizing={isFinalizing}
                qtnSuccess={qtnSuccess}
                setActiveTab={setActiveTab}
                logo={logo}
                handleDownload={() => {}}
                handleSend={() => {}}
                venueProfile={venueProfile}
                showToast={showToast}
                subtotal={subtotal}
                gstAmount={gstAmount}
                totalWithTax={totalWithTax}
              />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-125 bg-white rounded-[40px] border border-white shadow-pd-soft p-12 text-center"
                >
                   <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-8 mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase  tracking-tighter mb-4">Quotations Locked</h3>
                   <p className="text-slate-500 font-medium  max-w-md mx-auto mb-12 leading-relaxed">
                      Sending professional quotations and tracking their status requires an active subscription. Upgrade your plan to use this feature.
                   </p>
                </motion.div>
              )
            )}

            {activeTab === 'pipeline' && (
              hasActivePaidPlan ? (
                <LeadPipeline 
                  recentLeads={recentLeads}
                  pipelineStages={PIPELINE_STAGES}
                  updateLeadStatus={updateLeadStatus}
                  setActiveTab={setActiveTab}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-125 bg-white rounded-[40px] border border-white shadow-pd-soft p-12 text-center"
                >
                   <div className="w-24 h-24 bg-pd-purple/5 rounded-full flex items-center justify-center text-pd-purple mb-8 mx-auto">
                      <Target size={45} className="animate-bounce" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase  tracking-tighter mb-4">Pipeline Locked</h3>
                   <p className="text-slate-500 font-medium  max-w-md mx-auto mb-12 leading-relaxed">
                      Managing your sales pipeline and booking flow requires an active subscription. Upgrade today to start converting inquiries into bookings.
                   </p>
                   <button 
                      onClick={() => setShowInquiryPopup(true)}
                      className="px-10 py-5 bg-pd-purple text-white text-[11px] font-black uppercase tracking-widest rounded-3xl hover:bg-slate-900 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                   >
                      Activate Sales Pipeline <Sparkles size={18} />
                   </button>
                </motion.div>
              )
            )}
            {activeTab === 'calendar' && (
              <VenueCalendar 
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                calendarView={calendarView}
                setCalendarView={setCalendarView}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                calendarEvents={calendarEvents}
                setIsBookingModalOpen={setIsBookingModalOpen}
                setNewBookingDay={setNewBookingDay}
              />
            )}

            {activeTab === 'reviews' && (
              hasActivePaidPlan ? (
              <ReviewManager 
                venueId={venueProfile?.$id}
                replyTarget={replyTarget}
                setReplyTarget={setReplyTarget}
                showToast={showToast}
              />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-125 bg-white rounded-[40px] border border-white shadow-pd-soft p-12 text-center"
                >
                   <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-8 mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase  tracking-tighter mb-4">Reviews Locked</h3>
                   <p className="text-slate-500 font-medium  max-w-md mx-auto mb-12 leading-relaxed">
                      Responding to customer reviews and managing your reputation requires an active subscription. Upgrade your plan to use this feature.
                   </p>
                </motion.div>
              )
            )}

            {activeTab === 'finance' && (
              <FinanceHub setActiveTab={setActiveTab} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsCenter />
            )}

            {activeTab === 'support' && (
              <QuickSupport />
            )}

            {activeTab === 'settings' && (
              <DashboardSettings 
                settingsSection={settingsSection}
                setSettingsSection={setSettingsSection}
                venueProfile={venueProfile}
                handleProfileUpdate={handleProfileUpdate}
                handleAmenityToggle={handleAmenityToggle}
                handleEventTypeToggle={handleEventTypeToggle}
                saveProfileSettings={saveProfileSettings}
                isUpdatingProfile={isUpdatingProfile}
                showToast={showToast}
              />
            )}

            {activeTab === 'history' && (
              <SystemHistory 
                pastActivities={pastActivities}
              />
            )}


          </div>

      </main>

      {/* Modern Smooth Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-10001 px-6 py-4 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-white/10 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-slate-900 text-white' 
                : 'bg-red-950 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={18} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <XCircle size={18} />
              </div>
            )}
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">System Message</span>
               <p className="text-[12px] font-black uppercase tracking-tight ">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors">
               <X size={14} className="text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      <PartnerInquiryPopup 
        isOpen={showInquiryPopup}
        onClose={() => setShowInquiryPopup(false)}
        venueProfile={venueProfile}
      />

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        venueProfile={venueProfile}
      />

      <LeadExplorer 
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        leadFilter={leadFilter}
        setLeadFilter={setLeadFilter}
        recentLeads={recentLeads}
        selectedEventTypes={selectedEventTypes}
        setSelectedEventTypes={setSelectedEventTypes}
        guestRange={guestRange}
        setGuestRange={setGuestRange}
        filteredLeads={filteredAdvancedLeads}
      />

    <style jsx global>{`
      @media print {
        /* Reset layout for print */
        html, body {
          height: auto !important;
          overflow: visible !important;
          background: white !important;
        }

        .no-print {
          display: none !important;
        }

        /* Essential to allow overflow through restrictive parents */
        .min-h-screen, .printable-main, .printable-container {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          position: relative !important;
          display: block !important;
        }

        .print-only {
          display: block !important;
          visibility: visible !important;
          width: 100% !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          min-height: auto !important;
          margin: 0 !important;
          padding: 2.5cm !important; /* Proper margin according to A4 size */
          page-break-after: always;
        }

        .print-only * {
          visibility: visible !important;
        }
        
        /* High contrast for printing */
        .text-slate-400, .text-slate-500, .text-slate-600 {
          color: #333 !important;
        }
      }
    `}</style>
    </div>
  );
}
// trigger rebuild
