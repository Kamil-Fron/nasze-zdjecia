import { GuestProfile } from '../types/wedding';

const STORAGE_KEY = 'wedding_guest_profile';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem('wedding_device_id');
  if (!deviceId) {
    deviceId = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('wedding_device_id', deviceId);
  }
  return deviceId;
}

export function getGuestProfile(): GuestProfile {
  const deviceId = getDeviceId();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || '',
        deviceId,
        isRegistered: Boolean(parsed.name && parsed.name.trim().length > 0)
      };
    }
  } catch (e) {
    console.error('Failed to parse guest profile:', e);
  }

  return {
    name: '',
    deviceId,
    isRegistered: false
  };
}

export function saveGuestProfile(name: string): GuestProfile {
  const deviceId = getDeviceId();
  const profile: GuestProfile = {
    name: name.trim(),
    deviceId,
    isRegistered: name.trim().length > 0
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}
