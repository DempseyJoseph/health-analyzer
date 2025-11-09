// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Health Analyzer - Encrypted Health Metrics Analysis System
/// @notice A privacy-preserving health scoring system using Zama FHEVM
/// @dev All health data is encrypted and computed in ciphertext state
contract HealthAnalyzer is SepoliaConfig {
    // Health data structure for a user
    struct HealthRecord {
        euint32 heartRate;      // Encrypted heart rate (bpm)
        euint32 steps;          // Encrypted step count
        euint32 sleepHours;     // Encrypted sleep hours
        uint256 timestamp;      // Clear timestamp
    }

    // User's health records indexed by timestamp
    mapping(address => mapping(uint256 => HealthRecord)) public healthRecords;
    
    // User's record timestamps for time series analysis
    mapping(address => uint256[]) public recordTimestamps;
    
    // Encrypted health scores
    mapping(address => euint32) public overallHealthScore;
    mapping(address => euint32) public cardioScore;
    mapping(address => euint32) public activityScore;
    mapping(address => euint32) public sleepScore;
    
    // Encrypted anomaly detection results
    mapping(address => euint32) public anomalyFlag; // 0 = normal, 1 = anomaly
    
    // Event for time series stats
    event TimeSeriesStatsResult(
        address indexed user,
        bytes32 avgHeartRate,
        bytes32 avgSteps,
        bytes32 avgSleep,
        bytes32 trendHeartRate,
        bytes32 trendSteps,
        bytes32 trendSleep,
        bytes32 volatilityHeartRate,
        bytes32 volatilitySteps,
        bytes32 volatilitySleep
    );
    
    // Time series statistics - cumulative values for average calculation
    struct TimeSeriesStats {
        euint32 sumHeartRate;      // Sum of heart rates
        euint32 sumSteps;          // Sum of steps
        euint32 sumSleepHours;     // Sum of sleep hours
        uint256 count;              // Number of records
        uint256 lastTimestamp;     // Last record timestamp
        euint32 lastHeartRate;     // Last heart rate for trend calculation
        euint32 lastSteps;         // Last steps for trend calculation
        euint32 lastSleepHours;    // Last sleep hours for trend calculation
    }
    
    // Time series statistics per user
    mapping(address => TimeSeriesStats) public timeSeriesStats;
    
    // Constants for health scoring (encrypted during computation)
    // Normal ranges (used in comparison operations)
    uint32 private constant NORMAL_HEART_RATE_MIN = 60;
    uint32 private constant NORMAL_HEART_RATE_MAX = 100;
    uint32 private constant NORMAL_STEPS_MIN = 8000;
    uint32 private constant NORMAL_SLEEP_MIN = 6;
    uint32 private constant NORMAL_SLEEP_MAX = 9;
    
    // Anomaly detection thresholds - significant change from average
    // Note: Sleep hours are stored as integer * 10 (e.g., 7.5 hours = 75)
    // So SLEEP_CHANGE_THRESHOLD should be 20 to represent 2.0 hours
    uint32 private constant HEART_RATE_CHANGE_THRESHOLD = 20;  // 20 bpm change
    uint32 private constant STEPS_CHANGE_THRESHOLD = 3000;     // 3000 steps change
    uint32 private constant SLEEP_CHANGE_THRESHOLD = 20;       // 2.0 hours change (stored as 20)
    
    // Weight constants for weighted scoring
    uint32 private constant CARDIO_WEIGHT = 35;    // 35%
    uint32 private constant ACTIVITY_WEIGHT = 35;  // 35%
    uint32 private constant SLEEP_WEIGHT = 30;     // 30%

    /// @notice Submit encrypted health data
    /// @param encHeartRate Encrypted heart rate value
    /// @param encSteps Encrypted step count
    /// @param encSleepHours Encrypted sleep hours
    /// @param inputProof Input proof for verification
    /// @param timestamp Timestamp for the record
    function submitHealthData(
        externalEuint32 encHeartRate,
        externalEuint32 encSteps,
        externalEuint32 encSleepHours,
        bytes calldata inputProof,
        uint256 timestamp
    ) external {
        euint32 heartRate = FHE.fromExternal(encHeartRate, inputProof);
        euint32 steps = FHE.fromExternal(encSteps, inputProof);
        euint32 sleepHours = FHE.fromExternal(encSleepHours, inputProof);

        // Store health record
        healthRecords[msg.sender][timestamp] = HealthRecord({
            heartRate: heartRate,
            steps: steps,
            sleepHours: sleepHours,
            timestamp: timestamp
        });

        // Add timestamp to user's record list
        recordTimestamps[msg.sender].push(timestamp);

        // Update time series statistics
        _updateTimeSeriesStats(msg.sender, heartRate, steps, sleepHours, timestamp);

        // Calculate encrypted scores
        _calculateHealthScores(msg.sender, heartRate, steps, sleepHours);

        // Detect anomalies
        _detectAnomalies(msg.sender, heartRate, steps, sleepHours);

        // Allow decryption permissions
        FHE.allowThis(overallHealthScore[msg.sender]);
        FHE.allowThis(cardioScore[msg.sender]);
        FHE.allowThis(activityScore[msg.sender]);
        FHE.allowThis(sleepScore[msg.sender]);
        FHE.allowThis(anomalyFlag[msg.sender]);
        
        FHE.allow(overallHealthScore[msg.sender], msg.sender);
        FHE.allow(cardioScore[msg.sender], msg.sender);
        FHE.allow(activityScore[msg.sender], msg.sender);
        FHE.allow(sleepScore[msg.sender], msg.sender);
        FHE.allow(anomalyFlag[msg.sender], msg.sender);
    }

    /// @notice Calculate encrypted health scores
    /// @param user User address
    /// @param heartRate Encrypted heart rate
    /// @param steps Encrypted steps
    /// @param sleepHours Encrypted sleep hours
    function _calculateHealthScores(
        address user,
        euint32 heartRate,
        euint32 steps,
        euint32 sleepHours
    ) internal {
        // Calculate cardiovascular health score (0-100)
        // Optimal range: 60-80 bpm = 100, 80-100 = 80, <60 or >100 = lower score
        euint32 heartRateScore = _calculateCardioScore(heartRate);
        cardioScore[user] = heartRateScore;

        // Calculate activity score (0-100)
        // 10000+ steps = 100, 8000-10000 = 80, <8000 = lower score
        euint32 stepScore = _calculateActivityScore(steps);
        activityScore[user] = stepScore;

        // Calculate sleep score (0-100)
        // 7-8 hours = 100, 6-7 or 8-9 = 80, <6 or >9 = lower score
        euint32 sleepScoreValue = _calculateSleepScore(sleepHours);
        sleepScore[user] = sleepScoreValue;

        // Calculate overall weighted score
        // Overall = (Cardio * 0.35) + (Activity * 0.35) + (Sleep * 0.30)
        euint32 cardioWeighted = FHE.mul(heartRateScore, CARDIO_WEIGHT);
        euint32 activityWeighted = FHE.mul(stepScore, ACTIVITY_WEIGHT);
        euint32 sleepWeighted = FHE.mul(sleepScoreValue, SLEEP_WEIGHT);
        
        euint32 weightedSum = FHE.add(cardioWeighted, activityWeighted);
        weightedSum = FHE.add(weightedSum, sleepWeighted);
        
        // Divide by 100 to get percentage (approximate division)
        overallHealthScore[user] = FHE.div(weightedSum, 100);
    }

    /// @notice Calculate cardiovascular health score
    function _calculateCardioScore(euint32 heartRate) internal returns (euint32) {
        // Scoring based on heart rate ranges
        // Optimal: 60-80 bpm = 100 points
        // Good: 50-60 or 80-100 bpm = 80 points
        // Otherwise = 60 points
        
        euint32 minOptimal = FHE.asEuint32(60);
        euint32 maxOptimal = FHE.asEuint32(80);
        euint32 minGood = FHE.asEuint32(50);
        euint32 maxGood = FHE.asEuint32(100);
        
        // Check if in optimal range (60-80)
        ebool inOptimal = FHE.and(FHE.ge(heartRate, minOptimal), FHE.le(heartRate, maxOptimal));
        
        // Check if in good range (50-60 or 80-100)
        ebool inGoodLower = FHE.and(FHE.ge(heartRate, minGood), FHE.lt(heartRate, minOptimal));
        ebool inGoodUpper = FHE.and(FHE.gt(heartRate, maxOptimal), FHE.le(heartRate, maxGood));
        ebool inGood = FHE.or(inGoodLower, inGoodUpper);
        
        // Score selection
        euint32 optimalScore = FHE.asEuint32(100);
        euint32 goodScore = FHE.asEuint32(80);
        euint32 baseScore = FHE.asEuint32(60);
        
        // First check optimal, then good, else base
        euint32 score = FHE.select(inOptimal, optimalScore, FHE.select(inGood, goodScore, baseScore));
        
        return score;
    }

    /// @notice Calculate activity score based on steps
    function _calculateActivityScore(euint32 steps) internal returns (euint32) {
        euint32 minGood = FHE.asEuint32(8000);
        euint32 optimal = FHE.asEuint32(10000);
        
        // If steps >= 10000, score = 100
        // If steps >= 8000, score = 80
        // Otherwise, score = min(100, (steps / 80))
        euint32 optimalScore = FHE.asEuint32(100);
        euint32 goodScore = FHE.asEuint32(80);
        
        ebool isOptimal = FHE.ge(steps, optimal);
        ebool isGood = FHE.ge(steps, minGood);
        
        // Calculate proportional score for steps < 8000
        euint32 proportionalScore = FHE.div(steps, 80);
        euint32 cappedScore = FHE.min(proportionalScore, optimalScore);
        
        euint32 score = FHE.select(
            isOptimal,
            optimalScore,
            FHE.select(isGood, goodScore, cappedScore)
        );
        
        return score;
    }

    /// @notice Calculate sleep score based on sleep hours
    function _calculateSleepScore(euint32 sleepHours) internal returns (euint32) {
        euint32 minOptimal = FHE.asEuint32(7);
        euint32 maxOptimal = FHE.asEuint32(8);
        euint32 minGood = FHE.asEuint32(6);
        euint32 maxGood = FHE.asEuint32(9);
        
        // Optimal: 7-8 hours = 100
        // Good: 6-7 or 8-9 hours = 80
        // Otherwise = 60
        euint32 optimalScore = FHE.asEuint32(100);
        euint32 goodScore = FHE.asEuint32(80);
        euint32 baseScore = FHE.asEuint32(60);
        
        // Check optimal range
        ebool inOptimal = FHE.and(FHE.ge(sleepHours, minOptimal), FHE.le(sleepHours, maxOptimal));
        
        // Check good range (6-7 or 8-9)
        ebool inGoodLower = FHE.and(FHE.ge(sleepHours, minGood), FHE.lt(sleepHours, minOptimal));
        ebool inGoodUpper = FHE.and(FHE.gt(sleepHours, maxOptimal), FHE.le(sleepHours, maxGood));
        ebool inGood = FHE.or(inGoodLower, inGoodUpper);
        
        euint32 score = FHE.select(
            inOptimal,
            optimalScore,
            FHE.select(inGood, goodScore, baseScore)
        );
        
        return score;
    }

    /// @notice Update time series statistics
    /// @param user User address
    /// @param heartRate Encrypted heart rate
    /// @param steps Encrypted steps
    /// @param sleepHours Encrypted sleep hours
    /// @param timestamp Current timestamp
    function _updateTimeSeriesStats(
        address user,
        euint32 heartRate,
        euint32 steps,
        euint32 sleepHours,
        uint256 timestamp
    ) internal {
        TimeSeriesStats storage stats = timeSeriesStats[user];
        
        // Initialize or update cumulative sums
        if (stats.count == 0) {
            // First record: initialize sums with current values
            // Initialize with zero then add current value to ensure proper FHE format
            euint32 zero = FHE.asEuint32(0);
            stats.sumHeartRate = FHE.add(zero, heartRate);
            stats.sumSteps = FHE.add(zero, steps);
            stats.sumSleepHours = FHE.add(zero, sleepHours);
            // Grant ACL to this contract for future homomorphic operations on persistent ciphertexts
            FHE.allowThis(stats.sumHeartRate);
            FHE.allowThis(stats.sumSteps);
            FHE.allowThis(stats.sumSleepHours);
        } else {
            // Subsequent records: add to existing sums
            // Read existing values from storage first, then perform FHE operations
            euint32 currentSumHeartRate = stats.sumHeartRate;
            euint32 currentSumSteps = stats.sumSteps;
            euint32 currentSumSleepHours = stats.sumSleepHours;
            
            // Perform FHE addition with explicit local variables
            stats.sumHeartRate = FHE.add(currentSumHeartRate, heartRate);
            stats.sumSteps = FHE.add(currentSumSteps, steps);
            stats.sumSleepHours = FHE.add(currentSumSleepHours, sleepHours);
            // Re-grant ACL to this contract on updated sums so next submissions can use them
            FHE.allowThis(stats.sumHeartRate);
            FHE.allowThis(stats.sumSteps);
            FHE.allowThis(stats.sumSleepHours);
        }
        
        stats.count = stats.count + 1;
        
        // Store previous values for trend calculation
        stats.lastHeartRate = heartRate;
        stats.lastSteps = steps;
        stats.lastSleepHours = sleepHours;
        stats.lastTimestamp = timestamp;
        // Ensure contract keeps compute rights on latest values used by future computations
        FHE.allowThis(stats.lastHeartRate);
        FHE.allowThis(stats.lastSteps);
        FHE.allowThis(stats.lastSleepHours);
    }

    /// @notice Detect anomalies in health data by comparing with historical average
    /// @param user User address
    /// @param heartRate Encrypted heart rate
    /// @param steps Encrypted steps
    /// @param sleepHours Encrypted sleep hours
    function _detectAnomalies(
        address user,
        euint32 heartRate,
        euint32 steps,
        euint32 sleepHours
    ) internal {
        TimeSeriesStats memory stats = timeSeriesStats[user];
        
        // If this is the first or second submission (count <= 2), no anomaly detection
        // We need at least 3 records to have a meaningful average comparison
        if (stats.count <= 2) {
            anomalyFlag[user] = FHE.asEuint32(0);
            return;
        }
        
        // Calculate historical average (excluding current record)
        // Note: stats.sum* already includes current values, stats.count already includes current record
        // So we need to subtract current values to get previous sum
        // Previous sum = current sum - current value
        euint32 prevSumHeartRate = FHE.sub(stats.sumHeartRate, heartRate);
        euint32 prevSumSteps = FHE.sub(stats.sumSteps, steps);
        euint32 prevSumSleep = FHE.sub(stats.sumSleepHours, sleepHours);
        
        uint32 prevCountPlain = uint32(stats.count - 1);
        euint32 avgHeartRate = FHE.div(prevSumHeartRate, prevCountPlain);
        euint32 avgSteps = FHE.div(prevSumSteps, prevCountPlain);
        euint32 avgSleep = FHE.div(prevSumSleep, prevCountPlain);
        
        // Calculate absolute difference from average
        euint32 heartRateDiff = _absoluteDifference(heartRate, avgHeartRate);
        euint32 stepsDiff = _absoluteDifference(steps, avgSteps);
        euint32 sleepDiff = _absoluteDifference(sleepHours, avgSleep);
        
        // Check if the difference exceeds threshold (significant change)
        euint32 heartRateThreshold = FHE.asEuint32(HEART_RATE_CHANGE_THRESHOLD);
        euint32 stepsThreshold = FHE.asEuint32(STEPS_CHANGE_THRESHOLD);
        euint32 sleepThreshold = FHE.asEuint32(SLEEP_CHANGE_THRESHOLD);
        
        // Check for anomalies: difference > threshold
        ebool heartRateAnomaly = FHE.gt(heartRateDiff, heartRateThreshold);
        ebool stepsAnomaly = FHE.gt(stepsDiff, stepsThreshold);
        ebool sleepAnomaly = FHE.gt(sleepDiff, sleepThreshold);
        
        // Combine all anomaly checks
        ebool anyAnomaly = FHE.or(heartRateAnomaly, FHE.or(stepsAnomaly, sleepAnomaly));
        
        // Set anomaly flag (1 = anomaly detected, 0 = normal)
        euint32 anomaly = FHE.select(
            anyAnomaly,
            FHE.asEuint32(1),
            FHE.asEuint32(0)
        );
        
        anomalyFlag[user] = anomaly;
    }

    /// @notice Get encrypted health scores
    /// @return overall Overall health score
    /// @return cardio Cardiovascular health score
    /// @return activity Activity score
    /// @return sleep Sleep score
    function getHealthScores(address user) external view returns (
        euint32 overall,
        euint32 cardio,
        euint32 activity,
        euint32 sleep
    ) {
        return (
            overallHealthScore[user],
            cardioScore[user],
            activityScore[user],
            sleepScore[user]
        );
    }

    /// @notice Get encrypted anomaly flag
    function getAnomalyFlag(address user) external view returns (euint32) {
        return anomalyFlag[user];
    }

    /// @notice Calculate time series statistics for a user
    /// @param user User address
    /// @param startTimestamp Start timestamp
    /// @param endTimestamp End timestamp
    /// @return avgHeartRate Average heart rate in the time range
    /// @return avgSteps Average steps in the time range
    /// @return avgSleep Average sleep hours in the time range
    /// @return trendHeartRate Trend change for heart rate (current - previous)
    /// @return trendSteps Trend change for steps (current - previous)
    /// @return trendSleep Trend change for sleep hours (current - previous)
    /// @return volatilityHeartRate Volatility (range) for heart rate (max - min approximation)
    /// @return volatilitySteps Volatility (range) for steps
    /// @return volatilitySleep Volatility (range) for sleep hours
    function getTimeSeriesStats(
        address user,
        uint256 startTimestamp,
        uint256 endTimestamp
    ) external returns (
        euint32 avgHeartRate,
        euint32 avgSteps,
        euint32 avgSleep,
        euint32 trendHeartRate,
        euint32 trendSteps,
        euint32 trendSleep,
        euint32 volatilityHeartRate,
        euint32 volatilitySteps,
        euint32 volatilitySleep
    ) {
        TimeSeriesStats memory stats = timeSeriesStats[user];
        
        // Check if we have data in the time range
        if (stats.count == 0 || stats.lastTimestamp < startTimestamp || stats.lastTimestamp > endTimestamp) {
            // Return zeros if no data in range
            euint32 zero = FHE.asEuint32(0);
            return (zero, zero, zero, zero, zero, zero, zero, zero, zero);
        }
        
        // Calculate averages: sum / count
        // Note: FHE.div only supports encrypted / plaintext, so we convert count to uint32
        uint32 countPlain = uint32(stats.count);
        require(countPlain > 0, "No records to calculate average");
        avgHeartRate = FHE.div(stats.sumHeartRate, countPlain);
        avgSteps = FHE.div(stats.sumSteps, countPlain);
        avgSleep = FHE.div(stats.sumSleepHours, countPlain);
        
        // Calculate trends: current - previous (if we have previous record)
        // For trend, we compare current value with the average of previous records
        // Simplified: trend = current - (sum - current) / (count - 1)
        if (stats.count > 1) {
            euint32 prevSumHeartRate = FHE.sub(stats.sumHeartRate, stats.lastHeartRate);
            euint32 prevSumSteps = FHE.sub(stats.sumSteps, stats.lastSteps);
            euint32 prevSumSleep = FHE.sub(stats.sumSleepHours, stats.lastSleepHours);
            
            uint32 prevCountPlain = uint32(stats.count - 1);
            euint32 prevAvgHeartRate = FHE.div(prevSumHeartRate, prevCountPlain);
            euint32 prevAvgSteps = FHE.div(prevSumSteps, prevCountPlain);
            euint32 prevAvgSleep = FHE.div(prevSumSleep, prevCountPlain);
            
            // Trend = current - previous average
            trendHeartRate = FHE.sub(stats.lastHeartRate, prevAvgHeartRate);
            trendSteps = FHE.sub(stats.lastSteps, prevAvgSteps);
            trendSleep = FHE.sub(stats.lastSleepHours, prevAvgSleep);
        } else {
            // No previous data, trend is zero
            trendHeartRate = FHE.asEuint32(0);
            trendSteps = FHE.asEuint32(0);
            trendSleep = FHE.asEuint32(0);
        }
        
        // Calculate volatility as simplified range approximation
        // Using average absolute deviation: |current - average|
        // This is a simplified volatility measure that works in FHE
        euint32 absDevHeartRate = _absoluteDifference(stats.lastHeartRate, avgHeartRate);
        euint32 absDevSteps = _absoluteDifference(stats.lastSteps, avgSteps);
        euint32 absDevSleep = _absoluteDifference(stats.lastSleepHours, avgSleep);
        
        // Scale volatility for better representation (multiply by 2 for range approximation)
        volatilityHeartRate = FHE.mul(absDevHeartRate, 2);
        volatilitySteps = FHE.mul(absDevSteps, 2);
        volatilitySleep = FHE.mul(absDevSleep, 2);
        
        // Allow decryption permissions
        FHE.allowThis(avgHeartRate);
        FHE.allowThis(avgSteps);
        FHE.allowThis(avgSleep);
        FHE.allowThis(trendHeartRate);
        FHE.allowThis(trendSteps);
        FHE.allowThis(trendSleep);
        FHE.allowThis(volatilityHeartRate);
        FHE.allowThis(volatilitySteps);
        FHE.allowThis(volatilitySleep);
        
        FHE.allow(avgHeartRate, user);
        FHE.allow(avgSteps, user);
        FHE.allow(avgSleep, user);
        FHE.allow(trendHeartRate, user);
        FHE.allow(trendSteps, user);
        FHE.allow(trendSleep, user);
        FHE.allow(volatilityHeartRate, user);
        FHE.allow(volatilitySteps, user);
        FHE.allow(volatilitySleep, user);
        
        // Emit event with all handles so frontend can retrieve them
        // Convert euint32 to bytes32 using FHE.toBytes32
        emit TimeSeriesStatsResult(
            user,
            FHE.toBytes32(avgHeartRate),
            FHE.toBytes32(avgSteps),
            FHE.toBytes32(avgSleep),
            FHE.toBytes32(trendHeartRate),
            FHE.toBytes32(trendSteps),
            FHE.toBytes32(trendSleep),
            FHE.toBytes32(volatilityHeartRate),
            FHE.toBytes32(volatilitySteps),
            FHE.toBytes32(volatilitySleep)
        );
    }
    
    /// @notice Calculate absolute difference between two encrypted values
    /// @param a First value
    /// @param b Second value
    /// @return Absolute difference |a - b|
    function _absoluteDifference(euint32 a, euint32 b) internal returns (euint32) {
        // Calculate |a - b| = max(a, b) - min(a, b)
        ebool aGreater = FHE.ge(a, b);
        euint32 maxVal = FHE.select(aGreater, a, b);
        euint32 minVal = FHE.select(aGreater, b, a);
        return FHE.sub(maxVal, minVal);
    }

    /// @notice Get a specific health record
    function getHealthRecord(address user, uint256 timestamp) external view returns (
        euint32 heartRate,
        euint32 steps,
        euint32 sleepHours,
        uint256 recordTimestamp
    ) {
        HealthRecord memory record = healthRecords[user][timestamp];
        return (record.heartRate, record.steps, record.sleepHours, record.timestamp);
    }

    /// @notice Get user's record count
    function getRecordCount(address user) external view returns (uint256) {
        return recordTimestamps[user].length;
    }
}

