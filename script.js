let currentMode = '';
let currentReciter = 'ar.alafasy';

// Para Names in Urdu/Arabic
const juzNames = ["آلم (1)", "سیقول (2)", "تلك الرسل (3)", "لن تنالوا (4)", "والمحصنت (5)", "لا یحب اللہ (6)", "و اذا سمعوا (7)", "ولو اننا (8)", "قال الملا (9)", "واعلموا (10)", "یعتذرون (11)", "وما من دابة (12)", "وما ابری (13)", "ربما (14)", "سبحن الذی (15)", "قال الم الم (16)", "اقترب للناس (17)", "قد افلح (18)", "وقال الذین (19)", "امن خلق (20)", "اتل ما اوحی (21)", "ومن یقنت (22)", "وما لی (23)", "فمن اظلم (24)", "الیہ یرد (25)", "حم (26)", "قال فما خطبکم (27)", "قد سمع اللہ (28)", "تبارك الذی (29)", "عم (30)"];

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
        document.getElementById('prayer-times').innerHTML = `Fajr: ${t.Fajr}<br>Isha: ${t.Isha}`;
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
        html += `<div class="surah-card" onclick="loadJuz(${i})"><h3>${juzNames[i-1]}</h3></div>`;
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
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
        const data = await res.json();
        const ayahs = data.data.ayahs;
        
        // Surah Header (Name + Bismillah)
        let surahHeader = `
            <div class="surah-intro">
                <div class="surah-title-frame">${name}</div>
                <div class="bismillah">بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ</div>
            </div>
        `;

        let pagesHtml = surahHeader;
        let currentAyahs = [];
        
        for (let i = 0; i < ayahs.length; i++) {
            currentAyahs.push(ayahs[i]);
            // Har 15 ayats par page break
            if (currentAyahs.length === 15 || i === ayahs.length - 1) {
                pagesHtml += `
                    <div class="mushaf-page">
                        <div class="mushaf-content">
                            ${currentAyahs.map(a => `${a.text} <span class="ayah-num">﴿${a.numberInSurah}﴾</span>`).join(' ')}
                        </div>
                        <div class="page-footer">Page Ends Here</div>
                    </div>
                `;
                currentAyahs = [];
            }
        }

        area.innerHTML = `
            <style>
                .surah-intro { text-align: center; margin-bottom: 30px; }
                .surah-title-frame { 
                    display: inline-block; padding: 10px 40px; border: 3px double #d4af37; 
                    font-size: 30px; font-family: 'Amiri'; color: #064e3b; background: #fff; border-radius: 50px;
                }
                .bismillah { font-size: 35px; font-family: 'Amiri'; margin-top: 20px; color: #000; }
                .mushaf-page {
                    background: #fff; color: #000; margin: 30px auto; padding: 50px 40px;
                    max-width: 900px; min-height: 800px; border: 1px solid #ccc;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); position: relative; direction: rtl;
                    display: flex; flex-direction: column; justify-content: space-between;
                }
                .mushaf-content {
                    font-family: 'Amiri', serif; font-size: 28px; line-height: 2.3;
                    text-align: justify; text-justify: inter-word; /* This fits text to page width */
                }
                .page-footer {
                    text-align: center; font-size: 13px; color: #999;
                    border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px;
                }
                .ayah-num { color: #d4af37; font-size: 22px; margin-right: 5px; }
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
    loadContent(id, juzNames[id-1]);
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
