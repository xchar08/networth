// frontend/src/components/Error.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';

function Error({ error }) {
  return (
    <motion.div
      className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-100 px-4 py-3 rounded relative max-w-2xl mx-auto mt-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      role="alert"
    >
      <strong className="font-bold">Error!</strong>
      <span className="block sm:inline">{error}</span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <FaExclamationTriangle className="fill-current h-6 w-6 text-red-500" />
      </span>
    </motion.div>
  );
}

export default Error;
