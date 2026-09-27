import React, { useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Trash2, 
  User, 
  Calendar, 
  Heart,
  Sparkles,
  CloudCheck
} from 'lucide-react';
import { PhotoItem, GuestProfile } from '../types/wedding';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onReact: (photoId: string, reactionType: 'heart' | 'tear' | 'fire' | 'laugh') => void;
  onDelete: (photoId: string) => void;
  guestProfile: GuestProfile;
  isAdmin: boolean;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  onClose,
  onNext,
  onPrev,
  onReact,
  onDelete,
  guestProfile,
  isAdmin
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photo) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, onClose, onNext, onPrev]);

  if (!photo) return null;

  const isAuthor = photo.deviceId === guestProfile.deviceId;
  const canDelete = isAuthor || isAdmin;

  const formattedDate = new Date(photo.createdAt).toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `wesele_${photo.authorName}_${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Pobierz zdjęcie"
        >
          <Download className="w-5 h-5" />
        </button>

        {canDelete && (
          <button
            onClick={() => {
              if (window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                onDelete(photo.id);
                onClose();
              }
            }}
            className="p-2.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors cursor-pointer"
            title="Usuń zdjęcie"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Zamknij (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Poprzednie zdjęcie"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Następne zdjęcie"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div className="w-full max-w-5xl h-full max-h-[92vh] flex flex-col items-center justify-center p-4">
        <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
          <img
            src={photo.url}
            alt={photo.caption || `Zdjęcie dodane przez ${photo.authorName}`}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
          />
        </div>

        <div className="w-full max-w-2xl mt-3 px-4 py-3 bg-stone-900/80 backdrop-blur-md rounded-2xl border border-stone-800 text-stone-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">
                    {photo.authorName}
                  </span>
                  {isAuthor && (
                    <span className="text-[10px] text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-800/60">
                      Twoje zdjęcie
                    </span>
                  )}
                  {photo.googleSynced && (
                    <span className="text-[10px] text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded-md border border-blue-800/60">
                      Google Zdjęcia ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2 py-1 rounded-xl border border-stone-700">
              {/* Heart */}
              <button
                onClick={() => onReact(photo.id, 'heart')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  photo.userReactions?.[guestProfile.deviceId] === 'heart'
                    ? 'bg-rose-500/30 text-rose-300 ring-1 ring-rose-400 font-bold scale-105'
                    : 'text-stone-300 hover:text-rose-400 hover:bg-stone-700/50'
                }`}
                title="Czysta miłość ❤️ (Kliknij, aby polubić)"
              >
                <span>❤️</span>
                <span className="font-medium text-xs">{photo.reactions?.heart || 0}</span>
              </button>

              {/* Tear / Emotion */}
              <button
                onClick={() => onReact(photo.id, 'tear')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  photo.userReactions?.[guestProfile.deviceId] === 'tear'
                    ? 'bg-sky-500/30 text-sky-300 ring-1 ring-sky-400 font-bold scale-105'
                    : 'text-stone-300 hover:text-sky-300 hover:bg-stone-700/50'
                }`}
                title="Wzruszenie 🥹"
              >
                <span>🥹</span>
                <span className="font-medium text-xs">{photo.reactions?.tear || 0}</span>
              </button>

              {/* Fire / Ogień parkietu */}
              <button
                onClick={() => onReact(photo.id, 'fire')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  photo.userReactions?.[guestProfile.deviceId] === 'fire'
                    ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400 font-bold scale-105'
                    : 'text-stone-300 hover:text-amber-300 hover:bg-stone-700/50'
                }`}
                title="Ogień na parkiecie! 🔥"
              >
                <span>🔥</span>
                <span className="font-medium text-xs">{photo.reactions?.fire || 0}</span>
              </button>

              {/* Laugh / Uśmiech */}
              <button
                onClick={() => onReact(photo.id, 'laugh')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  photo.userReactions?.[guestProfile.deviceId] === 'laugh'
                    ? 'bg-yellow-500/30 text-yellow-300 ring-1 ring-yellow-400 font-bold scale-105'
                    : 'text-stone-300 hover:text-yellow-300 hover:bg-stone-700/50'
                }`}
                title="Hahaha / Humor 😂"
              >
                <span>😂</span>
                <span className="font-medium text-xs">{photo.reactions?.laugh || 0}</span>
              </button>
            </div>
          </div>

          {photo.caption && (
            <div className="mt-2 text-sm text-stone-300 italic border-t border-stone-800/80 pt-2 font-serif">
              „{photo.caption}”
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
