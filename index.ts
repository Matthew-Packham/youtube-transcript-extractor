import { getYoutubeTranscript } from './yt-scraper.ts';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';

// Type for our transcript object
interface TranscriptEntry {
    ID: string;
    Title: string;
    Transcript: string;
}

async function processVideoList(listFilePath: string, outputFilePath: string) {
    // Array to store all transcript entries
    const transcriptEntries: TranscriptEntry[] = [];

    try {

        // Ensure Transcripts directory exists
        const transcriptsDir = path.dirname(outputFilePath);
        await fs.mkdir(transcriptsDir, { recursive: true });

        // Read the list of video data
        const fileContent = await fs.readFile(listFilePath, 'utf-8');
        
        // Parse CSV using Papa Parse
        const parsed = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true
        });

        // Process each row
        for (const row of parsed.data) {
            const videoId = row['ID']?.replace(/"/g, ''); // Remove quotes if present
            const title = row['Title']?.replace(/"/g, '');
            
            if (videoId) {
                try {
                    const url = `https://www.youtube.com/watch?v=${videoId}`;
                    console.log(`Processing ${videoId}...`);
                    
                    // Get transcript
                    const transcript = await getYoutubeTranscript(url);
                    
                    // Create transcript entry
                    transcriptEntries.push({
                        ID: videoId,
                        Title: title || 'Unknown Title',
                        Transcript: transcript
                    });
                    
                    console.log(`✅ Retrieved transcript for ${videoId}`);
                } catch (error) {
                    console.error(`Error processing ${videoId}:`, error instanceof Error ? error.message : error);
                }
            }
        }

        // Write accumulated transcripts to a single JSON file
        await fs.writeFile(
            outputFilePath, 
            JSON.stringify(transcriptEntries, null, 2), 
            'utf-8'
        );

        console.log(`✅ All transcripts saved to ${path.basename(outputFilePath)}`);
    } catch (error) {
        console.error('Error processing video list:', error);
    }
}

// Usage
const videoListPath = path.join(process.cwd(), '2025_02_14_video_metadata.txt');
const outputPath = path.join(process.cwd(), 'Transcripts', 'accumulated_transcripts.json');

processVideoList(videoListPath, outputPath);