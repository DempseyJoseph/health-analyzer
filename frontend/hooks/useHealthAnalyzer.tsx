"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { HealthAnalyzerAddresses } from "@/abi/HealthAnalyzerAddresses";
import { HealthAnalyzerABI } from "@/abi/HealthAnalyzerABI";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type HealthAnalyzerInfoType = {
  abi: typeof HealthAnalyzerABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getHealthAnalyzerByChainId(
  chainId: number | undefined
): HealthAnalyzerInfoType {
  if (!chainId) {
    return { abi: HealthAnalyzerABI.abi };
  }

  const entry =
    HealthAnalyzerAddresses[chainId.toString() as keyof typeof HealthAnalyzerAddresses];

  // Guard against undefined before accessing properties
  if (!entry || !entry.address || entry.address === ethers.ZeroAddress) {
    return { abi: HealthAnalyzerABI.abi, chainId };
  }

  return {
    address: entry.address as `0x${string}` | undefined,
    chainId: entry.chainId ?? chainId,
    chainName: entry.chainName,
    abi: HealthAnalyzerABI.abi,
  };
}

export const useHealthAnalyzer = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  // States
  const [overallScoreHandle, setOverallScoreHandle] = useState<string | undefined>(undefined);
  const [cardioScoreHandle, setCardioScoreHandle] = useState<string | undefined>(undefined);
  const [activityScoreHandle, setActivityScoreHandle] = useState<string | undefined>(undefined);
  const [sleepScoreHandle, setSleepScoreHandle] = useState<string | undefined>(undefined);
  const [anomalyFlagHandle, setAnomalyFlagHandle] = useState<string | undefined>(undefined);
  
  const [clearOverallScore, setClearOverallScore] = useState<ClearValueType | undefined>(undefined);
  const [clearCardioScore, setClearCardioScore] = useState<ClearValueType | undefined>(undefined);
  const [clearActivityScore, setClearActivityScore] = useState<ClearValueType | undefined>(undefined);
  const [clearSleepScore, setClearSleepScore] = useState<ClearValueType | undefined>(undefined);
  const [clearAnomalyFlag, setClearAnomalyFlag] = useState<ClearValueType | undefined>(undefined);
  
  const clearOverallScoreRef = useRef<ClearValueType>(undefined);
  const clearCardioScoreRef = useRef<ClearValueType>(undefined);
  const clearActivityScoreRef = useRef<ClearValueType>(undefined);
  const clearSleepScoreRef = useRef<ClearValueType>(undefined);
  const clearAnomalyFlagRef = useRef<ClearValueType>(undefined);
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingTimeSeries, setIsFetchingTimeSeries] = useState<boolean>(false);
  const [isDecryptingTimeSeries, setIsDecryptingTimeSeries] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  
  // Time series stats handles and clear values
  const [timeSeriesHandles, setTimeSeriesHandles] = useState<{
    avgHeartRate?: string;
    avgSteps?: string;
    avgSleep?: string;
    trendHeartRate?: string;
    trendSteps?: string;
    trendSleep?: string;
    volatilityHeartRate?: string;
    volatilitySteps?: string;
    volatilitySleep?: string;
  } | undefined>(undefined);
  
  const [clearTimeSeriesStats, setClearTimeSeriesStats] = useState<{
    avgHeartRate?: string | bigint;
    avgSteps?: string | bigint;
    avgSleep?: string | bigint;
    trendHeartRate?: string | bigint;
    trendSteps?: string | bigint;
    trendSleep?: string | bigint;
    volatilityHeartRate?: string | bigint;
    volatilitySteps?: string | bigint;
    volatilitySleep?: string | bigint;
  } | undefined>(undefined);

  const healthAnalyzerRef = useRef<HealthAnalyzerInfoType | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const isSubmittingRef = useRef<boolean>(isSubmitting);

  const isDecrypted = overallScoreHandle && overallScoreHandle === clearOverallScore?.handle;

  // HealthAnalyzer contract
  const healthAnalyzer = useMemo(() => {
    const c = getHealthAnalyzerByChainId(chainId);
    healthAnalyzerRef.current = c;
    // Only show deployment not found message if chainId is defined and address is missing
    if (chainId !== undefined && !c.address) {
      setMessage(`HealthAnalyzer deployment not found for chainId=${chainId}.`);
    } else if (chainId === undefined || c.address) {
      // Clear message if chainId is undefined or address exists
      setMessage("");
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!healthAnalyzer) {
      return undefined;
    }
    return (Boolean(healthAnalyzer.address) && healthAnalyzer.address !== ethers.ZeroAddress);
  }, [healthAnalyzer]);

  const canGetScores = useMemo(() => {
    return healthAnalyzer.address && ethersReadonlyProvider && !isRefreshing;
  }, [healthAnalyzer.address, ethersReadonlyProvider, isRefreshing]);

  const refreshScores = useCallback(() => {
    console.log("[useHealthAnalyzer] call refreshScores()");
    if (isRefreshingRef.current) {
      return;
    }

    if (
      !healthAnalyzerRef.current ||
      !healthAnalyzerRef.current?.chainId ||
      !healthAnalyzerRef.current?.address ||
      !ethersReadonlyProvider ||
      !ethersSigner
    ) {
      setOverallScoreHandle(undefined);
      setCardioScoreHandle(undefined);
      setActivityScoreHandle(undefined);
      setSleepScoreHandle(undefined);
      setAnomalyFlagHandle(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = healthAnalyzerRef.current.chainId;
    const thisContractAddress = healthAnalyzerRef.current.address;
    const userAddress = ethersSigner.address;

    const contract = new ethers.Contract(
      thisContractAddress,
      healthAnalyzerRef.current.abi,
      ethersReadonlyProvider
    );

    Promise.all([
      contract.getHealthScores(userAddress),
      contract.getAnomalyFlag(userAddress),
    ])
      .then(([scores, anomaly]) => {
        console.log("[useHealthAnalyzer] getHealthScores()=", scores);
        console.log("[useHealthAnalyzer] getAnomalyFlag()=", anomaly);
        
        if (
          sameChain.current(thisChainId) &&
          thisContractAddress === healthAnalyzerRef.current?.address
        ) {
          setOverallScoreHandle(scores[0]);
          setCardioScoreHandle(scores[1]);
          setActivityScoreHandle(scores[2]);
          setSleepScoreHandle(scores[3]);
          setAnomalyFlagHandle(anomaly);
        }

        isRefreshingRef.current = false;
        setIsRefreshing(false);
      })
      .catch((e) => {
        setMessage("HealthAnalyzer.getHealthScores() call failed! error=" + e);
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [ethersReadonlyProvider, ethersSigner, sameChain]);

  useEffect(() => {
    refreshScores();
  }, [refreshScores]);

  // Decryption
  const canDecrypt = useMemo(() => {
    return (
      healthAnalyzer.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      overallScoreHandle &&
      overallScoreHandle !== ethers.ZeroHash &&
      overallScoreHandle !== clearOverallScore?.handle
    );
  }, [
    healthAnalyzer.address,
    instance,
    ethersSigner,
    isRefreshing,
    isDecrypting,
    overallScoreHandle,
    clearOverallScore,
  ]);

  const decryptScores = useCallback(() => {
    if (isRefreshingRef.current || isDecryptingRef.current) {
      return;
    }

    if (!healthAnalyzer.address || !instance || !ethersSigner) {
      return;
    }

    if (!overallScoreHandle || overallScoreHandle === ethers.ZeroHash) {
      setClearOverallScore(undefined);
      setClearCardioScore(undefined);
      setClearActivityScore(undefined);
      setClearSleepScore(undefined);
      setClearAnomalyFlag(undefined);
      return;
    }

    const thisChainId = chainId;
    const thisContractAddress = healthAnalyzer.address;
    const thisEthersSigner = ethersSigner;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Start decrypting...");

    const run = async () => {
      const isStale = () =>
        thisContractAddress !== healthAnalyzerRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [healthAnalyzer.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        setMessage("Call FHEVM userDecrypt...");

        const handles = [
          { handle: overallScoreHandle, contractAddress: thisContractAddress },
          { handle: cardioScoreHandle, contractAddress: thisContractAddress },
          { handle: activityScoreHandle, contractAddress: thisContractAddress },
          { handle: sleepScoreHandle, contractAddress: thisContractAddress },
          { handle: anomalyFlagHandle, contractAddress: thisContractAddress },
        ].filter((h): h is { handle: string; contractAddress: `0x${string}` } => 
          !!h.handle && h.handle !== ethers.ZeroHash
        );

        const res = await instance.userDecrypt(
          handles,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        setMessage("FHEVM userDecrypt completed!");

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        const resMap = res as Record<string, string | bigint | boolean>;

        if (overallScoreHandle && resMap[overallScoreHandle] !== undefined) {
          setClearOverallScore({ handle: overallScoreHandle, clear: resMap[overallScoreHandle] });
          clearOverallScoreRef.current = { handle: overallScoreHandle, clear: resMap[overallScoreHandle] };
        }
        if (cardioScoreHandle && resMap[cardioScoreHandle] !== undefined) {
          setClearCardioScore({ handle: cardioScoreHandle, clear: resMap[cardioScoreHandle] });
          clearCardioScoreRef.current = { handle: cardioScoreHandle, clear: resMap[cardioScoreHandle] };
        }
        if (activityScoreHandle && resMap[activityScoreHandle] !== undefined) {
          setClearActivityScore({ handle: activityScoreHandle, clear: resMap[activityScoreHandle] });
          clearActivityScoreRef.current = { handle: activityScoreHandle, clear: resMap[activityScoreHandle] };
        }
        if (sleepScoreHandle && resMap[sleepScoreHandle] !== undefined) {
          setClearSleepScore({ handle: sleepScoreHandle, clear: resMap[sleepScoreHandle] });
          clearSleepScoreRef.current = { handle: sleepScoreHandle, clear: resMap[sleepScoreHandle] };
        }
        if (anomalyFlagHandle && resMap[anomalyFlagHandle] !== undefined) {
          setClearAnomalyFlag({ handle: anomalyFlagHandle, clear: resMap[anomalyFlagHandle] });
          clearAnomalyFlagRef.current = { handle: anomalyFlagHandle, clear: resMap[anomalyFlagHandle] };
        }
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };

    run();
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    healthAnalyzer.address,
    instance,
    overallScoreHandle,
    cardioScoreHandle,
    activityScoreHandle,
    sleepScoreHandle,
    anomalyFlagHandle,
    chainId,
    sameChain,
    sameSigner,
  ]);

  // Submit health data
  const canSubmit = useMemo(() => {
    return (
      healthAnalyzer.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isSubmitting
    );
  }, [healthAnalyzer.address, instance, ethersSigner, isRefreshing, isSubmitting]);

  const submitHealthData = useCallback(
    (heartRate: number, steps: number, sleepHours: number) => {
      if (isRefreshingRef.current || isSubmittingRef.current) {
        return;
      }

      if (!healthAnalyzer.address || !instance || !ethersSigner) {
        return;
      }

      const thisChainId = chainId;
      const thisContractAddress = healthAnalyzer.address;
      const thisEthersSigner = ethersSigner;
      const contract = new ethers.Contract(
        thisContractAddress,
        healthAnalyzer.abi,
        thisEthersSigner
      );

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setMessage("Starting encryption...");

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisContractAddress !== healthAnalyzerRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const input = instance.createEncryptedInput(
            thisContractAddress,
            thisEthersSigner.address
          );
          input.add32(heartRate);
          input.add32(steps);
          input.add32(sleepHours);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage("Ignore submission");
            return;
          }

          setMessage("Submitting health data...");

          const timestamp = Math.floor(Date.now() / 1000);
          const tx: ethers.TransactionResponse = await contract.submitHealthData(
            enc.handles[0],
            enc.handles[1],
            enc.handles[2],
            enc.inputProof,
            timestamp
          );

          setMessage(`Wait for tx:${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`Submission completed status=${receipt?.status}`);

          if (isStale()) {
            setMessage("Ignore submission");
            return;
          }

          refreshScores();
        } catch (e) {
          setMessage(`Submission failed! ${e}`);
        } finally {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      };

      run();
    },
    [
      ethersSigner,
      healthAnalyzer.address,
      healthAnalyzer.abi,
      instance,
      chainId,
      refreshScores,
      sameChain,
      sameSigner,
    ]
  );

  // Fetch time series stats
  const fetchTimeSeriesStats = useCallback(
    (startTimestamp: number, endTimestamp: number) => {
      if (isFetchingTimeSeries || !healthAnalyzer.address || !ethersSigner) {
        return;
      }

      const thisChainId = chainId;
      const thisContractAddress = healthAnalyzer.address;
      const userAddress = ethersSigner.address;
      const thisEthersSigner = ethersSigner;

      setIsFetchingTimeSeries(true);
      setMessage("Fetching time series stats...");

      const contract = new ethers.Contract(
        thisContractAddress,
        healthAnalyzer.abi,
        thisEthersSigner
      );

      const run = async () => {
        const isStale = () =>
          thisContractAddress !== healthAnalyzerRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const tx: ethers.TransactionResponse = await contract.getTimeSeriesStats(
            userAddress,
            startTimestamp,
            endTimestamp
          );

          setMessage(`Wait for tx:${tx.hash}...`);

          const receipt = await tx.wait();

          if (isStale()) {
            setMessage("Ignore time series stats fetch");
            setIsFetchingTimeSeries(false);
            return;
          }

          // Parse the TimeSeriesStatsResult event from the transaction receipt
          const event = receipt?.logs.find((log) => {
            try {
              const parsedLog = contract.interface.parseLog(log);
              return parsedLog?.name === "TimeSeriesStatsResult";
            } catch {
              return false;
            }
          });

          if (event) {
            const parsedEvent = contract.interface.parseLog(event);
            if (parsedEvent && parsedEvent.args) {
              const [
                _user,
                avgHeartRateHandle,
                avgStepsHandle,
                avgSleepHandle,
                trendHeartRateHandle,
                trendStepsHandle,
                trendSleepHandle,
                volatilityHeartRateHandle,
                volatilityStepsHandle,
                volatilitySleepHandle,
              ] = parsedEvent.args;

              setTimeSeriesHandles({
                avgHeartRate: avgHeartRateHandle,
                avgSteps: avgStepsHandle,
                avgSleep: avgSleepHandle,
                trendHeartRate: trendHeartRateHandle,
                trendSteps: trendStepsHandle,
                trendSleep: trendSleepHandle,
                volatilityHeartRate: volatilityHeartRateHandle,
                volatilitySteps: volatilityStepsHandle,
                volatilitySleep: volatilitySleepHandle,
              });
              setMessage("Time series stats fetched successfully!");
            } else {
              setMessage("Failed to parse TimeSeriesStatsResult event");
            }
          } else {
            setMessage("TimeSeriesStatsResult event not found in transaction receipt");
          }

          setIsFetchingTimeSeries(false);
        } catch (e) {
          setMessage(`getTimeSeriesStats() call failed! error=${e}`);
          setIsFetchingTimeSeries(false);
        }
      };

      run();
    },
    [ethersSigner, healthAnalyzer.address, healthAnalyzer.abi, chainId, sameChain, sameSigner, isFetchingTimeSeries, ethersReadonlyProvider]
  );

  // Decrypt time series stats
  const decryptTimeSeriesStats = useCallback(() => {
    if (isDecryptingTimeSeries || !healthAnalyzer.address || !instance || !ethersSigner || !timeSeriesHandles) {
      return;
    }

    const thisChainId = chainId;
    const thisContractAddress = healthAnalyzer.address;
    const thisEthersSigner = ethersSigner;

    setIsDecryptingTimeSeries(true);
    setMessage("Decrypting time series stats...");

    const run = async () => {
      const isStale = () =>
        thisContractAddress !== healthAnalyzerRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [healthAnalyzer.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        const handles = [
          { handle: timeSeriesHandles.avgHeartRate, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.avgSteps, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.avgSleep, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.trendHeartRate, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.trendSteps, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.trendSleep, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.volatilityHeartRate, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.volatilitySteps, contractAddress: thisContractAddress },
          { handle: timeSeriesHandles.volatilitySleep, contractAddress: thisContractAddress },
        ].filter((h): h is { handle: string; contractAddress: `0x${string}` } => 
          !!h.handle && h.handle !== ethers.ZeroHash
        );

        const res = await instance.userDecrypt(
          handles,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        setMessage("Time series stats decrypted!");

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        const resMap = res as Record<string, string | bigint | boolean>;

        const getValue = (handle?: string): string | bigint | undefined => {
          if (!handle) return undefined;
          const val = resMap[handle];
          if (val === undefined || typeof val === 'boolean') return undefined;
          return val;
        };

        // Convert unsigned 32-bit integer to signed for trend values
        // If value >= 2^31 (2147483648), it represents a negative number
        // Formula: signed = unsigned - 2^32 (if unsigned >= 2^31)
        const convertToSigned32 = (value: string | bigint | undefined): string | bigint | undefined => {
          if (value === undefined) return undefined;
          const numValue = typeof value === 'bigint' ? value : BigInt(value);
          const SIGN_BIT = BigInt(0x80000000); // 2^31 = 2147483648
          const UINT32_MAX = BigInt(0xFFFFFFFF) + BigInt(1); // 2^32 = 4294967296
          
          if (numValue >= SIGN_BIT) {
            // Convert from unsigned to signed: value - 2^32
            const signedValue = numValue - UINT32_MAX;
            return typeof value === 'bigint' ? signedValue : signedValue.toString();
          }
          return value;
        };

        setClearTimeSeriesStats({
          avgHeartRate: getValue(timeSeriesHandles.avgHeartRate),
          avgSteps: getValue(timeSeriesHandles.avgSteps),
          avgSleep: getValue(timeSeriesHandles.avgSleep),
          trendHeartRate: convertToSigned32(getValue(timeSeriesHandles.trendHeartRate)),
          trendSteps: convertToSigned32(getValue(timeSeriesHandles.trendSteps)),
          trendSleep: convertToSigned32(getValue(timeSeriesHandles.trendSleep)),
          volatilityHeartRate: getValue(timeSeriesHandles.volatilityHeartRate),
          volatilitySteps: getValue(timeSeriesHandles.volatilitySteps),
          volatilitySleep: getValue(timeSeriesHandles.volatilitySleep),
        });
      } catch (e) {
        setMessage(`Time series decryption failed! ${e}`);
      } finally {
        setIsDecryptingTimeSeries(false);
      }
    };

    run();
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    healthAnalyzer.address,
    instance,
    timeSeriesHandles,
    chainId,
    sameChain,
    sameSigner,
    isDecryptingTimeSeries,
  ]);

  const canFetchTimeSeries = useMemo(() => {
    return healthAnalyzer.address && ethersReadonlyProvider && ethersSigner && !isFetchingTimeSeries;
  }, [healthAnalyzer.address, ethersReadonlyProvider, ethersSigner, isFetchingTimeSeries]);

  const canDecryptTimeSeries = useMemo(() => {
    return (
      healthAnalyzer.address &&
      instance &&
      ethersSigner &&
      !isDecryptingTimeSeries &&
      timeSeriesHandles &&
      Object.values(timeSeriesHandles).some((h) => h && h !== ethers.ZeroHash)
    );
  }, [
    healthAnalyzer.address,
    instance,
    ethersSigner,
    isDecryptingTimeSeries,
    timeSeriesHandles,
  ]);

  return {
    contractAddress: healthAnalyzer.address,
    canDecrypt,
    canGetScores,
    canSubmit,
    submitHealthData,
    decryptScores,
    refreshScores,
    isDecrypted,
    message,
    clearOverallScore: clearOverallScore?.clear,
    clearCardioScore: clearCardioScore?.clear,
    clearActivityScore: clearActivityScore?.clear,
    clearSleepScore: clearSleepScore?.clear,
    clearAnomalyFlag: clearAnomalyFlag?.clear,
    overallScoreHandle,
    cardioScoreHandle,
    activityScoreHandle,
    sleepScoreHandle,
    anomalyFlagHandle,
    isDecrypting,
    isRefreshing,
    isSubmitting,
    isDeployed,
    // Time series stats
    fetchTimeSeriesStats,
    decryptTimeSeriesStats,
    canFetchTimeSeries,
    canDecryptTimeSeries,
    isFetchingTimeSeries,
    isDecryptingTimeSeries,
    clearTimeSeriesStats,
    timeSeriesHandles,
  };
};

