import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Camera, 
  Utensils, 
  Music, 
  PartyPopper,
  Wine,
  Flame,
  ChevronRight
} from 'lucide-react';
import { TimelineEvent, WeddingSettings } from '../types/wedding';

interface WeddingTimelineProps {
  timeline: TimelineEvent[];
  weddingDate: string;
  onSelectEventForUpload: (eventTitle: string) => void;
}

export const WeddingTimeline: React.FC<WeddingTimelineProps> = ({
  timeline,
  weddingDate,
  onSelectEventForUpload
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown & status for a specific event
  const getEventStatus = (event: TimelineEvent) => {
    try {
      // Parse event time (assuming format "HH:mm" on the wedding day)
      const baseDate = new Date(weddingDate);
      const [hours, minutes] = event.time.split(':').map(Number);
      
      const targetDate = new Date(baseDate);
      if (!isNaN(hours) && !isNaN(minutes)) {
        targetDate.setHours(hours, minutes, 0, 0);
        // If event is early morning (e.g. 01:00 or 02:00), it's the next day of the wedding
        if (hours < 6) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
      }

      const diffMs = targetDate.getTime() - currentTime.getTime();

      if (diffMs < -3600000) {
        // More than 1 hour ago
        return {
          status: 'finished' as const,
          label: 'Zakończone',
          countdownText: 'Zakończone',
          targetDate
        };
      } else if (diffMs <= 0 && diffMs >= -3600000) {
        // Currently happening (within 60 mins)
        return {
          status: 'ongoing' as const,
          label: 'Właśnie trwa!',
          countdownText: 'Trwa teraz 🎉',
          targetDate
        };
      } else {
        // Upcoming: format exact countdown
        const totalSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hrs = Math.floor((totalSeconds % 86400) / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        let countdownText = '';
        if (days > 0) {
          countdownText = `${days} dni, ${hrs}h ${mins}m`;
        } else if (hrs > 0) {
          countdownText = `${hrs}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
        } else {
          countdownText = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
        }

        return {
          status: 'upcoming' as const,
          label: days > 0 ? `Za ${days} dni` : hrs > 0 ? `Za ${hrs}h ${mins}m` : `Już za ${mins} minut!`,
          countdownText,
          targetDate,
          isImminent: diffMs < 1800000 // less than 30 mins
        };
      }
    } catch {
      return {
        status: 'upcoming' as const,
        label: event.time,
        countdownText: event.time,
        targetDate: new Date()
      };
    }
  };

  // Find next upcoming milestone
  const nextEvent = React.useMemo(() => {
    for (const ev of timeline) {
      const info = getEventStatus(ev);
      if (info.status === 'upcoming' || info.status === 'ongoing') {
        return { event: ev, info };
      }
    }
    return null;
  }, [timeline, currentTime, weddingDate]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'church':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'glass':
        return <Wine className="w-5 h-5 text-amber-500" />;
      case 'music':
        return <Music className="w-5 h-5 text-indigo-500" />;
      case 'cake':
        return <PartyPopper className="w-5 h-5 text-pink-500" />;
      case 'utensils':
        return <Utensils className="w-5 h-5 text-emerald-500" />;
      case 'sparkles':
        return <Flame className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-stone-500" />;
    }
  };

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto space-y-6">
      {/* Featured Next Milestone Countdown Card */}
      {nextEvent && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 via-stone-900 to-rose-950 text-white p-6 sm:p-8 shadow-xl border border-rose-950/40">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 rounded-full bg-rose-500/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{nextEvent.info.status === 'ongoing' ? 'Teraz trwa na weselu!' : 'Najbliższy punkt programu'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                {nextEvent.event.title}
              </h2>
              <p className="text-stone-300 text-sm max-w-lg">
                {nextEvent.event.description}
              </p>
            </div>

            {/* Countdown Clock Digit Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[200px] shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-rose-200 font-semibold block mb-1">
                {nextEvent.info.status === 'ongoing' ? 'Status' : 'Odliczanie do punktu'}
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white py-1">
                {nextEvent.info.countdownText}
              </div>
              <span className="text-xs text-stone-300">
                Planowana godzina: <strong className="text-rose-200">{nextEvent.event.time}</strong>
              </span>

              <button
                onClick={() => onSelectEventForUpload(nextEvent.event.title)}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Uwiecznij ten moment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intro info bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-stone-900">
            Harmonogram & Informator Fotograficzny
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            Śledź przebieg wesela i miej telefon pod ręką w kluczowych momentach!
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Wszystkie ujęcia trafiają do wspólnej galerii</span>
        </div>
      </div>

      {/* Detailed Timeline List */}
      <div className="relative border-l-2 border-stone-200 ml-4 sm:ml-6 space-y-6 pb-4">
        {timeline.map((event) => {
          const { status, label, countdownText, isImminent } = getEventStatus(event);

          return (
            <div key={event.id} className="relative pl-6 sm:pl-8 group">
              {/* Timeline marker node */}
              <div className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                status === 'ongoing'
                  ? 'bg-rose-600 border-white text-white shadow-lg ring-4 ring-rose-200 animate-pulse'
                  : status === 'finished'
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                  : event.isHighlight
                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                  : 'bg-white border-stone-300 text-stone-600'
              }`}>
                {status === 'finished' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  renderIcon(event.icon)
                )}
              </div>

              {/* Event Card Content */}
              <div className={`rounded-2xl p-5 border transition-all ${
                status === 'ongoing'
                  ? 'bg-rose-50/60 border-rose-300 shadow-sm'
                  : isImminent
                  ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                  : 'bg-white border-stone-200/90 shadow-2xs hover:shadow-xs'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-mono font-bold text-stone-800">
                      {event.time}
                    </span>
                    <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                      {event.title}
                    </h4>
                  </div>

                  {/* Status badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    status === 'ongoing'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : status === 'finished'
                      ? 'bg-emerald-100 text-emerald-800'
                      : isImminent
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {status === 'upcoming' ? countdownText : label}
                  </span>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {event.description}
                </p>

                {/* Photo guidance action */}
                <div className="mt-3 pt-3 border-t border-stone-100/90 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-500 italic">
                    📸 Uwiecznij tę chwilę z bliska
                  </span>

                  <button
                    onClick={() => onSelectEventForUpload(event.title)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                    <span>Dodaj zdjęcie z tego punktu</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
