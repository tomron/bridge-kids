// multiplayer.js — Supabase Realtime broadcast + room management
// Loaded as <script type="module">, exposes window.MP

const SUPABASE_URL = 'https://ztcicaaqpvhkzzzdefod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Y2ljYWFxcHZoa3p6emRlZm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDQ3NTAsImV4cCI6MjA5MTEyMDc1MH0.w1XpZer-c0iQRLPYl9nkZxGopxAS7CNs3GZUVWAQ91A';

// ── Internal state ─────────────────────────────────────────────────────────────
let supabaseClient = null;
let channel = null;
let _initialized = false;

// Callbacks
let _onStateReceived = null;
let _onActionReceived = null;
let _onSyncRequest = null;
let _onPresenceSync = null;
let _onPresenceJoin = null;
let _onPresenceLeave = null;

// ── Load Supabase from CDN ─────────────────────────────────────────────────────
async function loadSupabase() {
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    return mod.createClient;
  } catch (e) {
    console.warn('[MP] Failed to load Supabase CDN:', e);
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

async function initSupabase() {
  try {
    const createClient = await loadSupabase();
    if (!createClient) {
      _initialized = false;
      return false;
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _initialized = true;
    return true;
  } catch (e) {
    console.warn('[MP] initSupabase error:', e);
    _initialized = false;
    return false;
  }
}

function isMultiplayerAvailable() {
  return _initialized && supabaseClient !== null;
}

function joinChannel(roomCode) {
  if (!isMultiplayerAvailable()) return;
  if (channel) leaveChannel();

  channel = supabaseClient.channel('room:' + roomCode, {
    config: {
      broadcast: { self: false },
      presence: { key: MP.clientKey },
    },
  });

  // Broadcast message routing
  channel.on('broadcast', { event: 'game' }, ({ payload }) => {
    if (!payload || !payload.type) return;
    switch (payload.type) {
      case 'STATE':
        if (_onStateReceived) _onStateReceived(payload);
        break;
      case 'ACTION':
        if (_onActionReceived) _onActionReceived(payload);
        break;
      case 'SYNC_REQUEST':
        if (_onSyncRequest) _onSyncRequest(payload);
        break;
      case 'JOIN_REQUEST':
        _handleJoinRequest(payload);
        break;
      case 'SEAT_MAP':
        _handleSeatMap(payload);
        break;
      case 'SEAT_REJECT':
        _handleSeatReject(payload);
        break;
      case 'START_GAME':
        _handleStartGame(payload);
        break;
      case 'HOST_TRANSFER':
        _handleHostTransfer(payload);
        break;
    }
  });

  // Presence events
  channel.on('presence', { event: 'sync' }, () => {
    if (_onPresenceSync) _onPresenceSync(channel.presenceState());
  });

  channel.on('presence', { event: 'join' }, ({ newPresences }) => {
    if (_onPresenceJoin) _onPresenceJoin(newPresences);
  });

  channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
    _handlePresenceLeave(leftPresences);
    if (_onPresenceLeave) _onPresenceLeave(leftPresences);
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      // Track our own presence
      if (MP.localSeat !== null) {
        trackPresence({ seat: MP.localSeat, name: MP.playerName, clientKey: MP.clientKey });
      }
      // If guest, broadcast sync request to get current state
      if (!MP.isHost) {
        broadcastSyncRequest();
      }
    }
  });
}

function leaveChannel() {
  if (channel) {
    channel.unsubscribe();
    channel = null;
  }
}

function broadcastState(snapshot) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'game',
    payload: { type: 'STATE', seq: snapshot.seq, state: snapshot },
  });
}

function broadcastAction(action) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'game',
    payload: { type: 'ACTION', action, senderSeat: MP.localSeat },
  });
}

function broadcastSyncRequest() {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'game',
    payload: { type: 'SYNC_REQUEST' },
  });
}

function onStateReceived(cb) { _onStateReceived = cb; }
function onActionReceived(cb) { _onActionReceived = cb; }
function onSyncRequest(cb) { _onSyncRequest = cb; }
function onPresenceSync(cb) { _onPresenceSync = cb; }
function onPresenceJoin(cb) { _onPresenceJoin = cb; }
function onPresenceLeave(cb) { _onPresenceLeave = cb; }

function trackPresence(payload) {
  if (!channel) return;
  channel.track(payload);
}

function getPresenceState() {
  if (!channel) return {};
  return channel.presenceState();
}

// ── Room Management ────────────────────────────────────────────────────────────

function generateRoomCode() {
  // Avoid ambiguous chars O, 0, I, 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(mode) {
  const code = generateRoomCode();
  MP.roomCode = code;
  MP.isHost = true;
  MP.localSeat = 0;
  MP.gameMode = mode;
  // Add ourselves to seat map
  MP.seatMap = {
    0: { name: MP.playerName || 'Player 1', clientKey: MP.clientKey, isHuman: true },
  };
  // Update URL
  const url = new URL(window.location.href);
  url.searchParams.set('room', code);
  url.searchParams.set('mode', mode);
  window.history.pushState({}, '', url.toString());

  joinChannel(code);
  return code;
}

function joinRoom(roomCode) {
  MP.roomCode = roomCode;
  MP.isHost = false;
  // Read mode from URL if present
  const url = new URL(window.location.href);
  const mode = url.searchParams.get('mode');
  if (mode) MP.gameMode = mode;

  joinChannel(roomCode);

  // Broadcast join request after a short delay to ensure subscription
  setTimeout(() => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'game',
        payload: {
          type: 'JOIN_REQUEST',
          clientKey: MP.clientKey,
          name: MP.playerName || '',
        },
      });
    }
  }, 500);
}

// ── Internal room logic ────────────────────────────────────────────────────────

function _handleJoinRequest(payload) {
  if (!MP.isHost) return;

  const { clientKey, name } = payload;
  // In 2-player mode, humans are partners: South (0) and North (2)
  // In 4-player mode, all seats 0-3 are available
  const humanSeats = MP.gameMode === '4player' ? [0, 1, 2, 3] : [0, 2];

  // Find next available seat
  const takenSeats = Object.keys(MP.seatMap).map(Number);
  let nextSeat = -1;
  for (const i of humanSeats) {
    if (!takenSeats.includes(i)) { nextSeat = i; break; }
  }

  const maxSeats = humanSeats.length;

  if (nextSeat === -1) {
    // Room full — reject
    channel.send({
      type: 'broadcast',
      event: 'game',
      payload: { type: 'SEAT_REJECT', clientKey, reason: 'Room is full' },
    });
    return;
  }

  MP.seatMap[nextSeat] = { name: name || ('Player ' + (nextSeat + 1)), clientKey, isHuman: true };

  // Broadcast updated seat map to all
  channel.send({
    type: 'broadcast',
    event: 'game',
    payload: { type: 'SEAT_MAP', seatMap: MP.seatMap, mode: MP.gameMode },
  });

  // Update lobby display
  window.dispatchEvent(new CustomEvent('mp-seat-map-updated'));
}

function _handleSeatMap(payload) {
  const { seatMap, mode } = payload;
  MP.gameMode = mode;
  // Find our seat by clientKey
  for (const [seatStr, info] of Object.entries(seatMap)) {
    if (info.clientKey === MP.clientKey) {
      MP.localSeat = parseInt(seatStr, 10);
      break;
    }
  }
  MP.seatMap = seatMap;
  window.dispatchEvent(new CustomEvent('mp-seat-map-updated'));
}

function _handleSeatReject(payload) {
  if (payload.clientKey !== MP.clientKey) return;
  window.dispatchEvent(new CustomEvent('mp-seat-rejected', { detail: { reason: payload.reason } }));
}

function _handleStartGame(payload) {
  window.dispatchEvent(new CustomEvent('mp-start-game', { detail: payload }));
}

function _handleHostTransfer(payload) {
  if (payload.newHostKey === MP.clientKey) {
    MP.isHost = true;
    window.dispatchEvent(new CustomEvent('mp-became-host'));
  }
}

function _handlePresenceLeave(leftPresences) {
  if (!MP.isHost) return;

  for (const presence of leftPresences) {
    // Find which seat this presence occupied
    const leftKey = presence.clientKey;
    for (const [seatStr, info] of Object.entries(MP.seatMap)) {
      if (info.clientKey === leftKey) {
        const seat = parseInt(seatStr, 10);
        // Mark seat as computer-controlled
        MP.seatMap[seat] = { ...info, isHuman: false, disconnected: true };
        window.dispatchEvent(new CustomEvent('mp-player-disconnected', { detail: { seat, name: info.name } }));
        break;
      }
    }
  }
  window.dispatchEvent(new CustomEvent('mp-seat-map-updated'));
}

function broadcastStartGame() {
  if (!channel || !MP.isHost) return;
  channel.send({
    type: 'broadcast',
    event: 'game',
    payload: { type: 'START_GAME', seatMap: MP.seatMap, mode: MP.gameMode },
  });
}

// ── Initialize ─────────────────────────────────────────────────────────────────

// Generate a unique client key for this tab/session
function generateClientKey() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Build the window.MP object
window.MP = {
  isHost: false,
  localSeat: 0,
  seatMap: {},
  gameMode: 'solo',
  roomCode: null,
  playerName: '',
  clientKey: generateClientKey(),

  // Public API
  initSupabase,
  isMultiplayerAvailable,
  joinChannel,
  leaveChannel,
  broadcastState,
  broadcastAction,
  broadcastSyncRequest,
  broadcastStartGame,
  onStateReceived,
  onActionReceived,
  onSyncRequest,
  onPresenceSync,
  onPresenceJoin,
  onPresenceLeave,
  trackPresence,
  getPresenceState,
  generateRoomCode,
  createRoom,
  joinRoom,
};

// Initialize Supabase and dispatch ready event
initSupabase().then((ok) => {
  window.MP._supabaseReady = ok;

  // Auto-join room if ?room= param present
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    MP.roomCode = roomParam;
    // Will be triggered from lobby after name is entered, or auto-join
    MP._autoJoinRoom = roomParam;
  }

  window.dispatchEvent(new CustomEvent('mp-ready', { detail: { available: ok } }));
});
