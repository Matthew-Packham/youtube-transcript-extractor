// youtube-scraper.ts
import he from 'he';
import axios from 'axios';
import lodash from 'lodash';
const { find } = lodash;

async function fetchData(url: string): Promise<string> {
    //send get requests (specific resource from a server - no body)
    // We use this for fetching the transcripts
  const { data } = await axios.get(url);
  return data;
}

function getYoutubeVideoID(url: string): string | null {
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}


export async function getYoutubeTranscript(videoUrl: string): Promise<string> {
  const videoID = getYoutubeVideoID(videoUrl);
  if (!videoID) {
    throw new Error('Invalid YouTube URL');
  }

  try {

    //-------------------------- Get Transcipt -------------------------------------//
    
    const data = await fetchData(`https://youtube.com/watch?v=${videoID}`);

    if (!data.includes('captionTracks')) {
      throw new Error(`Could not find captions for video: ${videoID}`);
    }

    const regex = /"captionTracks":(\[.*?\])/;
    const [match] = regex.exec(data) || [];
    if (!match) {
      throw new Error('Could not parse caption tracks');
    }

    // Find what Captions(a.k.a transcripts) are avalible
    const { captionTracks } = JSON.parse(`{${match}}`);

    let subtitle: any;

    // Try UK English manual captions
    subtitle = find(captionTracks, { vssId: '.en-GB' }); //undefined if doesnt exist
    if (!subtitle) {
        // Try regular English manual captions
        subtitle = find(captionTracks, { vssId: '.en' });
        if (!subtitle) {
            // Finally, try auto-generated English
            subtitle = find(captionTracks, { vssId: 'a.en' });
        }
    }

    // Log all available captions for debugging
    //console.log('Available caption tracks:', JSON.stringify(captionTracks, null, 2));
    console.log(`📝 Caption type: ${subtitle.vssId}`)
    
    if (!subtitle?.baseUrl) {
      throw new Error('Could not find English captions');
    }

    //---------------------------- Formating the Transcript ---------------------------//

    // In our subtitle JSON, there is a baseURL which is used to fetch the transcript
    // If you send the baseUrl in insomnia with no body, youll see the formatting!!
    const transcript = await fetchData(subtitle.baseUrl);
    // basic formatting to convert xml document to markdown
    const lines = transcript
      .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
      .replace('</transcript>', '')
      .split('</text>')
      .filter(line => line && line.trim())
      .map(line => {
        // Extract text while preserving formatting
        const text = line
          .replace(/<text.+>/, '')  // Remove the opening tag
          .replace(/&amp;/gi, '&')  // Fix ampersands
          .replace(/\s*\n\s*/g, ' ')  // Replace newlines with whitespace on either side with a single space
          .replace(/[\u2018\u2019]/g, "'")  // Replace left and right single quotation marks
          .trim();

        // Decode HTML entities but don't strip tags
        return he.decode(text);
      })
      .filter(Boolean); // Remove empty lines

    return lines.join(' '); //return as a long str rather than with \n chara as these dont mean anything. just pauses in the video dialogue

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch transcript');
  }
}