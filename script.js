// Get DOM elements
const coin = document.querySelector('.coin');
const flipCount = document.getElementById('flipCount');
const fastMode = document.getElementById('fastMode');
const stopButton = document.getElementById('stopButton');
const totalFlipsElement = document.getElementById('totalFlips');
const headsCountElement = document.getElementById('headsCount');
const tailsCountElement = document.getElementById('tailsCount');
const probabilityElement = document.getElementById('probability');
const lineCanvas = document.getElementById('lineGraph');
const barCanvas = document.getElementById('barGraph');

// Get canvas contexts
const lineCtx = lineCanvas.getContext('2d');
const barCtx = barCanvas.getContext('2d');

// Initialize variables
let isFlipping = false;
let shouldStop = false;
let totalFlips = 0;
let headsCount = 0;
let tailsCount = 0;
let headsProbs = [];
let tailsProbs = [];
let remainingFlips = 0;

// Initialize canvas sizes
function initializeCanvases() {
    const dpr = window.devicePixelRatio || 1;
    const updateCanvas = (canvas) => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    };

    updateCanvas(lineCanvas);
    updateCanvas(barCanvas);
}

// Format large numbers for x-axis
function formatNumber(num) {
    if (num >= 1000) {
        return (num/1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// Draw line graph
function drawLineGraph() {
    const width = lineCanvas.width / (window.devicePixelRatio || 1);
    const height = lineCanvas.height / (window.devicePixelRatio || 1);
    const padding = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };

    // Clear canvas
    lineCtx.fillStyle = '#2d2d2d';
    lineCtx.fillRect(0, 0, width, height);

    // Draw grid
    lineCtx.strokeStyle = '#404040';
    lineCtx.lineWidth = 0.5;
    
    // Grid lines
    for (let i = 0; i <= 10; i++) {
        const x = padding.left + (width - padding.left - padding.right) * (i / 10);
        const y = padding.top + (height - padding.top - padding.bottom) * (i / 10);
        
        lineCtx.beginPath();
        lineCtx.moveTo(x, padding.top);
        lineCtx.lineTo(x, height - padding.bottom);
        lineCtx.stroke();
        
        lineCtx.beginPath();
        lineCtx.moveTo(padding.left, y);
        lineCtx.lineTo(width - padding.right, y);
        lineCtx.stroke();
    }

    // Draw axes
    lineCtx.strokeStyle = '#ffffff';
    lineCtx.lineWidth = 2;
    lineCtx.beginPath();
    lineCtx.moveTo(padding.left, padding.top);
    lineCtx.lineTo(padding.left, height - padding.bottom);
    lineCtx.lineTo(width - padding.right, height - padding.bottom);
    lineCtx.stroke();

    // Draw 0.5 line
    lineCtx.strokeStyle = '#808080';
    lineCtx.setLineDash([5, 5]);
    lineCtx.beginPath();
    const y05 = padding.top + (height - padding.top - padding.bottom) * 0.5;
    lineCtx.moveTo(padding.left, y05);
    lineCtx.lineTo(width - padding.right, y05);
    lineCtx.stroke();
    lineCtx.setLineDash([]);

    // Draw probability line
    if (headsProbs.length > 1) {
        lineCtx.strokeStyle = '#4CAF50';
        lineCtx.lineWidth = 2;
        lineCtx.beginPath();
        
        for (let i = 0; i < headsProbs.length; i++) {
            const x = padding.left + (width - padding.left - padding.right) * (i / (headsProbs.length - 1));
            const y = height - padding.bottom - (height - padding.top - padding.bottom) * headsProbs[i];
            
            if (i === 0) {
                lineCtx.moveTo(x, y);
            } else {
                lineCtx.lineTo(x, y);
            }
        }
        lineCtx.stroke();
    }

    // Draw labels
    lineCtx.fillStyle = '#ffffff';
    lineCtx.font = '10px Arial';
    
    // Y-axis values
    lineCtx.textAlign = 'right';
    lineCtx.textBaseline = 'middle';
    for (let i = 0; i <= 10; i++) {
        const y = padding.top + (height - padding.top - padding.bottom) * (i / 10);
        lineCtx.fillText((1 - i/10).toFixed(1), padding.left - 5, y);
    }
    
    // X-axis values based on actual total flips
    lineCtx.textAlign = 'center';
    lineCtx.textBaseline = 'top';
    for (let i = 0; i <= 10; i++) {
        const x = padding.left + (width - padding.left - padding.right) * (i / 10);
        const value = Math.round(i * (totalFlips / 10));
        lineCtx.fillText(value, x, height - padding.bottom + 5);
    }
}

// Draw bar graph
function drawBarGraph() {
    const width = barCanvas.width / (window.devicePixelRatio || 1);
    const height = barCanvas.height / (window.devicePixelRatio || 1);
    const padding = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };

    // Clear canvas
    barCtx.fillStyle = '#2d2d2d';
    barCtx.fillRect(0, 0, width, height);

    if (totalFlips > 0) {
        const headsProb = headsCount / totalFlips;
        const tailsProb = tailsCount / totalFlips;
        
        // Draw grid
        barCtx.strokeStyle = '#404040';
        barCtx.lineWidth = 0.5;
        
        for (let i = 0; i <= 10; i++) {
            const y = padding.top + (height - padding.top - padding.bottom) * (i / 10);
            barCtx.beginPath();
            barCtx.moveTo(padding.left, y);
            barCtx.lineTo(width - padding.right, y);
            barCtx.stroke();
        }

        // Draw axes
        barCtx.strokeStyle = '#ffffff';
        barCtx.lineWidth = 2;
        barCtx.beginPath();
        barCtx.moveTo(padding.left, padding.top);
        barCtx.lineTo(padding.left, height - padding.bottom);
        barCtx.lineTo(width - padding.right, height - padding.bottom);
        barCtx.stroke();

        // Calculate bar dimensions
        const graphWidth = width - padding.left - padding.right;
        const barWidth = graphWidth * 0.25;
        const spacing = graphWidth * 0.1;
        const centerX = width / 2;

        // Draw heads bar
        const headsHeight = (height - padding.top - padding.bottom) * headsProb;
        barCtx.fillStyle = '#4CAF50';
        barCtx.fillRect(
            centerX - spacing - barWidth,
            height - padding.bottom - headsHeight,
            barWidth,
            headsHeight
        );

        // Draw tails bar
        const tailsHeight = (height - padding.top - padding.bottom) * tailsProb;
        barCtx.fillStyle = '#ff4444';
        barCtx.fillRect(
            centerX + spacing,
            height - padding.bottom - tailsHeight,
            barWidth,
            tailsHeight
        );

        // Draw labels
        barCtx.fillStyle = '#ffffff';
        barCtx.font = '10px Arial';
        
        // Bar labels
        barCtx.textAlign = 'center';
        barCtx.fillText(
            `${headsCount} (${(headsProb * 100).toFixed(1)}%)`,
            centerX - spacing - barWidth/2,
            height - padding.bottom - headsHeight - 5
        );
        barCtx.fillText('HEADS', centerX - spacing - barWidth/2, height - padding.bottom + 15);
        
        barCtx.fillText(
            `${tailsCount} (${(tailsProb * 100).toFixed(1)}%)`,
            centerX + spacing + barWidth/2,
            height - padding.bottom - tailsHeight - 5
        );
        barCtx.fillText('TAILS', centerX + spacing + barWidth/2, height - padding.bottom + 15);

        // Y-axis values
        barCtx.textAlign = 'right';
        barCtx.textBaseline = 'middle';
        for (let i = 0; i <= 10; i++) {
            const y = padding.top + (height - padding.top - padding.bottom) * (i / 10);
            barCtx.fillText((1 - i/10).toFixed(1), padding.left - 5, y);
        }
    }
}

// Flip coin animation
async function animateCoin(result) {
    return new Promise((resolve) => {
        coin.style.transform = 'rotateX(1800deg)';
        coin.querySelector('span').textContent = result === 'H' ? 'H' : 'T';
        
        setTimeout(() => {
            coin.style.transform = 'rotateX(0deg)';
            resolve();
        }, 600);
    });
}

// Update stats
function updateStats() {
    totalFlipsElement.textContent = totalFlips;
    headsCountElement.textContent = headsCount;
    tailsCountElement.textContent = tailsCount;
    probabilityElement.textContent = totalFlips === 0 ? '0.0000' : (headsCount / totalFlips).toFixed(4);
    
    if (totalFlips > 0) {
        headsProbs.push(headsCount / totalFlips);
        tailsProbs.push(tailsCount / totalFlips);
    }
    
    drawLineGraph();
    drawBarGraph();
}

// Reset everything
function reset() {
    totalFlips = 0;
    headsCount = 0;
    tailsCount = 0;
    headsProbs = [];
    tailsProbs = [];
    isFlipping = false;
    shouldStop = false;
    stopButton.disabled = true;
    
    totalFlipsElement.textContent = '0';
    headsCountElement.textContent = '0';
    tailsCountElement.textContent = '0';
    probabilityElement.textContent = '0.0000';
    coin.style.transform = 'rotateX(0deg)';
    coin.querySelector('span').textContent = 'H';
    
    drawLineGraph();
    drawBarGraph();
}

// Flip once
async function flipOnce() {
    if (isFlipping) return;
    isFlipping = true;
    stopButton.disabled = false;
    
    const result = Math.random() < 0.5 ? 'H' : 'T';
    await animateCoin(result);
    
    totalFlips++;
    if (result === 'H') headsCount++;
    else tailsCount++;
    
    updateStats();
    isFlipping = false;
    stopButton.disabled = true;
}

// Flip multiple times
async function flipMultipleTimes() {
    if (isFlipping) {
        // If already flipping, just toggle fast mode
        return;
    }
    
    isFlipping = true;
    shouldStop = false;
    stopButton.disabled = false;
    
    remainingFlips = parseInt(flipCount.value);
    
    while (remainingFlips > 0 && !shouldStop) {
        const result = Math.random() < 0.5 ? 'H' : 'T';
        
        if (!fastMode.checked) {
            await animateCoin(result);
        } else if (remainingFlips === 1) {
            await animateCoin(result);
        } else {
            coin.querySelector('span').textContent = result;
        }
        
        totalFlips++;
        remainingFlips--;
        if (result === 'H') headsCount++;
        else tailsCount++;
        
        // Update stats more frequently in fast mode
        if (!fastMode.checked || remainingFlips % 10 === 0 || remainingFlips === 0) {
            updateStats();
            // Small delay to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    // Final update
    updateStats();
    isFlipping = false;
    shouldStop = false;
    stopButton.disabled = true;
}

// Fast mode toggle handler
fastMode.addEventListener('change', () => {
    if (isFlipping) {
        // If currently flipping, immediately apply the new mode
        if (fastMode.checked) {
            // Speed up remaining flips
            flipMultipleTimes();
        }
    }
});

// Stop flipping
function stopFlipping() {
    shouldStop = true;
}

// Handle window resize
window.addEventListener('resize', () => {
    initializeCanvases();
    drawLineGraph();
    drawBarGraph();
});

// Initialize everything when the page loads
window.addEventListener('load', () => {
    initializeCanvases();
    drawLineGraph();
    drawBarGraph();
    
    // Add event listeners
    document.getElementById('flipButton').addEventListener('click', flipOnce);
    document.getElementById('multiFlipButton').addEventListener('click', flipMultipleTimes);
    document.getElementById('stopButton').addEventListener('click', stopFlipping);
    document.getElementById('resetButton').addEventListener('click', reset);
    
    // Input validation
    flipCount.addEventListener('input', (e) => {
        if (e.target.value < 1) e.target.value = 1;
        if (e.target.value > 10000) e.target.value = 10000;
    });
});
