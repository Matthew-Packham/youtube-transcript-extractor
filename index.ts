import { getYoutubeTranscript } from './yt-scraper.ts';
import fs from 'fs/promises';

async function main() {
    const url = 'https://www.youtube.com/watch?v=nNRomzPyof0';
    try {
        const videoId = url.match(/[?&]v=([^&]+)/)?.[1] || 'unknown';
        console.log(`Processing ${videoId}...`);
        
        const transcript = await getYoutubeTranscript(url);
        await fs.writeFile(`../School _of_Life_Channel_Transcripts/transcript-${videoId}.txt`, transcript, 'utf-8');
        console.log(`✅ Saved to transcript-${videoId}.txt`);
        
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}

main();