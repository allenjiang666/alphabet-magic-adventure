
import { GoogleGenAI, Modality } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { NUMBERS } from '../constants';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey: API_KEY });

const NUMBERS_IMAGES_PATH = path.join(process.cwd(), 'public/assets/numbers/images');
const NUMBERS_AUDIO_PATH = path.join(process.cwd(), 'public/assets/numbers/audio');

/**
 * Ensures required directories exist
 */
async function ensureDirectories() {
    await fs.mkdir(NUMBERS_IMAGES_PATH, { recursive: true });
    await fs.mkdir(NUMBERS_AUDIO_PATH, { recursive: true });
}

/**
 * Generates an image for a single number
 */
async function generateImage(value: number, word: string, prompt: string, force = false) {
    const filePath = path.join(NUMBERS_IMAGES_PATH, `${value}.png`);

    if (!force) {
        try {
            await fs.access(filePath);
            console.log(`✅ Image for ${value} exists.`);
            return;
        } catch { }
    }

    console.log(`🎨 Generating image: ${value} (${word})...`);
    try {
        const response = await (genAI as any).models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `${prompt}. Make it very colorful, simple, and friendly for a 4 year old child.` }],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                await fs.writeFile(filePath, buffer);
                console.log(`💾 Saved image: ${value}`);
                return;
            }
        }
    } catch (error) {
        console.error(`❌ Image error for ${value}:`, error);
    }
}

/**
 * Generates audio for a single number
 */
async function generateAudio(value: number, sentence: string, force = false) {
    const filePath = path.join(NUMBERS_AUDIO_PATH, `${value}.pcm`);

    if (!force) {
        try {
            await fs.access(filePath);
            console.log(`✅ Audio for ${value} exists.`);
            return;
        } catch { }
    }

    console.log(`🔊 Generating audio: ${value}...`);
    try {
        const prompt = `Say clearly and cheerfully for a child: "${sentence}"`;

        const response = await (genAI as any).models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) {
            await fs.writeFile(filePath, Buffer.from(data, 'base64'));
            console.log(`💾 Saved audio: ${value}`);
        }
    } catch (error) {
        console.error(`❌ Audio error for ${value}:`, error);
    }
}

/**
 * Main orchestration
 */
async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const targetValue = args.find(a => a.startsWith('--value='))?.split('=')[1];

    await ensureDirectories();

    console.log(`🚀 Starting number asset generation`);

    const filteredNumbers = targetValue !== undefined
        ? NUMBERS.filter(n => n.value === parseInt(targetValue))
        : NUMBERS;

    for (const item of filteredNumbers) {
        await generateImage(item.value, item.word, item.imagePrompt, force);
        await new Promise(r => setTimeout(r, 500)); // Rate limit buffer

        await generateAudio(item.value, item.sentence, force);
        await new Promise(r => setTimeout(r, 500)); // Rate limit buffer
    }

    console.log('✨ Done!');
}

main().catch(console.error);
