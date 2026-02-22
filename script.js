let currentMode = '';
let currentReciter = 'ar.alafasy';

const juzNames = ["آلم (1)", "سیقول (2)", "تلك الرسل (3)", "لن تنالوا (4)", "والمحصنت (5)", "لا یحب اللہ (6)", "و اذا سمعوا (7)", "ولو اننا (8)", "قال الملا (9)", "واعلموا (10)", "یعتذرون (11)", "وما من دابة (12)", "وما ابری (13)", "ربما (14)", "سبحن الذی (15)", "قال الم الم (16)", "اقترب للناس (17)", "قد افلح (18)", "وقال الذین (19)", "امن خلق (20)", "اتل ما اوحی (21)", "ومن یقنت (22)", "وما لی (23)", "فمن اظلم (24)", "الیہ یرد (25)", "حم (26)", "قال فما خطبکم (27)", "قد سمع اللہ (28)", "تبارك الذی (29)", "عم (30)"];

function startApp(mode) {
    currentMode = mode;
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    fetchSurahList();
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

async function loadContent(id, name) {
    document.getElementById('surah-list').classList.add('hidden');
    document.getElementById('viewer-section').classList.remove('hidden');
    document.getElementById('current-title').innerText = name;
    const area = document.getElementById('content-area');
    area.innerHTML = '<div style="text-align:center;">Loading...</div>';

    if(currentMode.includes('15line')) {
        // Fetching Uthmani Script (Matches 15-line breaks)
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
        const data = await res.json();
        const ayahs = data.data.ayahs;
        
        let pagesHtml = '';
        let currentPageNum = ayahs[0].page;
        let pageContent = '';

        // Surah Header & Bismillah
        pagesHtml += `
            <div style="text-align: center; margin-bottom: 30px; border: 2px solid #064e3b; padding: 20px; border-radius: 10px;">
                <h1 style="font-family: 'Amiri'; color: #064e3b; font-size: 38px;">${name}</h1>
                <h2 style="font-family: 'Amiri'; font-size: 32px; margin-top: 10px;">بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ</h2>
            </div>
        `;

        ayahs.forEach((a, index) => {
            if (a.page !== currentPageNum) {
                pagesHtml += renderPage(pageContent, currentPageNum);
                pageContent = '';
                currentPageNum = a.page;
            }
            pageContent += `${a.text} <span style="color: #d4af37; font-size: 22px;"> ﴿${a.numberInSurah}﴾ </span> `;
            if (index === ayahs.length - 1) pagesHtml += renderPage(pageContent, currentPageNum);
        });
        area.innerHTML = pagesHtml;
    } else {
        // Urdu Mode (No changes here, it works fine)
        const [ar, ur, tf] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${id}`),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/ur.jalandhry`),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/ur.tafsir-ahmed-raza-khan`)
        ]);
        const arabic = await ar.json();
        const urdu = await ur.json();
        const tafsir = await tf.json();

        area.innerHTML = arabic.data.ayahs.map((a, i) => `
            <div class="ayah-box" style="background:white; padding:20px; margin:10px; border-radius:10px; direction:rtl; border-right: 5px solid #064e3b;">
                <div style="font-size: 26px; font-family:'Amiri';">${a.text}</div>
                <div style="color: #064e3b; margin:10px 0;">${urdu.data.ayahs[i].text}</div>
                <details><summary style="cursor:pointer; color:#d4af37;">Tafseer</summary><div style="padding:10px;">${tafsir.data.ayahs[i].text}</div></details>
            </div>
        `).join('');
    }
}

function renderPage(content, num) {
    return `
        <div class="mushaf-page" style="background:#fff9e6; padding:45px; margin:20px auto; max-width:850px; min-height:1000px; border:1px solid #ddd; direction:rtl; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display:flex; flex-direction:column;">
            <div style="font-family:'Amiri'; font-size:32px; line-height:2.3; text-align:justify; text-justify:inter-word; flex-grow:1;">
                ${content}
            </div>
            <div style="text-align:center; border-top:1px solid #eee; padding-top:10px; color:#666; font-size:14px;">--- Page Ends Here ---</div>
        </div>
    `;
}

function goHome() { location.reload(); }
function backToList() { document.getElementById('viewer-section').classList.add('hidden'); document.getElementById('surah-list').classList.remove('hidden'); }
