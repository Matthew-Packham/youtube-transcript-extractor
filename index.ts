import { getYoutubeTranscript } from './yt-scraper.ts';
import fs from 'fs/promises';

async function main(url: string) {
    try {
        const videoId = url.match(/[?&]v=([^&]+)/)?.[1] || 'unknown';
        console.log(`Processing ${videoId}...`);
        
        const transcript = await getYoutubeTranscript(url);
        await fs.writeFile(`../Transcripts/transcript-${videoId}.txt`, transcript, 'utf-8');
        console.log(`✅ Saved to transcript-${videoId}.txt`);
        
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
    }
}
const url = 'https://www.youtube.com/watch?v=qdBavW0x62k' 
main(url);