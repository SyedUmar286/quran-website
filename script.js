let currentMode = '';
let currentReciter = 'ar.alafasy';

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
    document.getElementById('juz-list').classList.add('hidden');
    document.getElementById('viewer-section').classList.remove('hidden');
    document.getElementById('current-title').innerText = name;
    const area = document.getElementById('content-area');
    area.innerHTML = '<div style="text-align:center; padding:20px;">Quran Pak load ho raha hai...</div>';

    if(currentMode.includes('15line')) {
        // --- Digital 15-Line Coding Solution ---
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
        const data = await res.json();
        
        // CSS for 15-line look
        let style = `
            <style>
                .mushaf-container {
                    background: #fff9e6;
                    color: #000;
                    padding: 30px 20px;
                    border: 15px solid #064e3b;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.2);
                    font-family: 'Amiri', serif;
                    line-height: 2.5;
                    text-align: center;
                    font-size: 24px;
                    word-spacing: 5px;
                    direction: rtl;
                }
                .ayah-num {
                    display: inline-block;
                    width: 30px;
                    height: 30px;
                    border: 1px solid #d4af37;
                    border-radius: 50%;
                    font-size: 14px;
                    line-height: 30px;
                    margin: 0 5px;
                    color: #d4af37;
                }
            </style>
        `;

        let content = data.data.ayahs.map(a => `${a.text} <span class="ayah-num">${a.numberInSurah}</span>`).join(' ');
        
        area.innerHTML = style + `<div class="mushaf-container">${content}</div>`;
        
    } else {
        // --- Urdu + Tafseer Mode (UNCHANGED) ---
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
