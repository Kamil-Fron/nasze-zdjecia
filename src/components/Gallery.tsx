import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Search, 
  Grid, 
  Columns, 
  Camera, 
  Maximize2, 
  Tv,
  Trash2
} from 'lucide-react';
import { PhotoItem, GuestProfile, WeddingSettings } from '../types/wedding';

interface GalleryProps {
  photos: PhotoItem[];
  guestProfile: GuestProfile;
  settings: WeddingSettings;
  onSelectPhoto: (photo: PhotoItem) => void;
  onReact: (photoId: string, reactionType: 'heart' | 'tear' | 'fire' | 'laugh') => void;
  onOpenUpload: () => void;
  onOpenSlideshow: () => void;
  onDeletePhoto?: (photoId: string) => void;
  isAdmin?: boolean;
}

export const Gallery: React.FC<GalleryProps> = ({
  photos,
  guestProfile,
  settings,
  onSelectPhoto,
  onReact,
  onOpenUpload,
  onOpenSlideshow,
  onDeletePhoto,
  isAdmin = false
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'popular'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStyle, setViewStyle] = useState<'modern' | 'polaroid'>('modern');

  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAuthor = photo.authorName.toLowerCase().includes(q);
        const matchesCaption = photo.caption.toLowerCase().includes(q);
        if (!matchesAuthor && !matchesCaption) return false;
      }

      if (filterMode === 'mine') {
        return photo.deviceId === guestProfile.deviceId;
      }
      return true;
    }).sort((a, b) => {
      if (filterMode === 'popular') {
        return (b.likes || 0) - (a.likes || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [photos, filterMode, searchQuery, guestProfile.deviceId]);

  const getTimeAgo = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'przed chwilą';
      if (diffMins < 60) return `${diffMins} min temu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} godz. temu`;
      return new Date(isoDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <section className="py-6 px-4 max-w-6xl mx-auto">
      {/* Controls & Filters Bar */}
      <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-stone-200/80 shadow-xs mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Wszystkie ({photos.length})
            </button>

            <button
              onClick={() => setFilterMode('mine')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'mine'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Moje ujęcia
            </button>

            <button
              onClick={() => setFilterMode('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'popular'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              ❤️ Najpopularniejsze
            </button>
          </div>

          {/* View mode toggle & Slideshow link */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                onClick={() => setViewStyle('modern')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewStyle === 'modern' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Widok nowoczesnych kafelków"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewStyle('polaroid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewStyle === 'polaroid' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Widok ramek Polaroid"
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenSlideshow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white hover:bg-black text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              title="Pokaz slajdów na żywo dla gości"
            >
              <Tv className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Pokaz na żywo</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full pt-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po imieniu osoby lub podpisie..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300 max-w-md mx-auto my-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-xl text-stone-800">
            {filterMode === 'mine' ? 'Nie dodałeś jeszcze żadnego zdjęcia' : 'Brak zdjęć w tym widoku'}
          </h3>
          <p className="text-sm text-stone-500 mt-2 mb-6">
            {filterMode === 'mine'
              ? 'Zrób zdjęcie lub wybierz je z telefonu, aby uwiecznić te piękne chwile!'
              : 'Bądź pierwszą osobą, która podzieli się wyjątkowym kadrem z tego wesela.'}
          </p>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium text-sm shadow-md transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Dodaj Pierwsze Zdjęcie</span>
          </button>
        </div>
      ) : viewStyle === 'modern' ? (
        /* Modern Editorial & Minimalist Visual Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredPhotos.map((photo) => {
            const myReaction = photo.userReactions?.[guestProfile.deviceId];
            const isLikedByMe = photo.likedByDevices?.includes(guestProfile.deviceId);

            return (
              <div
                key={photo.id}
                className="group relative bg-white/95 rounded-3xl overflow-hidden border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12)] transition-all duration-500 flex flex-col hover:-translate-y-1"
              >
                {/* Visual Image container with soft vignette overlay */}
                <div
                  onClick={() => onSelectPhoto(photo)}
                  className="relative aspect-[4/3] sm:aspect-[1/1] overflow-hidden bg-stone-100 cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Zdjęcie od ${photo.authorName}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle top metadata chip */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/95 text-[11px] font-medium tracking-wide">
                      {photo.authorName}
                    </span>
                    {photo.deviceId === guestProfile.deviceId && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-md text-white text-[10px] font-semibold">
                        Twoje
                      </span>
                    )}
                  </div>

                  {/* Hover visual CTA */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <span className="inline-flex items-center gap-1.5 text-white text-xs font-medium tracking-wide">
                      <Maximize2 className="w-4 h-4 text-rose-300" />
                      <span>Powiększ</span>
                    </span>
                    <span className="text-[11px] text-stone-200 font-sans">
                      {getTimeAgo(photo.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Content & Interactive Reaction Bar */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-[#FDFCFB]">
                  {photo.caption ? (
                    <p className="text-sm text-stone-800 font-serif italic leading-relaxed line-clamp-2">
                      „{photo.caption}”
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 font-serif italic">
                      Wspomnienie weselne
                    </p>
                  )}

                  {/* Reaction bar - clean, modern, 1-click single reaction */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-stone-50/90 p-1 rounded-2xl border border-stone-200/60">
                      {/* Heart */}
                      <button
                        onClick={() => onReact(photo.id, 'heart')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          myReaction === 'heart'
                            ? 'bg-rose-500 text-white shadow-2xs font-semibold scale-105'
                            : 'text-stone-600 hover:text-rose-600 hover:bg-rose-50/60'
                        }`}
                        title="Uwielbiam ❤️"
                      >
                        <span>❤️</span>
                        <span>{photo.reactions?.heart || 0}</span>
                      </button>

                      {/* Tear / Wzruszenie */}
                      <button
                        onClick={() => onReact(photo.id, 'tear')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          myReaction === 'tear'
                            ? 'bg-sky-500 text-white shadow-2xs font-semibold scale-105'
                            : 'text-stone-600 hover:text-sky-600 hover:bg-sky-50/60'
                        }`}
                        title="Wzruszenie 🥹"
                      >
                        <span>🥹</span>
                        <span>{photo.reactions?.tear > 0 ? photo.reactions.tear : ''}</span>
                      </button>

                      {/* Fire / Ogień parkietu */}
                      <button
                        onClick={() => onReact(photo.id, 'fire')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          myReaction === 'fire'
                            ? 'bg-amber-500 text-white shadow-2xs font-semibold scale-105'
                            : 'text-stone-600 hover:text-amber-600 hover:bg-amber-50/60'
                        }`}
                        title="Ogień! 🔥"
                      >
                        <span>🔥</span>
                        <span>{photo.reactions?.fire > 0 ? photo.reactions.fire : ''}</span>
                      </button>

                      {/* Laugh / Śmiech */}
                      <button
                        onClick={() => onReact(photo.id, 'laugh')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          myReaction === 'laugh'
                            ? 'bg-yellow-500 text-white shadow-2xs font-semibold scale-105'
                            : 'text-stone-600 hover:text-yellow-600 hover:bg-yellow-50/60'
                        }`}
                        title="Śmiech 😂"
                      >
                        <span>😂</span>
                        <span>{photo.reactions?.laugh > 0 ? photo.reactions.laugh : ''}</span>
                      </button>
                    </div>

                    {/* Delete action for author or admin */}
                    {(photo.deviceId === guestProfile.deviceId || isAdmin) && onDeletePhoto && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                            onDeletePhoto(photo.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                        title={isAdmin ? "Usuń zdjęcie (Admin)" : "Usuń swoje zdjęcie"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Polaroid Retro Modern View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
          {filteredPhotos.map((photo, idx) => {
            const rotationDegree = (idx % 4 === 0 ? '-1.5deg' : idx % 2 === 0 ? '1.5deg' : '-0.5deg');
            const myReaction = photo.userReactions?.[guestProfile.deviceId];

            return (
              <div
                key={photo.id}
                style={{ transform: `rotate(${rotationDegree})` }}
                className="bg-white p-4 pb-6 rounded-2xl shadow-[0_6px_25px_-5px_rgba(0,0,0,0.08)] hover:shadow-2xl transition-all duration-300 border border-stone-200/90 flex flex-col group cursor-pointer hover:rotate-0 hover:scale-[1.02]"
                onClick={() => onSelectPhoto(photo)}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-rose-200/90 mx-auto mb-2.5 border border-rose-300"></div>

                <div className="aspect-square bg-stone-900 rounded-xl overflow-hidden relative shadow-inner">
                  <img
                    src={photo.url}
                    alt={photo.caption || photo.authorName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="mt-3.5 px-1">
                  <div className="flex items-center justify-between text-xs text-stone-700 font-sans">
                    <span className="font-semibold text-stone-900 tracking-tight">
                      {photo.authorName}
                    </span>
                    <span className="text-[11px] text-stone-400">{getTimeAgo(photo.createdAt)}</span>
                  </div>

                  <p className="mt-1.5 text-xs text-stone-800 font-serif italic line-clamp-2">
                    {photo.caption ? `„${photo.caption}”` : 'Niezapomniane wesele ❤️'}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact(photo.id, 'heart');
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
                        myReaction === 'heart'
                          ? 'bg-rose-50 text-rose-600 font-semibold'
                          : 'text-stone-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${myReaction === 'heart' ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{photo.likes || 0}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {photo.reactions?.tear > 0 && <span title="Wzruszenie">🥹 {photo.reactions.tear}</span>}
                      {photo.reactions?.fire > 0 && <span title="Ogień">🔥 {photo.reactions.fire}</span>}
                      {photo.reactions?.laugh > 0 && <span title="Śmiech">😂 {photo.reactions.laugh}</span>}

                      {(photo.deviceId === guestProfile.deviceId || isAdmin) && onDeletePhoto && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                              onDeletePhoto(photo.id);
                            }
                          }}
                          className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer ml-1"
                          title={isAdmin ? "Usuń zdjęcie (Admin)" : "Usuń swoje zdjęcie"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
