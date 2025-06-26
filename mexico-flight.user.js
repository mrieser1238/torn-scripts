// ==UserScript==
// @name         Torn: Mexico Flight + Buy + Return (i-data Exact Match)
// @namespace    https://github.com/YOUR-USERNAME/torn-scripts
// @version      3.1
// @description  Flies to Mexico in Torn, buys Jaguar Plushie and Card Skimmer using strict i-data matching, then returns home
// @author       YOUR NAME
// @match        https://www.torn.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

/*
 HOW TO USE:
 - Press Shift + M on any Torn page to begin the process.
 - The script will:
     1. Click the Mexico map pin
     2. Travel to Mexico
     3. Wait for the market
     4. Buy Jaguar Plushie and Card Skimmer (strict match via i-data)
     5. Return home automatically
 - If page reloads mid-process, it will resume automatically.
*/

(function () {
    'use strict';

    const FLIGHT_FLAG = 'mexicoTripActive';
    const items = [
        { name: 'Jaguar Plushie', idata: 'i_938_334_37_20' },
        { name: 'Card Skimmer', idata: 'i_938_369_37_20' }
    ];

    function log(msg) {
        console.log(`[TornMexico] ${msg} [${new Date().toLocaleTimeString()}]`);
    }

    function randomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function simulateClick(elem) {
        if (!elem) return log('⚠️ simulateClick: element not found');
        const r = elem.getBoundingClientRect();
        const evt = new MouseEvent('click', {
            clientX: r.left + r.width / 2 + randomDelay(-3, 3),
            clientY: r.top + r.height / 2 + randomDelay(-3, 3),
            bubbles: true,
            cancelable: true
        });
        setTimeout(() => elem.dispatchEvent(evt), randomDelay(30, 80));
    }

    async function waitForSelector(selector, timeout = 8000, interval = 200) {
        return new Promise(resolve => {
            const start = Date.now();
            const h = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) { clearInterval(h); resolve(el); }
                else if (Date.now() - start > timeout) { clearInterval(h); resolve(null); }
            }, interval);
        });
    }

    async function buyItemByIData(iDataValue, itemName) {
        log(`🛒 Searching for ${itemName} with i-data="${iDataValue}"`);
        const buyButton = document.querySelector(`a.buy[i-data="${iDataValue}"]`);
        if (buyButton) {
            simulateClick(buyButton);
            log(`✅ Clicked on ${itemName}`);
            await new Promise(r => setTimeout(r, randomDelay(500, 900)));
            const confirmButton = [...document.querySelectorAll('button.torn-btn')]
                .find(b => b.textContent.trim().toUpperCase() === 'BUY');
            if (confirmButton) {
                simulateClick(confirmButton);
                log(`✅ Confirmed purchase of ${itemName}`);
            } else {
                log(`⚠️ Confirm button not found for ${itemName}`);
            }
        } else {
            log(`❌ ${itemName} not found`);
        }
    }

    function returnHome() {
        log('🏠 Returning home...');
        const home = document.querySelector('#travel-home');
        if (!home) return log('❌ No Travel Home link');
        simulateClick(home);
        setTimeout(() => {
            const back = [...document.querySelectorAll('button.torn-btn')]
                .find(b => b.textContent.trim().toUpperCase() === 'TRAVEL BACK');
            if (back) {
                simulateClick(back);
                log('✅ Clicked Travel Back');
            } else {
                log('❌ No Travel Back button');
            }
        }, randomDelay(1500, 2500));
        sessionStorage.removeItem(FLIGHT_FLAG);
    }

    async function flyAndBuyMexico() {
        log('✈️ Starting Mexico flight...');
        const pin = document.querySelector('div.pin___FilUD.interactive___tB_xU');
        if (!pin) return log('❌ Mexico pin not found');
        simulateClick(pin);
        await new Promise(r => setTimeout(r, randomDelay(700, 1000)));

        let btn = [...document.querySelectorAll('button.torn-btn')]
            .find(b => b.getAttribute('aria-label')?.includes('Travel to Mexico'));
        if (!btn) return log('❌ "Travel to Mexico" button not found');
        simulateClick(btn);
        await new Promise(r => setTimeout(r, randomDelay(700, 1000)));

        btn = [...document.querySelectorAll('button.torn-btn')]
            .find(b => b.textContent.trim().toUpperCase() === 'CONTINUE');
        if (!btn) return log('❌ Continue button not found');
        simulateClick(btn);
        await new Promise(r => setTimeout(r, randomDelay(700, 1000)));

        btn = [...document.querySelectorAll('a.torn-btn')]
            .find(a => a.textContent.trim().toUpperCase() === 'CONTINUE');
        if (!btn) return log('❌ Final Continue button not found');
        simulateClick(btn);

        sessionStorage.setItem(FLIGHT_FLAG, '1');

        setTimeout(async () => {
            log('🛬 Waiting for market...');
            const marketReady = await waitForSelector('a.buy', 8000, 200);
            if (!marketReady) {
                log('❌ Market not loaded—skipping buys');
                returnHome();
                sessionStorage.removeItem(FLIGHT_FLAG);
                return;
            }

            log('✅ Market ready, buying...');
            for (const item of items) {
                await buyItemByIData(item.idata, item.name);
            }

            const d = randomDelay(1500, 2500);
            log(`⏳ Returning home in ${Math.floor(d / 1000)}s...`);
            setTimeout(returnHome, d);
        }, randomDelay(3000, 4000));
    }

    document.addEventListener('keydown', e => {
        if (e.shiftKey && e.key === 'M') {
            flyAndBuyMexico();
        }
    });

    window.addEventListener('load', () => {
        if (sessionStorage.getItem(FLIGHT_FLAG) === '1') {
            log('🔄 Reload detected—resuming...');
            setTimeout(async () => {
                log('🛬 Resuming market buys...');
                const marketReady = await waitForSelector('a.buy', 8000, 200);
                if (!marketReady) {
                    log('❌ Market not loaded—skipping buys');
                    returnHome();
                    sessionStorage.removeItem(FLIGHT_FLAG);
                    return;
                }

                for (const item of items) {
                    await buyItemByIData(item.idata, item.name);
                }

                const d = randomDelay(1500, 2500);
                log(`⏳ Returning home in ${Math.floor(d / 1000)}s...`);
                setTimeout(returnHome, d);
            }, randomDelay(1500, 2500));
        }
    });

})();
