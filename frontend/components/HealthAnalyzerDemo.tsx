"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useHealthAnalyzer } from "@/hooks/useHealthAnalyzer";
import { useState } from "react";

export const HealthAnalyzerDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const healthAnalyzer = useHealthAnalyzer({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [heartRate, setHeartRate] = useState<string>("75");
  const [steps, setSteps] = useState<string>("10000");
  const [sleepHours, setSleepHours] = useState<string>("7");
  const [activeTab, setActiveTab] = useState<'submit' | 'results' | 'analysis'>('submit');

  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-white shadow-lg " +
    "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 " +
    "transition-all duration-200 transform hover:scale-105 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:transform-none";

  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-blue-600 " +
    "bg-white border-2 border-blue-500 shadow-md hover:bg-blue-50 " +
    "transition-all duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const cardClass = "bg-white rounded-2xl shadow-xl p-6 border border-gray-100";
  const titleClass = "text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2";
  const subtitleClass = "text-lg font-semibold text-gray-700 mb-3";
  const inputClass = "w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800";

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Health Analyzer</h1>
            <p className="text-lg text-gray-600 mb-8">Privacy-Preserving Health Metrics Analysis</p>
          </div>
          <button
            className={primaryButtonClass + " text-lg"}
            onClick={connect}
          >
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm7.5 12.5h-3v3h-3v-3h-3v-3h3v-3h3v3h3v3z"/>
            </svg>
            Connect to MetaMask
          </button>
          <p className="mt-4 text-sm text-gray-500">Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  // Only show deployment error if chainId is defined and contract is not deployed
  if (chainId !== undefined && healthAnalyzer.isDeployed === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-l-4 border-red-500">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-red-700 mb-2">Contract Not Deployed</h3>
              <p className="text-gray-700 mb-4">
                The HealthAnalyzer contract is not deployed on Chain ID: <span className="font-mono font-semibold">{chainId}</span>
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">To deploy the contract:</p>
                <code className="block bg-gray-800 text-green-400 px-4 py-2 rounded-lg text-sm">
                  npm run deploy
                </code>
                <p className="text-xs text-gray-500 mt-2">(Run this command in the backend directory)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold">Health Analyzer</h1>
              </div>
              <p className="text-blue-100 ml-15">Privacy-Preserving Health Metrics Analysis with Zama FHEVM</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100 mb-1">Connected Account</p>
              <p className="font-mono text-sm bg-white/10 px-3 py-2 rounded-lg">
                {ethersSigner?.address ? `${ethersSigner.address.slice(0, 6)}...${ethersSigner.address.slice(-4)}` : "No signer"}
              </p>
              <p className="text-xs text-blue-100 mt-1">Chain ID: {chainId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Bar */}
        <div className="mb-6 flex items-center justify-between bg-white rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center gap-4">
            <StatusBadge label="FHEVM" status={fhevmInstance ? "Ready" : "Loading"} isGood={!!fhevmInstance} />
            <StatusBadge label="Contract" status={healthAnalyzer.isDeployed ? "Deployed" : "Not Found"} isGood={!!healthAnalyzer.isDeployed} />
            <StatusBadge label="Signer" status={ethersSigner ? "Connected" : "Disconnected"} isGood={!!ethersSigner} />
          </div>
          {healthAnalyzer.message && (
            <div className="text-sm text-gray-600 max-w-md truncate">
              <span className="font-semibold">Status:</span> {healthAnalyzer.message}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-md p-2 border border-gray-100">
            <div className="flex gap-2">
              <TabButton
                active={activeTab === 'submit'}
                onClick={() => setActiveTab('submit')}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                label="Submit Data"
              />
              <TabButton
                active={activeTab === 'results'}
                onClick={() => setActiveTab('results')}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                label="Health Scores"
              />
              <TabButton
                active={activeTab === 'analysis'}
                onClick={() => setActiveTab('analysis')}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                }
                label="Time Series"
              />
            </div>
          </div>
        </div>

        {/* Submit Health Data View */}
        {activeTab === 'submit' && (
          <div className={cardClass}>
            <h2 className={titleClass}>
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Submit Health Data
            </h2>
            <p className="text-gray-600 mb-6 text-sm">Enter your health metrics. All data is encrypted before submission.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-red-500">❤</span> Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g., 75"
                />
                <p className="text-xs text-gray-500 mt-1">Normal range: 60-100 bpm</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-blue-500">👟</span> Steps
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="e.g., 10000"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 10,000+ steps per day</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-indigo-500">😴</span> Sleep Hours
                </label>
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="e.g., 7.5"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 7-9 hours per night</p>
              </div>
            </div>

            <button
              className={primaryButtonClass + " w-full mt-6"}
              disabled={!healthAnalyzer.canSubmit}
              onClick={() => {
                const hr = parseInt(heartRate);
                const st = parseInt(steps);
                const sh = parseFloat(sleepHours);
                if (!isNaN(hr) && !isNaN(st) && !isNaN(sh)) {
                  healthAnalyzer.submitHealthData(hr, st, Math.floor(sh * 10));
                }
              }}
            >
              {healthAnalyzer.isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Encrypted Data...
                </>
              ) : healthAnalyzer.canSubmit ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Submit Encrypted Health Data
                </>
              ) : (
                "Please wait..."
              )}
            </button>
          </div>
        )}

        {/* Health Score Results View */}
        {activeTab === 'results' && (
          <div className={cardClass}>
            <h2 className={titleClass}>
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Health Score Results
            </h2>
            <p className="text-gray-600 mb-6 text-sm">Your encrypted health scores. Click decrypt to view results.</p>
            
            {healthAnalyzer.isDecrypted ? (
              <div className="space-y-4">
                <ScoreCard
                  icon="💪"
                  title="Overall Health Score"
                  score={healthAnalyzer.clearOverallScore}
                  color="blue"
                />
                <ScoreCard
                  icon="❤"
                  title="Cardiovascular Score"
                  score={healthAnalyzer.clearCardioScore}
                  color="red"
                />
                <ScoreCard
                  icon="👟"
                  title="Activity Score"
                  score={healthAnalyzer.clearActivityScore}
                  color="blue"
                />
                <ScoreCard
                  icon="😴"
                  title="Sleep Quality Score"
                  score={healthAnalyzer.clearSleepScore}
                  color="indigo"
                />
                {healthAnalyzer.clearAnomalyFlag !== undefined && (
                  <div className={`p-4 rounded-lg border-2 ${
                    healthAnalyzer.clearAnomalyFlag === BigInt(1) 
                      ? "bg-red-50 border-red-300" 
                      : "bg-green-50 border-green-300"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {healthAnalyzer.clearAnomalyFlag === BigInt(1) ? "⚠️" : "✅"}
                      </span>
                      <div>
                        <p className={`font-semibold ${
                          healthAnalyzer.clearAnomalyFlag === BigInt(1) ? "text-red-700" : "text-green-700"
                        }`}>
                          {healthAnalyzer.clearAnomalyFlag === BigInt(1) ? "Anomaly Detected" : "All Metrics Normal"}
                        </p>
                        <p className={`text-xs ${
                          healthAnalyzer.clearAnomalyFlag === BigInt(1) ? "text-red-600" : "text-green-600"
                        }`}>
                          {healthAnalyzer.clearAnomalyFlag === BigInt(1) 
                            ? "Your health metrics show unusual patterns. Consider consulting a healthcare professional." 
                            : "Your health metrics are within normal ranges."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-gray-500 mb-2">Scores are encrypted</p>
                <p className="text-xs text-gray-400">Submit data and decrypt to view your health scores</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                className={secondaryButtonClass}
                disabled={!healthAnalyzer.canGetScores}
                onClick={healthAnalyzer.refreshScores}
              >
                {healthAnalyzer.isRefreshing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <button
                className={primaryButtonClass}
                disabled={!healthAnalyzer.canDecrypt}
                onClick={healthAnalyzer.decryptScores}
              >
                {healthAnalyzer.isDecrypting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Decrypting...
                  </>
                ) : healthAnalyzer.isDecrypted ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Decrypted
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Decrypt
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Time Series Analysis View */}
        {activeTab === 'analysis' && (
          <div className={cardClass}>
          <h2 className={titleClass}>
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Time Series Analysis
          </h2>
          <p className="text-gray-600 mb-6 text-sm">View your overall health statistics including averages, trends, and volatility.</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              className={secondaryButtonClass}
              disabled={!healthAnalyzer.canFetchTimeSeries}
              onClick={() => {
                // Use 0 as start time and a very large timestamp as end time to get all data
                const start = 0;
                const end = Math.floor(Date.now() / 1000) + 1000000000; // Current time + ~31 years
                healthAnalyzer.fetchTimeSeriesStats(start, end);
              }}
            >
              {healthAnalyzer.isFetchingTimeSeries ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Fetch Stats
                </>
              )}
            </button>
            <button
              className={primaryButtonClass}
              disabled={!healthAnalyzer.canDecryptTimeSeries}
              onClick={healthAnalyzer.decryptTimeSeriesStats}
            >
              {healthAnalyzer.isDecryptingTimeSeries ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Decrypting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Decrypt Stats
                </>
              )}
            </button>
          </div>
          
          {healthAnalyzer.clearTimeSeriesStats && (
            <div className="border-t-2 border-gray-200 pt-6 space-y-6">
              {/* Averages */}
              <div>
                <h3 className={subtitleClass}>📊 Average Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    label="Heart Rate"
                    value={healthAnalyzer.clearTimeSeriesStats.avgHeartRate}
                    unit="bpm"
                    icon="❤"
                    color="red"
                  />
                  <StatCard
                    label="Steps"
                    value={healthAnalyzer.clearTimeSeriesStats.avgSteps}
                    unit="steps"
                    icon="👟"
                    color="blue"
                  />
                  <StatCard
                    label="Sleep"
                    value={healthAnalyzer.clearTimeSeriesStats.avgSleep}
                    unit="hours"
                    icon="😴"
                    color="indigo"
                  />
                </div>
              </div>

              {/* Trends */}
              <div>
                <h3 className={subtitleClass}>📈 Trend Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TrendCard
                    label="Heart Rate"
                    value={healthAnalyzer.clearTimeSeriesStats.trendHeartRate}
                    icon="❤"
                  />
                  <TrendCard
                    label="Steps"
                    value={healthAnalyzer.clearTimeSeriesStats.trendSteps}
                    icon="👟"
                  />
                  <TrendCard
                    label="Sleep"
                    value={healthAnalyzer.clearTimeSeriesStats.trendSleep}
                    icon="😴"
                  />
                </div>
              </div>

              {/* Volatility */}
              <div>
                <h3 className={subtitleClass}>📉 Volatility (Variance)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    label="Heart Rate"
                    value={healthAnalyzer.clearTimeSeriesStats.volatilityHeartRate}
                    unit=""
                    icon="❤"
                    color="gray"
                  />
                  <StatCard
                    label="Steps"
                    value={healthAnalyzer.clearTimeSeriesStats.volatilitySteps}
                    unit=""
                    icon="👟"
                    color="gray"
                  />
                  <StatCard
                    label="Sleep"
                    value={healthAnalyzer.clearTimeSeriesStats.volatilitySleep}
                    unit=""
                    icon="😴"
                    color="gray"
                  />
                </div>
              </div>
            </div>
          )}

          {/* System Information (Collapsible) */}
          <details className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 cursor-pointer mt-6">
            <summary className="font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              System Information (Click to expand)
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Contract Information</p>
                <InfoRow label="Contract Address" value={healthAnalyzer.contractAddress || "Not deployed"} />
                <InfoRow label="Deployment Status" value={healthAnalyzer.isDeployed ? "Deployed" : "Not deployed"} />
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">FHEVM Status</p>
                <InfoRow label="Instance Status" value={fhevmInstance ? "Ready" : "Not initialized"} />
                <InfoRow label="Status" value={fhevmStatus} />
                <InfoRow label="Error" value={fhevmError ? (typeof fhevmError === 'string' ? fhevmError : fhevmError.message) : "None"} />
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-700 mb-2">Encrypted Handles</p>
                <InfoRow label="Overall Score" value={healthAnalyzer.overallScoreHandle || "N/A"} mono />
                <InfoRow label="Cardio Score" value={healthAnalyzer.cardioScoreHandle || "N/A"} mono />
                <InfoRow label="Activity Score" value={healthAnalyzer.activityScoreHandle || "N/A"} mono />
                <InfoRow label="Sleep Score" value={healthAnalyzer.sleepScoreHandle || "N/A"} mono />
              </div>
            </div>
          </details>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatusBadge({ label, status, isGood }: { label: string; status: string; isGood: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
      <span className="text-sm text-gray-700">
        <span className="font-semibold">{label}:</span> {status}
      </span>
    </div>
  );
}

function ScoreCard({ icon, title, score, color }: { icon: string; title: string; score: string | bigint | boolean | undefined; color: string }) {
  const cardStyles = {
    blue: "bg-blue-50 border-blue-200",
    red: "bg-red-50 border-red-200",
    indigo: "bg-indigo-50 border-indigo-200",
  };
  
  const gradientClasses = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600",
  };

  return (
    <div className={`${cardStyles[color as keyof typeof cardStyles]} border-2 rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-gray-600">{title}</p>
            <p className={`text-2xl font-bold bg-gradient-to-r ${gradientClasses[color as keyof typeof gradientClasses]} bg-clip-text text-transparent`}>
              {score !== undefined ? String(score) : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon, color }: { label: string; value: string | bigint | undefined; unit: string; icon: string; color: string }) {
  // Format sleep hours: divide by 10 if it's sleep-related data
  const formatValue = (val: string | bigint | undefined): string => {
    if (val === undefined) return "N/A";
    // Check if this is sleep-related data (label contains "Sleep" or unit is "hours")
    if (label.toLowerCase().includes("sleep") || unit.toLowerCase() === "hours") {
      const numValue = Number(val) / 10;
      return numValue.toFixed(1);
    }
    return String(val);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-800">
        {formatValue(value)}
        {value !== undefined && unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function TrendCard({ label, value, icon }: { label: string; value: string | bigint | undefined; icon: string }) {
  // Format sleep hours: divide by 10 if it's sleep-related data
  const formatValue = (val: string | bigint | undefined): { display: string; numValue: number | null } => {
    if (val === undefined) return { display: "N/A", numValue: null };
    // Check if this is sleep-related data
    if (label.toLowerCase().includes("sleep")) {
      const numValue = Number(val) / 10;
      // Convert to signed if needed (for trend values)
      const signedValue = numValue >= 2147483648 ? numValue - 4294967296 : numValue;
      return { display: signedValue.toFixed(1), numValue: signedValue };
    }
    // For non-sleep values, check if it's a signed value (trend can be negative)
    const numValue = Number(val);
    const signedValue = numValue >= 2147483648 ? numValue - 4294967296 : numValue;
    return { display: String(signedValue), numValue: signedValue };
  };

  const formatted = formatValue(value);
  const isPositive = formatted.numValue !== null && formatted.numValue > 0;
  const isNegative = formatted.numValue !== null && formatted.numValue < 0;
  
  return (
    <div className={`rounded-lg p-4 border-2 ${
      isPositive ? "bg-green-50 border-green-300" : 
      isNegative ? "bg-red-50 border-red-300" : 
      "bg-gray-50 border-gray-200"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <p className="text-sm font-medium text-gray-700">{label}</p>
        </div>
        {formatted.numValue !== null && (
          <span className="text-2xl">
            {isPositive ? "📈" : isNegative ? "📉" : "➖"}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold mt-2 ${
        isPositive ? "text-green-700" : 
        isNegative ? "text-red-700" : 
        "text-gray-700"
      }`}>
        {formatted.display}
      </p>
      <p className="text-xs mt-1 text-gray-600">
        {isPositive ? "Improving" : isNegative ? "Declining" : value !== undefined ? "Stable" : "No data"}
      </p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | number | undefined; mono?: boolean }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-200 last:border-0">
      <span className="text-gray-600">{label}:</span>
      <span className={`text-gray-800 font-medium ${mono ? 'font-mono text-xs' : ''} max-w-xs truncate`}>
        {value || "N/A"}
      </span>
    </div>
  );
}

