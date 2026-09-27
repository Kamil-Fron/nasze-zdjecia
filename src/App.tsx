/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Sparkles, Heart } from 'lucide-react';
import { Header } from './components/Header';
import { Gallery } from './components/Gallery';
import { WeddingTimeline } from './components/WeddingTimeline';
import { AdminPanel } from './components/AdminPanel';
import { UploadModal } from './components/UploadModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { LiveSlideshowModal } from './components/LiveSlideshowModal';
import { GuestWelcomeModal } from './components/GuestWelcomeModal';
import { WeddingSettings, PhotoItem, WeddingStats, GuestProfile } from './types/wedding';
import { getGuestProfile, saveGuestProfile } from './utils/deviceStorage';
import { 
  subscribePhotos, 
  reactToPhotoInFirestore, 
  deletePhotoFromFirestore 
} from './services/weddingFirestore';

export default function App() {
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [stats, setStats] = useState<WeddingStats>({ totalPhotos: 0, uniqueContributors: 0, contributorsList: [], syncedToGoogleCount: 0 });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [guestProfile, setGuestProfile] = useState<GuestProfile>(getGuestProfile());
  const [activeTab, setActiveTab] = useState<'gallery' | 'timeline' | 'admin'>('gallery');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch wedding info & stats
  const fetchWeddingData = useCallback(async () => {
    try {
      const res = await fetch('/api/wedding');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load wedding settings:', err);
    }
  }, []);

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Initial load & Table QR scan handler
  useEffect(() => {
    fetchWeddingData();
    fetchPhotos();

    // Prompt unregistered guest with gentle modal
    const profile = getGuestProfile();
    if (!profile.isRegistered) {
      const timer = setTimeout(() => {
        setIsGuestModalOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [fetchWeddingData, fetchPhotos]);

  // Real-time Firestore sync listener for instant photo updates across all devices
  useEffect(() => {
    const unsubscribe = subscribePhotos((firestorePhotos, firestoreStats) => {
      if (firestorePhotos && firestorePhotos.length > 0) {
        setPhotos(firestorePhotos);
        setStats(prev => ({
          ...prev,
          totalPhotos: firestoreStats.totalPhotos,
          uniqueContributors: firestoreStats.uniqueContributors,
          contributorsList: firestoreStats.contributorsList,
          syncedToGoogleCount: firestoreStats.syncedToGoogleCount
        }));
        setInitialLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Periodic polling fallback for server data (every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPhotos();
      fetchWeddingData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchPhotos, fetchWeddingData]);

  // Reactions handler
  const handleReact = async (photoId: string, reactionType: 'heart' | 'cheers' | 'sparkles' | 'dance') => {
    const currentPhoto = photos.find(p => p.id === photoId);
    const isLiked = currentPhoto?.likedByDevices?.includes(guestProfile.deviceId) || false;

    // Optimistic UI update
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          likes: isLiked && reactionType === 'heart' ? Math.max(0, p.likes - 1) : p.likes + 1,
          reactions: {
            ...p.reactions,
            [reactionType]: (p.reactions?.[reactionType] || 0) + 1
          },
          likedByDevices: isLiked && reactionType === 'heart'
            ? p.likedByDevices.filter(d => d !== guestProfile.deviceId)
            : [...(p.likedByDevices || []), guestProfile.deviceId]
        };
      }
      return p;
    }));

    // Update in Firestore for other devices
    reactToPhotoInFirestore(photoId, reactionType, guestProfile.deviceId, isLiked);

    try {
      const res = await fetch(`/api/photos/${photoId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reactionType,
          deviceId: guestProfile.deviceId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(prev => prev.map(p => p.id === photoId ? data.photo : p));
        if (selectedPhoto && selectedPhoto.id === photoId) {
          setSelectedPhoto(data.photo);
        }
      }
    } catch (e) {
      console.error('Failed to register reaction:', e);
    }
  };

  // Photo deletion handler
  const handleDeletePhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: guestProfile.deviceId,
          pin: isAdminAuthenticated ? '1234' : undefined
        })
      });
      if (res.ok) {
        // Remove from Firestore
        deletePhotoFromFirestore(photoId).catch(e => console.warn(e));
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        fetchWeddingData();
        if (selectedPhoto && selectedPhoto.id === photoId) {
          setSelectedPhoto(null);
        }
      } else {
        alert('Nie masz uprawnień do usunięcia tego zdjęcia.');
      }
    } catch (e) {
      console.error('Failed to delete photo:', e);
    }
  };

  // Admin settings update
  const handleUpdateSettings = async (pin: string, newSettings: Partial<WeddingSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/wedding/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, settings: newSettings })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        fetchWeddingData();
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd podczas zapisywania ustawień.');
        return false;
      }
    } catch {
      alert('Błąd połączenia z serwerem.');
      return false;
    }
  };

  // Open upload prefilling the title for a timeline event
  const handleSelectEventForUpload = (eventTitle: string) => {
    setIsUploadOpen(true);
  };

  // Lightbox Next/Prev navigation
  const currentIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : -1;
  const handleNextPhoto = () => {
    if (currentIndex >= 0 && currentIndex < photos.length - 1) {
      setSelectedPhoto(photos[currentIndex + 1]);
    } else if (photos.length > 0) {
      setSelectedPhoto(photos[0]);
    }
  };
  const handlePrevPhoto = () => {
    if (currentIndex > 0) {
      setSelectedPhoto(photos[currentIndex - 1]);
    } else if (photos.length > 0) {
      setSelectedPhoto(photos[photos.length - 1]);
    }
  };

  if (initialLoading || !settings) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
          <Heart className="w-8 h-8 fill-rose-400" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-800">
          Wczytywanie Galerii Weselnej...
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Przygotowujemy piękne wspomnienia Pary Młodej
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-stone-800">
      {/* Header with Navigation and Stats */}
      <Header
        settings={settings}
        stats={stats}
        guestProfile={guestProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenGuestModal={() => setIsGuestModalOpen(true)}
        onOpenSlideshow={() => setIsSlideshowOpen(true)}
      />

      {/* Main Content Areas */}
      <main className="flex-1 pb-24">
        {activeTab === 'gallery' && (
          <Gallery
            photos={photos}
            guestProfile={guestProfile}
            settings={settings}
            onSelectPhoto={(photo) => setSelectedPhoto(photo)}
            onReact={handleReact}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenSlideshow={() => setIsSlideshowOpen(true)}
            onDeletePhoto={handleDeletePhoto}
            isAdmin={isAdminAuthenticated}
          />
        )}

        {activeTab === 'timeline' && (
          <WeddingTimeline
            timeline={settings.timeline || []}
            weddingDate={settings.weddingDate}
            onSelectEventForUpload={handleSelectEventForUpload}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            settings={settings}
            photos={photos}
            stats={stats}
            onUpdateSettings={handleUpdateSettings}
            onDeletePhoto={handleDeletePhoto}
            isAdminAuthenticated={isAdminAuthenticated}
            setIsAdminAuthenticated={setIsAdminAuthenticated}
          />
        )}
      </main>

      {/* Floating Action Button (Always available for mobile guests to snap & upload) */}
      <div className="no-print fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white font-medium text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-rose-100/80"
          title="Zrób lub dodaj zdjęcie z wesela"
        >
          <Camera className="w-5 h-5" />
          <span>Dodaj zdjęcie</span>
          <Sparkles className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* Footer */}
      <footer className="no-print border-t border-stone-200/80 bg-white/60 py-6 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-serif text-stone-700 text-sm">
            {settings.coupleNames} • Najpiękniejszy dzień w życiu
          </p>
          <p className="text-[11px] text-stone-400">
            Dedykowana aplikacja fotograficzna dla gości weselnych • Zapamiętane urządzenie bez konieczności logowania
          </p>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        guestProfile={guestProfile}
        settings={settings}
        onPhotoUploaded={() => {
          fetchPhotos();
          fetchWeddingData();
        }}
      />

      <GuestWelcomeModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        currentProfile={guestProfile}
        onSaveProfile={(updated) => setGuestProfile(updated)}
        coupleNames={settings.coupleNames}
      />

      <PhotoLightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
        onReact={handleReact}
        onDelete={handleDeletePhoto}
        guestProfile={guestProfile}
        isAdmin={isAdminAuthenticated}
      />

      <LiveSlideshowModal
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
        photos={photos}
        settings={settings}
      />
    </div>
  );
}
