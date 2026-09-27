import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Camera, 
  Check, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GuestProfile, WeddingSettings } from '../types/wedding';
import { compressImage } from '../utils/imageCompressor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestProfile: GuestProfile;
  settings: WeddingSettings;
  onPhotoUploaded: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  guestProfile,
  settings,
  onPhotoUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [authorName, setAuthorName] = useState(guestProfile.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Wybierz poprawny plik graficzny (JPG, PNG, WebP).');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Wybierz lub zrób zdjęcie przed wysłaniem.');
      return;
    }
    const finalAuthorName = (guestProfile.name || authorName).trim();
    if (!finalAuthorName) {
      setErrorMessage('Podaj swoje imię, by Młoda Para wiedziała, od kogo jest to zdjęcie!');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');
      setUploadProgress('Optymalizuję jakość zdjęcia...');

      const base64Data = await compressImage(selectedFile, 2048, 0.88);

      setUploadProgress('Wysyłam do galerii i synchronizuję z albumem...');

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          authorName: finalAuthorName,
          deviceId: guestProfile.deviceId,
          caption: caption.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się przesłać zdjęcia.');
      }

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setIsUploading(false);
      onPhotoUploaded();
      onClose();
    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      setErrorMessage(err.message || 'Wystąpił błąd podczas wysyłania.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 via-amber-50/60 to-rose-50 px-6 py-4 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2 text-stone-800">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">Dodaj zdjęcie z wesela</h3>
              <p className="text-xs text-stone-500">Pokaż Parze Młodej te wspaniałe chwile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* File select drop area / Camera trigger */}
          {!previewUrl ? (
            <div className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/20 rounded-2xl p-6 text-center transition-all">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center mb-3 shadow-2xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-stone-800">
                  Wybierz zdjęcie z telefonu lub zrób nowe
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Obsługuje formaty JPG, PNG, HEIC i inne
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Zrób zdjęcie aparatem</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-stone-600" />
                    <span>Wybierz z galerii</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 group">
              <img
                src={previewUrl}
                alt="Podgląd wybranego zdjęcia"
                className="w-full max-h-64 object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                disabled={isUploading}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white text-xs font-medium backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Zmień zdjęcie</span>
              </button>
            </div>
          )}

          {/* Author info: display saved name badge or ask if unregistered */}
          {guestProfile.name ? (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-rose-50/50 rounded-xl border border-rose-200/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
                  {guestProfile.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-stone-600">
                  Udostępniasz jako: <strong className="text-stone-900">{guestProfile.name}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kto udostępnia to zdjęcie? <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="np. Świadek Paweł, Kasia i Marek"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>
            </div>
          )}

          {/* Caption / Wishes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Podpis / Życzenia dla Pary Młodej <span className="text-stone-400 font-normal">(opcjonalnie)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Napisz kilka ciepłych słów, opisz tę chwilę lub złóż życzenia..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
            />
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Information about automatic Google Album sync */}
          {settings.googleSync?.isConnected && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center gap-2.5 text-xs text-blue-900">
              <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
              <span>
                Zdjęcie pojawi się w galerii weselnej i automatycznie zapisze się w oficjalnym albumie Pary Młodej (<strong>{settings.googleSync.albumName}</strong>).
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white shadow-md transition-all cursor-pointer ${
                isUploading || !selectedFile
                  ? 'bg-rose-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 hover:shadow-lg'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress || 'Wysyłanie...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Opublikuj w Galerii</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
