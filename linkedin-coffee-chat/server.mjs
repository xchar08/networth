import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Add stealth plugin
puppeteer.use(StealthPlugin());

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Scrape profile function
const scrapeProfile = async (url) => {
    const userAgent = new UserAgent();
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent.toString());
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'media', 'font', 'stylesheet'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('body', { timeout: 15000 });
        const pageText = await page.evaluate(() => document.body.innerText);
        await browser.close();
        return pageText;
    } catch (error) {
        console.log('Error:', error);
        await browser.close();
        throw error;
    }
};

// Generate message function
const generateMessage = async (apiKey, profiles) => {
    const [profile1Text, profile2Text] = profiles;

    const prompt = `
        Based on the following LinkedIn profile texts, generate a message requesting a coffee chat. Use tips from "How to win friends and gain influence" and "How to make people do stuff". Also, make sure it sounds natural. 
        These are some examples

        Hello! I am pleased to meet you. I found your profile recently, and was truly inspired by your journey. I admire your approach to combining technology, design, and user experience. If you're open to it, I'd be thrilled to have a virtual "coffee chat" to hear more about your insights and any advice you might have for someone aspiring to make a meaningful impact in tech. Thank you for giving my request some thoughts. I hope to hear from you soon!
        Hi! I hope you're having a great day! I recently came across your profile and was truly inspired by your journey in quant and risk management. As a Software Engineering and Physics student at UT Arlington and a fellow quant enthusiast, I'd love to connect and learn more about your experiences and journey. If you have some time, I would be thrilled to have a virtual "coffee chat" to hear more about your insights and perhaps get your advice on navigating the field. I'm looking forward to it!
        Hi! I recently came across your impressive background in growth engineering and software development, and I was also really inspired by your achievements at Microsoft and Terra API. I would love the opportunity to connect and learn more about your experiences. If you're open to it, I'd be thrilled to have a virtual "coffee chat" to hear more about your journey and any advice you might have for someone looking to make a meaningful impact in the tech industry. I look forward to the opportunity!

        Profile 1:
        ${profile1Text}

        Profile 2:
        ${profile2Text}
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150
            })
        });

        const data = await response.json();
        console.log('API Response:', data); // Debugging line

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No choices found in API response');
        }

        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating message:', error);
        throw error;
    }
};

// Handle form submission
app.post('/generate-message', async (req, res) => {
    const { linkedin1, linkedin2, apiKey } = req.body;

    try {
        const profiles = await Promise.all([
            scrapeProfile(linkedin1),
            scrapeProfile(linkedin2)
        ]);

        const message = await generateMessage(apiKey, profiles);

        fs.writeFileSync(path.join(__dirname, 'public', 'result.html'), `
            <html>
            <head><title>LinkedIn Profiles Comparison</title></head>
            <body>
                <h1>Generated Message for Coffee Chat</h1>
                <p>${message.replace(/\n/g, '<br>')}</p>
            </body>
            </html>
        `);

        res.sendFile(path.join(__dirname, 'public', 'result.html'));
    } catch (error) {
        console.log('An error occurred:', error);
        res.status(500).send('Error generating message');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
