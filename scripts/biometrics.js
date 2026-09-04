/**
 * LUNAR BIOMETRIC & SPACE-SCANNER ENGINE
 * Manages LUNAR ID verification, HUD canvas, spatial geofence check, and audio synthesis
 */

class BiometricEngine {
  constructor() {
    this.stream = null;
    this.isScanning = false;
    this.audioCtx = null;
    this.soundEnabled = true;
    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  // Play synthesized sci-fi sound effects
  playSound(type) {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'scan') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(920, now + 0.3);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const noteOsc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(this.audioCtx.destination);
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
        noteGain.gain.setValueAtTime(0.12, now + idx * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        noteOsc.start(now + idx * 0.08);
        noteOsc.stop(now + idx * 0.08 + 0.4);
      });
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  // Draw simulated cosmic face wireframe on canvas when camera is off or simulated
  drawHolographicFace(canvas, progress) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Grid background
    ctx.strokeStyle = 'rgba(37, 99, 255, 0.12)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Concentric orbital scanner rings
    const time = Date.now() * 0.002;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, 90 + Math.sin(time) * 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, 65, 0, Math.PI * 2);
    ctx.stroke();

    // Stylized Holographic Face Contour (Oval + Eye markers + Mesh)
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
    ctx.fillStyle = 'rgba(34, 211, 238, 0.06)';
    ctx.lineWidth = 1.5;

    // Face oval
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 75, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Eyes target boxes
    const eyeOffsetX = 22;
    const eyeOffsetY = -15;

    // Left Eye Reticle
    ctx.strokeRect(cx - eyeOffsetX - 8, cy + eyeOffsetY - 6, 16, 12);
    ctx.beginPath();
    ctx.arc(cx - eyeOffsetX, cy + eyeOffsetY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#22D3EE';
    ctx.fill();

    // Right Eye Reticle
    ctx.strokeRect(cx + eyeOffsetX - 8, cy + eyeOffsetY - 6, 16, 12);
    ctx.beginPath();
    ctx.arc(cx + eyeOffsetX, cy + eyeOffsetY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Nose & Mouth coordinates
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 5, cy + 18);
    ctx.lineTo(cx + 5, cy + 18);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy + 38, 14, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Scanning horizontal sweep bar
    const scanY = cy - 80 + ((Date.now() % 1600) / 1600) * 160;
    const grad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
    grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.8)');
    grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 70, scanY - 6, 140, 12);

    // Keypoints telemetry points
    const points = [
      { x: cx - 40, y: cy - 40 },
      { x: cx + 40, y: cy - 40 },
      { x: cx - 45, y: cy + 20 },
      { x: cx + 45, y: cy + 20 },
      { x: cx, y: cy + 65 },
      { x: cx, y: cy - 70 }
    ];

    points.forEach((pt, idx) => {
      ctx.fillStyle = (idx % 2 === 0) ? '#22D3EE' : '#A855F7';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // Start verification sequence
  startVerificationSequence(callbacks = {}) {
    if (this.isScanning) return;
    this.isScanning = true;

    this.playSound('scan');

    const { onProgress, onSensorUpdate, onComplete } = callbacks;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 6;
      if (progress > 100) progress = 100;

      if (onProgress) onProgress(progress);

      if (progress >= 30 && progress < 65) {
        if (onSensorUpdate) onSensorUpdate('LIVENESS', 'ACTIVE');
        this.playSound('beep');
      } else if (progress >= 65 && progress < 90) {
        if (onSensorUpdate) {
          onSensorUpdate('LIVENESS', 'VERIFIED');
          onSensorUpdate('SPATIAL', 'ACTIVE');
        }
        this.playSound('beep');
      } else if (progress >= 90 && progress < 100) {
        if (onSensorUpdate) {
          onSensorUpdate('SPATIAL', 'VERIFIED');
          onSensorUpdate('IDENTITY', 'ACTIVE');
        }
      } else if (progress >= 100) {
        clearInterval(interval);
        this.isScanning = false;
        if (onSensorUpdate) {
          onSensorUpdate('IDENTITY', 'VERIFIED');
        }
        this.playSound('success');
        if (onComplete) onComplete();
      }
    }, 180);
  }
}

window.biometricEngine = new BiometricEngine();
