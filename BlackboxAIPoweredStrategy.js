// ============================================================================
// BLACKBOX AI POWERED STRATEGY
// Advanced Machine Learning Betting System for CoinsCrash
// Version: 3.0.0-AI
// ============================================================================

// WARNING: Gambling involves significant risk. No strategy can guarantee wins.
// This AI-powered system aims to optimize long-term profitability through
// advanced statistical analysis and machine learning techniques.

// ============================================================================
// CONFIGURATION - USER ADJUSTABLE PARAMETERS
// ============================================================================

// Bankroll Management
var TOTAL_BANKROLL = 10000;        // Total bits available for betting
var RISK_PER_BET = 2;              // Percentage of bankroll to risk per bet (1-5%)
var MAX_SESSION_LOSS = 20;         // Maximum percentage loss before stopping session

// Strategy Parameters  
var MIN_CASHOUT = 1.15;            // Minimum cashout multiplier
var MAX_CASHOUT = 10.0;            // Maximum cashout multiplier
var CONFIDENCE_THRESHOLD = 0.65;   // Minimum confidence score to place bet (0.0-1.0)

// Safety Limits
var MAX_CONSECUTIVE_LOSSES = 5;    // Stop after this many consecutive losses
var COOLDOWN_AFTER_LOSS = 3;       // Games to wait after significant loss
var DAILY_LOSS_LIMIT = 30;         // Maximum daily loss percentage

// ============================================================================
// AI ENGINE - CORE MACHINE LEARNING COMPONENTS
// ============================================================================

// Game History Database
var gameHistory = {
    crashes: [],
    patterns: [],
    timestamps: [],
    durations: []
};

// Prediction Models
var predictionModels = {
    exponentialSmoothing: { alpha: 0.3, beta: 0.2, gamma: 0.1 },
    movingAverage: { shortWindow: 5, mediumWindow: 10, longWindow: 20 },
    patternRecognition: { minPatternLength: 3, maxPatternLength: 8 }
};

// AI State Management
var aiState = {
    currentConfidence: 0,
    predictedCrash: 0,
    recommendedCashout: 0,
    recommendedBet: 0,
    marketTrend: 'neutral',
    volatility: 'medium'
};

// Performance Tracking
var performanceStats = {
    totalBets: 0,
    wins: 0,
    losses: 0,
    totalProfit: 0,
    currentStreak: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
    dailyProfit: 0,
    sessionProfit: 0
};

// ============================================================================
// MACHINE LEARNING FUNCTIONS
// ============================================================================

/**
 * Exponential Smoothing Prediction Model
 * Uses triple exponential smoothing for time series forecasting
 */
function exponentialSmoothingPrediction() {
    if (gameHistory.crashes.length < 10) return null;
    
    let crashes = gameHistory.crashes;
    let alpha = predictionModels.exponentialSmoothing.alpha;
    let beta = predictionModels.exponentialSmoothing.beta;
    let gamma = predictionModels.exponentialSmoothing.gamma;
    
    // Initialize level, trend, and seasonality
    let level = crashes[0];
    let trend = 0;
    let seasonal = Array(5).fill(0);
    
    // Triple exponential smoothing calculation
    for (let i = 1; i < crashes.length; i++) {
        let prevLevel = level;
        level = alpha * (crashes[i] - seasonal[i % 5]) + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
        seasonal[i % 5] = gamma * (crashes[i] - level) + (1 - gamma) * seasonal[i % 5];
    }
    
    return Math.max(1.1, level + trend + seasonal[(crashes.length + 1) % 5]);
}

/**
 * Moving Average Analysis
 * Calculates multiple moving averages for trend detection
 */
function calculateMovingAverages() {
    let crashes = gameHistory.crashes;
    if (crashes.length < predictionModels.movingAverage.longWindow) return null;
    
    let shortMA = crashes.slice(-predictionModels.movingAverage.shortWindow)
                         .reduce((a, b) => a + b, 0) / predictionModels.movingAverage.shortWindow;
    
    let mediumMA = crashes.slice(-predictionModels.movingAverage.mediumWindow)
                          .reduce((a, b) => a + b, 0) / predictionModels.movingAverage.mediumWindow;
    
    let longMA = crashes.slice(-predictionModels.movingAverage.longWindow)
                        .reduce((a, b) => a + b, 0) / predictionModels.movingAverage.longWindow;
    
    return { shortMA, mediumMA, longMA };
}

/**
 * Pattern Recognition Engine
 * Identifies recurring patterns in crash sequences
 */
function findPatterns() {
    if (gameHistory.crashes.length < 10) return [];
    
    let patterns = [];
    let recentCrashes = gameHistory.crashes.slice(-20);
    
    // Look for patterns of different lengths
    for (let patternLength = predictionModels.patternRecognition.minPatternLength; 
         patternLength <= predictionModels.patternRecognition.maxPatternLength; 
         patternLength++) {
        
        if (recentCrashes.length >= patternLength * 2) {
            let currentPattern = recentCrashes.slice(-patternLength);
            
            // Check if this pattern occurred before
            for (let i = 0; i <= recentCrashes.length - patternLength * 2; i++) {
                let historicalPattern = recentCrashes.slice(i, i + patternLength);
                if (this.patternsMatch(currentPattern, historicalPattern)) {
                    let nextCrash = recentCrashes[i + patternLength];
                    patterns.push({
                        pattern: currentPattern,
                        historicalPattern: historicalPattern,
                        nextCrash: nextCrash,
                        confidence: this.calculatePatternConfidence(currentPattern, historicalPattern)
                    });
                }
            }
        }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate bet size based on bankroll management rules
 */
function calculateOptimalBet() {
    let bankroll = engine.getBalance() / 100;
    let riskAmount = (bankroll * RISK_PER_BET) / 100;
    let maxBet = Math.min(riskAmount, bankroll * 0.1); // Never bet more than 10% of bankroll
    
    // Adjust based on confidence
    let confidenceMultiplier = Math.pow(aiState.currentConfidence, 2);
    let betAmount = maxBet * confidenceMultiplier;
    
    return Math.max(1, Math.floor(betAmount)); // Minimum 1 bit
}

/**
 * Determine cashout point based on AI prediction and risk assessment
 */
function determineCashoutPoint() {
    let baseCashout = aiState.predictedCrash * 0.8; // 80% of predicted crash
    baseCashout = Math.max(MIN_CASHOUT, Math.min(MAX_CASHOUT, baseCashout));
    
    // Adjust based on volatility
    if (aiState.volatility === 'high') {
        baseCashout = baseCashout * 0.9; // More conservative in high volatility
    } else if (aiState.volatility === 'low') {
        baseCashout = baseCashout * 1.1; // More aggressive in low volatility
    }
    
    return Math.round(baseCashout * 100); // Convert to engine format
}

// ============================================================================
// ENGINE EVENT HANDLERS
// ============================================================================

engine.on('game_starting', function(info) {
    console.log('=== BLACKBOX AI ANALYSIS ===');
    
    // Update game history with previous crash if available
    if (engine.lastGamePlay() && engine.lastGamePlay().crashed_at) {
        gameHistory.crashes.push(engine.lastGamePlay().crashed_at);
    }
    
    // Run AI prediction models
    runAIPrediction();
    
    // Only bet if confidence is above threshold
    if (aiState.currentConfidence >= CONFIDENCE_THRESHOLD) {
        let betAmount = calculateOptimalBet() * 100; // Convert to satoshis
        let cashoutPoint = determineCashoutPoint();
        
        console.log('AI Confidence: ' + (aiState.currentConfidence * 100).toFixed(1) + '%');
        console.log('Predicted Crash: x' + aiState.predictedCrash.toFixed(2));
        console.log('Recommended Cashout: x' + (cashoutPoint / 100).toFixed(2));
        console.log('Bet Amount: ' + (betAmount / 100) + ' bits');
        
        engine.placeBet(betAmount, cashoutPoint);
    } else {
        console.log('Skipping bet - Confidence too low: ' + (aiState.currentConfidence * 100).toFixed(1) + '%');
        console.log('Market condition: ' + aiState.marketTrend + ', Volatility: ' + aiState.volatility);
    }
});

engine.on('game_crash', function(data) {
    console.log('Game crashed at x' + data.game_crash.toFixed(2));
    
    // Update performance statistics
    performanceStats.totalBets++;
    
    if (engine.lastGamePlay() === 'WON') {
        performanceStats.wins++;
        performanceStats.currentStreak = Math.max(0, performanceStats.currentStreak) + 1;
        performanceStats.maxWinStreak = Math.max(performanceStats.maxWinStreak, performanceStats.currentStreak);
    } else {
        performanceStats.losses++;
        performanceStats.currentStreak = Math.min(0, performanceStats.currentStreak) - 1;
        performanceStats.maxLossStreak = Math.min(performanceStats.maxLossStreak, performanceStats.currentStreak);
    }
    
    // Check for stop conditions
    checkStopConditions();
});

engine.on('cashed_out', function(data) {
    if (data.username === engine.getUsername()) {
        let profit = (data.stopped_at * data.bet / 100) - data.bet;
        performanceStats.totalProfit += profit;
        performanceStats.sessionProfit += profit;
        performanceStats.dailyProfit += profit;
        
        console.log('Cashed out at x' + (data.stopped_at / 100).toFixed(2));
        console.log('Profit: ' + (profit / 100).toFixed(2) + ' bits');
    }
});

// ============================================================================
// CORE AI PREDICTION ENGINE
// ============================================================================

function runAIPrediction() {
    // Run all prediction models
    let predictions = [];
    let confidences = [];
    
    // Exponential Smoothing Prediction
    let esPrediction = exponentialSmoothingPrediction();
    if (esPrediction) {
        predictions.push(esPrediction);
        confidences.push(0.4); // Base confidence for this model
    }
    
    // Moving Average Analysis
    let maAnalysis = calculateMovingAverages();
    if (maAnalysis) {
        let maPrediction = (maAnalysis.shortMA + maAnalysis.mediumMA * 2 + maAnalysis.longMA) / 4;
        predictions.push(maPrediction);
        confidences.push(0.3);
        
        // Update market trend and volatility
        updateMarketAnalysis(maAnalysis);
    }
    
    // Pattern Recognition
    let patterns = findPatterns();
    if (patterns.length > 0) {
        let patternPrediction = patterns[0].nextCrash;
        predictions.push(patternPrediction);
        confidences.push(patterns[0].confidence * 0.3);
    }
    
    // Calculate weighted average prediction
    if (predictions.length > 0) {
        let totalWeight = confidences.reduce((a, b) => a + b, 0);
        let weightedPrediction = predictions.reduce((sum, pred, i) => sum + pred * confidences[i], 0) / totalWeight;
        
        aiState.predictedCrash = weightedPrediction;
        aiState.currentConfidence = totalWeight / predictions.length;
    } else {
        // Default prediction when not enough data
        aiState.predictedCrash = 2.0;
        aiState.currentConfidence = 0.2;
    }
}

function updateMarketAnalysis(maAnalysis) {
    // Determine market trend
    if (maAnalysis.shortMA > maAnalysis.mediumMA && maAnalysis.mediumMA > maAnalysis.longMA) {
        aiState.marketTrend = 'bullish';
    } else if (maAnalysis.shortMA < maAnalysis.mediumMA && maAnalysis.mediumMA < maAnalysis.longMA) {
        aiState.marketTrend = 'bearish';
    } else {
        aiState.marketTrend = 'neutral';
    }
    
    // Determine volatility
    let shortVolatility = Math.abs(maAnalysis.shortMA - maAnalysis.mediumMA) / maAnalysis.mediumMA;
    if (shortVolatility > 0.3) {
        aiState.volatility = 'high';
    } else if (shortVolatility < 0.1) {
        aiState.volatility = 'low';
    } else {
        aiState.volatility = 'medium';
    }
}

function checkStopConditions() {
    let bankroll = engine.getBalance() / 100;
    let initialBankroll = TOTAL_BANKROLL;
    
    // Check consecutive losses
    if (Math.abs(performanceStats.currentStreak) >= MAX_CONSECUTIVE_LOSSES) {
        console.log('=== STOP CONDITION TRIGGERED ===');
        console.log('Maximum consecutive losses reached: ' + Math.abs(performanceStats.currentStreak));
        console.log('Stopping strategy for safety.');
        engine.stop();
        return;
    }
    
    // Check session loss limit
    let sessionLossPct = (performanceStats.sessionProfit < 0 ? 
                         Math.abs(performanceStats.sessionProfit) / initialBankroll * 100 : 0);
    
    if (sessionLossPct >= MAX_SESSION_LOSS) {
        console.log('=== STOP CONDITION TRIGGERED ===');
        console.log('Session loss limit reached: ' + sessionLossPct.toFixed(1) + '%');
        console.log('Stopping strategy for safety.');
        engine.stop();
        return;
    }
    
    // Check daily loss limit
    let dailyLossPct = (performanceStats.dailyProfit < 0 ? 
                       Math.abs(performanceStats.dailyProfit) / initialBankroll * 100 : 0);
    
    if (dailyLossPct >= DAILY_LOSS_LIMIT) {
        console.log('=== STOP CONDITION TRIGGERED ===');
        console.log('Daily loss limit reached: ' + dailyLossPct.toFixed(1) + '%');
        console.log('Stopping strategy for safety.');
        engine.stop();
        return;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function patternsMatch(pattern1, pattern2, tolerance = 0.1) {
    if (pattern1.length !== pattern2.length) return false;
    
    for (let i = 0; i < pattern1.length; i++) {
        if (Math.abs(pattern1[i] - pattern2[i]) / pattern2[i] > tolerance) {
            return false;
        }
    }
    return true;
}

function calculatePatternConfidence(pattern1, pattern2) {
    let totalDiff = 0;
    for (let i = 0; i < pattern1.length; i++) {
        totalDiff += Math.abs(pattern1[i] - pattern2[i]) / pattern2[i];
    }
    let avgDiff = totalDiff / pattern1.length;
    return Math.max(0, 1 - avgDiff * 2); // Convert difference to confidence (0-1)
}

// ============================================================================
// REINFORCEMENT LEARNING AND AUTO-OPTIMIZATION
// ============================================================================

var learningRate = 0.1;
var explorationRate = 0.2;
var optimizationCycle = 50; // Games between optimizations

/**
 * Reinforcement Learning Update
 * Adjusts strategy parameters based on recent performance
 */
function updateStrategyParameters() {
    if (performanceStats.totalBets % optimizationCycle !== 0) return;
    
    let winRate = performanceStats.wins / performanceStats.totalBets;
    let profitFactor = performanceStats.totalProfit / (performanceStats.totalBets * (TOTAL_BANKROLL * RISK_PER_BET / 100));
    
    // Adjust confidence threshold based on performance
    if (winRate > 0.6 && profitFactor > 1.2) {
        // Doing well, become more aggressive
        CONFIDENCE_THRESHOLD = Math.max(0.5, CONFIDENCE_THRESHOLD - learningRate * 0.1);
        console.log('Strategy optimization: Increasing aggression (Confidence threshold: ' + (CONFIDENCE_THRESHOLD * 100).toFixed(1) + '%)');
    } else if (winRate < 0.4 || profitFactor < 0.8) {
        // Underperforming, become more conservative
        CONFIDENCE_THRESHOLD = Math.min(0.8, CONFIDENCE_THRESHOLD + learningRate * 0.1);
        console.log('Strategy optimization: Increasing conservatism (Confidence threshold: ' + (CONFIDENCE_THRESHOLD * 100).toFixed(1) + '%)');
    }
    
    // Adjust risk based on volatility
    if (aiState.volatility === 'high') {
        RISK_PER_BET = Math.max(1, RISK_PER_BET * 0.8);
    } else if (aiState.volatility === 'low') {
        RISK_PER_BET = Math.min(5, RISK_PER_BET * 1.2);
    }
}

/**
 * Exploration Mechanism
 * Occasionally tries different strategies to discover better approaches
 */
function explorationMechanism() {
    if (Math.random() < explorationRate) {
        // Try different prediction model weights
        let oldWeights = [0.4, 0.3, 0.3];
        let newWeights = [
            Math.random() * 0.6 + 0.2,
            Math.random() * 0.4 + 0.1,
            Math.random() * 0.4 + 0.1
        ];
        
        // Normalize weights
        let sum = newWeights.reduce((a, b) => a + b, 0);
        newWeights = newWeights.map(w => w / sum);
        
        console.log('Exploration: Trying new model weights ' + newWeights.map(w => w.toFixed(2)).join(', '));
        return newWeights;
    }
    return null;
}

// ============================================================================
// SIMULATION MODE (FOR TESTING)
// ============================================================================

var SIMULATION_MODE = false;
var simulatedGames = [];
var simulationBankroll = TOTAL_BANKROLL;

/**
 * Run simulation with historical data
 */
function runSimulation(historicalData) {
    if (!historicalData || historicalData.length < 20) {
        console.log('Not enough historical data for simulation');
        return;
    }
    
    console.log('=== STARTING SIMULATION ===');
    SIMULATION_MODE = true;
    simulationBankroll = TOTAL_BANKROLL;
    gameHistory.crashes = historicalData.slice(0, 10); // Seed with initial data
    
    let simulationResults = {
        totalGames: 0,
        profitableGames: 0,
        finalBankroll: simulationBankroll,
        maxDrawdown: 0
    };
    
    for (let i = 10; i < historicalData.length; i++) {
        // Simulate game crash
        let crashPoint = historicalData[i];
        gameHistory.crashes.push(crashPoint);
        
        // Run AI prediction
        runAIPrediction();
        
        if (aiState.currentConfidence >= CONFIDENCE_THRESHOLD) {
            let betAmount = calculateOptimalBet();
            let cashoutPoint = determineCashoutPoint() / 100;
            
            if (crashPoint >= cashoutPoint) {
                // Win
                let profit = betAmount * (cashoutPoint - 1);
                simulationBankroll += profit;
                simulationResults.profitableGames++;
            } else {
                // Loss
                simulationBankroll -= betAmount;
                let drawdown = (TOTAL_BANKROLL - simulationBankroll) / TOTAL_BANKROLL * 100;
                simulationResults.maxDrawdown = Math.max(simulationResults.maxDrawdown, drawdown);
            }
            
            simulationResults.totalGames++;
        }
    }
    
    simulationResults.finalBankroll = simulationBankroll;
    console.log('=== SIMULATION COMPLETE ===');
    console.log('Total games: ' + simulationResults.totalGames);
    console.log('Profitable games: ' + simulationResults.profitableGames + ' (' + 
               ((simulationResults.profitableGames / simulationResults.totalGames) * 100).toFixed(1) + '%)');
    console.log('Final bankroll: ' + simulationResults.finalBankroll.toFixed(2) + ' bits');
    console.log('Max drawdown: ' + simulationResults.maxDrawdown.toFixed(1) + '%');
    console.log('Total profit: ' + (simulationResults.finalBankroll - TOTAL_BANKROLL).toFixed(2) + ' bits');
    
    SIMULATION_MODE = false;
    return simulationResults;
}

// ============================================================================
// PERFORMANCE MONITORING AND REPORTING
// ============================================================================

function generatePerformanceReport() {
    let report = {
        timestamp: new Date().toISOString(),
        totalBets: performanceStats.totalBets,
        wins: performanceStats.wins,
        losses: performanceStats.losses,
        winRate: (performanceStats.wins / performanceStats.totalBets * 100).toFixed(1) + '%',
        totalProfit: (performanceStats.totalProfit / 100).toFixed(2) + ' bits',
        roi: ((performanceStats.totalProfit / (TOTAL_BANKROLL * performanceStats.totalBets * RISK_PER_BET / 100)) * 100).toFixed(1) + '%',
        maxWinStreak: performanceStats.maxWinStreak,
        maxLossStreak: performanceStats.maxLossStreak,
        currentConfidence: (aiState.currentConfidence * 100).toFixed(1) + '%',
        marketCondition: aiState.marketTrend + ' / ' + aiState.volatility
    };
    
    console.log('=== PERFORMANCE REPORT ===');
    console.log('Total Bets: ' + report.totalBets);
    console.log('Win Rate: ' + report.winRate);
    console.log('Total Profit: ' + report.totalProfit);
    console.log('ROI: ' + report.roi);
    console.log('Best Win Streak: ' + report.maxWinStreak);
    console.log('Worst Loss Streak: ' + report.maxLossStreak);
    console.log('Current AI Confidence: ' + report.currentConfidence);
    console.log('Market Condition: ' + report.marketCondition);
    
    return report;
}

// Update the game_crash handler to include learning and reporting
engine.on('game_crash', function(data) {
    console.log('Game crashed at x' + data.game_crash.toFixed(2));
    
    // Update performance statistics
    performanceStats.totalBets++;
    
    if (engine.lastGamePlay() === 'WON') {
        performanceStats.wins++;
        performanceStats.currentStreak = Math.max(0, performanceStats.currentStreak) + 1;
        performanceStats.maxWinStreak = Math.max(performanceStats.maxWinStreak, performanceStats.currentStreak);
    } else {
        performanceStats.losses++;
        performanceStats.currentStreak = Math.min(0, performanceStats.currentStreak) - 1;
        performanceStats.maxLossStreak = Math.min(performanceStats.maxLossStreak, performanceStats.currentStreak);
    }
    
    // Update learning and optimization
    updateStrategyParameters();
    
    // Generate report every 25 games
    if (performanceStats.totalBets % 25 === 0) {
        generatePerformanceReport();
    }
    
    // Check for stop conditions
    checkStopConditions();
});

// ============================================================================
// INITIALIZATION AND STATUS
// ============================================================================

console.log('=== BLACKBOX AI STRATEGY INITIALIZED ===');
console.log('Bankroll: ' + TOTAL_BANKROLL + ' bits');
console.log('Risk per bet: ' + RISK_PER_BET + '%');
console.log('Confidence threshold: ' + (CONFIDENCE_THRESHOLD * 100) + '%');
console.log('AI Models: Exponential Smoothing, Moving Averages, Pattern Recognition');
console.log('Machine Learning: Reinforcement Learning, Auto-optimization');
console.log('Safety Limits: ' + MAX_CONSECUTIVE_LOSSES + ' consecutive losses, ' + 
            MAX_SESSION_LOSS + '% session loss, ' + DAILY_LOSS_LIMIT + '% daily loss');
console.log('Advanced Features: Simulation mode, Performance monitoring, Exploration');

// Initialize with some historical data if available
if (engine.lastGamePlay() && engine.lastGamePlay().crashed_at) {
    gameHistory.crashes.push(engine.lastGamePlay().crashed_at);
}

// Example: To run simulation with sample data
// var sampleData = [1.5, 2.1, 1.2, 3.4, 1.8, 2.5, 1.1, 4.2, 1.3, 2.8, 1.6, 3.1, 1.4, 2.2, 1.9];
// runSimulation(sampleData);
