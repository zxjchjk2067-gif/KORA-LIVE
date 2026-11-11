// js/app.js
import { db, rtdb, auth } from './firebase-config.js';
import {
  collection, query, where, orderBy, limit, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  ref, onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ============ Helpers ============
const $ = (sel) => document.querySelector(sel);
const statusLabel = {
  live: 'مباشر', first_half: 'الشوط الأول', halftime: 'استراحة',
  second_half: 'الشوط الثاني', finished: 'انتهت', upcoming: 'قادمة'
};
const statusClass = (s) => s === 'live' || s==='first_half' || s==='second_half' ? 'status-live'
  : s==='finished' ? 'status-finished' : 'status-upcoming';

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit' });
}
function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('ar-EG', { day:'numeric', month:'short' });
}

// ============ Match Card ============
function matchCard(m) {
  const status = m.matchStatus || 'upcoming';
  const showScore = ['live','first_half','halftime','second_half','finished'].includes(status);
  const score = showScore ? `${m.homeScore ?? 0} - ${m.awayScore ?? 0}` : formatTime(m.startTime);
  return `
    <div class="match-card" onclick="location.href='match.html?id=${m.id}'">
      <div class="match-league">
        <span>${m.leagueName || 'دوري'}</span>
        <span class="match-status ${statusClass(status)}">${statusLabel[status] || status}</span>
      </div>
      <div class="match-teams">
        <div class="team">
          <div class="team-logo">${m.homeTeamLogo ? `<img src="${m.homeTeamLogo}">` : '🏠'}</div>
          <div class="team-name">${m.homeTeam || 'الفريق'}</div>
        </div>
        <div class="match-score">${score}</div>
        <div class="team">
          <div class="team-logo">${m.awayTeamLogo ? `<img src="${m.awayTeamLogo}">` : '✈️'}</div>
          <div class="team-name">${m.awayTeam || 'الفريق'}</div>
        </div>
      </div>
      <div class="match-time">${formatDate(m.startTime)} · ${formatTime(m.startTime)}</div>
    </div>`;
}

// ============ Load Live Matches (Realtime DB for speed) ============
function loadLiveMatches() {
  const liveRef = ref(rtdb, 'liveMatches');
  onValue(liveRef, (snap) => {
    const data = snap.val() || {};
    const list = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    const el = $('#liveMatches');
    if (!list.length) {
      el.innerHTML = '<div class="empty" style="grid-column:1/-1">لا توجد مباريات مباشرة الآن</div>';
      return;
    }
    el.innerHTML = list.map(matchCard).join('');
  });
}

// ============ Load Today Matches ============
async function loadTodayMatches() {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);
    const q = query(
      collection(db, 'matches'),
      where('startTime', '>=', startOfDay),
      where('startTime', '<=', endOfDay),
      orderBy('startTime'), limit(15)
    );
    const snap = await getDocs(q);
    const el = $('#todayMatches');
    if (snap.empty) { el.innerHTML = '<div class="empty">لا توجد مباريات اليوم</div>'; return; }
    el.innerHTML = snap.docs.map(d => {
      const m = { id:d.id, ...d.data() };
      return `<div class="match-row" onclick="location.href='match.html?id=${m.id}'">
        <span class="team-inline"><span class="mini-logo">🏠</span>${m.homeTeam||'-'}</span>
        <span class="score-box">${m.homeScore ?? 0} - ${m.awayScore ?? 0}</span>
        <span class="team-inline away">${m.awayTeam||'-'}<span class="mini-logo">✈️</span></span>
      </div>`;
    }).join('');
  } catch(e) {
    console.error(e);
    $('#todayMatches').innerHTML = '<div class="empty">تعذر تحميل المباريات</div>';
  }
}

// ============ Load News ============
async function loadNews() {
  try {
    const q = query(collection(db, 'news'), orderBy('publishedAt','desc'), limit(6));
    const snap = await getDocs(q);
    const el = $('#homeNews');
    if (snap.empty) { el.innerHTML = '<div class="empty" style="grid-column:1/-1">لا توجد أخبار بعد</div>'; return; }
    el.innerHTML = snap.docs.map(d => {
      const n = d.data();
      return `<div class="news-card" onclick="location.href='news.html?id=${d.id}'">
        <div class="news-img">${n.image ? `<img src="${n.image}">` : '📰'}</div>
        <div class="news-body">
          <h3>${n.title || 'خبر'}</h3>
          <p>${(n.description||'').slice(0,90)}...</p>
          <div class="news-meta">${n.source || ''} · ${formatDate(n.publishedAt)}</div>
        </div>
      </div>`;
    }).join('');
  } catch(e) { console.error(e); }
}

// ============ Load Leagues ============
async function loadLeagues() {
  try {
    const snap = await getDocs(query(collection(db,'leagues'), limit(10)));
    const el = $('#homeLeagues');
    if (snap.empty) { el.innerHTML = '<div class="empty">لا توجد دوريات</div>'; return; }
    el.innerHTML = snap.docs.map(d => {
      const l = d.data();
      return `<div class="league-chip" onclick="location.href='league.html?id=${d.id}'">
        <span class="lg-logo">${l.logo ? `<img src="${l.logo}" style="width:24px;height:24px;border-radius:50%">` : '🏆'}</span>
        ${l.name || 'دوري'}
      </div>`;
    }).join('');
  } catch(e) { console.error(e); }
}

// ============ Auth State ============
onAuthStateChanged(auth, user => {
  if (user) {
    $('#userBtn').textContent = '👤';
    $('#userBtn').href = 'profile.html';
  }
});

// ============ Init ============
loadLiveMatches();
loadTodayMatches();
loadNews();
loadLeagues();

// ============ Notifications (FCM) ============
$('#notifBtn')?.addEventListener('click', async () => {
  if (!('Notification' in window)) return toast('المتصفح لا يدعم الإشعارات');
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    toast('✅ تم تفعيل الإشعارات');
  } else {
    toast('❌ لم يتم تفعيل الإشعارات');
  }
});

// ============ Toast ============
export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
window.toast = toast;
