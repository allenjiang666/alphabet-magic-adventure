
import { GoogleGenAI, Modality } from "@google/genai";
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { ALPHABET } from '../constants';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey: API_KEY });

const ASSETS_IMAGES_PATH = path.join(process.cwd(), 'public/assets/images');
const ASSETS_AUDIO_PATH = path.join(process.cwd(), 'public/assets/audio');
const ASSETS_COMMON_PATH = path.join(process.cwd(), 'public/assets/common');

/**
 * Ensures all required asset directories exist
 */
async function ensureDirectories() {
    await fs.mkdir(ASSETS_IMAGES_PATH, { recursive: true });
    await fs.mkdir(ASSETS_AUDIO_PATH, { recursive: true });
    await fs.mkdir(ASSETS_COMMON_PATH, { recursive: true });
}

/**
 * Generates an image for a single letter
 */
async function generateImage(char: string, word: string, prompt: string, force = false) {
    const filePath = path.join(ASSETS_IMAGES_PATH, `${char}.png`);

    if (!force) {
        try {
            await fs.access(filePath);
            console.log(`✅ Image for ${char} exists.`);
            return;
        } catch { }
    }

    console.log(`🎨 Generating image: ${char} (${word})...`);
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
                console.log(`💾 Saved image: ${char}`);
                return;
            }
        }
    } catch (error) {
        console.error(`❌ Image error for ${char}:`, error);
    }
}

/**
 * Generates audio for a single letter
 */
async function generateAudio(char: string, word: string, force = false) {
    const filePath = path.join(ASSETS_AUDIO_PATH, `${char}.pcm`);

    if (!force) {
        try {
            await fs.access(filePath);
            console.log(`✅ Audio for ${char} exists.`);
            return;
        } catch { }
    }

    console.log(`🔊 Generating audio: ${char}...`);
    try {
        // Use a phonetic-style spelling for 'A' to ensure the model says "Ay" (the letter name) 
        // instead of "Ah" (the sound)
        const pronunciationText = char.toUpperCase() === 'A' ? 'Ay' : char;
        const prompt = `Say the name of the letter "${char}" clearly and cheerfully, then the word: "${pronunciationText} for ${word}".`;

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
            console.log(`💾 Saved audio: ${char}`);
        }
    } catch (error) {
        console.error(`❌ Audio error for ${char}:`, error);
    }
}

/**
 * Generates common UI sounds
 */
async function generateCommonAssets(force = false) {
    const commonSounds = [
        { name: 'win_listen', text: "Great job! You finished all the letters. You are a superstar!" },
        { name: 'win_speak', text: "Yay! You are amazing! You said all the letters. You get a trophy!" }
    ];

    for (const sound of commonSounds) {
        const filePath = path.join(ASSETS_COMMON_PATH, `${sound.name}.pcm`);

        if (!force) {
            try {
                await fs.access(filePath);
                console.log(`✅ Common sound ${sound.name} exists.`);
                continue;
            } catch { }
        }

        console.log(`🔊 Generating common sound: ${sound.name}...`);
        try {
            const response = await (genAI as any).models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Say cheerfully and slowly for a child: ${sound.text}` }] }],
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
                console.log(`💾 Saved common sound: ${sound.name}`);
            }
        } catch (error) {
            console.error(`❌ Common sound error ${sound.name}:`, error);
        }
    }
}

/**
 * Main orchestration
 */
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'all'; // all, images, audio, common
    const force = args.includes('--force');
    const targetChar = args.find(a => a.startsWith('--char='))?.split('=')[1]?.toUpperCase();

    await ensureDirectories();

    console.log(`🚀 Starting generation [Mode: ${mode}${force ? ' (Force)' : ''}${targetChar ? `, Char: ${targetChar}` : ''}]`);

    const filteredAlphabet = targetChar
        ? ALPHABET.filter(a => a.char.toUpperCase() === targetChar)
        : ALPHABET;

    if (filteredAlphabet.length === 0 && targetChar) {
        console.error(`❌ Letter "${targetChar}" not found in alphabet!`);
        return;
    }

    if (mode === 'all' || mode === 'images') {
        for (const item of filteredAlphabet) {
            await generateImage(item.char, item.word, item.imagePrompt, force);
            await new Promise(r => setTimeout(r, 500)); // Rate limit buffer
        }
    }

    if (mode === 'all' || mode === 'audio') {
        for (const item of filteredAlphabet) {
            await generateAudio(item.char, item.word, force);
            await new Promise(r => setTimeout(r, 500)); // Rate limit buffer
        }
    }

    if (mode === 'all' || mode === 'common') {
        await generateCommonAssets(force);
    }

    console.log('✨ Done!');
}

main().catch(console.error);
