/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, ChevronRight, MapPin,
  Sparkles, Building2, Users, Wind, Car, Wifi, Utensils, Music, 
  Image as ImageIcon, CheckCircle2, IndianRupee,
  Plus, Zap, Trees, ChefHat,
  Palette, Heart, ShieldCheck, Building, Trash2, Target, Camera, Video, PlayCircle, Clock, X
} from 'lucide-react';
import Image from 'next/image';

interface DashboardSettingsProps {
  settingsSection: string;
  setSettingsSection: (section: string) => void;
  venueProfile: any;
  handleProfileUpdate: (field: string, value: any) => void;
  handleAmenityToggle: (amenityId: string) => void;
  handleEventTypeToggle: (eventTypeId: string) => void;
  isUpdatingProfile: boolean;
  saveProfileSettings: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const DashboardSettings = ({
  settingsSection,
  setSettingsSection,
  venueProfile,
  handleProfileUpdate,
  handleAmenityToggle,
  handleEventTypeToggle,
  isUpdatingProfile,
  saveProfileSettings,
  showToast
}: DashboardSettingsProps) => {

  const eventTypesList = [
    "Birthday Party", "Wedding Events", "Pre-Wedding Events", "Anniversary Party",
    "Corporate Events", "Kitty Party", "Family Functions", "Festival Parties",
    "Social Gatherings", "Kids Parties", "Bachelor / Bachelorette Party",
    "Housewarming Party", "Baby Shower", "Engagement Ceremony", "Entertainment / Theme Parties"
  ];

  const amenities = React.useMemo(() => {
    try {
       if (!venueProfile?.amenities) return [];
       return typeof venueProfile.amenities === 'string' ? JSON.parse(venueProfile.amenities) : (Array.isArray(venueProfile?.amenities) ? venueProfile.amenities : []); 
    } catch (e) { return []; } 
  }, [venueProfile?.amenities]); 

  const eventTypes = React.useMemo(() => {
    try {
       if (!venueProfile?.eventTypes) return [];
       return typeof venueProfile.eventTypes === 'string' ? JSON.parse(venueProfile.eventTypes) : (Array.isArray(venueProfile?.eventTypes) ? venueProfile.eventTypes : []); 
    } catch (e) { return []; } 
  }, [venueProfile?.eventTypes]); 

  const photoIds = React.useMemo(() => { 
     try { 
        if (!venueProfile?.photos) return []; 
        const parsed = typeof venueProfile.photos === 'string' ? JSON.parse(venueProfile.photos) : (Array.isArray(venueProfile?.photos) ? venueProfile.photos : []); 
        return parsed.map((p: any) => {
           if (typeof p === 'string') {
               try {
                   const obj = JSON.parse(p);
                   if (obj && typeof obj === 'object') return obj;
               } catch (e) {}
               return { id: p, category: 'All Photos' };
           }
           return p;
        });
     } catch (e) { return []; } 
  }, [venueProfile?.photos]);

  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState({ current: 0, total: 0 });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !venueProfile?.$id) return;

    setIsUploadingPhoto(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      const { storage, databases, DATABASE_ID, VENUES_COLLECTION_ID, STORAGE_BUCKET_ID, ID } = await import('@/lib/appwrite');
      const category = activeGalleryCategory === 'All Photos' ? 'Interior' : activeGalleryCategory;

      const newPhotos: { id: string; category: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        try {
          const uploaded = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), files[i]);
          newPhotos.push({ id: uploaded.$id, category });
        } catch (err) {
          console.error(`Failed to upload file ${i + 1}:`, err);
          showToast(`Failed to upload ${files[i].name}. Skipping.`, 'error');
        }
      }

      if (newPhotos.length === 0) {
        showToast('No photos were uploaded successfully.', 'error');
        return;
      }

      const updatedPhotos = [...photoIds, ...newPhotos];
      await databases.updateDocument(
        DATABASE_ID,
        VENUES_COLLECTION_ID,
        venueProfile.$id,
        { photos: JSON.stringify(updatedPhotos) }
      );

      handleProfileUpdate('photos', JSON.stringify(updatedPhotos));
      showToast(
        newPhotos.length === files.length
          ? `${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} uploaded to ${category}!`
          : `${newPhotos.length} of ${files.length} photos uploaded.`,
        'success'
      );
    } catch (err) {
      console.error('Bulk photo upload failed:', err);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [uploadingHallId, setUploadingHallId] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !venueProfile?.$id) return;

    setIsUploadingAvatar(true);
    try {
      const { storage, databases, DATABASE_ID, VENUES_COLLECTION_ID, STORAGE_BUCKET_ID, ID } = await import('@/lib/appwrite');
      
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );

      const otherPhotos = photoIds.filter((p: any) => p.category !== 'Profile');
      const newProfilePhoto = { id: uploadedFile.$id, category: 'Profile' };
      const updatedPhotos = [newProfilePhoto, ...otherPhotos];

      await databases.updateDocument(
        DATABASE_ID,
        VENUES_COLLECTION_ID,
        venueProfile.$id,
        {
          photos: JSON.stringify(updatedPhotos)
        }
      );

      handleProfileUpdate('photos', JSON.stringify(updatedPhotos));
      showToast('Profile picture updated successfully!', 'success');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      showToast('Failed to update profile picture.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removePhoto = async (idToRemove: string) => {
    if (!venueProfile?.$id) return;
    setDeleteConfirm({ show: true, photoId: idToRemove });
  };

  const confirmDeletePhoto = async () => {
    const idToRemove = deleteConfirm.photoId;
    setDeleteConfirm({ show: false, photoId: '' });
    if (!idToRemove || !venueProfile?.$id) return;

    try {
      const { databases, DATABASE_ID, VENUES_COLLECTION_ID } = await import('@/lib/appwrite');
      const updatedPhotos = photoIds.filter((p: any) => p.id !== idToRemove);
      
      await databases.updateDocument(
        DATABASE_ID,
        VENUES_COLLECTION_ID,
        venueProfile.$id,
        {
          photos: JSON.stringify(updatedPhotos)
        }
      );
      handleProfileUpdate('photos', JSON.stringify(updatedPhotos));
      showToast('Photo removed successfully.', 'success');
    } catch (err) {
      console.error('Failed to remove photo:', err);
      showToast('Failed to remove photo. Try again.', 'error');
    }
  };

  const galleryCategories = ["All Photos", "Interior", "Decoration", "Food & Dining", "Exterior", "Event Setups"];
  const [activeGalleryCategory, setActiveGalleryCategory] = React.useState("All Photos");
  const [deleteConfirm, setDeleteConfirm] = React.useState({ show: false, photoId: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-6xl mx-auto space-y-6">

      {/* Delete Confirmation Popup */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div
            className="fixed inset-0 z-999 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setDeleteConfirm({ show: false, photoId: '' })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                Remove Photo?
              </h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                This photo will be permanently removed from your gallery. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, photoId: '' })}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePhoto}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-bold shadow-sm transition-colors"
                >
                  Delete Photo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm">
         <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Venue Settings</h1>
            <p className="text-sm font-medium text-slate-500">Configure your professional profile, gallery, and offerings</p>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Settings Sidebar */}
          <aside className="w-full lg:w-72 flex flex-col gap-2 shrink-0 lg:sticky lg:top-32 h-fit">
             {[
                { id: 'profile', label: 'Venue Identity', icon: <Building2 size={16} />, color: 'bg-blue-500' },
                { id: 'photos', label: 'Media Gallery', icon: <ImageIcon size={16} />, color: 'bg-purple-500' },
                { id: 'halls_section', label: 'Venue Spaces', icon: <Building size={16} />, color: 'bg-emerald-500' },
                { id: 'pricing_section', label: 'Event Pricing', icon: <IndianRupee size={16} />, color: 'bg-rose-500' },
                { id: 'videos_section', label: 'Venue Videos', icon: <Video size={16} />, color: 'bg-indigo-500' },
             ].map(section => (
                <button 
                  key={section.id}
                  onClick={() => setSettingsSection(section.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all group border ${settingsSection === section.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${settingsSection === section.id ? 'bg-white/20' : section.color}`}>
                         {section.icon}
                      </div>
                      <span className={`text-sm font-bold ${settingsSection === section.id ? 'text-white' : 'text-slate-700'}`}>{section.label}</span>
                   </div>
                   <ChevronRight size={16} className={`transition-transform ${settingsSection === section.id ? 'opacity-100' : 'opacity-0 -translate-x-2'}`} />
                </button>
             ))}
             {venueProfile?.status && (
               <div className={`mt-4 shrink-0 flex items-center gap-3 px-5 py-2.5 rounded-2xl border shadow-sm transition-all ${
                  venueProfile.status === 'approved' ? 'bg-emerald-50 border-emerald-200 shadow-emerald-500/10' :
                  venueProfile.status === 'rejected' ? 'bg-rose-50 border-rose-200 shadow-rose-500/10' :
                  'bg-amber-50 border-amber-200 shadow-amber-500/10'
               }`}>
                  <div className="flex items-center justify-center">
                     {venueProfile.status === 'approved' ? <ShieldCheck size={22} className="text-emerald-600" strokeWidth={2.5} /> :
                      venueProfile.status === 'rejected' ? <X size={22} className="text-rose-600" strokeWidth={2.5} /> :
                      <Clock size={22} className="text-amber-600" strokeWidth={2.5} />}
                  </div>
                  <div className="flex flex-col justify-center">
                     <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 ${
                        venueProfile.status === 'approved' ? 'text-emerald-600/70' :
                        venueProfile.status === 'rejected' ? 'text-rose-600/70' :
                        'text-amber-600/70'
                     }`}>
                        Listing Status
                     </span>
                     <span className={`text-[13px] font-black uppercase tracking-wider leading-none ${
                        venueProfile.status === 'approved' ? 'text-emerald-700' :
                        venueProfile.status === 'rejected' ? 'text-rose-700' :
                        'text-amber-700'
                     }`}>
                        {venueProfile.status} Profile
                     </span>
                  </div>
               </div>
             )}
          </aside>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 md:p-8 relative min-h-150 overflow-hidden">
             <AnimatePresence mode="wait">
                {settingsSection === 'profile' && (
                   <motion.div 
                     key="profile"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.3 }}
                     className="space-y-10"
                   >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                         {/* Left Column */}
                         <div className="space-y-8">
                            <section>
                               <h3 className="text-lg font-extrabold text-slate-900 mb-6">Brand Representative</h3>
                               <div className="flex items-center gap-6">
                                  <div className="relative group">
                                     <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                        {(photoIds.find((p: any) => p.category === 'Profile')) ? (
                                           <Image 
                                             src={`https://sgp.cloud.appwrite.io/v1/storage/buckets/venues_photos/files/${photoIds.find((p: any) => p.category === 'Profile').id}/view?project=69ae84bc001ca4edf8c2`} 
                                             alt="Profile" 
                                             width={96} 
                                             height={96} 
                                             className="object-cover w-full h-full"
                                           />
                                        ) : (
                                           <Camera className="text-slate-300" size={32} />
                                        )}
                                     </div>
                                     <button 
                                       onClick={() => avatarInputRef.current?.click()}
                                       className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 text-white shadow-md rounded-lg flex items-center justify-center hover:bg-pd-pink hover:scale-105 transition-all"
                                     >
                                        <ImageIcon size={14} />
                                     </button>
                                     <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={handleAvatarUpload} />
                                  </div>
                                  <div>
                                     <p className="text-sm font-extrabold text-slate-900 mb-1">Display Logo</p>
                                     <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-50">Update your primary profile picture that appears in search results.</p>
                                  </div>
                               </div>
                            </section>

                            <section>
                               <h3 className="text-lg font-extrabold text-slate-900 mb-6">Venue Details</h3>
                               <div className="space-y-5">
                                  <div className="space-y-1.5">
                                     <label className="text-xs font-bold text-slate-700">Display Name</label>
                                     <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                          type="text" 
                                          value={venueProfile?.venueName || ""} 
                                          onChange={(e) => handleProfileUpdate('venueName', e.target.value)}
                                          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10 transition-all" 
                                        />
                                     </div>
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-xs font-bold text-slate-700">Owner Name</label>
                                     <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                          type="text" 
                                          placeholder="e.g. Rahul Sharma"
                                          value={venueProfile?.ownerName || ""} 
                                          onChange={(e) => handleProfileUpdate('ownerName', e.target.value)}
                                          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10 transition-all" 
                                        />
                                     </div>
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-xs font-bold text-slate-700">Guest Capacity Range</label>
                                     <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        <input 
                                          type="text"
                                          readOnly
                                          value={(() => {
                                             const cap = parseInt(venueProfile?.capacity);
                                             if (cap >= 5001) return '5000+ Guests';
                                             if (cap >= 2001) return '2000-5000 Guests';
                                             if (cap >= 1001) return '1000-2000 Guests';
                                             if (cap >= 501)  return '500-1000 Guests';
                                             if (cap >= 201)  return '200-500 Guests';
                                             if (cap >= 101)  return '100-200 Guests';
                                             if (cap >= 51)   return '50-100 Guests';
                                             if (cap >= 1)    return '2-50 Guests';
                                             return 'Not Specified';
                                          })()} 
                                          className="w-full bg-slate-100 border border-slate-200/60 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                                        />
                                     </div>
                                  </div>
                                  <div className="space-y-1.5">
                                      <label className="text-xs font-bold text-slate-700">Landmark</label>
                                      <div className="relative">
                                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                         <input 
                                           type="text" 
                                           placeholder="e.g. Near City Center"
                                           value={venueProfile?.landmark || ""} 
                                           onChange={(e) => handleProfileUpdate('landmark', e.target.value)}
                                           className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10 transition-all" 
                                         />
                                      </div>
                                   </div>
                               </div>
                            </section>

                            <section>
                               <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                                  Billing Information
                               </h3>
                               <div className="space-y-4">
                                  <div className="space-y-1.5">
                                     <label className="text-xs font-bold text-slate-700">Address</label>
                                     <textarea 
                                       rows={2}
                                       value={venueProfile?.address || ""} 
                                       onChange={(e) => handleProfileUpdate('address', e.target.value)}
                                       className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-sm font-medium outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10 transition-all resize-none" 
                                     />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">City</label>
                                        <input 
                                          type="text" 
                                          value={venueProfile?.city || ""} 
                                          onChange={(e) => handleProfileUpdate('city', e.target.value)}
                                          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-sm font-medium outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10" 
                                        />
                                     </div>
                                     <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">State</label>
                                        <input 
                                          type="text" 
                                          value={venueProfile?.state || ""} 
                                          onChange={(e) => handleProfileUpdate('state', e.target.value)}
                                          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-sm font-medium outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10" 
                                        />
                                     </div>
                                  </div>
                               </div>
                            </section>
                         </div>

                         {/* Right Column */}
                         <div className="space-y-8">
                            <section>
                               <h3 className="text-lg font-extrabold text-slate-900 mb-6">About the Venue</h3>
                               <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-slate-700">Bio & Description</label>
                                  <textarea 
                                    rows={5}
                                    value={venueProfile?.description || ""} 
                                    maxLength={1000}
                                    onChange={(e) => handleProfileUpdate('description', e.target.value)}
                                    placeholder="Tell customers about your venue's ambiance..."
                                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-sm font-medium focus:bg-white focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10 transition-all outline-none resize-none" 
                                  />
                                  <div className="flex justify-end mt-1">
                                    <p className={`text-[10px] font-bold ${(venueProfile?.description?.length || 0) >= 1000 ? 'text-pd-red' : 'text-slate-400'}`}>
                                      {venueProfile?.description?.length || 0} / 1000
                                    </p>
                                  </div>
                               </div>
                            </section>

                            <section>
                               <h3 className="text-lg font-extrabold text-slate-900 mb-4">Supported Events</h3>
                               <div className="flex flex-wrap gap-2">
                                  {eventTypesList.map((type) => {
                                     const isActive = eventTypes.includes(type);
                                     return (
                                        <button 
                                          key={type}
                                          onClick={() => handleEventTypeToggle(type)}
                                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:border-slate-300'}`}
                                        >
                                           {type}
                                        </button>
                                     );
                                  })}
                               </div>
                            </section>

                            <section>
                               <h3 className="text-lg font-extrabold text-slate-900 mb-4">Amenities</h3>
                               <div className="grid grid-cols-2 gap-3">
                                  {[
                                     { id: 'ac', label: 'Air Conditioning', icon: <Wind size={16} /> },
                                     { id: 'parking', label: 'Parking Available', icon: <Car size={16} /> },
                                     { id: 'power', label: 'Power Backup', icon: <Zap size={16} /> },
                                     { id: 'indoor', label: 'Indoor Hall', icon: <Building size={16} /> },
                                     { id: 'outdoor', label: 'Outdoor Lawn', icon: <Trees size={16} /> },
                                     { id: 'catering_in', label: 'In-house Catering', icon: <Utensils size={16} /> },
                                     { id: 'catering_out', label: 'Outside Catering', icon: <ChefHat size={16} /> },
                                     { id: 'dj', label: 'DJ Allowed', icon: <Music size={16} /> },
                                     { id: 'decoration', label: 'Decoration', icon: <Palette size={16} /> },
                                     { id: 'bridal', label: 'Bridal Room', icon: <Heart size={16} /> },
                                     { id: 'security', label: 'Security', icon: <ShieldCheck size={16} /> },
                                     { id: 'wifi', label: 'Wi-Fi', icon: <Wifi size={16} /> }
                                  ].map((amenity) => {
                                     const isActive = amenities.includes(amenity.id);
                                     return (
                                        <button 
                                          key={amenity.id}
                                          onClick={() => handleAmenityToggle(amenity.id)}
                                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:border-slate-300'}`}
                                        >
                                           <div className={isActive ? 'text-emerald-500' : 'text-slate-400'}>{amenity.icon}</div>
                                           <span className="text-xs font-bold leading-tight">{amenity.label}</span>
                                        </button>
                                     );
                                  })}
                               </div>
                            </section>
                         </div>
                      </div>

                      <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            <p className="text-sm font-medium text-slate-500">Changes reflect instantly on your live profile.</p>
                         </div>
                         <button 
                           onClick={saveProfileSettings}
                           disabled={isUpdatingProfile}
                           className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all disabled:opacity-50"
                         >
                            {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                         </button>
                      </div>
                   </motion.div>
                )}

                {settingsSection === 'halls_section' && (
                   <motion.div 
                     key="halls"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.3 }}
                     className="space-y-8"
                   >
                      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div>
                            <h3 className="text-xl font-extrabold text-slate-900">Venue Spaces</h3>
                            <p className="text-sm font-medium text-slate-500">List and manage individual halls, lawns, or dining areas.</p>
                         </div>
                         <button 
                           onClick={() => {
                              const current = Array.isArray(venueProfile?.halls) ? venueProfile.halls : [];
                              const updated = [...current, { id: Date.now(), name: 'New Space', capacity: venueProfile.capacity || '500', area: '5000 SQ FT', image: '' }];
                              handleProfileUpdate('halls', updated);
                           }}
                           className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                         >
                            <Plus size={16} /> Add Space
                         </button>
                      </header>
 
                      <div className="space-y-4">
                         {(() => {
                            const halls = Array.isArray(venueProfile?.halls) ? venueProfile.halls : [];
                            
                            if (halls.length === 0) {
                               return (
                                  <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                     <Building className="mx-auto text-slate-300 mb-3" size={40} />
                                     <h4 className="text-base font-extrabold text-slate-900">No spaces defined</h4>
                                     <p className="text-sm font-medium text-slate-500 mt-1 mb-6 max-w-sm mx-auto">Add your banquet halls, lawns, or specific event areas here.</p>
                                  </div>
                               );
                            }
 
                            return halls.map((hall: any) => (
                               <div key={hall.id} className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col md:flex-row md:items-end justify-between gap-6 group hover:border-slate-300 transition-all">
                                  <div className="flex-1 flex flex-col gap-4">
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                           <label className="text-xs font-bold text-slate-700">Space Name</label>
                                           <input 
                                              value={hall.name}
                                              onChange={(e) => {
                                                 const updated = halls.map((h: any) => h.id === hall.id ? { ...h, name: e.target.value } : h);
                                                 handleProfileUpdate('halls', updated);
                                              }}
                                              className="w-full bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10"
                                              placeholder="e.g. Royal Ballroom"
                                           />
                                        </div>
                                        <div className="space-y-1.5">
                                           <label className="text-xs font-bold text-slate-700">Capacity (Guests)</label>
                                           <div className="relative">
                                              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                              <input 
                                                 value={hall.capacity}
                                                 onChange={(e) => {
                                                    const updated = halls.map((h: any) => h.id === hall.id ? { ...h, capacity: e.target.value } : h);
                                                    handleProfileUpdate('halls', updated);
                                                 }}
                                                 className="w-full bg-white border border-slate-200/60 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10"
                                                 placeholder="500"
                                              />
                                           </div>
                                        </div>
                                        <div className="space-y-1.5">
                                           <label className="text-xs font-bold text-slate-700">Area (Size)</label>
                                           <input 
                                              value={hall.area}
                                              onChange={(e) => {
                                                 const updated = halls.map((h: any) => h.id === hall.id ? { ...h, area: e.target.value } : h);
                                                 handleProfileUpdate('halls', updated);
                                              }}
                                              className="w-full bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10"
                                              placeholder="12,000 SQ FT"
                                           />
                                        </div>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                           <label className="text-xs font-bold text-slate-700">Short Description (Optional)</label>
                                           <input 
                                              value={hall.description || ''}
                                              onChange={(e) => {
                                                 const updated = halls.map((h: any) => h.id === hall.id ? { ...h, description: e.target.value } : h);
                                                 handleProfileUpdate('halls', updated);
                                              }}
                                              className="w-full bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-pd-pink focus:ring-4 focus:ring-pd-pink/10"
                                              placeholder="e.g. Perfect for intimate gatherings"
                                           />
                                        </div>
                                        <div className="space-y-1.5 flex flex-col">
                                           <label className="text-xs font-bold text-slate-700">Space Image</label>
                                           <div className="flex-1 flex items-center gap-3">
                                              {hall.image && (
                                                 <img src={hall.image} alt="" className="w-11 h-11 rounded-lg object-cover border border-slate-200" />
                                              )}
                                              <label className={`flex-1 h-11 border border-slate-200/60 rounded-xl flex items-center justify-center gap-2 text-sm font-bold cursor-pointer transition-all ${uploadingHallId === hall.id ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'}`}>
                                                 {uploadingHallId === hall.id ? (
                                                    <><div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" /> Uploading...</>
                                                 ) : (
                                                    <><Camera size={16} /> {hall.image ? 'Change Photo' : 'Upload Photo'}</>
                                                 )}
                                                 <input 
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={uploadingHallId === hall.id}
                                                    onChange={async (e) => {
                                                       const file = e.target.files?.[0];
                                                       if (!file) return;
                                                       setUploadingHallId(hall.id);
                                                       try {
                                                          const { storage, STORAGE_BUCKET_ID, ID, ENDPOINT, PROJECT_ID } = await import('@/lib/appwrite');
                                                          const uploadedFile = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file);
                                                          const imageUrl = `${ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;
                                                          const updated = halls.map((h: any) => h.id === hall.id ? { ...h, image: imageUrl } : h);
                                                          handleProfileUpdate('halls', updated);
                                                          showToast('Space image uploaded successfully!', 'success');
                                                       } catch (err) {
                                                          console.error(err);
                                                          showToast('Failed to upload space image.', 'error');
                                                       } finally {
                                                          setUploadingHallId(null);
                                                          e.target.value = '';
                                                       }
                                                    }}
                                                 />
                                              </label>
                                              {hall.image && (
                                                 <button 
                                                   onClick={() => {
                                                      const updated = halls.map((h: any) => h.id === hall.id ? { ...h, image: '' } : h);
                                                      handleProfileUpdate('halls', updated);
                                                   }}
                                                   className="w-11 h-11 rounded-xl bg-white border border-slate-200/60 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shrink-0"
                                                   title="Remove Image"
                                                 >
                                                    <Trash2 size={16} />
                                                 </button>
                                              )}
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                                  <button 
                                     onClick={() => {
                                        const updated = halls.filter((h: any) => h.id !== hall.id);
                                        handleProfileUpdate('halls', updated);
                                     }}
                                     className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shrink-0"
                                  >
                                     <Trash2 size={16} />
                                  </button>
                               </div>
                            ));
                         })()}
                      </div>
 
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                         <button 
                           onClick={saveProfileSettings}
                           disabled={isUpdatingProfile}
                           className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all disabled:opacity-50"
                         >
                            {isUpdatingProfile ? 'Saving...' : 'Save Spaces'}
                         </button>
                      </div>
                   </motion.div>
                )}

                {settingsSection === 'photos' && (
                   <motion.div 
                     key="photos"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.3 }}
                     className="space-y-8"
                   >
                      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div>
                            <h3 className="text-xl font-extrabold text-slate-900">Venue Media Gallery</h3>
                            <p className="text-sm font-medium text-slate-500">Upload and manage high-quality photos to attract customers.</p>
                         </div>
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             disabled={isUploadingPhoto}
                             className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-60 shadow-sm"
                           >
                             {isUploadingPhoto ? (
                               <>
                                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                 {uploadProgress.total > 0 ? `Uploading ${uploadProgress.current}/${uploadProgress.total}` : 'Uploading...'}
                               </>
                             ) : (
                               <><Plus size={16} /> Upload Photos</>
                             )}
                           </button>
                         </div>
                         <input type="file" hidden ref={fileInputRef} accept="image/*" multiple onChange={handlePhotoUpload} />
                      </header>

                      {/* Gallery Category Filter */}
                      <div className="flex bg-slate-50 p-1.5 rounded-xl w-fit overflow-x-auto border border-slate-200/60 max-w-full no-scrollbar">
                         {galleryCategories.map((cat: string) => (
                            <button
                               key={cat}
                               onClick={() => setActiveGalleryCategory(cat)}
                               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeGalleryCategory === cat ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                               {cat}
                            </button>
                         ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                         {photoIds
                           .filter((p: any) => p.category !== 'Profile')
                           .filter((p: any) => activeGalleryCategory === "All Photos" || p.category === activeGalleryCategory)
                           .map((p: any) => (
                            <div key={p.id} className="aspect-square relative rounded-2xl overflow-hidden border border-slate-200/60 group shadow-sm">
                               <Image 
                                  src={`https://sgp.cloud.appwrite.io/v1/storage/buckets/venues_photos/files/${p.id}/view?project=69ae84bc001ca4edf8c2`} 
                                  alt="Gallery" 
                                  fill 
                                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                               />
                               <div className="absolute top-2 left-2">
                                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-bold text-slate-700 border border-slate-200/60 shadow-sm">
                                    {p.category}
                                  </span>
                               </div>
                               <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    onClick={() => removePhoto(p.id)}
                                    className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md transform scale-90 group-hover:scale-100"
                                  >
                                     <Trash2 size={18} />
                                  </button>
                               </div>
                            </div>
                         ))}
                         
                         {(photoIds.filter((p: any) => activeGalleryCategory === "All Photos" || p.category === activeGalleryCategory).length === 0) && !isUploadingPhoto && (
                            <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                               <ImageIcon className="mx-auto text-slate-300 mb-3" size={40} />
                               <h4 className="text-base font-extrabold text-slate-900">No photos in {activeGalleryCategory}</h4>
                               <p className="text-sm font-medium text-slate-500 mt-1 mb-5">Upload photos here to showcase your venue&apos;s aesthetic.</p>
                               <button 
                                 onClick={() => fileInputRef.current?.click()}
                                 className="px-6 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                               >
                                  Select Photos
                               </button>
                            </div>
                         )}

                         {isUploadingPhoto && (
                            <div className="aspect-square relative rounded-2xl border border-slate-200/60 bg-slate-50 flex flex-col items-center justify-center animate-pulse gap-2">
                               <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                               <span className="text-xs font-bold text-slate-500">Uploading...</span>
                            </div>
                         )}
                      </div>
                   </motion.div>
                )}

                 {settingsSection === 'pricing_section' && (
                    <motion.div 
                      key="pricing"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-10"
                    >
                       <section className="max-w-3xl">
                          <h3 className="text-xl font-extrabold text-slate-900 mb-1">Standard Plate Rates</h3>
                          <p className="text-sm font-medium text-slate-500 mb-8">Define your baseline pricing to help clients estimate their budget.</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                             <div className="space-y-2">
                                <button 
                                   onClick={() => {
                                      let current = [];
                                      try { current = typeof venueProfile?.foodTypes === 'string' ? JSON.parse(venueProfile.foodTypes) : (Array.isArray(venueProfile?.foodTypes) ? venueProfile.foodTypes : []); } catch(e){}
                                      handleProfileUpdate('foodTypes', current.includes('Veg') ? current.filter((t:string) => t !== 'Veg') : [...current, 'Veg']);
                                   }}
                                   className="text-sm font-bold text-slate-700 flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                   <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${venueProfile?.foodTypes?.includes('Veg') ? 'border-emerald-500 bg-white' : 'border-slate-300 bg-slate-50'}`}>
                                      {venueProfile?.foodTypes?.includes('Veg') && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                   </div>
                                   Vegetarian Rate
                                </button>
                                {venueProfile?.foodTypes?.includes('Veg') && (
                                   <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                      <input 
                                        type="number" 
                                        value={venueProfile?.perPlateVeg || ""} 
                                        onChange={(e) => handleProfileUpdate('perPlateVeg', e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-10 pr-16 text-lg font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/ Plate</span>
                                   </div>
                                )}
                             </div>

                             <div className="space-y-2">
                                <button 
                                   onClick={() => {
                                      let current = [];
                                      try { current = typeof venueProfile?.foodTypes === 'string' ? JSON.parse(venueProfile.foodTypes) : (Array.isArray(venueProfile?.foodTypes) ? venueProfile.foodTypes : []); } catch(e){}
                                      handleProfileUpdate('foodTypes', current.includes('Non-Veg') ? current.filter((t:string) => t !== 'Non-Veg') : [...current, 'Non-Veg']);
                                   }}
                                   className="text-sm font-bold text-slate-700 flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                   <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${venueProfile?.foodTypes?.includes('Non-Veg') ? 'border-red-500 bg-white' : 'border-slate-300 bg-slate-50'}`}>
                                      {venueProfile?.foodTypes?.includes('Non-Veg') && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                   </div>
                                   Non-Vegetarian Rate
                                </button>
                                {venueProfile?.foodTypes?.includes('Non-Veg') && (
                                   <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                      <input 
                                        type="number" 
                                        value={venueProfile?.perPlateNonVeg || ""} 
                                        onChange={(e) => handleProfileUpdate('perPlateNonVeg', e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-10 pr-16 text-lg font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all" 
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/ Plate</span>
                                   </div>
                                )}
                             </div>
                          </div>

                          <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-start gap-4">
                             <div className="w-10 h-10 bg-white rounded-xl border border-slate-200/60 flex items-center justify-center text-amber-500 shrink-0">
                                <Sparkles size={20} />
                             </div>
                             <div>
                                <h4 className="text-sm font-extrabold text-slate-900 mb-1">Smart Pricing Insight</h4>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">Setting accurate rates helps match you with higher-quality leads and improves your visibility in sorted search results.</p>
                             </div>
                          </div>
                       </section>

                       <section className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200/80 text-center">
                          <Target className="mx-auto text-slate-400 mb-3" size={32} />
                          <h4 className="text-base font-extrabold text-slate-900 mb-1">Advanced Packages</h4>
                          <p className="text-sm text-slate-500 font-medium">
                             Custom package definitions and detailed menus are managed via your main subscription.
                          </p>
                       </section>

                       <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                          <button 
                            onClick={saveProfileSettings}
                            disabled={isUpdatingProfile}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                             {isUpdatingProfile ? 'Saving...' : 'Save Pricing'}
                          </button>
                       </div>
                    </motion.div>
                 )}
                 
                 {settingsSection === 'videos_section' && (
                    <motion.div 
                      key="videos_section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                       <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                             <h3 className="text-xl font-extrabold text-slate-900">Venue Videos</h3>
                             <p className="text-sm font-medium text-slate-500">Showcase your venue with YouTube video links.</p>
                          </div>
                          <button 
                            onClick={() => {
                               const current = Array.isArray(venueProfile?.videos) ? venueProfile.videos : [];
                               handleProfileUpdate('videos', [...current, '']);
                            }}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                             <Plus size={16} /> Add Video Link
                          </button>
                       </header>
                       
                       <div className="space-y-4">
                          {(() => {
                             const videos = Array.isArray(venueProfile?.videos) ? venueProfile.videos : [];
                             if (videos.length === 0) {
                                return (
                                   <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                      <PlayCircle className="mx-auto text-slate-300 mb-3" size={40} />
                                      <h4 className="text-base font-extrabold text-slate-900">No videos added</h4>
                                      <p className="text-sm font-medium text-slate-500 mt-1 mb-6 max-w-sm mx-auto">Add YouTube links to give customers a virtual tour of your venue.</p>
                                   </div>
                                );
                             }
                             return videos.map((video: string, i: number) => (
                                <div key={i} className="flex gap-3">
                                   <div className="flex-1 relative">
                                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input 
                                         value={video}
                                         onChange={(e) => {
                                            const updated = [...videos];
                                            updated[i] = e.target.value;
                                            handleProfileUpdate('videos', updated);
                                         }}
                                         placeholder="https://www.youtube.com/watch?v=..."
                                         className="w-full bg-white border border-slate-200/60 rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                      />
                                   </div>
                                   <button 
                                      onClick={() => {
                                         const updated = [...videos];
                                         updated.splice(i, 1);
                                         handleProfileUpdate('videos', updated);
                                      }}
                                      className="w-12 h-11.5 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors border border-red-100"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </div>
                             ));
                          })()}
                       </div>
                       
                       {Array.isArray(venueProfile?.videos) && venueProfile.videos.length > 0 && (
                          <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                             <button 
                               onClick={saveProfileSettings}
                               disabled={isUpdatingProfile}
                               className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all disabled:opacity-50"
                             >
                                {isUpdatingProfile ? 'Saving...' : 'Save Videos'}
                             </button>
                          </div>
                       )}
                    </motion.div>
                 )}
              </AnimatePresence>
          </div>
       </div>
    </motion.div>
  );
};

export default React.memo(DashboardSettings);
