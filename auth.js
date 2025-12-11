const STORAGE_KEY = 'mockUser';
const OTP_STORAGE_KEY = 'mockOtpStore';

export const DEMO_USER = {
  email: 'demo@foodshare.com',
  full_name: 'Demo User',
};

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function readOtpStore() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OTP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeOtpStore(store) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(store));
}

export function issueEmailOtp(email, full_name) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const record = { email, full_name, code, expiresAt: Date.now() + 10 * 60 * 1000 };
  const store = readOtpStore();
  store[email] = record;
  writeOtpStore(store);
  return code;
}

export function verifyEmailOtp(email, code) {
  const store = readOtpStore();
  const record = store[email];
  if (!record) throw new Error('No OTP requested for this email.');
  if (Date.now() > record.expiresAt) {
    delete store[email];
    writeOtpStore(store);
    throw new Error('OTP expired. Please request a new code.');
  }
  if (record.code !== code) throw new Error('Invalid code.');

  const user = { email, full_name: record.full_name || 'SharePlate User' };
  delete store[email];
  writeOtpStore(store);
  setStoredUser(user);
  return user;
}
