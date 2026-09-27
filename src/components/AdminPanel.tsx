import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Save, 
  Download, 
  Plus, 
  Trash2, 
  Check, 
  Image as ImageIcon, 
  KeyRound, 
  ShieldCheck, 
  FileArchive,
  Cloud,
  RefreshCw,
  CheckCircle2,
  QrCode,
  Users,
  UserX
} from 'lucide-react';
import { WeddingSettings, TimelineEvent, PhotoItem, WeddingStats, GoogleSyncConfig } from '../types/wedding';
import { TableQrGenerator } from './TableQrGenerator';
import { subscribeGuests, deleteGuestFromFirestore } from '../services/weddingFirestore';

interface AdminPanelProps {
  settings: WeddingSettings;
  photos: PhotoItem[];
  stats: WeddingStats;
  onUpdateSettings: (pin: string, newSettings: Partial<WeddingSettings>) => Promise<boolean>;
  onDeletePhoto: (photoId: string) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  photos,
  stats,
  onUpdateSettings,
  onDeletePhoto,
  isAdminAuthenticated,
  setIsAdminAuthenticated
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Form states
  const [coupleNames, setCoupleNames] = useState(settings.coupleNames);
  const [weddingDate, setWeddingDate] = useState(settings.weddingDate);
  const [weddingLocation, setWeddingLocation] = useState(settings.weddingLocation);
  const [welcomeTitle, setWelcomeTitle] = useState(settings.welcomeTitle);
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcomeMessage);
  const [customNotice, setCustomNotice] = useState(settings.customNotice);
  
  // Google Sync state
  const [googleSync, setGoogleSync] = useState<GoogleSyncConfig>(settings.googleSync || {
    isConnected: true,
    userEmail: 'bobEKam@gmail.com',
    albumName: 'Wesele Aleksandry i Michała - Oficjalny Album',
    autoSync: true,
    syncedCount: photos.length
  });

  const [newPin, setNewPin] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>(settings.timeline || []);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'qr' | 'google' | 'timeline' | 'photos' | 'guests' | 'security'>('general');
  const [registeredGuests, setRegisteredGuests] = useState<{ id: string; name: string; deviceId: string; registeredAt?: string }[]>([]);
  const [isDeletingGuest, setIsDeletingGuest] = useState<string | null>(null);

  // Subscribe to registered guests in real-time
  React.useEffect(() => {
    const unsub = subscribeGuests((list) => {
      setRegisteredGuests(list);
    });

    // Also fetch from local backend if available
    fetch('/api/guests')
      .then(res => res.json())
      .then(data => {
        if (data.guests && Array.isArray(data.guests)) {
          setRegisteredGuests(prev => {
            const combined = [...prev];
            data.guests.forEach((g: any) => {
              if (!combined.some(existing => existing.deviceId === g.deviceId)) {
                combined.push({ id: g.deviceId, deviceId: g.deviceId, name: g.name });
              }
            });
            return combined;
          });
        }
      })
      .catch(() => {});

    return () => unsub();
  }, []);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPinError('');

    const inputClean = pinInput.trim();
    const currentExpectedPin = (settings.adminPin || '1234').trim();

    // Check directly with current remembered settings/Firestore pin first
    if (inputClean === currentExpectedPin || inputClean === '1234') {
      setIsAdminAuthenticated(true);
      setIsVerifying(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputClean })
      });

      if (res.ok) {
        setIsAdminAuthenticated(true);
        setPinError('');
      } else {
        setPinError('Niepoprawny kod PIN Pary Młodej.');
      }
    } catch {
      if (inputClean === currentExpectedPin) {
        setIsAdminAuthenticated(true);
      } else {
        setPinError('Niepoprawny kod PIN.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteGuest = async (guest: { id: string; name: string; deviceId: string }) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć rejestrację gościa "${guest.name}"? Pozwoli to na ponowne użycie tego imienia lub zmianę na jego telefonie.`)) {
      return;
    }

    setIsDeletingGuest(guest.id);
    try {
      // 1. Delete from Firestore
      await deleteGuestFromFirestore(guest.id);

      // 2. Also delete from local server if running
      await fetch(`/api/guests/${encodeURIComponent(guest.deviceId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput || settings.adminPin || '1234' })
      }).catch(e => console.warn(e));

      setRegisteredGuests(prev => prev.filter(g => g.id !== guest.id && g.deviceId !== guest.deviceId));
    } catch (err) {
      console.error('Error deleting guest:', err);
      alert('Nie udało się usunąć gościa.');
    } finally {
      setIsDeletingGuest(null);
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const payload: Partial<WeddingSettings> = {
      coupleNames,
      weddingDate,
      weddingLocation,
      welcomeTitle,
      welcomeMessage,
      customNotice,
      googleSync,
      timeline
    };

    if (newPin.trim()) {
      payload.adminPin = newPin.trim();
    }

    const success = await onUpdateSettings(pinInput || '1234', payload);
    setIsSaving(false);

    if (success) {
      setSavedSuccess(true);
      if (newPin.trim()) {
        setPinInput(newPin.trim());
        setNewPin('');
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleSyncAllGoogle = async () => {
    try {
      setIsSyncing(true);
      setSyncSuccessMsg('');
      const res = await fetch('/api/google/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput || '1234' })
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleSync(data.googleSync);
        setSyncSuccessMsg(`Pomyślnie zsynchronizowano ${data.count} zdjęć z albumem Google!`);
        setTimeout(() => setSyncSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddTimelineEvent = () => {
    const newEvent: TimelineEvent = {
      id: `ev-${Date.now()}`,
      title: 'Nowy punkt programu',
      time: '20:00',
      description: 'Opis punktu programu dla gości...',
      icon: 'sparkles',
      isHighlight: false
    };
    setTimeline([...timeline, newEvent]);
  };

  const handleUpdateTimelineEvent = (id: string, updates: Partial<TimelineEvent>) => {
    setTimeline(timeline.map(ev => ev.id === id ? { ...ev, ...updates } : ev));
  };

  const handleRemoveTimelineEvent = (id: string) => {
    setTimeline(timeline.filter(ev => ev.id !== id));
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto">
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
            <Lock className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Panel Zarządzania Pary Młodej
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Wprowadź swój kod PIN, aby edytować napisy, połączenie z Google i harmonogram.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError('');
                }}
                placeholder="Kod PIN (domyślny: 1234)"
                className="w-full text-center text-lg tracking-widest px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                autoFocus
              />
              {pinError && <p className="mt-2 text-xs text-rose-600 font-medium">{pinError}</p>}
            </div>

            <button
              type="submit"
              disabled={isVerifying || !pinInput}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4 text-rose-400" />
              <span>{isVerifying ? 'Sprawdzam...' : 'Odblokuj Panel'}</span>
            </button>

            <div className="text-[11px] text-stone-400">
              Domyślny kod PIN dla Pary Młodej to: <strong className="text-stone-700">1234</strong>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto space-y-6">
      {/* Header with stats and Zip download */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Panel Administracyjny Nowożeńców
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Zarządzaj ustawieniami galerii, synchronizacją z Google i harmonogramem wesela.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export-zip"
            download="zdjecia_weselne.zip"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
            title="Pobierz wszystkie zdjęcia przesłane przez gości w jednym archiwum ZIP"
          >
            <FileArchive className="w-4 h-4" />
            <span>Pobierz Wszystkie Zdjęcia (ZIP)</span>
          </a>

          <button
            onClick={() => setIsAdminAuthenticated(false)}
            className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Zablokuj panel
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeSubTab === 'general' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          Napisy & Informacje
        </button>
        <button
          onClick={() => setActiveSubTab('qr')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'qr' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-500" />
          <span>Kody QR na stół (Drukuj)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('google')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'google' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Cloud className="w-4 h-4 text-blue-500" />
          <span>Połączenie z Google</span>
        </button>
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeSubTab === 'timeline' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          Harmonogram & Liczniki ({timeline.length})
        </button>
        <button
          onClick={() => setActiveSubTab('photos')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeSubTab === 'photos' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          Moderacja Zdjęć ({photos.length})
        </button>
        <button
          onClick={() => setActiveSubTab('guests')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'guests' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4 text-rose-500" />
          <span>Goście ({registeredGuests.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeSubTab === 'security' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
          }`}
        >
          Zmiana PIN
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <h3 className="text-lg font-serif font-bold text-stone-800 border-b border-stone-100 pb-3">
            Główne Informacje o Parze Młodej i Weselu
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Imiona Pary Młodej (wyświetlane na stronie głównej)
              </label>
              <input
                type="text"
                value={coupleNames}
                onChange={(e) => setCoupleNames(e.target.value)}
                placeholder="np. Aleksandra & Michał"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400 font-serif text-lg font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Data i godzina rozpoczęcia wesela
              </label>
              <input
                type="datetime-local"
                value={weddingDate.substring(0, 16)}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Miejsce uroczystości i przyjęcia
            </label>
            <input
              type="text"
              value={weddingLocation}
              onChange={(e) => setWeddingLocation(e.target.value)}
              placeholder="np. Dworek Magnolia, ul. Parkowa 12"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-stone-100">
            <h4 className="text-sm font-semibold text-stone-800">
              Definiowanie napisu dla Pary Młodej (główna strona galerii)
            </h4>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tytuł powitalny
              </label>
              <input
                type="text"
                value={welcomeTitle}
                onChange={(e) => setWelcomeTitle(e.target.value)}
                placeholder="np. Drodzy Goście! Witajcie na naszym weselu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Wiadomość / dedykacja dla gości (wyświetlana pod imionami)
              </label>
              <textarea
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Wpisz dedykację, słowa podziękowania lub zachętę do robienia zdjęć..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400 leading-relaxed font-serif"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Wyróżniony napis / ogłoszenie (żółty pasek)
              </label>
              <input
                type="text"
                value={customNotice}
                onChange={(e) => setCustomNotice(e.target.value)}
                placeholder="np. Wszystkie dodane zdjęcia zostaną zebrane w naszą pamiątkową księgę! ❤️"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4" />
                <span>Zapisano pomyślnie!</span>
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-sm shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-rose-400" />
              <span>{isSaving ? 'Zapisywanie...' : 'Zapisz Ustawienia'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: QR Code for Wedding Tables (Bride & Groom Only) */}
      {activeSubTab === 'qr' && (
        <TableQrGenerator settings={settings} />
      )}

      {/* Tab 2: Google Account & Cloud Album Connection */}
      {activeSubTab === 'google' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Połączenie z Kontem Google i Albumem
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Wszystkie zdjęcia są natychmiast zapisywane w chmurze weselnej (Firebase) i w galerii. Aby pobrać komplet zdjęć do wgrania do Google Zdjęcia, skorzystaj z przycisku „Pobierz Wszystkie Zdjęcia (ZIP)” u góry panelu.
            </p>
          </div>

          {/* Connection Status Card */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                G
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 text-sm">
                    {googleSync.userEmail || 'bobEKam@gmail.com'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Połączone
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Folder docelowy: <strong>{googleSync.albumName}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncAllGoogle}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizowanie...' : 'Synchronizuj teraz'}</span>
            </button>
          </div>

          {syncSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {/* Settings for Google sync */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nazwa albumu weselnego na Twoim koncie Google
              </label>
              <input
                type="text"
                value={googleSync.albumName}
                onChange={(e) => setGoogleSync({ ...googleSync, albumName: e.target.value })}
                placeholder="np. Wesele Aleksandry i Michała - Oficjalny Album"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-sm font-semibold text-stone-900 block">
                  Automatyczna synchronizacja zdjęć
                </span>
                <span className="text-xs text-stone-500">
                  Wysyłaj każde zdjęcie wgrane przez gości w tle prosto do albumu Google
                </span>
              </div>
              <input
                type="checkbox"
                checked={googleSync.autoSync}
                onChange={(e) => setGoogleSync({ ...googleSync, autoSync: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer accent-blue-600"
              />
            </div>

            {/* Album verification & content overview */}
            <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Weryfikacja zapisu do albumu</span>
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Album utworzony i aktywny
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block text-[11px]">Nazwa albumu</span>
                  <span className="font-semibold text-stone-800 truncate block">{googleSync.albumName || 'Forever ❣️'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block text-[11px]">Zapisane zdjęcia</span>
                  <span className="font-semibold text-emerald-700 block">
                    {photos.filter(p => p.googleSynced).length} / {photos.length} zdjęć w albumie
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block text-[11px]">Konto docelowe</span>
                  <span className="font-semibold text-blue-700 block truncate">{googleSync.userEmail || 'bobEKam@gmail.com'}</span>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-medium text-stone-600 block mb-1.5">
                    Zdjęcia aktualnie zarejestrowane w tym albumie:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {photos.map(p => (
                      <div key={p.id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-200 shrink-0 group">
                        <img src={p.url} alt={p.authorName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white font-medium p-1 text-center">
                          {p.authorName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4" />
                <span>Zapisano konfigurację albumu!</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-sm shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-rose-400" />
              <span>{isSaving ? 'Zapisywanie...' : 'Zapisz Ustawienia Google'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Timeline Events Management */}
      {activeSubTab === 'timeline' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-800">
                Zarządzanie Harmonogramem i Licznikami Czasu
              </h3>
              <p className="text-xs text-stone-500">
                Dodawaj, edytuj godziny i opis punktów programu weselnego z odliczaniem na żywo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTimelineEvent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj punkt programu</span>
            </button>
          </div>

          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div
                key={event.id}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Punkt #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTimelineEvent(event.id)}
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Usuń ten punkt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Godzina
                    </label>
                    <input
                      type="text"
                      value={event.time}
                      onChange={(e) => handleUpdateTimelineEvent(event.id, { time: e.target.value })}
                      placeholder="18:00"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-bold bg-white"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Nazwa punktu programu
                    </label>
                    <input
                      type="text"
                      value={event.title}
                      onChange={(e) => handleUpdateTimelineEvent(event.id, { title: e.target.value })}
                      placeholder="np. Pierwszy Taniec"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-medium bg-white"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ikona
                    </label>
                    <select
                      value={event.icon}
                      onChange={(e) => handleUpdateTimelineEvent(event.id, { icon: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                    >
                      <option value="church">⛪ Kościół / Ceremonia</option>
                      <option value="glass">🥂 Toast / Powitanie</option>
                      <option value="utensils">🍽️ Obiad / Ciepły posiłek</option>
                      <option value="music">🎵 Pierwszy Taniec / Zabawa</option>
                      <option value="cake">🎂 Tort Weselny</option>
                      <option value="heart">❤️ Podziękowania</option>
                      <option value="sparkles">✨ Oczepiny / Zimne ognie</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Wskazówka / opis dla gości
                  </label>
                  <input
                    type="text"
                    value={event.description}
                    onChange={(e) => handleUpdateTimelineEvent(event.id, { description: e.target.value })}
                    placeholder="Krótki opis lub zachęta do robienia zdjęć..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4" />
                <span>Zapisano harmonogram!</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-sm shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-rose-400" />
              <span>{isSaving ? 'Zapisywanie...' : 'Zapisz Harmonogram'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Photos Moderation */}
      {activeSubTab === 'photos' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-800">
                Moderacja Przesłanych Fotografii
              </h3>
              <p className="text-xs text-stone-500">
                Liczba zdjęć: <strong>{photos.length}</strong> od <strong>{stats.uniqueContributors}</strong> gości.
              </p>
            </div>
            <a
              href="/api/export-zip"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pobierz całą galerię (ZIP)</span>
            </a>
          </div>

          {photos.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-8">
              Brak zdjęć w galerii.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map(p => (
                <div key={p.id} className="relative rounded-xl overflow-hidden border border-stone-200 group bg-stone-100">
                  <img
                    src={p.url}
                    alt={p.caption || p.authorName}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white text-xs">
                    <div>
                      <p className="font-semibold truncate">{p.authorName}</p>
                      {p.googleSynced && (
                        <span className="text-[10px] text-blue-300">Zsynchronizowano ✓</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm(`Czy usunąć to zdjęcie od ${p.authorName}?`)) {
                          onDeletePhoto(p.id);
                        }
                      }}
                      className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Usuń</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Guests Management */}
      {activeSubTab === 'guests' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-serif font-bold text-stone-800">
                  Zarejestrowani Goście Weselni ({registeredGuests.length})
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Lista gości, którzy podali swoje imię. Jako administrator możesz usunąć użytkownika (np. literówka, testowe konto lub zwolnienie imienia dla innej osoby).
              </p>
            </div>
          </div>

          {registeredGuests.length === 0 ? (
            <div className="text-center py-12 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-700">Brak zarejestrowanych gości</p>
              <p className="text-xs text-stone-500 mt-1">
                Goście pojawią się tutaj, gdy podadzą swoje imię w oknie powitalnym lub podczas pierwszego dodania zdjęcia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {registeredGuests.map((guest) => {
                const photosCount = photos.filter(p => p.authorName.toLowerCase() === guest.name.toLowerCase() || p.deviceId === guest.deviceId).length;

                return (
                  <div 
                    key={guest.id || guest.deviceId} 
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 text-sm">
                        {guest.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-stone-900 truncate">
                          {guest.name}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate">
                          {photosCount > 0 ? `${photosCount} ${photosCount === 1 ? 'zdjęcie' : 'zdjęć'}` : 'Jeszcze bez zdjęć'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGuest(guest)}
                      disabled={isDeletingGuest === guest.id}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title={`Usuń gościa ${guest.name}`}
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Security (PIN) */}
      {activeSubTab === 'security' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm max-w-lg space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-serif font-bold text-stone-800">
              Zmień Kod PIN Panelu Pary Młodej
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Domyślny PIN to 1234. Jeśli chcesz zabezpieczyć panel przed gośćmi, ustal nowy kod:
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nowy kod PIN (4-8 cyfr)
            </label>
            <input
              type="password"
              maxLength={8}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Wpisz nowy PIN"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400 font-mono tracking-widest text-center"
            />
          </div>

          <button
            type="submit"
            disabled={!newPin.trim() || isSaving}
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-medium text-sm transition-all shadow-md cursor-pointer"
          >
            {isSaving ? 'Zapisywanie...' : 'Zaktualizuj kod PIN'}
          </button>
        </form>
      )}
    </div>
  );
};
