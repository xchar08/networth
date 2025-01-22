// frontend/src/components/Form.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

function Form({ onResult, onError }) {
  const [linkedin1, setLinkedin1] = useState('');
  const [linkedin2, setLinkedin2] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError('');
    onResult('');

    try {
      // Updated URL to include .js extension for the API call
      const response = await axios.post('/api/generate-message.js', {
        linkedin1,
        linkedin2,
        apiKey
      });

      onResult(response.data.message);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to generate message. Please check your inputs and try again.';

      // Convert error response to string if necessary
      if (err.response && err.response.data && err.response.data.error) {
        const respError = err.response.data.error;
        errorMsg = typeof respError === 'object' ? JSON.stringify(respError) : respError;
      }
      
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="linkedin1">
          LinkedIn Profile 1 URL
        </label>
        <input
          type="url"
          id="linkedin1"
          value={linkedin1}
          onChange={(e) => setLinkedin1(e.target.value)}
          placeholder="https://www.linkedin.com/in/username1"
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="linkedin2">
          LinkedIn Profile 2 URL
        </label>
        <input
          type="url"
          id="linkedin2"
          value={linkedin2}
          onChange={(e) => setLinkedin2(e.target.value)}
          placeholder="https://www.linkedin.com/in/username2"
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="apiKey">
          Nebius API Key
        </label>
        <input
          type="text"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Nebius API Key"
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="flex items-center justify-between">
        <motion.button
          type="submit"
          className="bg-linkedin hover:bg-linkedin-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          )}
          {loading ? 'Generating...' : 'Generate Message'}
        </motion.button>
      </div>
    </motion.form>
  );
}

export default Form;
