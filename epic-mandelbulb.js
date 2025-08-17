// Epic Mandelbulb Experience - 究極進化版マンデルバルブ
// マンデルブロ集合の本質を表現しつつ、パフォーマンスも考慮

let renderMode = 'FRACTAL';
let angle = 0;
let stars = [];
let particles = [];
let fractralTrails = [];
let plasmaField = [];
let audioInput, amplitude, fft;
let audioEnabled = false;
let audioLevel = 0, bassLevel = 0, midLevel = 0, trebleLevel = 0;
let autoRotate = true;
let fractalDepth = 0;
let timeAccumulator = 0;
let glowPulse = 0;

// Enhanced Parameters
let params = {
    power: 8.0,
    iterations: 12,
    zoom: 1.0,
    colorShift: 0,
    glowIntensity: 0.5,
    detail: 0.7,
    fractalComplexity: 1.0,
    juliaMode: false,
    juliaC: {x: 0.285, y: 0.01},
    morphSpeed: 0.001,
    sliceMode: false,
    sliceDepth: 0,
    rayMarchSteps: 64,
    shadowSoftness: 0.5,
    aoStrength: 0.5
};

// Fractal color palettes
const palettes = {
    classic: [[255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 0, 255], [255, 0, 255]],
    fire: [[0, 0, 0], [128, 0, 0], [255, 0, 0], [255, 128, 0], [255, 255, 0], [255, 255, 255]],
    ocean: [[0, 0, 64], [0, 0, 128], [0, 64, 255], [0, 128, 255], [128, 255, 255], [255, 255, 255]],
    psychedelic: [[255, 0, 255], [0, 255, 255], [255, 255, 0], [255, 0, 0], [0, 0, 255], [0, 255, 0]],
    quantum: [[64, 0, 128], [128, 0, 255], [255, 0, 255], [255, 128, 255], [255, 255, 255], [128, 255, 255]]
};
let currentPalette = 'psychedelic';

// Advanced Star with fractal properties
class FractalStar {
    constructor() {
        this.reset();
        this.fractalPhase = random(TWO_PI);
        this.orbitRadius = random(50, 200);
        this.orbitSpeed = random(0.001, 0.005);
    }
    
    reset() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.z = random(0, 1500);
        this.size = random(0.5, 3);
        this.speed = random(1, 4);
        this.color = color(random(180, 255), random(180, 255), random(200, 255));
    }
    
    update() {
        // Fractal orbital motion
        this.fractalPhase += this.orbitSpeed;
        let fractalOffset = sin(this.fractalPhase * 3) * cos(this.fractalPhase * 2) * this.orbitRadius * 0.1;
        
        this.z -= this.speed + audioLevel * 10 + fractalOffset;
        
        if (this.z < 0) {
            this.reset();
        }
    }
    
    display() {
        let px = map(this.x / this.z, 0, 1, 0, width);
        let py = map(this.y / this.z, 0, 1, 0, height);
        let s = map(this.z, 0, 1500, this.size * 3, 0);
        
        push();
        translate(px - width/2, py - height/2, -this.z/10);
        
        // Multi-layer glow
        noStroke();
        for (let i = 3; i > 0; i--) {
            fill(red(this.color), green(this.color), blue(this.color), 30 / i);
            sphere(s * i * 0.8);
        }
        
        fill(255);
        sphere(s * 0.5);
        pop();
    }
}

// Fractal Trail Effect
class FractalTrail {
    constructor(x, y, z) {
        this.points = [];
        this.maxPoints = 20;
        this.basePos = createVector(x, y, z);
        this.offset = p5.Vector.random3D().mult(50);
        this.hue = random(360);
        this.lifetime = 255;
    }
    
    update() {
        // Add fractal motion
        let t = millis() * 0.001;
        let fractalX = sin(t * 2 + this.offset.x) * cos(t * 3) * 30;
        let fractalY = cos(t * 2 + this.offset.y) * sin(t * 3) * 30;
        let fractalZ = sin(t + this.offset.z) * 20;
        
        let newPoint = p5.Vector.add(this.basePos, createVector(fractalX, fractalY, fractalZ));
        this.points.push(newPoint);
        
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
        
        this.lifetime -= 2;
    }
    
    display() {
        push();
        noFill();
        strokeWeight(2);
        
        beginShape();
        for (let i = 0; i < this.points.length; i++) {
            let alpha = map(i, 0, this.points.length, 0, this.lifetime);
            stroke(this.hue, 70, 90, alpha);
            vertex(this.points[i].x, this.points[i].y, this.points[i].z);
        }
        endShape();
        pop();
    }
}

// Plasma Field Particle
class PlasmaParticle {
    constructor(x, y, z) {
        this.pos = createVector(x, y, z);
        this.vel = p5.Vector.random3D().mult(0.5);
        this.acc = createVector(0, 0, 0);
        this.radius = random(1, 4);
        this.phase = random(TWO_PI);
        this.frequency = random(0.05, 0.15);
        this.hue = random(360);
    }
    
    update() {
        // Plasma wave motion
        this.phase += this.frequency;
        let waveForce = createVector(
            sin(this.phase) * cos(this.phase * 2),
            cos(this.phase) * sin(this.phase * 3),
            sin(this.phase * 2)
        ).mult(0.5);
        
        this.acc.add(waveForce);
        
        // Attraction to center
        let centerForce = p5.Vector.mult(this.pos, -0.005);
        this.acc.add(centerForce);
        
        // Audio reactivity
        if (audioEnabled) {
            let audioForce = p5.Vector.random3D().mult(bassLevel * 3);
            this.acc.add(audioForce);
        }
        
        this.vel.add(this.acc);
        this.vel.limit(2);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
    
    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        
        // Plasma glow
        noStroke();
        let pulse = sin(this.phase) * 0.5 + 1;
        
        for (let i = 3; i > 0; i--) {
            fill(this.hue, 60, 80, 20 / i);
            sphere(this.radius * i * pulse);
        }
        
        fill(this.hue, 40, 100);
        sphere(this.radius);
        pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSB, 360, 100, 100, 255);
    frameRate(60);
    
    // Create advanced UI
    createAdvancedControlPanel();
    
    // Initialize fractal stars
    for (let i = 0; i < 150; i++) {
        stars.push(new FractalStar());
    }
    
    // Initialize plasma field
    for (let i = 0; i < 30; i++) {
        plasmaField.push(new PlasmaParticle(
            random(-150, 150),
            random(-150, 150),
            random(-150, 150)
        ));
    }
    
    // Setup audio
    audioInput = new p5.AudioIn();
    amplitude = new p5.Amplitude();
    fft = new p5.FFT(0.9, 128);
    fft.setInput(audioInput);
}

function draw() {
    // Dynamic background
    drawFractalBackground();
    
    // Update time-based parameters
    timeAccumulator += 0.01;
    glowPulse = sin(timeAccumulator * 2) * 0.5 + 1;
    fractalDepth = sin(timeAccumulator * 0.5) * 0.5 + 0.5;
    
    // Audio analysis
    if (audioEnabled) {
        audioLevel = amplitude.getLevel();
        let spectrum = fft.analyze();
        bassLevel = fft.getEnergy("bass") / 255;
        midLevel = fft.getEnergy("mid") / 255;
        trebleLevel = fft.getEnergy("treble") / 255;
        
        params.glowIntensity = 0.3 + bassLevel * 0.7;
        params.colorShift += midLevel * 0.05;
        params.morphSpeed = 0.001 + trebleLevel * 0.005;
    }
    
    // Dynamic camera
    let camRadius = 400 * params.zoom;
    let camX = sin(angle) * camRadius;
    let camY = cos(angle * 0.7) * camRadius * 0.5;
    let camZ = cos(angle) * camRadius;
    camera(camX, camY, camZ + 400, 0, 0, 0, 0, 1, 0);
    
    if (autoRotate) {
        angle += 0.003 + audioLevel * 0.02;
    }
    
    // Advanced lighting
    setupFractalLighting();
    
    // Render stars
    push();
    stars.forEach(star => {
        star.update();
        star.display();
    });
    pop();
    
    // Render main fractal
    push();
    switch(renderMode) {
        case 'FRACTAL':
            renderAdvancedFractal();
            break;
        case 'JULIA':
            renderJuliaSet();
            break;
        case 'HYBRID':
            renderHybridFractal();
            break;
        case 'RAYMARCH':
            renderRayMarchedFractal();
            break;
        case 'SLICE':
            render4DSlice();
            break;
    }
    pop();
    
    // Render plasma field
    push();
    blendMode(ADD);
    plasmaField.forEach(p => {
        p.update();
        p.display();
    });
    pop();
    
    // Render fractal trails
    push();
    fractralTrails = fractralTrails.filter(t => t.lifetime > 0);
    fractralTrails.forEach(t => {
        t.update();
        t.display();
    });
    pop();
    
    // Post-processing effects
    applyFractalPostProcessing();
    
    // Display info
    displayAdvancedInfo();
}

function drawFractalBackground() {
    push();
    let bg1 = color((timeAccumulator * 20) % 360, 20, 5);
    let bg2 = color((timeAccumulator * 20 + 120) % 360, 30, 10);
    let bg3 = color((timeAccumulator * 20 + 240) % 360, 25, 8);
    
    // Create fractal gradient
    for (let i = 0; i <= 10; i++) {
        let inter = i / 10;
        let c = lerpColor(lerpColor(bg1, bg2, sin(inter * PI)), bg3, cos(inter * PI));
        fill(c);
        noStroke();
        push();
        translate(0, 0, -500 - i * 50);
        plane(width * 2, height * 2);
        pop();
    }
    pop();
}

function setupFractalLighting() {
    // Main fractal light
    pointLight(
        (params.colorShift * 50) % 360,
        70,
        100 * glowPulse,
        200, 0, 200
    );
    
    // Audio reactive lights
    if (audioEnabled) {
        pointLight(
            bassLevel * 360,
            80,
            100 * bassLevel,
            -200, -100, 100
        );
        
        pointLight(
            midLevel * 360 + 120,
            70,
            100 * midLevel,
            200, 100, 100
        );
        
        pointLight(
            trebleLevel * 360 + 240,
            90,
            100 * trebleLevel,
            0, 200, 100
        );
    }
    
    // Rim lighting
    directionalLight(180, 30, 50, -1, 0, -1);
    directionalLight(240, 30, 50, 1, 0, -1);
    
    ambientLight(220, 20, 20);
}

function renderAdvancedFractal() {
    push();
    strokeWeight(0.3);
    
    let resolution = floor(map(params.detail, 0, 1, 30, 80));
    let size = 150;
    
    // Multi-layer rendering for depth
    for (let layer = 0; layer < 3; layer++) {
        let layerSize = size * (1 - layer * 0.2);
        let layerAlpha = 255 - layer * 50;
        
        for (let lat = 0; lat < resolution; lat++) {
            for (let lon = 0; lon < resolution * 2; lon++) {
                let theta = map(lat, 0, resolution, 0, PI);
                let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
                
                // Add fractal distortion
                theta += sin(timeAccumulator + phi * 3) * 0.05 * params.fractalComplexity;
                phi += cos(timeAccumulator + theta * 2) * 0.05 * params.fractalComplexity;
                
                let r = layerSize;
                let x = r * sin(theta) * cos(phi);
                let y = r * sin(theta) * sin(phi);
                let z = r * cos(theta);
                
                // Enhanced Mandelbulb calculation with morphing
                if (isInAdvancedMandelbulb(x/100, y/100, z/100)) {
                    let distance = dist(x, y, z, 0, 0, 0);
                    let colorIndex = getColorFromPalette(distance, layerSize);
                    
                    stroke(colorIndex[0], colorIndex[1], colorIndex[2], layerAlpha * 0.7);
                    fill(colorIndex[0], colorIndex[1], colorIndex[2], layerAlpha * 0.5);
                    
                    push();
                    translate(x, y, z);
                    
                    // Add glow based on audio
                    if (audioEnabled && bassLevel > 0.5) {
                        for (let i = 0; i < 2; i++) {
                            fill(colorIndex[0], colorIndex[1], colorIndex[2], 30 / (i + 1));
                            sphere(3 + i * bassLevel * 5);
                        }
                    }
                    
                    // Fractal geometry
                    rotateX(timeAccumulator * params.morphSpeed);
                    rotateY(timeAccumulator * params.morphSpeed * 1.3);
                    
                    if (layer === 0) {
                        box(2);
                    } else {
                        sphere(1.5);
                    }
                    pop();
                    
                    // Create trails for special points
                    if (random() < 0.001 && fractralTrails.length < 20) {
                        fractralTrails.push(new FractalTrail(x, y, z));
                    }
                }
            }
        }
    }
    pop();
}

function renderJuliaSet() {
    push();
    strokeWeight(0.5);
    
    let resolution = floor(map(params.detail, 0, 1, 25, 60));
    let size = 150;
    
    // Animate Julia constant
    params.juliaC.x = 0.285 + sin(timeAccumulator) * 0.1;
    params.juliaC.y = 0.01 + cos(timeAccumulator * 1.3) * 0.1;
    
    for (let lat = 0; lat < resolution; lat++) {
        for (let lon = 0; lon < resolution * 2; lon++) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            
            if (isInJuliaSet(x/100, y/100, z/100)) {
                let hue = (params.colorShift * 100 + dist(x, y, z, 0, 0, 0) * 3) % 360;
                let sat = map(abs(z), 0, size, 40, 80);
                let bright = map(dist(x, y, z, 0, 0, 0), 0, size, 100, 60);
                
                stroke(hue, sat, bright, 200);
                fill(hue, sat - 10, bright, 150);
                
                push();
                translate(x, y, z);
                
                // Julia set specific rendering
                rotateZ(phi);
                rotateY(theta);
                
                // Crystal-like structure
                for (let i = 0; i < 3; i++) {
                    rotateX(TWO_PI / 3);
                    box(1, 4, 1);
                }
                
                sphere(1);
                pop();
            }
        }
    }
    pop();
}

function renderHybridFractal() {
    // Combine multiple fractal types
    push();
    
    // Base Mandelbulb
    push();
    blendMode(ADD);
    renderAdvancedFractal();
    pop();
    
    // Julia overlay
    push();
    blendMode(SCREEN);
    renderJuliaSet();
    pop();
    
    // Add quantum foam effect
    push();
    noStroke();
    for (let i = 0; i < 50; i++) {
        let x = random(-200, 200);
        let y = random(-200, 200);
        let z = random(-200, 200);
        
        if (isInAdvancedMandelbulb(x/100, y/100, z/100)) {
            push();
            translate(x, y, z);
            fill(random(360), 50, 100, 50);
            sphere(random(0.5, 2));
            pop();
        }
    }
    pop();
    
    pop();
}

function renderRayMarchedFractal() {
    // Simulated ray marching effect
    push();
    noStroke();
    
    let steps = params.rayMarchSteps;
    let size = 200;
    
    for (let i = 0; i < steps; i++) {
        let t = i / steps;
        let radius = size * (1 - t * 0.5);
        let alpha = 255 * (1 - t);
        
        push();
        rotateX(timeAccumulator * 0.5 + t * PI);
        rotateY(timeAccumulator * 0.3 + t * PI * 0.5);
        
        // Distance field visualization
        for (let j = 0; j < 20; j++) {
            let angle = (j / 20) * TWO_PI;
            let x = cos(angle) * radius;
            let y = sin(angle) * radius;
            let z = sin(t * PI) * radius * 0.5;
            
            if (mandelbulbSDF(x/100, y/100, z/100) < 0.1) {
                push();
                translate(x, y, z);
                
                let hue = (t * 360 + params.colorShift * 100) % 360;
                fill(hue, 70, 80, alpha * 0.3);
                sphere(3);
                pop();
            }
        }
        pop();
    }
    pop();
}

function render4DSlice() {
    // 4D Mandelbulb slice visualization
    push();
    strokeWeight(0.5);
    
    let resolution = floor(map(params.detail, 0, 1, 20, 50));
    let size = 150;
    
    // Animate through 4th dimension
    params.sliceDepth = sin(timeAccumulator * 0.5) * 0.5;
    
    for (let lat = 0; lat < resolution; lat++) {
        for (let lon = 0; lon < resolution * 2; lon++) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            let w = params.sliceDepth * 100; // 4th dimension
            
            if (isIn4DMandelbulb(x/100, y/100, z/100, w/100)) {
                // 4D to 3D projection coloring
                let hue = (abs(w) * 3 + params.colorShift * 100) % 360;
                let sat = map(abs(w), 0, 50, 30, 90);
                let bright = map(dist(x, y, z, 0, 0, 0), 0, size, 100, 50);
                
                stroke(hue, sat, bright, 200);
                fill(hue, sat, bright, 150);
                
                push();
                translate(x, y, z);
                
                // 4D rotation effect
                rotateX(w * 0.01);
                rotateY(w * 0.01);
                rotateZ(timeAccumulator);
                
                // Tesseract-inspired geometry
                box(2);
                rotateX(HALF_PI);
                box(1.5);
                rotateY(HALF_PI);
                box(1);
                
                pop();
            }
        }
    }
    pop();
}

function isInAdvancedMandelbulb(x, y, z) {
    let zx = x, zy = y, zz = z;
    let r = 0;
    let dr = 1;
    
    // Morphing power
    let power = params.power + sin(timeAccumulator * params.morphSpeed) * 2;
    
    for (let i = 0; i < params.iterations; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz);
        if (r > 2) return false;
        
        let theta = acos(zz / r);
        let phi = atan2(zy, zx);
        
        // Distance estimation
        dr = pow(r, power - 1) * power * dr + 1;
        
        let zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;
        
        // Add fractal complexity
        theta += sin(timeAccumulator) * 0.01 * params.fractalComplexity;
        phi += cos(timeAccumulator * 1.3) * 0.01 * params.fractalComplexity;
        
        zx = zr * sin(theta) * cos(phi) + x;
        zy = zr * sin(theta) * sin(phi) + y;
        zz = zr * cos(theta) + z;
    }
    
    return true;
}

function isInJuliaSet(x, y, z) {
    let zx = x, zy = y, zz = z;
    let r = 0;
    
    for (let i = 0; i < params.iterations; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz);
        if (r > 2) return false;
        
        let theta = acos(zz / r);
        let phi = atan2(zy, zx);
        
        let zr = pow(r, params.power);
        theta = theta * params.power;
        phi = phi * params.power;
        
        zx = zr * sin(theta) * cos(phi) + params.juliaC.x;
        zy = zr * sin(theta) * sin(phi) + params.juliaC.y;
        zz = zr * cos(theta) + 0.1;
    }
    
    return true;
}

function isIn4DMandelbulb(x, y, z, w) {
    let zx = x, zy = y, zz = z, zw = w;
    let r = 0;
    
    for (let i = 0; i < params.iterations; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz + zw * zw);
        if (r > 2) return false;
        
        // 4D spherical coordinates
        let theta = acos(zz / sqrt(zx * zx + zy * zy + zz * zz));
        let phi = atan2(zy, zx);
        let psi = atan2(sqrt(zx * zx + zy * zy + zz * zz), zw);
        
        let zr = pow(r, params.power);
        theta = theta * params.power;
        phi = phi * params.power;
        psi = psi * params.power;
        
        zx = zr * sin(psi) * sin(theta) * cos(phi) + x;
        zy = zr * sin(psi) * sin(theta) * sin(phi) + y;
        zz = zr * sin(psi) * cos(theta) + z;
        zw = zr * cos(psi) + w;
    }
    
    return true;
}

function mandelbulbSDF(x, y, z) {
    // Signed distance function for ray marching
    let zx = x, zy = y, zz = z;
    let r = 0;
    let dr = 1;
    
    for (let i = 0; i < 8; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz);
        if (r > 2) break;
        
        let theta = acos(zz / r);
        let phi = atan2(zy, zx);
        
        dr = pow(r, params.power - 1) * params.power * dr + 1;
        
        let zr = pow(r, params.power);
        theta = theta * params.power;
        phi = phi * params.power;
        
        zx = zr * sin(theta) * cos(phi) + x;
        zy = zr * sin(theta) * sin(phi) + y;
        zz = zr * cos(theta) + z;
    }
    
    return 0.5 * log(r) * r / dr;
}

function getColorFromPalette(distance, maxDist) {
    let palette = palettes[currentPalette];
    let t = (distance / maxDist) * (palette.length - 1);
    let index = floor(t);
    let fraction = t - index;
    
    if (index >= palette.length - 1) {
        return palette[palette.length - 1];
    }
    
    let c1 = palette[index];
    let c2 = palette[index + 1];
    
    return [
        lerp(c1[0], c2[0], fraction),
        lerp(c1[1], c2[1], fraction),
        lerp(c1[2], c2[2], fraction)
    ];
}

function applyFractalPostProcessing() {
    // Bloom effect
    if (params.glowIntensity > 0) {
        push();
        blendMode(ADD);
        noStroke();
        
        // Multi-layer bloom
        for (let i = 0; i < 3; i++) {
            fill((timeAccumulator * 30 + i * 120) % 360, 30, 50, params.glowIntensity * 5 / (i + 1));
            push();
            translate(0, 0, -100 - i * 100);
            sphere(500 + i * 200);
            pop();
        }
        pop();
    }
    
    // Vignette effect
    push();
    blendMode(MULTIPLY);
    fill(0, 0, 0, 30);
    noStroke();
    translate(0, 0, 300);
    plane(width * 2, height * 2);
    pop();
}

function createAdvancedControlPanel() {
    let container = createDiv('');
    container.id('controls');
    container.style('position', 'fixed');
    container.style('top', '20px');
    container.style('right', '20px');
    container.style('background', 'rgba(0, 0, 0, 0.85)');
    container.style('backdrop-filter', 'blur(20px)');
    container.style('padding', '20px');
    container.style('border-radius', '15px');
    container.style('border', '1px solid rgba(0, 255, 255, 0.3)');
    container.style('z-index', '1000');
    container.style('min-width', '250px');
    container.style('max-height', '90vh');
    container.style('overflow-y', 'auto');
    
    // Title
    let title = createDiv('🎆 EPIC MANDELBULB 🎆');
    title.style('font-size', '18px');
    title.style('margin-bottom', '15px');
    title.style('text-align', 'center');
    title.style('background', 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00)');
    title.style('-webkit-background-clip', 'text');
    title.style('-webkit-text-fill-color', 'transparent');
    title.style('font-weight', 'bold');
    title.style('font-family', 'monospace');
    title.parent(container);
    
    // Render modes
    let modeLabel = createDiv('RENDER MODE');
    modeLabel.style('color', '#00ffff');
    modeLabel.style('font-size', '11px');
    modeLabel.style('margin-bottom', '8px');
    modeLabel.style('font-family', 'monospace');
    modeLabel.parent(container);
    
    let modes = ['FRACTAL', 'JULIA', 'HYBRID', 'RAYMARCH', 'SLICE'];
    modes.forEach(mode => {
        let btn = createButton(mode);
        btn.mousePressed(() => {
            renderMode = mode;
            updateModeButtons();
        });
        btn.id(`mode-${mode}`);
        btn.style('display', 'inline-block');
        btn.style('width', '48%');
        btn.style('margin', '1%');
        btn.style('padding', '8px');
        btn.style('background', mode === renderMode ? 'linear-gradient(90deg, #ff00ff, #00ffff)' : '#222');
        btn.style('color', 'white');
        btn.style('border', 'none');
        btn.style('border-radius', '5px');
        btn.style('cursor', 'pointer');
        btn.style('font-size', '11px');
        btn.style('font-family', 'monospace');
        btn.parent(container);
    });
    
    // Separator
    createSeparator(container);
    
    // Color palette selector
    let paletteLabel = createDiv('COLOR PALETTE');
    paletteLabel.style('color', '#00ffff');
    paletteLabel.style('font-size', '11px');
    paletteLabel.style('margin', '10px 0 5px 0');
    paletteLabel.style('font-family', 'monospace');
    paletteLabel.parent(container);
    
    let paletteSelect = createSelect();
    Object.keys(palettes).forEach(p => paletteSelect.option(p.toUpperCase()));
    paletteSelect.value('PSYCHEDELIC');
    paletteSelect.changed(() => {
        currentPalette = paletteSelect.value().toLowerCase();
    });
    paletteSelect.style('width', '100%');
    paletteSelect.style('padding', '5px');
    paletteSelect.style('background', '#222');
    paletteSelect.style('color', '#fff');
    paletteSelect.style('border', '1px solid #00ffff');
    paletteSelect.style('border-radius', '3px');
    paletteSelect.parent(container);
    
    // Power slider
    createParamSlider(container, 'POWER', 2, 16, params.power, 0.5, (val) => {
        params.power = val;
    });
    
    // Iterations slider
    createParamSlider(container, 'ITERATIONS', 4, 20, params.iterations, 1, (val) => {
        params.iterations = val;
    });
    
    // Fractal Complexity
    createParamSlider(container, 'COMPLEXITY', 0, 2, params.fractalComplexity, 0.1, (val) => {
        params.fractalComplexity = val;
    });
    
    // Morph Speed
    createParamSlider(container, 'MORPH SPEED', 0, 0.01, params.morphSpeed, 0.001, (val) => {
        params.morphSpeed = val;
    });
    
    createSeparator(container);
    
    // Control buttons
    let audioBtn = createButton('🎵 AUDIO: OFF');
    audioBtn.id('audio-toggle');
    audioBtn.mousePressed(() => {
        if (!audioEnabled) {
            userStartAudio();
            audioInput.start();
            audioEnabled = true;
            audioBtn.html('🎵 AUDIO: ON');
            audioBtn.style('background', 'linear-gradient(90deg, #00ff00, #00ffff)');
        } else {
            audioInput.stop();
            audioEnabled = false;
            audioBtn.html('🎵 AUDIO: OFF');
            audioBtn.style('background', '#333');
        }
    });
    styleButton(audioBtn);
    audioBtn.parent(container);
    
    let rotateBtn = createButton('🔄 ROTATE: ON');
    rotateBtn.mousePressed(() => {
        autoRotate = !autoRotate;
        rotateBtn.html(autoRotate ? '🔄 ROTATE: ON' : '🔄 ROTATE: OFF');
        rotateBtn.style('background', autoRotate ? '#333' : '#555');
    });
    styleButton(rotateBtn);
    rotateBtn.parent(container);
    
    // Explosion button
    let explodeBtn = createButton('💥 FRACTAL EXPLOSION!');
    explodeBtn.mousePressed(() => {
        createFractalExplosion();
    });
    explodeBtn.style('display', 'block');
    explodeBtn.style('width', '100%');
    explodeBtn.style('margin', '10px 0');
    explodeBtn.style('padding', '12px');
    explodeBtn.style('background', 'linear-gradient(90deg, #ff0000, #ff6600, #ffff00)');
    explodeBtn.style('color', 'white');
    explodeBtn.style('border', 'none');
    explodeBtn.style('border-radius', '8px');
    explodeBtn.style('cursor', 'pointer');
    explodeBtn.style('font-weight', 'bold');
    explodeBtn.style('font-size', '12px');
    explodeBtn.style('animation', 'pulse 1s infinite');
    explodeBtn.parent(container);
    
    // Add CSS animations
    let style = createElement('style');
    style.html(`
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        #controls::-webkit-scrollbar {
            width: 8px;
        }
        #controls::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        }
        #controls::-webkit-scrollbar-thumb {
            background: rgba(0, 255, 255, 0.5);
            border-radius: 4px;
        }
        #controls button:hover {
            filter: brightness(1.2);
            transform: scale(1.02);
        }
    `);
    style.parent(document.head);
}

function createParamSlider(parent, label, min, max, value, step, callback) {
    let group = createDiv('');
    group.style('margin', '10px 0');
    group.parent(parent);
    
    let labelDiv = createDiv(`${label}: ${value.toFixed(2)}`);
    labelDiv.style('color', '#00ffff');
    labelDiv.style('font-size', '10px');
    labelDiv.style('margin-bottom', '3px');
    labelDiv.style('font-family', 'monospace');
    labelDiv.parent(group);
    
    let slider = createSlider(min, max, value, step);
    slider.style('width', '100%');
    slider.input(() => {
        let val = slider.value();
        callback(val);
        labelDiv.html(`${label}: ${val.toFixed(2)}`);
    });
    slider.parent(group);
}

function createSeparator(parent) {
    let sep = createDiv('');
    sep.style('height', '1px');
    sep.style('background', 'linear-gradient(90deg, transparent, #00ffff, transparent)');
    sep.style('margin', '15px 0');
    sep.parent(parent);
}

function styleButton(btn) {
    btn.style('display', 'block');
    btn.style('width', '100%');
    btn.style('margin', '5px 0');
    btn.style('padding', '8px');
    btn.style('background', '#333');
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '5px');
    btn.style('cursor', 'pointer');
    btn.style('font-size', '11px');
    btn.style('font-family', 'monospace');
    btn.style('transition', 'all 0.2s');
}

function updateModeButtons() {
    let modes = ['FRACTAL', 'JULIA', 'HYBRID', 'RAYMARCH', 'SLICE'];
    modes.forEach(mode => {
        let btn = select(`#mode-${mode}`);
        if (btn) {
            btn.style('background', mode === renderMode ? 'linear-gradient(90deg, #ff00ff, #00ffff)' : '#222');
        }
    });
}

function createFractalExplosion() {
    // Create massive fractal explosion
    for (let i = 0; i < 50; i++) {
        let angle = random(TWO_PI);
        let angle2 = random(PI);
        let r = random(50, 200);
        
        let x = r * sin(angle2) * cos(angle);
        let y = r * sin(angle2) * sin(angle);
        let z = r * cos(angle2);
        
        plasmaField.push(new PlasmaParticle(x, y, z));
        
        if (i % 2 === 0) {
            fractralTrails.push(new FractalTrail(x, y, z));
        }
    }
    
    // Flash effect
    params.glowIntensity = 2.0;
    setTimeout(() => {
        params.glowIntensity = 0.5;
    }, 300);
    
    // Fractal morph burst
    let originalMorphSpeed = params.morphSpeed;
    params.morphSpeed = 0.05;
    setTimeout(() => {
        params.morphSpeed = originalMorphSpeed;
    }, 2000);
}

function displayAdvancedInfo() {
    push();
    resetMatrix();
    camera();
    fill(0, 0, 100);
    textAlign(LEFT, TOP);
    textSize(11);
    textFont('monospace');
    
    let x = -width/2 + 20;
    let y = -height/2 + 20;
    
    // Performance info
    text(`FPS: ${floor(frameRate())}`, x, y);
    text(`MODE: ${renderMode}`, x, y + 15);
    
    // Parameter info
    text(`─────────────────`, x, y + 30);
    text(`POWER: ${params.power.toFixed(1)}`, x, y + 45);
    text(`ITERATIONS: ${params.iterations}`, x, y + 60);
    text(`COMPLEXITY: ${params.fractalComplexity.toFixed(1)}`, x, y + 75);
    text(`MORPH: ${(params.morphSpeed * 1000).toFixed(1)}`, x, y + 90);
    text(`ZOOM: ${params.zoom.toFixed(2)}x`, x, y + 105);
    text(`PALETTE: ${currentPalette.toUpperCase()}`, x, y + 120);
    
    // Audio info
    if (audioEnabled) {
        text(`─────────────────`, x, y + 135);
        text(`AUDIO: ${(audioLevel * 100).toFixed(0)}%`, x, y + 150);
        text(`BASS: ${(bassLevel * 100).toFixed(0)}%`, x, y + 165);
        text(`MID: ${(midLevel * 100).toFixed(0)}%`, x, y + 180);
        text(`TREBLE: ${(trebleLevel * 100).toFixed(0)}%`, x, y + 195);
    }
    
    pop();
}

function mouseDragged() {
    if (mouseX < width - 270) {
        angle += (mouseX - pmouseX) * 0.01;
    }
}

function mouseWheel(event) {
    if (mouseX < width - 270) {
        params.zoom += event.delta * 0.0005;
        params.zoom = constrain(params.zoom, 0.3, 3);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}