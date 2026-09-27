import React, { useState } from 'react';
import { X, Sparkles, Heart, Check, User } from 'lucide-react';
import { GuestProfile } from '../types/wedding';
import { saveGuestProfile } from '../utils/deviceStorage';

interface GuestWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: GuestProfile;
  onSaveProfile: (profile: GuestProfile) => void;
  coupleNames: string;
}

export const GuestWelcomeModal: React.FC<GuestWelcomeModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  coupleNames
}) => {
  const [name, setName] = useState(currentProfile.name || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Proszę podać swoje imię lub pseudonim.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await fetch('/api/guests/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          deviceId: currentProfile.deviceId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'To imię jest już zajęte. Proszę dodać dopisek lub inicjał.');
        setIsSubmitting(false);
        return;
      }

      const updated = saveGuestProfile(cleanName);
      onSaveProfile(updated);
      setIsSubmitting(false);
      onClose();
    } catch {
      // In case of offline/network issue, still allow local save
      const updated = saveGuestProfile(cleanName);
      onSaveProfile(updated);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 p-6 text-center border-b border-stone-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white/80 transition-colors cursor-pointer"
            title="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 shadow-2xs">
            <Heart className="w-6 h-6 fill-rose-400" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-stone-800">
            Witaj na weselu!
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            {coupleNames ? `Razem z ${coupleNames}` : 'Cieszymy się, że jesteś z nami!'}
          </p>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Dostęp bez logowania!</strong> Wpisz swoje imię raz — Twoje urządzenie zostanie automatycznie zapamiętane, dzięki czemu możesz dodawać zdjęcia w każdej chwili bez ponownego wpisywania.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Twoje Imię / Jak Cię podpisać pod zdjęciami? <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="np. Ciocia Ania, Świadek Maciek, Kasia i Tomek"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 text-stone-900 text-sm placeholder:text-stone-400"
                autoFocus
              />
            </div>
            {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            {currentProfile.isRegistered && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
              >
                Anuluj
              </button>
            )}
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Zapisz Imię</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
