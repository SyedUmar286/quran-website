// ... (Upar ka code wese hi rehne dein, loadContent function ko niche wale se badal dein)

async function loadContent(id, name) {
    document.getElementById('surah-list').classList.add('hidden');
    document.getElementById('juz-list').classList.add('hidden');
    document.getElementById('viewer-section').classList.remove('hidden');
    document.getElementById('current-title').innerText = name;
    const area = document.getElementById('content-area');
    area.innerHTML = '<div style="text-align:center; padding:20px;">Setting pages according to 15-line Mushaf...</div>';

    if(currentMode.includes('15line')) {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
        const data = await res.json();
        const ayahs = data.data.ayahs;
        
        let pagesHtml = '';
        let currentPageNum = ayahs[0].page;
        let pageContent = '';

        // Surah Introduction Header (Separated Clearly)
        pagesHtml += `
            <div style="text-align: center; margin-bottom: 40px; padding: 30px; border: 3px double #064e3b; background: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <h1 style="font-family: 'Amiri'; font-size: 45px; color: #064e3b; margin:0; letter-spacing: 2px;">${name}</h1>
                <div style="font-size: 40px; margin-top: 20px; font-family: 'Amiri'; color: #000;">بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ</div>
            </div>
        `;

        ayahs.forEach((a, index) => {
            if (a.page !== currentPageNum) {
                pagesHtml += renderMushafPage(pageContent, currentPageNum);
                pageContent = '';
                currentPageNum = a.page;
            }
            // Adding Ayah text
            pageContent += `${a.text} <span style="color: #d4af37; font-size: 22px; white-space: nowrap;"> ﴿${a.numberInSurah}﴾ </span> `;
            
            if (index === ayahs.length - 1) {
                pagesHtml += renderMushafPage(pageContent, currentPageNum);
            }
        });

        area.innerHTML = pagesHtml;

    } else {
        // ... (Urdu Mode Same Rahega)
    }
}

// Function to fix the GAP issue and line ending
function renderMushafPage(content, pageNum) {
    return `
        <div class="mushaf-page" style="
            background: #fff9e6; 
            padding: 50px 45px; 
            margin: 30px auto; 
            border: 1px solid #ccc; 
            max-width: 900px; 
            min-height: 1100px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            direction: rtl; 
            display: flex; 
            flex-direction: column; 
            justify-content: flex-start;
        ">
            <div style="
                font-family: 'Amiri', serif; 
                font-size: 32px; 
                line-height: 2.2; 
                text-align: justify; 
                text-justify: inter-word; 
                word-spacing: 4px; 
                letter-spacing: 0.5px;
                color: #000;
                flex-grow: 1;
            ">
                ${content}
            </div>
            <div style="text-align: center; color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
                Page Ends Here (Mushaf Page: ${pageNum})
            </div>
        </div>
    `;
}
