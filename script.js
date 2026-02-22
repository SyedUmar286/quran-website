let currentMode = '';
let currentReciter = 'ar.alafasy';

const juzNames = ["آلم (1)", "سیقول (2)", "تلك الرسل (3)", "لن تنالوا (4)", "والمحصنت (5)", "لا یحب اللہ (6)", "و اذا سمعوا (7)", "ولو اننا (8)", "قال الملا (9)", "واعلموا (10)", "یعتذرون (11)", "وما من دابة (12)", "وما ابری (13)", "ربما (14)", "سبحن الذی (15)", "قال الم الم (16)", "اقترب للناس (17)", "قد افلح (18)", "وقال الذین (19)", "امن خلق (20)", "اتل ما اوحی (21)", "ومن یقنت (22)", "وما لی (23)", "فمن اظلم (24)", "الیہ یرد (25)", "حم (26)", "قال فما خطبکم (27)", "قد سمع اللہ (28)", "تبارك الذی (29)", "عم (30)"];

function toggleTheme() { document.body.classList.toggle('dark'); }
function togglePanel() { document.getElementById('side-tools').classList.toggle('active'); }

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
        
        // Surah Header (Name + Bismillah) - Ye alag se nazar aayega
        let headerHtml = `
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #d4af37; padding-bottom: 20px;">
                <h1 style="font-family: 'Amiri'; color: #064e3b; font-size: 40px; margin: 0;">${name}</h1>
                <h2 style="font-family: 'Amiri'; font-size: 32px; margin-top: 10px;">بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ</h2>
            </div>
        `;

        let pagesHtml = headerHtml;
        let currentAyahs = [];
        
        // Har 15 ayats ke baad page break
        for (let i = 0; i < ayahs.length; i++) {
            currentAyahs.push(ayahs[i]);
            if (currentAyahs.length === 15 || i === ayahs.length - 1) {
                pagesHtml += `
                    <div class="mushaf-page" style="background: #fff9e6; padding: 40px; margin: 20px auto; border: 10px double #064e3b; max-width: 850px; min-height: 900px; box-shadow: 0 0 20px rgba(0,0,0,0.2); direction: rtl; position: relative;">
                        <div style="font-family: 'Amiri'; font-size: 28px; line-height: 2.3; text-align: justify; text-justify: inter-word;">
                            ${currentAyahs.map(a => `${a.text} <span style="color: #d4af37; font-size: 20px;">﴿${a.numberInSurah}﴾</span>`).join(' ')}
                        </div>
                        <div style="position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 5px;">
                            --- Page Ends Here ---
                        </div>
                    </div>
                `;
                currentAyahs = [];
            }
        }
        area.innerHTML = pagesHtml;
        
    } else {
        // Urdu + Tafseer Mode (UNCHANGED)
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
            <div class="ayah-box" style="background: white; margin: 10px; padding: 20px; border-radius: 10px; direction: rtl;">
                <div style="font-size: 24px; margin-bottom: 10px;">${a.text}</div>
                <div style="color: #064e3b; margin-bottom: 10px;">${urdu.data.ayahs[i].text}</div>
                <details><summary>Tafseer</summary><div style="padding: 10px;">${tafsir.data.ayahs[i].text}</div></details>
                <audio controls src="${audio.data.ayahs[i].audio}" style="width: 100%; margin-top: 10px;"></audio>
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
}

function backToList() {
    document.getElementById('viewer-section').classList.add('hidden');
    document.getElementById('surah-list').classList.remove('hidden');
}

function goHome() { location.reload(); }
