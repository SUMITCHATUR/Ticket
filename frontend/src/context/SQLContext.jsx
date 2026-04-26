import React, { createContext, useState, useContext, useCallback } from 'react';

const SQLContext = createContext(null);

export const useSQLMonitor = () => useContext(SQLContext);

export const SQLProvider = ({ children }) => {
  const [queries, setQueries] = useState([]);

  const addQuery = useCallback((title, sql) => {
    setQueries(prev => [
      ...prev,
      {
        id: Date.now(),
        title,
        sql,
        timestamp: new Date().toLocaleTimeString(),
      }
    ].slice(-10)); // Keep only last 10 queries
  }, []);

  const clearQueries = useCallback(() => {
    setQueries([]);
  }, []);

  return (
    <SQLContext.Provider value={{ queries, addQuery, clearQueries }}>
      {children}
    </SQLContext.Provider>
  );
};
