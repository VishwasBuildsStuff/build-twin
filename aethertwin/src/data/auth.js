const ACCOUNTS_KEY = 'buildtwin.accounts.v1';
const SESSION_KEY = 'buildtwin.session.v1';

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(atob(salt), (char) => char.charCodeAt(0)), iterations: 120_000, hash: 'SHA-256' },
    key,
    256
  );
  return toBase64(bits);
}

export async function signUp({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error('An account with this email already exists in this browser.');
  }
  if (!crypto?.subtle) throw new Error('Secure browser storage is unavailable. Open the site on localhost or HTTPS.');

  const salt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
  const account = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    salt,
    passwordHash: await hashPassword(password, salt),
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  localStorage.setItem(SESSION_KEY, account.id);
  return { id: account.id, name: account.name, email: account.email };
}

export async function signIn({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find((item) => item.email === normalizedEmail);
  if (!account || !crypto?.subtle || (await hashPassword(password, account.salt)) !== account.passwordHash) {
    throw new Error('Email or password is incorrect.');
  }
  localStorage.setItem(SESSION_KEY, account.id);
  return { id: account.id, name: account.name, email: account.email };
}

export function getSignedInUser() {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    const account = readAccounts().find((item) => item.id === id);
    return account ? { id: account.id, name: account.name, email: account.email } : null;
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUserData(userId) {
  try {
    return JSON.parse(localStorage.getItem(`buildtwin.data.${userId}`) || '{}');
  } catch {
    return {};
  }
}

export function saveUserData(userId, data) {
  localStorage.setItem(`buildtwin.data.${userId}`, JSON.stringify(data));
}
