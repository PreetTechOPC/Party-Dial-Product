'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    mobile: '',
    billingAddress: '',
    gstNumber: '',
    planName: '',
    planDuration: '1 Year',
    planPrice: '',
    gstAmount: '',
    totalAmount: '',
    paymentMethod: 'Bank Transfer'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-calculate GST and Total if base price changes
    if (name === 'planPrice' && value) {
        const base = parseFloat(value) || 0;
        const gst = base * 0.18;
        const total = base + gst;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            gstAmount: gst.toFixed(2),
            totalAmount: total.toFixed(2)
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  
  const handlePreview = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPreviewing(true);
    
    try {
      const base = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5005/api";
      const serverUrl = base.endsWith("/api") ? base : `${base}/api`;

      const res = await fetch(`${serverUrl}/payments/preview-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...formData,
           paymentDate: new Date().toLocaleDateString('en-IN')
        })
      });

      if (!res.ok) {
         throw new Error("Failed to generate preview");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup URL object after opening
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      
    } catch (err) {
      console.error(err);
      alert("Failed to generate preview");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const base = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5005/api";
      const serverUrl = base.endsWith("/api") ? base : `${base}/api`;

      const res = await fetch(`${serverUrl}/payments/manual-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...formData,
           paymentDate: new Date().toLocaleDateString('en-IN')
        })
      });

      const json = await res.json();
      if (json.status === 'success') {
        alert("Invoice generated and emailed successfully!");
        router.push('/billing/invoices');
      } else {
        alert("Failed to generate invoice: " + (json.message || json.error));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <Link href="/billing/invoices" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
               <ChevronLeft size={20} />
            </Link>
             <div>
                <h1 className="text-3xl font-black text-slate-800 m-0 tracking-tight">Create Manual Invoice</h1>
                <p className="text-sm text-slate-400 font-medium mt-1">Generate PDF and email to client</p>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Client Details Section */}
              <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Client Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client / Venue Name *</label>
                          <input required type="text" name="venueName" value={formData.venueName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm" placeholder="e.g. The Grand Hotel" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address *</label>
                          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm" placeholder="client@example.com" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number</label>
                          <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm" placeholder="+91 9876543210" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">GST Number</label>
                          <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm" placeholder="27XXXXX..." />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Address</label>
                          <textarea name="billingAddress" value={formData.billingAddress} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm" placeholder="Full street address..." />
                      </div>
                  </div>
              </div>

              {/* Invoice Details Section */}
              <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Invoice Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description / Plan Name *</label>
                          <input required type="text" name="planName" value={formData.planName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm" placeholder="e.g. 50-100 PAX Membership" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration</label>
                          <input type="text" name="planDuration" value={formData.planDuration} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm" placeholder="e.g. 1 Year" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Method</label>
                          <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm bg-white">
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="UPI">UPI</option>
                              <option value="Cash">Cash</option>
                              <option value="Cheque">Cheque</option>
                          </select>
                      </div>
                  </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Pricing</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Price (₹) *</label>
                          <input required type="number" name="planPrice" value={formData.planPrice} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm font-semibold" placeholder="0.00" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">GST (18%)</label>
                          <input type="number" name="gstAmount" value={formData.gstAmount} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm font-semibold bg-slate-100 text-slate-500" placeholder="0.00" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Amount (₹)</label>
                          <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm font-bold text-purple-700" placeholder="0.00" />
                      </div>
                  </div>
              </div>

                            <div className="flex justify-end pt-4 gap-4">
                  <button 
                      type="button" 
                      onClick={handlePreview}
                      disabled={isPreviewing || isSubmitting}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-purple-500 hover:text-purple-600 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                      {isPreviewing ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} strokeWidth={2.5} />}
                      <span>{isPreviewing ? 'Generating...' : 'Preview Invoice'}</span>
                  </button>

                  <button 
                      type="submit" 
                      disabled={isSubmitting || isPreviewing}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-xl grad-purple text-white font-bold text-sm shadow-xl shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={2.5} />}
                      <span>{isSubmitting ? 'Generating Invoice...' : 'Generate & Send Invoice'}</span>
                  </button>
              </div>

          </form>
      </div>

    </div>
  );
}
