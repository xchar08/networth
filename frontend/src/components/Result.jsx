// frontend/src/components/Result.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';

function Result({ message }) {
  return (
    <motion.div
      className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-100 px-4 py-3 rounded relative max-w-2xl mx-auto mt-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      role="alert"
    >
      <strong className="font-bold">Success!</strong>
      <span className="block sm:inline">{message}</span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <FaCheckCircle className="fill-current h-6 w-6 text-green-500" />
      </span>
    </motion.div>
  );
}

export default Result;