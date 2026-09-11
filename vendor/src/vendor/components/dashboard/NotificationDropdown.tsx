'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Bell } from 'lucide-react';

interface Notification {
  id: string;
  name: string;
  event: string;
  guests: string;
  time: string;
  unread: boolean;
  rawDate: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onViewAll: () => void;
  lastClearedTime: number;
}

const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onViewAll,
  lastClearedTime 
}: NotificationDropdownProps) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-slate-900/20 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-70 sm:w-87.5 bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] z-101 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <span className="text-[12px] font-black uppercase tracking-widest text-slate-900">Notifications</span>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-2">
               {notifications.length > 0 ? (
                 notifications.slice(0, 10).map((notif, i) => {
                   const isNew = notif.unread && new Date(notif.rawDate).getTime() > lastClearedTime;
                   return (
                     <motion.div 
                       key={notif.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="p-4 m-2 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer group"
                       onClick={() => { onViewAll(); onClose(); }}
                     >
                       <div className="flex items-start gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isNew ? 'bg-pd-pink/10 text-pd-pink border border-pd-pink/10 shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                           <Zap size={20} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between gap-2 mb-1">
                             <p className="text-[12px] font-black text-slate-900 truncate uppercase">{notif.name}</p>
                             {isNew && <span className="w-2 h-2 bg-pd-pink rounded-full shadow-lg shadow-pd-pink/40 animate-pulse"></span>}
                           </div>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight opacity-80">{notif.event} • {notif.guests} PAX</p>
                           <p className="text-[9px] font-black text-slate-400/60 uppercase tracking-widest mt-2 group-hover:text-pd-pink transition-colors">{notif.time}</p>
                         </div>
                       </div>
                     </motion.div>
                   );
                 })
               ) : (
                 <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                   <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-200">
                     <Bell size={28} />
                   </div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">All caught up</p>
                 </div>
               )}
             </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
              <button 
                onClick={() => { onViewAll(); onClose(); }}
                className="w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 hover:bg-pd-pink transition-colors shadow-lg shadow-slate-900/10"
              >
                Access Complete Pipeline
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default React.memo(NotificationDropdown);
