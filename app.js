// ============================================================
// Secret Notes — Clean Production Version
// Features:
//   • Screen-share detection & content hiding
//   • Local storage persistence
//   • XSS-safe rendering (textContent / DOMPurify-ready)
//   • Debounced search
//   • Auto-save with dirty tracking
//   • Accessible keyboard interactions
// ============================================================

'use strict';


const STORAGE_KEY   = 'secret_notes_v1';
const AUTOSAVE_MS   = 5000;   // Auto-save interval
const DEBOUNCE_MS   = 250;    // Search debounce delay

// ── State ────────────────────────────────────────────────────

/** @type {Note[]} */
let notes = [];

/** @type {string|null} */
let currentNoteId = null;

/** @type {boolean} */
let isDirty = false;

/** @type {number|null} */
let autoSaveTimer = null;

// ── Types (JSDoc) ────────────────────────────────────────────

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content  — plain text, never raw HTML
 * @property {string} createdAt — ISO string
 * @property {string} updatedAt — ISO string
 */

// ============================================================
// SCREEN-SHARE DETECTION
// Strategy: Intercept navigator.mediaDevices.getDisplayMedia.
// When any tab/app calls getDisplayMedia (as Zoom does when
// you start a screen share), we immediately hide the app by
// toggling a CSS class on <body>. When the stream ends we
// restore visibility.
// ============================================================

<<<<<<< HEAD
async function checkScreenShare() {
  try {
    // We detect screen sharing by checking if any video track
    // from getDisplayMedia is active in the document
    // This hooks into the Page Visibility + Screen Capture API
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    console.log("All devices:", devices);

    // Check for active screen capture tracks in RTCPeerConnections
    if (typeof window.RTCPeerConnection === 'undefined') {
      console.warn("WebRTC not supported");
    }
  } catch(e) {
=======
function initScreenShareProtection() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    console.warn('[SecretNotes] getDisplayMedia not supported — screen-share protection unavailable.');
    return;
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)
  }

<<<<<<< HEAD
// Presenter mode for explicit screen sharing control
function enablePresenterMode() {
  isScreenSharing = true;
  updateScreenShareUI(true);
}

function disablePresenterMode() {
  isScreenSharing = false;
  updateScreenShareUI(false);
}
=======
  const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(
    navigator.mediaDevices
  );

  /**
   * Patched getDisplayMedia — hides the app for the lifetime
   * of the screen-capture stream.
   */
  navigator.mediaDevices.getDisplayMedia = async function (constraints) {
    setScreenShareActive(true);

    let stream;
    try {
      stream = await originalGetDisplayMedia(constraints);
    } catch (err) {
      // User cancelled or permission denied — restore app immediately
      setScreenShareActive(false);
      throw err;
    }
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)

    // Restore app visibility when all video tracks end
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      setScreenShareActive(false);
    } else {
      let endedCount = 0;
      videoTracks.forEach(track => {
        track.addEventListener('ended', () => {
          endedCount++;
          if (endedCount >= videoTracks.length) {
            setScreenShareActive(false);
          }
        });
      });
    }

    return stream;
  };
}

/**
 * Toggle screen-share protection UI.
 * @param {boolean} active
 */
function setScreenShareActive(active) {
  document.body.classList.toggle('screen-share-active', active);
}

// ============================================================
// STORAGE
// ============================================================

/**
 * Load notes from localStorage.
 * Returns an empty array if nothing is stored or data is corrupt.
 * @returns {Note[]}
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[SecretNotes] Could not parse stored notes — starting fresh.');
    return [];
  }
}

/**
 * Persist notes array to localStorage.
 */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    // e.g. storage quota exceeded
    console.error('[SecretNotes] Failed to save notes:', err);
  }
}

// ============================================================
<<<<<<< HEAD
// Storage — with intentional issues
// ============================================================


function loadNotes() {
  const stored = localStorage.getItem('secret_notes');
  if (stored === null) {
    notes = [];
  } else {
    try {
      notes = JSON.parse(stored);
    } catch (e) {
      notes = [];
    }
  }
  renderNotesList();
}

function saveNotesToStorage() {
  localStorage.setItem('secret_notes', JSON.stringify(notes));
}

// ============================================================
// Note Operations
=======
// ID GENERATION
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)
// ============================================================

/**
 * Generate a collision-resistant ID using crypto.randomUUID
 * with a fallback for older environments.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: hex from random bytes
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// SANITIZATION
// Using textContent for output prevents XSS.
// If rich-text (HTML) is ever needed, integrate DOMPurify here.
// ============================================================

/**
 * Safely set text content on an element.
 * @param {HTMLElement} el
 * @param {string} text
 */
function setTextSafe(el, text) {
  el.textContent = text;
}

/**
 * Safely get plain text from a contenteditable element.
 * @param {HTMLElement} el
 * @returns {string}
 */
function getTextSafe(el) {
  return el.innerText || el.textContent || '';
}

// ============================================================
// NOTE OPERATIONS
// ============================================================

/**
 * Create a new blank note, persist it, and open it.
 */
function createNewNote() {
  const now = new Date().toISOString();
  /** @type {Note} */
  const note = {
<<<<<<< HEAD
    id: generateId(),
    title: 'Untitled Note',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
=======
    id:        generateId(),
    title:     'Untitled Note',
    content:   '',
    createdAt: now,
    updatedAt: now,
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)
  };

  notes = [note, ...notes];
  saveToStorage();
  renderNotesList();
  selectNote(note.id);
}

<<<<<<< HEAD
function selectNote(id) {
  currentNoteId = id;
  const note = notes.find(n => n.id == id);

  if (note) {
    document.getElementById('editorPlaceholder').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');
    document.getElementById('noteTitle').value = note.title;

    document.getElementById('noteContent').textContent = note.content;

    document.getElementById('lastSaved').textContent =
      'Last saved: ' + formatDate(note.updatedAt);
=======
/**
 * Open a note in the editor.
 * @param {string} id
 */
function openNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)

  // Prompt save if there's unsaved work on the current note
  if (isDirty && currentNoteId && currentNoteId !== id) {
    const ok = window.confirm('You have unsaved changes. Save before switching?');
    if (ok) saveCurrentNote();
  }

  currentNoteId = id;
  isDirty       = false;

  const placeholder = document.getElementById('editorPlaceholder');
  const editor      = document.getElementById('editor');
  const titleEl     = document.getElementById('noteTitle');
  const contentEl   = document.getElementById('noteContent');

  placeholder.classList.add('hidden');
  editor.classList.remove('hidden');

  titleEl.value = note.title;

  // Set plain text safely — no innerHTML
  contentEl.textContent = note.content;

  updateLastSaved(note.updatedAt);
  setUnsavedIndicator(false);
  updateActiveCard(id);
}

/**
 * Save the currently open note.
 * @returns {boolean} whether save succeeded
 */
function saveCurrentNote() {
<<<<<<< HEAD
  if (!currentNoteId) return;

  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return;

  note.title = document.getElementById('noteTitle').value;
  note.content = document.getElementById('noteContent').textContent;
  note.updatedAt = new Date().toISOString();

  saveNotesToStorage();
  renderNotesList();

  document.getElementById('lastSaved').textContent =
    'Last saved: ' + formatDate(note.updatedAt);
=======
  if (!currentNoteId) return false;

  const note = notes.find(n => n.id === currentNoteId);
  if (!note) return false;

  const titleEl   = document.getElementById('noteTitle');
  const contentEl = document.getElementById('noteContent');

  note.title     = titleEl.value.trim() || 'Untitled Note';
  note.content   = getTextSafe(contentEl);
  note.updatedAt = new Date().toISOString();

  // Keep title input in sync if trimmed
  titleEl.value = note.title;
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)

  saveToStorage();
  renderNotesList();
  updateLastSaved(note.updatedAt);
  setUnsavedIndicator(false);
  isDirty = false;
  updateActiveCard(currentNoteId);

  return true;
}

/**
 * Delete the currently open note after confirmation.
 */
function deleteCurrentNote() {
  if (!currentNoteId) return;

  const note = notes.find(n => n.id === currentNoteId);
  const name = note ? `"${note.title}"` : 'this note';

  if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

  notes = notes.filter(n => n.id !== currentNoteId);
  currentNoteId = null;
  isDirty       = false;

  saveToStorage();
  renderNotesList();
  resetEditor();
}

// ============================================================
// RENDERING
// ============================================================

/**
 * Render the sidebar list of notes.
 */
function renderNotesList() {
  const container = document.getElementById('notesList');
  const sortBy    = document.getElementById('sortSelect').value;
  const query     = document.getElementById('searchInput').value.trim().toLowerCase();

<<<<<<< HEAD
  let filtered = notes.filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.content.toLowerCase().includes(query)
  );

  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
=======
  // Filter on plain-text fields only
  let filtered = notes.filter(note => {
    const inTitle   = note.title.toLowerCase().includes(query);
    const inContent = note.content.toLowerCase().includes(query);
    return inTitle || inContent;
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)
  });

  // Sort on a copy — do not mutate the original order implicitly
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Clear container
  container.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    setTextSafe(empty, query ? '🔍 No notes match your search.' : '📭 No notes yet. Create one!');
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(note => {
    const card      = document.createElement('div');
    card.className  = 'note-card' + (note.id === currentNoteId ? ' active' : '');
    card.dataset.id = note.id;
    card.tabIndex   = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open note: ${note.title}`);

<<<<<<< HEAD
    const titleEl = document.createElement('h3');
    titleEl.textContent = note.title;

    const contentEl = document.createElement('p');
    contentEl.textContent = note.content ? note.content.substring(0, 60) : '';

    const dateEl = document.createElement('div');
    dateEl.className = 'note-date';
    dateEl.textContent = formatDate(note.updatedAt);

    card.appendChild(titleEl);
    card.appendChild(contentEl);
    card.appendChild(dateEl);
=======
    const titleEl   = document.createElement('h3');
    const previewEl = document.createElement('p');
    const dateEl    = document.createElement('div');
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)

    dateEl.className = 'note-date';

    setTextSafe(titleEl,   note.title);
    setTextSafe(previewEl, note.content.substring(0, 80));
    setTextSafe(dateEl,    formatDate(note.updatedAt));

    card.appendChild(titleEl);
    card.appendChild(previewEl);
    card.appendChild(dateEl);

    card.addEventListener('click',  () => openNote(note.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openNote(note.id);
      }
    });

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

/**
 * Reset the editor to the placeholder state.
 */
function resetEditor() {
  document.getElementById('editor').classList.add('hidden');
  document.getElementById('editorPlaceholder').classList.remove('hidden');
  document.getElementById('noteTitle').value   = '';
  document.getElementById('noteContent').textContent = '';
  document.getElementById('lastSaved').textContent   = '';
  setUnsavedIndicator(false);
}

/**
 * Highlight the active note card.
 * @param {string} id
 */
function updateActiveCard(id) {
  document.querySelectorAll('.note-card').forEach(card => {
    card.classList.toggle('active', card.dataset.id === id);
  });
}

// ============================================================
// UI HELPERS
// ============================================================

/**
 * @param {string} isoString
 */
function updateLastSaved(isoString) {
  const el   = document.getElementById('lastSaved');
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    el.textContent = '';
    return;
  }
  el.textContent = `Last saved: ${formatDate(isoString)}`;
}

/**
 * @param {boolean} dirty
 */
function setUnsavedIndicator(dirty) {
  const el = document.getElementById('unsavedIndicator');
  el.classList.toggle('hidden', !dirty);
}

/**
 * Format an ISO date string for display.
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  }) + ' ' + date.toLocaleTimeString(undefined, {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// ============================================================
// AUTO-SAVE
// ============================================================

<<<<<<< HEAD
setInterval(() => {
  if (currentNoteId) {
    saveCurrentNote();
  }
}, 3000);
=======
function startAutoSave() {
  if (autoSaveTimer !== null) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(() => {
    if (isDirty && currentNoteId) {
      saveCurrentNote();
    }
  }, AUTOSAVE_MS);
}
>>>>>>> 45542bf (Errors brought up  in the previous push are solved here)

// ============================================================
// DEBOUNCE UTILITY
// ============================================================

/**
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================================
// DIRTY TRACKING
// ============================================================

function markDirty() {
  if (!currentNoteId) return;
  isDirty = true;
  setUnsavedIndicator(true);
}

// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // 1. Load persisted notes
  notes = loadFromStorage();

  // 2. Render sidebar
  renderNotesList();

  // 3. Init screen-share protection
  initScreenShareProtection();

  // 4. Start auto-save loop
  startAutoSave();

  // 5. Wire up controls
  document.getElementById('newNoteBtn')
    .addEventListener('click', createNewNote);

  document.getElementById('saveNoteBtn')
    .addEventListener('click', saveCurrentNote);

  document.getElementById('deleteNoteBtn')
    .addEventListener('click', deleteCurrentNote);

  // Search — debounced
  document.getElementById('searchInput')
    .addEventListener('input', debounce(renderNotesList, DEBOUNCE_MS));

  // Sort
  document.getElementById('sortSelect')
    .addEventListener('change', renderNotesList);

  // Dirty tracking for title and content
  document.getElementById('noteTitle')
    .addEventListener('input', markDirty);

  document.getElementById('noteContent')
    .addEventListener('input', markDirty);

  // Keyboard shortcut: Ctrl/Cmd + S to save
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCurrentNote();
    }
  });

  // Warn before closing tab with unsaved changes
  window.addEventListener('beforeunload', e => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Set placeholder text via data attribute (CSS ::before trick)
  document.getElementById('noteContent')
    .setAttribute('data-placeholder', 'Start writing your note...');
});