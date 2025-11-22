
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const HealthAnalyzerABI = {
  "abi": [
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "avgHeartRate",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "avgSteps",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "avgSleep",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "trendHeartRate",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "trendSteps",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "trendSleep",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "volatilityHeartRate",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "volatilitySteps",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "volatilitySleep",
          "type": "bytes32"
        }
      ],
      "name": "TimeSeriesStatsResult",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "activityScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "anomalyFlag",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "cardioScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getAnomalyFlag",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "getHealthRecord",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "heartRate",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "steps",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "sleepHours",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "recordTimestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getHealthScores",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "overall",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "cardio",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "activity",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "sleep",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getRecordCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "startTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "endTimestamp",
          "type": "uint256"
        }
      ],
      "name": "getTimeSeriesStats",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "avgHeartRate",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "avgSteps",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "avgSleep",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "trendHeartRate",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "trendSteps",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "trendSleep",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "volatilityHeartRate",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "volatilitySteps",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "volatilitySleep",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "healthRecords",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "heartRate",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "steps",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "sleepHours",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "overallHealthScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "recordTimestamps",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "sleepScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "encHeartRate",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "encSteps",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "encSleepHours",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "submitHealthData",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "timeSeriesStats",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "sumHeartRate",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "sumSteps",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "sumSleepHours",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastTimestamp",
          "type": "uint256"
        },
        {
          "internalType": "euint32",
          "name": "lastHeartRate",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "lastSteps",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "lastSleepHours",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

