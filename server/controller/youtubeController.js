const axios = require('axios');
require('dotenv').config();

exports.analyzeYoutube = async (req, res) => {
  const { url } = req.body;
  

  try {
    
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    
    if (!match || !match[1]) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    const videoId = match[1];

    
    const comments = [];
    let nextPageToken = '';
    const maxComments = 100;

    while (comments.length < maxComments) {
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          videoId,
          part: 'snippet',
          maxResults: 100,
          pageToken: nextPageToken,
        },
      });
    

      const items = data.items || [];
      for (const item of items) {
        const text = item.snippet.topLevelComment.snippet.textDisplay;
        if (text) comments.push(text);
        if (comments.length >= maxComments) break;
      }

      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    
    const sentimentResults = await Promise.all(
      comments.map(async (text) => {
        try {
          const aiRes = await axios.post('https://saai-engine.onrender.com/analyze-sentiment/', null, {
            params: { text },
          });
          return {
            text,
            sentiment: aiRes.data.sentiment,
          };
        } catch {
          return { text, sentiment: 0 };
        }
      })
    );

    const totalSentiment = sentimentResults.reduce((sum, c) => sum + (c.sentiment || 0), 0);
    const avgSentiment = totalSentiment / sentimentResults.length;
    
    let emoji = '😐';
let sentimentLabel = 'Neutral';
let marketingComment = 'Audience engagement seems neutral. Consider spicing up your messaging.';

if (avgSentiment > 0.7) {
  emoji = '😃';
  sentimentLabel = 'Very Positive';
  marketingComment = 'Your campaign is killing it! 🎯';
} else if (avgSentiment > 0.4) {
  emoji = '😊';
  sentimentLabel = 'Positive';
  marketingComment = 'Your audience is responding well! 🙌';
} else if (avgSentiment > 0.1) {
  emoji = '🙂';
  sentimentLabel = 'Mildly Positive';
  marketingComment = 'Some positive traction. Keep it going!';
} else if (avgSentiment > -0.1) {
  emoji = '😐';
  sentimentLabel = 'Neutral';
} else if (avgSentiment > -0.4) {
  emoji = '😕';
  sentimentLabel = 'Slightly Negative';
  marketingComment = 'Might need to tweak your messaging.';
} else if (avgSentiment > -0.7) {
  emoji = '😠';
  sentimentLabel = 'Negative';
  marketingComment = 'Feedback isn’t great. Time to revisit the campaign.';
} else {
  emoji = '😡';
  sentimentLabel = 'Very Negative';
  marketingComment = 'People are hating this! 🔥 Time for a strategy shift.';
}



    res.json({
        results: sentimentResults,
        summary: {
          emoji,
          overallSentiment: sentimentLabel,
          averageScore: avgSentiment.toFixed(2),
          marketingComment,
          totalComments: sentimentResults.length,
        },
      });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to analyze YouTube comments' });
  }
};
