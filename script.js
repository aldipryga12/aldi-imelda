const config = window.WEDDING_CONFIG;
const bride = config.couple.bride;
const groom = config.couple.groom;
const weddingDate = new Date(config.weddingDate);

const $ = (id) => document.getElementById(id);
const cover = $('cover');
const mainContent = $('mainContent');
const openInvitation = $('openInvitation');
const music = $('bgMusic');
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

  document.querySelectorAll('[data-venue]').forEach((el) => {
    el.innerHTML = `${config.venue.name}<br>${config.venue.city}`;
  });
  $('mapsBtn').href = config.venue.mapsUrl;

  const source = music.querySelector('source');
  source.src = config.musicFile;
  music.load();
}

applyConfig();

const params = new URLSearchParams(window.location.search);
const guest = params.get('to');
if (guest) guestName.textContent = guest;

openInvitation.addEventListener('click', async () => {
  cover.style.display = 'none';
  mainContent.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  try {
    await music.play();
    musicBtn.classList.add('playing');
  } catch (_) {}
});

musicBtn.addEventListener('click', async () => {
  if (music.paused) {
    try {
      await music.play();
      musicBtn.classList.add('playing');
    } catch (_) {}
  } else {
    music.pause();
    musicBtn.classList.remove('playing');
  }
});

function updateCountdown() {
  const diff = weddingDate - new Date();
  const el = (id) => $(id);
  if (diff <= 0) {
    ['days', 'hours', 'minutes', 'seconds'].forEach((id) => { el(id).textContent = '00'; });
    return;
  }
  el('days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
  el('hours').textContent = String(Math.floor((diff / 3600000) % 24)).padStart(2, '0');
  el('minutes').textContent = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
  el('seconds').textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
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
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    status.textContent = 'Terima kasih, konfirmasimu sudah terkirim.';
    e.target.reset();
  } catch (error) {
    console.error(error);
    status.textContent = 'RSVP belum berhasil dikirim. Silakan coba lagi.';
  } finally {
    submitBtn.disabled = false;
  }
});

$('shareBtn').addEventListener('click', () => {
  const text = encodeURIComponent(`${bride.shortName} & ${groom.shortName} mengundang Anda ke hari bahagia kami. ${window.location.href}`);
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
});

function toICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

$('calendarBtn').addEventListener('click', () => {
  const start = new Date(config.weddingDate);
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Undangan Digital//ID',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:Pernikahan ${bride.shortName} & ${groom.shortName}`,
    `LOCATION:${config.venue.name}, ${config.venue.city}`,
    `DESCRIPTION:Akad dan resepsi pernikahan ${bride.shortName} & ${groom.shortName}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bride.shortName.toLowerCase()}-${groom.shortName.toLowerCase()}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
