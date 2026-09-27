import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PhotoItem, WeddingSettings, WeddingStats } from '../types/wedding';

const PHOTOS_COLLECTION = 'photos';
const GUESTS_COLLECTION = 'guests';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'general_settings';

/**
 * Real-time listener for photos from Firestore
 */
export function subscribePhotos(
  callback: (photos: PhotoItem[], stats: WeddingStats) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, PHOTOS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const photos: PhotoItem[] = [];
      const authors = new Set<string>();
      let syncedCount = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<PhotoItem, 'id'>;
        photos.push({
          id: docSnap.id,
          ...data,
          reactions: data.reactions || { heart: 0, tear: 0, fire: 0, laugh: 0 },
          userReactions: data.userReactions || {},
          likedByDevices: data.likedByDevices || [],
          likes: typeof data.likes === 'number' ? data.likes : 0
        });

        if (data.authorName && data.authorName.trim()) {
          authors.add(data.authorName.trim());
        }
        if (data.googleSynced) {
          syncedCount++;
        }
      });

      const stats: WeddingStats = {
        totalPhotos: photos.length,
        uniqueContributors: authors.size,
        contributorsList: Array.from(authors),
        syncedToGoogleCount: syncedCount
      };

      callback(photos, stats);
    },
    (err) => {
      console.warn('Firestore real-time subscription error (falling back to API):', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Check if guest name is duplicate in Firestore
 */
export async function isGuestNameTakenInFirestore(name: string, deviceId: string): Promise<boolean> {
  try {
    const normalized = name.trim().toLowerCase();
    const guestsSnapshot = await getDocs(collection(db, GUESTS_COLLECTION));
    let taken = false;

    guestsSnapshot.forEach((docSnap) => {
      const g = docSnap.data() as { name?: string; deviceId?: string };
      if (g.deviceId !== deviceId && g.name && g.name.trim().toLowerCase() === normalized) {
        taken = true;
      }
    });

    return taken;
  } catch (err) {
    console.warn('Could not check guest name in Firestore:', err);
    return false;
  }
}

/**
 * Register guest name in Firestore
 */
export async function registerGuestInFirestore(deviceId: string, name: string) {
  try {
    const ref = doc(db, GUESTS_COLLECTION, deviceId);
    await setDoc(ref, {
      deviceId,
      name: name.trim(),
      registeredAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save guest to Firestore:', err);
  }
}

/**
 * Save new photo directly to Firestore
 */
export async function addPhotoToFirestore(photo: PhotoItem) {
  try {
    const photoRef = doc(db, PHOTOS_COLLECTION, photo.id);
    await setDoc(photoRef, {
      url: photo.url,
      authorName: photo.authorName,
      deviceId: photo.deviceId,
      caption: photo.caption || '',
      createdAt: photo.createdAt,
      likes: photo.likes || 0,
      reactions: photo.reactions || { heart: 0, tear: 0, fire: 0, laugh: 0 },
      userReactions: photo.userReactions || {},
      likedByDevices: photo.likedByDevices || [],
      googleSynced: Boolean(photo.googleSynced)
    });
  } catch (err) {
    console.warn('Failed to save photo to Firestore:', err);
  }
}

/**
 * Toggle like / reaction in Firestore with strictly 1 reaction per user
 */
export async function reactToPhotoInFirestore(
  photoId: string, 
  reactionType: 'heart' | 'tear' | 'fire' | 'laugh',
  deviceId: string,
  previousReaction?: 'heart' | 'tear' | 'fire' | 'laugh'
) {
  try {
    const photoRef = doc(db, PHOTOS_COLLECTION, photoId);
    
    // Toggle off (remove reaction)
    if (previousReaction === reactionType) {
      await updateDoc(photoRef, {
        likes: increment(-1),
        [`reactions.${reactionType}`]: increment(-1),
        [`userReactions.${deviceId}`]: deleteField(),
        likedByDevices: arrayRemove(deviceId)
      });
    } 
    // Switch reaction (count remains 1 from this user)
    else if (previousReaction) {
      await updateDoc(photoRef, {
        [`reactions.${previousReaction}`]: increment(-1),
        [`reactions.${reactionType}`]: increment(1),
        [`userReactions.${deviceId}`]: reactionType
      });
    } 
    // New reaction
    else {
      await updateDoc(photoRef, {
        likes: increment(1),
        [`reactions.${reactionType}`]: increment(1),
        [`userReactions.${deviceId}`]: reactionType,
        likedByDevices: arrayUnion(deviceId)
      });
    }
  } catch (err) {
    console.warn('Failed to update reaction in Firestore:', err);
  }
}

/**
 * Delete photo from Firestore
 */
export async function deletePhotoFromFirestore(photoId: string) {
  try {
    await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId));
  } catch (err) {
    console.warn('Failed to delete photo from Firestore:', err);
  }
}

/**
 * Real-time listener for registered guests
 */
export function subscribeGuests(callback: (guests: { id: string; name: string; deviceId: string; registeredAt?: string }[]) => void) {
  return onSnapshot(
    collection(db, GUESTS_COLLECTION),
    (snapshot) => {
      const list: { id: string; name: string; deviceId: string; registeredAt?: string }[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as { name: string; deviceId: string; registeredAt?: string };
        list.push({
          id: docSnap.id,
          name: data.name || '',
          deviceId: data.deviceId || docSnap.id,
          registeredAt: data.registeredAt
        });
      });
      callback(list);
    },
    (err) => console.warn('Guest subscription notice:', err)
  );
}

/**
 * Admin: Delete guest by docId / deviceId from Firestore
 */
export async function deleteGuestFromFirestore(guestId: string) {
  try {
    await deleteDoc(doc(db, GUESTS_COLLECTION, guestId));
  } catch (err) {
    console.warn('Failed to delete guest from Firestore:', err);
  }
}

/**
 * Save / Update admin PIN and global settings in Firestore so it's remembered across all devices
 */
export async function saveGlobalSettingsToFirestore(newSettings: Partial<WeddingSettings>) {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(settingsRef, newSettings, { merge: true });
  } catch (err) {
    console.warn('Failed to save settings to Firestore:', err);
  }
}

/**
 * Listen to global settings in Firestore
 */
export function subscribeSettings(callback: (settings: Partial<WeddingSettings>) => void) {
  return onSnapshot(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Partial<WeddingSettings>);
      }
    },
    (err) => console.warn('Settings subscription notice:', err)
  );
}
