import puppeteer from 'puppeteer-extra';
import chromium from 'chrome-aws-lambda';
import fs from 'fs';
import UserAgent from 'user-agents';
import fetch from 'node-fetch';
import 'dotenv/config'; // Load environment variables if needed

// Determine if running locally
const isLocal = process.env.NODE_ENV === 'development';

if (isLocal) {
  console.log('Running in local development mode without StealthPlugin.');
} else {
  console.log('Running in production mode without StealthPlugin.');
}

// Utility: Sleep for a given number of milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Safe launch with retries on ETXTBSY error
async function safeLaunch(options, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await puppeteer.launch(options);
    } catch (err) {
      if (err.code === 'ETXTBSY') {
        console.error(`Encountered ETXTBSY error, retrying launch (${i + 1}/${retries})...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw new Error('Failed to launch browser after multiple retries due to ETXTBSY.');
}

// Function to scrape LinkedIn profile
const scrapeProfile = async (url) => {
  const userAgent = new UserAgent();
  console.log(`Launching browser for ${url}`);

  let executablePath;
  let browserArgs;
  let headlessMode;
  let ignoreHTTPSErrors;

  if (isLocal) {
    // For local development, use Puppeteer's bundled Chromium
    console.log('Running in local development mode.');
    executablePath = undefined; // Let Puppeteer use bundled Chromium
    browserArgs = undefined;
    headlessMode = true;
    ignoreHTTPSErrors = false;
  } else {
    console.log('Running in production mode.');
    executablePath = await chromium.executablePath;
    browserArgs = chromium.args;
    headlessMode = chromium.headless;
    ignoreHTTPSErrors = true;
  }

  // In production, ensure executablePath is available
  if (!isLocal && !executablePath) {
    const msg = 'Chromium executable path is null. Ensure that chrome-aws-lambda is correctly installed and configured.';
    console.error(msg);
    throw new Error(msg);
  }

  const launchOptions = {
    args: browserArgs,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath,
    headless: headlessMode,
    ignoreHTTPSErrors: ignoreHTTPSErrors,
  };

  let browser;
  try {
    browser = await safeLaunch(launchOptions);
  } catch (launchError) {
    console.error('Error launching browser:', launchError);
    throw launchError;
  }

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
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('body', { timeout: 15000 });
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log(`Scraped text from ${url}`);
    return pageText;
  } catch (error) {
    console.error(`Error scraping profile ${url}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Function to generate message using Nebius AI Studio API
const generateMessage = async (apiKey, profiles) => {
  const [profile1Text, profile2Text] = profiles;

  const prompt = `
Based on the following LinkedIn profile texts, generate a concise and professional message requesting a coffee chat. Use principles from "How to Win Friends and Influence People" and "How to Make People Do Stuff". Ensure the message sounds natural and engaging. Provide **only** the message without any additional text or explanations.

Here are some examples:

1. "Hello! I am pleased to meet you. I found your profile recently and was truly inspired by your journey. I admire your approach to combining technology, design, and user experience. If you're open to it, I'd be thrilled to have a virtual coffee chat to hear more about your insights and any advice you might have for someone aspiring to make a meaningful impact in tech. Thank you for considering my request. I hope to hear from you soon!"

2. "Hi! I hope you're having a great day! I recently came across your profile and was truly inspired by your journey in quant and risk management. As a Software Engineering and Physics student at UT Arlington and a fellow quant enthusiast, I'd love to connect and learn more about your experiences and journey. If you have some time, I would be thrilled to have a virtual coffee chat to hear more about your insights and perhaps get your advice on navigating the field. I'm looking forward to it!"

3. "Hi! I recently came across your impressive background in growth engineering and software development, and I was also really inspired by your achievements at Microsoft and Terra API. I would love the opportunity to connect and learn more about your experiences. If you're open to it, I'd be thrilled to have a virtual coffee chat to hear more about your journey and any advice you might have for someone looking to make a meaningful impact in the tech industry. I look forward to the opportunity!"

**Profile 1:**
${profile1Text}

**Profile 2:**
${profile2Text}
`;

  try {
    console.log('Sending request to Nebius API');
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
      throw new Error(`Nebius API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      console.error('Nebius API response does not contain choices:', data);
      throw new Error('No choices found in API response');
    }

    const generatedMessage = data.choices[0].message.content.trim();
    console.log('Generated message:', generatedMessage);

    return generatedMessage;
  } catch (error) {
    console.error('Error generating message:', error);
    throw error;
  }
};

// Export the handler function
export default async function handler(req, res) {
  console.log('Received request:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { linkedin1, linkedin2, apiKey } = req.body;

  // Validate input presence
  if (!linkedin1 || !linkedin2 || !apiKey) {
    const missing = [];
    if (!linkedin1) missing.push('linkedin1');
    if (!linkedin2) missing.push('linkedin2');
    if (!apiKey) missing.push('apiKey');
    console.error('Missing required fields:', missing);
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
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
    console.log('Starting profile scraping...');
    // Scrape both LinkedIn profiles concurrently
    const profiles = await Promise.all([
      scrapeProfile(linkedin1),
      scrapeProfile(linkedin2)
    ]);
    console.log('Profile scraping completed.');

    console.log('Generating message...');
    // Generate the message using Nebius AI Studio API
    const message = await generateMessage(apiKey, profiles);
    console.log('Message generation completed.');

    // Send the generated message as a JSON response
    res.status(200).json({ message });
  } catch (error) {
    console.error('An error occurred during message generation:', error);
    res.status(500).json({ error: error.message || 'Error generating message' });
  }
}
