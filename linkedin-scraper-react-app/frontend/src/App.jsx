// frontend/src/App.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [linkedin1, setLinkedin1] = useState('');
  const [linkedin2, setLinkedin2] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await axios.post('/api/generate-message', {
        linkedin1,
        linkedin2,
        apiKey
      });

      setResult(response.data.message);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to generate message. Please check your inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>LinkedIn Profile Scraper</h1>
      <form onSubmit={handleSubmit} className="scraper-form">
        <label htmlFor="linkedin1">LinkedIn Profile 1 URL:</label>
        <input
          type="url"
          id="linkedin1"
          name="linkedin1"
          value={linkedin1}
          onChange={(e) => setLinkedin1(e.target.value)}
          placeholder="https://www.linkedin.com/in/username1"
          required
        />

        <label htmlFor="linkedin2">LinkedIn Profile 2 URL:</label>
        <input
          type="url"
          id="linkedin2"
          name="linkedin2"
          value={linkedin2}
          onChange={(e) => setLinkedin2(e.target.value)}
          placeholder="https://www.linkedin.com/in/username2"
          required
        />

        <label htmlFor="apiKey">Nebius API Key:</label>
        <input
          type="text"
          id="apiKey"
          name="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Nebius API Key"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Message'}
        </button>
      </form>

      {error && (
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result">
          <h2>Generated Message for Coffee Chat</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
