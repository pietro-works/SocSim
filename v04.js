(function() { // NEW: Start of IIFE wrapper

// --- Core Simulation Setup ---

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId = null;
let isRunning = false;

// --- GLOBAL CONFIGURATION (Optimized for Real-World Accuracy) ---
let GLOBAL_CONFIG = {
    // Population
    STARTING_COOPERATORS: 25,
    STARTING_COMPETITORS: 7,
    STARTING_DEFECTORS: 15,
    STARTING_PREDATORS: 3,
    // Governance (Tuned for Stress/Deterrence)
    ENFORCER_SALARY: 3.0,          // MODIFIED: Increased cost of security
    ENFORCER_VISION: 150,          // MODIFIED: Increased detection range
    // Justice (Tuned for Severity/Rare Corruption)
    JAIL_TIME: 2500,               // MODIFIED: Increased punishment duration
    BRIBE_CHANCE_PERCENT: 5,       // MODIFIED: Reduced chance of successful corruption
    // Reciprocity & Cooperation (Tuned for Local Trust/Harsh Punishment)
    COOPERATION_RANGE: 50,         // MODIFIED: Reduced range to model local trust
    DEFECTOR_EXCLUSION_THRESHOLD: 3, // MODIFIED: Faster response to betrayal
    // Predation (Tuned for High Risk/High Reward)
    PREDATOR_THEFT_RATE: 0.35,     // MODIFIED: Increased to 35%
    PREDATOR_AVOIDANCE_RANGE: 200,
    // Collective Investment (Co-op) (Tuned for Higher Commitment/Defense)
    NODE_CONTRIBUTION_RATE: 0.15,  // MODIFIED: Increased to 15%
    NODE_PUNISH_RATE: 0.30,        // MODIFIED: Increased to 30%
    // Economy (Tuned for Scarcity/Competitive Pressure)
    RESOURCE_MASS_GAIN: 75.0,      // MODIFIED: Reduced resource abundance
    BASE_MASS_DECAY: 0.04,         // MODIFIED: Increased metabolic pressure

    // Natural percentages (Calculated from starting pop)
    NATURAL_COOPERATOR_PERCENT: 0,
    NATURAL_COMPETITOR_PERCENT: 0,
    NATURAL_DEFECTOR_PERCENT: 0,
    NATURAL_PREDATOR_PERCENT: 0,
};
// Total starting agents: 50

// --- CORE SOCIOLOGICAL CONSTANTS (Based on original v02/script.js) ---
const TAX_RATE = 0.01;
const TOP_AGENT_TAX_COUNT = 5;
const ENFORCER_SPAWN_THRESHOLD = 2500; 
// const TARGET_ENFORCER_POPULATION = 30; // REMOVED: Target for dynamic scaling
const ENFORCER_START_MASS = 1000;
const NODE_MASS_THRESHOLD = 10000; // Co-op node threshold
const NODE_START_MASS = 2000; // Co-op node start mass
const NODE_SPAWN_RADIUS = 150; // Co-op node spawn radius
const NODE_RESOURCE_MASS = 50; // Co-op node resource mass
const NODE_DECAY_RATE = 0.1; // Applies to both node types
const NODE_MINIMUM_MASS = 100; // Co-op node min mass before removal
const BRIBE_RATE = 0.1;
const POPULATION_RESEED_CHANCE = 0.01;
const PREDATOR_FLEE_SPEED_MULTIPLIER = 1.5; // Made flee slightly faster
const ENFORCER_DRIFT_SPEED_MULTIPLIER = 0.3;
const ENFORCER_CHASE_SPEED_MULTIPLIER = 1.0; // NEW: Enforcer chase speed
const COMMONFOLK_FLEE_SPEED_MULTIPLIER = 1.3; // NEW: Commonfolk flee speed
const CRIME_FLEE_RADIUS = 150; // NEW: Radius commonfolk detect crime
const ENFORCER_CHASE_CRIME_THRESHOLD = 10; // NEW: Crimes before enforcer chases

// --- Fluid Avoidance Constants (NEW) ---
const REPULSION_RADIUS = 250; // Agents detect obstacle repulsion further out
const REPULSION_STRENGTH = 5.0; // How strongly the obstacle pushes back
const MAX_AVOIDANCE_FORCE = 0.5;

// --- Base Simulation Constants (Based on original v02/script.js) ---
const RESOURCE_SPAWN_RATE = 0.5;
const MAX_RESOURCE_COUNT = 150;
// const INITIAL_RADIUS = 10; // Original value, now replaced by 10
const MAX_SPEED = 0.8;
const ABILITY_SKEW = 5;
const MASS_DECAY_RATE = 0.00005; // Scaling decay
const AGENT_DEATH_THRESHOLD = 5; // Reduced death threshold slightly

// --- NEW Constants for Added Features ---
// Predator Nodes
const PREDATOR_NODE_CONTRIBUTION_RATE = 0.10; // Default, not configurable
const PREDATOR_NODE_MASS_THRESHOLD = 20000;    // Default, not configurable (CHANGED from 10000)
const PREDATOR_NODE_CRIME_THRESHOLD = 4000;  // Default, not configurable (crime needed to trigger raid) (CHANGED from 2000)
const PREDATOR_NODE_RADIUS_MULTIPLIER = 0.707; // sqrt(0.5) for 50% smaller area
const PREDATOR_NODE_START_MASS = NODE_START_MASS * 0.5;
const PREDATOR_NODE_SPAWN_RADIUS = NODE_SPAWN_RADIUS * PREDATOR_NODE_RADIUS_MULTIPLIER;
const PREDATOR_NODE_RESOURCE_MASS = NODE_RESOURCE_MASS * 0.5;
const PREDATOR_NODE_MINIMUM_MASS = NODE_MINIMUM_MASS * 0.5;
// Raiding
const PREDATOR_NODE_RAID_WIN_CHANCE = 0.8; // Default 80% chance for Enforcer to win raid combat, not configurable
const PREDATOR_NODE_RAID_TIME = 3000;    // Default duration, not configurable
const RAID_COMBAT_DRAIN_RATE = 10; // NEW: Mass lost per frame of raid combat
const TEXT_COOLDOWN_GRID_SIZE = 50; // NEW: Grid size for text cooldown
const TEXT_COOLDOWN_DURATION = 1000; // NEW: 1 second cooldown for text
// AI Avoidance/Seeking
const PREDATOR_NODE_AVOIDANCE_CHANCE = 0.75; // 75% chance commonfolk avoid (CHANGED from 0.2)
const COMMONFOLK_AVOID_PRED_NODE_RANGE = 100;
const ENFORCER_AVOID_PRED_NODE_RANGE = 150;
const PREDATOR_SEEK_NODE_RANGE = 300;
// Size & Leveling (MODIFIED from original v02)
const INITIAL_RADIUS = 10; // New base size: 10px (CHANGED from 5)
const MAX_RADIUS = 20;    // New max visual size: 35px (CHANGED from 50)
// Calculate mass needed for max visual size, relative to ENFORCER_START_MASS
const MAX_VISUAL_MASS = ENFORCER_START_MASS * 5; // Arbitrary mass for max size (5x enforcer start)
const MASS_PER_PIXEL_SQ = (MAX_VISUAL_MASS - (INITIAL_RADIUS * INITIAL_RADIUS * Math.PI)) / (MAX_RADIUS * MAX_RADIUS - INITIAL_RADIUS * INITIAL_RADIUS);
// Level thresholds based on multiples of ENFORCER_START_MASS
const LEVEL_1_MASS_THRESHOLD = ENFORCER_START_MASS * 1.5; // Square starts earlier
const LEVEL_2_MASS_THRESHOLD = ENFORCER_START_MASS * 3; // Circle
const LEVEL_3_MASS_THRESHOLD = ENFORCER_START_MASS * 5; // Star (at max visual mass)


// --- Simulation Data ---
let agents = [];
let resources = [];
let nodes = [];
let jail = [];
let floatingTexts = []; // NEW: For event text popups
let textCooldowns = new Map(); // NEW: Cooldowns for text
let totalSimMass = 0;
let currentSpeedMultiplier = 1;
let gameFrame = 0;
let topPredator = null; // RETAINED, but its functionality is removed (see findTopPredator)
let closestEnforcerToTopPredator = null; // RETAINED, but its functionality is removed
let recentCrimes = []; // NEW: Tracks crime locations for AI fleeing

// --- Global State & Tracking Metrics ---
let global = {
    publicPoolMass: 0,
    nodeResourceMass: 0, // Co-op investment pool
    predatorNodeMass: 0, // NEW: Predator investment pool
    stats: {
        // Original Stats from v02
        enforcersActive: 0,
        nodesBuilt: 0, // Co-op nodes
        predatorMassRecovered: 0,
        defectorExclusions: 0,
        defectorPunishmentsNode: 0, // Co-op node punishments
        arrestsMade: 0,
        theftsCommitted: 0,
        bribesPaid: 0,
        corruptEnforcersCaught: 0,
        // New Stats for added features
        predatorNodesBuilt: 0,
        predatorNodeRaids: 0,
        predatorNodeResourcesConsumed: 0,
    }
};

// --- UI Elements (Matching original index.htm + new stats/bars) ---
// Control Buttons & Speed Display
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const speedControlsDiv = document.getElementById('speed-controls');
const currentSpeedDisplay = document.getElementById('current-speed-display');

// Population Status Card Elements
const totalMassDisplay = document.getElementById('total-mass');
// Bars & Group Mass Displays
const coopGroupMassDisplay = document.getElementById('coop-group-mass-display');
const compGroupMassDisplay = document.getElementById('comp-group-mass-display');
const predGroupMassDisplay = document.getElementById('pred-group-mass-display'); // NEW
const coopBar = document.getElementById('coop-bar');
const compBar = document.getElementById('comp-bar');
const predBar = document.getElementById('pred-bar'); // NEW
// Agent Type Mass Displays
const coopMassDisplay = document.getElementById('coop-mass-display');
const compMassDisplay = document.getElementById('comp-mass-display');
const defectorMassDisplay = document.getElementById('defector-mass-display');
const predatorMassDisplay = document.getElementById('predator-mass-display');
// Per Capita Mass Displays
const avgCoopMassDisplay = document.getElementById('avg-coop-mass-display');
const avgCompMassDisplay = document.getElementById('avg-comp-mass-display');
const avgPredMassDisplay = document.getElementById('avg-pred-mass-display'); // NEW

// System Stability Stats Card Elements
const statPublicPool = document.getElementById('stat-public-pool');
const statEnforcers = document.getElementById('stat-enforcers');
const statMassRecovered = document.getElementById('stat-mass-recovered');
const statNodePool = document.getElementById('stat-node-pool'); // Co-op pool
const statNodesBuilt = document.getElementById('stat-nodes-built'); // Co-op built
const statNodePunishments = document.getElementById('stat-node-punishments'); // Co-op punish
// Predator Stats (NEW UI elements needed in HTML for these)
const statPredNodePool = document.getElementById('stat-pred-node-pool');
const statPredNodesBuilt = document.getElementById('stat-pred-nodes-built');
const statPredNodeRaids = document.getElementById('stat-pred-node-raids');
const statPredNodeResources = document.getElementById('stat-pred-node-resources');
// Reciprocity Stats
const statDefectorExclusions = document.getElementById('stat-defector-exclusions');

// Crime & Justice Stats Card Elements
const statArrests = document.getElementById('stat-arrests');
const statThefts = document.getElementById('stat-thefts');
const statBribes = document.getElementById('stat-bribes');
const statCorruptCaught = document.getElementById('stat-corrupt-caught');

// Config Panel Input Elements (Matching original index.htm sliders ONLY)
const configPanel = document.getElementById('config-panel');
const configInputs = configPanel.querySelectorAll('input'); // Used to disable/enable inputs on start/stop
// Population
const sliderCooperators = document.getElementById('slider-cooperators');
const numCooperators = document.getElementById('num-cooperators');
const sliderCompetitors = document.getElementById('slider-competitors');
const numCompetitors = document.getElementById('num-competitors');
const sliderDefectors = document.getElementById('slider-defectors');
const numDefectors = document.getElementById('num-defectors');
const sliderPredators = document.getElementById('slider-predators');
const numPredators = document.getElementById('num-predators');
// Governance
const sliderSalary = document.getElementById('slider-salary');
const numSalary = document.getElementById('num-salary');
const sliderVision = document.getElementById('slider-vision');
const numVision = document.getElementById('num-vision');
// Justice
const sliderJail = document.getElementById('slider-jail');
const numJail = document.getElementById('num-jail');
const sliderBribe = document.getElementById('slider-bribe');
const numBribe = document.getElementById('num-bribe');
// Reciprocity & Cooperation
const sliderCoopRange = document.getElementById('slider-coop-range');
const numCoopRange = document.getElementById('num-coop-range');
const sliderExclusion = document.getElementById('slider-exclusion');
const numExclusion = document.getElementById('num-exclusion');
// Predation
const sliderTheftRate = document.getElementById('slider-theft-rate');
const numTheftRate = document.getElementById('num-theft-rate');
const sliderPredatorVision = document.getElementById('slider-predator-vision');
const numPredatorVision = document.getElementById('num-predator-vision');
// Collective Investment (Co-op)
const sliderNodeContrib = document.getElementById('slider-node-contrib');
const numNodeContrib = document.getElementById('num-node-contrib');
const sliderNodePunish = document.getElementById('slider-node-punish');
const numNodePunish = document.getElementById('num-node-punish');
// Economy
const sliderResourceGain = document.getElementById('slider-resource-gain');
const numResourceGain = document.getElementById('num-resource-gain');
const sliderDecay = document.getElementById('slider-decay');
const numDecay = document.getElementById('num-decay');


// --- Helper Functions ---
function distance(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); }
const getRandomID = () => '_' + Math.random().toString(36).substr(2, 9);
function getRandom(min, max) { return Math.random() * (max - min) + min; }

// --- CLASSES ---
class Agent {
    constructor(x, y, type) {
        this.id = getRandomID();
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = this.getColor();
        this.ability = Math.pow(Math.random(), ABILITY_SKEW);
        this.baseSpeed = (0.5 + this.ability * 5) * MAX_SPEED; // CHANGED: from (1 + ...)
        this.vx = (Math.random() - 0.5) * this.baseSpeed;
        this.vy = (Math.random() - 0.5) * this.baseSpeed;
        // Start mass based on INITIAL_RADIUS (now 10)
        this.mass = this.type === 'enforcer' ? ENFORCER_START_MASS : (INITIAL_RADIUS * INITIAL_RADIUS * Math.PI);
        this.MINIMUM_MASS = AGENT_DEATH_THRESHOLD;
        this.radius = this.calculateRadius(this.mass); // Use new calculation
        this.visualLevel = 0; // NEW: Level indicator (0: none, 1: square, 2: circle, 3: star)
        this.patrolTargetX = getRandom(0, canvas.width); // NEW: For enforcer AI patrol
        this.patrolTargetY = getRandom(0, canvas.height); // NEW: For enforcer AI patrol
        this.isSafeInNode = false; // NEW: Predator AI state for being inside a predator node
        this.isRaiding = false; // NEW: Enforcer AI state for participating in a raid
        this.immunityTimer = 0; // NEW: Immunity timer for respawned predators
        this.crimeCount = 0; // NEW: Tracks individual predator crimes
        this.fleeingCrime = false; // NEW: Commonfolk AI state
        this.fleeTargetNode = null; // NEW: Commonfolk AI flee target
        // Reciprocity (from original v02)
        this.shared_with_defectors = new Map();
        this.excluded_defectors = new Set();
        // AI Avoidance State (NEW)
        this.avoidingNodeId = null; // Store ID of node being decided upon
        this.isAvoiding = false; // True if actively moving away
        this.raidTargetNodeId = null; // NEW: Tracks which raid an enforcer is part of
        // --- v0.4 COSMETIC-ONLY sprite state (does not affect ABM mechanics) ---
        this.animSeed = Math.floor(Math.random() * 1000); // walk-cycle phase offset
        this.facing = Math.random() < 0.5 ? -1 : 1;       // 1 = right, -1 = left
        this.flashTimer = 0;                              // white hit-flash frames
        this.spawnFlash = 14;                             // brief flash on creation
    }

    getColor() {
        // Same as original v02
        switch (this.type) {
            case 'cooperator': return 'rgba(74, 222, 128, 0.9)';
            case 'defector': return 'rgba(168, 85, 247, 0.9)';
            case 'competitor': return 'rgba(249, 115, 22, 0.9)';
            case 'predator': return 'rgba(239, 68, 68, 0.9)';
            case 'enforcer': return 'rgba(59, 130, 246, 0.9)';
            default: return 'rgba(156, 163, 175, 0.9)';
        }
    }

    // NEW: Calculate radius based on mass, capping at MAX_RADIUS (50px)
    calculateRadius(mass) {
        if (mass <= this.MINIMUM_MASS) return INITIAL_RADIUS / 2; // Very small if near death (Now 5px)
        // Calculate radius based on area = mass, but scale it relative to the visual range
        // Area = PI * r^2. Let base mass correspond to INITIAL_RADIUS area.
        const baseMass = INITIAL_RADIUS * INITIAL_RADIUS * Math.PI;
        // Map mass range (baseMass to MAX_VISUAL_MASS) to radius range (INITIAL_RADIUS to MAX_RADIUS)
        if (mass <= baseMass) {
            // Scale down if below base mass
             return INITIAL_RADIUS * Math.sqrt(mass / baseMass);
        } else if (mass >= MAX_VISUAL_MASS) {
             return MAX_RADIUS; // Cap at max radius
        } else {
             // Linear interpolation of radius based on mass within the visual range
             const massRatio = (mass - baseMass) / (MAX_VISUAL_MASS - baseMass);
             // Interpolate radius^2 for area scaling
             const radiusSq = INITIAL_RADIUS * INITIAL_RADIUS + massRatio * (MAX_RADIUS * MAX_RADIUS - INITIAL_RADIUS * INITIAL_RADIUS);
             return Math.sqrt(radiusSq);
        }
    }


    // NEW: Update visual level based on mass thresholds
    updateVisualLevel() {
        if (this.mass >= LEVEL_3_MASS_THRESHOLD) {
            this.visualLevel = 3; // Star
        } else if (this.mass >= LEVEL_2_MASS_THRESHOLD) {
            this.visualLevel = 2; // Circle
        } else if (this.mass >= LEVEL_1_MASS_THRESHOLD) { // Use Level 1 threshold
            this.visualLevel = 1; // Square
        } else {
            this.visualLevel = 0; // None
        }
    }

    // NEW: Helper to draw a star indicator inside the agent
    drawStar(x, y, radius) {
        const spikes = 5;
        const outerRadius = radius * 0.5; // Make star smaller relative to agent size
        const innerRadius = radius * 0.2;
        let rot = Math.PI / 2 * 3; // Start at top
        let step = Math.PI / spikes;

        ctx.save(); // Save context state
        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius); // Start at top point
        for (let i = 0; i < spikes; i++) {
            // Outer point
            let currentX = x + Math.cos(rot) * outerRadius;
            let currentY = y + Math.sin(rot) * outerRadius;
            ctx.lineTo(currentX, currentY);
            rot += step;

            // Inner point
            currentX = x + Math.cos(rot) * innerRadius;
            currentY = y + Math.sin(rot) * innerRadius;
            ctx.lineTo(currentX, currentY);
            rot += step;
        }
        ctx.closePath(); // Close path back to start
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // White star
        ctx.fill();
        ctx.restore(); // Restore context state
    }

    draw() {
        let drawColor = this.color;
        
        // REMOVED: Top Predator flashing logic

        // Flash raiding enforcers yellow
        if (this.isRaiding && this.type === 'enforcer') {
            drawColor = (gameFrame % 20 < 10) ? 'rgba(253, 224, 71, 1.0)' : this.color;
        }
        // NEW: Flash white if immune
        if (this.immunityTimer > 0 && gameFrame % 20 < 10) {
            drawColor = 'rgba(255, 255, 255, 1.0)'; // Flash white
        }

        // Draw agent circle
        ctx.beginPath();
        // Ensure radius is never negative or NaN
        const safeRadius = Math.max(1, this.radius || 1);
        ctx.arc(this.x, this.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = drawColor;
        // Use more distinct shadows based on type (from original v02)
        let shadowColor = this.color;
        if (this.type === 'predator') shadowColor = 'rgba(239, 68, 68, 0.8)';
        else if (this.type === 'defector') shadowColor = 'rgba(67, 56, 202, 0.8)';
        else if (this.type === 'enforcer') shadowColor = 'rgba(30, 64, 175, 0.8)';
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0; // Reset shadow blur

        // Draw visual level indicator (NEW)
        if (this.visualLevel > 0) {
            const indicatorRadius = safeRadius * 0.7; // Base size on safeRadius
            if (this.visualLevel === 1) { // Square
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(this.x - indicatorRadius / 2, this.y - indicatorRadius / 2, indicatorRadius, indicatorRadius);
            } else if (this.visualLevel === 2) { // Circle
                ctx.beginPath();
                ctx.arc(this.x, this.y, indicatorRadius / 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fill();
                ctx.closePath();
            } else if (this.visualLevel === 3) { // Star
                this.drawStar(this.x, this.y, indicatorRadius); // Pass indicatorRadius
            }
        }
    }

    // NEW: Helper function to calculate avoidance force
    applyRepulsionForce(nodes) {
        let forceX = 0;
        let forceY = 0;

        for (const node of nodes) {
            // Only non-raided predator nodes are obstacles for commonfolk/enforcers
            if (!node || node.nodeType !== 'predator' || node.isBeingRaided) continue;

            const dist = distance(this.x, this.y, node.x, node.y);
            const obstacleRadius = node.spawnRadius;

            if (dist < REPULSION_RADIUS + obstacleRadius) {
                const angle = Math.atan2(this.y - node.y, this.x - node.x); // Direction away from node

                // Calculate repulsion strength (inverse distance falloff, proportional to overlap/proximity)
                const effectiveDistance = dist - obstacleRadius;
                const detectionRange = REPULSION_RADIUS;
                const factor = Math.max(0, (detectionRange - effectiveDistance) / detectionRange);
                
                // Use factor^2 for a stronger push close up, but fade out smoothly
                const strength = REPULSION_STRENGTH * factor * factor;

                forceX += Math.cos(angle) * strength;
                forceY += Math.sin(angle) * strength;
            }
        }
        
        // Cap the total avoidance force magnitude
        const currentForceMagnitude = Math.sqrt(forceX * forceX + forceY * forceY);
        if (currentForceMagnitude > MAX_AVOIDANCE_FORCE) {
            const ratio = MAX_AVOIDANCE_FORCE / currentForceMagnitude;
            forceX *= ratio;
            forceY *= ratio;
        }

        return { forceX, forceY };
    }


    update() {
        // --- 1. AI Logic (sets desired this.vx, this.vy or returns if highest priority) ---
        
        // Check if agent is inside a predator node (raided or safe) to determine arrest immunity
        this.isSafeInNode = false;
        for (const node of nodes) {
            if (node && node.nodeType === 'predator') {
                if (distance(this.x, this.y, node.x, node.y) < node.spawnRadius) {
                    this.isSafeInNode = true;
                    break;
                }
            }
        }

        // AI logic based on type
        if (this.type === 'enforcer') {
            this.enforcerAI();
        } else if (this.type === 'predator') {
            this.predatorAI();
        } else {
            this.commonfolkAI(); // Includes Cooperators, Defectors, Competitors
        }

        // --- 2. Fluid Avoidance (Applied unless movement is forced) ---
        // Forced movement occurs during Fleeing Crime (commonfolk), Fleeing Enforcer (predator), or Raiding/Defense.
        // We rely on AI functions to return early for non-fluid movement (Flee/Raid).
        if (!this.fleeingCrime && !this.isRaiding) {
            
            const repulsion = this.applyRepulsionForce(nodes);
            
            // Apply the repulsion force as an acceleration/adjustment to current velocity
            this.vx += repulsion.forceX;
            this.vy += repulsion.forceY;
        }


        // --- 3. Apply Velocity & Clamp ---

        // Apply velocity, careful of NaN
        if (!isNaN(this.vx) && !isNaN(this.vy)) {
             this.x += this.vx;
             this.y += this.vy;
        }


        // Clamp position to canvas boundaries
        const safeRadius = Math.max(1, this.radius || 1); // Use safe radius for clamping
        this.x = Math.max(safeRadius, Math.min(this.x, canvas.width - safeRadius));
        this.y = Math.max(safeRadius, Math.min(this.y, canvas.height - safeRadius));


        // Common boundary collision logic - Apply AFTER clamping
        if (this.x === safeRadius || this.x === canvas.width - safeRadius) {
            if (!isNaN(this.vx)) this.vx *= -1;
        }
        if (this.y === safeRadius || this.y === canvas.height - safeRadius) {
             if (!isNaN(this.vy)) this.vy *= -1;
        }


        // NEW: Speed Cap (Applied after avoidance force alters velocity)
        const currentSpeedSq = this.vx * this.vx + this.vy * this.vy;
        const maxSpeed = this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER; // Max speed is flee speed
        if (currentSpeedSq > (maxSpeed * maxSpeed)) {
            const currentSpeed = Math.sqrt(currentSpeedSq);
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }

        // NEW: Decrement immunity timer
        if (this.immunityTimer > 0) {
            this.immunityTimer--;
        }

        // Apply metabolic decay
        const decayAmount = GLOBAL_CONFIG.BASE_MASS_DECAY + (this.mass * MASS_DECAY_RATE);
        if (!isNaN(decayAmount)) {
             this.mass -= decayAmount;
        }
        if (this.mass < this.MINIMUM_MASS || isNaN(this.mass)) {
            this.mass = this.MINIMUM_MASS; // Prevent mass going below floor or becoming NaN
        }

        // Update radius and visual level based on new mass
        this.radius = this.calculateRadius(this.mass);
        this.updateVisualLevel(); // NEW

        // v0.4 cosmetic: face the direction of travel + decay flash timers
        if (this.vx < -0.04) this.facing = -1; else if (this.vx > 0.04) this.facing = 1;
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.spawnFlash > 0) this.spawnFlash--;
    }

    // AI for Cooperators, Defectors, Competitors (Refactored for fluid movement)
    commonfolkAI() {
        // --- Priority 1: Fleeing from Crime (Non-fluid, pure override) ---
        if (this.fleeingCrime) {
            if (this.fleeTargetNode) {
                const distToNode = distance(this.x, this.y, this.fleeTargetNode.x, this.fleeTargetNode.y);
                if (distToNode < this.fleeTargetNode.spawnRadius) {
                    this.fleeingCrime = false;
                    this.fleeTargetNode = null;
                } else {
                    const angle = Math.atan2(this.fleeTargetNode.y - this.y, this.fleeTargetNode.x - this.x);
                    // Set velocity directly for fast, non-fluid escape
                    this.vx = Math.cos(angle) * this.baseSpeed * COMMONFOLK_FLEE_SPEED_MULTIPLIER;
                    this.vy = Math.sin(angle) * this.baseSpeed * COMMONFOLK_FLEE_SPEED_MULTIPLIER;
                    return; // Return to prevent further AI/Avoidance logic from running this frame
                }
            } else {
                this.fleeingCrime = false;
            }
        }
        // --- End Fleeing Logic ---

        // --- Priority 2: Set Desired Movement (Seek Resource / Wander) ---
        // This sets the base movement vector (vx/vy). Fluid avoidance is applied in update().

        // Reset the old discrete avoidance decision state (now obsolete)
        this.avoidingNodeId = null;
        this.isAvoiding = false;

        let seekRange = (this.type === 'competitor') ? 300 : 150;
        const foundResource = this.seekResource(seekRange); // This updates this.vx/this.vy

        if (!foundResource) {
            // No resource in range. Actively wander (random drift).
            const currentSpeedSq = this.vx * this.vx + this.vy * this.vy;
            const minSpeed = this.baseSpeed * 0.1;
            
            // If too slow or 5% chance, pick a new direction
            if (currentSpeedSq < (minSpeed * minSpeed) || Math.random() < 0.05) { 
                const angle = Math.random() * 2 * Math.PI;
                this.vx = Math.cos(angle) * this.baseSpeed * ENFORCER_DRIFT_SPEED_MULTIPLIER;
                this.vy = Math.sin(angle) * this.baseSpeed * ENFORCER_DRIFT_SPEED_MULTIPLIER;
            }
        }
    }

    // NEW: Helper for finding the nearest victim (non-predator/non-enforcer) within a range
    findNearestVictim(range) {
        let nearest = null;
        let minDist = range + 1; 

        for (const other of agents) {
            // Must be a Commonfolk type
            if (!other || other.type === 'predator' || other.type === 'enforcer') continue;

            const dist = distance(this.x, this.y, other.x, other.y);
            if (dist < minDist && dist > 0) {
                minDist = dist;
                nearest = other;
            }
        }
        return nearest;
    }

    // NEW Helper for Predator AI: Seeks node resources
    seekNodeResource() {
        let nearest = null;
        let minDist = Infinity;
        for (const resource of resources) {
            if (resource && resource.nodeType === 'predator' && !isNaN(resource.x) && !isNaN(resource.y)) {
                const dist = distance(this.x, this.y, resource.x, resource.y);
                if (dist < minDist && dist > 0) {
                    minDist = dist;
                    nearest = resource;
                }
            }
        }

        if (nearest) {
            const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            if (!isNaN(angle)) {
                // Set velocity towards the node resource
                this.vx = Math.cos(angle) * this.baseSpeed; 
                this.vy = Math.sin(angle) * this.baseSpeed;
            }
            return true;
        }
        return false;
    }

    // CHANGED: Predator AI logic for fluid movement and priority
    predatorAI() {
        let nearestEnforcer = null;
        let minDistEnforcer = GLOBAL_CONFIG.PREDATOR_AVOIDANCE_RANGE + 1;
        let nearestPredNode = null;
        let minDistPredNode = PREDATOR_SEEK_NODE_RANGE + 1;
        let nearestCoopNode = null; // NEW
        let minDistCoopNode = Infinity; // NEW
        let raidedNode = null; // NEW: Find node being raided

        // --- 0. Environment Scan (Kept simple) ---
        for (const other of agents) {
            if (other && other.type === 'enforcer') { 
                const dist = distance(this.x, this.y, other.x, other.y);
                if (dist < minDistEnforcer) { minDistEnforcer = dist; nearestEnforcer = other; }
            }
        }
        for (const node of nodes) {
            const dist = distance(this.x, this.y, node.x, node.y);
            if (node.nodeType === 'predator' && dist < minDistPredNode) { minDistPredNode = dist; nearestPredNode = node; }
            if (node.nodeType === 'cooperator' && dist < minDistCoopNode) { minDistCoopNode = dist; nearestCoopNode = node; }
            if (node && node.isBeingRaided && node.nodeType === 'predator') { raidedNode = node; }
        }

        // --- 1. Avoid Co-op Nodes (Highest Priority) ---
        if (nearestCoopNode && minDistCoopNode < nearestCoopNode.spawnRadius + 20) { 
            const angle = Math.atan2(this.y - nearestCoopNode.y, this.x - nearestCoopNode.x); // Angle away
            if (!isNaN(angle)) {
                this.vx = Math.cos(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER;
                this.vy = Math.sin(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER;
            }
            return; // Override all lower priorities
        }

        // --- 2. Raid Defense (Non-Fluid Forced Movement) ---
        if (raidedNode) {
            this.isRaiding = true; // Set flag to skip fluid avoidance in update()
            // Defense logic (same as previous hard-coded movement for raid)
            const distToNode = distance(this.x, this.y, raidedNode.x, raidedNode.y);
            const safeRadius = Math.max(1, this.radius || 1);

            if (distToNode > raidedNode.spawnRadius - safeRadius) {
                const angle = Math.atan2(raidedNode.y - this.y, raidedNode.x - this.x);
                if (!isNaN(angle)) {
                    this.vx = Math.cos(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER;
                    this.vy = Math.sin(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER;
                }
            } else { 
                // Wander/Bounce logic inside raided node (must be hard-coded movement)
                this.isSafeInNode = true; // Still safe inside a raided node
                const currentSpeedSq = this.vx * this.vx + this.vy * this.vy;
                const minSpeed = this.baseSpeed * 0.1;
                if (currentSpeedSq < (minSpeed * minSpeed) || Math.random() < 0.1) { 
                    const angle = Math.random() * 2 * Math.PI;
                    this.vx = Math.cos(angle) * this.baseSpeed * 0.2;
                    this.vy = Math.sin(angle) * this.baseSpeed * 0.2;
                } else if (Math.random() < 0.1) {
                    const angle = Math.random() * 2 * Math.PI;
                    const nudgeSpeed = this.baseSpeed * 0.1;
                    this.vx += Math.cos(angle) * nudgeSpeed;
                    this.vy += Math.sin(angle) * nudgeSpeed;
                }
                
                // Simplified bounce logic (re-positioning only if stuck outside boundary)
                const distFromCenter = distance(this.x, this.y, raidedNode.x, raidedNode.y);
                if (distFromCenter + safeRadius > raidedNode.spawnRadius) {
                    const normalX = (this.x - raidedNode.x) / distFromCenter;
                    const normalY = (this.y - raidedNode.y) / distFromCenter;
                    this.x = raidedNode.x + normalX * (raidedNode.spawnRadius - safeRadius - 1);
                    this.y = raidedNode.y + normalY * (raidedNode.spawnRadius - safeRadius - 1);
                }
            }
            return; // Override all lower priorities
        }
        this.isRaiding = false; // Reset if raid is over/non-existent

        // --- 3. Flee from Enforcer (Non-Fluid Forced Movement) ---
        if (nearestEnforcer && minDistEnforcer <= GLOBAL_CONFIG.PREDATOR_AVOIDANCE_RANGE) {
            
            // Flee to the closest *safe* (non-raided) node
            let fleeTarget = nearestPredNode; 

            // Check if the chosen flee target is in range
            if (fleeTarget && distance(this.x, this.y, fleeTarget.x, fleeTarget.y) < PREDATOR_SEEK_NODE_RANGE) {
                const angle = Math.atan2(fleeTarget.y - this.y, fleeTarget.x - this.x); // Angle towards node
                 if (!isNaN(angle)) {
                    this.vx = Math.cos(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER; // Set velocity directly for non-fluid escape
                    this.vy = Math.sin(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER;
                }
            } else { // Otherwise, flee directly away from enforcer
                const angle = Math.atan2(this.y - nearestEnforcer.y, this.x - nearestEnforcer.x); // Angle away
                 if (!isNaN(angle)) {
                    this.vx = Math.cos(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER; // Set velocity directly for non-fluid escape
                    this.vy = Math.sin(angle) * this.baseSpeed * PREDATOR_FLEE_SPEED_MULTIPLIER;
                }
            }
            return; // Override all lower priorities
        }
        
        // --- 4. Default Hunting / Resource Gathering (Fluid Movement Goals) ---
        
        // Find nearest commonfolk target for opportunistic crime (Hunting goal)
        let nearestVictim = this.findNearestVictim(150); 
            
        if (nearestVictim) {
            // Check if the predator is near a SAFE node. If so, only hunt if the victim is outside the node perimeter.
            if (nearestPredNode && this.isSafeInNode) {
                const isVictimOutsideNode = distance(nearestVictim.x, nearestVictim.y, nearestPredNode.x, nearestPredNode.y) > nearestPredNode.spawnRadius;
                if (!isVictimOutsideNode) {
                    // Victim is deep inside the node; prioritize Node Resource seeking (below)
                    nearestVictim = null; 
                }
            }

            if (nearestVictim) {
                 // Chase to commit crime (Hunting goal)
                const angle = Math.atan2(nearestVictim.y - this.y, nearestVictim.x - this.x);
                this.vx = Math.cos(angle) * this.baseSpeed;
                this.vy = Math.sin(angle) * this.baseSpeed;
                // DO NOT return here: allow fluid avoidance to push predator around nodes while hunting
            }
        }
        
        // If hunting fails, and we are near/in a safe node, seek node resources
        if (nearestPredNode && minDistPredNode < nearestPredNode.spawnRadius * 1.5) {
            this.seekNodeResource(); // Sets vx/vy toward a resource (will be fluid)
        }
        // Default: Seek Normal Resource (Hunt further afield)
        else {
            this.seekTarget('non_predator'); // Seeks any available commonfolk/normal resource
        }
    }


    enforcerAI() {
        let nearestVisiblePredator = null;
        let minDistVisible = GLOBAL_CONFIG.ENFORCER_VISION + 1;
        // this.isRaiding = false; // State is now managed by assignment
        let targetNode = null; // Node to raid

        // Check if any predator node is currently being raided
        for (const node of nodes) {
            if (node && node.isBeingRaided && node.nodeType === 'predator') { // Check node exists
                targetNode = node;
                break;
            }
        }

        // NEW: Raid Assignment Logic
        if (targetNode) { // A raid is active somewhere
            if (!this.isRaiding) { // If this enforcer is not already assigned
                // Join raid if spots are open (using the count from the node)
                if (targetNode.currentRaidForce < targetNode.raidForceSize) {
                    this.isRaiding = true;
                    this.raidTargetNodeId = targetNode.id;
                    targetNode.currentRaidForce++; // Increment immediately
                }
            } else if (this.raidTargetNodeId !== targetNode.id) {
                 // This enforcer was raiding a *different* node that just finished
                 this.isRaiding = false;
                 this.raidTargetNodeId = null;
            }
        } else { // No active raids
            this.isRaiding = false;
            this.raidTargetNodeId = null;
        }

        // Raid Logic (Checks this.isRaiding and validates targetNode)
        let myRaidNode = null;
        if (this.isRaiding && targetNode && targetNode.id === this.raidTargetNodeId) {
            myRaidNode = targetNode; // This is my assigned raid
        }
        
        if (myRaidNode) { // This enforcer is assigned to the active raid (Bypass fluid avoidance in update())
            this.isRaiding = true; 
            
            // CHANGED: Wander and bounce inside node instead of clustering at center
            const currentSpeedSq = this.vx * this.vx + this.vy * this.vy;
            const minSpeed = this.baseSpeed * 0.1;

            if (currentSpeedSq < (minSpeed * minSpeed)) { 
                const angle = Math.random() * 2 * Math.PI;
                this.vx = Math.cos(angle) * this.baseSpeed * 0.2; // Wander at 20% speed
                this.vy = Math.sin(angle) * this.baseSpeed * 0.2;
            } 
            else if (Math.random() < 0.1) { // 10% chance to nudge
                const angle = Math.random() * 2 * Math.PI;
                const nudgeSpeed = this.baseSpeed * 0.1;
                this.vx += Math.cos(angle) * nudgeSpeed;
                this.vy += Math.sin(angle) * nudgeSpeed;
            }

            // Bounce off the node's spawn boundary
            const distFromCenter = distance(this.x, this.y, targetNode.x, targetNode.y);
            const safeRadius = Math.max(1, this.radius || 1);
            
            if (distFromCenter === 0) { // Fix: Prevent NaN
                const angle = Math.random() * 2 * Math.PI;
                this.x += Math.cos(angle) * 0.1;
                this.y += Math.sin(angle) * 0.1;
            } 
            else if (distFromCenter + safeRadius > targetNode.spawnRadius) {
                const normalX = (this.x - targetNode.x) / distFromCenter;
                const normalY = (this.y - targetNode.y) / distFromCenter;
                const dotProduct = this.vx * normalX + this.vy * normalY;
                
                if (dotProduct > 0) { // Only reflect if moving outwards
                    this.vx -= 2 * dotProduct * normalX;
                    this.vy -= 2 * dotProduct * normalY;
                }
                // Move back slightly
                // BUGFIX: Was only setting Y, now sets both X and Y
                this.x = myRaidNode.x + normalX * (myRaidNode.spawnRadius - safeRadius - 1);
                this.y = myRaidNode.y + normalY * (myRaidNode.spawnRadius - safeRadius - 1);
            }
        }
        // Normal Patrol & Chase Logic (Sets desired vx/vy)
        else { 
            this.isRaiding = false; 
            this.raidTargetNodeId = null; 
            
            // Look for visible predators
            for (const other of agents) {
                // CHANGED: Removed top predator condition
                if (other && other.type === 'predator' && !other.isSafeInNode && other.immunityTimer <= 0 && other.crimeCount >= ENFORCER_CHASE_CRIME_THRESHOLD) {
                    const dist = distance(this.x, this.y, other.x, other.y);
                    if (dist < minDistVisible) {
                        minDistVisible = dist;
                        nearestVisiblePredator = other;
                    }
                }
            }

            if (nearestVisiblePredator) {
                // Priority 1: Chase 
                const angle = Math.atan2(nearestVisiblePredator.y - this.y, nearestVisiblePredator.x - this.x);
                 if (!isNaN(angle)) {
                    this.vx = Math.cos(angle) * this.baseSpeed * ENFORCER_CHASE_SPEED_MULTIPLIER;
                    this.vy = Math.sin(angle) * this.baseSpeed * ENFORCER_CHASE_SPEED_MULTIPLIER;
                }
                this.patrolTargetX = nearestVisiblePredator.x;
                this.patrolTargetY = nearestVisiblePredator.y;
            } else { // Removed drift towards top predator logic
                // Priority 3: Patrol (Now relies on repulsion force for avoidance)
                
                // Patrol Target Logic (remains the same)
                const distToTarget = distance(this.x, this.y, this.patrolTargetX, this.patrolTargetY);
                const safeRadius = Math.max(1, this.radius || 1);
                
                // Find new patrol target if reached or target is invalid
                if (distToTarget < safeRadius * 2 || isNaN(this.patrolTargetX) || isNaN(this.patrolTargetY) || this.isTargetInAvoidNode(this.patrolTargetX, this.patrolTargetY)) {
                    const coOpNodes = nodes.filter(n => n && n.nodeType === 'cooperator');
                    if (coOpNodes.length > 0) {
                        const randomNode = coOpNodes[Math.floor(Math.random() * coOpNodes.length)];
                        const angle = Math.random() * Math.PI * 2;
                        const r = randomNode.spawnRadius + getRandom(10, 40); 
                        this.patrolTargetX = Math.max(safeRadius, Math.min(randomNode.x + Math.cos(angle) * r, canvas.width - safeRadius));
                        this.patrolTargetY = Math.max(safeRadius, Math.min(randomNode.y + Math.sin(angle) * r, canvas.height - safeRadius));

                    } else {
                         let attempts = 0;
                         do {
                             this.patrolTargetX = getRandom(safeRadius, canvas.width - safeRadius);
                             this.patrolTargetY = getRandom(safeRadius, canvas.height - safeRadius);
                             attempts++;
                         } while (this.isTargetInAvoidNode(this.patrolTargetX, this.patrolTargetY) && attempts < 10);
                    }
                }
                
                // Move towards the patrol target
                const angle = Math.atan2(this.patrolTargetY - this.y, this.patrolTargetX - this.x);
                 if (!isNaN(angle)) {
                    this.vx = Math.cos(angle) * this.baseSpeed * ENFORCER_DRIFT_SPEED_MULTIPLIER;
                    this.vy = Math.sin(angle) * this.baseSpeed * ENFORCER_DRIFT_SPEED_MULTIPLIER;
                }
            }
        }
    }

    // Helper for enforcer patrol: checks if target is inside a node to avoid
    isTargetInAvoidNode(targetX, targetY) {
         for (const node of nodes) {
             if (node && node.nodeType === 'predator' && !node.isBeingRaided) { // Check node exists
                 if (distance(targetX, targetY, node.x, node.y) < node.spawnRadius) {
                     return true; // Target is inside a node we should avoid
                 }
             }
         }
         return false; // Target is safe
    }


    // Modified seekTarget to adjust velocity instead of position
    seekTarget(targetType) {
        let nearest = null;
        let minDist = Infinity;
        for (const other of agents) {
            if (!other || other === this || isNaN(other.x) || isNaN(other.x)) continue; // Skip self and invalid agents
            let isTarget = false;
            // Determine if 'other' is a valid target based on 'targetType'
            if (targetType === 'predator' && other.type === 'predator') {
                isTarget = true;
            } else if (targetType === 'non_predator' && other.type !== 'predator' && other.type !== 'enforcer') {
                isTarget = true;
            }

            if (isTarget) {
                const dist = distance(this.x, this.y, other.x, other.y);
                if (dist < minDist && dist > 0) { // Ensure distance is positive
                    minDist = dist;
                    nearest = other;
                }
            }
        }
        if (nearest) {
            const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
             if (!isNaN(angle)) {
                // Adjust velocity towards target, don't teleport
                this.vx = Math.cos(angle) * this.baseSpeed;
                this.vy = Math.sin(angle) * this.baseSpeed;
            }
        }
        // If no target, rely on random velocity changes in update()
    }

    // NEW: Seek nearest "normal" resource
    seekResource(range) {
        let nearest = null;
        let minDist = range + 1; // Only check within specified range

        for (const resource of resources) {
            // Only seek 'normal' (non-node) resources
            if (resource && resource.nodeType === 'normal' && !isNaN(resource.x) && !isNaN(resource.y)) {
                const dist = distance(this.x, this.y, resource.x, resource.y);
                if (dist < minDist && dist > 0) {
                    minDist = dist;
                    nearest = resource;
                }
            }
        }

        if (nearest) {
            const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            if (!isNaN(angle)) {
                this.vx = Math.cos(angle) * this.baseSpeed; // Go at full base speed
                this.vy = Math.sin(angle) * this.baseSpeed;
            }
            return true; // Target found
        }
        return false; // No target found
    }

    gainMass(massAmount) {
         if (!isNaN(massAmount)) {
             this.mass += massAmount;
         }
         // Radius is updated in update() method after mass changes
    }
} // End Agent Class

// Modified Resource Class to use nodeType string
class Resource {
    constructor(x, y, mass, nodeType = 'normal') { // Added nodeType ('normal', 'cooperator', 'predator')
        this.x = x;
        this.y = y;
        this.nodeType = nodeType;
        this.radius = this.nodeType === 'normal' ? 2 : 4; // Node resources are bigger
        this.mass = mass;
        this.color = this.getColor();
    }
    getColor() {
        switch (this.nodeType) {
            case 'cooperator': return 'rgba(34, 211, 238, 0.9)'; // Cyan
            case 'predator': return 'rgba(251, 146, 60, 0.9)'; // Orange
            default: return '#6b7280'; // Gray for normal
        }
    }
    draw() {
        ctx.beginPath();
        const safeRadius = Math.max(1, this.radius || 1);
        ctx.arc(this.x, this.y, safeRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
} // End Resource Class

// Modified Node Class to support types and raiding
class Node {
    constructor(x, y, nodeType) {
        this.id = getRandomID(); // NEW: Added ID for AI tracking
        this.x = x;
        this.y = y;
        this.nodeType = nodeType; // 'cooperator' or 'predator'
        this.spawnTimer = 0;
        this.spawnInterval = 100; // Frames between resource spawns
        this.crimeLevel = 0; // NEW: Tracks crime for predator nodes
        this.isBeingRaided = false; // NEW: Raid state flag
        this.raidTimer = 0; // NEW: Countdown for raid duration
        this.raidCooldownTimer = 0; // NEW: Cooldown *after* a raid ends
        // this.raidForceSize = 0; // REMOVED: No longer tracking by count
        this.currentRaidForce = 0; // NEW: How many enforcers are currently raiding (by count, for stats)

        // Set properties based on node type
        if (this.nodeType === 'cooperator') {
            this.mass = NODE_START_MASS;
            this.radius = Math.sqrt(this.mass / Math.PI);
            this.spawnRadius = NODE_SPAWN_RADIUS;
            this.resourceMass = NODE_RESOURCE_MASS;
            this.minMass = NODE_MINIMUM_MASS;
            this.color = 'rgba(22, 78, 99, 0.9)'; // Dark Cyan Core
            this.spawnColor = 'rgba(34, 211, 238, 0.1)'; // Light Cyan Area
            this.strokeColor = 'rgba(34, 211, 238, 0.5)'; // Medium Cyan Area Stroke
            this.coreStrokeColor = 'rgba(34, 211, 238, 1)'; // Bright Cyan Core Stroke
        } else { // 'predator'
            this.mass = PREDATOR_NODE_START_MASS;
            this.radius = Math.sqrt(this.mass / Math.PI);
            this.spawnRadius = PREDATOR_NODE_SPAWN_RADIUS;
            this.resourceMass = PREDATOR_NODE_RESOURCE_MASS;
            this.minMass = PREDATOR_NODE_MINIMUM_MASS;
            // CHANGED: Colors set to red
            this.color = 'rgba(153, 27, 27, 0.9)'; // Dark Red Core
            this.spawnColor = 'rgba(239, 68, 68, 0.1)'; // Light Red Area
            this.strokeColor = 'rgba(239, 68, 68, 0.5)'; // Medium Red Area Stroke
            this.coreStrokeColor = 'rgba(239, 68, 68, 1)'; // Bright Red Core Stroke
        }
    }

    draw() {
        let currentSpawnColor = this.spawnColor;
        let currentStrokeColor = this.strokeColor;
        let currentCoreStrokeColor = this.coreStrokeColor;

        // Visual feedback for predator nodes
        if (this.nodeType === 'predator') {
            if (this.isBeingRaided) {
                // Flash black/red during raid
                currentSpawnColor = (gameFrame % 40 < 20) ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)';
                currentStrokeColor = (gameFrame % 40 < 20) ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                currentCoreStrokeColor = (gameFrame % 40 < 20) ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 0, 0, 1)';
            }
            // CHANGED: Removed the 'else if (this.crimeLevel > 0)' block
            // Node no longer flashes just from crime level.
        }

        // Draw outer spawn radius
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.spawnRadius, 0, Math.PI * 2);
        ctx.fillStyle = currentSpawnColor;
        ctx.fill();
        ctx.strokeStyle = currentStrokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw inner core radius
        ctx.beginPath();
        const coreRadius = Math.max(1, this.radius || 1); // Ensure valid radius
        ctx.arc(this.x, this.y, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; // Always use base core color
        ctx.fill();
        ctx.strokeStyle = currentCoreStrokeColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();
    }

    spawnResource() {
        // Spawn resource within the node's spawn area, outside the core
        const angle = Math.random() * Math.PI * 2;
        const coreRadius = Math.max(1, this.radius || 1);
        // Ensure spawn radius is larger than core radius before calculating spawn distance
        if (this.spawnRadius <= coreRadius) return; // Cannot spawn if radii overlap or invalid
        const r = Math.random() * (this.spawnRadius - coreRadius) + coreRadius; // Distance from center
        const x = this.x + Math.cos(angle) * r;
        const y = this.y + Math.sin(angle) * r;

        // Ensure spawn is within canvas bounds
        if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
            // Create resource with the correct type
            resources.push(new Resource(x, y, this.resourceMass, this.nodeType));
        }
    }

    update() {
        this.mass -= NODE_DECAY_RATE; // All nodes decay
         // Check if mass is valid and above minimum
         if (isNaN(this.mass) || this.mass < this.minMass) {
             this.mass = 0; // Mark for deletion if below min mass or invalid
             // If it was a raided node being destroyed, clear resources NOW
             if (this.nodeType === 'predator' && this.mass === 0) { // Check if just marked
                 for (let i = resources.length - 1; i >= 0; i--) {
                      if (resources[i] && resources[i].nodeType === 'predator' && distance(resources[i].x, resources[i].y, this.x, this.y) < this.spawnRadius) {
                          resources.splice(i, 1);
                      }
                 }
             }
             return; // Stop update if marked for deletion
         }
        this.radius = Math.sqrt(Math.max(0, this.mass) / Math.PI); // Update core radius based on valid mass

        // Raid logic for predator nodes
        if (this.nodeType === 'predator') {
            if (this.isBeingRaided) {
                this.raidTimer--;

                // NEW: Recalculate predator *mass* inside every frame
                let totalPredatorMassInside = 0;
                for (const agent of agents) {
                    if (agent && agent.type === 'predator' && distance(agent.x, agent.y, this.x, this.y) < this.spawnRadius) {
                        totalPredatorMassInside += agent.mass;
                    }
                }
                
                // NEW: Dynamically update the target raid *mass* (400%)
                const targetRaidMass = totalPredatorMassInside * 4.0;

                // NEW: Recalculate current raid *mass*
                let currentRaidMass = 0;
                const currentRaiders = []; // Store raiders for potential dismissal
                for (const agent of agents) {
                    if (agent && agent.type === 'enforcer' && agent.isRaiding && agent.raidTargetNodeId === this.id) {
                        currentRaidMass += agent.mass;
                        currentRaiders.push({ agent: agent, dist: distance(this.x, this.y, agent.x, agent.y) });
                    }
                }
                this.currentRaidForce = currentRaiders.length; // Keep track of count for stats, but logic uses mass

                // --- NEW: DYNAMIC FORCE ADJUSTMENT (BY MASS) ---
                if (currentRaidMass < targetRaidMass) {
                    // Call for backup
                    
                    // Find nearest available enforcers
                    const availableEnforcers = [];
                    for (const agent of agents) {
                        if (agent && agent.type === 'enforcer' && !agent.isRaiding) {
                            availableEnforcers.push({ agent: agent, dist: distance(this.x, this.y, agent.x, agent.y) });
                        }
                    }
                    // Sort by distance (closest first)
                    availableEnforcers.sort((a, b) => a.dist - b.dist);
                    
                    // Assign enforcers until target mass is met
                    for (let i = 0; i < availableEnforcers.length; i++) {
                        if (currentRaidMass >= targetRaidMass) break; // Stop adding if we hit the target
                        
                        const backupAgent = availableEnforcers[i].agent;
                        backupAgent.isRaiding = true;
                        backupAgent.raidTargetNodeId = this.id;
                        currentRaidMass += backupAgent.mass; // Add their mass to the running total
                    }
                    
                } else if (currentRaidMass > targetRaidMass) {
                    // Dismiss extra enforcers
                    
                    // Sort current raiders by distance (furthest first)
                    currentRaiders.sort((a, b) => b.dist - a.dist);
                    
                    // Dismiss the furthest enforcers until mass is below target
                    for (let i = 0; i < currentRaiders.length; i++) {
                        if (currentRaidMass <= targetRaidMass) break; // Stop dismissing if we're at/below target
                        
                        const extraEnforcer = currentRaiders[i].agent;
                        extraEnforcer.isRaiding = false;
                        extraEnforcer.raidTargetNodeId = null;
                        currentRaidMass -= extraEnforcer.mass; // Subtract their mass
                    }
                }
                // --- END DYNAMIC FORCE ADJUSTMENT ---


                if (this.raidTimer <= 0) {
                    this.isBeingRaided = false;
                    // this.crimeLevel = 0; // Reset crime after raid ends (Handled by new loop)
                    this.raidCooldownTimer = 3000; // NEW: Start 3000-frame cooldown (for this node)
                    this.currentRaidForce = 0; // NEW: Reset force count

                    // --- NEW: Reset all predator node crime levels to prevent chain-raids ---
                    for (const node of nodes) {
                        if (node && node.nodeType === 'predator') {
                            node.crimeLevel = 0;
                        }
                    }
                    // --- END NEW LOGIC ---

                    // Check if raid was successful (no predators left inside)
                    // We need to check mass again, in case one was just defeated
                    let finalPredatorMassInside = 0;
                    for (const agent of agents) {
                        if (agent && agent.type === 'predator' && distance(agent.x, agent.y, this.x, this.y) < this.spawnRadius) {
                            finalPredatorMassInside += agent.mass;
                        }
                    }
                }
            } else { // Not being raided
                // NEW: Decrement raid cooldown timer
                if (this.raidCooldownTimer > 0) {
                    this.raidCooldownTimer--;
                }

                // Crime level decays slowly over time
                this.crimeLevel -= NODE_DECAY_RATE / 2; // Slower decay than mass
                if (this.crimeLevel < 0) this.crimeLevel = 0;

                // Check if crime threshold is reached to trigger a raid
                // CHANGED: Added check for raid cooldown
                if (this.crimeLevel >= PREDATOR_NODE_CRIME_THRESHOLD && !isAnyRaidActive() && this.raidCooldownTimer <= 0) {
                    this.isBeingRaided = true;
                    this.raidTimer = PREDATOR_NODE_RAID_TIME; // Start raid timer
                    global.stats.predatorNodeRaids++; // Increment raid stat
                    // v0.4 FX: siren effect over the raided node
                    effectEngine.spawn('raid', this.x, this.y, { node: this, radius: this.spawnRadius });
                    spawnFloatingText(this.x, this.y - 22, 'RAID!', COL.red, 70, 10);
                    playPixelSound('arrest');

                    // NEW: Calculate initial raid force based on mass
                    // The dynamic adjustment logic at the start of the "isBeingRaided" block
                    // will immediately calculate target mass and call for enforcers on the next frame.
                    this.currentRaidForce = 0; // Reset count
                }
            }
        }

        // Spawn resources periodically if node is alive
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnResource();
            this.spawnTimer = 0;
        }

        // Drawing is now handled in the main draw() loop
        // this.draw();
    }
} // End Node Class


// --- Floating Text Class (v0.4: Press Start 2P pixel text w/ shadow) ---
class FloatingText {
    constructor(x, y, text, color, duration, size = 8) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.duration = duration;
        this.maxDuration = duration;
        this.size = size;
        this.vy = -0.8; // Floats upward
    }

    update() {
        this.y += this.vy;
        this.duration--;
    }

    draw() {
        ctx.save();
        const alpha = Math.max(0, this.duration / this.maxDuration);
        ctx.globalAlpha = alpha;
        ctx.font = `${this.size}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        // pixel drop-shadow for readability over busy ground
        ctx.fillStyle = '#000000';
        ctx.fillText(this.text, this.x + 1, this.y + 1);
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
} // End FloatingText Class


// --- Floating Text Spawner (v0.4: optional size, grid-throttled) ---
function spawnFloatingText(x, y, text, color, duration, size = 8) {
    const cellX = Math.floor(x / TEXT_COOLDOWN_GRID_SIZE);
    const cellY = Math.floor(y / TEXT_COOLDOWN_GRID_SIZE);
    const key = `${text}_${cellX}_${cellY}`; // Key based on type and grid location

    if (textCooldowns.has(key)) {
        return; // Cooldown is active in this grid cell for this text type
    }

    // Set cooldown
    textCooldowns.set(key, true);
    setTimeout(() => {
        textCooldowns.delete(key);
    }, TEXT_COOLDOWN_DURATION);

    // Spawn the text
    floatingTexts.push(new FloatingText(x, y, text, color, duration, size));
}


// --- Simulation Logic ---

// NEW: Helper function to check for active raids
function isAnyRaidActive() {
    for (const node of nodes) {
        if (node && node.isBeingRaided) {
            return true;
        }
    }
    return false;
}

// REMOVED: findTopPredatorAndClosestEnforcer functionality is deprecated
function findTopPredatorAndClosestEnforcer() {
    // Top Predator logic is removed from the simulation loop
    topPredator = null;
    closestEnforcerToTopPredator = null;
}


// updateConfigFromUI remains the same as original v02/script.js (with safety fallbacks)
function updateConfigFromUI() {
    // Population
    GLOBAL_CONFIG.STARTING_COOPERATORS = parseInt(numCooperators.value) || 0; // Add fallback
    GLOBAL_CONFIG.STARTING_COMPETITORS = parseInt(numCompetitors.value) || 0;
    GLOBAL_CONFIG.STARTING_DEFECTORS = parseInt(numDefectors.value) || 0;
    GLOBAL_CONFIG.STARTING_PREDATORS = parseInt(numPredators.value) || 0;
    // Governance
    GLOBAL_CONFIG.ENFORCER_SALARY = parseFloat(numSalary.value) || 3.0; // UPDATED DEFAULT
    GLOBAL_CONFIG.ENFORCER_VISION = parseInt(numVision.value) || 150; // UPDATED DEFAULT
    // Justice
    GLOBAL_CONFIG.JAIL_TIME = parseInt(numJail.value) || 2500; // UPDATED DEFAULT
    GLOBAL_CONFIG.BRIBE_CHANCE_PERCENT = parseInt(numBribe.value) || 5; // UPDATED DEFAULT
    // Reciprocity & Cooperation
    GLOBAL_CONFIG.COOPERATION_RANGE = parseInt(numCoopRange.value) || 50; // UPDATED DEFAULT
    GLOBAL_CONFIG.DEFECTOR_EXCLUSION_THRESHOLD = parseInt(numExclusion.value) || 3; // UPDATED DEFAULT
    // Predation
    GLOBAL_CONFIG.PREDATOR_THEFT_RATE = (parseFloat(numTheftRate.value) || 35) / 100.0; // UPDATED DEFAULT (35%)
    GLOBAL_CONFIG.PREDATOR_AVOIDANCE_RANGE = parseInt(numPredatorVision.value) || 200; // Add fallback
    // Collective Investment (Co-op Only in this UI)
    GLOBAL_CONFIG.NODE_CONTRIBUTION_RATE = (parseFloat(numNodeContrib.value) || 15) / 100.0; // UPDATED DEFAULT (15%)
    GLOBAL_CONFIG.NODE_PUNISH_RATE = (parseFloat(numNodePunish.value) || 30) / 100.0; // UPDATED DEFAULT (30%)
    // Economy
    GLOBAL_CONFIG.RESOURCE_MASS_GAIN = parseFloat(numResourceGain.value) || 75.0; // UPDATED DEFAULT
    GLOBAL_CONFIG.BASE_MASS_DECAY = parseFloat(numDecay.value) || 0.04; // UPDATED DEFAULT

    // Calculate natural percentages (same as original v02)
    const totalStartingAgents = GLOBAL_CONFIG.STARTING_COOPERATORS + GLOBAL_CONFIG.STARTING_COMPETITORS + GLOBAL_CONFIG.STARTING_DEFECTORS + GLOBAL_CONFIG.STARTING_PREDATORS;
    if (totalStartingAgents > 0) {
        GLOBAL_CONFIG.NATURAL_COOPERATOR_PERCENT = GLOBAL_CONFIG.STARTING_COOPERATORS / totalStartingAgents;
        GLOBAL_CONFIG.NATURAL_COMPETITOR_PERCENT = GLOBAL_CONFIG.STARTING_COMPETITORS / totalStartingAgents;
        GLOBAL_CONFIG.NATURAL_DEFECTOR_PERCENT = GLOBAL_CONFIG.STARTING_DEFECTORS / totalStartingAgents;
        GLOBAL_CONFIG.NATURAL_PREDATOR_PERCENT = GLOBAL_CONFIG.STARTING_PREDATORS / totalStartingAgents;
    } else { // Avoid division by zero, use equal distribution
        GLOBAL_CONFIG.NATURAL_COOPERATOR_PERCENT = 0.25;
        GLOBAL_CONFIG.NATURAL_COMPETITOR_PERCENT = 0.25;
        GLOBAL_CONFIG.NATURAL_DEFECTOR_PERCENT = 0.25;
        GLOBAL_CONFIG.NATURAL_PREDATOR_PERCENT = 0.25;
    }
} // End updateConfigFromUI


// Modified initializeSimulation to reset new stats/pools
function initializeSimulation() {
    agents = [];
    resources = [];
    nodes = [];
    jail = [];
    gameFrame = 0;
    totalSimMass = 0;
    topPredator = null;
    closestEnforcerToTopPredator = null;
    // Reset global pools
    global.publicPoolMass = 0;
    global.nodeResourceMass = 0; // Co-op pool
    global.predatorNodeMass = 0; // NEW: Predator pool
    // Reset stats object (including new stats)
    global.stats = {
        enforcersActive: 0,
        nodesBuilt: 0, // Co-op
        predatorMassRecovered: 0,
        defectorExclusions: 0,
        defectorPunishmentsNode: 0, // Co-op punish
        arrestsMade: 0,
        theftsCommitted: 0,
        bribesPaid: 0,
        corruptEnforcersCaught: 0,
        predatorNodesBuilt: 0, // NEW
        predatorNodeRaids: 0, // NEW
        predatorNodeResourcesConsumed: 0, // NEW
    };
    setSpeed(1); // Reset speed to 1x

    // Create agents based on GLOBAL_CONFIG (read from UI by updateConfigFromUI)
    for (let i = 0; i < GLOBAL_CONFIG.STARTING_COOPERATORS; i++)
        agents.push(new Agent(getRandom(0, canvas.width), getRandom(0, canvas.height), 'cooperator'));
    for (let i = 0; i < GLOBAL_CONFIG.STARTING_DEFECTORS; i++)
        agents.push(new Agent(getRandom(0, canvas.width), getRandom(0, canvas.height), 'defector'));
    for (let i = 0; i < GLOBAL_CONFIG.STARTING_COMPETITORS; i++)
        agents.push(new Agent(getRandom(0, canvas.width), getRandom(0, canvas.height), 'competitor'));
    for (let i = 0; i < GLOBAL_CONFIG.STARTING_PREDATORS; i++)
        agents.push(new Agent(getRandom(0, canvas.width), getRandom(0, canvas.height), 'predator'));

    updateStats(); // Initial stat display update
} // End initializeSimulation

// spawnResources uses the modified Resource constructor
function spawnResources() {
    if (resources.length < MAX_RESOURCE_COUNT && Math.random() < RESOURCE_SPAWN_RATE) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        resources.push(new Resource(x, y, GLOBAL_CONFIG.RESOURCE_MASS_GAIN, 'normal')); // Specify type 'normal'
    }
} // End spawnResources

// findTopPredatorAndClosestEnforcer remains the same as original v02 (with safety checks)
// **FUNCTIONALITY REMOVED to align with user request.**
function findTopPredatorAndClosestEnforcer() {
    // Top Predator logic is removed from the simulation loop
    topPredator = null;
    closestEnforcerToTopPredator = null;
} // End findTopPredatorAndClosestEnforcer

// updateAgents modified significantly for new interactions
function updateAgents() {
    let resourcesConsumed = []; // Track indices of consumed resources

    // --- Agent Update and Resource Consumption Loop ---
    for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        if (!agent || isNaN(agent.x) || isNaN(agent.y)) continue; // Skip invalid agents

        agent.update(); // Update agent position, decay, visuals

        // Check for resource collision
        for (let k = 0; k < resources.length; k++) {
            const resource = resources[k];
            // Skip invalid, already consumed, or NaN position resources
            if (!resource || resourcesConsumed.includes(k) || isNaN(resource.x) || isNaN(resource.y)) continue;

            const dist = distance(agent.x, agent.y, resource.x, resource.y);
            const collisionDist = (agent.radius || 1) + (resource.radius || 1); // Use safe radii

            if (dist < collisionDist) {
                // Enforcers don't consume resources
                if (agent.type === 'enforcer') {
                    continue; // Skip to next resource
                }

                const resourceEfficiencyMultiplier = 1 + agent.ability * 2;
                let massGained = resource.mass * resourceEfficiencyMultiplier; // Base calculated gain
                
                // MODIFICATION 1: Reduce cooperator gain by 50% for all resources
                if (agent.type === 'cooperator') {
                    massGained *= 0.5;
                }
                 if (isNaN(massGained)) massGained = 0; // Prevent NaN gain
                
                let canConsume = true;

                // --- Node Resource Interaction Logic ---
                if (resource.nodeType === 'cooperator') {
                    if (agent.type === 'defector') {
                        // Defector punishment
                        agent.mass *= (1 - GLOBAL_CONFIG.NODE_PUNISH_RATE);
                        // v0.4 FX: lightning bolt from nearest co-op node (use pre-teleport pos)
                        effectEngine.spawnZap(agent.x, agent.y);
                        spawnFloatingText(agent.x, agent.y - 8, 'ZAP!', COL.cyan, 50, 8);
                        agent.flashTimer = 10;
                        playPixelSound('zap');
                        agent.x = getRandom(0, canvas.width); // Teleport
                        agent.y = getRandom(0, canvas.height);
                        global.stats.defectorPunishmentsNode++;
                        massGained = 0; // No gain
                        canConsume = true; // Still consumes the resource
                    } else if (agent.type !== 'cooperator') {
                        // Competitors & Predators cannot consume co-op resources
                        canConsume = false;
                    }
                    // Cooperators consume normally
                } else if (resource.nodeType === 'predator') {
                    if (agent.type === 'predator') {
                        // Predator consumes its node resource
                        global.stats.predatorNodeResourcesConsumed++;
                        canConsume = true;
                    } else if (agent.type === 'competitor' && isAnyRaidActive()) {
                        // Competitor consumes predator resource during a raid
                        canConsume = true;
                    } else {
                        // All other types cannot consume
                        canConsume = false;
                    }
                }
                // Normal resources are consumed by all non-enforcers

                // --- Apply Mass Gain & Investment ---
                if (canConsume && massGained > 0) {
                    
                    // MODIFICATION 2: Competitor bonus for Predator Node resource consumption
                    if (agent.type === 'competitor' && resource.nodeType === 'predator') {
                         massGained *= 2.0; // Double the yield
                    }
                    
                    if (agent.type === 'cooperator') {
                        // Cooperator investment logic (from original v02)
                        const investment = massGained * GLOBAL_CONFIG.NODE_CONTRIBUTION_RATE;
                        if (!isNaN(investment)) global.nodeResourceMass += investment;
                        const netMassGained = massGained - investment; // Gain after investment

                        // Sharing logic (from original v02)
                        let nearestPartner = null;
                        let minPartnerDist = GLOBAL_CONFIG.COOPERATION_RANGE + 1;
                        for (const otherAgent of agents) {
                            if (!otherAgent || otherAgent === agent || isNaN(otherAgent.x) || isNaN(otherAgent.y)) continue;
                            if (otherAgent.type === 'cooperator' || otherAgent.type === 'defector') {
                                const d = distance(agent.x, agent.y, otherAgent.x, otherAgent.y);
                                if (d < minPartnerDist) {
                                    minPartnerDist = d;
                                    nearestPartner = otherAgent;
                                }
                            }
                        }
                        if (nearestPartner) {
                            if (nearestPartner.type === 'defector' && agent.excluded_defectors.has(nearestPartner.id)) {
                                agent.gainMass(netMassGained); // Excluded, keep all
                            } else {
                                agent.gainMass(netMassGained / 2); // Share
                                nearestPartner.gainMass(netMassGained / 2);
                                // v0.4 FX: floating hearts between sharers (grid-throttled)
                                effectEngine.spawn('trade', agent.x, agent.y - 6);
                                spawnFloatingText(agent.x, agent.y - 10, 'SHARED', COL.green, 40, 6);
                                // Track sharing with defectors for exclusion
                                if (nearestPartner.type === 'defector') {
                                    const count = (agent.shared_with_defectors.get(nearestPartner.id) || 0) + 1;
                                    agent.shared_with_defectors.set(nearestPartner.id, count);
                                    if (count >= GLOBAL_CONFIG.DEFECTOR_EXCLUSION_THRESHOLD) {
                                        agent.excluded_defectors.add(nearestPartner.id);
                                        global.stats.defectorExclusions++;
                                        // v0.4 FX: red X over the banned defector
                                        effectEngine.spawn('exclusion', nearestPartner.x, nearestPartner.y);
                                        spawnFloatingText(nearestPartner.x, nearestPartner.y - 10, 'BANNED', COL.purple, 55, 6);
                                    }
                                }
                            }
                        } else {
                            agent.gainMass(netMassGained); // No partner, keep all
                        }
                    } else { // Competitors, Defectors, Predators gain normally (including bonus for Competitor)
                        agent.gainMass(massGained);
                    }
                }

                // Mark resource for consumption if allowed
                if (canConsume) {
                    // v0.4 FX: coin pop (grid-throttled so high speed stays cheap)
                    if (massGained > 0) {
                        effectEngine.spawn('coin', resource.x, resource.y);
                        spawnFloatingText(resource.x, resource.y - 6, '+' + Math.round(massGained), COL.amber, 35, 6);
                    }
                    if (!resourcesConsumed.includes(k)) {
                         resourcesConsumed.push(k);
                    }
                    break; // Agent consumes only one resource per check
                }
            } // End collision check
        } // End resource loop
    } // End agent update loop

    // --- Agent Interaction Loop (Theft, Arrest, Raid Combat) ---
    for (let i = agents.length - 1; i >= 0; i--) {
        const agent = agents[i];
        if (!agent || isNaN(agent.x) || isNaN(agent.y)) continue; // Check agent validity

        for (let j = agents.length - 1; j >= 0; j--) {
            if (i === j) continue; // Don't interact with self
            const other = agents[j];
            if (!other || isNaN(other.x) || isNaN(other.y)) continue; // Check other agent validity

            // Check for collision between agents
            const dist = distance(agent.x, agent.y, other.x, other.y);
            const collisionDist = (agent.radius || 1) + (other.radius || 1); // Use safe radii

            if (dist < collisionDist) {
                // --- Enforcer vs Predator Interaction ---
                if (agent.type === 'enforcer' && other.type === 'predator') {
                    // CHANGED: Raid Combat (Mutual mass drain)
                    if (agent.isRaiding) {
                        agent.mass -= RAID_COMBAT_DRAIN_RATE;
                        other.mass -= RAID_COMBAT_DRAIN_RATE;

                        const predatorDefeated = other.mass < other.MINIMUM_MASS;
                        const enforcerDefeated = agent.mass < agent.MINIMUM_MASS;

                        if (predatorDefeated) {
                            // Get mass *before* it went negative
                            const recoveredMass = other.mass + RAID_COMBAT_DRAIN_RATE; 
                            if (!isNaN(recoveredMass)) global.stats.predatorMassRecovered += recoveredMass;
                            
                            const removedPredator = agents.splice(j, 1)[0];
                            if (j < i) i--; // Adjust outer loop index
                            if (removedPredator) {
                                jail.push({ agent: removedPredator, releaseTime: gameFrame + GLOBAL_CONFIG.JAIL_TIME });
                                // v0.4 FX: bust flash + BUSTED!
                                effectEngine.spawn('bust', removedPredator.x, removedPredator.y);
                                spawnFloatingText(removedPredator.x, removedPredator.y - 14, 'BUSTED!', COL.white, 55, 8);
                                playPixelSound('arrest');
                            }
                        }
                        if (enforcerDefeated) {
                            // NEW: Call for backup logic
                            const raidedNodeId = agent.raidTargetNodeId; // Get the ID before agent is removed
                            const defeatedAgentX = agent.x; // Get position for finding backup
                            const defeatedAgentY = agent.y;

                            agents.splice(i, 1); // Remove enforcer

                            // --- NEW BACKUP LOGIC ---
                            if (raidedNodeId) {
                                // Find the node (it might have been destroyed, so check)
                                const raidedNode = nodes.find(n => n.id === raidedNodeId && n.isBeingRaided);
                                if (raidedNode) {
                                    // Find the nearest available enforcer (not raiding)
                                    let nearestBackup = null;
                                    let minDist = Infinity;
                                    for (const backupAgent of agents) {
                                        if (backupAgent && backupAgent.type === 'enforcer' && !backupAgent.isRaiding) {
                                            const dist = distance(defeatedAgentX, defeatedAgentY, backupAgent.x, backupAgent.y); // Find closest to *defeated* enforcer
                                            if (dist < minDist) {
                                                minDist = dist;
                                                nearestBackup = backupAgent;
                                            }
                                        }
                                    }
                                    
                                    // If a backup was found, assign them to the raid
                                    if (nearestBackup) {
                                        nearestBackup.isRaiding = true;
                                        nearestBackup.raidTargetNodeId = raidedNodeId;
                                        // The node's 'currentRaidForce' will auto-update on its next frame,
                                        // so we don't need to manually increment it here.
                                    }
                                }
                            }
                            // --- END NEW BACKUP LOGIC ---

                            i = agents.length; // Reset outer loop index
                            break; // Break inner loop
                        }
                    }
                    // Standard Arrest (Outside Raid, Predator not safe)
                    else if (!other.isSafeInNode && other.immunityTimer <= 0) { // Check immunity
                        // Corruption Check (Bribe)
                        if (Math.random() < (GLOBAL_CONFIG.BRIBE_CHANCE_PERCENT / 100.0)) {
                            let witnessFound = false;
                            for (const witness of agents) {
                                if (!witness || witness === agent || witness.type !== 'enforcer' || isNaN(witness.x) || isNaN(witness.y)) continue;
                                if (distance(agent.x, agent.y, witness.x, witness.y) < GLOBAL_CONFIG.ENFORCER_VISION) {
                                    witnessFound = true;
                                    break;
                                }
                            }
                            if (witnessFound) { // Corrupt enforcer caught
                                global.stats.corruptEnforcersCaught++;
                                 // console.log(`Corrupt Enforcer ${agent.id} caught by witness!`);
                                agents.splice(i, 1); // Remove corrupt enforcer
                                i = agents.length; // Reset outer loop index
                                break; // Agent 'i' is gone
                            } else { // Bribe successful
                                const bribeAmount = other.mass * BRIBE_RATE;
                                if (!isNaN(bribeAmount)) {
                                     other.mass -= bribeAmount;
                                     global.stats.bribesPaid++;
                                     // v0.4 FX: cash + spin + BRIBED!
                                     effectEngine.spawn('bribe', agent.x, agent.y);
                                     spawnFloatingText(agent.x, agent.y - 14, 'BRIBED!', COL.amber, 55, 8);
                                     playPixelSound('bribe');
                                }
                            }
                        } else { // Arrest successful
                            global.stats.arrestsMade++;
                            const recoveredMass = other.mass;
                            if (!isNaN(recoveredMass)) {
                                 // Mass is NOT duplicated to public pool here (corrected from previous attempts)
                                global.stats.predatorMassRecovered += recoveredMass;
                            }
                             // console.log(`Enforcer ${agent.id} arrested Predator ${other.id}`);
                            // Remove predator (careful with index)
                            const removedPredator = agents.splice(j, 1)[0];
                             if (j < i) i--;
                              if (removedPredator) { // Ensure splice worked before jailing
                                jail.push({ agent: removedPredator, releaseTime: gameFrame + GLOBAL_CONFIG.JAIL_TIME });
                                // v0.4 FX: bust flash + BUSTED!
                                effectEngine.spawn('bust', removedPredator.x, removedPredator.y);
                                spawnFloatingText(removedPredator.x, removedPredator.y - 14, 'BUSTED!', COL.white, 55, 8);
                                playPixelSound('arrest');
                              }
                        }
                    } // End standard arrest logic
                } // End Enforcer vs Predator

                // --- Predator vs Commonfolk Interaction (Theft) ---
                else if (agent.type === 'predator' && other.type !== 'predator' && other.type !== 'enforcer') {
                    const stolenMass = other.mass * GLOBAL_CONFIG.PREDATOR_THEFT_RATE;
                    // Ensure victim has enough mass to steal from, leaving minimum mass
                    const actualStolenMass = Math.min(stolenMass, Math.max(0, other.mass - other.MINIMUM_MASS));

                    if (actualStolenMass > 0 && !isNaN(actualStolenMass)) {
                        agent.gainMass(actualStolenMass);
                        other.mass -= actualStolenMass;
                        global.stats.theftsCommitted++;
                        agent.crimeCount++; // NEW: Increment predator's crime count
                        recentCrimes.push({ x: agent.x, y: agent.y, time: gameFrame }); // NEW: Log crime event
                        // --- v0.4 FX: blood splash + stolen-amount popups ---
                        effectEngine.spawn('blood', other.x, other.y);
                        spawnFloatingText(other.x, other.y - 6, '-' + Math.round(actualStolenMass), COL.red, 45, 6);
                        spawnFloatingText(agent.x, agent.y - 12, '+' + Math.round(actualStolenMass), COL.green, 45, 6);
                        agent.flashTimer = 4;
                        playPixelSound('theft');

                        // Contribute portion to predator node pool
                        const investment = actualStolenMass * PREDATOR_NODE_CONTRIBUTION_RATE;
                         if (!isNaN(investment)) global.predatorNodeMass += investment;

                        // Increment crime level if theft occurs inside a predator node
                        for (const node of nodes) {
                            if (node && node.nodeType === 'predator' && !node.isBeingRaided) { // Check node exists
                                if (distance(agent.x, agent.y, node.x, node.y) < node.spawnRadius) {
                                     if (!isNaN(actualStolenMass)) node.crimeLevel += actualStolenMass;
                                    break; // Only increment for one node
                                }
                            } // <-- ADDED MISSING BRACE
                        } // <-- ADDED MISSING BRACE
                    } // <-- ADDED MISSING BRACE
                } // End Predator vs Commonfolk
            } // End collision check
        } // End inner agent loop
    } // End outer agent loop

    // --- Agent Death Check ---
    for (let i = agents.length - 1; i >= 0; i--) {
         const agent = agents[i];
         // Remove agent if below minimum mass or invalid (CHANGED: Added position check)
         if (!agent || agent.mass <= agent.MINIMUM_MASS || isNaN(agent.mass) || isNaN(agent.x) || isNaN(agent.y)) {
             // v0.4 FX: death poof (only for agents with a valid on-screen position)
             if (agent && !isNaN(agent.x) && !isNaN(agent.y)) {
                 effectEngine.spawn('death', agent.x, agent.y);
                 spawnFloatingText(agent.x, agent.y - 8, 'x_x', COL.gray, 60, 6);
                 playPixelSound('death');
             }
             agents.splice(i, 1);
         }
    }


    // --- Remove Consumed Resources ---
    // Sort indices descending to avoid messing up subsequent splices
    resourcesConsumed.sort((a, b) => b - a).forEach(index => {
         if (index >= 0 && index < resources.length) { // Bounds check before splice
             resources.splice(index, 1);
         }
    });

    findTopPredatorAndClosestEnforcer(); // Update tracking vars (Now a stub)
    // updateStats(); // Stats are updated at the end of gameLoop now
} // End updateAgents

// updateGovernance remains mostly same as original v02, BUT adds spawning at Co-op nodes
function updateGovernance() {
    let enforcerCount = 0;
    for (const agent of agents) {
        if (agent && agent.type === 'enforcer') enforcerCount++;
    }

    // Pay salaries
    const totalSalaryCost = enforcerCount * GLOBAL_CONFIG.ENFORCER_SALARY;
    if (!isNaN(totalSalaryCost)) global.publicPoolMass -= totalSalaryCost;

    // Fire enforcers if pool is negative
    if (global.publicPoolMass < 0) {
        const deficit = Math.abs(global.publicPoolMass);
        // Ensure salary is positive to avoid infinite loop
        const safeSalary = Math.max(0.1, GLOBAL_CONFIG.ENFORCER_SALARY);
        const enforcersToFire = Math.ceil(deficit / safeSalary);
        let firedCount = 0;
        for (let i = agents.length - 1; i >= 0; i--) {
            if (agents[i] && agents[i].type === 'enforcer') {
                agents.splice(i, 1);
                firedCount++;
                if (firedCount >= enforcersToFire) break;
            }
        }
        global.publicPoolMass = 0; // Reset pool after firing
    }

    // Collect taxes
    const taxableAgents = agents.filter(a => a && a.type !== 'enforcer' && !isNaN(a.mass)); // Filter valid agents
    taxableAgents.sort((a, b) => b.mass - a.mass); // Richest first
    let taxCollected = 0;
    for (let i = 0; i < Math.min(taxableAgents.length, TOP_AGENT_TAX_COUNT); i++) {
        const taxAmount = taxableAgents[i].mass * TAX_RATE;
         if (!isNaN(taxAmount) && taxAmount > 0) { // Ensure valid tax amount
            taxableAgents[i].mass -= taxAmount;
            taxCollected += taxAmount;
         }
    }
    if (!isNaN(taxCollected)) global.publicPoolMass += taxCollected;


    // REMOVED: Dynamic spawn threshold logic
    // const scalingFactor = 1 + Math.pow(enforcerCount / TARGET_ENFORCER_POPULATION, 2);
    // const dynamicSpawnThreshold = BASE_ENFORCER_SPAWN_THRESHOLD * scalingFactor;

    // Spawn new enforcers if threshold met
    if (global.publicPoolMass >= ENFORCER_SPAWN_THRESHOLD) { // REVERTED: to use constant threshold
        // Cost to spawn is the START_MASS
        if (!isNaN(ENFORCER_START_MASS)) global.publicPoolMass -= ENFORCER_START_MASS; // Cost to spawn

        // Spawn at a random co-op node, or center if none
        let spawnX = canvas.width / 2;
        let spawnY = canvas.height / 2;
        const coOpNodes = nodes.filter(n => n && n.nodeType === 'cooperator'); // Check node exists
        if (coOpNodes.length > 0) {
            const randomNode = coOpNodes[Math.floor(Math.random() * coOpNodes.length)];
            spawnX = randomNode.x;
            spawnY = randomNode.y;
        }
        agents.push(new Agent(spawnX, spawnY, 'enforcer'));
         // console.log("New Enforcer spawned.");
    }
} // End updateGovernance


// Renamed from updateInvestment to clarify it's for Co-op nodes
function updateCoopInvestment() {
    if (global.nodeResourceMass >= NODE_MASS_THRESHOLD) {
        global.nodeResourceMass -= NODE_MASS_THRESHOLD; // Cost to build
        let validSpot = false;
        let attempts = 0;
        let newNodeX, newNodeY;

        // Try to find a non-overlapping spot
        while (!validSpot && attempts < 10) {
            newNodeX = getRandom(NODE_SPAWN_RADIUS, canvas.width - NODE_SPAWN_RADIUS);
            newNodeY = getRandom(NODE_SPAWN_RADIUS, canvas.height - NODE_SPAWN_RADIUS);
            validSpot = true;
            for (const node of nodes) {
                if (!node) continue; // Skip invalid nodes
                // Check distance against combined spawn radii
                if (distance(newNodeX, newNodeY, node.x, node.y) < node.spawnRadius + NODE_SPAWN_RADIUS) {
                    validSpot = false;
                    break;
                }
            }
            attempts++;
        }

        if (validSpot) {
            nodes.push(new Node(newNodeX, newNodeY, 'cooperator')); // Specify type
            global.stats.nodesBuilt++; // Increment co-op node count
            // v0.4 FX: construction dust + banner
            effectEngine.spawn('build', newNodeX, newNodeY);
            spawnFloatingText(newNodeX, newNodeY - 18, 'NODE BUILT!', COL.cyan, 80, 8);
            playPixelSound('build');
        } else {
             // console.log("Failed to find spot for Co-op node, refunding.");
            global.nodeResourceMass += NODE_MASS_THRESHOLD; // Refund if no spot found
        }
    }
} // End updateCoopInvestment

// NEW: Function to handle Predator node investment
function updatePredatorInvestment() {
    if (global.predatorNodeMass >= PREDATOR_NODE_MASS_THRESHOLD) {
        global.predatorNodeMass -= PREDATOR_NODE_MASS_THRESHOLD; // Cost to build
        let validSpot = false;
        let attempts = 0;
        let newNodeX, newNodeY;

        // Try to find a non-overlapping spot
        while (!validSpot && attempts < 10) {
            newNodeX = getRandom(PREDATOR_NODE_SPAWN_RADIUS, canvas.width - PREDATOR_NODE_SPAWN_RADIUS);
            newNodeY = getRandom(PREDATOR_NODE_SPAWN_RADIUS, canvas.height - PREDATOR_NODE_SPAWN_RADIUS);
            validSpot = true;
            for (const node of nodes) {
                if (!node) continue; // Skip invalid nodes
                 // Check distance against combined spawn radii (using predator node radius for self)
                if (distance(newNodeX, newNodeY, node.x, node.y) < node.spawnRadius + PREDATOR_NODE_SPAWN_RADIUS) {
                    validSpot = false;
                    break;
                }
            }
            attempts++;
        }

        if (validSpot) {
            nodes.push(new Node(newNodeX, newNodeY, 'predator')); // Specify type
            global.stats.predatorNodesBuilt++; // Increment predator node count
            // v0.4 FX: construction dust + ominous banner
            effectEngine.spawn('build', newNodeX, newNodeY);
            spawnFloatingText(newNodeX, newNodeY - 18, 'HIDEOUT!', COL.red, 80, 8);
            playPixelSound('build');
        } else {
            // console.log("Failed to find spot for Predator node, refunding.");
            global.predatorNodeMass += PREDATOR_NODE_MASS_THRESHOLD; // Refund if no spot found
        }
    }
} // End updatePredatorInvestment

// Modified updateJail to reset mass/radius/level correctly
function updateJail() {
    for (let i = jail.length - 1; i >= 0; i--) {
        const jailEntry = jail[i];
         // Safety check for entry and release time
         if (!jailEntry || isNaN(jailEntry.releaseTime)) {
             jail.splice(i, 1);
             continue;
         }

        if (gameFrame >= jailEntry.releaseTime) {
            const releasedAgent = jailEntry.agent;
             // More robust safety check for the agent object
             if (!releasedAgent || typeof releasedAgent.calculateRadius !== 'function') {
                 jail.splice(i, 1);
                 continue;
             }
            
            // NEW: Respawn logic (Modified to prioritize raided nodes)
            const raidedPredNodes = nodes.filter(n => n && n.nodeType === 'predator' && n.isBeingRaided);
            // Fallback to Unraided Nodes (Second Priority)
            let spawnNodeCandidates = raidedPredNodes.length > 0 ? raidedPredNodes : nodes.filter(n => n && n.nodeType === 'predator' && !n.isBeingRaided);

            if (spawnNodeCandidates.length > 0) {
                // Spawn inside a random predator node (raided or unraided)
                const randomNode = spawnNodeCandidates[Math.floor(Math.random() * spawnNodeCandidates.length)];
                // Spawn inside, but not on the exact center
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * (randomNode.spawnRadius * 0.9); // 90% of radius to be safe
                releasedAgent.x = randomNode.x + Math.cos(angle) * r;
                releasedAgent.y = randomNode.y + Math.sin(angle) * r;
                releasedAgent.immunityTimer = 0; // No immunity needed if inside a node
            } else {
                // No nodes, spawn randomly and grant immunity
                releasedAgent.x = getRandom(0, canvas.width);
                releasedAgent.y = getRandom(0, canvas.height);
                releasedAgent.immunityTimer = 300; // ~5 seconds at 60fps (if speed=1)
            }

            // Reset mass to base level (using INITIAL_RADIUS)
            releasedAgent.mass = (INITIAL_RADIUS * INITIAL_RADIUS * Math.PI);
             // Ensure mass doesn't start below death threshold after reset
             if (releasedAgent.mass < AGENT_DEATH_THRESHOLD) {
                 releasedAgent.mass = AGENT_DEATH_THRESHOLD;
             }
            releasedAgent.radius = releasedAgent.calculateRadius(releasedAgent.mass); // Use method
            releasedAgent.visualLevel = 0; // Reset visual level
            releasedAgent.crimeCount = 0; // NEW: Reset crime count
            // Reset velocity to prevent infinite speed issues
             releasedAgent.vx = (Math.random() - 0.5) * releasedAgent.baseSpeed;
             releasedAgent.vy = (Math.random() - 0.5) * releasedAgent.baseSpeed;

            agents.push(releasedAgent); // Add back to simulation
            jail.splice(i, 1); // Remove from jail
             // console.log(`Agent ${releasedAgent.id} released from jail.`);
        }
    }
} // End updateJail


// updatePopulationDynamics remains the same as original v02 (with safety checks)
function updatePopulationDynamics() {
    if (Math.random() > POPULATION_RESEED_CHANCE) {
        return; // Only run occasionally
    }

    let aliveCounts = { cooperator: 0, competitor: 0, defector: 0, predator: 0 };
    let jailedCounts = { cooperator: 0, competitor: 0, defector: 0, predator: 0 };

    // Count living agents
    for (const agent of agents) {
        if (agent && agent.type in aliveCounts) { // Check agent exists
            aliveCounts[agent.type]++;
        }
    }
    // Count jailed agents
    for (const entry of jail) {
        if (entry && entry.agent && entry.agent.type in jailedCounts) { // Check entry and agent exist
            jailedCounts[entry.agent.type]++;
        }
    }

    const totalPopulationSize = agents.length + jail.length;
    if (totalPopulationSize === 0) return; // Avoid division by zero

    // Calculate current totals and target counts based on natural percentages
    const currentTotals = {
        cooperator: aliveCounts.cooperator + jailedCounts.cooperator,
        competitor: aliveCounts.competitor + jailedCounts.competitor,
        defector: aliveCounts.defector + jailedCounts.defector,
        predator: aliveCounts.predator + jailedCounts.predator,
    };
    const targetCounts = {
        cooperator: Math.floor(totalPopulationSize * GLOBAL_CONFIG.NATURAL_COOPERATOR_PERCENT),
        competitor: Math.floor(totalPopulationSize * GLOBAL_CONFIG.NATURAL_COMPETITOR_PERCENT),
        defector: Math.floor(totalPopulationSize * GLOBAL_CONFIG.NATURAL_DEFECTOR_PERCENT),
        predator: Math.floor(totalPopulationSize * GLOBAL_CONFIG.NATURAL_PREDATOR_PERCENT),
    };

    // Reseed if below target count for each type
    for (const type in targetCounts) {
        if (currentTotals[type] < targetCounts[type]) {
            // agents.push(new Agent(getRandom(0, canvas.width), getRandom(0, canvas.height), type));
            // console.log(`Reseeded a ${type}.`);
            
            // NEW: Use spawn logic for re-seeding predators (Modified to prioritize raided nodes)
            if (type === 'predator') {
                const newPred = new Agent(0, 0, 'predator'); // Create agent at (0,0) first

                // Check for Raided Nodes (Highest Priority)
                const raidedPredNodes = nodes.filter(n => n && n.nodeType === 'predator' && n.isBeingRaided);
                // Fallback to Unraided Nodes (Second Priority)
                let spawnNodeCandidates = raidedPredNodes.length > 0 ? raidedPredNodes : nodes.filter(n => n && n.nodeType === 'predator' && !n.isBeingRaided);

                if (spawnNodeCandidates.length > 0) {
                    // Spawn inside a random predator node (raided or unraided)
                    const randomNode = spawnNodeCandidates[Math.floor(Math.random() * spawnNodeCandidates.length)];
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * (randomNode.spawnRadius * 0.9); // 90% of radius
                    newPred.x = randomNode.x + Math.cos(angle) * r;
                    newPred.y = randomNode.y + Math.sin(angle) * r;
                    newPred.immunityTimer = 0; // No immunity needed if inside a node
                } else {
                    // No nodes, spawn randomly and grant immunity
                    newPred.x = getRandom(0, canvas.width);
                    newPred.y = getRandom(0, canvas.height);
                    newPred.immunityTimer = 300; // ~5 seconds
                }
                agents.push(newPred);
            } else {
                // Spawn other types normally
                agents.push(new Agent(getRandom(0, canvas.width), getRandom(0, canvas.height), type));
            }
        }
    }
} // End updatePopulationDynamics

// updateStats modified to calculate 3 groups and update new UI elements
function updateStats() {
    let typeMass = { cooperator: 0, competitor: 0, defector: 0, predator: 0 };
    let typeCount = { cooperator: 0, competitor: 0, defector: 0, predator: 0 };
    global.stats.enforcersActive = 0;

    // Sum mass and count for each type (excluding enforcers from groups)
    for (const agent of agents) {
        if (!agent || isNaN(agent.mass)) continue; // Skip invalid agents/mass
        if (agent.type in typeMass) {
            typeMass[agent.type] += agent.mass;
            typeCount[agent.type]++;
        } else if (agent.type === 'enforcer') {
            global.stats.enforcersActive++;
        }
    }

    // Calculate group masses
    const coopGroupMass = typeMass.cooperator + typeMass.defector;
    const compGroupMass = typeMass.competitor; // Competitors only
    const predGroupMass = typeMass.predator; // Predators only
    const coopGroupCount = typeCount.cooperator + typeCount.defector;
    const compGroupCount = typeCount.competitor;
    const predGroupCount = typeCount.predator;

    totalSimMass = coopGroupMass + compGroupMass + predGroupMass; // Sum of the three groups

    // Calculate per capita masses
    const avgCoopGroupMass = coopGroupCount > 0 ? coopGroupMass / coopGroupCount : 0;
    const avgCompGroupMass = compGroupCount > 0 ? compGroupMass / compGroupCount : 0;
    const avgPredGroupMass = predGroupCount > 0 ? predGroupMass / predGroupCount : 0;

    // --- Update UI Elements (with null checks) ---
    // Total Mass
    if (totalMassDisplay) totalMassDisplay.textContent = `Total Mass: ${totalSimMass.toFixed(0)}`;

    // Group Mass Bars
    if (coopGroupMassDisplay) coopGroupMassDisplay.textContent = coopGroupMass.toFixed(0);
    if (compGroupMassDisplay) compGroupMassDisplay.textContent = compGroupMass.toFixed(0);
    if (predGroupMassDisplay) predGroupMassDisplay.textContent = predGroupMass.toFixed(0); // NEW

    // Bar Widths (3 bars now)
    if (totalSimMass > 0) {
        if (coopBar) coopBar.style.width = `${(coopGroupMass / totalSimMass) * 100}%`;
        if (compBar) compBar.style.width = `${(compGroupMass / totalSimMass) * 100}%`;
        if (predBar) predBar.style.width = `${(predGroupMass / totalSimMass) * 100}%`; // NEW
    } else { // Default equal width if total mass is 0
        if (coopBar) coopBar.style.width = '33.3%';
        if (compBar) compBar.style.width = '33.3%';
        if (predBar) predBar.style.width = '33.3%'; // NEW
    }

    // Agent Type Breakdown
    if (coopMassDisplay) coopMassDisplay.textContent = typeMass.cooperator.toFixed(0);
    if (compMassDisplay) compMassDisplay.textContent = typeMass.competitor.toFixed(0);
    if (defectorMassDisplay) defectorMassDisplay.textContent = typeMass.defector.toFixed(0);
    if (predatorMassDisplay) predatorMassDisplay.textContent = typeMass.predator.toFixed(0);

    // Per Capita Stats
    if (avgCoopMassDisplay) avgCoopMassDisplay.textContent = avgCoopGroupMass.toFixed(0);
    if (avgCompMassDisplay) avgCompMassDisplay.textContent = avgCompGroupMass.toFixed(0);
    if (avgPredMassDisplay) avgPredMassDisplay.textContent = avgPredGroupMass.toFixed(0); // NEW

    // System Stability Stats
    if (statPublicPool) statPublicPool.textContent = global.publicPoolMass.toFixed(0);
    if (statEnforcers) statEnforcers.textContent = global.stats.enforcersActive;
    if (statMassRecovered) statMassRecovered.textContent = global.stats.predatorMassRecovered.toFixed(0);
    // Co-op Investment
    if (statNodePool) statNodePool.textContent = global.nodeResourceMass.toFixed(0);
    if (statNodesBuilt) statNodesBuilt.textContent = global.stats.nodesBuilt;
    if (statNodePunishments) statNodePunishments.textContent = global.stats.defectorPunishmentsNode;
    // Predator Investment (NEW)
    if (statPredNodePool) statPredNodePool.textContent = global.predatorNodeMass.toFixed(0);
    if (statPredNodesBuilt) statPredNodesBuilt.textContent = global.stats.predatorNodesBuilt;
    if (statPredNodeRaids) statPredNodeRaids.textContent = global.stats.predatorNodeRaids;
    if (statPredNodeResources) statPredNodeResources.textContent = global.stats.predatorNodeResourcesConsumed;
    // Reciprocity
    if (statDefectorExclusions) statDefectorExclusions.textContent = global.stats.defectorExclusions;

    // Crime & Justice Stats
    if (statArrests) statArrests.textContent = global.stats.arrestsMade;
    if (statThefts) statThefts.textContent = global.stats.theftsCommitted;
    if (statBribes) statBribes.textContent = global.stats.bribesPaid;
    if (statCorruptCaught) statCorruptCaught.textContent = global.stats.corruptEnforcersCaught;
} // End updateStats


// setSpeed remains the same as original v02 (with null check)
function setSpeed(newSpeed) {
    currentSpeedMultiplier = newSpeed;
    if (currentSpeedDisplay) currentSpeedDisplay.textContent = `${newSpeed}x`; // Safety check
    // v0.4: pixel-button active state
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.speed) === newSpeed);
    });
} // End setSpeed

// --- Main Loop and Controls ---

/* ============================================================================
   v0.4 PIXEL-ART RENDER LAYER
   The ABM mechanics above are untouched. Everything below only changes how
   the world is DRAWN: chunky sprites, CRT effects, particles, boot sequence.
   ============================================================================ */

ctx.imageSmoothingEnabled = false; // CRITICAL: keep pixels crisp

// JS-side palette (mirror of style.css)
const COL = {
    black:'#0a0a0a', dark:'#1a1a2e', panel:'#16213e', border:'#0f3460',
    steel:'#2d4a7a', dim:'#4a6fa5', white:'#e0e0e0', bright:'#ffffff',
    green:'#00ff41', greenDim:'#007a1f', amber:'#ffb627',
    red:'#ff2d2d', redDim:'#8b0000', blue:'#4169e1', blueBright:'#60a5fa',
    cyan:'#00ffff', purple:'#9b59ff', orange:'#ff8c00', gray:'#555577',
    grass1:'#16271a', grass2:'#1b3020', road:'#2a2a2a',
};

const SPRITE_SCALE = 3; // canvas px per sprite px

// --- low-level pixel helpers ---
function parseSprite(rows){
    return rows.map(r => r.split('').map(ch => ch === '.' ? 0 : parseInt(ch, 10)));
}
// draw a sprite grid CENTERED on (cx,cy). 0 = transparent. optional flip + solid tint.
function drawSprite(grid, palette, cx, cy, scale, flipH, tint){
    const h = grid.length, w = grid[0].length;
    const ox = Math.round(cx - (w * scale) / 2);
    const oy = Math.round(cy - (h * scale) / 2);
    for (let r = 0; r < h; r++){
        const row = grid[r];
        for (let c = 0; c < w; c++){
            const idx = flipH ? row[w - 1 - c] : row[c];
            if (!idx) continue;
            ctx.fillStyle = tint || palette[idx] || '#f0f';
            ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
        }
    }
}

// --- AGENT SPRITES (7x8, 2-frame walk via leg-swap) ---
function walkFrames(base){
    const b = base.map(r => r.slice());
    const t = b[6]; b[6] = b[7]; b[7] = t; // step: swap the two leg rows
    return [base, b];
}
const SPR = {
    cooperator: {
        pal: [null, COL.greenDim, COL.green, COL.white, COL.cyan],
        frames: walkFrames(parseSprite([
            "..111..",".12221.",".13231.","4122214",".12221.",".12221.","..1.1..",".1...1."]))
    },
    defector: {
        pal: [null, '#3b1d6b', COL.purple, '#ffe400'],
        frames: walkFrames(parseSprite([
            "..111..",".12221.",".12221.","1232321",".12221.",".12221.","..1.1..",".1...1."]))
    },
    competitor: {
        pal: [null, '#a85a00', COL.orange, COL.white, COL.gray],
        frames: walkFrames(parseSprite([
            "..111..",".12221.",".13231.",".12321.",".122214",".122214","..1.1..",".1...1."]))
    },
    predator: {
        pal: [null, COL.redDim, COL.red, COL.dark, COL.white],
        frames: walkFrames(parseSprite([
            "..111..",".12221.",".13331.",".122214",".122214",".12221.","..1.1..",".1...1."]))
    },
    enforcer: {
        pal: [null, '#1e3a8a', COL.blue, COL.amber, COL.black],
        frames: walkFrames(parseSprite([
            ".11111.",".12221.",".12221.",".12321.","412221.",".12221.","..1.1..",".1...1."]))
    },
};

// --- RESOURCE "GRUB" sprite (5x5) with per-type palette ---
const GRUB = parseSprite(["..1..",".121.","12321",".121.","..1.."]);
const GRUB_PAL = {
    normal:     [null, '#a8740c', COL.amber, COL.white],
    cooperator: [null, '#0e7490', COL.cyan,  COL.white],
    predator:   [null, '#9a3412', COL.orange, COL.white],
};

// --- procedural NODE sprites (cleaner than a 16x16 hand grid) ---
function drawCoopNodeSprite(cx, cy){
    const s = 3;                       // pixel size
    const P = (px, py, w, hh, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx + px*s), Math.round(cy + py*s), w*s, hh*s); };
    // flag (waves)
    const wave = (gameFrame % 40 < 20);
    P(-1, -10, 1, 6, COL.white);                       // pole
    if (wave) P(0, -10, 4, 3, COL.cyan); else P(0, -9, 4, 3, COL.cyan);
    // roof (stepped triangle)
    for (let i = 0; i < 4; i++) P(-4 + i, -4 - i + 0, (8 - i*2), 1, COL.border);
    P(-5, -4, 10, 1, COL.border);
    // walls
    P(-5, -3, 10, 6, COL.steel);
    P(-4, -2, 8, 4, COL.dim);
    // door
    P(-1, 0, 2, 3, COL.black);
    // base
    P(-5, 3, 10, 1, COL.panel);
}
function drawPredNodeSprite(cx, cy){
    const s = 3;
    const P = (px, py, w, hh, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx + px*s), Math.round(cy + py*s), w*s, hh*s); };
    // smoke
    const sm = (gameFrame % 30) / 30;
    ctx.fillStyle = COL.gray;
    ctx.globalAlpha = 0.5 * (1 - sm);
    ctx.fillRect(Math.round(cx - 2*s), Math.round(cy - (7 + sm*3)*s), s, s);
    ctx.fillRect(Math.round(cx + 1*s), Math.round(cy - (8 + sm*3)*s), s, s);
    ctx.globalAlpha = 1;
    // rock arch
    P(-5, -4, 10, 9, '#2a2a2a');
    P(-4, -3, 8, 7, '#1a1a2e');
    // void mouth
    P(-3, -2, 6, 6, COL.black);
    // glowing eyes (blink)
    if (gameFrame % 80 > 8){ P(-2, 0, 1, 1, COL.red); P(1, 0, 1, 1, COL.red); }
}

// --- GLYPHS for effects ---
const SKULL = parseSprite([".111.","12321","12321",".111.","1.1.1"]); // 5x5
const SKULL_PAL = [null, COL.gray, COL.white, COL.black];

/* ---------------- GROUND TEXTURE (cached to offscreen canvas) -------------- */
let groundCanvas = null;
const staticObjects = [];
function buildStaticObjects(){
    staticObjects.length = 0;
    for (let i = 0; i < 7; i++) staticObjects.push({ t:'bench', x: getRandom(40, canvas.width-40), y: getRandom(40, canvas.height-40) });
    for (let i = 0; i < 4; i++) staticObjects.push({ t:'tree',  x: getRandom(40, canvas.width-40), y: getRandom(40, canvas.height-40) });
}
function buildGround(){
    groundCanvas = document.createElement('canvas');
    groundCanvas.width = canvas.width; groundCanvas.height = canvas.height;
    const g = groundCanvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    // grass checkerboard
    for (let y = 0; y < canvas.height; y += 32){
        for (let x = 0; x < canvas.width; x += 32){
            g.fillStyle = ((x/32 + y/32) % 2 === 0) ? COL.grass1 : COL.grass2;
            g.fillRect(x, y, 32, 32);
        }
    }
    // dashed city roads
    g.fillStyle = COL.road;
    const my = canvas.height/2, mx = canvas.width/2;
    for (let x = 0; x < canvas.width; x += 24){ g.fillRect(x, my-2, 16, 4); }
    for (let y = 0; y < canvas.height; y += 24){ g.fillRect(mx-2, y, 4, 16); }
    // static props baked in
    if (staticObjects.length === 0) buildStaticObjects();
    for (const o of staticObjects){
        if (o.t === 'bench'){ g.fillStyle = COL.gray; g.fillRect(o.x|0, o.y|0, 9, 4); g.fillStyle = COL.steel; g.fillRect(o.x|0, (o.y+4)|0, 9, 2); }
        else { // tree: 5x5 star-ish
            g.fillStyle = '#0d3d12'; g.fillRect(o.x|0, o.y|0, 12, 12);
            g.fillStyle = '#155c1d'; g.fillRect((o.x+2)|0, (o.y+2)|0, 8, 8);
            g.fillStyle = '#1f8a2c'; g.fillRect((o.x+4)|0, (o.y+4)|0, 4, 4);
        }
    }
}
function drawGroundTexture(){
    if (!groundCanvas) buildGround();
    ctx.drawImage(groundCanvas, 0, 0);
}

/* ---------------- NODE TERRITORIES + SPRITES + culling -------------------- */
function drawNodeTerritories(){
    for (const node of nodes){
        if (!node || isNaN(node.x)) continue;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.spawnRadius, 0, Math.PI*2);
        ctx.fillStyle = node.nodeType === 'cooperator' ? 'rgba(0,255,255,0.10)' : 'rgba(255,45,45,0.10)';
        ctx.fill();
        // pulsing perimeter ring
        const pulse = (gameFrame % 90) / 90;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.spawnRadius * pulse, 0, Math.PI*2);
        ctx.strokeStyle = node.nodeType === 'cooperator'
            ? `rgba(0,255,255,${0.45*(1-pulse)})` : `rgba(255,45,45,${0.45*(1-pulse)})`;
        ctx.lineWidth = 1; ctx.stroke();
        // raided node flashes its whole territory
        if (node.isBeingRaided){
            ctx.beginPath(); ctx.arc(node.x, node.y, node.spawnRadius, 0, Math.PI*2);
            ctx.strokeStyle = (gameFrame % 16 < 8) ? COL.red : COL.blue; ctx.lineWidth = 2; ctx.stroke();
        }
    }
}
function drawNodesPix(){
    // cull dead nodes (preserves engine behavior from the old draw loop)
    for (let i = nodes.length - 1; i >= 0; i--){
        const node = nodes[i];
        if (!node || node.mass <= 0 || isNaN(node.mass)){ nodes.splice(i, 1); continue; }
        if (node.nodeType === 'cooperator') drawCoopNodeSprite(node.x, node.y);
        else drawPredNodeSprite(node.x, node.y);
    }
}
function drawResourcesPix(){
    for (const r of resources){
        if (!r || isNaN(r.x) || isNaN(r.y)) continue;
        const bob = (Math.floor(gameFrame/12) % 2 === 0) ? 0 : -1; // 2-frame bob
        const pal = GRUB_PAL[r.nodeType] || GRUB_PAL.normal;
        const sc = r.nodeType === 'normal' ? 2 : 3;
        drawSprite(GRUB, pal, r.x, r.y + bob, sc, false, null);
    }
}

/* ---------------- AGENTS as sprites ---------------------------------------- */
function drawAgentSprite(a){
    const def = SPR[a.type];
    if (!def){ return; }
    // scale grows a touch with mass / visual level so big agents read as bigger
    const scale = SPRITE_SCALE + Math.min(2, a.visualLevel);
    const moving = (a.vx*a.vx + a.vy*a.vy) > 0.02;
    const rate = a.fleeingCrime ? 4 : 8; // flee = faster legs
    const fi = moving ? (Math.floor((gameFrame + a.animSeed) / rate) % def.frames.length) : 0;
    // shadow blob
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(a.x - 7), Math.round(a.y + 9), 14, 3);
    // flash states
    let tint = null;
    if (a.spawnFlash > 0 && gameFrame % 4 < 2) tint = COL.bright;
    else if (a.flashTimer > 0 && gameFrame % 2 === 0) tint = COL.bright;
    else if (a.immunityTimer > 0 && gameFrame % 20 < 10) tint = COL.bright;
    else if (a.type === 'enforcer' && a.isRaiding && gameFrame % 20 < 10) tint = COL.amber;
    drawSprite(def.frames[fi], def.pal, a.x, a.y, scale, a.facing < 0, tint);
    // level-3 crown star
    if (a.visualLevel >= 3){
        ctx.fillStyle = COL.amber;
        ctx.fillRect(Math.round(a.x-1), Math.round(a.y - 8 - scale*4), 2, 2);
    }
}
function drawAgents(){
    const valid = agents.filter(a => a && !isNaN(a.mass) && !isNaN(a.x) && !isNaN(a.y));
    valid.sort((a, b) => a.mass - b.mass); // small first
    valid.forEach(drawAgentSprite);
}

/* ---------------- JAIL CORNER --------------------------------------------- */
function drawJailCorner(){
    const w = 92, h = 64, x0 = 4, y0 = canvas.height - h - 4;
    ctx.fillStyle = 'rgba(10,10,10,0.82)'; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = COL.gray; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = COL.green; ctx.font = "6px 'Press Start 2P', monospace"; ctx.textAlign = 'left';
    ctx.fillText('JAIL ' + jail.length, x0 + 4, y0 + 11);
    // jailed sprites behind bars
    let i = 0;
    for (const entry of jail){
        if (!entry || !entry.agent) continue;
        const col = i % 5, row = Math.floor(i / 5);
        if (row > 1) break; // show up to 10
        const jx = x0 + 12 + col*16, jy = y0 + 30 + row*22;
        const def = SPR[entry.agent.type];
        if (def) drawSprite(def.frames[0], def.pal, jx, jy, 2, false, null);
        // rotating star above
        const ang = (gameFrame + i*20) * 0.15;
        ctx.fillStyle = COL.amber;
        ctx.fillRect(Math.round(jx + Math.cos(ang)*5 - 1), Math.round(jy - 11 + Math.sin(ang)*2), 2, 2);
        i++;
    }
    // bars
    ctx.strokeStyle = COL.steel; ctx.lineWidth = 2;
    for (let bx = x0 + 8; bx < x0 + w - 4; bx += 9){
        ctx.beginPath(); ctx.moveTo(bx, y0 + 16); ctx.lineTo(bx, y0 + h - 4); ctx.stroke();
    }
}

/* ---------------- CANVAS HUD (mini status, top-center) -------------------- */
function drawCanvasHUD(){
    // top-center stats moved to the bottom status bar (top-center now hosts the logo notch).
    if (isAnyRaidActive()){
        ctx.fillStyle = (gameFrame % 20 < 10) ? COL.red : COL.amber;
        ctx.font = "6px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
        ctx.fillText('! RAID IN PROGRESS !', canvas.width/2, canvas.height - 10);
    }
}

/* ============================================================================
   EFFECT ENGINE — pooled transient particle effects, decoupled from sim speed
   ============================================================================ */
const fxFrameKeys = new Set();     // per-render-frame throttle of duplicate FX
const MAX_EFFECTS = 240;
class Effect {
    constructor(type, x, y, opts){
        this.type = type; this.x = x; this.y = y; this.opts = opts || {};
        this.life = this.opts.life || 50; this.maxLife = this.life;
        this.parts = [];
        const rnd = (a,b) => Math.random()*(b-a)+a;
        if (type === 'blood'){
            const n = 8 + (Math.random()*5|0);
            for (let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, sp=rnd(0.5,2.2);
                this.parts.push({x:0,y:0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rnd(24,40)}); }
            this.stain = []; this.life = 110; this.maxLife = 110;
        } else if (type === 'build'){
            for (let i=0;i<10;i++){ const a=Math.random()*Math.PI*2;
                this.parts.push({x:0,y:0,vx:Math.cos(a)*rnd(0.4,1.6),vy:-rnd(1,2.4),life:rnd(30,46)}); }
            this.life = 50; this.maxLife = 50;
        } else if (type === 'death'){
            for (let i=0;i<8;i++){ const a=Math.random()*Math.PI*2;
                this.parts.push({x:0,y:0,vx:Math.cos(a)*rnd(0.3,1.2),vy:Math.sin(a)*rnd(0.3,1.2),life:rnd(16,26)}); }
            this.life = 80; this.maxLife = 80;
        } else if (type === 'trade'){
            for (let i=0;i<5;i++) this.parts.push({x:rnd(-5,5),y:0,vx:rnd(-0.2,0.2),vy:-rnd(0.4,0.8),life:rnd(34,50)});
            this.life = 50; this.maxLife = 50;
        } else if (type === 'coin'){
            for (let i=0;i<3;i++){ const a=Math.random()*Math.PI*2;
                this.parts.push({x:0,y:0,vx:Math.cos(a)*rnd(0.4,1.1),vy:-rnd(0.6,1.4),life:rnd(20,30)}); }
            this.life = 30; this.maxLife = 30;
        } else if (type === 'bribe'){
            for (let i=0;i<4;i++) this.parts.push({x:rnd(-4,4),y:0,vx:rnd(-0.2,0.2),vy:-rnd(0.5,1),life:rnd(34,50)});
            this.life = 50; this.maxLife = 50;
        } else if (type === 'bust'){ this.life = 50; this.maxLife = 50;
        } else if (type === 'zap'){ this.life = 18; this.maxLife = 18;
        } else if (type === 'raid'){ this.life = 70; this.maxLife = 70;
        } else if (type === 'exclusion'){ this.life = 50; this.maxLife = 50; }
    }
    get progress(){ return 1 - this.life / this.maxLife; }
    update(){
        this.life--;
        if (['blood','build','death','trade','coin','bribe'].includes(this.type)){
            for (const p of this.parts){
                p.x += p.vx; p.y += p.vy; p.life--;
                if (this.type === 'blood') { p.vx *= 0.92; p.vy *= 0.92; }
                if (this.type === 'build' || this.type === 'coin') p.vy += 0.12; // gravity
            }
        }
    }
    draw(ctx){
        const a = Math.max(0, this.life / this.maxLife);
        if (this.type === 'blood'){
            for (const p of this.parts){ if (p.life<=0) continue;
                ctx.fillStyle = p.life>18 ? COL.red : COL.redDim;
                ctx.globalAlpha = Math.min(1, p.life/20);
                ctx.fillRect((this.x+p.x)|0, (this.y+p.y)|0, 2, 2); }
            ctx.globalAlpha = 1;
        } else if (this.type === 'build'){
            for (const p of this.parts){ if (p.life<=0) continue;
                ctx.fillStyle = (p.life%2) ? COL.white : COL.gray;
                ctx.fillRect((this.x+p.x)|0, (this.y+p.y)|0, 2, 2); }
        } else if (this.type === 'death'){
            for (const p of this.parts){ if (p.life<=0) continue;
                ctx.globalAlpha = Math.min(1,p.life/14); ctx.fillStyle = COL.gray;
                ctx.fillRect((this.x+p.x)|0, (this.y+p.y)|0, 2, 2); }
            ctx.globalAlpha = 1;
            drawSprite(SKULL, SKULL_PAL, this.x, this.y - this.progress*16, 2, false, null);
        } else if (this.type === 'trade'){
            for (const p of this.parts){ if (p.life<=0) continue;
                ctx.globalAlpha = Math.min(1,p.life/26);
                ctx.fillStyle = p.life>22 ? COL.green : COL.greenDim;
                const hx=(this.x+p.x)|0, hy=(this.y+p.y)|0; // tiny 3px heart
                ctx.fillRect(hx-1,hy,1,1); ctx.fillRect(hx+1,hy,1,1); ctx.fillRect(hx,hy+1,1,1); }
            ctx.globalAlpha = 1;
        } else if (this.type === 'coin'){
            for (const p of this.parts){ if (p.life<=0) continue;
                ctx.globalAlpha = Math.min(1,p.life/16); ctx.fillStyle = COL.amber;
                const cx=(this.x+p.x)|0, cy=(this.y+p.y)|0;
                ctx.fillRect(cx,cy-1,1,3); ctx.fillRect(cx-1,cy,3,1); }
            ctx.globalAlpha = 1;
        } else if (this.type === 'bribe'){
            ctx.globalAlpha = a; ctx.fillStyle = COL.amber; ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign='center';
            for (const p of this.parts) ctx.fillText('$', (this.x+p.x)|0, (this.y+p.y)|0);
            ctx.globalAlpha = 1;
        } else if (this.type === 'bust'){
            const r = 30 + this.progress*30;
            ctx.globalAlpha = a*0.7; ctx.strokeStyle = COL.blue; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI*2); ctx.stroke();
            if (this.progress < 0.3){ ctx.globalAlpha = (0.3-this.progress)*1.5; ctx.fillStyle = COL.blue;
                ctx.beginPath(); ctx.arc(this.x,this.y,30,0,Math.PI*2); ctx.fill(); }
            ctx.globalAlpha = 1; // 4 orbiting stars
            for (let s=0;s<4;s++){ const ang=this.progress*6 + s*Math.PI/2;
                ctx.fillStyle = COL.white; ctx.fillRect((this.x+Math.cos(ang)*22-1)|0,(this.y+Math.sin(ang)*22-1)|0,3,3); }
        } else if (this.type === 'zap'){
            const sx = this.opts.sx, sy = this.opts.sy;
            ctx.globalAlpha = a; ctx.strokeStyle = (this.life%2) ? COL.amber : COL.cyan; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(sx, sy);
            const segs = 6, dx=(this.x-sx)/segs, dy=(this.y-sy)/segs;
            for (let s=1;s<=segs;s++){ const off = (s%2?1:-1)*6;
                ctx.lineTo(sx+dx*s + (-dy/Math.hypot(dx,dy||1))*off, sy+dy*s + (dx/Math.hypot(dx,dy||1))*off); }
            ctx.lineTo(this.x, this.y); ctx.stroke(); ctx.globalAlpha = 1;
        } else if (this.type === 'raid'){
            const ang = this.progress*Math.PI*6;
            for (let s=0;s<2;s++){ const aa=ang+s*Math.PI;
                ctx.fillStyle = s? COL.blue : COL.red;
                ctx.fillRect((this.x+Math.cos(aa)*20-1)|0,(this.y+Math.sin(aa)*20-1)|0,3,3); }
            ctx.globalAlpha = a*0.5; ctx.fillStyle = (gameFrame%16<8)?COL.red:COL.blue;
            ctx.beginPath(); ctx.arc(this.x,this.y, (this.opts.radius||40)*0.4, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;
        } else if (this.type === 'exclusion'){
            ctx.globalAlpha = a; ctx.strokeStyle = COL.purple; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(this.x-7,this.y-7); ctx.lineTo(this.x+7,this.y+7);
            ctx.moveTo(this.x+7,this.y-7); ctx.lineTo(this.x-7,this.y+7); ctx.stroke(); ctx.globalAlpha = 1;
        }
    }
    get under(){ return this.type === 'blood'; } // blood draws beneath agents
}
const effectEngine = {
    effects: [],
    spawn(type, x, y, opts){
        if (this.effects.length >= MAX_EFFECTS) return;
        // grid throttle: at most one of each type per 24px cell per render frame
        const key = type + '_' + (x/24|0) + '_' + (y/24|0);
        if (fxFrameKeys.has(key)) return;
        fxFrameKeys.add(key);
        this.effects.push(new Effect(type, x, y, opts));
    },
    // lightning from nearest co-op node to (tx,ty)
    spawnZap(tx, ty){
        let src = null, md = Infinity;
        for (const n of nodes){ if (n && n.nodeType === 'cooperator'){ const d = distance(tx,ty,n.x,n.y); if (d<md){md=d; src=n;} } }
        const sx = src ? src.x : tx, sy = src ? src.y - 6 : ty - 30;
        this.spawn('zap', tx, ty, { sx, sy });
    },
    update(){
        for (let i = this.effects.length - 1; i >= 0; i--){
            this.effects[i].update();
            if (this.effects[i].life <= 0) this.effects.splice(i, 1);
        }
    },
    drawUnder(ctx){ for (const e of this.effects) if (e.under) e.draw(ctx); },
    drawOver(ctx){ for (const e of this.effects) if (!e.under) e.draw(ctx); },
};

/* ============================================================================
   AUDIO — smooth ambient SFX + original procedural "creator-mode" music
   (WebAudio: filtered, enveloped voices through a soft reverb; never harsh.)
   ============================================================================ */
let audioCtx = null;
let soundOn = true;
let masterGain = null, masterLP = null, reverbBus = null, sfxBus = null, musicBus = null;
let sfxLastAt = {};                       // per-type real-time cooldown
let soundBudget = 0, soundBudgetFrame = -1;
const NOTE = m => 440 * Math.pow(2, (m - 69) / 12);

function makeReverbIR(ctx, seconds, decay){
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++){
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, decay);
    }
    return buf;
}
function initAudio(){
    if (audioCtx){ if (audioCtx.state === 'suspended') audioCtx.resume(); return; }
    if (!window.AudioContext && !window.webkitAudioContext) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){ audioCtx = null; return; }
    const ctx = audioCtx;
    masterGain = ctx.createGain(); masterGain.gain.value = 0.8;
    masterLP = ctx.createBiquadFilter(); masterLP.type = 'lowpass'; masterLP.frequency.value = 6800; masterLP.Q.value = 0.2;
    masterGain.connect(masterLP); masterLP.connect(ctx.destination);
    const conv = ctx.createConvolver(); conv.buffer = makeReverbIR(ctx, 2.4, 2.8);
    reverbBus = ctx.createGain(); reverbBus.gain.value = 0.9; reverbBus.connect(conv); conv.connect(masterGain);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(masterGain);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.0; musicBus.connect(masterGain);
    const sfxSend = ctx.createGain(); sfxSend.gain.value = 0.16; sfxBus.connect(sfxSend); sfxSend.connect(reverbBus);
    const musSend = ctx.createGain(); musSend.gain.value = 0.14; musicBus.connect(musSend); musSend.connect(reverbBus);
    if (ctx.state === 'suspended') ctx.resume();
    if (soundOn) startMusic();
}
// one soft voice: osc -> lowpass -> gain(ADSR-ish) -> bus
function voice(o){
    if (!audioCtx) return;
    const ctx = audioCtx, t = o.t || ctx.currentTime, dur = o.dur || 0.3;
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + (o.gl || dur));
    if (o.detune) osc.detune.value = o.detune;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(o.cut || 2200, t);
    if (o.cut1) lp.frequency.exponentialRampToValueAtTime(o.cut1, t + dur);
    const g = ctx.createGain();
    const a = o.a != null ? o.a : 0.01, peak = o.g || 0.08;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp); lp.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + dur + 0.02);
}
function playPixelSound(type){
    if (!soundOn || !audioCtx) return;
    if (soundBudgetFrame !== gameFrame){ soundBudgetFrame = gameFrame; soundBudget = 0; }
    if (soundBudget >= 3) return;
    const now = audioCtx.currentTime;
    const cd = { theft:0.22, zap:0.18, arrest:0.12, death:0.16, build:0.05, bribe:0.12 }[type] || 0.12;
    if (sfxLastAt[type] && now - sfxLastAt[type] < cd) return;
    sfxLastAt[type] = now; soundBudget++;
    const det = Math.random()*16 - 8;     // gentle per-hit pitch variation
    switch(type){
        case 'theft':                     // soft muted low pluck
            voice({ type:'sine', f0:NOTE(50), f1:NOTE(43), dur:0.34, g:0.085, cut:700, a:0.008, detune:det }); break;
        case 'arrest':                    // pleasant rising bell (E5 -> B5)
            voice({ type:'triangle', f0:NOTE(76), dur:0.5, g:0.07, cut:2600, a:0.006, detune:det });
            voice({ type:'sine', t:now+0.09, f0:NOTE(83), dur:0.55, g:0.055, cut:3000, a:0.006 }); break;
        case 'zap':                       // soft bright shimmer
            voice({ type:'triangle', f0:NOTE(96), f1:NOTE(89), dur:0.16, g:0.05, cut:4200, a:0.003, detune:det }); break;
        case 'build':                     // warm marimba arpeggio C-E-G
            [60,64,67].forEach((m,i)=> voice({ type:'triangle', t:now+i*0.07, f0:NOTE(m), dur:0.4, g:0.055, cut:2400, a:0.004 })); break;
        case 'bribe':                     // soft coin ding-ding (G5 -> C6)
            voice({ type:'sine', f0:NOTE(79), dur:0.3, g:0.05, cut:3000, a:0.003 });
            voice({ type:'sine', t:now+0.08, f0:NOTE(84), dur:0.34, g:0.05, cut:3200, a:0.003 }); break;
        case 'death':                     // gentle low descending
            voice({ type:'sine', f0:NOTE(55), f1:NOTE(43), dur:0.45, g:0.07, cut:900, a:0.01, detune:det }); break;
        default:
            voice({ type:'sine', f0:NOTE(69), dur:0.2, g:0.05, cut:2000 });
    }
}
// very soft typewriter tick (slight random pitch so it patters pleasantly)
function playType(){
    if (!soundOn || !audioCtx) return;
    voice({ type:'triangle', f0:1150 + Math.random()*420, dur:0.035, g:0.017, cut:2600, a:0.001 });
}

/* ---- ORIGINAL background music: gentle looping bed (my own motif) ---- */
let musicTimer = null, musicStep = 0, musicNextTime = 0, musicOn = false;
const M_BPM = 96, M_STEP = (60 / M_BPM) / 4;                 // 16th-note grid
const M_BEAT = 60 / M_BPM;
const M_PROG = [                                            // I–V–vi–IV in C
    { root:48, triad:[60,64,67] },  // C
    { root:43, triad:[59,62,67] },  // G
    { root:45, triad:[57,60,64] },  // Am
    { root:41, triad:[57,60,65] },  // F
];
const M_ARP = [0,2,1,4, 2,1,2,0];                            // 8 eighth-notes, my motif
function mTriad(triad, idx){ const n = triad.length, oct = Math.floor(idx/n); return triad[((idx%n)+n)%n] + 12*oct; }
function startMusic(){
    if (!audioCtx || musicOn) return;
    musicOn = true; musicStep = 0; musicNextTime = audioCtx.currentTime + 0.12;
    musicBus.gain.cancelScheduledValues(audioCtx.currentTime);
    musicBus.gain.setValueAtTime(Math.max(0.0001, musicBus.gain.value), audioCtx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 1.6);
    musicTimer = setInterval(scheduleMusic, 25);
}
function stopMusic(){
    if (!audioCtx) return;
    musicOn = false;
    if (musicTimer){ clearInterval(musicTimer); musicTimer = null; }
    musicBus.gain.cancelScheduledValues(audioCtx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, audioCtx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.4);
}
function scheduleMusic(){
    if (!audioCtx || !musicOn) return;
    while (musicNextTime < audioCtx.currentTime + 0.12){
        playMusicStep(musicStep, musicNextTime);
        musicNextTime += M_STEP;
        musicStep = (musicStep + 1) % 64;                   // 4 bars × 16 steps
    }
}
function playMusicStep(step, t){
    const chord = M_PROG[Math.floor(step/16)], s = step % 16;
    if (s === 0 || s === 8)                                 // soft bass on beats 1 & 3
        voice({ type:'sine', t, f0:NOTE(chord.root), dur:0.55, g:0.10, cut:520, a:0.012, bus:musicBus });
    if (s === 0)                                            // pad chord, slow attack
        chord.triad.forEach((m,i)=> voice({ type:'triangle', t, f0:NOTE(m), dur:M_BEAT*3.4, g:0.026, cut:1500, a:0.2, detune:(i-1)*6, bus:musicBus }));
    if (s % 2 === 0){                                       // sparkly arpeggio (8ths, octave up)
        const ai = M_ARP[s/2];
        if (ai >= 0) voice({ type:'triangle', t, f0:NOTE(mTriad(chord.triad, ai) + 12), dur:0.26, g:0.04, cut:2700, a:0.004, bus:musicBus });
    }
    if (s === 0 || s === 8){                                // soft kick
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type='sine'; o.frequency.setValueAtTime(115,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12);
        g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.09,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);
        o.connect(g); g.connect(musicBus); o.start(t); o.stop(t+0.18);
    }
    if (s === 4 || s === 12){                               // soft hat (filtered noise)
        const dur=0.05, n=Math.floor(audioCtx.sampleRate*dur), buf=audioCtx.createBuffer(1,n,audioCtx.sampleRate), d=buf.getChannelData(0);
        for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
        const src=audioCtx.createBufferSource(); src.buffer=buf;
        const hp=audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7500;
        const g=audioCtx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.018,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
        src.connect(hp); hp.connect(g); g.connect(musicBus); src.start(t); src.stop(t+dur);
    }
}

/* ============================================================================
   LIVE PIXEL HUD (left faction rows, counts, bottom status bar)
   ============================================================================ */
const _hudEls = {};
function hudEl(id){ if (!(id in _hudEls)) _hudEls[id] = document.getElementById(id); return _hudEls[id]; }
const _hudPrev = {};
function setTick(id, val){
    const el = hudEl(id); if (!el) return;
    if (_hudPrev[id] !== val){ el.classList.add('tick'); el._tickAt = gameFrame; _hudPrev[id] = val; }
    else if (el._tickAt !== undefined && gameFrame - el._tickAt > 6){ el.classList.remove('tick'); el._tickAt = undefined; }
    el.textContent = val;
}
function updatePixelHUD(){
    const cnt = { cooperator:0, competitor:0, defector:0, predator:0, enforcer:0 };
    const mass = { cooperator:0, competitor:0, defector:0, predator:0 };
    for (const a of agents){ if (!a || !(a.type in cnt)) continue; cnt[a.type]++; if (a.type in mass) mass[a.type]+=a.mass; }
    setTick('count-cooperator', cnt.cooperator);
    setTick('count-competitor', cnt.competitor);
    setTick('count-defector', cnt.defector);
    setTick('count-predator', cnt.predator);
    setTick('count-enforcer', cnt.enforcer);
    const maxM = Math.max(1, mass.cooperator, mass.competitor, mass.defector, mass.predator);
    const setW = (id,v) => { const el = hudEl(id); if (el) el.style.width = Math.round((v/maxM)*100) + '%'; };
    setW('facbar-coop', mass.cooperator); setW('facbar-comp', mass.competitor);
    setW('facbar-def', mass.defector); setW('facbar-pred', mass.predator);
    const enfEl = hudEl('facbar-enf'); if (enfEl) enfEl.style.width = Math.min(100, cnt.enforcer*12) + '%';
}

/* ============================================================================
   MAIN DRAW PIPELINE
   ============================================================================ */
function draw() {
    effectEngine.update();                 // advance FX once per render (speed-independent)
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGroundTexture();                    // 1. grass + roads + props (cached)
    drawNodeTerritories();                  // 2. territory circles
    drawNodesPix();                         // 3. node sprites (+ cull dead nodes)
    drawResourcesPix();                     // 4. bobbing food
    effectEngine.drawUnder(ctx);            // 5. underlayer FX (blood stains)
    drawAgents();                           // 6. agent sprites
    drawJailCorner();                       // 7. jail overlay
    effectEngine.drawOver(ctx);             // 8. overlayer FX (bust/zap/raid/etc)
    floatingTexts.forEach(t => { if (t) t.draw(); }); // 9. floating text
    drawCanvasHUD();                        // 10. mini status bar

    updatePixelHUD();                       // DOM HUD (counts, bars, bottom bar)
} // End draw


// NEW: Function to process crime events for AI
function processCrimeEvents() {
    if (recentCrimes.length === 0) return;

    const coOpNodes = nodes.filter(n => n && n.nodeType === 'cooperator');
    let crimeWitnessed = false;

    // Check recent crimes (last 60 frames)
    for (let i = recentCrimes.length - 1; i >= 0; i--) {
        const crime = recentCrimes[i];
        if (gameFrame - crime.time > 60) {
            recentCrimes.splice(i, 1); // Remove old crime
            continue;
        }

        // Find nearby commonfolk who are not already fleeing
        for (const agent of agents) {
            if (agent && (agent.type === 'cooperator' || agent.type === 'defector' || agent.type === 'competitor') && !agent.fleeingCrime) {
                if (distance(agent.x, agent.y, crime.x, crime.y) < CRIME_FLEE_RADIUS) {
                    // Witnessed a crime!
                    agent.fleeingCrime = true;
                    crimeWitnessed = true;
                    
                    // Find nearest co-op node to flee to
                    let nearestNode = null;
                    let minDist = Infinity;
                    for (const node of coOpNodes) {
                        const dist = distance(agent.x, agent.y, node.x, node.y);
                        if (dist < minDist) {
                            minDist = dist;
                            nearestNode = node;
                        }
                    }
                    agent.fleeTargetNode = nearestNode; // Can be null if no nodes exist
                }
            }
        }
    }
    // Clear all crimes if any were witnessed this frame to prevent re-triggering
    if (crimeWitnessed) {
        recentCrimes = [];
    }
}

// NEW: Function to update floating texts
function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const text = floatingTexts[i];
        if (!text) {
             floatingTexts.splice(i, 1);
             continue;
        }
        text.update();
        if (text.duration <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}


// Modified gameLoop: Moved governance/investment updates outside speed loop for stability
function gameLoop() {
    if (!isRunning) return; // Stop if not running

    // --- High-Speed Simulation Loop ---
    // Run core updates multiple times based on speed multiplier
    const speed = Math.max(1, currentSpeedMultiplier); // Ensure speed is at least 1
    fxFrameKeys.clear(); // v0.4: reset per-render FX throttle before this frame's physics ticks
    for (let i = 0; i < speed; i++) {
        gameFrame++; // Increment frame counter
        spawnResources(); // Chance to spawn normal resources
        updateJail(); // Check for agent releases
        updatePopulationDynamics(); // Chance to reseed population
        // Update nodes BEFORE agents use them
        nodes.forEach(n => { if (n) n.update(); });
        updateAgents(); // Update agent AI, movement, interactions, consumption
        processCrimeEvents(); // NEW: Check for crime witnesses
        // updateFloatingTexts(); // <-- MOVED
    }

    // --- Updates Run Once Per Frame (Outside Speed Loop) ---
    updateFloatingTexts(); // NEW: Update text animations (MOVED HERE)
    updateGovernance(); // Pay salaries, collect taxes, spawn/fire enforcers
    updateCoopInvestment(); // Check if co-op node can be built
    updatePredatorInvestment(); // Check if predator node can be built
    updateStats(); // Update UI display ONCE per rendered frame

    draw(); // Render the current state to the canvas
    animationFrameId = requestAnimationFrame(gameLoop); // Request next frame
} // End gameLoop

// startGame remains the same as original v02 (with null check)
function startGame() {
    if (isRunning) return;
    isRunning = true;
    if(startBtn) {
        startBtn.textContent = 'Running...';
        startBtn.disabled = true;
    }
    if(resetBtn) resetBtn.disabled = false;
    configInputs.forEach(input => input.disabled = true); // Disable sliders
    gameLoop(); // Start the loop
} // End startGame

// stopGame remains the same as original v02 (with null checks)
function stopGame() {
    isRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Stop the loop
    }
     if(startBtn) {
        startBtn.textContent = 'Start';
        startBtn.disabled = false;
    }
     if(resetBtn) resetBtn.disabled = false;
    configInputs.forEach(input => input.disabled = false); // Enable sliders
} // End stopGame

// resetGame remains the same as original v02 (with null checks)
function resetGame() {
    stopGame(); // Stop current simulation
    updateConfigFromUI(); // Read current slider values
    initializeSimulation(); // Reset all data
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    draw(); // Draw initial state
     if(startBtn) {
        startBtn.textContent = 'Start';
        startBtn.disabled = false;
    }
} // End resetGame

// setupSliderSync remains the same as original v02 (with null checks)
function setupSliderSync(sliderEl, numberEl, isFloat = false) {
    // Safety check for elements
    if (!sliderEl || !numberEl) {
        // console.warn("Slider or number input element not found for sync setup:", sliderEl, numberEl);
        return;
    }
    // Sync slider to number input
    sliderEl.addEventListener('input', () => {
        numberEl.value = sliderEl.value;
    });
    // Sync number input to slider (with validation)
    numberEl.addEventListener('input', () => {
        let val = isFloat ? parseFloat(numberEl.value) : parseInt(numberEl.value);
        const min = parseFloat(sliderEl.min);
        const max = parseFloat(sliderEl.max);
        // Validate and clamp value
        if (isNaN(val) || val < min) val = min;
        if (val > max) val = max;
        // Update both elements
        sliderEl.value = val;
        numberEl.value = val; // Update number input to clamped value
    });
} // End setupSliderSync

// --- Setup Slider Syncs (Using ONLY sliders present in original index.htm) ---
// Population
setupSliderSync(sliderCooperators, numCooperators);
setupSliderSync(sliderCompetitors, numCompetitors);
setupSliderSync(sliderDefectors, numDefectors);
setupSliderSync(sliderPredators, numPredators);
// Governance
setupSliderSync(sliderSalary, numSalary, true); // Salary is float
setupSliderSync(sliderVision, numVision);
// Justice
setupSliderSync(sliderJail, numJail);
setupSliderSync(sliderBribe, numBribe);
// Reciprocity & Cooperation
setupSliderSync(sliderCoopRange, numCoopRange);
setupSliderSync(sliderExclusion, numExclusion);
// Predation
setupSliderSync(sliderTheftRate, numTheftRate); // isPercent logic removed
setupSliderSync(sliderPredatorVision, numPredatorVision);
// Collective Investment (Co-op)
setupSliderSync(sliderNodeContrib, numNodeContrib); // isPercent logic removed
setupSliderSync(sliderNodePunish, numNodePunish); // isPercent logic removed
// Economy
setupSliderSync(sliderResourceGain, numResourceGain);
setupSliderSync(sliderDecay, numDecay, true); // Decay is float


// --- Event Listeners ---
// Control Buttons (with null checks)
if (startBtn) startBtn.addEventListener('click', startGame);
if (resetBtn) resetBtn.addEventListener('click', resetGame);
// Speed Controls (with null check)
if (speedControlsDiv) {
    speedControlsDiv.addEventListener('click', (event) => {
        // Check if the clicked element is a button with data-speed
        if (event.target.tagName === 'BUTTON' && event.target.dataset.speed) {
            const speed = parseInt(event.target.dataset.speed);
            if (!isNaN(speed)) {
                setSpeed(speed);
            }
        }
    });
}
// Window Resize (Optional - currently handled by CSS)
window.addEventListener('resize', () => {
    // Potential future use: Adjust canvas drawing resolution or trigger redraw
    // draw(); // Example: Redraw on resize
});

// --- Initial Setup On Load ---
updateConfigFromUI(); // Read initial slider values into GLOBAL_CONFIG
initializeSimulation(); // Set up initial simulation state based on config
draw(); // Draw the initial state
setSpeed(1); // Set initial speed display

/* ============================================================================
   v0.4 UI WIRING — console tabs, mute, faction icons, boot sequence
   ============================================================================ */

// Command-console tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tabpage').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const pg = document.querySelector('.tabpage[data-page="' + tab.dataset.tab + '"]');
        if (pg) pg.classList.add('active');
    });
});

// Mute toggle
const muteBtn = document.getElementById('mute-btn');
if (muteBtn) muteBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    muteBtn.textContent = 'SOUND: ' + (soundOn ? 'ON' : 'OFF');
    muteBtn.classList.toggle('off', !soundOn);
    if (soundOn){ initAudio(); startMusic(); }
    else stopMusic();
});

// Draw faction mini-icons into the intel panel + legend canvases
document.querySelectorAll('canvas.ico').forEach(ic => {
    const def = SPR[ic.dataset.type]; if (!def) return;
    const c = ic.getContext('2d'); c.imageSmoothingEnabled = false;
    const grid = def.frames[0], sc = 3, w = grid[0].length, h = grid.length;
    const ox = Math.round((ic.width - w*sc)/2), oy = Math.round((ic.height - h*sc)/2);
    for (let r = 0; r < h; r++) for (let col = 0; col < w; col++){
        const idx = grid[r][col]; if (!idx) continue;
        c.fillStyle = def.pal[idx] || '#f0f';
        c.fillRect(ox + col*sc, oy + r*sc, sc, sc);
    }
});

// Hover label: show the agent type under the cursor
let hoverLabel = null;
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    let best = null, bd = 18;
    for (const a of agents){ if (!a) continue; const d = distance(mx, my, a.x, a.y); if (d < bd){ bd = d; best = a; } }
    hoverLabel = best ? { x: best.x, y: best.y, t: best.type.toUpperCase() } : null;
});
const _origDraw = draw;
draw = function(){
    _origDraw();
    if (hoverLabel){
        ctx.font = "6px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
        ctx.fillStyle = '#000'; ctx.fillRect(hoverLabel.x - 28, hoverLabel.y - 26, 56, 9);
        ctx.fillStyle = COL.green; ctx.fillText(hoverLabel.t, hoverLabel.x, hoverLabel.y - 19);
    }
};

/* ============================================================================
   SPLASH SCREEN — full-bleed key-art (assets/socsim-splash.png) with the
   SOCSIM_SPLASH overlay (splash-render.js) drawing animated FX on top.
   Breathing zoom is pure CSS on #splash-group; this only drives FX + dismiss.
   ============================================================================ */
let splashRAF = null;
function runSplash(){
    const scr   = document.getElementById('boot-screen');
    const group = document.getElementById('splash-group');
    const art   = document.getElementById('splash-art');
    const cvs   = document.getElementById('splash-canvas');
    if (!scr || !cvs){ return; }
    const sizeEl = group || cvs;
    let dismissed = false;

    function dismiss(){
        if (dismissed) return; dismissed = true;
        if (splashRAF) cancelAnimationFrame(splashRAF);
        initAudio();
        scr.classList.add('off');
        setTimeout(() => { scr.style.display = 'none'; }, 480);
        window.removeEventListener('keydown', dismiss);
        window.removeEventListener('mousedown', dismiss);
        window.removeEventListener('resize', fit);
        setSpeed(1); startGame();   // autoplay from the splash, at 1x
    }
    function fit(){
        const w = Math.max(2, Math.round(sizeEl.clientWidth));
        const h = Math.max(2, Math.round(sizeEl.clientHeight));
        if (cvs.width !== w || cvs.height !== h){ cvs.width = w; cvs.height = h; }
    }

    window.addEventListener('keydown', dismiss);
    window.addEventListener('mousedown', dismiss);
    window.addEventListener('resize', fit);

    const c = cvs.getContext('2d');
    if (art){
        if (art.complete && art.naturalWidth) fit(); else art.addEventListener('load', fit, { once:true });
        if (art.decode) art.decode().then(fit).catch(() => {});
    }
    fit();

    let t = 0;
    (function loop(){
        if (dismissed) return;
        if (window.SOCSIM_SPLASH && SOCSIM_SPLASH.setLayout)
            SOCSIM_SPLASH.setLayout(window.matchMedia('(max-width:1080px)').matches ? 'portrait' : 'landscape');
        fit();
        if (window.SOCSIM_SPLASH) SOCSIM_SPLASH.drawOverlay(c, t++);
        splashRAF = requestAnimationFrame(loop);
    })();
}
runSplash();

/* ============================================================================
   SOCIOLOGY FILES — rotating scholar cards w/ pixel-art professor headshots
   ============================================================================ */
const PROF_SKIN = ['#f0c8a0','#e8b890','#d8a070','#c89060'];
function drawProfessor(c, f){
    c.clearRect(0,0,44,44); c.imageSmoothingEnabled=false;
    const P=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
    const skin=f.skin, hair=f.hair||'#3a3a3a';
    // shoulders / jacket
    P(8,38,28,6,f.jacket); P(6,40,32,4,f.jacket);
    P(18,38,8,6,'#e0e0e0');                 // shirt
    if (f.bowtie){ P(20,39,4,3,f.accent); P(19,40,1,1,f.accent); P(24,40,1,1,f.accent); }
    else { P(19,38,2,4,'#cfcfcf'); P(23,38,2,4,'#cfcfcf'); } // collar
    // neck + head
    P(19,33,6,5,skin);
    P(13,14,18,21,skin);                    // face
    P(12,18,1,12,skin); P(31,18,1,12,skin); // cheeks
    P(12,22,1,3,skin); P(31,22,1,3,skin);   // ears
    // hair styles
    if (f.style==='bald'){ P(15,12,14,3,skin); P(14,14,2,3,'#caa'); }
    else if (f.style==='tonsure'){ P(12,20,2,8,hair); P(30,20,2,8,hair); P(13,13,18,2,hair); }
    else if (f.style==='combover'){ P(13,11,18,5,hair); P(13,11,12,7,hair); }
    else if (f.style==='slick'){ P(13,11,18,5,hair); P(13,11,18,2,'#000'); }
    else if (f.style==='wild'){ P(11,8,22,7,hair); P(8,12,4,8,hair); P(32,12,4,8,hair);
        P(10,6,3,4,hair); P(31,6,3,4,hair); P(16,5,4,4,hair); P(24,6,4,4,hair); }
    else { P(13,11,18,6,hair); } // default
    // eyebrows
    if (f.brows){ P(15,21,5,2,hair); P(24,21,5,2,hair); }
    // eyes
    P(16,24,3,3,'#fff'); P(25,24,3,3,'#fff'); P(17,25,1,1,'#000'); P(26,25,1,1,'#000');
    // eyewear
    if (f.eyes==='round'){ c.strokeStyle='#222'; c.lineWidth=1;
        c.strokeRect(15.5,23.5,4,4); c.strokeRect(24.5,23.5,4,4); P(20,25,4,1,'#222'); }
    else if (f.eyes==='shades'){ P(15,23,5,4,'#0a0a0a'); P(24,23,5,4,'#0a0a0a'); P(20,24,4,1,'#0a0a0a');
        P(16,24,1,1,'#3aa'); }
    else if (f.eyes==='monocle'){ c.strokeStyle='#ffd23a'; c.lineWidth=1; c.strokeRect(24.5,23.5,5,5);
        P(29,28,1,6,'#ffd23a'); }
    else if (f.eyes==='eyepatch'){ P(15,22,6,6,'#0a0a0a'); P(13,20,18,1,'#0a0a0a'); }
    // nose
    P(22,28,2,3,'#caa080');
    // facial hair
    if (f.beard==='full'){ P(13,30,18,7,hair); P(12,28,2,6,hair); P(30,28,2,6,hair); P(15,33,14,4,hair); P(20,31,4,3,skin); }
    else if (f.beard==='mustache'){ P(16,30,12,3,hair); P(15,31,2,2,hair); P(27,31,2,2,hair); }
    else if (f.beard==='goatee'){ P(18,30,8,2,hair); P(20,32,4,5,hair); }
    else if (f.beard==='stubble'){ for(let i=0;i<18;i++){ const gx=13+(i*7%18), gy=31+((i*5)%5); P(gx,gy,1,1,hair);} }
}
const CARDS = [
 { title:'GOVERNANCE & PUBLIC GOODS', prof:'PROF. BUCHANAN',
   quote:'Someone has to pay the cops. Tax the rich, fund the badge — congratulations, you just invented the state.',
   cite:'Public goods · Buchanan & Tullock, 1962',
   feat:{skin:PROF_SKIN[0], style:'bald', beard:'full', eyes:'round', jacket:'#2d4a7a', accent:'#00ff41', bowtie:true} },
 { title:'COLLECTIVE ACTION', prof:'PROF. OLSON',
   quote:'Why build the guild hall if you can freeload off it? Make it a club: pay in, or get bounced.',
   cite:'Collective action · Olson, 1965',
   feat:{skin:PROF_SKIN[1], style:'combover', beard:'none', eyes:'round', jacket:'#0e7490', accent:'#00ffff', bowtie:true} },
 { title:'RECIPROCITY & TRUST', prof:'PROF. AXELROD',
   quote:'Be kind — but keep receipts. Betray the clan three times and you are dead to them. Forever.',
   cite:'Reciprocity · Axelrod, 1984',
   feat:{skin:PROF_SKIN[2], style:'combover', beard:'mustache', eyes:'none', jacket:'#2a6e3a', accent:'#00ff41'} },
 { title:'CRIME & DETERRENCE', prof:'PROF. BECKER',
   quote:'Crooks run the numbers too: loot versus the odds of jail. Want less crime? Make the math worse.',
   cite:'Economics of crime · Becker, 1968',
   feat:{skin:PROF_SKIN[0], style:'slick', beard:'none', eyes:'monocle', jacket:'#7a5a2a', accent:'#ffb627', bowtie:true} },
 { title:'CORRUPTION (PRINCIPAL-AGENT)', prof:'PROF. JENSEN',
   quote:'Who polices the police? A bribe clears — right up until another badge happens to be watching.',
   cite:'Principal-agent · Jensen & Meckling, 1976',
   feat:{skin:PROF_SKIN[1], style:'slick', beard:'goatee', eyes:'shades', jacket:'#3a3a4a', accent:'#9b59ff'} },
 { title:'INEQUALITY & POWER LAWS', prof:'PROF. PARETO',
   quote:'Eighty percent of the mass piles onto twenty percent of the bodies. The map was never going to be fair.',
   cite:'Inequality · Pareto, 1896',
   feat:{skin:PROF_SKIN[2], style:'combover', beard:'full', eyes:'round', brows:true, jacket:'#5a2a7a', accent:'#9b59ff'} },
 { title:'BIOECONOMICS & METABOLISM', prof:'PROF. KLEIBER',
   quote:'Big bodies burn big. Stop eating and even your fattest tycoon withers away to nothing.',
   cite:'Metabolic scaling · Kleiber’s Law',
   feat:{skin:PROF_SKIN[0], style:'wild', beard:'mustache', eyes:'none', brows:true, jacket:'#8b0000', accent:'#ff2d2d'} },
 { title:'ILLICIT SANCTUARIES', prof:'PROF. GAMBETTA',
   quote:'Outlaws need real estate too. The hideout is a startup — booming, until the raid van pulls up.',
   cite:'Illicit order · Gambetta, 1993',
   feat:{skin:PROF_SKIN[3], style:'combover', beard:'stubble', eyes:'eyepatch', jacket:'#6a1414', accent:'#ff2d2d'} },
];
function setupCards(){
    const portrait = document.getElementById('card-portrait');
    const titleEl = document.getElementById('card-title');
    const quoteEl = document.getElementById('card-quote');
    const citeEl  = document.getElementById('card-cite');
    const profEl  = document.getElementById('card-prof');
    const dotsEl  = document.getElementById('card-dots');
    if (!portrait || !dotsEl) return;
    const pctx = portrait.getContext('2d');
    // quote = typed (visible) + cursor + rest (invisible, but reserves the full
    // layout from the start so nothing reflows while it types)
    quoteEl.innerHTML = '<span id="card-quote-text"></span><span id="card-cursor">_</span><span id="card-quote-rest"></span>';
    const quoteText = document.getElementById('card-quote-text');
    const cursor = document.getElementById('card-cursor');
    const quoteRest = document.getElementById('card-quote-rest');

    let idx = -1, dwellTimer = null, typeTimer = null;
    const DWELL = 7500, TYPE_MS = 26;

    dotsEl.innerHTML = '';
    CARDS.forEach((_, i) => { const d = document.createElement('i');
        d.addEventListener('click', () => show(i)); dotsEl.appendChild(d); });

    // Reserve the TALLEST card's text height so the panel never resizes between
    // cards (no magic numbers — measured from the real data, re-run on resize so
    // it adapts to width/font). card height = max(portrait, tallest text) = stable.
    const textEl = quoteEl.parentElement;            // .card-text
    function reserveTallest(){
        const sTitle = titleEl.textContent, sCite = citeEl.textContent,
              sText = quoteText.textContent, sRest = quoteRest.textContent,
              sCur = cursor.style.display;
        cursor.style.display = 'none';
        textEl.style.minHeight = '0px';
        let max = 0;
        CARDS.forEach(c => {
            titleEl.textContent = c.title;
            quoteText.textContent = '';
            quoteRest.textContent = '“' + c.quote + '”';
            citeEl.textContent = '— ' + c.cite;
            if (textEl.offsetHeight > max) max = textEl.offsetHeight;
        });
        textEl.style.minHeight = max + 'px';
        titleEl.textContent = sTitle; citeEl.textContent = sCite;
        quoteText.textContent = sText; quoteRest.textContent = sRest;
        cursor.style.display = sCur;
    }
    reserveTallest();
    // re-measure once the pixel webfont loads — first paint uses fallback metrics
    // and would reserve a too-short height (the mobile per-card jump).
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveTallest);
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(reserveTallest, 150); });

    function show(i){
        clearTimeout(dwellTimer); clearTimeout(typeTimer);
        idx = i;
        const card = CARDS[i];
        drawProfessor(pctx, card.feat);
        titleEl.textContent = card.title; titleEl.style.color = card.feat.accent;
        profEl.textContent = card.prof; profEl.style.color = card.feat.accent;
        citeEl.textContent = '— ' + card.cite;         // present from the start (no late reflow)
        [...dotsEl.children].forEach((d,k) => d.classList.toggle('on', k===i));

        // --- typewriter the quote (full text is always laid out via the rest span) ---
        const full = '“' + card.quote + '”';
        let pos = 0;
        quoteText.textContent = '';
        quoteRest.textContent = full;                  // reserves the full quote's space immediately
        cursor.style.display = 'inline';
        cursor.classList.add('blink');
        function step(){
            quoteText.textContent = full.slice(0, pos);
            quoteRest.textContent = full.slice(pos);
            if (pos < full.length){
                if (full[pos] !== ' ') playType();   // subtle typewriter tick per character
                pos++; typeTimer = setTimeout(step, TYPE_MS);
            }
            else {
                cursor.classList.remove('blink'); cursor.style.display = 'none';
                quoteRest.textContent = '';
                // dwell 7.5s AFTER typing completes, then advance
                dwellTimer = setTimeout(() => show((idx + 1) % CARDS.length), DWELL);
            }
        }
        step();
    }
    show(0);
}
setupCards();

/* author contact card — gamey pixel-spark burst on hover */
function setupAuthorCard(){
    const card = document.getElementById('author-card');
    const cvs = card && card.querySelector('.ac-sparks');
    if (!card || !cvs) return;
    const ctx = cvs.getContext('2d');
    const PAD = 18; // matches .ac-sparks inset:-18px
    const COLORS = ['#00ff41','#00ffff','#ffb627','#ff2d2d','#9b59ff','#ffffff'];
    let parts = [], raf = null, hovering = false;
    function fit(){
        const r = card.getBoundingClientRect();
        const w = Math.max(2, Math.round(r.width)  + PAD*2);
        const h = Math.max(2, Math.round(r.height) + PAD*2);
        if (cvs.width !== w || cvs.height !== h){ cvs.width = w; cvs.height = h; }
    }
    function spawn(n){
        const W = cvs.width, H = cvs.height, ix0 = PAD, iy0 = PAD, ix1 = W - PAD, iy1 = H - PAD;
        for (let i = 0; i < n; i++){
            // emit from a point on the card's border
            let x, y, nx, ny;
            if (Math.random() < (ix1-ix0)/((ix1-ix0)+(iy1-iy0))){
                x = ix0 + Math.random()*(ix1-ix0); y = Math.random()<0.5 ? iy0 : iy1; ny = y===iy0 ? -1 : 1; nx = (Math.random()-0.5);
            } else {
                y = iy0 + Math.random()*(iy1-iy0); x = Math.random()<0.5 ? ix0 : ix1; nx = x===ix0 ? -1 : 1; ny = (Math.random()-0.5);
            }
            const sp = 0.8 + Math.random()*2.4;
            parts.push({ x, y, vx:nx*sp + (Math.random()-0.5), vy:ny*sp - 0.6 + (Math.random()-0.5),
                         life:14 + (Math.random()*22|0), col:COLORS[(Math.random()*COLORS.length)|0], s:1 + (Math.random()*2|0) });
        }
    }
    function loop(){
        const W = cvs.width, H = cvs.height;
        ctx.clearRect(0, 0, W, H);
        if (hovering && Math.random() < 0.85) spawn(2);
        for (let i = parts.length - 1; i >= 0; i--){
            const p = parts[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.life--;
            if (p.life <= 0){ parts.splice(i, 1); continue; }
            ctx.globalAlpha = Math.min(1, p.life/12);
            ctx.fillStyle = p.col;
            ctx.fillRect(p.x|0, p.y|0, p.s, p.s);
        }
        ctx.globalAlpha = 1;
        if (hovering || parts.length){ raf = requestAnimationFrame(loop); }
        else { raf = null; ctx.clearRect(0,0,W,H); }
    }
    window.addEventListener('resize', fit);
    card.addEventListener('mouseenter', () => { hovering = true; fit(); spawn(16); playPixelSound('zap'); if (!raf) loop(); });
    card.addEventListener('mouseleave', () => { hovering = false; });
}
setupAuthorCard();

})(); // NEW: End of IIFE wrapper
