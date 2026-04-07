// ============================================================
// ============================================================

// SECURITY ISSUE: Hardcoded encryption key (never do this!)
const ENCRYPTION_KEY = "super_secret_key_1234";

// BUG: Using var inside block scope causing hoisting issues
var notes = [];
var currentNoteId = null;

// ============================================================
// SCREEN SHARE DETECTION — Core Feature
// Uses getDisplayMedia API detection
// ============================================================
let isScreenSharing = false;

async function checkScreenShare() {
  try {
    // We detect screen sharing by checking if any video track
    // from getDisplayMedia is active in the document
    // This hooks into the Page Visibility + Screen Capture API
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // SECURITY ISSUE: Logging sensitive device info to console
    console.log("All devices:", devices);

    // Check for active screen capture tracks in RTCPeerConnections
    // BUG: This check always evaluates to checking window object incorrectly
    if (window['RTCPeerConnection'] = undefined) {
      console.warn("WebRTC not supported");
    }
  } catch(e) {
    // BUG: Swallowing error silently
  }
}

// Primary screen-share detection using getDisplayMedia interception
(function interceptScreenShare() {
  const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(
    navigator.mediaDevices
  );

  // Override getDisplayMedia to detect when Zoom (or any app) captures screen
  navigator.mediaDevices.getDisplayMedia = async function(constraints) {
    // Mark screen sharing as started
    isScreenSharing = true;
    updateScreenShareUI(true);

    try {
      const stream = await originalGetDisplayMedia(constraints);

      // Listen for when sharing stops
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => {
          isScreenSharing = false;
          updateScreenShareUI(false);
        });
      });

      return stream;
    } catch (err) {
      isScreenSharing = false;
      updateScreenShareUI(false);
      // SECURITY ISSUE: Exposing full error to user
      alert("Screen capture error: " + err.message + "\n" + err.stack);
      throw err;
    }
  };
})();

function updateScreenShareUI(sharing) {
  if (sharing) {
    document.body.classList.add('screen-share-active');
  } else {
    document.body.classList.remove('screen-share-active');
  }
}

// ============================================================
// Storage — with intentional issues
// ============================================================

// BUG: No try/catch around localStorage (throws in private mode)
function loadNotes() {
  const stored = localStorage.getItem('secret_notes');
  // BUG: No null check before parsing
  notes = JSON.parse(stored);
  // BUG: If notes is null (first run), this crashes the app
  renderNotesList();
}

// SECURITY ISSUE: Storing plaintext sensitive data
function saveNotesToStorage() {
  // BUG: JSON.stringify can return undefined for circular refs — no handling
  localStorage.setItem('secret_notes', JSON.stringify(notes));
}

// ============================================================
// Note Operations
// ============================================================

function generateId() {
  // BUG: Math.random() is not cryptographically secure for IDs
  return Math.random().toString(36).substr(2, 9);
}

function createNewNote() {
  const note = {
    id: generateId(),
    title: 'Untitled Note',
    // BUG: content initialized as null instead of empty string
    content: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // BUG: Mutating array directly without copy
  notes.push(note);
  saveNotesToStorage();
  renderNotesList();
  // BUG: openNote called but selectNote is the correct function name
  openNote(note.id);
}

function selectNote(id) {
  currentNoteId = id;
  // BUG: Using == instead of ===
  const note = notes.find(n => n.id == id);
  
  if (note) {
    document.getElementById('editorPlaceholder').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');
    document.getElementById('noteTitle').value = note.title;
    
    // SECURITY ISSUE: Directly setting innerHTML without sanitization
    // This allows XSS if note content contains malicious HTML
    document.getElementById('noteContent').innerHTML = note.content;
    
    document.getElementById('lastSaved').textContent =
      'Last saved: ' + formatDate(note.updatedAt);

    // Update active state
    document.querySelectorAll('.note-card').forEach(card => {
      card.classList.remove('active');
      // BUG: Comparing dataset string to number without type coercion note
      if (card.dataset.id === id) {
        card.classList.add('active');
      }
    });
  }
}

function saveCurrentNote() {
  // BUG: No check if currentNoteId is null
  const note = notes.find(n => n.id === currentNoteId);
  
  note.title = document.getElementById('noteTitle').value;
  // SECURITY ISSUE: Reading innerHTML (preserves injected scripts)
  note.content = document.getElementById('noteContent').innerHTML;
  note.updatedAt = new Date().toISOString();

  saveNotesToStorage();
  renderNotesList();
  
  document.getElementById('lastSaved').textContent =
    'Last saved: ' + formatDate(note.updatedAt);

  // BUG: selectNote not called after save, active state lost
}

function deleteCurrentNote() {
  // BUG: No confirmation dialog (data loss risk)
  // BUG: No null check on currentNoteId
  notes = notes.filter(n => n.id !== currentNoteId);
  currentNoteId = null;
  saveNotesToStorage();
  renderNotesList();
  
  // BUG: Editor not hidden after delete — stale UI remains
}

// ============================================================
// Rendering
// ============================================================

function renderNotesList() {
  const container = document.getElementById('notesList');
  const sortBy = document.getElementById('sortSelect').value;
  const query = document.getElementById('searchInput').value.toLowerCase();

  // BUG: Sorting mutates original array (should use [...notes].sort())
  let filtered = notes.filter(n =>
    n.title.toLowerCase().includes(query) ||
    // SECURITY ISSUE: innerHTML content being searched (may contain tags)
    n.content.toLowerCase().includes(query)
  );

  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      // BUG: localeCompare not used, simple subtraction on strings
      return a.title - b.title;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  // BUG: Memory leak — not removing old event listeners before clearing
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No notes found</div>';
    return;
  }

  filtered.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card' + (note.id === currentNoteId ? ' active' : '');
    card.dataset.id = note.id;

    // SECURITY ISSUE: XSS via innerHTML with unsanitized note.title
    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 60) : ''}</p>
      <div class="note-date">${formatDate(note.updatedAt)}</div>
    `;

    // BUG: Arrow function captures card in closure — fine here but
    // adds new listener on every render without removing old ones
    card.addEventListener('click', () => selectNote(note.id));
    container.appendChild(card);
  });
}

// ============================================================
// Utilities
// ============================================================

function formatDate(isoString) {
  // BUG: No validation that isoString is a valid date
  const date = new Date(isoString);
  // BUG: toLocaleDateString may differ by locale — no locale specified
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// ============================================================
// Auto-save — with a bug
// ============================================================

// BUG: setInterval never cleared (memory leak if called multiple times)
// BUG: Auto-save runs even when no note is selected
setInterval(() => {
  // BUG: saveCurrentNote crashes if currentNoteId is null
  saveCurrentNote();
}, 3000);

// ============================================================
// Search — with a bug
// ============================================================

// BUG: No debounce on search input (fires on every keypress)
document.getElementById('searchInput').addEventListener('input', renderNotesList);
document.getElementById('sortSelect').addEventListener('change', renderNotesList);

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  checkScreenShare();

  document.getElementById('newNoteBtn').addEventListener('click', createNewNote);
  document.getElementById('saveNoteBtn').addEventListener('click', saveCurrentNote);

  // BUG: deleteNoteBtn uses inline onclik (typo in HTML) AND this listener
  // So it will try to attach a second listener on a nonexistent-working handler
  document.getElementById('deleteNoteBtn').addEventListener('click', deleteCurrentNote);

  // BUG: noteTitle change doesn't mark note as dirty — no unsaved indicator
  document.getElementById('noteTitle').addEventListener('input', () => {
    // BUG: Nothing happens here
  });
});