// frontend/src/App.jsx

import React, { useState } from 'react';
import Header from './components/Header';
import Form from './components/Form';
import Result from './components/Result';
import Error from './components/Error';
import { motion } from 'framer-motion';

function App() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Form onResult={setResult} onError={setError} />

          {error && <Error error={error} />}
          {result && <Result message={result} />}
        </motion.div>
      </main>
    </div>
  );
}

export default App;
