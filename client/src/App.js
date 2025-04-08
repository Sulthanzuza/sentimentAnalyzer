import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [postUrl, setPostUrl] = useState('');
  const [sentimentResults, setSentimentResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleTheme = () => setDarkMode(!darkMode);

  const getSentimentEmoji = (sentimentValue) => {
    if (typeof sentimentValue === 'number') {
      if (sentimentValue > 0.7) return '😃';
      if (sentimentValue > 0.4) return '😊';
      if (sentimentValue > 0.1) return '🙂';
      if (sentimentValue > -0.1) return '😐';
      if (sentimentValue > -0.4) return '😕';
      if (sentimentValue > -0.7) return '😠';
      return '😡';
    }
    return '😐';
  };

  const handleAnalyzeLink = async () => {
    if (!postUrl.trim()) return alert(' Please enter a valid URL');
  
    setLoading(true);
    setSentimentResults([]);
    setSummary(null);
  
    let endpoint = '';
    if (postUrl.includes('youtube.com') || postUrl.includes('youtu.be')) {
      endpoint = 'http://localhost:5000/insta/ytcomment';
    } else if (postUrl.includes('instagram.com')) {
      endpoint = 'http://localhost:5000/insta/scrape';
    } else {
      alert(' Unsupported URL. Please enter a valid Instagram or YouTube post link.');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.post(endpoint, {
        url: postUrl,
      });
  
      setSentimentResults(response.data.results);
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Error analyzing link:', err);
      alert(' Something went wrong while analyzing. Please check the server and try again.');
    }
  
    setLoading(false);
  };
  

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <header className="top-bar">
        <h2>Sentiment Analyzer</h2>
        <button className="toggle-btn" onClick={toggleTheme}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <main className="analyzer-container">
        <p>Paste your instagream or youtube URL to analyze its vibe.</p>

        <input
          type="text"
          placeholder="Paste Instagram / Youtube post URL"
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
        />

        <button onClick={handleAnalyzeLink} disabled={loading}>
          {loading ? ' Analyzing...' : 'Analyze Sentiment from Post'}
        </button>

        
        {summary && (
          <section className="summary-section">
            <h3> Overall Sentiment Summary</h3>
            <p style={{ fontSize: '1.2em' }}>
              {summary.emoji} <strong>{summary.overallSentiment}</strong> ({summary.averageScore})
            </p>
            <p>{summary.marketingComment}</p>
            <p>Total Comments Analyzed: <strong>{summary.totalComments}</strong></p>
          </section>
        )}

        
        {sentimentResults.length > 0 && (
          <section className="result-section">
            <h3> Sentiment Analysis Results</h3>
            <ul>
              {sentimentResults.map((item, index) => {
                const sentimentValue = typeof item.sentiment === 'number' ? item.sentiment : 0;
                const sentimentLabel =
                  sentimentValue > 0.1
                    ? 'Positive'
                    : sentimentValue < -0.1
                    ? 'Negative'
                    : 'Neutral';

                return (
                  <li key={index} className={`sentiment ${sentimentLabel.toLowerCase()}`}>
                    <strong>{getSentimentEmoji(sentimentValue)} {sentimentLabel}:</strong>{' '}
                    {item.text.length > 150
                      ? item.text.slice(0, 150) + '...'
                      : item.text}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
