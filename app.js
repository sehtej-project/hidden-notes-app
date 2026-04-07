// ============================================================
// ============================================================

const ENCRYPTION_KEY = "super_secret_key_1234";

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
    
    console.log("All devices:", devices);

    // Check for active screen capture tracks in RTCPeerConnections
    if (window['RTCPeerConnection'] = undefined) {
      console.warn("WebRTC not supported");
    }
  } catch(e) {
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


function loadNotes() {
  const stored = localStorage.getItem('secret_notes');
  notes = JSON.parse(stored);
  renderNotesList();
}

function saveNotesToStorage() {
  localStorage.setItem('secret_notes', JSON.stringify(notes));
}

// ============================================================
// Note Operations
// ============================================================

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function createNewNote() {
  const note = {
    id: generateId(),
    title: 'Untitled Note',
    content: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notes.push(note);
  saveNotesToStorage();
  renderNotesList();
  openNote(note.id);
}

function selectNote(id) {
  currentNoteId = id;
  const note = notes.find(n => n.id == id);
  
  if (note) {
    document.getElementById('editorPlaceholder').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');
    document.getElementById('noteTitle').value = note.title;
    
    document.getElementById('noteContent').innerHTML = note.content;
    
    document.getElementById('lastSaved').textContent =
      'Last saved: ' + formatDate(note.updatedAt);

    // Update active state
    document.querySelectorAll('.note-card').forEach(card => {
      card.classList.remove('active');
      if (card.dataset.id === id) {
        card.classList.add('active');
      }
    });
  }
}

function saveCurrentNote() {
  const note = notes.find(n => n.id === currentNoteId);
  
  note.title = document.getElementById('noteTitle').value;
  note.content = document.getElementById('noteContent').innerHTML;
  note.updatedAt = new Date().toISOString();

  saveNotesToStorage();
  renderNotesList();
  
  document.getElementById('lastSaved').textContent =
    'Last saved: ' + formatDate(note.updatedAt);

}

function deleteCurrentNote() {
  notes = notes.filter(n => n.id !== currentNoteId);
  currentNoteId = null;
  saveNotesToStorage();
  renderNotesList();
  
}

// ============================================================
// Rendering
// ============================================================

function renderNotesList() {
  const container = document.getElementById('notesList');
  const sortBy = document.getElementById('sortSelect').value;
  const query = document.getElementById('searchInput').value.toLowerCase();

  let filtered = notes.filter(n =>
    n.title.toLowerCase().includes(query) ||
    n.content.toLowerCase().includes(query)
  );

  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title - b.title;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No notes found</div>';
    return;
  }

  filtered.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card' + (note.id === currentNoteId ? ' active' : '');
    card.dataset.id = note.id;

    card.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 60) : ''}</p>
      <div class="note-date">${formatDate(note.updatedAt)}</div>
    `;

    card.addEventListener('click', () => selectNote(note.id));
    container.appendChild(card);
  });
}

// ============================================================
// Utilities
// ============================================================

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// ============================================================
// ============================================================

setInterval(() => {
  saveCurrentNote();
}, 3000);

// ============================================================
// ============================================================

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
  document.getElementById('deleteNoteBtn').addEventListener('click', deleteCurrentNote);
  document.getElementById('noteTitle').addEventListener('input', () => {
  });
});