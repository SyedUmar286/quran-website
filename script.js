let currentMode = '';
let currentReciter = 'ar.alafasy';

const juzNames = ["آلم (1)", "سیقول (2)", "تلك الرسل (3)", "لن تنالوا (4)", "والمحصنت (5)", "لا یحب اللہ (6)", "و اذا سمعوا (7)", "ولو اننا (8)", "قال الملا (9)", "واعلموا (10)", "یعتذرون (11)", "وما من دابة (12)", "وما ابری (13)", "ربما (14)", "سبحن الذی (15)", "قال الم الم (16)", "اقترب للناس (17)", "قد افلح (18)", "وقال الذین (19)", "امن خلق (20)", "اتل ما اوحی (21)", "ومن یقنت (22)", "وما لی (23)", "فمن اظلم (24)", "الیہ یرد (25)", "حم (26)", "قال فما خطبکم (27)", "قد سمع اللہ (28)", "تبارك الذی (29)", "عم (30)"];

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
    area.innerHTML = '<div style="text-align:center; padding:20px;">Har Ayat ko uske sahi Page par set kiya ja raha hai...</div>';

    if(currentMode.includes('15line')) {
        // --- 15-Line Page Mapping Logic ---
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
        const data = await res.json();
        const ayahs = data.data.ayahs;
        
        let pagesHtml = '';
        let currentPageNum = ayahs[0].page;
        let pageContent = '';

        // Surah Header
        pagesHtml += `
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; border: 4px double #064e3b; background: #f0fdf4; border-radius: 15px;">
                <h1 style="font-family: 'Amiri'; font-size: 35px; color: #064e3b; margin:0;">${name}</h1>
                <h2 style="font-family: 'Amiri'; font-size: 30px; margin-top: 10px;">بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ</h2>
            </div>
        `;

        ayahs.forEach((a, index) => {
            // Agar ayat ka page number badal gaya hai, toh purana page band karo aur naya shuru karo
            if (a.page !== currentPageNum) {
                pagesHtml += renderMushafPage(pageContent, currentPageNum);
                pageContent = '';
                currentPageNum = a.page;
            }
            
            pageContent += `${a.text} <span style="color: #d4af37; font-size: 20px;">﴿${a.numberInSurah}﴾</span> `;
            
            // Akhri ayat par page close karein
            if (index === ayahs.length - 1) {
                pagesHtml += renderMushafPage(pageContent, currentPageNum);
            }
        });

        area.innerHTML = pagesHtml;

    } else {
        // Urdu + Tafseer Mode (Stayed Same)
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
            <div class="ayah-box" style="background: white; margin: 15px; padding: 20px; border-radius: 10px; direction: rtl; border-right: 6px solid #064e3b;">
                <div style="font-size: 26px; margin-bottom: 15px; font-family: 'Amiri';">${a.text}</div>
                <div style="color: #064e3b; margin-bottom: 10px; font-size: 18px;">${urdu.data.ayahs[i].text}</div>
                <details><summary style="cursor:pointer; color: #d4af37;">Tafseer</summary><div style="padding: 10px;">${tafsir.data.ayahs[i].text}</div></details>
                <audio controls src="${audio.data.ayahs[i].audio}" style="width: 100%; margin-top: 15px;"></audio>
            </div>
        `).join('');
    }
}

// Helper function to create the 15-line styled page
function renderMushafPage(content, pageNum) {
    return `
        <div class="mushaf-page" style="background: #fff9e6; padding: 40px; margin: 25px auto; border: 12px double #064e3b; max-width: 800px; min-height: 900px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); direction: rtl; position: relative;">
            <div style="font-family: 'Amiri', serif; font-size: 28px; line-height: 2.5; text-align: justify; text-justify: inter-word; color: #000;">
                ${content}
            </div>
            <div style="position: absolute; bottom: 15px; left: 0; right: 0; text-align: center; color: #064e3b; font-weight: bold; font-size: 14px; border-top: 1px solid #d4af37; padding-top: 10px; margin: 0 40px;">
                Page ${pageNum} - Ends Exactly as 15-Line Mushaf
            </div>
        </div>
    `;
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
