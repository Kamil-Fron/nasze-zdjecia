import React from 'react';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Clock, 
  Image as ImageIcon, 
  Settings, 
  Tv, 
  UserCheck, 
  Sparkles, 
  Camera, 
  Cloud 
} from 'lucide-react';
import { WeddingSettings, WeddingStats, GuestProfile } from '../types/wedding';

interface HeaderProps {
  settings: WeddingSettings;
  stats: WeddingStats;
  guestProfile: GuestProfile;
  activeTab: 'gallery' | 'timeline' | 'admin';
  setActiveTab: (tab: 'gallery' | 'timeline' | 'admin') => void;
  onOpenUpload: () => void;
  onOpenGuestModal: () => void;
  onOpenSlideshow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  stats,
  guestProfile,
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenGuestModal,
  onOpenSlideshow
}) => {
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(settings.weddingDate);
      return d.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return settings.weddingDate;
    }
  }, [settings.weddingDate]);

  return (
    <header className="relative bg-gradient-to-b from-[#FAF4EC] via-[#FDFBF7] to-[#FAF7F2] border-b border-stone-200/80 shadow-xs">
      {/* Top bar for guest greeting, cloud sync status & admin */}
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between text-xs text-stone-600 border-b border-stone-200/50">
        <div className="flex items-center gap-2">
          {guestProfile.isRegistered ? (
            <button
              onClick={onOpenGuestModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200/60 font-medium cursor-pointer"
              title="Kliknij, aby zmienić swoje imię"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Gość: <strong>{guestProfile.name}</strong></span>
              <span className="text-rose-500 text-[10px] underline ml-0.5">zmień</span>
            </button>
          ) : (
            <button
              onClick={onOpenGuestModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 font-medium cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Przedstaw się parze młodej</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Subtle Google Album Sync indicator */}
          {settings.googleSync?.isConnected && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-full border border-stone-200" title={`Zdjęcia są synchronizowane z albumem Google: ${settings.googleSync.albumName}`}>
              <Cloud className="w-3 h-3 text-blue-500" />
              <span>Konto Google połączone</span>
            </span>
          )}

          <button
            onClick={onOpenSlideshow}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-stone-200 cursor-pointer"
            title="Uruchom pokaz slajdów na rzutniku lub telewizorze"
          >
            <Tv className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tryb Rzutnik / TV</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-stone-800 text-white font-medium'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Panel Pary Młodej</span>
          </button>
        </div>
      </div>

      {/* Main romantic hero section */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2 text-rose-400">
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-rose-300"></div>
          <Heart className="w-4 h-4 fill-rose-300 text-rose-400 animate-pulse" />
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-rose-300"></div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-stone-800 tracking-tight font-medium leading-tight">
          {settings.coupleNames}
        </h1>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-sm text-stone-600">
          <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
            <Calendar className="w-4 h-4 text-rose-500" />
            {formattedDate}
          </span>
          {settings.weddingLocation && (
            <span className="inline-flex items-center gap-1.5 text-stone-600">
              <MapPin className="w-4 h-4 text-amber-600" />
              {settings.weddingLocation}
            </span>
          )}
        </div>

        {/* Custom bride & groom notice or motto */}
        <div className="mt-4 max-w-2xl mx-auto">
          <p className="text-stone-700 italic font-serif text-lg leading-relaxed px-4">
            „{settings.welcomeMessage || settings.welcomeTitle}”
          </p>
        </div>

        {/* Live Contribution Counter & Upload Action */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200/90 shadow-2xs text-xs sm:text-sm text-stone-700">
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-rose-200 flex items-center justify-center text-[10px] font-bold text-rose-800 ring-2 ring-white">
                ❤️
              </div>
              <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-800 ring-2 ring-white">
                📸
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-800 ring-2 ring-white">
                🥂
              </div>
            </div>
            <div>
              <span className="font-semibold text-stone-900">{stats.uniqueContributors}</span>
              {' '}
              {stats.uniqueContributors === 1 ? 'gość dodał' : 'gości dodało'}
              {' '}
              <span className="font-semibold text-rose-600">{stats.totalPhotos}</span>
              {' '}
              {stats.totalPhotos === 1 ? 'zdjęcie' : (stats.totalPhotos > 1 && stats.totalPhotos < 5) ? 'zdjęcia' : 'zdjęć'}
            </div>
          </div>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Camera className="w-4 h-4" />
            <span>Dodaj swoje zdjęcie</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-2">
        <nav className="flex items-center justify-center gap-1 sm:gap-2 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'border-rose-600 text-rose-800 bg-white/70 shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <span>Wszystkie Zdjęcia</span>
            <span className="ml-0.5 px-1.5 py-0.5 text-[11px] rounded-full bg-rose-100 text-rose-800 font-semibold">
              {stats.totalPhotos}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-rose-600 text-rose-800 bg-white/70 shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Harmonogram & Liczniki</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
