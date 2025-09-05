import React, { useState, useEffect } from 'react';

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

function App() {
  const [inputType, setInputType] = useState('text');
  const [inputValue, setInputValue] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('light');
  const [showResult, setShowResult] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('sentimentAnalysisHistory');
      if (storedHistory) {
        setAnalysisHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to parse history from localStorage", error);
      localStorage.removeItem('sentimentAnalysisHistory');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowResult(false);
    if (!inputValue.trim()) {
      setError('Please enter some text or a valid URL.');
      return;
    }

    setIsLoading(true);
    setPrediction(null);
    setError('');

    const endpoint = inputType === 'text' ? '/predict' : '/analyze-url';
    const payload = inputType === 'text' ? { text: inputValue } : { url: inputValue };

    try {
      const response = await fetch(`https://sentiment-4-8qyd.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Network response was not ok.');
      
      setPrediction(data);
      setShowResult(true);

      const newHistoryEntry = {
        id: Date.now(),
        inputType: inputType,
        input: inputValue,
        result: data,
      };

      setAnalysisHistory(prevHistory => {
        const updatedHistory = [newHistoryEntry, ...prevHistory].slice(0, 10);
        localStorage.setItem('sentimentAnalysisHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

    } catch (err) {
      setError(err.message || 'An error occurred. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setAnalysisHistory([]);
    localStorage.removeItem('sentimentAnalysisHistory');
  };

  const renderResult = () => {
    if (!prediction) return null;
    const isPositive = prediction.sentiment === 'Positive';
    const confidencePercentage = (prediction.confidence * 100).toFixed(0);
    const progressBarColor = isPositive ? 'bg-green-500' : 'bg-red-500';
    return (
      <div className={`transition-opacity duration-500 ease-in-out ${showResult ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mt-8 space-y-4 rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
          <div className="flex justify-between items-center font-medium"><p className="text-slate-700 dark:text-slate-300">Result:</p><p className={`font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{prediction.sentiment}</p></div>
          <div className="flex justify-between items-center font-medium"><p className="text-slate-700 dark:text-slate-300">Confidence:</p><p className="font-bold text-slate-900 dark:text-slate-100">{confidencePercentage}%</p></div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5"><div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${confidencePercentage}%` }}></div></div>
        </div>
      </div>
    );
  };
  
  const activeTabStyle = "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900";
  const inactiveTabStyle = "text-slate-500 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700";

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 pt-12 lg:pt-24">
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900">{theme === 'light' ? <MoonIcon /> : <SunIcon />}</button>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Sentiment Analysis</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">AI-powered text analysis at the speed of thought.</p>
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
 
        <div className="w-full lg:w-1/2">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 md:p-8">
            <div className="flex justify-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
              <button onClick={() => {setInputType('text'); setInputValue('');}} className={`w-full py-2 rounded-md font-semibold transition-colors duration-300 ${inputType === 'text' ? activeTabStyle : inactiveTabStyle}`}>Text</button>
              <button onClick={() => {setInputType('url'); setInputValue('');}} className={`w-full py-2 rounded-md font-semibold transition-colors duration-300 ${inputType === 'url' ? activeTabStyle : inactiveTabStyle}`}>URL</button>
            </div>
            <form onSubmit={handleSubmit}>
              {inputType === 'text' ? (
                <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Start typing here..." className="w-full h-32 p-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-800 dark:focus-ring-slate-200 focus:outline-none transition-colors duration-300 resize-none"/>
              ) : (
                <input type="url" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="https://example.com/article" className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-800 dark:focus-ring-slate-200 focus:outline-none transition-colors duration-300"/>
              )}
              <button type="submit" disabled={isLoading} className="w-full mt-4 flex items-center justify-center bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold py-3 px-4 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 dark:focus-ring-slate-200 disabled:opacity-50 transition-all duration-300">{isLoading ? <LoadingSpinner /> : 'Analyze'}</button>
            </form>
            {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            {renderResult()}
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          {analysisHistory.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">History</h2>
                <button onClick={clearHistory} className="text-sm font-semibold text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Clear History</button>
              </div>
              <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {analysisHistory.map((item) => {
                  const isPositive = item.result.sentiment === 'Positive';
                  return (
                    <li key={item.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate pb-2">
                        {item.inputType === 'url' ? 'URL: ' : ''}{item.input}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className={`font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.result.sentiment}
                        </span>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {(item.result.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
