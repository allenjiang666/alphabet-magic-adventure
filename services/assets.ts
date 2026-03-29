
// This service handles asset resolution and PCM audio playback in the browser.
// It is lightweight and has NO AI dependencies.

export function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const BASE_URL = import.meta.env.BASE_URL || '/';

export const assetService = {
    getImagePath(char: string): string {
        return `${BASE_URL}assets/images/${char}.png`;
    },

    getCommonImagePath(name: string): string {
        return `${BASE_URL}assets/common/${name}.png`;
    },

    getCommonVideoPath(name: string, ext = 'mp4'): string {
        return `${BASE_URL}assets/common/${name}.${ext}`;
    },

    async playPcm(url: string): Promise<void> {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load audio: ${url}`);

            const arrayBuffer = await response.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBytes = new Uint8Array(arrayBuffer);
            const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start();
        } catch (error) {
            console.error("Audio playback failed:", error);
        }
    },

    playLetterSound(char: string) {
        return this.playPcm(`${BASE_URL}assets/audio/${char}.pcm`);
    },

    playLetterWordSound(char: string) {
        return this.playPcm(`${BASE_URL}assets/audio/${char}.pcm`);
    },

    getNumberImagePath(value: number): string {
        return `${BASE_URL}assets/numbers/images/${value}.png`;
    },

    playNumberSound(value: number) {
        return this.playPcm(`${BASE_URL}assets/numbers/audio/${value}.pcm`);
    },

    playCommonSound(name: string) {
        return this.playPcm(`${BASE_URL}assets/common/${name}.pcm`);
    },

    playSimpleSound(type: 'correct' | 'wrong' | 'spin') {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);

            if (type === 'correct') {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.2);
            } else if (type === 'wrong') {
                const osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.2);
            } else if (type === 'spin') {
                let time = audioCtx.currentTime;
                // Generate slowing ticks to simulate wheel deceleration
                for (let i = 0; i < 22; i++) {
                    const osc = audioCtx.createOscillator();
                    const tickGain = audioCtx.createGain();
                    
                    osc.connect(tickGain);
                    tickGain.connect(gainNode);
                    
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(800 - (i * 15), time);
                    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
                    
                    tickGain.gain.setValueAtTime(0, time);
                    tickGain.gain.linearRampToValueAtTime(0.15, time + 0.01);
                    tickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

                    osc.start(time);
                    osc.stop(time + 0.05);
                    
                    // Interval increases gradually (starts fast, gets very slow)
                    const interval = 0.03 + (i * i * 0.0006);
                    time += interval;
                }
            }
        } catch (error) {
            console.error("Synthesized sound failed:", error);
        }
    }
};
