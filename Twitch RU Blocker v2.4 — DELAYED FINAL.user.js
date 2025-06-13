// ==UserScript==
// @name          Twitch RU Blocker v2.4 — DELAYED FINAL
// @namespace     http://dimaskiller.twitch.block/
// @version       2.4
// @description   Блокує русню: тицяє ⋯ → чекає 1с → тицяє Not Interested
// @match         https://www.twitch.tv/*
// @grant         none
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '2.4'; // Оновив версію
    const LABELS_NOT_INTERESTED = ['not interested', 'не интересно', 'не цікаво'];
    const DELAY_MS = 2000; // 2 секунди

    console.log(`🚀 RU Blocker v${VERSION} запущено`);

    function shouldBlockTag(raw) {
        const cleaned = raw
            .normalize('NFKD')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/[^\p{L}]/gu, '')
            .toLowerCase();
        // *** ОНОВЛЕНА ЛОГІКА: Блокуємо тільки теги, що містять "рус", "россия", "руский" ***
        return cleaned.includes('русск') || cleaned.includes('россия') || cleaned.includes('руский');
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function handleTagElement(tagEl, index) {
        const raw = tagEl.getAttribute('aria-label') || '';
        if (!shouldBlockTag(raw)) return;

        const card = tagEl.closest('article');
        if (!card || card.dataset._filtered === "1") return;
        card.dataset._filtered = "1";

        console.log(`🧨 [${index}] Знайдено русню: "${raw}"`);

        const menuBtn = card.querySelector('button[aria-label="Show more options for this channel"]');
        if (!menuBtn) {
            console.log(`⚠️ [${index}] Нема кнопки ⋯. Актуальний селектор можливо змінився.`);
            return;
        }

        console.log(`🖱 [${index}] Клік по ⋯`);
        menuBtn.click();

        await delay(DELAY_MS);

        let targetButton = null;

        const menuItems = document.querySelectorAll('[role="menuitem"], button');
        for (const item of menuItems) {
            if (LABELS_NOT_INTERESTED.some(text => item.innerText?.trim().toLowerCase() === text.toLowerCase())) {
                targetButton = item;
                break;
            }
        }

        if (!targetButton) {
            const divsWithText = document.querySelectorAll('div');
            const foundDiv = Array.from(divsWithText).find(div =>
                LABELS_NOT_INTERESTED.some(text =>
                    div.innerText?.trim().toLowerCase() === text.toLowerCase()
                )
            );
            if (foundDiv) {
                targetButton = foundDiv.closest('button') || foundDiv.closest('[role="menuitem"]');
            }
        }

        if (targetButton) {
            console.log(`✅ [${index}] Клік по "${targetButton.innerText.trim()}"`);
            targetButton.click();
        } else {
            console.log(`❌ [${index}] Не знайдено "Not Interested" після відкриття меню.`);
        }
    }

    function scanTags() {
        const tags = document.querySelectorAll('a.tw-tag[aria-label]');
        tags.forEach((tag, i) => handleTagElement(tag, i));
    }

    setTimeout(() => {
        console.log('📦 Початковий запуск сканування');
        scanTags();
    }, 2000);

    const observer = new MutationObserver(() => {
        scanTags();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();