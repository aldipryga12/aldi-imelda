const config = window.WEDDING_CONFIG;
const bride = config.couple.bride;
const groom = config.couple.groom;
const weddingDate = new Date(config.weddingDate);
const $ = (id) => document.getElementById(id);
const cover = $('cover');
const mainContent = $('mainContent');
const openInvitation = $('openInvitation');
const musicBtn = $('musicBtn');
const guestName = $('guestName');

function applyConfig() {
  document.title = `Undangan Pernikahan — ${bride.shortName} & ${groom.shortName}`;
  document.querySelector('meta[name="description"]').setAttribute('content', `Undangan pernikahan digital ${bride.shortName} & ${groom.shortName}`);
  document.querySelectorAll('[data-couple]').forEach((el) => { el.textContent = `${bride.shortName} & ${groom.shortName}`; });
  document.querySelectorAll('[data-date]').forEach((el) => { el.textContent = config.displayDate; });
  $('brideName').textContent = bride.fullName;
  $('brideParents').textContent = bride.parents;
  $('brideInstagram').textContent = bride.instagram;
  $('brideInstagram').href = bride.instagramUrl;
  $('brideAvatar').textContent = bride.shortName.charAt(0);
  $('groomName').textContent = groom.fullName;
  $('groomParents').textContent = groom.parents;
  $('groomInstagram').textContent = groom.instagram;
  $('groomInstagram').href = groom.instagramUrl;
  $('groomAvatar').textContent = groom.shortName.charAt(0);
  $('ceremonyTitle').textContent = config.events.ceremony.title;
  $('ceremonyTime').textContent = config.events.ceremony.time;
  $('receptionTitle').textContent = config.events.reception.title;
  $('receptionTime').textContent = config.events.reception.time;
  document.querySelectorAll('[data-venue]').forEach((el) => { el.innerHTML = `${config.venue.name}<br>${config.venue.city}`; });
  $('mapsBtn').href = config.venue.mapsUrl;
}
applyConfig();

const params = new URLSearchParams(window.location.search);
const guest = params.get('to');
if (guest) {
  guestName.textContent = guest;
  if ($('name')) $('name').value = guest;
}

let audioCtx = null;
let masterGain = null;
let musicTimer = null;
let isMusicPlaying = false;
let step = 0;

const progression = [
  [261.63, 329.63, 392.00],
  [220.00, 261.63, 329.63],
  [174.61, 220.00, 261.63],
  [196.00, 246.94, 293.66]
];
const melody = [523.25, 493.88, 440.00, 392.00, 440.00, 493.88, 523.25, 659.25, 587.33, 523.25, 493.88, 440.00, 392.00, 329.63, 392.00, 440.00];

function ensureAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('AudioContext tidak didukung');
  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.24;
  masterGain.connect(audioCtx.destination);
}

function tone(freq, start, duration, volume = 0.18, type = 'sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(filter).connect(gain).connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function schedulePhrase() {
  if (!isMusicPlaying || !audioCtx) return;
  const now = audioCtx.currentTime + 0.05;
  const chord = progression[Math.floor(step / 4) % progression.length];
  chord.forEach((freq, i) => tone(freq, now + i * 0.12, 2.3, 0.12, i === 0 ? 'triangle' : 'sine'));
  tone(chord[0] / 2, now, 2.7, 0.16, 'sine');
  tone(melody[step % melody.length], now + 0.18, 1.3, 0.22, 'sine');
  if (step % 2 === 1) tone(melody[(step + 2) % melody.length], now + 0.85, 0.95, 0.13, 'triangle');
  step += 1;
}

async function startMusic() {
  ensureAudio();
  if (audioCtx.state !== 'running') await audioCtx.resume();
  if (isMusicPlaying) return;
  isMusicPlaying = true;
  musicBtn.classList.add('playing');
  musicBtn.textContent = '♫';
  schedulePhrase();
  musicTimer = setInterval(schedulePhrase, 1500);
}

function stopMusic() {
  isMusicPlaying = false;
  musicBtn.classList.remove('playing');
  musicBtn.textContent = '♪';
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (masterGain && audioCtx) {
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05);
    setTimeout(() => { if (masterGain && audioCtx) masterGain.gain.value = 0.24; }, 250);
  }
}

openInvitation.addEventListener('click', async () => {
  cover.style.display = 'none';
  mainContent.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  try { await startMusic(); } catch (err) { console.warn('Musik tidak dapat dimulai:', err); }
});

musicBtn.addEventListener('click', async () => {
  if (isMusicPlaying) stopMusic();
  else {
    try { await startMusic(); } catch (err) { console.warn('Musik tidak dapat dimulai:', err); }
  }
});

function updateCountdown() {
  const diff = weddingDate - new Date();
  if (diff <= 0) {
    ['days','hours','minutes','seconds'].forEach((id) => { $(id).textContent = '00'; });
    return;
  }
  $('days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
  $('hours').textContent = String(Math.floor((diff / 3600000) % 24)).padStart(2, '0');
  $('minutes').textContent = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
  $('seconds').textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

$('rsvpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = $('rsvpStatus');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const formData = new FormData(e.target);
  formData.set('form-name', 'rsvp');
  formData.set('guestFromLink', guest || '');
  formData.set('timestamp', new Date().toISOString());
  submitBtn.disabled = true;
  status.textContent = 'Mengirim konfirmasi...';
  try {
    const body = new URLSearchParams(formData).toString();
    const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    status.textContent = 'Terima kasih, konfirmasimu sudah terkirim.';
    e.target.reset();
    if (guest) $('name').value = guest;
  } catch (error) {
    console.error(error);
    status.textContent = 'RSVP belum berhasil dikirim. Silakan coba lagi.';
  } finally { submitBtn.disabled = false; }
});

$('shareBtn').addEventListener('click', () => {
  const text = encodeURIComponent(`${bride.shortName} & ${groom.shortName} mengundang Anda ke hari bahagia kami. ${window.location.href}`);
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
});

function toICSDate(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
$('calendarBtn').addEventListener('click', () => {
  const start = new Date(config.weddingDate);
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Undangan Digital//ID','BEGIN:VEVENT',`DTSTART:${toICSDate(start)}`,`DTEND:${toICSDate(end)}`,`SUMMARY:Pernikahan ${bride.shortName} & ${groom.shortName}`,`LOCATION:${config.venue.name}, ${config.venue.city}`,`DESCRIPTION:Akad dan resepsi pernikahan ${bride.shortName} & ${groom.shortName}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bride.shortName.toLowerCase()}-${groom.shortName.toLowerCase()}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});