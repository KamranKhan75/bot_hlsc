const puppeteer = require('puppeteer');
const fs = require('fs');

const {
    url
} = require('./keys');
const {
    resolve
} = require('path');


let browser;
let result = [];
const scrapper = () => new Promise(async (resolve, reject) => {
    try {
        console.log('Bot initiated...');
        browser = await puppeteer.launch({
            headless: true,
            ignoreHTTPSErrors: true,
            args: [
                '--no-sandbox',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
            ]
        });

        await getChannelInfo();

        await browser.close();
        console.log('Bot finished...');
        resolve(true);
    } catch (error) {
        if (browser) await browser.close();
        console.log(`Error : ${error}`);
        reject(error);
    }
});

const getChannelInfo = () => new Promise(async (resolve, reject) => {
    let page;

    try {
        console.log('Launching page...');
        page = await browser.newPage();
        console.log('Page launched...');
        await page.goto(url, {
            timeout: 0,
            waitUntil: 'networkidle2'
        });

        await page.waitForSelector('.pagination>li:nth-last-child(1)>a');
        noOfPages = await page.$eval('.pagination>li:nth-last-child(1)>a', elm => Number(elm.getAttribute('data-ci-pagination-page')));
        console.log(`Number of pages found.... ${noOfPages}`);
        for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
            console.log(`${pageNumber}/${noOfPages}.... scrapping`);
            if (pageNumber > 1) await page.goto(`${url}/${pageNumber}`, {
                timoeout: 0,
                waitUntil: 'networkidle2'
            });
            await page.waitForSelector('.stream_table>tbody');
            console.log('Selectors found...');
            const trs = await page.$$('tbody > tr');
            console.log(`Trs found... ${trs.length}`);
            for (let i = 0; i < trs.length; i += 2) {
                let status = await trs[i].$('td .online');
                if (status) {
                    const channel = {
                        name: '',
                        status: 'online',
                        url: ''
                    }
                    channel.name = await trs[i].$eval('td:nth-child(2) >span', elm => elm.innerText.trim());
                    // console.log(`${channel.name} ... ${channel.status}`);
                    channel.url = await trs[i + 1].$eval('td>span.get_vlc', elm => elm.getAttribute('data-clipboard-text'));
                    result.push(channel);
                }

            }
            console.log(`${pageNumber}/${noOfPages}..... scrapped`);

        }
        await saveResults();

        await page.close();
        console.log('Data grabbed....');
        resolve(true);
    } catch (error) {
        if (page) await page.close();
        console.log(`Error: ${error}`);
        reject(error);
    }
});

scrapper();