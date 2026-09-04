/**
 * LUNAR SPATIAL & ANTI-PROXY RADAR ENGINE
 * East Block Interactive Floor Map, Anti-Proxy Anomaly Detection, and BLE Beacon Telemetry
 */

class GeoLockEngine {
  constructor() {
    this.rooms = [
      {
        id: "EB101",
        name: "EB101 • Advanced Algo Lab",
        subject: "Data Structures & Algorithms",
        faculty: "Prof. Priya Nair",
        present: 58,
        total: 60,
        status: "LOCKED",
        beaconId: "JAIN-EB101-4401",
        rssi: "-62 dBm",
        anomalies: 0,
        students: [
          { roll: "26BCA001", name: "Aarav Sharma", status: "VERIFIED", time: "09:02:14", ble: "EB101 (1.1m)" },
          { roll: "26BCA002", name: "Ananya Iyer", status: "VERIFIED", time: "09:03:45", ble: "EB101 (0.8m)" },
          { roll: "26BCA003", name: "Devansh Patel", status: "VERIFIED", time: "09:04:12", ble: "EB101 (1.5m)" }
        ]
      },
      {
        id: "EB102",
        name: "EB102 • Cloud & Web Studio",
        subject: "Full Stack Web Engineering",
        faculty: "Prof. Rohit Varma",
        present: 54,
        total: 60,
        status: "ACTIVE",
        beaconId: "JAIN-EB102-4402",
        rssi: "-58 dBm",
        anomalies: 1,
        students: [
          { roll: "26BCA011", name: "Fahad Khan", status: "VERIFIED", time: "09:51:10", ble: "EB102 (1.2m)" },
          { roll: "26BCA012", name: "Gauri Menon", status: "VERIFIED", time: "09:52:40", ble: "EB102 (1.0m)" }
        ]
      },
      {
        id: "EB103",
        name: "EB103 • High Performance DB Lab",
        subject: "Database Systems",
        faculty: "Dr. Lakshmi S.",
        present: 60,
        total: 60,
        status: "LOCKED",
        beaconId: "JAIN-EB103-4403",
        rssi: "-65 dBm",
        anomalies: 0,
        students: [
          { roll: "26BCA021", name: "Kiran Joseph", status: "VERIFIED", time: "09:01:05", ble: "EB103 (0.9m)" }
        ]
      },
      {
        id: "EB104",
        name: "EB104 • Enterprise Cloud Sandbox",
        subject: "Cloud Infrastructure & DevOps",
        faculty: "Dr. Arvind Menon",
        present: 42,
        total: 60,
        status: "LIVE ROLL-CALL",
        badge: "18 ABSENT",
        beaconId: "JAIN-EB104-4404",
        rssi: "-52 dBm",
        anomalies: 2,
        students: [
          { roll: "26BCA042", name: "Akshay (You)", status: "READY TO VERIFY", time: "--:--:--", ble: "EB104 (1.2m)" },
          { roll: "26BCA043", name: "Rohan Das", status: "VERIFIED", time: "09:05:18", ble: "EB104 (1.4m)" },
          { roll: "26BCA044", name: "Sneha Pillai", status: "VERIFIED", time: "09:06:22", ble: "EB104 (0.7m)" }
        ]
      },
      {
        id: "EB105",
        name: "EB105 • Discrete Math Amphitheater",
        subject: "Discrete Mathematics & Logic",
        faculty: "Dr. K. Ramanathan",
        present: 57,
        total: 60,
        status: "ACTIVE",
        beaconId: "JAIN-EB105-4405",
        rssi: "-60 dBm",
        anomalies: 0,
        students: [
          { roll: "26BCA051", name: "Varun Nair", status: "VERIFIED", time: "09:02:11", ble: "EB105 (1.1m)" }
        ]
      }
    ];

    this.anomaliesList = [
      {
        id: "ANO-9941",
        type: "GPS SPOOF DETECTED",
        badgeColor: "badge-rose",
        target: "Roll #26BCA077",
        details: "Mock location provider active • Simulated coordinates 450m from East Block",
        action: "BLOCKED & FLAGGED",
        time: "Just now"
      },
      {
        id: "ANO-9940",
        type: "BLE PROXIMITY MISMATCH",
        badgeColor: "badge-rose",
        target: "Roll #26BCA033",
        details: "RSSI -94 dBm (Threshold: -68 dBm) • Student detected outside EB104",
        action: "BLOCKED",
        time: "2 mins ago"
      },
      {
        id: "ANO-9939",
        type: "LIVENESS PRESENTATION ATTACK",
        badgeColor: "badge-amber",
        target: "Roll #26BCA018",
        details: "Static screen playback detected • Neural depth check score 0.12",
        action: "REJECTED",
        time: "5 mins ago"
      }
    ];
  }

  // Draw Anti-Proxy Anomaly Radar Canvas
  initRadarCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.44;

    let angle = 0;

    const blips = [
      { r: radius * 0.35, theta: 0.8, color: '#34D399', label: 'EB101' },
      { r: radius * 0.55, theta: 2.1, color: '#22D3EE', label: 'EB104' },
      { r: radius * 0.72, theta: 4.2, color: '#34D399', label: 'EB103' },
      { r: radius * 0.82, theta: 5.4, color: '#F43F5E', label: 'PROXY #042' }
    ];

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // Radar Concentric Circles
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach(scale => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(37, 99, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Sweeping beam
      angle += 0.035;
      if (angle >= Math.PI * 2) angle = 0;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle - 0.45, angle);
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      sweepGrad.addColorStop(0, 'rgba(34, 211, 238, 0.4)');
      sweepGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Render blips
      blips.forEach(blip => {
        const bx = cx + Math.cos(blip.theta) * blip.r;
        const by = cy + Math.sin(blip.theta) * blip.r;

        // Glow
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fillStyle = blip.color;
        ctx.shadowColor = blip.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '9px JetBrains Mono';
        ctx.fillStyle = blip.color;
        ctx.fillText(blip.label, bx + 7, by + 3);
      });

      requestAnimationFrame(render);
    };

    render();
  }
}

window.geoLockEngine = new GeoLockEngine();
