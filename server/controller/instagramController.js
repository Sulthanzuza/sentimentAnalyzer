const { default: axios } = require('axios');
require('dotenv').config();

exports.scrapeInstagram = async (req, res) => {
  const { url } = req.body;

  try {
   
    const { data: run } = await axios.post(
      `https://api.apify.com/v2/actor-tasks/${process.env.ACTOR_TASK_ID}/run-sync-get-dataset-items`,
      {
        directUrls: [url], 
        resultsLimit: 500,
        scrapeComment: true,
      },
      {
        params: {
          token: process.env.APIFY_TOKEN,
        },
      }
    );

    
    if (!run || !run.length || run[0].error === 'no_items') {
      return res.status(400).json({ error: 'No data found. The post may be private or inaccessible.' });
    }

  
    const comments = run
    .filter(item => item.text && typeof item.text === 'string')
    .map(item => item.text);
  
    function getSentimentLevel(score) {
      if (score <= -0.90) return { level: 'Extremely Negative', emoji: '😡', comment: 'Strong backlash or anger — serious issues reported.' };
      if (score <= -0.70) return { level: 'Very Negative', emoji: '😠', comment: 'Intense criticism — customers are really unhappy.' };
      if (score <= -0.40) return { level: 'Negative', emoji: '🙁', comment: 'Negative sentiment — people had a poor experience.' };
      if (score <= -0.10) return { level: 'Slightly Negative', emoji: '😕', comment: 'Mild issues — might require small improvements.' };
      if (score < 0.10) return { level: 'Neutral', emoji: '😐', comment: 'Neutral reaction — no strong feelings either way.' };
      if (score < 0.40) return { level: 'Slightly Positive', emoji: '🙂', comment: 'Mild approval — somewhat liked but not excited.' };
      if (score < 0.70) return { level: 'Positive', emoji: '😃', comment: 'Positive feedback — users are happy and satisfied.' };
      if (score < 0.90) return { level: 'Very Positive', emoji: '😍', comment: 'Strong satisfaction — people love the product/service.' };
      return { level: 'Extremely Positive', emoji: '🤩', comment: 'Amazing feedback — customers are raving and recommending it!' };
    }
    
    const sentimentResults = await Promise.all(
      comments.map(async (comment) => {
        const aiRes = await axios.post('https://saai-engine.onrender.com/analyze-sentiment/', null, {
          params: { text: comment },
        });
        
        const score = aiRes.data.sentiment;
       
        const levelInfo = getSentimentLevel(score);
    
        return {
          text: comment,
          sentimentScore: score,
          sentimentLevel: levelInfo.level,
          emoji: levelInfo.emoji,
          marketingComment: levelInfo.comment,
        };
      })
    );
;

    const totalScore = sentimentResults.reduce((sum, item) => sum + item.sentimentScore, 0);
const averageScore = totalScore / sentimentResults.length;
const overall = getSentimentLevel(averageScore);
    

   res.json({
  results: sentimentResults,
  summary: {
    averageScore: averageScore.toFixed(2),
    overallSentiment: overall.level,
    emoji: overall.emoji,
    marketingComment: overall.comment,
    totalComments: sentimentResults.length,
  }
})

  } catch (error) {
    console.error('Apify scraping failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch or analyze Instagram data' });
  }
};
