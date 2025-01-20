// backend/server.mjs

// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables from .env file
dotenv.config();

// Use the Stealth plugin to make puppeteer less detectable
puppeteer.use(StealthPlugin());

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Define the port
const PORT = process.env.PORT || 5000;

// Apply rate limiting middleware to limit repeated requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use(limiter);

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Function to scrape LinkedIn profile
const scrapeProfile = async (url) => {
    const userAgent = new UserAgent();
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
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
        console.error(`Error scraping profile ${url}:`, error);
        await browser.close();
        throw error;
    }
};

// Function to generate message using Nebius AI Studio API
const generateMessage = async (apiKey, profiles) => {
    const [profile1Text, profile2Text] = profiles;

    const prompt = `
        Based on the following LinkedIn profile texts, generate a message requesting a coffee chat. Use tips from "How to Win Friends and Influence People" and "How to Make People Do Stuff". Also, make sure it sounds natural. 
        These are some examples:

        Hello! I am pleased to meet you. I found your profile recently and was truly inspired by your journey. I admire your approach to combining technology, design, and user experience. If you're open to it, I'd be thrilled to have a virtual "coffee chat" to hear more about your insights and any advice you might have for someone aspiring to make a meaningful impact in tech. Thank you for giving my request some thoughts. I hope to hear from you soon!

        Hi! I hope you're having a great day! I recently came across your profile and was truly inspired by your journey in quant and risk management. As a Software Engineering and Physics student at UT Arlington and a fellow quant enthusiast, I'd love to connect and learn more about your experiences and journey. If you have some time, I would be thrilled to have a virtual "coffee chat" to hear more about your insights and perhaps get your advice on navigating the field. I'm looking forward to it!

        Hi! I recently came across your impressive background in growth engineering and software development, and I was also really inspired by your achievements at Microsoft and Terra API. I would love the opportunity to connect and learn more about your experiences. If you're open to it, I'd be thrilled to have a virtual "coffee chat" to hear more about your journey and any advice you might have for someone looking to make a meaningful impact in the tech industry. I look forward to the opportunity!

        Profile 1:
        ${profile1Text}

        Profile 2:
        ${profile2Text}
    `;

    try {
        const response = await fetch('https://api.studio.nebius.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.6,
                top_p: 1,
                n: 1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Nebius API response error:', response.status, response.statusText, errorText);
            throw new Error(`Nebius API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            console.error('Nebius API response does not contain choices:', data);
            throw new Error('No choices found in API response');
        }

        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating message:', error);
        throw error;
    }
};

// Route to handle generating message
app.post('/api/generate-message', async (req, res) => {
    const { linkedin1, linkedin2, apiKey } = req.body;

    // Validate input presence
    if (!linkedin1 || !linkedin2 || !apiKey) {
        console.error('Missing required fields:', req.body);
        return res.status(400).json({ error: 'Missing required fields: linkedin1, linkedin2, apiKey.' });
    }

    // Validate URLs
    try {
        new URL(linkedin1);
        new URL(linkedin2);
    } catch (error) {
        console.error('Invalid LinkedIn URLs:', { linkedin1, linkedin2 });
        return res.status(400).json({ error: 'Invalid LinkedIn URL(s) provided.' });
    }

    try {
        // Scrape both LinkedIn profiles concurrently
        const profiles = await Promise.all([
            scrapeProfile(linkedin1),
            scrapeProfile(linkedin2)
        ]);

        // Generate the message using Nebius AI Studio API
        const message = await generateMessage(apiKey, profiles);

        // Send the generated message as a JSON response
        res.json({ message });
    } catch (error) {
        console.error('An error occurred during message generation:', error);
        res.status(500).json({ error: 'Error generating message' });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});