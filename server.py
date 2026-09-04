#!/usr/bin/env python3
"""JAIN School of Future, Kochi — Attendance site + Nebula Python AI (stdlib only)."""

from __future__ import annotations

import ast
import datetime as dt
import json
import math
import mimetypes
import operator
import os
import re
import threading
import traceback
import urllib.error
import urllib.parse
import urllib.request
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8080"))
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
UA = "NebulaAI/1.0 (JAIN School of Future Kochi Attendance Portal)"

_SESSIONS: dict[str, list[dict]] = {}
_LOCK = threading.Lock()


def _http_json(url: str, timeout: float = 7.0) -> dict | list | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        return None


def _http_text(url: str, timeout: float = 12.0, data: bytes | None = None, headers: dict | None = None) -> str | None:
    hdrs = {"User-Agent": UA, "Accept": "text/plain, application/json, */*"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=data, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception:
        return None


class WeatherService:
    GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
    WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
    DEFAULT_LAT, DEFAULT_LON, DEFAULT_CITY = 9.9312, 76.2673, "Kochi"
    WMO = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Rime fog",
        51: "Light drizzle",
        53: "Drizzle",
        55: "Dense drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        80: "Rain showers",
        81: "Moderate showers",
        82: "Violent showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
    }

    @classmethod
    def coords(cls, city: str) -> tuple[float, float, str]:
        params = urllib.parse.urlencode({"name": city, "count": 1})
        data = _http_json(f"{cls.GEO_URL}?{params}", timeout=5)
        if data and data.get("results"):
            r = data["results"][0]
            return r["latitude"], r["longitude"], r.get("name", city)
        return cls.DEFAULT_LAT, cls.DEFAULT_LON, cls.DEFAULT_CITY

    @classmethod
    def report(cls, location: str = "Kochi") -> str:
        lat, lon, city = cls.coords(location)
        params = urllib.parse.urlencode(
            {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                "timezone": "Asia/Kolkata",
            }
        )
        payload = _http_json(f"{cls.WEATHER_URL}?{params}")
        if not payload:
            return f"Live weather for {location} is temporarily unreachable. Kochi campus baseline is typically 28–32°C with high humidity."
        curr = payload.get("current") or {}
        daily = payload.get("daily") or {}
        code = int(curr.get("weather_code") or 0)
        high = (daily.get("temperature_2m_max") or ["n/a"])[0]
        low = (daily.get("temperature_2m_min") or ["n/a"])[0]
        rain = (daily.get("precipitation_probability_max") or ["n/a"])[0]
        return (
            f"**Live climate — {city}** (Open-Meteo, now)\n"
            f"• Condition: {cls.WMO.get(code, 'Mixed')}\n"
            f"• Temperature: {curr.get('temperature_2m', 'n/a')}°C (feels like {curr.get('apparent_temperature', 'n/a')}°C)\n"
            f"• High / low: {high}°C / {low}°C\n"
            f"• Humidity: {curr.get('relative_humidity_2m', 'n/a')}%\n"
            f"• Wind: {curr.get('wind_speed_10m', 'n/a')} km/h\n"
            f"• Rain chance: {rain}%\n"
            f"• Coordinates: {lat:.4f} N, {lon:.4f} E"
        )


class AttendanceLedger:
    def __init__(self, student_name: str = "Akshay", reg_no: str = "JGI-BCA-2026-088"):
        self.student_name = student_name
        self.reg_no = reg_no
        self.minimum = 0.75
        self.courses = {
            "Data Structures": {"attended": 21, "conducted": 23, "room": "EB101", "code": "BCA201"},
            "Full Stack Web": {"attended": 21, "conducted": 25, "room": "EB102", "code": "BCA202"},
            "Database Systems": {"attended": 19, "conducted": 24, "room": "EB103", "code": "BCA203"},
            "Cloud DevOps": {"attended": 19, "conducted": 25, "room": "EB104", "code": "BCA204"},
            "Discrete Math": {"attended": 18, "conducted": 26, "room": "EB105", "code": "BCA205"},
        }
        self.practicum_done = 142.0
        self.practicum_target = 180.0

    def pct(self, subject: str) -> float:
        d = self.courses[subject]
        return 100.0 if d["conducted"] == 0 else round(d["attended"] / d["conducted"] * 100, 2)

    def recovery(self, subject: str) -> int:
        d = self.courses[subject]
        if d["attended"] / d["conducted"] >= self.minimum:
            return 0
        return max(0, math.ceil((self.minimum * d["conducted"] - d["attended"]) / 0.25))

    def safe_skips(self, subject: str) -> int:
        d = self.courses[subject]
        if d["attended"] / d["conducted"] < self.minimum:
            return 0
        return max(0, math.floor((d["attended"] - self.minimum * d["conducted"]) / self.minimum))

    def apply_bunk(self, subject: str) -> dict:
        old = self.pct(subject)
        self.courses[subject]["conducted"] += 1
        new = self.pct(subject)
        return {
            "subject": subject,
            "room": self.courses[subject]["room"],
            "old": old,
            "new": new,
            "attended": self.courses[subject]["attended"],
            "conducted": self.courses[subject]["conducted"],
            "recovery": self.recovery(subject),
            "safe": self.safe_skips(subject),
        }

    def report(self) -> str:
        lines = [
            f"**Attendance ledger — {self.student_name} ({self.reg_no})**",
            "Work Integrated BCA | JAIN Deemed-to-be University, School of Future, Kochi",
            "",
        ]
        ta = tc = 0
        for subj, meta in self.courses.items():
            p = self.pct(subj)
            ta += meta["attended"]
            tc += meta["conducted"]
            if p >= 75:
                extra = f"safe skips left: {self.safe_skips(subj)}"
            else:
                extra = f"must attend next {self.recovery(subj)} periods"
            lines.append(
                f"• {subj} [{meta['room']}]: {p}% ({meta['attended']}/{meta['conducted']}) — {extra}"
            )
        agg = round(ta / tc * 100, 2) if tc else 0
        lines.append("")
        lines.append(f"**Aggregate academic standing:** {ta}/{tc} ({agg}%)")
        ph = round(self.practicum_done / self.practicum_target * 100, 1)
        lines.append(
            f"**Practicum hours:** {self.practicum_done}/{self.practicum_target} ({ph}%) — 85% shift-hour rule"
        )
        return "\n".join(lines)


class EastBlock:
    ROOMS = {
        "EB101": ("Ground Wing A", "Advanced Data Structures & Algorithms", "JGI-EB1-B01"),
        "EB102": ("Ground Wing A", "Full Stack Web Architecture", "JGI-EB1-B02"),
        "EB103": ("Ground Wing A", "Relational & Distributed Databases", "JGI-EB1-B03"),
        "EB104": ("Ground Wing B", "Cloud Infrastructure & DevOps", "JGI-EB1-B04"),
        "EB105": ("Ground Wing B", "Discrete Mathematics & Logic", "JGI-EB1-B05"),
        "EB106": ("First Wing A", "Machine Learning & Applied AI", "JGI-EB1-B06"),
        "EB107": ("First Wing A", "Operating Systems & Kernel Design", "JGI-EB1-B07"),
        "EB108": ("First Wing B", "Network Security & Cryptography", "JGI-EB1-B08"),
        "EB109": ("First Wing B", "Corporate Practicum Mentorship", "JGI-EB1-B09"),
        "EB110": ("First Wing B", "Software Engineering Practicum Lab", "JGI-EB1-B10"),
    }
    SLOTS = [
        ("09:00", "09:50", "Slot 1", "EB101", "Data Structures"),
        ("09:50", "10:40", "Slot 2", "EB102", "Full Stack Web"),
        ("11:00", "11:50", "Slot 3 FN", "EB104", "Cloud DevOps"),
        ("11:50", "12:40", "Slot 4 FN", "EB103", "Database Engineering"),
        ("13:30", "14:20", "Slot 3 AN", "EB104", "Cloud Infrastructure & DevOps"),
        ("14:20", "15:10", "Slot 4 AN", "EB110", "Enterprise Software Lab"),
        ("15:10", "17:30", "Practicum", "PARTNER", "Industry Practicum"),
    ]

    @classmethod
    def room(cls, code: str) -> str:
        info = cls.ROOMS.get(code)
        if not info:
            return f"{code} is not an East Block room. Valid rooms: EB101–EB110."
        wing, course, beacon = info
        return (
            f"**{code} — East Block, {wing}**\n"
            f"• Course: {course}\n"
            f"• BLE beacon: `{beacon}`\n"
            f"• Classroom micro-zone: ≤ 30 m (RSSI ≥ −78 dBm)\n"
            f"• Campus geofence: ≤ 100 m of Jain Kochi grounds"
        )

    @classmethod
    def timetable(cls) -> str:
        now = dt.datetime.now(IST)
        clock = now.strftime("%H:%M")
        lines = [
            f"**East Block live clock:** {now.strftime('%A, %d %B %Y · %I:%M %p IST')}",
            "",
        ]
        current = None
        nxt = None
        for start, end, slot, room, course in cls.SLOTS:
            if start <= clock <= end:
                current = (start, end, slot, room, course)
            elif clock < start and nxt is None:
                nxt = (start, end, slot, room, course)
        if current:
            s, e, slot, room, course = current
            lines.append(f"**Now:** {slot} — {course} in {room} ({s}–{e}). Biometric window can be opened by faculty.")
        elif nxt:
            s, e, slot, room, course = nxt
            lines.append(f"**Next:** {slot} — {course} in {room} ({s}–{e}).")
        else:
            lines.append("No academic slot is live. Industry practicum window is 01:30–05:30 PM when scheduled.")
        lines.append("")
        lines.append("**Today's mapped periods:**")
        for s, e, slot, room, course in cls.SLOTS:
            lines.append(f"• {s}–{e} {slot}: {course} [{room}]")
        return "\n".join(lines)


class LiveFacts:
    _OPS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
        ast.Mod: operator.mod,
        ast.FloorDiv: operator.floordiv,
    }

    @classmethod
    def eval_math(cls, expr: str) -> str | None:
        cleaned = expr.strip().lower()
        cleaned = re.sub(r"^(what is|what's|calculate|compute|solve|eval)\s+", "", cleaned)
        cleaned = cleaned.replace("x", "*").replace("÷", "/").replace("^", "**")
        cleaned = cleaned.rstrip("? ").strip()
        if not re.fullmatch(r"[\d\.\+\-\*\/\(\)\s\%]+", cleaned.replace("**", "")):
            if not re.search(r"[\d\+\-\*\/]", cleaned):
                return None
        try:
            tree = ast.parse(cleaned, mode="eval")
            value = cls._eval_node(tree.body)
            if isinstance(value, float) and value.is_integer():
                value = int(value)
            return f"**{expr.strip()}**\n= `{value}`"
        except Exception:
            return None

    @classmethod
    def _eval_node(cls, node):
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in cls._OPS:
            return cls._OPS[type(node.op)](cls._eval_node(node.left), cls._eval_node(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in cls._OPS:
            return cls._OPS[type(node.op)](cls._eval_node(node.operand))
        raise ValueError("unsafe")

    @staticmethod
    def wikipedia(query: str) -> str | None:
        params = urllib.parse.urlencode(
            {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srlimit": 1,
                "format": "json",
                "utf8": 1,
            }
        )
        search = _http_json(f"https://en.wikipedia.org/w/api.php?{params}")
        hits = ((search or {}).get("query") or {}).get("search") or []
        if not hits:
            return None
        title = hits[0]["title"]
        enc = urllib.parse.quote(title.replace(" ", "_"), safe="")
        summary = _http_json(f"https://en.wikipedia.org/api/rest_v1/page/summary/{enc}")
        if not summary or not summary.get("extract"):
            return None
        extract = summary["extract"].strip()
        if len(extract) > 900:
            extract = extract[:900].rsplit(" ", 1)[0] + "…"
        url = summary.get("content_urls", {}).get("desktop", {}).get("page", "")
        extra = f"\nSource: {url}" if url else ""
        return f"**{summary.get('title', title)}**\n{extract}{extra}"

    @staticmethod
    def duckduckgo(query: str) -> str | None:
        params = urllib.parse.urlencode(
            {"q": query, "format": "json", "no_html": 1, "skip_disambig": 1}
        )
        data = _http_json(f"https://api.duckduckgo.com/?{params}")
        if not data:
            return None
        bits = []
        if data.get("AbstractText"):
            bits.append(data["AbstractText"])
            if data.get("AbstractURL"):
                bits.append(f"Source: {data['AbstractURL']}")
        elif data.get("Answer"):
            bits.append(str(data["Answer"]))
        elif data.get("Definition"):
            bits.append(data["Definition"])
        related = data.get("RelatedTopics") or []
        for item in related[:3]:
            if isinstance(item, dict) and item.get("Text"):
                bits.append("• " + item["Text"])
        if not bits:
            return None
        heading = data.get("Heading") or query
        return f"**{heading}**\n" + "\n".join(bits)

    @staticmethod
    def llm(query: str, history: list[dict]) -> str | None:
        system = (
            "You are Nebula AI, academic co-pilot for JAIN Deemed-to-be University, "
            "School of Future, Kochi, Work Integrated BCA. Answer any question clearly and correctly. "
            "For attendance use: Subject % = attended/conducted * 100; 75% academic cutoff; "
            "recovery N = ceil((0.75*conducted - attended)/0.25); safe skips = floor((attended - 0.75*conducted)/0.75). "
            "East Block rooms EB101–EB110, 100m campus / 30m classroom geofences. "
            "Keep answers concise, factual, and helpful. If unsure, say so."
        )
        messages = [{"role": "system", "content": system}]
        for turn in history[-8:]:
            messages.append(turn)
        messages.append({"role": "user", "content": query})
        payload = json.dumps(
            {"model": "openai", "messages": messages, "temperature": 0.3}
        ).encode()
        body = _http_text(
            "https://text.pollinations.ai/openai",
            timeout=18,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        if body:
            try:
                parsed = json.loads(body)
                text = (
                    parsed.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content")
                )
                if text and text.strip():
                    return text.strip()
            except Exception:
                if body.strip() and not body.strip().startswith("{"):
                    return body.strip()[:2500]
        encoded = urllib.parse.quote(query[:800])
        plain = _http_text(f"https://text.pollinations.ai/{encoded}", timeout=16)
        if plain and len(plain.strip()) > 8:
            return plain.strip()[:2500]
        return None


LEDGER = AttendanceLedger()


class NebulaBot:
    WEATHER_WORDS = (
        "weather",
        "temperature",
        "climate",
        "rain",
        "forecast",
        "humidity",
        "wind",
        "hot",
        "cold",
    )
    ATTEND_WORDS = (
        "attendance",
        "percentage",
        "roster",
        "eligibility",
        "debar",
        "bunk",
        "safe skip",
        "my subjects",
        "subject attendance",
    )
    TIME_WORDS = ("time", "date", "today", "clock", "ist", "what day")
    SCHED_WORDS = (
        "timetable",
        "schedule",
        "next class",
        "current class",
        "where is my class",
        "period",
        "slot",
    )

    def match_course(self, query: str) -> str | None:
        q = query.lower()
        aliases = {
            "Data Structures": ("data structure", "dsa", "eb101", "bca201"),
            "Full Stack Web": ("full stack", "web", "eb102", "bca202"),
            "Database Systems": ("database", "dbms", "sql", "eb103", "bca203"),
            "Cloud DevOps": ("cloud", "devops", "eb104", "bca204"),
            "Discrete Math": ("discrete", "math", "mathematics", "eb105", "bca205"),
        }
        for name, keys in aliases.items():
            if name.lower() in q or any(k in q for k in keys):
                return name
        return None

    def academic(self, query: str) -> str | None:
        q = query.lower()
        course = self.match_course(query)

        if any(p in q for p in ("can i bunk", "should i bunk", "can i skip", "what if i bunk", "bunk cut")):
            if not course:
                return "Which subject? Try: Cloud DevOps, Discrete Math, Data Structures, Full Stack Web, or Database Systems."
            data = LEDGER.courses[course]
            current = LEDGER.pct(course)
            projected_c = data["conducted"] + 1
            projected = round(data["attended"] / projected_c * 100, 2)
            if projected >= 75:
                return (
                    f"**Bunk simulation — {course} [{data['room']}]**\n"
                    f"• Current: {current}% ({data['attended']}/{data['conducted']})\n"
                    f"• If you skip this period: **{projected}%** ({data['attended']}/{projected_c})\n"
                    f"• Verdict: still above 75%. Safe skips after that: {max(0, math.floor((data['attended'] - 0.75 * projected_c) / 0.75))}"
                )
            rec = math.ceil((0.75 * projected_c - data["attended"]) / 0.25)
            return (
                f"**Do not bunk {course}.**\n"
                f"• Current: {current}% ({data['attended']}/{data['conducted']})\n"
                f"• After a skip: **{projected}%** — below the 75% cutoff (debarment alert).\n"
                f"• Recovery: attend the next **{rec}** consecutive periods."
            )

        if q.startswith("bunk ") or "record bunk" in q or q.startswith("cut "):
            if not course:
                return "Name the subject to record a bunk, e.g. `bunk Cloud DevOps`."
            r = LEDGER.apply_bunk(course)
            return (
                f"**Instant bunk cut recorded — {r['subject']} ({r['room']})**\n"
                f"• {r['old']}% → **{r['new']}%** ({r['attended']}/{r['conducted']})\n"
                f"• Recovery periods: {r['recovery']} · Safe skips: {r['safe']}"
            )

        if "recover" in q or ("how many" in q and course):
            subj = course or "Discrete Math"
            p = LEDGER.pct(subj)
            n = LEDGER.recovery(subj)
            d = LEDGER.courses[subj]
            if n == 0:
                return f"**{subj}** is {p}% ({d['attended']}/{d['conducted']}). You are already at or above 75%. Safe skips: {LEDGER.safe_skips(subj)}."
            return (
                f"**{subj} recovery**\n"
                f"• Now: {p}% ({d['attended']}/{d['conducted']})\n"
                f"• Formula: N = ceil((0.75 × conducted − attended) / 0.25)\n"
                f"• Attend the next **{n}** consecutive periods to reach 75%."
            )

        room = re.search(r"\b(eb\s*10[1-9]|eb\s*110)\b", q, re.I)
        if room or "east block" in q or "classroom" in q:
            if room:
                return EastBlock.room(room.group(1).replace(" ", "").upper())
            return (
                "**East Block EB101–EB110**\n"
                "• Wing A ground: EB101–EB103 · Wing B ground: EB104–EB105\n"
                "• Wing A first: EB106–EB107 · Wing B first: EB108–EB110\n"
                "• 100 m campus geofence + 30 m BLE classroom micro-zone"
            )

        if any(w in q for w in self.SCHED_WORDS) or "where is my class" in q:
            return EastBlock.timetable()

        if any(w in q for w in ("practicum", "internship", "work integrated", "shift hour")):
            done, target = LEDGER.practicum_done, LEDGER.practicum_target
            pct = round(done / target * 100, 1)
            return (
                f"**Workplace practicum ledger**\n"
                f"• Hours: {done}/{target} ({pct}%) — minimum 85% of shift hours\n"
                f"• Window: 01:30 PM – 05:30 PM (partner campus GPS + biometrics)\n"
                f"• Remaining: {target - done:.0f} hours"
            )

        if any(w in q for w in self.ATTEND_WORDS) or "my subjects" in q:
            if course:
                d = LEDGER.courses[course]
                p = LEDGER.pct(course)
                return (
                    f"**{course} [{d['room']}]**\n"
                    f"• {p}% ({d['attended']}/{d['conducted']})\n"
                    f"• Recovery periods: {LEDGER.recovery(course)}\n"
                    f"• Safe skips: {LEDGER.safe_skips(course)}"
                )
            return LEDGER.report()
        return None

    def reply(self, user_text: str, session_id: str) -> dict:
        q = user_text.strip()
        low = q.lower()
        sources: list[str] = ["nebula-python"]

        if any(g in low for g in ("hello", "hi nebula", "hey", "good morning", "good afternoon", "who are you")):
            text = (
                "I am **Nebula AI**, the Python assistant for JAIN School of Future, Kochi "
                "(Work Integrated BCA). Ask attendance, bunk math, East Block rooms, live weather, "
                "the clock, or any general question — I look up live sources when needed."
            )
            self._remember(session_id, q, text)
            return {"reply": text, "sources": sources, "mode": "intro"}

        if any(w in low for w in self.TIME_WORDS) and not any(
            w in low for w in ("timetable", "schedule", "class", "period")
        ):
            now = dt.datetime.now(IST)
            text = f"**Live IST clock:** {now.strftime('%A, %d %B %Y, %I:%M:%S %p')} (UTC+5:30)."
            self._remember(session_id, q, text)
            return {"reply": text, "sources": sources + ["system-clock"], "mode": "time"}

        if any(w in low for w in self.WEATHER_WORDS):
            city_m = re.search(r"(?:in|at|for)\s+([A-Za-z][A-Za-z\s]{1,40})", q)
            city = (city_m.group(1) if city_m else "Kochi").strip()
            city = re.sub(r"\b(today|tomorrow|now|please|right now)\b", "", city, flags=re.I).strip() or "Kochi"
            text = WeatherService.report(city)
            self._remember(session_id, q, text)
            return {"reply": text, "sources": sources + ["open-meteo"], "mode": "weather"}

        academic = self.academic(q)
        if academic:
            self._remember(session_id, q, academic)
            return {"reply": academic, "sources": sources + ["attendance-ledger"], "mode": "academic"}

        math_out = LiveFacts.eval_math(q)
        if math_out:
            self._remember(session_id, q, math_out)
            return {"reply": math_out, "sources": sources + ["python-eval"], "mode": "math"}

        wiki = LiveFacts.wikipedia(q)
        ddg = LiveFacts.duckduckgo(q)
        history = self._history(session_id)
        llm = LiveFacts.llm(q, history)

        chunks = [c for c in (llm, wiki, ddg) if c]
        if chunks:
            # Prefer the live LLM answer; attach encyclopedia facts when they add unique detail.
            text = chunks[0]
            if llm and wiki and wiki.split("\n")[0] not in llm:
                text = llm + "\n\n—\n" + wiki
                sources.extend(["pollinations-llm", "wikipedia"])
            elif llm:
                sources.append("pollinations-llm")
            elif wiki:
                sources.append("wikipedia")
                text = wiki
            elif ddg:
                sources.append("duckduckgo")
                text = ddg
            self._remember(session_id, q, text)
            return {"reply": text, "sources": sources, "mode": "live"}

        text = (
            "I could not reach live knowledge APIs just now. Try again, or ask about attendance, "
            "East Block rooms, timetable, weather in Kochi, or a math expression."
        )
        self._remember(session_id, q, text)
        return {"reply": text, "sources": sources, "mode": "offline"}

    def _history(self, session_id: str) -> list[dict]:
        with _LOCK:
            return list(_SESSIONS.get(session_id, []))

    def _remember(self, session_id: str, user: str, assistant: str) -> None:
        with _LOCK:
            buf = _SESSIONS.setdefault(session_id, [])
            buf.append({"role": "user", "content": user})
            buf.append({"role": "assistant", "content": assistant})
            _SESSIONS[session_id] = buf[-16:]


BOT = NebulaBot()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("[nebula] " + (fmt % args) + "\n")

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/api/health":
            now = dt.datetime.now(IST).isoformat()
            return self._json(200, {"ok": True, "engine": "nebula-python", "ist": now})
        super().do_GET()

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        if path not in ("/api/chat", "/api/nebula", "/api/v1/nebula/chat"):
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return self._json(400, {"error": "Invalid JSON"})
        message = str(body.get("message") or body.get("query") or "").strip()
        session_id = str(body.get("session_id") or uuid.uuid4())
        if not message:
            return self._json(400, {"error": "message is required"})
        try:
            result = BOT.reply(message, session_id)
            result["session_id"] = session_id
            self._json(200, result)
        except Exception:
            traceback.print_exc()
            self._json(500, {"error": "Nebula engine failed", "reply": "Internal error. Retry shortly."})

    def _json(self, code: int, payload: dict) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def guess_type(self, path):
        ctype = super().guess_type(path)
        extra = {
            ".js": "application/javascript",
            ".css": "text/css",
            ".html": "text/html",
            ".json": "application/json",
        }
        return extra.get(Path(path).suffix.lower(), ctype)


def main() -> None:
    mimetypes.init()
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Nebula Python attendance portal: http://127.0.0.1:{PORT}/")
    print("Chat API: POST /api/chat  {\"message\": \"...\"}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        httpd.server_close()


if __name__ == "__main__":
    main()
