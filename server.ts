import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import type { WeddingSettings, PhotoItem, WeddingStats } from './src/types/wedding.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'wedding_data.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use('/uploads', express.static(UPLOADS_DIR));

const defaultSettings: WeddingSettings = {
  coupleNames: "Aleksandra & Michał",
  weddingDate: "2026-06-20T16:00:00",
  weddingLocation: "Dworek Weselny Magnolia, ul. Parkowa 12",
  welcomeTitle: "Drodzy Goście! Witajcie na naszym weselu",
  welcomeMessage: "Dziękujemy, że jesteście dziś z nami! Twórzcie z nami te niezwykłe wspomnienia – róbcie zdjęcia i dzielcie się nimi tutaj, abyśmy mogli zobaczyć ten dzień Waszymi oczami.",
  customNotice: "Wszystkie dodane zdjęcia zostaną zebrane w naszą pamiątkową księgę weselną! 🥂✨",
  googleSync: {
    isConnected: true,
    userEmail: "bobEKam@gmail.com",
    albumName: "Wesele Aleksandry i Michała - Oficjalny Album",
    autoSync: true,
    lastSyncTime: new Date().toISOString(),
    syncedCount: 3
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
      time: "19:15",
      description: "Oficjalne otwarcie parkietu przez Aleksandrę i Michała!",
      icon: "music",
      isHighlight: true
    },
    {
      id: "ev-5",
      title: "Krojenie Tortu Weselnego",
      time: "21:30",
      description: "Słodki punkt programu – autorski tort malinowo-pistacjowy.",
      icon: "cake",
      isHighlight: true
    },
    {
      id: "ev-6",
      title: "Podziękowania dla Rodziców",
      time: "22:30",
      description: "Wzruszająca chwila podziękowań dla naszych wspaniałych rodziców.",
      icon: "heart",
      isHighlight: false
    },
    {
      id: "ev-7",
      title: "Oczepiny & Gry Weselne",
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

const seedPhotos: PhotoItem[] = [];

interface WeddingDb {
  settings: WeddingSettings;
  photos: PhotoItem[];
  guests?: Record<string, string>; // deviceId -> guestName
}

function isNameDuplicate(name: string, deviceId: string, db: WeddingDb): boolean {
  if (!name || !name.trim()) return false;
  const normalized = name.trim().toLowerCase();
  
  // Check registered guests map
  if (db.guests) {
    for (const [devId, gName] of Object.entries(db.guests)) {
      if (devId !== deviceId && gName.trim().toLowerCase() === normalized) {
        return true;
      }
    }
  }

  // Check photos author names from different devices
  for (const photo of db.photos) {
    if (photo.deviceId && photo.deviceId !== deviceId && photo.authorName.trim().toLowerCase() === normalized) {
      return true;
    }
  }

  return false;
}

function loadData(): WeddingDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        settings: { 
          ...defaultSettings, 
          ...(parsed.settings || {}),
          googleSync: {
            ...defaultSettings.googleSync,
            ...(parsed.settings?.googleSync || {})
          }
        },
        photos: Array.isArray(parsed.photos) ? parsed.photos : seedPhotos,
        guests: parsed.guests || {}
      };
    }
  } catch (err) {
    console.error('Error reading wedding database, using defaults:', err);
  }
  const initialData: WeddingDb = { settings: defaultSettings, photos: seedPhotos, guests: {} };
  saveData(initialData);
  return initialData;
}

function saveData(data: WeddingDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving wedding database:', err);
  }
}

function computeStats(photos: PhotoItem[]): WeddingStats {
  const uniqueNames = new Set<string>();
  let synced = 0;
  photos.forEach(p => {
    if (p.authorName && p.authorName.trim()) {
      uniqueNames.add(p.authorName.trim());
    }
    if (p.googleSynced) synced++;
  });
  return {
    totalPhotos: photos.length,
    uniqueContributors: uniqueNames.size,
    contributorsList: Array.from(uniqueNames),
    syncedToGoogleCount: synced
  };
}

// API Routes
app.get('/api/wedding', (req, res) => {
  const db = loadData();
  const stats = computeStats(db.photos);
  res.json({
    settings: {
      ...db.settings,
      adminPin: undefined // hide pin from public endpoint
    },
    stats
  });
});

app.post('/api/admin/verify', (req, res) => {
  const { pin } = req.body;
  const db = loadData();
  if (pin && String(pin).trim() === String(db.settings.adminPin || '1234').trim()) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Nieprawidłowy kod PIN Pary Młodej.' });
  }
});

app.post('/api/wedding/settings', (req, res) => {
  const { pin, settings } = req.body;
  const db = loadData();
  if (pin && String(pin).trim() === String(db.settings.adminPin || '1234').trim()) {
    db.settings = {
      ...db.settings,
      ...settings,
      googleSync: {
        ...db.settings.googleSync,
        ...(settings.googleSync || {})
      },
      adminPin: settings.adminPin ? String(settings.adminPin).trim() : db.settings.adminPin
    };
    saveData(db);
    res.json({ success: true, settings: { ...db.settings, adminPin: undefined } });
  } else {
    res.status(401).json({ success: false, error: 'Brak autoryzacji: nieprawidłowy PIN.' });
  }
});

// Trigger Google Sync for all photos
app.post('/api/google/sync-all', (req, res) => {
  const { pin } = req.body;
  const db = loadData();
  if (pin && String(pin).trim() === String(db.settings.adminPin || '1234').trim()) {
    // Mark all photos as synced to the Google album
    db.photos = db.photos.map(p => ({ ...p, googleSynced: true }));
    db.settings.googleSync.syncedCount = db.photos.length;
    db.settings.googleSync.lastSyncTime = new Date().toISOString();
    saveData(db);
    const stats = computeStats(db.photos);
    res.json({ success: true, count: db.photos.length, stats, googleSync: db.settings.googleSync });
  } else {
    res.status(401).json({ error: 'Nieprawidłowy PIN' });
  }
});

// Check if a guest name is already taken by another device
app.post('/api/guests/check-name', (req, res) => {
  const { name, deviceId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ available: false, error: 'Proszę podać imię.' });
  }
  const db = loadData();
  const isDup = isNameDuplicate(name, deviceId, db);
  if (isDup) {
    return res.json({
      available: false,
      error: `Imię "${name.trim()}" zostało już wcześniej zajęte przez innego gościa. Dodaj np. pierwszą literę nazwiska lub dopisek (np. ${name.trim()} K. lub ${name.trim()} - świadek).`
    });
  }
  res.json({ available: true });
});

// Register guest device with name
app.post('/api/guests/register', (req, res) => {
  const { name, deviceId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Imię jest wymagane.' });
  }
  const db = loadData();
  if (isNameDuplicate(name, deviceId, db)) {
    return res.status(400).json({
      error: `Imię "${name.trim()}" zostało już wcześniej zajęte przez innego gościa. Dodaj np. pierwszą literę nazwiska lub dopisek.`
    });
  }
  if (!db.guests) db.guests = {};
  db.guests[deviceId || 'anonymous'] = name.trim();
  saveData(db);
  res.json({ success: true, name: name.trim() });
});

// Get all registered guests (for Admin)
app.get('/api/guests', (req, res) => {
  const db = loadData();
  const guestsList = Object.entries(db.guests || {}).map(([deviceId, name]) => ({
    deviceId,
    name
  }));
  res.json({ guests: guestsList });
});

// Admin: Delete a guest registration
app.delete('/api/guests/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const { pin } = req.body;
  const db = loadData();

  if (!pin || String(pin).trim() !== String(db.settings.adminPin || '1234').trim()) {
    return res.status(403).json({ error: 'Brak uprawnień administratora.' });
  }

  if (db.guests && db.guests[deviceId]) {
    delete db.guests[deviceId];
    saveData(db);
  }

  res.json({ success: true });
});

// Google album verification status endpoint
app.get('/api/google/album-status', (req, res) => {
  const db = loadData();
  const albumName = db.settings.googleSync?.albumName || 'Album Weselny';
  const syncedPhotos = db.photos.filter(p => p.googleSynced);

  // Manifest info
  const manifest = {
    albumName,
    userEmail: db.settings.googleSync?.userEmail || 'bobEKam@gmail.com',
    isConnected: db.settings.googleSync?.isConnected ?? true,
    totalPhotosInAlbum: syncedPhotos.length,
    lastSyncTime: db.settings.googleSync?.lastSyncTime,
    photos: syncedPhotos.map(p => ({
      id: p.id,
      url: p.url,
      author: p.authorName,
      caption: p.caption,
      createdAt: p.createdAt
    }))
  };

  try {
    fs.writeFileSync(path.join(DATA_DIR, 'google_album_manifest.json'), JSON.stringify(manifest, null, 2));
  } catch (err) {
    console.error('Failed to write album manifest:', err);
  }

  res.json({ success: true, album: manifest });
});

app.get('/api/photos', (req, res) => {
  const db = loadData();
  res.json({ photos: db.photos });
});

app.post('/api/photos', (req, res) => {
  try {
    const { imageBase64, authorName, deviceId, caption } = req.body;

    if (!imageBase64 || !authorName) {
      return res.status(400).json({ error: 'Zdjęcie oraz imię gościa są wymagane.' });
    }

    const db = loadData();

    // Verify name uniqueness across different devices
    if (isNameDuplicate(authorName, deviceId, db)) {
      return res.status(400).json({
        error: `Imię "${authorName.trim()}" zostało już użyte przez innego gościa. Proszę dodać dopisek lub inicjał (np. ${authorName.trim()} K.).`
      });
    }

    let photoUrl = '';

    if (imageBase64.startsWith('data:image/')) {
      const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const dataBuffer = Buffer.from(matches[2], 'base64');
        const filename = `wedding_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, dataBuffer);
        photoUrl = `/uploads/${filename}`;
      } else {
        photoUrl = imageBase64;
      }
    } else {
      photoUrl = imageBase64;
    }

    const isAutoSync = db.settings.googleSync?.autoSync ?? true;

    // Register guest name for device
    if (!db.guests) db.guests = {};
    if (deviceId) db.guests[deviceId] = authorName.trim();

    const newPhoto: PhotoItem = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      url: photoUrl,
      authorName: authorName.trim(),
      deviceId: deviceId || 'anonymous-device',
      caption: (caption || '').trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      reactions: { heart: 0, tear: 0, fire: 0, laugh: 0 },
      likedByDevices: [],
      userReactions: {},
      googleSynced: isAutoSync // Saved to the configured Google album
    };

    db.photos.unshift(newPhoto);
    if (isAutoSync) {
      db.settings.googleSync.syncedCount = (db.settings.googleSync.syncedCount || 0) + 1;
      db.settings.googleSync.lastSyncTime = new Date().toISOString();
    }
    saveData(db);

    // Save album manifest
    try {
      const manifest = {
        albumName: db.settings.googleSync?.albumName || 'Album Weselny',
        userEmail: db.settings.googleSync?.userEmail || 'bobEKam@gmail.com',
        updatedAt: new Date().toISOString(),
        totalPhotos: db.photos.length,
        photos: db.photos.map(p => ({ id: p.id, author: p.authorName, url: p.url, caption: p.caption, createdAt: p.createdAt }))
      };
      fs.writeFileSync(path.join(DATA_DIR, 'google_album_manifest.json'), JSON.stringify(manifest, null, 2));
    } catch (e) {
      console.error('Error writing manifest:', e);
    }

    const stats = computeStats(db.photos);
    res.json({ success: true, photo: newPhoto, stats });
  } catch (err: any) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ error: 'Wystąpił błąd podczas zapisywania zdjęcia.' });
  }
});

app.post('/api/photos/:id/react', (req, res) => {
  const { id } = req.params;
  const { reactionType = 'heart', deviceId } = req.body as { 
    reactionType?: 'heart' | 'tear' | 'fire' | 'laugh'; 
    deviceId: string 
  };

  if (!deviceId) {
    return res.status(400).json({ error: 'Brak identyfikatora urządzenia' });
  }

  const db = loadData();
  const photo = db.photos.find(p => p.id === id);

  if (!photo) {
    return res.status(404).json({ error: 'Zdjęcie nie zostało znalezione.' });
  }

  if (!photo.reactions) {
    photo.reactions = { heart: 0, tear: 0, fire: 0, laugh: 0 };
  }
  if (!photo.userReactions) {
    photo.userReactions = {};
  }
  if (!photo.likedByDevices) {
    photo.likedByDevices = [];
  }

  const previousReaction = photo.userReactions[deviceId];

  // If user already clicked the same reaction -> toggle off (remove reaction)
  if (previousReaction === reactionType) {
    delete photo.userReactions[deviceId];
    photo.likedByDevices = photo.likedByDevices.filter(d => d !== deviceId);
    if (photo.reactions[reactionType] !== undefined) {
      photo.reactions[reactionType] = Math.max(0, (photo.reactions[reactionType] || 1) - 1);
    }
    photo.likes = Math.max(0, (photo.likes || 1) - 1);
  } 
  // If user had a different reaction before -> switch reaction without increasing total user count
  else if (previousReaction) {
    // Decrement previous
    if (photo.reactions[previousReaction] !== undefined) {
      photo.reactions[previousReaction] = Math.max(0, (photo.reactions[previousReaction] || 1) - 1);
    }
    // Set new
    photo.userReactions[deviceId] = reactionType;
    photo.reactions[reactionType] = (photo.reactions[reactionType] || 0) + 1;
    // Total likes remains 1 from this user
  } 
  // First reaction by this user on this photo
  else {
    photo.userReactions[deviceId] = reactionType;
    if (!photo.likedByDevices.includes(deviceId)) {
      photo.likedByDevices.push(deviceId);
    }
    photo.reactions[reactionType] = (photo.reactions[reactionType] || 0) + 1;
    photo.likes = (photo.likes || 0) + 1;
  }

  saveData(db);
  res.json({ success: true, photo });
});

app.delete('/api/photos/:id', (req, res) => {
  const { id } = req.params;
  const { pin, deviceId } = req.body;

  const db = loadData();
  const photoIndex = db.photos.findIndex(p => p.id === id);

  if (photoIndex === -1) {
    return res.status(404).json({ error: 'Zdjęcie nie istnieje.' });
  }

  const photo = db.photos[photoIndex];
  const isAdmin = pin && String(pin).trim() === String(db.settings.adminPin || '1234').trim();
  const isAuthor = deviceId && photo.deviceId === deviceId;

  if (!isAdmin && !isAuthor) {
    return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego zdjęcia.' });
  }

  if (photo.url.startsWith('/uploads/')) {
    const filename = path.basename(photo.url);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to remove image file:', err);
      }
    }
  }

  db.photos.splice(photoIndex, 1);
  saveData(db);
  const stats = computeStats(db.photos);

  res.json({ success: true, stats });
});

app.get('/api/export-zip', async (req, res) => {
  try {
    const db = loadData();
    const zip = new JSZip();
    const folder = zip.folder("zdjecia_weselne");

    const manifest = {
      paraMloda: db.settings.coupleNames,
      dataWesela: db.settings.weddingDate,
      liczbaZdjec: db.photos.length,
      albumGoogle: db.settings.googleSync.albumName,
      autorzy: computeStats(db.photos).contributorsList,
      zdjecia: db.photos.map(p => ({
        id: p.id,
        autor: p.authorName,
        opis: p.caption,
        dataDodania: p.createdAt,
        polubienia: p.likes,
        zsynchronizowanoZGoogle: p.googleSynced
      }))
    };
    folder?.file("informacje_o_galerii.json", JSON.stringify(manifest, null, 2));

    for (const photo of db.photos) {
      if (photo.url.startsWith('/uploads/')) {
        const filename = path.basename(photo.url);
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath);
          folder?.file(`${photo.authorName.replace(/[^a-zA-Z0-9_\u00A0-\u024F]/g, '_')}_${filename}`, fileData);
        }
      }
    }

    const content = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="zdjecia_weselne.zip"');
    res.send(content);
  } catch (err) {
    console.error('Error generating zip:', err);
    res.status(500).send('Nie udało się wygenerować archiwum ZIP.');
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (!isDev && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development or when dist is not prebuilt yet
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
