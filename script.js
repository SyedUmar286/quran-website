let currentMode = '';
let currentReciter = 'ar.alafasy';

// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    });
}

function toggleTheme() { document.body.classList.toggle('dark'); }
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
        // --- 15 Line Page Logic ---
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
        const data = await res.json();
        const ayahs = data.data.ayahs;
        
        let pagesHtml = '';
        let currentAyahs = [];
        
        // Har 15 ayats ko ek "Page" mein divide karna
        for (let i = 0; i < ayahs.length; i++) {
            currentAyahs.push(ayahs[i]);
            if (currentAyahs.length === 15 || i === ayahs.length - 1) {
                pagesHtml += `
                    <div class="mushaf-page">
                        <div class="mushaf-content">
                            ${currentAyahs.map(a => `${a.text} <span class="ayah-num">${a.numberInSurah}</span>`).join(' ')}
                        </div>
                        <div class="page-footer">Page Ends Here</div>
                    </div>
                `;
                currentAyahs = [];
            }
        }

        area.innerHTML = `
            <style>
                .mushaf-page {
                    background: #fff9e6;
                    color: #000;
                    margin: 20px auto;
                    padding: 40px;
                    max-width: 800px;
                    min-height: 1000px; /* Asli page jaisi feel */
                    border: 12px double #064e3b;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    position: relative;
                    direction: rtl;
                }
                .mushaf-content {
                    font-family: 'Amiri', serif;
                    font-size: 26px;
                    line-height: 2.2;
                    text-align: justify;
                }
                .page-footer {
                    position: absolute;
                    bottom: 10px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 12px;
                    color: #064e3b;
                    border-top: 1px solid #d4af37;
                    padding-top: 5px;
                }
                .ayah-num {
                    color: #d4af37;
                    font-size: 18px;
                    margin: 0 5px;
                    border: 1px solid #d4af37;
                    border-radius: 50%;
                    padding: 2px 6px;
                }
            </style>
            ${pagesHtml}
        `;
        
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
