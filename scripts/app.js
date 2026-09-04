/**
 * LUNAR ECOSYSTEM MASTER CONTROLLER
 * Coordinates Views, Canvas Graphics, Orbital Galaxy, Biometric Modals, and AI Assistant
 */

document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initAttendanceGalaxy();
  initTimers();
  initBunkCalculator();
  initEventListeners();

  // Draw simulated scanner HUD canvas initially
  const hudCanvas = document.getElementById('scanner-hud-canvas');
  if (hudCanvas && window.biometricEngine) {
    const renderHUD = () => {
      window.biometricEngine.drawHolographicFace(hudCanvas);
      requestAnimationFrame(renderHUD);
    };
    renderHUD();
  }

  // Draw Faculty Anti-Proxy Radar
  const radarCanvas = document.getElementById('proxy-radar-canvas');
  if (radarCanvas && window.geoLockEngine) {
    window.geoLockEngine.initRadarCanvas(radarCanvas);
  }
});

/* ==========================================================================
   1. STARFIELD BACKGROUND AMBIENCE
   ========================================================================== */
function initStarfield() {
  const canvas = document.getElementById('starfield-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const stars = [];
  const count = 90;

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.5 + 0.5,
      color: ['#22D3EE', '#7C3AED', '#2563FF', '#FFFFFF'][Math.floor(Math.random() * 4)],
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.002
    });
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(star => {
      star.alpha += star.speed;
      const opacity = (Math.sin(star.alpha) + 1) / 2;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = opacity * 0.6;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   2. ATTENDANCE UNIVERSE: ORBITAL GALAXY VISUALIZER
   ========================================================================== */
function initAttendanceGalaxy() {
  const canvas = document.getElementById('galaxy-orbit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = canvas.parentElement.clientWidth || 600);
  let height = (canvas.height = canvas.parentElement.clientHeight || 340);

  const cx = width / 2;
  const cy = height / 2;

  // 5 Subject Planets with orbital distances and angles
  const planets = [
    {
      id: 'cloud-devops',
      name: 'Cloud DevOps',
      percent: '76%',
      color: '#A855F7',
      orbitR: 85,
      angle: 0.4,
      speed: 0.006,
      size: 11
    },
    {
      id: 'data-structures',
      name: 'Data Structures',
      percent: '91%',
      color: '#2563FF',
      orbitR: 135,
      angle: 2.1,
      speed: 0.004,
      size: 13
    },
    {
      id: 'full-stack',
      name: 'Full Stack',
      percent: '84%',
      color: '#C084FC',
      orbitR: 110,
      angle: 4.2,
      speed: 0.005,
      size: 12
    },
    {
      id: 'database',
      name: 'Database',
      percent: '79%',
      color: '#22D3EE',
      orbitR: 95,
      angle: 5.3,
      speed: 0.0055,
      size: 10
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      percent: '69%',
      color: '#F43F5E',
      orbitR: 60, // Close to red warning orbit
      angle: 1.2,
      speed: 0.008,
      size: 10,
      isRisk: true
    }
  ];

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Center Galactic Core (75% Baseline Threshold)
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
    coreGrad.addColorStop(0, 'rgba(37, 99, 255, 0.4)');
    coreGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fill();

    // Central Core Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('75% THRESHOLD', cx, cy - 4);
    ctx.font = '9px Plus Jakarta Sans';
    ctx.fillStyle = '#22D3EE';
    ctx.fillText('CORE ORBIT', cx, cy + 9);

    // Orbit paths
    [60, 85, 95, 110, 135].forEach((radius, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = radius === 60 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(36, 48, 74, 0.45)';
      ctx.setLineDash(radius === 60 ? [3, 4] : [2, 6]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Render each orbiting planet
    planets.forEach(planet => {
      planet.angle += planet.speed;
      const px = cx + Math.cos(planet.angle) * planet.orbitR;
      const py = cy + Math.sin(planet.angle) * planet.orbitR;

      // Planet Glow
      ctx.beginPath();
      ctx.arc(px, py, planet.size + 4, 0, Math.PI * 2);
      ctx.fillStyle = planet.color;
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Planet Core
      ctx.beginPath();
      ctx.arc(px, py, planet.size, 0, Math.PI * 2);
      ctx.fillStyle = planet.color;
      ctx.shadowColor = planet.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet Text Tag
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${planet.name} • ${planet.percent}`, px, py + planet.size + 11);
    });

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   3. TIMERS & STOPWATCHES
   ========================================================================== */
function initTimers() {
  // 1. Live Roll-call verification countdown (00:47)
  let secondsRemaining = 47;
  const timerElem = document.getElementById('live-timer-countdown');

  setInterval(() => {
    if (secondsRemaining > 0) {
      secondsRemaining--;
      const mins = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
      const secs = String(secondsRemaining % 60).padStart(2, '0');
      if (timerElem) timerElem.textContent = `${mins}:${secs}`;
    }
  }, 1000);

  // 2. Practicum Live Active Stopwatch (04:32:18)
  let practicumSeconds = 4 * 3600 + 32 * 60 + 18;
  const stopwatchElem = document.getElementById('practicum-live-stopwatch');

  setInterval(() => {
    practicumSeconds++;
    const h = String(Math.floor(practicumSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((practicumSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(practicumSeconds % 60).padStart(2, '0');
    if (stopwatchElem) stopwatchElem.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

/* ==========================================================================
   4. "CAN I BUNK?" BUNK INTELLIGENCE SIMULATOR
   ========================================================================== */
function initBunkCalculator() {
  const selector = document.getElementById('bunk-subject-selector');
  if (!selector) return;

  const updateCalculator = () => {
    const subjectId = selector.value;
    const stats = window.attendanceEngine.getSubjectStats(subjectId);

    const currentElem = document.getElementById('bunk-stat-current');
    const attendElem = document.getElementById('bunk-stat-attend');
    const bunkElem = document.getElementById('bunk-stat-bunk');
    const advisoryText = document.getElementById('bunk-advisory-text');
    const advisoryBanner = document.getElementById('bunk-advisory-banner');

    if (currentElem) currentElem.textContent = `${stats.currentPercent}%`;
    if (attendElem) attendElem.textContent = `${stats.ifAttend}%`;
    if (bunkElem) bunkElem.textContent = `${stats.ifBunk}%`;

    if (advisoryText) {
      if (stats.ifBunk < 75.0) {
        advisoryBanner.className = "bg-rose-950/40 border border-rose-500/40 p-3.5 rounded-lg flex items-start gap-3";
        advisoryText.innerHTML = `Skipping this period will push your attendance to <strong class="text-rose-400">${stats.ifBunk}%</strong>, which is <strong>below the 75% requirement</strong>.`;
      } else {
        advisoryBanner.className = "bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-lg flex items-start gap-3";
        advisoryText.innerHTML = `You have a safe bunk budget. Skipping this period will drop you to <strong class="text-emerald-400">${stats.ifBunk}%</strong>, staying above the 75% requirement.`;
      }
    }
  };

  selector.addEventListener('change', updateCalculator);
}

/* ==========================================================================
   5. UI CONTROLLERS & EVENT LISTENERS
   ========================================================================== */
function initEventListeners() {
  // Navigation View Switchers
  const btnStudent = document.getElementById('nav-btn-student');
  const btnFaculty = document.getElementById('nav-btn-faculty');
  const btnPracticum = document.getElementById('nav-btn-practicum');

  if (btnStudent) btnStudent.addEventListener('click', () => switchPortalView('student'));
  if (btnFaculty) btnFaculty.addEventListener('click', () => switchPortalView('faculty'));
  if (btnPracticum) btnPracticum.addEventListener('click', () => switchPortalView('practicum'));

  // Quick verify buttons -> opens biometric scanner
  const btnOpenScanner = document.getElementById('btn-open-scanner-modal');
  const btnQuickVerify = document.getElementById('btn-quick-verify-top');
  const btnFloatingVerify = document.getElementById('floating-btn-verify');
  const btnCloseScanner = document.getElementById('btn-close-scanner');
  const scannerModal = document.getElementById('modal-biometric-scanner');

  const openScanner = () => {
    if (scannerModal) scannerModal.classList.remove('hidden');
    if (window.biometricEngine) window.biometricEngine.playSound('beep');
  };

  if (btnOpenScanner) btnOpenScanner.addEventListener('click', openScanner);
  if (btnQuickVerify) btnQuickVerify.addEventListener('click', openScanner);
  if (btnFloatingVerify) btnFloatingVerify.addEventListener('click', openScanner);

  if (btnCloseScanner) {
    btnCloseScanner.addEventListener('click', () => {
      if (scannerModal) scannerModal.classList.add('hidden');
    });
  }

  // Trigger Biometric Scan Action
  const btnTriggerScan = document.getElementById('btn-trigger-scan');
  if (btnTriggerScan) {
    btnTriggerScan.addEventListener('click', () => {
      const progressBar = document.getElementById('scan-progress-bar');
      const progressText = document.getElementById('scan-progress-percentage');
      const statusText = document.getElementById('scan-status-text');

      btnTriggerScan.disabled = true;
      btnTriggerScan.classList.add('opacity-50');

      window.biometricEngine.startVerificationSequence({
        onProgress: (val) => {
          if (progressBar) progressBar.style.width = `${val}%`;
          if (progressText) progressText.textContent = `${val}%`;
          if (statusText) statusText.textContent = `VERIFYING ${val}%...`;
        },
        onSensorUpdate: (sensor, state) => {
          const el = document.getElementById(`sensor-${sensor.toLowerCase()}`);
          if (el) {
            const valSpan = el.querySelector('.sensor-val');
            if (state === 'ACTIVE') {
              el.className = 'bg-cyan-950/40 border border-cyan-400 p-2 rounded-lg text-cyan-300';
              if (valSpan) valSpan.textContent = 'CHECKING...';
            } else if (state === 'VERIFIED') {
              el.className = 'bg-emerald-950/40 border border-emerald-500 p-2 rounded-lg text-emerald-300';
              if (valSpan) valSpan.textContent = 'VERIFIED ✓';
            }
          }
        },
        onComplete: () => {
          if (statusText) statusText.innerHTML = '<span class="text-emerald-400 font-bold">✓ IDENTITY VERIFIED (Face • Location • Beacon)</span>';
          btnTriggerScan.disabled = false;
          btnTriggerScan.classList.remove('opacity-50');
          btnTriggerScan.innerHTML = '<i class="fa-solid fa-check mr-1"></i> VERIFIED & RECORDED';

          // Update Live Class Action Container
          const actionContainer = document.getElementById('live-presence-action-container');
          if (actionContainer) {
            actionContainer.innerHTML = `
              <div class="w-full bg-emerald-950/50 border border-emerald-500 p-3 rounded-xl text-center font-bold text-emerald-300 text-sm animate-fade-in flex items-center justify-center gap-2">
                <i class="fa-solid fa-circle-check text-base"></i> ✓ PRESENCE CONFIRMED (EB104)
              </div>
            `;
          }

          // Mark presence in engine
          window.attendanceEngine.markPresence('cloud-devops');

          setTimeout(() => {
            if (scannerModal) scannerModal.classList.add('hidden');
          }, 1800);
        }
      });
    });
  }

  // Audio Toggle
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      window.biometricEngine.soundEnabled = !window.biometricEngine.soundEnabled;
      btnToggleSound.innerHTML = window.biometricEngine.soundEnabled 
        ? '<i class="fa-solid fa-volume-high text-xs"></i>' 
        : '<i class="fa-solid fa-volume-xmark text-xs text-slate-500"></i>';
      if (window.biometricEngine.soundEnabled) window.biometricEngine.playSound('beep');
    });
  }

  // Notifications Drawer
  const btnOpenAlerts = document.getElementById('btn-open-alerts');
  const btnCloseAlerts = document.getElementById('btn-close-alerts');
  const drawerAlerts = document.getElementById('drawer-alerts');

  if (btnOpenAlerts && drawerAlerts) {
    btnOpenAlerts.addEventListener('click', () => drawerAlerts.classList.remove('translate-x-full'));
  }
  if (btnCloseAlerts && drawerAlerts) {
    btnCloseAlerts.addEventListener('click', () => drawerAlerts.classList.add('translate-x-full'));
  }

  // Lunar AI Drawer
  const btnLaunchAiTop = document.getElementById('btn-launch-ai-top');
  const btnCloseAi = document.getElementById('btn-close-ai');
  const drawerAi = document.getElementById('drawer-lunar-ai');
  const aiForm = document.getElementById('ai-chat-form');

  if (btnLaunchAiTop && drawerAi) {
    btnLaunchAiTop.addEventListener('click', () => drawerAi.classList.remove('translate-x-full'));
  }
  if (btnCloseAi && drawerAi) {
    btnCloseAi.addEventListener('click', () => drawerAi.classList.add('translate-x-full'));
  }

  if (aiForm) {
    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('ai-chat-input');
      if (!input || !input.value.trim()) return;
      handleAiQuery(input.value.trim());
      input.value = '';
    });
  }

  // Scroll to section button
  const btnJump = document.getElementById('btn-jump-intelligence');
  if (btnJump) {
    btnJump.addEventListener('click', () => {
      scrollToSection('section-intelligence');
    });
  }
}

/* ==========================================================================
   6. GLOBAL UTILITY FUNCTIONS
   ========================================================================== */
function switchPortalView(viewName) {
  const studentView = document.getElementById('view-student-portal');
  const facultyView = document.getElementById('view-faculty-portal');
  const practicumView = document.getElementById('view-practicum-portal');

  const btnStudent = document.getElementById('nav-btn-student');
  const btnFaculty = document.getElementById('nav-btn-faculty');
  const btnPracticum = document.getElementById('nav-btn-practicum');

  [btnStudent, btnFaculty, btnPracticum].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  if (studentView) studentView.classList.add('hidden');
  if (facultyView) facultyView.classList.add('hidden');
  if (practicumView) practicumView.classList.add('hidden');

  if (viewName === 'student') {
    if (studentView) studentView.classList.remove('hidden');
    if (btnStudent) btnStudent.classList.add('active');
  } else if (viewName === 'faculty') {
    if (facultyView) facultyView.classList.remove('hidden');
    if (btnFaculty) btnFaculty.classList.add('active');
  } else if (viewName === 'practicum') {
    if (practicumView) practicumView.classList.remove('hidden');
    if (btnPracticum) btnPracticum.classList.add('active');
  }

  if (window.biometricEngine) window.biometricEngine.playSound('beep');
}

function scrollToSection(sectionId) {
  const elem = document.getElementById(sectionId);
  if (elem) {
    elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function toggleLunarAIDrawer(open) {
  const drawer = document.getElementById('drawer-lunar-ai');
  if (drawer) {
    if (open) drawer.classList.remove('translate-x-full');
    else drawer.classList.add('translate-x-full');
  }
}

function sendQuickAiQuery(query) {
  toggleLunarAIDrawer(true);
  handleAiQuery(query);
}

function escapeAiHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAiMarkdown(text) {
  return escapeAiHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

async function handleAiQuery(userText) {
  const chatContainer = document.getElementById('ai-chat-messages');
  if (!chatContainer) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'bg-blue-950/40 border border-blue-500/40 p-3 rounded-xl text-xs text-white ml-6 text-right';
  userMsg.textContent = userText;
  chatContainer.appendChild(userMsg);

  const typing = document.createElement('div');
  typing.id = 'nebula-typing';
  typing.className = 'bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-xl text-xs text-cyan-300 leading-relaxed mr-6';
  typing.textContent = 'Nebula is querying live Python engines…';
  chatContainer.appendChild(typing);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  if (window.biometricEngine) window.biometricEngine.playSound('beep');

  let reply = 'Could not reach the Python Nebula server. Run `python server.py` and keep this page on http://127.0.0.1:8080/';
  try {
    if (window.nebulaAI) {
      const result = await window.nebulaAI.ask(userText);
      reply = result.text;
    }
  } catch (err) {
    reply = `Live link failed: ${err.message || err}. Start the portal with python server.py so /api/chat is available.`;
  }

  typing.remove();
  const aiMsg = document.createElement('div');
  aiMsg.className = 'bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-xl text-xs text-slate-200 leading-relaxed mr-6 animate-fade-in whitespace-pre-line';
  aiMsg.innerHTML = renderAiMarkdown(reply);
  chatContainer.appendChild(aiMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  if (window.biometricEngine) window.biometricEngine.playSound('scan');
}

function showRoomRoster(roomId) {
  const modal = document.getElementById('modal-room-roster');
  const room = window.geoLockEngine.rooms.find(r => r.id === roomId);
  if (!modal || !room) return;

  document.getElementById('modal-roster-room-id').textContent = room.id;
  document.getElementById('modal-roster-title').textContent = `${room.name} (${room.present}/${room.total})`;

  const content = document.getElementById('modal-roster-content');
  content.innerHTML = `
    <div class="bg-[#070B1A] border border-[#24304A] p-3 rounded-lg flex items-center justify-between font-mono text-xs mb-3">
      <div>
        <span class="text-slate-400">Faculty:</span> <strong class="text-white">${room.faculty}</strong>
      </div>
      <div>
        <span class="text-slate-400">BLE Beacon:</span> <span class="text-cyan-300 font-bold">${room.beaconId}</span> (${room.rssi})
      </div>
    </div>
    <div class="space-y-1.5 font-mono text-xs">
      ${room.students.map(s => `
        <div class="bg-[#0D1226] border border-[#24304A] p-2.5 rounded-lg flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-cyan-300 font-bold">${s.roll}</span>
            <span class="text-slate-200">${s.name}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-slate-400">${s.ble}</span>
            <span class="badge-lunar ${s.status.includes('VERIFIED') ? 'badge-emerald' : 'badge-amber'} text-[9px]">${s.status}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  modal.classList.remove('hidden');
  const closeBtn = document.getElementById('btn-close-roster');
  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
}

window.showRoomRoster = showRoomRoster;
window.switchPortalView = switchPortalView;
window.scrollToSection = scrollToSection;
window.toggleLunarAIDrawer = toggleLunarAIDrawer;
window.sendQuickAiQuery = sendQuickAiQuery;
