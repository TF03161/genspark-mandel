// Responsive Ultimate Mandelbulb - スマホ対応版
// 横向き対応＆UIトグル機能付き

let renderMode = 'EPIC';
let angle = 0;
let stars = [];
let particles = [];
let trails = [];
let explosions = [];
let audioInput, amplitude, fft;
let audioEnabled = false;
let audioLevel = 0, bassLevel = 0, midLevel = 0, trebleLevel = 0;
let autoRotate = true;
let time = 0;
let uiVisible = true;
let isMobile = false;
let isLandscape = false;

// Parameters with defaults
let params = {
    power: 8.0,
    iterations: 15,
    zoom: 1.0,
    colorShift: 0,
    glowIntensity: 0.8,
    detail: 30,
    particleCount: 100,
    trailLength: 20,
    morphing: true,
    morphSpeed: 0.01
};

// Color schemes
const colorSchemes = {
    rainbow: [[255,0,0], [255,127,0], [255,255,0], [0,255,0], [0,0,255], [75,0,130], [148,0,211]],
    fire: [[0,0,0], [64,0,0], [128,0,0], [255,0,0], [255,128,0], [255,255,0], [255,255,255]],
    ocean: [[0,0,32], [0,0,64], [0,32,128], [0,64,192], [0,128,255], [64,192,255], [255,255,255]],
    plasma: [[128,0,255], [255,0,255], [255,0,128], [255,128,0], [255,255,0], [128,255,0], [0,255,255]],
    cosmic: [[0,0,0], [32,0,64], [64,0,128], [128,0,192], [192,64,255], [255,128,255], [255,255,255]]
};
let currentScheme = 'plasma';

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchStartAngle = 0;
let touchStartZoom = 1;
let lastTouchDistance = 0;

// Super particle class
class SuperParticle {
    constructor(x, y, z) {
        this.pos = createVector(x || random(-200, 200), y || random(-200, 200), z || random(-200, 200));
        this.vel = p5.Vector.random3D().mult(random(1, 3));
        this.acc = createVector(0, 0, 0);
        this.lifetime = 255;
        this.maxLife = 255;
        this.size = random(2, 6);
        this.hue = random(360);
        this.trail = [];
        this.maxTrail = isMobile ? 5 : 10;
    }
    
    applyForce(force) {
        this.acc.add(force);
    }
    
    update() {
        // Trail management
        this.trail.push(this.pos.copy());
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
        
        // Fractal forces
        let centerForce = p5.Vector.mult(this.pos, -0.001);
        this.applyForce(centerForce);
        
        // Audio reactive force
        if (audioEnabled) {
            let audioForce = p5.Vector.random3D().mult(audioLevel * 5);
            this.applyForce(audioForce);
        }
        
        // Update physics
        this.vel.add(this.acc);
        this.vel.limit(5);
        this.pos.add(this.vel);
        this.acc.mult(0);
        
        this.lifetime -= 1;
    }
    
    display() {
        // Draw trail (simplified for mobile)
        if (!isMobile || particles.length < 50) {
            push();
            noFill();
            strokeWeight(1);
            beginShape();
            for (let i = 0; i < this.trail.length; i++) {
                let alpha = map(i, 0, this.trail.length, 0, this.lifetime);
                stroke(this.hue, 80, 100, alpha * 0.5);
                vertex(this.trail[i].x, this.trail[i].y, this.trail[i].z);
            }
            endShape();
            pop();
        }
        
        // Draw particle
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        
        // Simplified glow for mobile
        noStroke();
        let layers = isMobile ? 2 : 3;
        for (let i = layers; i > 0; i--) {
            fill(this.hue, 60, 100, this.lifetime * 0.1 / i);
            sphere(this.size * i * 0.7);
        }
        
        fill(this.hue, 40, 100, this.lifetime);
        sphere(this.size);
        pop();
    }
}

// Explosion effect
class Explosion {
    constructor(x, y, z) {
        this.pos = createVector(x, y, z);
        this.particles = [];
        this.lifetime = 100;
        
        // Less particles on mobile
        let particleCount = isMobile ? 15 : 30;
        for (let i = 0; i < particleCount; i++) {
            let p = {
                pos: this.pos.copy(),
                vel: p5.Vector.random3D().mult(random(5, 15)),
                size: random(2, 8),
                hue: random(0, 60),
                lifetime: 100
            };
            this.particles.push(p);
        }
    }
    
    update() {
        this.lifetime -= 2;
        
        this.particles.forEach(p => {
            p.vel.mult(0.95);
            p.pos.add(p.vel);
            p.lifetime -= 2;
            p.size *= 0.98;
        });
    }
    
    display() {
        this.particles.forEach(p => {
            if (p.lifetime > 0) {
                push();
                translate(p.pos.x, p.pos.y, p.pos.z);
                noStroke();
                
                // Simplified glow for mobile
                let layers = isMobile ? 1 : 2;
                for (let i = layers; i > 0; i--) {
                    fill(p.hue, 100, 100, p.lifetime * 0.2 / i);
                    sphere(p.size * i);
                }
                
                fill(60, 100, 100, p.lifetime);
                sphere(p.size);
                pop();
            }
        });
    }
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent(document.body);
    
    colorMode(HSB, 360, 100, 100, 255);
    frameRate(60);
    
    // Detect mobile and orientation
    checkDevice();
    
    // Adjust parameters for mobile
    if (isMobile) {
        params.detail = 25;
        params.particleCount = 50;
        params.iterations = 10;
    }
    
    // Create the responsive control panel
    createResponsiveControlPanel();
    
    // Initialize stars (less on mobile)
    let starCount = isMobile ? 100 : 200;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: random(-width, width),
            y: random(-height, height), 
            z: random(0, 1000),
            size: random(0.5, 3)
        });
    }
    
    // Setup audio
    audioInput = new p5.AudioIn();
    amplitude = new p5.Amplitude();
    fft = new p5.FFT(0.8, isMobile ? 64 : 128);
    fft.setInput(audioInput);
    
    // Setup touch events for mobile
    setupTouchEvents();
}

function checkDevice() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    isLandscape = windowWidth > windowHeight;
}

function setupTouchEvents() {
    canvas.touchStarted = function(event) {
        if (event.touches.length === 1) {
            touchStartX = event.touches[0].pageX;
            touchStartY = event.touches[0].pageY;
            touchStartAngle = angle;
        } else if (event.touches.length === 2) {
            let dx = event.touches[0].pageX - event.touches[1].pageX;
            let dy = event.touches[0].pageY - event.touches[1].pageY;
            lastTouchDistance = sqrt(dx * dx + dy * dy);
            touchStartZoom = params.zoom;
        }
        return false;
    };
    
    canvas.touchMoved = function(event) {
        if (event.touches.length === 1) {
            let dx = event.touches[0].pageX - touchStartX;
            angle = touchStartAngle + dx * 0.01;
        } else if (event.touches.length === 2) {
            let dx = event.touches[0].pageX - event.touches[1].pageX;
            let dy = event.touches[0].pageY - event.touches[1].pageY;
            let distance = sqrt(dx * dx + dy * dy);
            let scale = distance / lastTouchDistance;
            params.zoom = constrain(touchStartZoom * scale, 0.3, 3);
        }
        return false;
    };
}

function draw() {
    // Background with gradient effect
    background(0, 0, 5);
    
    // Time update
    time += 0.01;
    
    // Audio processing (less frequent on mobile)
    if (audioEnabled && frameCount % (isMobile ? 4 : 2) === 0) {
        audioLevel = amplitude.getLevel();
        let spectrum = fft.analyze();
        bassLevel = fft.getEnergy("bass") / 255;
        midLevel = fft.getEnergy("mid") / 255;
        trebleLevel = fft.getEnergy("treble") / 255;
        
        params.colorShift += midLevel * 0.1;
        params.glowIntensity = 0.5 + bassLevel * 0.5;
    }
    
    // Camera animation
    let camRadius = 400 * params.zoom;
    let camX = sin(angle) * camRadius;
    let camY = cos(angle * 0.7) * camRadius * 0.5;
    let camZ = cos(angle) * camRadius;
    
    camera(camX, camY, camZ + 500, 0, 0, 0, 0, 1, 0);
    
    if (autoRotate) {
        angle += 0.002 + audioLevel * 0.01;
    }
    
    // Dynamic lighting
    setupLighting();
    
    // Render stars
    renderStars();
    
    // Main mandelbulb rendering
    push();
    switch(renderMode) {
        case 'EPIC':
            renderEpicMandelbulb();
            break;
        case 'CLASSIC':
            renderClassicMandelbulb();
            break;
        case 'PARTICLE':
            renderParticleMandelbulb();
            break;
        case 'QUANTUM':
            renderQuantumMandelbulb();
            break;
        case 'MATRIX':
            renderMatrixMandelbulb();
            break;
    }
    pop();
    
    // Update and render particles
    updateParticles();
    
    // Update and render explosions
    updateExplosions();
    
    // Apply post effects (simplified on mobile)
    if (!isMobile || params.glowIntensity > 1) {
        applyPostEffects();
    }
    
    // Display HUD
    displayHUD();
}

function setupLighting() {
    // Simplified lighting for mobile
    if (isMobile) {
        pointLight(
            (time * 30) % 360,
            60,
            100,
            200, 0, 200
        );
        ambientLight(240, 20, 40);
    } else {
        // Full lighting for desktop
        pointLight(
            (time * 30) % 360,
            60,
            100,
            cos(time) * 300,
            sin(time) * 300,
            200
        );
        
        if (audioEnabled) {
            pointLight(0, 100, 100 * bassLevel, -200, 0, 100);
            pointLight(120, 100, 100 * midLevel, 200, 0, 100);
            pointLight(240, 100, 100 * trebleLevel, 0, -200, 100);
        }
        
        ambientLight(240, 20, 30);
    }
}

function renderStars() {
    push();
    stars.forEach(star => {
        star.z -= 2 + audioLevel * 10;
        if (star.z < 0) {
            star.z = 1000;
            star.x = random(-width, width);
            star.y = random(-height, height);
        }
        
        let sx = map(star.x / star.z, 0, 1, 0, width);
        let sy = map(star.y / star.z, 0, 1, 0, height);
        let s = map(star.z, 0, 1000, star.size * 3, 0);
        
        push();
        translate(sx - width/2, sy - height/2, -star.z/5);
        noStroke();
        fill(0, 0, 100, 255 - star.z * 0.25);
        sphere(s);
        pop();
    });
    pop();
}

function renderEpicMandelbulb() {
    push();
    strokeWeight(0.5);
    
    let resolution = params.detail;
    let size = 150;
    let morphPower = params.morphing ? params.power + sin(time * params.morphSpeed) * 2 : params.power;
    
    // Single layer for mobile, multi-layer for desktop
    let layers = isMobile ? 1 : 2;
    
    for (let layer = 0; layer < layers; layer++) {
        let layerSize = size * (1 - layer * 0.1);
        let step = isMobile ? 3 : 2;
        
        for (let lat = 0; lat < resolution; lat += step) {
            for (let lon = 0; lon < resolution * 2; lon += step) {
                let theta = map(lat, 0, resolution, 0, PI);
                let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
                
                // Add some distortion
                if (params.morphing && !isMobile) {
                    theta += sin(time + phi * 2) * 0.05;
                    phi += cos(time + theta * 3) * 0.05;
                }
                
                let r = layerSize;
                let x = r * sin(theta) * cos(phi);
                let y = r * sin(theta) * sin(phi);
                let z = r * cos(theta);
                
                if (isInMandelbulb(x/100, y/100, z/100, morphPower)) {
                    let distance = dist(x, y, z, 0, 0, 0);
                    let colorData = getColorFromScheme(distance, layerSize);
                    
                    stroke(colorData[0], colorData[1], colorData[2], 200 - layer * 50);
                    fill(colorData[0], colorData[1], colorData[2], 150 - layer * 50);
                    
                    push();
                    translate(x, y, z);
                    
                    // Simplified geometry for mobile
                    if (isMobile) {
                        box(2, 2, 2);
                    } else {
                        // Glow effect
                        if (audioEnabled && bassLevel > 0.3) {
                            noStroke();
                            for (let i = 0; i < 2; i++) {
                                fill(colorData[0], colorData[1], colorData[2], 20 / (i + 1));
                                sphere(4 + i * bassLevel * 10);
                            }
                        }
                        
                        // Rotating geometry
                        rotateX(time * 0.5);
                        rotateY(time * 0.3);
                        
                        if (layer === 0) {
                            box(2, 2, 2);
                        } else {
                            sphere(1.5);
                        }
                    }
                    pop();
                    
                    // Spawn particles occasionally (less on mobile)
                    let spawnChance = isMobile ? 0.001 : 0.002;
                    if (random() < spawnChance && particles.length < params.particleCount) {
                        particles.push(new SuperParticle(x, y, z));
                    }
                }
            }
        }
    }
    pop();
}

function renderClassicMandelbulb() {
    push();
    strokeWeight(1);
    
    let resolution = isMobile ? 20 : 30;
    let size = 120;
    
    for (let lat = 0; lat < resolution; lat++) {
        for (let lon = 0; lon < resolution * 2; lon++) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            
            if (isInMandelbulb(x/100, y/100, z/100, params.power)) {
                let hue = (params.colorShift * 100 + dist(x, y, z, 0, 0, 0) * 2) % 360;
                
                stroke(hue, 60, 80, 180);
                fill(hue, 50, 90, 120);
                
                push();
                translate(x, y, z);
                box(3);
                pop();
            }
        }
    }
    pop();
}

function renderParticleMandelbulb() {
    push();
    noStroke();
    
    // Particle field
    let spawnRate = isMobile ? 5 : 3;
    if (frameCount % spawnRate === 0 && particles.length < params.particleCount) {
        for (let i = 0; i < (isMobile ? 2 : 3); i++) {
            let theta = random(TWO_PI);
            let phi = random(PI);
            let r = random(80, 150);
            
            let x = r * sin(phi) * cos(theta);
            let y = r * sin(phi) * sin(theta);
            let z = r * cos(phi);
            
            if (isInMandelbulb(x/100, y/100, z/100, params.power)) {
                particles.push(new SuperParticle(x, y, z));
            }
        }
    }
    
    // Central sphere
    stroke(180, 50, 80, 50);
    noFill();
    sphere(100);
    
    pop();
}

function renderQuantumMandelbulb() {
    push();
    
    // Quantum field lines (less on mobile)
    strokeWeight(0.5);
    stroke(200, 50, 100, 40);
    noFill();
    
    let fieldCount = isMobile ? 5 : 10;
    for (let i = 0; i < fieldCount; i++) {
        push();
        let t = time * 0.5 + i * 0.3;
        rotateX(t);
        rotateY(t * 1.3);
        rotateZ(t * 0.7);
        
        let size = 100 + sin(t * 3) * 30;
        box(size);
        if (!isMobile) {
            sphere(size * 0.7);
        }
        pop();
    }
    
    pop();
}

function renderMatrixMandelbulb() {
    push();
    
    // Matrix rain effect (less particles on mobile)
    stroke(120, 100, 100, 100);
    strokeWeight(0.5);
    
    let matrixCount = isMobile ? 25 : 50;
    for (let i = 0; i < matrixCount; i++) {
        let x = random(-200, 200);
        let y = -200 + (frameCount * 2 + i * 20) % 400;
        let z = random(-200, 200);
        
        if (isInMandelbulb(x/100, y/100, z/100, params.power)) {
            push();
            translate(x, y, z);
            fill(120, 100, 100, 150);
            noStroke();
            sphere(2);
            
            // Trail (simplified on mobile)
            if (!isMobile) {
                stroke(120, 100, 100, 50);
                line(0, 0, 0, 0, -20, 0);
            }
            pop();
        }
    }
    
    pop();
}

function isInMandelbulb(x, y, z, power) {
    let zx = x, zy = y, zz = z;
    let r = 0;
    
    for (let i = 0; i < params.iterations; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz);
        if (r > 2) return false;
        
        let theta = acos(zz / r);
        let phi = atan2(zy, zx);
        
        let zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;
        
        zx = zr * sin(theta) * cos(phi) + x;
        zy = zr * sin(theta) * sin(phi) + y;
        zz = zr * cos(theta) + z;
    }
    
    return true;
}

function getColorFromScheme(dist, maxDist) {
    let scheme = colorSchemes[currentScheme];
    let t = (dist / maxDist) * (scheme.length - 1);
    let idx = floor(t);
    let frac = t - idx;
    
    if (idx >= scheme.length - 1) {
        let c = scheme[scheme.length - 1];
        return [map(c[0], 0, 255, 0, 360), map(c[1], 0, 255, 0, 100), map(c[2], 0, 255, 0, 100)];
    }
    
    let c1 = scheme[idx];
    let c2 = scheme[idx + 1];
    
    return [
        map(lerp(c1[0], c2[0], frac), 0, 255, 0, 360),
        map(lerp(c1[1], c2[1], frac), 0, 255, 0, 100),
        map(lerp(c1[2], c2[2], frac), 0, 255, 0, 100)
    ];
}

function updateParticles() {
    particles = particles.filter(p => p.lifetime > 0);
    particles.forEach(p => {
        p.update();
        p.display();
    });
}

function updateExplosions() {
    explosions = explosions.filter(e => e.lifetime > 0);
    explosions.forEach(e => {
        e.update();
        e.display();
    });
}

function applyPostEffects() {
    // Bloom effect
    if (params.glowIntensity > 0) {
        push();
        blendMode(ADD);
        noStroke();
        fill((time * 30) % 360, 30, 50, params.glowIntensity * 10);
        translate(0, 0, -200);
        sphere(600);
        pop();
    }
}

function displayHUD() {
    push();
    resetMatrix();
    camera();
    
    // Info display
    fill(0, 0, 100);
    textAlign(LEFT, TOP);
    textSize(isMobile ? 10 : 11);
    
    let x = -width/2 + (isMobile ? 10 : 20);
    let y = -height/2 + (isMobile ? 10 : 20);
    let lineHeight = isMobile ? 13 : 15;
    
    text(`FPS: ${floor(frameRate())}`, x, y);
    text(`MODE: ${renderMode}`, x, y + lineHeight);
    
    if (!isMobile || !uiVisible) {
        text(`PARTICLES: ${particles.length}`, x, y + lineHeight * 2);
        text(`POWER: ${params.power.toFixed(1)}`, x, y + lineHeight * 3);
        text(`ITERATIONS: ${params.iterations}`, x, y + lineHeight * 4);
        
        if (audioEnabled) {
            text(`───────────`, x, y + lineHeight * 5);
            text(`AUDIO: ${(audioLevel * 100).toFixed(0)}%`, x, y + lineHeight * 6);
            text(`BASS: ${(bassLevel * 100).toFixed(0)}%`, x, y + lineHeight * 7);
        }
    }
    
    pop();
}

function createResponsiveControlPanel() {
    // Remove any existing controls
    let existingControls = select('#responsive-controls');
    if (existingControls) existingControls.remove();
    
    // Main container
    let container = createDiv('');
    container.id('responsive-controls');
    
    // Position based on device and orientation
    if (isMobile) {
        if (isLandscape) {
            // Landscape: place on right side
            container.position(windowWidth - 250, 10);
            container.style('width', '240px');
            container.style('max-height', `${windowHeight - 20}px`);
        } else {
            // Portrait: place at bottom
            container.position(10, windowHeight - 200);
            container.style('width', `${windowWidth - 20}px`);
            container.style('max-width', '400px');
            container.style('left', '50%');
            container.style('transform', 'translateX(-50%)');
        }
    } else {
        // Desktop: place on right side
        container.position(windowWidth - 280, 20);
        container.style('width', '260px');
    }
    
    container.style('background', 'rgba(0, 0, 0, 0.9)');
    container.style('backdrop-filter', 'blur(10px)');
    container.style('border', '2px solid #00ffff');
    container.style('border-radius', '15px');
    container.style('padding', isMobile ? '10px' : '20px');
    container.style('color', 'white');
    container.style('font-family', 'monospace');
    container.style('z-index', '10000');
    container.style('position', 'fixed');
    container.style('overflow-y', 'auto');
    container.style('transition', 'all 0.3s ease');
    
    // Toggle button for mobile
    let toggleBtn = createButton(uiVisible ? '✕' : '☰');
    toggleBtn.id('ui-toggle');
    toggleBtn.position(isMobile ? 10 : windowWidth - 320, isMobile ? 50 : 20);
    toggleBtn.style('position', 'fixed');
    toggleBtn.style('z-index', '10001');
    toggleBtn.style('width', '40px');
    toggleBtn.style('height', '40px');
    toggleBtn.style('border-radius', '50%');
    toggleBtn.style('background', 'rgba(0, 255, 255, 0.8)');
    toggleBtn.style('border', '2px solid #00ffff');
    toggleBtn.style('color', '#000');
    toggleBtn.style('font-size', '20px');
    toggleBtn.style('font-weight', 'bold');
    toggleBtn.style('cursor', 'pointer');
    toggleBtn.mousePressed(() => {
        uiVisible = !uiVisible;
        if (uiVisible) {
            container.style('display', 'block');
            toggleBtn.html('✕');
        } else {
            container.style('display', 'none');
            toggleBtn.html('☰');
        }
    });
    
    // Title
    let title = createDiv('🌌 MANDELBULB 🌌');
    title.parent(container);
    title.style('text-align', 'center');
    title.style('font-size', isMobile ? '14px' : '16px');
    title.style('margin-bottom', '10px');
    title.style('background', 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00)');
    title.style('background-clip', 'text');
    title.style('-webkit-background-clip', 'text');
    title.style('-webkit-text-fill-color', 'transparent');
    title.style('font-weight', 'bold');
    
    // Mode buttons (grid layout for mobile)
    createSectionTitle('MODE', container);
    
    let modes = [
        {name: 'EPIC', icon: '🌟'},
        {name: 'CLASSIC', icon: '⭐'},
        {name: 'PARTICLE', icon: '✨'},
        {name: 'QUANTUM', icon: '⚛️'},
        {name: 'MATRIX', icon: '💻'}
    ];
    
    let modeContainer = createDiv('');
    modeContainer.parent(container);
    modeContainer.style('display', 'grid');
    modeContainer.style('grid-template-columns', isMobile && !isLandscape ? '1fr 1fr 1fr' : '1fr 1fr');
    modeContainer.style('gap', '3px');
    modeContainer.style('margin-bottom', '10px');
    
    modes.forEach(mode => {
        let btn = createButton(isMobile ? mode.icon : `${mode.icon} ${mode.name}`);
        btn.parent(modeContainer);
        btn.mousePressed(() => {
            renderMode = mode.name;
            updateModeButtons();
        });
        btn.class('mode-btn');
        btn.id(`mode-${mode.name}`);
        styleButton(btn, renderMode === mode.name);
    });
    
    // Simplified controls for mobile
    if (isMobile) {
        // Essential controls only
        createSectionTitle('CONTROLS', container);
        
        let controlContainer = createDiv('');
        controlContainer.parent(container);
        controlContainer.style('display', 'grid');
        controlContainer.style('grid-template-columns', '1fr 1fr');
        controlContainer.style('gap', '5px');
        
        // Audio button
        let audioBtn = createButton('🎵');
        audioBtn.parent(controlContainer);
        audioBtn.mousePressed(() => {
            if (!audioEnabled) {
                userStartAudio();
                audioInput.start();
                audioEnabled = true;
                audioBtn.style('background', '#00ff00');
            } else {
                audioInput.stop();
                audioEnabled = false;
                audioBtn.style('background', '#222');
            }
        });
        styleButton(audioBtn);
        
        // Rotation button
        let rotateBtn = createButton('🔄');
        rotateBtn.parent(controlContainer);
        rotateBtn.mousePressed(() => {
            autoRotate = !autoRotate;
            rotateBtn.style('background', autoRotate ? '#00ff00' : '#222');
        });
        styleButton(rotateBtn, autoRotate);
        
        // Explosion button
        let explodeBtn = createButton('💥');
        explodeBtn.parent(controlContainer);
        explodeBtn.mousePressed(() => {
            createMegaExplosion();
        });
        styleButton(explodeBtn);
        
        // Reset button
        let resetBtn = createButton('↺');
        resetBtn.parent(controlContainer);
        resetBtn.mousePressed(() => {
            angle = 0;
            params.zoom = 1.0;
            params.colorShift = 0;
            particles = [];
            explosions = [];
        });
        styleButton(resetBtn);
        
        // Power slider only
        createParameterSlider('POWER', 2, 16, params.power, 0.5, container, (val) => {
            params.power = parseFloat(val);
        });
        
    } else {
        // Full controls for desktop
        
        // Color scheme selector
        createSectionTitle('COLOR', container);
        let schemeSelect = createSelect();
        schemeSelect.parent(container);
        Object.keys(colorSchemes).forEach(scheme => {
            schemeSelect.option(scheme.toUpperCase());
        });
        schemeSelect.value(currentScheme.toUpperCase());
        schemeSelect.changed(() => {
            currentScheme = schemeSelect.value().toLowerCase();
        });
        styleSelect(schemeSelect);
        
        // Parameter sliders
        createSectionTitle('PARAMETERS', container);
        
        createParameterSlider('POWER', 2, 16, params.power, 0.5, container, (val) => {
            params.power = parseFloat(val);
        });
        
        createParameterSlider('ITERATIONS', 5, 20, params.iterations, 1, container, (val) => {
            params.iterations = parseInt(val);
        });
        
        createParameterSlider('DETAIL', 20, 60, params.detail, 5, container, (val) => {
            params.detail = parseInt(val);
        });
        
        createParameterSlider('GLOW', 0, 2, params.glowIntensity, 0.1, container, (val) => {
            params.glowIntensity = parseFloat(val);
        });
        
        // Control buttons
        createSectionTitle('CONTROLS', container);
        
        let controlContainer = createDiv('');
        controlContainer.parent(container);
        controlContainer.style('display', 'flex');
        controlContainer.style('flex-direction', 'column');
        controlContainer.style('gap', '5px');
        
        // Audio button
        let audioBtn = createButton('🎵 ENABLE AUDIO');
        audioBtn.parent(controlContainer);
        audioBtn.mousePressed(() => {
            if (!audioEnabled) {
                userStartAudio();
                audioInput.start();
                audioEnabled = true;
                audioBtn.html('🔇 DISABLE AUDIO');
            } else {
                audioInput.stop();
                audioEnabled = false;
                audioBtn.html('🎵 ENABLE AUDIO');
            }
        });
        styleButton(audioBtn);
        
        // Rotation button
        let rotateBtn = createButton('🔄 AUTO-ROTATE: ON');
        rotateBtn.parent(controlContainer);
        rotateBtn.mousePressed(() => {
            autoRotate = !autoRotate;
            rotateBtn.html(autoRotate ? '🔄 AUTO-ROTATE: ON' : '🔄 AUTO-ROTATE: OFF');
        });
        styleButton(rotateBtn);
        
        // Morphing button
        let morphBtn = createButton('🌊 MORPHING: ON');
        morphBtn.parent(controlContainer);
        morphBtn.mousePressed(() => {
            params.morphing = !params.morphing;
            morphBtn.html(params.morphing ? '🌊 MORPHING: ON' : '🌊 MORPHING: OFF');
        });
        styleButton(morphBtn);
        
        // Explosion button
        let explodeBtn = createButton('💥 EXPLOSION!!!');
        explodeBtn.parent(controlContainer);
        explodeBtn.mousePressed(() => {
            createMegaExplosion();
        });
        explodeBtn.style('background', 'linear-gradient(90deg, #ff0000, #ff6600, #ffff00)');
        explodeBtn.style('font-weight', 'bold');
        styleButton(explodeBtn);
        
        // Reset button
        let resetBtn = createButton('↺ RESET VIEW');
        resetBtn.parent(controlContainer);
        resetBtn.mousePressed(() => {
            angle = 0;
            params.zoom = 1.0;
            params.colorShift = 0;
            particles = [];
            explosions = [];
        });
        styleButton(resetBtn);
    }
    
    // Add responsive CSS
    if (!select('#responsive-styles')) {
        let styles = createElement('style');
        styles.id('responsive-styles');
        styles.html(`
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            #responsive-controls button:hover {
                transform: scale(1.02);
                filter: brightness(1.2);
            }
            
            #responsive-controls input[type="range"] {
                width: 100%;
                margin: 5px 0;
            }
            
            #responsive-controls select {
                width: 100%;
            }
            
            #responsive-controls::-webkit-scrollbar {
                width: 6px;
            }
            
            #responsive-controls::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }
            
            #responsive-controls::-webkit-scrollbar-thumb {
                background: rgba(0, 255, 255, 0.5);
                border-radius: 3px;
            }
            
            @media (max-width: 768px) {
                #responsive-controls {
                    font-size: 12px;
                }
            }
        `);
        styles.parent(document.head);
    }
}

function createSectionTitle(text, parent) {
    let title = createDiv(text);
    title.parent(parent);
    title.style('color', '#00ffff');
    title.style('font-size', isMobile ? '10px' : '11px');
    title.style('margin', isMobile ? '5px 0 3px 0' : '10px 0 5px 0');
    title.style('border-bottom', '1px solid #00ffff');
    title.style('padding-bottom', '2px');
}

function createParameterSlider(label, min, max, value, step, parent, callback) {
    let group = createDiv('');
    group.parent(parent);
    group.style('margin', isMobile ? '5px 0' : '8px 0');
    
    let labelDiv = createDiv(`${label}: ${value}`);
    labelDiv.parent(group);
    labelDiv.style('font-size', isMobile ? '9px' : '10px');
    labelDiv.style('color', '#ffffff');
    labelDiv.style('margin-bottom', '2px');
    
    let slider = createSlider(min, max, value, step);
    slider.parent(group);
    slider.style('width', '100%');
    slider.input(() => {
        let val = slider.value();
        callback(val);
        labelDiv.html(`${label}: ${val}`);
    });
}

function styleButton(btn, active = false) {
    btn.style('padding', isMobile ? '6px' : '8px');
    btn.style('background', active ? '#00ff00' : '#222');
    btn.style('color', 'white');
    btn.style('border', '1px solid #00ffff');
    btn.style('border-radius', '5px');
    btn.style('cursor', 'pointer');
    btn.style('font-size', isMobile ? '10px' : '11px');
    btn.style('font-family', 'monospace');
    btn.style('transition', 'all 0.2s');
}

function styleSelect(sel) {
    sel.style('width', '100%');
    sel.style('padding', '5px');
    sel.style('background', '#222');
    sel.style('color', 'white');
    sel.style('border', '1px solid #00ffff');
    sel.style('border-radius', '5px');
    sel.style('font-family', 'monospace');
    sel.style('font-size', isMobile ? '10px' : '11px');
    sel.style('margin-bottom', '10px');
}

function updateModeButtons() {
    ['EPIC', 'CLASSIC', 'PARTICLE', 'QUANTUM', 'MATRIX'].forEach(mode => {
        let btn = select(`#mode-${mode}`);
        if (btn) {
            styleButton(btn, renderMode === mode);
        }
    });
}

function createMegaExplosion() {
    // Create multiple explosions (less on mobile)
    let explosionCount = isMobile ? 3 : 5;
    for (let i = 0; i < explosionCount; i++) {
        let angle = random(TWO_PI);
        let r = random(50, 150);
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        let z = random(-100, 100);
        
        explosions.push(new Explosion(x, y, z));
    }
    
    // Add extra particles (less on mobile)
    let particleCount = isMobile ? 20 : 50;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new SuperParticle());
    }
    
    // Flash effect
    params.glowIntensity = 3.0;
    setTimeout(() => {
        params.glowIntensity = 0.8;
    }, 300);
}

function mouseDragged() {
    if (!isMobile && mouseX < windowWidth - 300) {
        angle += (mouseX - pmouseX) * 0.01;
    }
}

function mouseWheel(event) {
    if (!isMobile && mouseX < windowWidth - 300) {
        params.zoom += event.delta * 0.0005;
        params.zoom = constrain(params.zoom, 0.3, 3);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    // Check device and orientation
    checkDevice();
    
    // Recreate controls with new layout
    createResponsiveControlPanel();
}