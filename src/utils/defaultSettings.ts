import type { WeddingSettings } from '../types/wedding';

export const fallbackWeddingSettings: WeddingSettings = {
  coupleNames: "Aleksandra & Michał",
  weddingDate: "2026-06-20T16:00:00",
  weddingLocation: "Dworek Weselny Magnolia, ul. Parkowa 12",
  welcomeTitle: "Drodzy Goście! Witajcie na naszym weselu",
  welcomeMessage: "Dziękujemy, że jesteście dziś z nami! Twórzcie z nami te niezwykłe wspomnienia – róbcie zdjęcia i dzielcie się nimi tutaj, abyśmy mogli zobaczyć ten dzień Waszymi oczami.",
  customNotice: "",
  googleSync: {
    isConnected: true,
    userEmail: "bobEKam@gmail.com",
    albumName: "Wesele Aleksandry i Michała - Oficjalny Album",
    autoSync: true,
    lastSyncTime: new Date().toISOString(),
    syncedCount: 0
  },
  adminPin: "1234",
  allowGuestComments: true,
  allowLikes: true,
  timeline: [
    {
      id: "ev-1",
      title: "Ceremonia Zaślubin",
      time: "16:00",
      description: "Uroczysta przysięga małżeńska w Kościele św. Anny.",
      icon: "church",
      isHighlight: true
    },
    {
      id: "ev-2",
      title: "Przyjazd do Dworku & Toast",
      time: "17:30",
      description: "Powitanie Nowożeńców chlebem i solą oraz uroczysty toast szampanem.",
      icon: "glass",
      isHighlight: false
    },
    {
      id: "ev-3",
      title: "Obiad Weselny",
      time: "18:00",
      description: "Poczęstunek dla wszystkich gości i chwila rozmów.",
      icon: "utensils",
      isHighlight: false
    },
    {
      id: "ev-4",
      title: "Pierwszy Taniec",
      time: "19:30",
      description: "Rozpoczęcie tanecznej zabawy przez Parę Młodą.",
      icon: "music",
      isHighlight: true
    },
    {
      id: "ev-5",
      title: "Tort Weselny",
      time: "21:30",
      description: "Wspólne krojenie wyśmienitego tortu i kawa.",
      icon: "cake",
      isHighlight: true
    },
    {
      id: "ev-6",
      title: "Sesja Zdjęciowa z Parą Młodą",
      time: "22:15",
      description: "Pamiątkowe zdjęcia w plenerze i na ściance kwiatowej.",
      icon: "camera",
      isHighlight: false
    },
    {
      id: "ev-7",
      title: "Oczepiny",
      time: "00:00",
      description: "Rzut bukietem, rzut muszką i tradycyjne zabawy weselne z wodzirejem!",
      icon: "sparkles",
      isHighlight: true
    },
    {
      id: "ev-8",
      title: "Zimne Ognie na Tarasie",
      time: "00:45",
      description: "Wspólne pamiątkowe zdjęcia z iskierkami w blasku nocy.",
      icon: "sparkles",
      isHighlight: true
    },
    {
      id: "ev-9",
      title: "Gorący Barszczyk Nocny",
      time: "02:00",
      description: "Krzepiący posiłek na regenerację sił do tańca do białego rana.",
      icon: "utensils",
      isHighlight: false
    }
  ]
};
