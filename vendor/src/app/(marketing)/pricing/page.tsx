'use client';

import React, { useState, useEffect } from 'react';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { account, databases, DATABASE_ID, VENUES_COLLECTION_ID, Query } from '@/lib/appwrite';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ChevronDown, 
  Zap, 
  Star,
  Plus,
  Sparkle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin
} from 'lucide-react';

// --- STYLES ---

const gradientStyle = "bg-linear-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500";

// --- DATA ---

const pricingPlans = [
  {
    id: 1,
    name: "Upto 50 PAX",
    packName: "Starter Pack",
    mrp: { quarterly: 5310, halfYearly: 10620, annually: 21535 },
    price: { quarterly: 4410, halfYearly: 7920, annually: 12045 },
    leads: "Unlimited Leads",
    features: [
      "Basic listing visibility",
      "Standard search placement",
      "Lead notifications (App + Email)",
      "Upload up to 10 photos",
      "Basic customer support"
    ],
    popular: false,
    cta: "Get Started"
  },
  {
    id: 2,
    name: "Upto 100 PAX",
    packName: "Growth Pack",
    mrp: { quarterly: 6210, halfYearly: 12420, annually: 25185 },
    price: { quarterly: 5310, halfYearly: 9900, annually: 16060 },
    leads: "Unlimited Leads",
    features: [
      "Improved listing visibility",
      "WhatsApp lead alerts",
      "Standard placement in search",
      "Upload up to 20 photos",
      "Basic analytics dashboard"
    ],
    popular: false,
    cta: "Get Started"
  },
  {
    id: 3,
    name: "Upto 200 PAX",
    packName: "Priority Pack",
    mrp: { quarterly: 10710, halfYearly: 21420, annually: 43435 },
    price: { quarterly: 8910, halfYearly: 16920, annually: 28105 },
    leads: "Unlimited Leads",
    features: [
      "Priority listing in search results",
      "WhatsApp notifications",
      "Lead insights dashboard",
      "Faster lead delivery",
      "Upload up to 30 photos"
    ],
    popular: true,
    cta: "Get Started"
  },
  {
    id: 4,
    name: "Upto 500 PAX",
    packName: "Featured Pack",
    mrp: { quarterly: 16110, halfYearly: 32220, annually: 65335 },
    price: { quarterly: 14310, halfYearly: 26820, annually: 44895 },
    leads: "Unlimited Leads",
    features: [
      "Featured placement in listings",
      "Priority visibility in search",
      "Lead filtering system",
      "Priority customer support",
      "Upload up to 40 photos"
    ],
    popular: false,
    cta: "Get Started"
  },
  {
    id: 5,
    name: "Upto 1000 PAX",
    packName: "Premium Pack",
    mrp: { quarterly: 22410, halfYearly: 44820, annually: 90885 },
    price: { quarterly: 19710, halfYearly: 35820, annually: 65335 },
    leads: "Unlimited Leads",
    features: [
      "Premium placement in listings",
      "High visibility ranking",
      "Faster lead routing",
      "Advanced performance analytics",
      "Upload up to 50 photos"
    ],
    popular: false,
    cta: "Get Started"
  },
  {
    id: 6,
    name: "Upto 2000 PAX",
    packName: "Elite Pack",
    mrp: { quarterly: 30510, halfYearly: 61020, annually: 123735 },
    price: { quarterly: 26910, halfYearly: 48600, annually: 90885 },
    leads: "Unlimited Leads",
    features: [
      "Top city visibility",
      "Premium ranking placement",
      "Advanced lead analytics",
      "Priority lead routing",
      "Upload up to 60 photos"
    ],
    popular: false,
    cta: "Get Started"
  },
  {
    id: 7,
    name: "Upto 5000 PAX",
    packName: "Platinum Pack",
    mrp: { quarterly: 50310, halfYearly: 100620, annually: 204035 },
    price: { quarterly: 41310, halfYearly: 79020, annually: 138335 },
    leads: "Unlimited Leads",
    features: [
      "High priority ranking",
      "Dedicated support assistance",
      "Premium listing visibility",
      "Advanced reporting dashboard",
      "Upload up to 75 photos"
    ],
    popular: false,
    cta: "Get Started"
  },
  {
    id: 8,
    name: "5000+ PAX",
    packName: "Enterprise Pack",
    mrp: { quarterly: 89910, halfYearly: 179820, annually: 364635 },
    price: { quarterly: 62910, halfYearly: 118620, annually: 218635 },
    leads: "Unlimited Leads",
    features: [
      "Exclusive lead priority",
      "Dedicated account manager",
      "Highest platform visibility",
      "Custom promotional support",
      "Unlimited photo uploads"
    ],
    popular: false,
    cta: "Contact Sales"
  }
];

// --- COMPONENTS ---

const InquiryPopup = React.memo(({ plan, billingDuration, onClose }: { plan: typeof pricingPlans[0] | null, billingDuration: 'quarterly' | 'halfYearly' | 'annually', onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    venueName: '',
    city: '',
    pincode: '',
    selectedPlanId: plan?.id || pricingPlans[0].id
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Pincode/Location states
  const [suggestions, setSuggestions] = useState<{display: string, city: string, district: string, pincode: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData(prev => ({ ...prev, selectedPlanId: plan.id }));
    }
  }, [plan]);

  // Indian Post API Auto-suggest
  useEffect(() => {
    const fetchPincode = async () => {
      const input = formData.pincode.trim();
      if (input.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoadingPincode(true);
      try {
        const url = /^\d+$/.test(input) 
          ? `https://api.postalpincode.in/pincode/${input}`
          : `https://api.postalpincode.in/postoffice/${input}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data[0].Status === 'Success') {
          const offices = data[0].PostOffice;
          setSuggestions(offices.map((o: { Name: string, District: string, Pincode: string }) => ({
            display: `${o.Name}, ${o.District}`,
            city: o.Name,
            district: o.District,
            pincode: o.Pincode
          })).slice(0, 5));
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Pincode fetch error:', err);
      } finally {
        setIsLoadingPincode(false);
      }
    };

    const timer = setTimeout(fetchPincode, 400);
    return () => clearTimeout(timer);
  }, [formData.pincode]);

  const selectPincode = (suggestion: { city: string, district: string, pincode: string }) => {
    setFormData(prev => ({ 
      ...prev, 
      pincode: suggestion.pincode, 
      city: `${suggestion.city}, ${suggestion.district}` 
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const selectedPlan = pricingPlans.find(p => p.id === formData.selectedPlanId);
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://party-dial-product-server.onrender.com/api';
      const serverUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      const response = await fetch(`${serverUrl}/leads/partner-enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          plan: selectedPlan ? `${selectedPlan.name} (${selectedPlan.packName}) - Billed ${billingDuration === 'quarterly' ? 'Quarterly' : billingDuration === 'halfYearly' ? 'Half-Yearly' : 'Annually'}` : 'Custom',
          venueName: formData.venueName,
          city: formData.city,
          pincode: formData.pincode,
          guestCapacity: selectedPlan?.name.split(' ')[0] || '0'
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert('Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Internal error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-125 bg-white rounded-2xl shadow-2xl z-10 border border-slate-100 flex flex-col max-h-[90vh]"
      >
        <button 
           onClick={onClose} 
           className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors z-20"
        >
          <Plus className="rotate-45" size={18} />
        </button>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {!isSubmitted ? (
            <div className="relative z-10 text-left">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pd-blue/5 text-pd-blue rounded-md mb-4 border border-pd-blue/10">
                  <Sparkle size={12} fill="currentColor" className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Quick Enquiry</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Partner Enquiry
                </h2>
                <p className="text-sm text-slate-500 font-medium">Complete the form below to get started</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:border-pd-blue focus:ring-1 focus:ring-pd-blue/20 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="+91 00000 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:border-pd-blue focus:ring-1 focus:ring-pd-blue/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:border-pd-blue focus:ring-1 focus:ring-pd-blue/20 transition-all outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Preferred Plan</label>
                  <div className="relative">
                    <select 
                      className="w-full h-11 bg-white border border-slate-200 rounded-lg pl-4 pr-10 text-sm text-slate-900 focus:border-pd-blue focus:ring-1 focus:ring-pd-blue/20 transition-all outline-none appearance-none cursor-pointer"
                      value={formData.selectedPlanId}
                      onChange={(e) => setFormData(prev => ({ ...prev, selectedPlanId: parseInt(e.target.value) }))}
                    >
                      {pricingPlans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.packName})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Venue Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Grand Hotel"
                      value={formData.venueName}
                      onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                      className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:border-pd-blue focus:ring-1 focus:ring-pd-blue/20 transition-all outline-none"
                    />
                  </div>

                  <div className="group space-y-1 relative">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Pincode</label>
                    <div className="relative">
                      <input 
                        required 
                        type="text" 
                        placeholder="110001"
                        value={formData.pincode}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, pincode: e.target.value }));
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        autoComplete="off"
                        className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:border-pd-blue focus:ring-1 focus:ring-pd-blue/20 transition-all outline-none"
                      />
                      {isLoadingPincode && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-pd-blue" size={14} />}
                      
                      <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 right-0 top-[110%] bg-white border border-slate-100 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto p-1 custom-scrollbar"
                          >
                            {suggestions.map((s, idx) => (
                              <button 
                                key={idx}
                                type="button"
                                onClick={() => selectPincode(s)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-pd-blue transition-colors rounded-md flex items-center gap-2"
                              >
                                <MapPin size={12} /> {s.display} ({s.pincode})
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">City / Area</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="New Delhi"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:border-pd-blue focus:ring-1 focus:ring-pd-blue/20 transition-all outline-none"
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full h-12 bg-slate-900 hover:bg-pd-blue text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 mt-6"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>Submit Inquiry <ChevronRight size={16} /></>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Inquiry Sent!</h3>
              <p className="text-sm text-slate-500 font-medium">
                Our team will reach out to you within <span className="text-pd-blue font-bold">4 working hours</span>.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
});

InquiryPopup.displayName = 'InquiryPopup';

const PricingCard = React.memo(({ plan, onSelect, billingDuration, onBuyNow }: { plan: typeof pricingPlans[0], onSelect: (plan: typeof pricingPlans[0]) => void, billingDuration: 'quarterly' | 'halfYearly' | 'annually', onBuyNow: (plan: typeof pricingPlans[0]) => void }) => {
  const currentMrp = plan.mrp[billingDuration];
  const currentPrice = plan.price[billingDuration];
  const discount = Math.round(((currentMrp - currentPrice) / currentMrp) * 100);
  
  const days = billingDuration === 'quarterly' ? 90 : billingDuration === 'halfYearly' ? 180 : 365;
  const dailyMrp = Math.round(currentMrp / days);
  const dailyPrice = Math.round(currentPrice / days);

  const billingLabel = billingDuration === 'quarterly' ? 'Billed Quarterly' : billingDuration === 'halfYearly' ? 'Billed Half-Yearly' : 'Billed Annually';
  
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative h-full ${plan.popular ? 'scale-[1.03] z-10' : 'z-0'}`}
    >
      <div className={`h-full flex flex-col p-5 md:p-6 rounded-3xl bg-white relative transition-all duration-300 ${plan.popular ? 'shadow-[0_20px_50px_-12px_rgba(236,72,153,0.2)]' : 'border border-slate-200 shadow-xl hover:shadow-2xl hover:border-slate-300'}`}>
        {plan.popular && (
          <>
             <div className={`absolute -inset-0.5 rounded-3xl -z-10 pointer-events-none ${gradientStyle}`}></div>
             <div className={`absolute -inset-0.5 rounded-3xl -z-20 opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50 pointer-events-none ${gradientStyle}`}></div>
          </>
        )}

        <div className="absolute top-5 right-5 pointer-events-none">
          <span className={`${gradientStyle} text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md shadow-pink-500/20`}>
            Save {discount}%
          </span>
        </div>

        <div className="mb-5 overflow-visible relative">
          {plan.popular && (
            <div className="flex items-center gap-1.5 text-pink-600 font-black text-[9px] uppercase tracking-[0.2em] mb-2 mt-1">
               <Star size={10} fill="currentColor" className="animate-pulse" /> MOST POPULAR
            </div>
          )}
            <div className="flex flex-col mb-3">
               <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight uppercase">{plan.name}</h3>
               <span className="text-[9px] font-black text-pd-purple uppercase tracking-[0.2em] mt-1">{plan.packName}</span>
            </div>
          <div className="space-y-1 relative">
            <p className="text-xs text-slate-400 line-through font-bold leading-none decoration-2 decoration-slate-300">₹{dailyMrp.toLocaleString()}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900 tracking-tighter drop-shadow-sm">₹{dailyPrice.toLocaleString()}</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">/ day</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 bg-slate-100 inline-block px-1.5 py-0.5 rounded-md">{billingLabel}</p>
          </div>
        </div>

        <div className={`mb-6 p-4 rounded-xl border transition-all duration-300 ${plan.popular ? 'bg-pink-50/50 border-pink-100 shadow-inner' : 'bg-slate-50/80 border-slate-100 shadow-inner hover:bg-white'}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={12} className={`${plan.popular ? 'text-pink-500 fill-pink-500' : 'text-slate-400 fill-slate-400'}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${plan.popular ? 'text-pink-600' : 'text-slate-500'}`}>Lead Capacity</span>
          </div>
          <p className="text-xl font-black bg-linear-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">{plan.leads}</p>
        </div>

        <div className="grow space-y-3 mb-6">
          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2.5 group/feature">
              <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${plan.popular ? 'bg-pink-100 text-pink-600 group-hover/feature:bg-pink-500 group-hover/feature:text-white' : 'bg-slate-100 text-slate-500 group-hover/feature:bg-slate-900 group-hover/feature:text-white'}`}>
                <Check size={10} strokeWidth={4} />
              </div>
              <span className="text-xs font-semibold text-slate-600 leading-tight group-hover/feature:text-slate-900 transition-colors">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 w-full relative z-20">
          <button 
            onClick={() => onBuyNow(plan)}
            className={`flex-1 flex items-center justify-center py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest sm:tracking-[0.15em] transition-all duration-300 ${gradientStyle} text-white shadow-lg hover:shadow-xl hover:shadow-pink-500/30 hover:scale-[1.02] cursor-pointer`}
          >
            Buy Now
          </button>
          <button 
            onClick={() => {
              localStorage.setItem('billingDuration', billingDuration);
              onSelect(plan);
            }}
            className="flex-1 py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest sm:tracking-[0.15em] transition-all duration-300 bg-white border-2 border-slate-200 text-slate-700 hover:border-pink-400 hover:text-pink-600 shadow-sm hover:shadow-md cursor-pointer"
          >
            Contact Us
          </button>
        </div>
      </div>
    </motion.div>
  );
});

PricingCard.displayName = 'PricingCard';

export default function PricingPage() {
  const [inquiryPlan, setInquiryPlan] = useState<typeof pricingPlans[0] | null>(null);
  const [billingDuration, setBillingDuration] = useState<'quarterly' | 'halfYearly' | 'annually'>('annually');
  
  const router = useRouter();

  const handleBuyNow = async (plan: typeof pricingPlans[0]) => {
    try {
      
      const user = await account.get().catch(() => null);
      if (!user) {
         router.push('/login?redirect=/pricing');
         return;
      }
      
      let currentVenueId = user?.prefs?.venueId;
      if (!currentVenueId) {
         try {
            const vRes = await databases.listDocuments(DATABASE_ID, VENUES_COLLECTION_ID, [Query.equal('userId', user.$id)]);
            if (vRes.documents.length > 0) {
               currentVenueId = vRes.documents[0].$id;
            }
         } catch (e) {
            console.error('Failed to fetch venue ID:', e);
         }
      }
      
      const base = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5005/api";
      const serverUrl = base.endsWith("/api") ? base : `${base}/api`;
      const amount = plan.price[billingDuration];
      
      // 1. Create Order
      const orderRes = await fetch(`${serverUrl}/payments/create-order`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            amount: Math.round(amount * 100), // convert to paise
            venueId: currentVenueId || null,
            receipt: `rcpt_${Date.now()}`
         })
      });
      const order = await orderRes.json();
      
      console.log('Order created:', order);
      console.log('Razorpay Key:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      if (order.error) {
         alert(order.message || "Order creation failed");
         
         return;
      }

      const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "PartyDial",
          description: `Payment for ${plan.name}`,
          order_id: order.id,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; }) => {
              // Verify Payment
              try {
                  const verifyRes = await fetch(`${serverUrl}/payments/verify-payment`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          ...response,
                          venueId: currentVenueId || null,
                          venueName: user?.name || "",
                          ownerEmail: user?.email,
                          planId: plan.id === 1 ? 'bp50' : plan.id === 2 ? 'bp100' : plan.id === 3 ? 'bp200' : plan.id === 4 ? 'bp500' : plan.id === 5 ? 'bp1000' : plan.id === 6 ? 'bp2000' : plan.id === 7 ? 'bp5000' : 'bp9999',
                          planName: plan.name,
                          billingDuration: billingDuration,
                          amount: amount,
                          basePrice: amount,
                          addons: [],
                          discount: 0,
                          billingDetails: { name: user.name, email: user.email, mobile: user.phone || "" },
                          couponCode: null,
                          preAddonId: null
                      })
                  });
                  const verifyResult = await verifyRes.json();
                  if (verifyResult.status === 'success') {
                      window.location.href = '/dashboard';
                  } else {
                      alert("Payment verification failed");
                  }
              } catch (err) {
                  alert("Payment Verification Error");
              }
          },
          prefill: {
              name: user.name,
              email: user.email,
          },
          theme: {
              color: "#8b5cf6"
          }
      };
      
      const rzp = new (window as unknown as { Razorpay: any }).Razorpay(options);
      rzp.on('payment.failed', function (err: any){
          alert("Payment Failed");
      });
      rzp.open();
    } catch(err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      
    }
  }


  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 selection:bg-pink-500 selection:text-white font-sans antialiased">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <AnimatePresence>
        {inquiryPlan && (
          <InquiryPopup 
            plan={inquiryPlan} 
            billingDuration={billingDuration}
             
            onClose={() => setInquiryPlan(null)} 
          />
        )}
      </AnimatePresence>

      {/* 2. PRICING SECTION (MAIN) */}
      <section className="pt-32 pb-40 md:pt-40 lg:pb-48 px-6 lg:px-12 relative overflow-hidden bg-slate-50">
        {/* Decorative elements from image */}
        <div className="absolute top-10 left-10 opacity-40 transform -rotate-12">
          <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 20C10 10 20 10 30 20C40 30 50 30 60 20C70 10 80 10 90 20" stroke="#f43f5e" strokeWidth="4" />
            <path d="M0 30C10 20 20 20 30 30C40 40 50 40 60 30C70 20 80 20 90 30" stroke="#8b5cf6" strokeWidth="4" />
          </svg>
        </div>
        <div className="absolute bottom-10 right-10 opacity-40">
           <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 20C10 10 20 10 30 20C40 30 50 30 60 20C70 10 80 10 90 20" stroke="#f43f5e" strokeWidth="4" />
            <path d="M0 30C10 20 20 20 30 30C40 40 50 40 60 30C70 20 80 20 90 30" stroke="#8b5cf6" strokeWidth="4" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight uppercase ">Pricing</h2>
          <p className="text-slate-500 font-bold text-lg">(According to Pax, you serve)</p>
          
          <div className="flex justify-center mt-8 mb-4">
            <div className="inline-flex bg-white p-1.5 rounded-full shadow-sm border border-slate-200">
              {(['quarterly', 'halfYearly', 'annually'] as const).map((duration) => (
                <button
                  key={duration}
                  onClick={() => setBillingDuration(duration)}
                  className={`px-3 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-bold capitalize transition-all duration-300 ${
                    billingDuration === duration
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {duration === 'halfYearly' ? 'Half-Yearly' : duration}
                </button>
              ))}
            </div>
          </div>
          <motion.div 
            key={billingDuration}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-500 font-black text-[10px] uppercase tracking-widest mt-4 flex items-center justify-center gap-2"
          >
             <Sparkle size={14} fill="currentColor" />
             {billingDuration === 'annually' && 'Save up to 23% with Annual Billing'}
             {billingDuration === 'halfYearly' && 'Save up to 18% with Half-Yearly Billing'}
             {billingDuration === 'quarterly' && 'Save up to 10% with Quarterly Billing'}
             <Sparkle size={14} fill="currentColor" />
          </motion.div>
        </div>

        <div className="max-w-384 mx-auto relative px-4 lg:px-8">
          {/* Side Arrows from image */}
          <div className="absolute -left-4 xl:-left-8 top-1/2 -translate-y-1/2 hidden xl:block text-slate-200">
             <ChevronRight className="rotate-180" size={48} strokeWidth={3} />
             <ChevronRight className="rotate-180 -mt-8" size={48} strokeWidth={3} />
          </div>
          <div className="absolute -right-4 xl:-right-8 top-1/2 -translate-y-1/2 hidden xl:block text-slate-200">
             <ChevronRight size={48} strokeWidth={3} />
             <ChevronRight className="-mt-8" size={48} strokeWidth={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} onSelect={setInquiryPlan} billingDuration={billingDuration} onBuyNow={handleBuyNow} />
            ))}
          </div>
        </div>


      </section>



    </div>
  );
}

