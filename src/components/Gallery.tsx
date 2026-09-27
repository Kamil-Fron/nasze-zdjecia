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
  onReact: (photoId: string, reactionType: 'heart' | 'cheers' | 'sparkles' | 'dance') => void;
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
        /* Modern Clean Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {filteredPhotos.map((photo) => {
            const isLikedByMe = photo.likedByDevices?.includes(guestProfile.deviceId);

            return (
              <div
                key={photo.id}
                className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div
                  onClick={() => onSelectPhoto(photo)}
                  className="relative aspect-4/3 overflow-hidden bg-stone-100 cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Zdjęcie od ${photo.authorName}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="inline-flex items-center gap-1 text-white text-xs font-medium">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Powiększ</span>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <div className="flex items-center gap-1.5 font-medium text-stone-800">
                        <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">
                          {photo.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[150px]">
                          {photo.authorName}
                        </span>
                      </div>
                      <span className="text-[11px]">{getTimeAgo(photo.createdAt)}</span>
                    </div>

                    {photo.caption && (
                      <p className="text-xs text-stone-700 line-clamp-2 mt-1.5 italic font-serif">
                        „{photo.caption}”
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => onReact(photo.id, 'heart')}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isLikedByMe
                          ? 'bg-rose-50 text-rose-600'
                          : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50/50'
                      }`}
                      title="Polub to zdjęcie"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{photo.likes || 0}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onReact(photo.id, 'cheers')}
                        className="p-1 rounded-md hover:bg-amber-50 text-stone-400 hover:text-amber-600 text-xs transition-colors cursor-pointer"
                        title="Wznieś toast!"
                      >
                        🥂 {photo.reactions?.cheers > 0 && photo.reactions.cheers}
                      </button>
                      <button
                        onClick={() => onReact(photo.id, 'sparkles')}
                        className="p-1 rounded-md hover:bg-yellow-50 text-stone-400 hover:text-yellow-600 text-xs transition-colors cursor-pointer"
                        title="Błysk!"
                      >
                        ✨ {photo.reactions?.sparkles > 0 && photo.reactions.sparkles}
                      </button>

                      {/* Delete photo: strictly allowed only for author or admin */}
                      {(photo.deviceId === guestProfile.deviceId || isAdmin) && onDeletePhoto && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                              onDeletePhoto(photo.id);
                            }
                          }}
                          className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer ml-1"
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
      ) : (
        /* Polaroid Retro View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, idx) => {
            const rotationDegree = (idx % 5 === 0 ? '-1.5deg' : idx % 3 === 0 ? '1.5deg' : '-0.5deg');

            return (
              <div
                key={photo.id}
                style={{ transform: `rotate(${rotationDegree})` }}
                className="bg-white p-3.5 pb-5 rounded-sm shadow-md hover:shadow-xl transition-all duration-300 border border-stone-200 flex flex-col group cursor-pointer hover:rotate-0"
                onClick={() => onSelectPhoto(photo)}
              >
                <div className="w-3 h-3 rounded-full bg-rose-300/80 shadow-xs mx-auto mb-2 border border-rose-400"></div>

                <div className="aspect-square bg-stone-900 overflow-hidden relative">
                  <img
                    src={photo.url}
                    alt={photo.caption || photo.authorName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                </div>

                <div className="mt-3 px-1">
                  <div className="flex items-center justify-between text-xs text-stone-700 font-sans">
                    <span className="font-semibold text-stone-800">
                      {photo.authorName}
                    </span>
                    <span className="text-[11px] text-stone-400">{getTimeAgo(photo.createdAt)}</span>
                  </div>

                  <p className="mt-1.5 text-xs text-stone-800 font-serif italic line-clamp-2">
                    {photo.caption ? `„${photo.caption}”` : 'Wspomnienie z wesela ❤️'}
                  </p>

                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-sans">
                    <span className="flex items-center gap-1 text-rose-500">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      {photo.likes || 0}
                    </span>

                    {(photo.deviceId === guestProfile.deviceId || isAdmin) && onDeletePhoto && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                            onDeletePhoto(photo.id);
                          }
                        }}
                        className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                        title={isAdmin ? "Usuń zdjęcie (Admin)" : "Usuń swoje zdjęcie"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
