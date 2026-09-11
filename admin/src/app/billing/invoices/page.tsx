"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Receipt, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Check
, Plus} from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const rawBase = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5005/api";
  const base = rawBase.replace(/\/+$/, "");
  const serverUrl = base.endsWith("/api") ? base : `${base}/api`;

  const fetchRealData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/payments`);
      const result = await res.json();
      if (result.status === "success") {
        const mapped = (result.data || [])
          .filter((p: any) => p.method !== 'quote' && p.invoiceNumber)
          .map((p: any) => {
            let parsedBilling = null;
            try {
              if (p.billingDetails) parsedBilling = JSON.parse(p.billingDetails);
            } catch(e) {}
            return {
              docId: p.$id,
              id: p.invoiceNumber,
              client: p.venueName || p.ownerEmail || "Private Client",
              event: p.planName || "Venue Subscription",
              amount: p.amount || 0,
              date: p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : "—",
              status: (p.status === 'captured' || p.status === 'paid') ? 'Paid' : p.status === 'failed' ? 'Failed' : 'Pending',
              due: p.paidAt ? new Date(new Date(p.paidAt).setDate(new Date(p.paidAt).getDate() + 5)).toISOString().split('T')[0] : "—",
              fileId: p.invoiceFileId || null,
              billingDetails: parsedBilling,
              paymentMethod: p.method || "Online"
            };
          });
        setInvoices(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [serverUrl]);

  const filteredInvoices = invoices.filter(i => 
    i.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const numberToWords = (num: number): string => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    const numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    let n = ('000000000' + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Only' : 'Only';
    return str.trim();
  };

  const downloadPDF = async (inv: any) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. Fetch and add Logo
    try {
      const res = await fetch(`/preet-logo.png?v=${Date.now()}`); 
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', 40, 30, 100, 30);
    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(59, 130, 246);
      doc.text("PREET", 40, 50);
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("TECH", 120, 50);
    }

    // Top Right Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Invoice No.", pageWidth - 200, 45);
    doc.setFont("helvetica", "normal");
    doc.text(inv.id || "—", pageWidth - 120, 45);

    doc.setFont("helvetica", "bold");
    doc.text("Invoice Date:", pageWidth - 200, 60);
    doc.setFont("helvetica", "normal");
    doc.text(inv.date || "—", pageWidth - 120, 60);

    doc.setFont("helvetica", "bold");
    doc.text("Status:", pageWidth - 200, 75);
    doc.setFont("helvetica", "normal");
    doc.text(inv.status || "—", pageWidth - 120, 75);

    doc.setFont("helvetica", "bold");
    doc.text("Paid Date:", pageWidth - 200, 90);
    doc.setFont("helvetica", "normal");
    doc.text(inv.date || "—", pageWidth - 120, 90);

    // Blue Line separator
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1.5);
    doc.line(40, 105, pageWidth - 40, 105);

    // TAX INVOICE Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); 
    doc.text("TAX INVOICE", 40, 140);

    // Address Table Box
    doc.setDrawColor(203, 213, 225); 
    doc.setLineWidth(1);
    doc.rect(40, 160, pageWidth - 80, 120);
    doc.line(pageWidth / 2, 160, pageWidth / 2, 280);
    doc.line(40, 185, pageWidth - 40, 185); 
    
    // Header background
    doc.setFillColor(248, 250, 252);
    doc.rect(40.5, 160.5, (pageWidth - 80) / 2 - 1, 24, "F");
    doc.rect(pageWidth / 2 + 0.5, 160.5, (pageWidth - 80) / 2 - 1, 24, "F");

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", 50, 177);
    doc.text("BILL TO", (pageWidth / 2) + 10, 177);

    // FROM Details
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("PREET TECH (OPC) PRIVATE LIMITED", 50, 200);
    
    doc.setFont("helvetica", "normal");
    doc.text("GSTIN: 05AAQCP8357E1Z1", 50, 215);
    const fromAddr = "3/118 GURUNANAKPURA, Nainital Road, Near\nKrishna Hospital, Haldwani, Nainital, Uttarakhand - 263139";
    doc.text(`Address: ${fromAddr}`, 50, 230, { maxWidth: (pageWidth/2) - 30 });
    doc.text("Phone: +91 8679933302", 50, 260);
    doc.text("Email: info@preettech.com", 50, 275);

    // BILL TO Details
    const toDetails = inv.billingDetails || {};
    doc.setFont("helvetica", "bold");
    doc.text(toDetails.name || inv.client || "—", (pageWidth / 2) + 10, 200);
    
    doc.setFont("helvetica", "normal");
    let toY = 215;
    if (toDetails.gstNumber) {
      doc.text(`GSTIN: ${toDetails.gstNumber}`, (pageWidth / 2) + 10, toY);
      toY += 15;
    }
    
    let toAddress = toDetails.address || "—";
    if (toDetails.city) toAddress += `, ${toDetails.city}`;
    if (toDetails.state) toAddress += `, ${toDetails.state}`;
    if (toDetails.pincode) toAddress += ` - ${toDetails.pincode}`;
    
    doc.text(`Address: ${toAddress}`, (pageWidth / 2) + 10, toY, { maxWidth: (pageWidth/2) - 30 });
    
    // Calculate space for dynamic lines based on text split
    const addressLines = doc.splitTextToSize(toAddress, (pageWidth/2) - 30);
    const afterAddrY = toY + (addressLines.length * 12);
    
    if (toDetails.mobile) {
        doc.text(`Phone: ${toDetails.mobile}`, (pageWidth / 2) + 10, afterAddrY);
        if (toDetails.email) doc.text(`Email: ${toDetails.email}`, (pageWidth / 2) + 10, afterAddrY + 12);
    } else if (toDetails.email) {
        doc.text(`Email: ${toDetails.email}`, (pageWidth / 2) + 10, afterAddrY);
    }

    // Items Table
    const amount = Number(inv.amount || 0);
    const subtotal = amount / 1.18;
    const gst = subtotal * 0.09;

    const tableData = [
      [
        1, 
        `${inv.event || 'Service'}\nAs per selected service package`, 
        "998365", 
        1, 
        subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}), 
        subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ]
    ];

    autoTable(doc, {
      startY: 300,
      head: [['#', 'Description', 'SAC Code', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 8,
        lineColor: [203, 213, 225], 
        lineWidth: 1,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'left', cellWidth: 200 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 350;
    
    // Totals Section
    const rightX1 = pageWidth - 200;
    const rightX2 = pageWidth - 40;
    
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", rightX1, finalY + 20, { align: 'left' });
    doc.text(subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}), rightX2, finalY + 20, { align: 'right' });
    
    doc.text("CGST @ 9%", rightX1, finalY + 40, { align: 'left' });
    doc.text(gst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}), rightX2, finalY + 40, { align: 'right' });
    
    doc.text("SGST @ 9%", rightX1, finalY + 60, { align: 'left' });
    doc.text(gst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}), rightX2, finalY + 60, { align: 'right' });
    
    doc.setFont("helvetica", "bold");
    doc.text("Total Tax", rightX1, finalY + 80, { align: 'left' });
    doc.text((gst * 2).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}), rightX2, finalY + 80, { align: 'right' });
    
    doc.setDrawColor(203, 213, 225);
    doc.line(40, finalY + 90, pageWidth - 40, finalY + 90);
    
    doc.setFillColor(248, 250, 252);
    doc.rect(40, finalY + 90, pageWidth - 80, 25, "F");
    
    doc.setFontSize(10);
    doc.text("GRAND TOTAL", rightX1, finalY + 107, { align: 'left' });
    doc.text(amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}), rightX2, finalY + 107, { align: 'right' });
    
    doc.line(40, finalY + 115, pageWidth - 40, finalY + 115);

    // Amount in Words
    doc.setFont("helvetica", "bold");
    doc.text("Amount in Words:", 40, finalY + 135);
    doc.setFont("helvetica", "normal");
    doc.text(`Rupees ${numberToWords(Math.round(amount))}.`, 135, finalY + 135);

    // Payment & Notes
    const notesY = finalY + 160;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(40, notesY, pageWidth - 80, 80, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text("Payment & Notes", 50, notesY + 15);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`The total invoice value of ${amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} is inclusive of 18% GST.`, 50, notesY + 35);
    doc.text("Payment terms: As mutually agreed.", 50, notesY + 48);
    doc.text(`Payment Method: ${inv.paymentMethod || 'Online'}`, 50, notesY + 61);
    doc.text("Service: Venue Promotion & Lead Generation Services", 50, notesY + 74);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 60;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, footerY, { align: 'center' });
    doc.text("Thank you for choosing Partydial.", pageWidth / 2, footerY + 12, { align: 'center' });

    doc.save(`Invoice_${inv.id}.pdf`);
  };

  const updateStatus = async (docId: string, newStatus: string) => {
    try {
      const res = await fetch(`${serverUrl}/payments/${docId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toLowerCase() })
      });
      if (res.ok) {
        setInvoices(prev => prev.map(inv => inv.docId === docId ? { ...inv, status: newStatus } : inv));
      }
    } catch (err) {
      console.error(err);
    }
    setMenuOpen(null);
  };

  const deleteInvoice = async (docId: string) => {
    try {
      const res = await fetch(`${serverUrl}/payments/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setInvoices(prev => prev.filter(inv => inv.docId !== docId));
      }
    } catch (err) {
      console.error(err);
    }
    setMenuOpen(null);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl grad-purple flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
               <Receipt size={28} />
            </div>
             <div>
                <h1 className="text-3xl font-black text-slate-800 m-0 tracking-tight">Tax Invoices</h1>
                <p className="text-sm text-slate-400 font-medium mt-1">Official billing documents and fiscal reporting</p>
             </div>
         </div>
         <Link 
           href="/billing/invoices/create"
           className="flex items-center gap-2 px-5 py-3 rounded-xl grad-purple text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all w-fit"
         >
           <Plus size={18} strokeWidth={3} />
           <span>Make Invoice</span>
         </Link>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
         <div className="lg:col-span-7 relative group flex items-center">
            <input 
              type="text" 
              placeholder="Search by Invoice ID or Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="user-input pr-12 pl-4 shadow-sm"
            />
            <div className="absolute right-4 pointer-events-none">
               <Search className="text-slate-400" size={18} />
            </div>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
         <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice ID</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Client / Event</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 relative">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retrieving Tax Matrix...</p>
                      </td>
                    </tr>
                  ) : filteredInvoices.map((inv, idx) => (
                    <motion.tr 
                      key={inv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors group/row"
                    >
                       <td className="p-6">
                          <div className="text-sm font-black text-[#b66dff] bg-purple-50 px-3 py-1.5 rounded-lg w-fit">{inv.id}</div>
                       </td>
                       <td className="p-6">
                          <h4 className="text-sm font-bold text-slate-800">{inv.client}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">{inv.event}</p>
                       </td>
                       <td className="p-6 text-sm font-black text-slate-800">
                          ₹{inv.amount.toLocaleString()}
                       </td>
                       <td className="p-6">
                          <div className="text-xs text-slate-500 font-bold">{inv.due}</div>
                       </td>
                       <td className="p-6">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit",
                            inv.status === 'Paid' || inv.status === 'captured' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            inv.status === 'Partial' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            inv.status === 'Pending' ? "bg-slate-50 text-slate-500 border-slate-100" :
                            "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {inv.status === 'Paid' || inv.status === 'captured' ? <CheckCircle2 size={12} /> : 
                             inv.status === 'Partial' ? <Clock size={12} /> : 
                             inv.status === 'Pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
                            {inv.status}
                          </span>
                       </td>
                       <td className="p-6 relative">
                          <div className="flex items-center gap-2 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
                             <button onClick={() => setViewInvoice(inv)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-[#b66dff]"><Eye size={18} /></button>
                             <button onClick={() => downloadPDF(inv)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-blue-500"><Download size={18} /></button>
                             <div className="relative">
                               <button onClick={() => setMenuOpen(menuOpen === inv.id ? null : inv.id)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-300 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                               {menuOpen === inv.id && (
                                 <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 z-50">
                                   <button onClick={() => updateStatus(inv.docId, 'Paid')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors">
                                      <Check size={16} /> Mark as Paid
                                   </button>
                                   <button onClick={() => deleteInvoice(inv.docId)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors mt-1">
                                      <Trash2 size={16} /> Delete
                                   </button>
                                 </div>
                               )}
                             </div>
                          </div>
                       </td>
                    </motion.tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <AnimatePresence>
        {viewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewInvoice(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><Receipt size={20} /></div>
                  <div><h3 className="font-black text-slate-800">Invoice Details</h3><p className="text-xs font-bold text-slate-400">{viewInvoice.id}</p></div>
                </div>
                <button onClick={() => setViewInvoice(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Client</p>
                    <p className="text-sm font-bold text-slate-800">{viewInvoice.client}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                    <p className="text-sm font-bold text-slate-800">{viewInvoice.status}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Description / Plan</p>
                  <p className="text-sm font-bold text-slate-800">{viewInvoice.event}</p>
                </div>
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-2">Total Amount</p>
                  <p className="text-3xl font-black text-emerald-600">₹{viewInvoice.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button onClick={() => setViewInvoice(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Close</button>
                <button onClick={() => { downloadPDF(viewInvoice); setViewInvoice(null); }} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all shadow-lg flex items-center gap-2"><Download size={16} /> Download PDF</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .user-input { width: 100%; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 1.25rem; padding: 1.25rem; font-size: 0.875rem; font-weight: 700; transition: all 0.3s; outline: none; }
        .user-input:focus { border-color: #b66dff; background: #ffffff; box-shadow: 0 4px 20px rgba(182, 109, 255, 0.08); }
      `}</style>
    </div>
  );
}
