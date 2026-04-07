// lobby.js — Lobby UI logic
// Loaded as regular <script> after multiplayer.js module

(function () {
  'use strict';

  const SEAT_NAMES = ['South', 'West', 'North', 'East'];

  // ── State ──────────────────────────────────────────────────────────────────
  let selectedMode = 'solo';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.remove('hidden'); }
  function hide(id) { el(id).classList.add('hidden'); }

  function showToast(msg) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
    }
  }

  function clearEl(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  // ── Seat map rendering ─────────────────────────────────────────────────────
  function renderSeatMap() {
    const mp = window.MP;
    if (!mp) return;

    const container = el('seat-map-display');
    if (!container) return;
    clearEl(container);

    const maxSeats = mp.gameMode === '4player' ? 4 : 2;
    // For 2player: NS seats (0 and 2); for 4player: all 4
    const relevantSeats = mp.gameMode === '2player' ? [0, 2] : [0, 1, 2, 3];

    for (let i = 0; i < maxSeats; i++) {
      const seatIdx = relevantSeats[i];
      const info = mp.seatMap[seatIdx];
      const div = document.createElement('div');
      div.className = 'seat-row';

      const badge = document.createElement('span');
      badge.className = 'seat-badge';
      badge.textContent = SEAT_NAMES[seatIdx];

      const nameEl = document.createElement('span');
      nameEl.className = 'seat-name';

      if (info) {
        if (info.isHuman) {
          nameEl.textContent = (info.name || ('Player ' + SEAT_NAMES[seatIdx])) + (info.disconnected ? ' (disconnected)' : '');
          nameEl.classList.add(info.disconnected ? 'seat-disconnected' : 'seat-human');
        } else {
          nameEl.textContent = 'Computer';
          nameEl.classList.add('seat-computer');
        }
      } else {
        nameEl.textContent = 'Open';
        nameEl.classList.add('seat-open');
      }

      div.appendChild(badge);
      div.appendChild(nameEl);
      container.appendChild(div);
    }

    // Update start button
    updateStartButton();
  }

  function updateStartButton() {
    const mp = window.MP;
    if (!mp || !mp.isHost) return;

    const startBtn = el('start-game-btn');
    if (!startBtn) return;

    const humanSeats = Object.values(mp.seatMap).filter(s => s.isHuman).length;
    const required = mp.gameMode === '2player' ? 2 : 4;
    startBtn.disabled = humanSeats < required;

    const waitingMsg = el('waiting-message');
    if (waitingMsg) {
      waitingMsg.textContent = humanSeats < required
        ? 'Waiting for ' + (required - humanSeats) + ' more player(s)\u2026'
        : 'Ready to start!';
    }
  }

  // ── Lobby visibility ───────────────────────────────────────────────────────
  function showLobby() {
    show('lobby-overlay');
  }

  function hideLobby() {
    hide('lobby-overlay');
  }

  // ── Mode selection ─────────────────────────────────────────────────────────
  function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'solo') {
      hide('online-options');
      hide('mp-unavailable');
    } else {
      const mp = window.MP;
      if (!mp || !mp.isMultiplayerAvailable()) {
        hide('online-options');
        show('mp-unavailable');
      } else {
        show('online-options');
        hide('mp-unavailable');
      }
    }
  }

  // ── Create room flow ───────────────────────────────────────────────────────
  function handleCreateRoom() {
    const mp = window.MP;
    if (!mp || !mp.isMultiplayerAvailable()) return;

    const nameInput = el('player-name-input');
    mp.playerName = (nameInput && nameInput.value.trim()) || 'Player 1';

    const code = mp.createRoom(selectedMode);
    showWaitingRoom(code);
  }

  function showWaitingRoom(code) {
    hide('room-actions');
    const nameInput = el('player-name-input');
    if (nameInput) nameInput.classList.add('hidden');
    show('waiting-room');

    const mp = window.MP;
    const codeDisplay = el('room-code-display');
    if (codeDisplay) codeDisplay.textContent = 'Room Code: ' + code;

    const urlDisplay = el('invite-url-display');
    if (urlDisplay) urlDisplay.textContent = window.location.href;

    // Only host can start
    if (mp && mp.isHost) {
      show('start-game-btn');
    } else {
      hide('start-game-btn');
    }

    renderSeatMap();
  }

  // ── Join room flow ─────────────────────────────────────────────────────────
  function handleJoinRoom() {
    const mp = window.MP;
    if (!mp || !mp.isMultiplayerAvailable()) return;

    const codeInput = el('join-code-input');
    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    if (!code || code.length !== 6) {
      alert('Please enter a valid 6-character room code.');
      return;
    }

    const nameInput = el('player-name-input');
    mp.playerName = (nameInput && nameInput.value.trim()) || '';

    mp.joinRoom(code);

    // Show waiting UI
    const codeDisplay = el('room-code-display');
    if (codeDisplay) codeDisplay.textContent = 'Joining room: ' + code;
    const urlDisplay = el('invite-url-display');
    if (urlDisplay) urlDisplay.textContent = '';
    hide('room-actions');
    const ni = el('player-name-input');
    if (ni) ni.classList.add('hidden');
    hide('start-game-btn');
    show('waiting-room');
    const waitMsg = el('waiting-message');
    if (waitMsg) waitMsg.textContent = 'Waiting for host to assign seat\u2026';
  }

  // ── Start game ─────────────────────────────────────────────────────────────
  function handleStartGame() {
    const mp = window.MP;
    if (!mp || !mp.isHost) return;

    mp.broadcastStartGame();
    _launchGame();
  }

  function _launchGame() {
    hideLobby();
    // Fill remaining seats with computer players
    if (window.MP) {
      for (let i = 0; i < 4; i++) {
        if (!window.MP.seatMap[i]) {
          window.MP.seatMap[i] = { name: 'Computer', isHuman: false };
        }
      }
    }
    dispatch({ type: 'NEW_GAME' });
  }

  // ── Connection status ──────────────────────────────────────────────────────
  function updateConnectionStatus() {
    const mp = window.MP;
    if (!mp) return;

    document.querySelectorAll('.conn-dot').forEach(dot => {
      const seat = parseInt(dot.dataset.seat, 10);
      const info = mp.seatMap[seat];
      if (info && info.isHuman && !info.disconnected) {
        dot.classList.add('connected');
        dot.classList.remove('disconnected');
      } else {
        dot.classList.remove('connected');
        dot.classList.add('disconnected');
      }
    });
  }

  // ── Wire up events ─────────────────────────────────────────────────────────
  function init() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => selectMode(btn.dataset.mode));
    });

    // Create room
    const createBtn = el('create-room-btn');
    if (createBtn) createBtn.addEventListener('click', handleCreateRoom);

    // Join room
    const joinBtn = el('join-room-btn');
    if (joinBtn) joinBtn.addEventListener('click', handleJoinRoom);

    // Also join on Enter key in code input
    const codeInput = el('join-code-input');
    if (codeInput) {
      codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleJoinRoom();
      });
    }

    // Start game
    const startBtn = el('start-game-btn');
    if (startBtn) startBtn.addEventListener('click', handleStartGame);

    // Copy invite link
    const copyBtn = el('copy-invite-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy Invite Link'; }, 2000);
        }).catch(() => {
          // Fallback: select the URL text element
          const urlEl = el('invite-url-display');
          if (urlEl) {
            const range = document.createRange();
            range.selectNode(urlEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
          }
        });
      });
    }

    // MP event listeners
    window.addEventListener('mp-ready', (e) => {
      const { available } = e.detail;

      // If ?room= param present and MP available, auto-join
      if (available && window.MP._autoJoinRoom) {
        selectMode('2player'); // default; will be overridden by SEAT_MAP
        show('online-options');
        show('lobby-overlay');
        show('waiting-room');
        hide('room-actions');
        const codeDisp = el('room-code-display');
        if (codeDisp) codeDisp.textContent = 'Joining room: ' + window.MP._autoJoinRoom;
        const waitMsg = el('waiting-message');
        if (waitMsg) waitMsg.textContent = 'Connecting\u2026';

        const nameInput = el('player-name-input');
        window.MP.playerName = (nameInput && nameInput.value.trim()) || '';
        window.MP.joinRoom(window.MP._autoJoinRoom);
      } else if (!available && selectedMode !== 'solo') {
        show('mp-unavailable');
        hide('online-options');
      }
    });

    window.addEventListener('mp-seat-map-updated', () => {
      renderSeatMap();
      updateConnectionStatus();
    });

    window.addEventListener('mp-start-game', () => {
      _launchGame();
    });

    window.addEventListener('mp-seat-rejected', (e) => {
      const reason = (e.detail && e.detail.reason) ? e.detail.reason : 'Could not join room.';
      alert('Could not join room: ' + reason);
      // Reset UI
      show('room-actions');
      const ni = el('player-name-input');
      if (ni) ni.classList.remove('hidden');
      hide('waiting-room');
    });

    window.addEventListener('mp-player-disconnected', (e) => {
      const { seat, name } = e.detail;
      showToast((name || ('Seat ' + seat)) + ' disconnected. Computer takes over.');
      updateConnectionStatus();
    });

    window.addEventListener('mp-became-host', () => {
      showToast('You are now the host.');
      const startBtn2 = el('start-game-btn');
      if (startBtn2) show('start-game-btn');
    });

    // Solo mode: show lobby; skip if ?room= present (auto-join)
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('room')) {
      showLobby();
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external use
  window.LobbyModule = { showLobby, hideLobby, renderSeatMap, updateConnectionStatus };
})();
