import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Sparkles,
  Heart
} from 'lucide-react';
import { PhotoItem, WeddingSettings } from '../types/wedding';

interface LiveSlideshowModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  settings: WeddingSettings;
}

export const LiveSlideshowModal: React.FC<LiveSlideshowModalProps> = ({
  isOpen,
  onClose,
  photos,
  settings
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
    QRCode.toDataURL(appUrl, {
      width: 250,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    }).then(setQrUrl).catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isPlaying || photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, photos.length, onClose]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* Top Banner with Bride & Groom names and Controls */}
      <div className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center">
            <Heart className="w-4 h-4 fill-rose-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
              {settings.coupleNames}
            </h2>
            <p className="text-[11px] text-stone-400 font-sans uppercase tracking-widest">
              Wspomnienia na żywo z wesela
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isPlaying ? 'Pauza (Spacja)' : 'Wznów (Spacja)'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Pełny ekran"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Wyjdź z trybu rzutnika (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 w-full flex items-center justify-center p-4">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={photo.url}
              alt={photo.caption || photo.authorName}
              className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-xl"
            />
          </div>
        ))}

        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % photos.length)}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom Bar: Photo info + QR code */}
      <div className="w-full px-6 py-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex items-end justify-between z-20 gap-4">
        <div className="max-w-2xl bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-rose-300 font-semibold">
              📸 Dodane przez:
            </span>
            <span className="text-base font-bold text-white">
              {currentPhoto.authorName}
            </span>
          </div>

          {currentPhoto.caption && (
            <p className="mt-1 text-base sm:text-lg font-serif italic text-stone-200">
              „{currentPhoto.caption}”
            </p>
          )}

          <div className="mt-2 text-xs text-stone-400 flex items-center gap-2">
            <span>Zdjęcie {currentIndex + 1} z {photos.length}</span>
            <span>•</span>
            <span>❤️ {currentPhoto.likes || 0} polubień</span>
          </div>
        </div>

        {qrUrl && (
          <div className="bg-white/95 text-stone-900 p-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white shrink-0">
            <img src={qrUrl} alt="Zeskanuj i dodaj" className="w-20 h-20 object-contain rounded-lg" />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dodaj fotkę!</span>
              </div>
              <p className="text-[11px] text-stone-600 max-w-[120px] leading-tight mt-0.5">
                Zeskanuj telefonem i zobacz swoje zdjęcie na ekranie!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
