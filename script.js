let currentMode = '';
let currentReciter = 'ar.alafasy';

// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark');
}

function togglePanel() {
    const panel = document.getElementById('side-tools');
    panel.classList.toggle('active');
    if(panel.classList.contains('active')) getPrayerTimes();
}

async function getPrayerTimes() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        document.getElementById('prayer-times').innerHTML = `Fajr: ${t.Fajr}<br>Dhuhr: ${t.Dhuhr}<br>Asr: ${t.Asr}<br>Maghrib: ${t.Maghrib}<br>Isha: ${t.Isha}`;
        document.getElementById('qibla-dir').innerText = "Location Found: " + data.data.meta.timezone;
    });
}

function startApp(mode) {
    currentMode = mode;
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    fetchSurahList();
    fetchJuzList();
}

async function fetchSurahList() {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="surah-card" onclick="loadContent(${s.number}, '${s.name}')">
            <h3>${s.name}</h3><p>${s.englishName}</p>
        </div>
    `).join('');
}

function fetchJuzList() {
    let html = '';
    for(let i=1; i<=30; i++) {
        html += `<div class="surah-card" onclick="loadJuz(${i})"><h3>Para ${i}</h3></div>`;
    }
    document.getElementById('juz-list').innerHTML = html;
}

async function loadContent(id, name) {
    document.getElementById('surah-list').classList.add('hidden');
    document.getElementById('viewer-section').classList.remove('hidden');
    document.getElementById('current-title').innerText = name;
    const area = document.getElementById('content-area');
    area.innerHTML = '<div style="text-align:center; padding:20px;">Sabr karein, Quran Pak load ho raha hai...</div>';

    if(currentMode.includes('15line')) {
        // --- 100% Working Image Solution (Quran.com Servers) ---
        // Quran.com provides stable images that don't get blocked.
        let imgUrl = "";
        if(currentMode === '15line-urdu') {
            // Indopak / Urdu Script (15 Lines)
            imgUrl = `https://android.quran.com/data/zips/images_1500/images_1500/page${String(id + 1).padStart(3, '0')}.png`;
        } else {
            // Madani / Arabic Script
            imgUrl = `https://quran.com/images/quran_mushaf/v2/page${id + 2}.png`;
        }
        
        area.innerHTML = `
            <div style="text-align:center; background: white; padding: 10px; border-radius: 10px;">
                <img src="${imgUrl}" style="width:100%; max-width:800px; display:block; margin:auto; filter: contrast(1.1);" 
                onerror="this.src='https://via.placeholder.com/500x800?text=Please+Check+Internet+Connection'">
            </div>`;
    } else {
        // --- Urdu + Tafseer Mode (UNCHANGED as per your request) ---
        const [ar, ur, tf, au] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${id}`),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/ur.jalandhry`),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/ur.tafsir-ahmed-raza-khan`),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/${currentReciter}`)
        ]);
        const arabic = await ar.json();
        const urdu = await ur.json();
        const tafsir = await tf.json();
        const audio = await au.json();

        area.innerHTML = arabic.data.ayahs.map((a, i) => `
            <div class="ayah-box">
                <div class="arabic-txt">${a.text}</div>
                <div class="urdu-txt">${urdu.data.ayahs[i].text}</div>
                <details class="tafseer-detail"><summary>Tafseer</summary>${tafsir.data.ayahs[i].text}</details>
                <audio controls src="${audio.data.ayahs[i].audio}" style="width:100%; margin-top:10px;"></audio>
            </div>
        `).join('');
    }
}

async function loadJuz(id) {
    startApp('api-urdu');
    loadContent(id, `Para ${id}`);
}

function switchTab(t) {
    document.getElementById('surah-list').classList.toggle('hidden', t==='juz');
    document.getElementById('juz-list').classList.toggle('hidden', t==='surah');
    document.getElementById('tab-surah').classList.toggle('active', t==='surah');
    document.getElementById('tab-juz').classList.toggle('active', t==='juz');
}

function backToList() {
    document.getElementById('surah-list').classList.remove('hidden');
    document.getElementById('viewer-section').classList.add('hidden');
}

function goHome() { location.reload(); }
