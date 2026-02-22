let currentMode = '';
let currentReciter = 'ar.alafasy';

const juzNames = ["آلم (1)", "سیقول (2)", "تلك الرسل (3)", "لن تنallwa (4)", "والمحصنت (5)", "لا یحب اللہ (6)", "و اذا سمعوا (7)", "ولو اننا (8)", "قال الملا (9)", "واعلموا (10)", "یعتذرون (11)", "وما من دابة (12)", "وما ابری (13)", "ربما (14)", "سبحن الذی (15)", "قال الم الم (16)", "اقترب للناس (17)", "قد افلح (18)", "وقال الذین (19)", "امن خلق (20)", "اتل ما اوحی (21)", "ومن یقنت (22)", "وما لی (23)", "فمن اظلم (24)", "الیہ یرد (25)", "حم (26)", "قال فما خطبکم (27)", "قد سمع اللہ (28)", "تبارك الذی (29)", "عم (30)"];

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
        // --- Smart Digital 15-Line Mushaf ---
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
        const data = await res.json();
        const ayahs = data.data.ayahs;
        
        let headerHtml = `
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="display:inline-block; border: 2px solid #064e3b; padding: 5px 30px; border-radius: 20px; font-family: 'Amiri'; font-size: 28px; background: #f0fdf4;">${name}</div>
                <div style="font-family: 'Amiri'; font-size: 32px; margin-top: 15px; color: #000;">بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ</div>
            </div>
        `;

        let pagesHtml = headerHtml;
        let ayahsPerPage = 7; // Average ayats per page to maintain 15 lines look

        for (let i = 0; i < ayahs.length; i += ayahsPerPage) {
            let pageAyahs = ayahs.slice(i, i + ayahsPerPage);
            pagesHtml += `
                <div class="mushaf-page" style="background: #fff9e6; padding: 35px; margin: 20px auto; border: 15px double #064e3b; max-width: 800px; min-height: 950px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); direction: rtl; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-family: 'Amiri', serif; font-size: 30px; line-height: 2.4; text-align: justify; text-justify: inter-word; color: #1a1a1a;">
                        ${pageAyahs.map(a => `${a.text} <span style="color: #d4af37; font-size: 22px;">﴿${a.numberInSurah}﴾</span>`).join(' ')}
                    </div>
                    <div style="text-align: center; color: #064e3b; font-size: 14px; border-top: 2px solid #d4af37; padding-top: 10px; font-weight: bold;">
                         Page Ends Here
                    </div>
                </div>
            `;
        }
        area.innerHTML = pagesHtml;

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
            <div class="ayah-box" style="background: white; margin: 15px; padding: 25px; border-radius: 12px; direction: rtl; border-left: 6px solid #064e3b; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="font-size: 28px; margin-bottom: 15px; font-family: 'Amiri'; line-height: 1.8;">${a.text}</div>
                <div style="color: #064e3b; margin-bottom: 12px; font-size: 19px; line-height: 1.6;">${urdu.data.ayahs[i].text}</div>
                <details style="font-size: 15px;"><summary style="cursor:pointer; color: #d4af37; font-weight: bold;">Tafseer</summary><div style="padding: 15px; background: #fcfcfc; border-radius: 8px; margin-top: 10px; line-height: 1.6;">${tafsir.data.ayahs[i].text}</div></details>
                <audio controls src="${audio.data.ayahs[i].audio}" style="width: 100%; margin-top: 20px; height: 40px;"></audio>
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
    if(document.getElementById('tab-surah')) {
        document.getElementById('surah-list').classList.remove('hidden');
    }
}

function goHome() { location.reload(); }
