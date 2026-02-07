
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
    }
};
