/**
 * LUNAR ATTENDANCE INTELLIGENCE ENGINE
 * Core mathematical engine for Bunk Budget, Recovery Radar, and Orbital Tracking
 */

class AttendanceEngine {
  constructor() {
    this.student = {
      name: "Akshay",
      program: "BCA Work Integrated",
      semester: 1,
      roll: "26BCA042",
      campusStatus: "CAMPUS VERIFIED",
      detectedBeacon: "EB104 DETECTED",
      beaconAccuracy: "1.2m (BLE Proximity Level 4)",
      gpsCoords: "9.9816° N, 76.2999° E (School of Future, Kochi)"
    };

    this.subjects = [
      {
        id: "cloud-devops",
        name: "Cloud Infrastructure & DevOps",
        code: "BCA-104",
        attended: 19,
        total: 25,
        room: "EB104",
        faculty: "Dr. Arvind Menon",
        slot: "09:00 — 09:50",
        color: "#7C3AED",
        gradient: "from-purple-500 to-indigo-600",
        status: "LIVE NOW"
      },
      {
        id: "data-structures",
        name: "Data Structures & Algorithms",
        code: "BCA-101",
        attended: 21,
        total: 23,
        room: "EB101",
        faculty: "Prof. Priya Nair",
        slot: "09:00 — 09:50",
        color: "#2563FF",
        gradient: "from-blue-500 to-cyan-500",
        status: "ATTENDED"
      },
      {
        id: "full-stack",
        name: "Full Stack Web Engineering",
        code: "BCA-102",
        attended: 21,
        total: 25,
        room: "EB102",
        faculty: "Prof. Rohit Varma",
        slot: "09:50 — 10:40",
        color: "#A855F7",
        gradient: "from-fuchsia-500 to-purple-600",
        status: "ATTENDED"
      },
      {
        id: "database",
        name: "Database Systems (PostgreSQL)",
        code: "BCA-103",
        attended: 19,
        total: 24,
        room: "EB103",
        faculty: "Dr. Lakshmi S.",
        slot: "11:50 — 12:40",
        color: "#22D3EE",
        gradient: "from-cyan-500 to-blue-600",
        status: "UPCOMING"
      },
      {
        id: "mathematics",
        name: "Discrete Mathematics & Logic",
        code: "BCA-105",
        attended: 18,
        total: 26,
        room: "EB105",
        faculty: "Dr. K. Ramanathan",
        slot: "12:40 — 13:30",
        color: "#F43F5E",
        gradient: "from-rose-500 to-pink-600",
        status: "RISK (<75%)"
      }
    ];

    this.practicum = {
      company: "CognitiveX Labs (Kochi Infopark)",
      role: "Junior Cloud Infrastructure Associate",
      shiftStart: "13:30",
      shiftEnd: "21:30",
      totalShiftHours: 8.0,
      completedHoursToday: 4.53,
      status: "ACTIVE",
      zoneVerified: true,
      gpsVerified: true,
      biometricVerified: true
    };
  }

  // Get Aggregate Attendance
  getAggregateStats() {
    let totalAttended = 0;
    let totalClasses = 0;

    this.subjects.forEach(sub => {
      totalAttended += sub.attended;
      totalClasses += sub.total;
    });

    const percentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    const bunkBudget = Math.max(0, Math.floor((totalAttended - 0.75 * totalClasses) / 0.75));
    const recoveryRequired = percentage < 75 ? Math.ceil((0.75 * totalClasses - totalAttended) / (1 - 0.75)) : 0;

    return {
      percentage: Number(percentage.toFixed(1)),
      totalAttended,
      totalClasses,
      bunkBudget,
      recoveryRequired,
      isSafe: percentage >= 75
    };
  }

  // Calculate subject specific statistics
  getSubjectStats(subjectId) {
    const sub = this.subjects.find(s => s.id === subjectId) || this.subjects[0];
    const currentPercent = (sub.attended / sub.total) * 100;
    const ifAttend = ((sub.attended + 1) / (sub.total + 1)) * 100;
    const ifBunk = (sub.attended / (sub.total + 1)) * 100;

    // Consecutive classes needed to reach 75%
    let recoveryClasses = 0;
    if (currentPercent < 75) {
      recoveryClasses = Math.ceil((0.75 * sub.total - sub.attended) / 0.25);
      if (recoveryClasses < 1) recoveryClasses = 1;
    }

    // Maximum bunks allowed without dropping below 75%
    let bunkBudget = 0;
    if (currentPercent >= 75) {
      bunkBudget = Math.floor((sub.attended - 0.75 * sub.total) / 0.75);
    }

    return {
      ...sub,
      currentPercent: Number(currentPercent.toFixed(1)),
      ifAttend: Number(ifAttend.toFixed(1)),
      ifBunk: Number(ifBunk.toFixed(1)),
      recoveryClasses,
      bunkBudget,
      isSafe: currentPercent >= 75,
      deltaAttend: Number((ifAttend - currentPercent).toFixed(1)),
      deltaBunk: Number((ifBunk - currentPercent).toFixed(1))
    };
  }

  // Simulate Multi-period Scenarios
  simulateScenario(subjectId, attendCount, bunkCount) {
    const sub = this.subjects.find(s => s.id === subjectId) || this.subjects[0];
    const newAttended = sub.attended + attendCount;
    const newTotal = sub.total + attendCount + bunkCount;
    const projectedPercent = (newAttended / newTotal) * 100;

    return {
      newAttended,
      newTotal,
      projectedPercent: Number(projectedPercent.toFixed(1)),
      isSafe: projectedPercent >= 75,
      diff: Number((projectedPercent - ((sub.attended / sub.total) * 100)).toFixed(1))
    };
  }

  // Mark presence for live class
  markPresence(subjectId) {
    const sub = this.subjects.find(s => s.id === subjectId);
    if (sub) {
      sub.attended += 1;
      sub.total += 1;
      sub.status = "VERIFIED ✓";
      return true;
    }
    return false;
  }
}

window.attendanceEngine = new AttendanceEngine();
