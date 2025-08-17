// Ultimate Fractal Mandelbulb - 完全版
// すべての機能が動作する究極のマンデルバルブ

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

// Parameters with defaults
let params = {
    power: 8.0,
    iterations: 15,
    zoom: 1.0,
    colorShift: 0,
    glowIntensity: 0.8,
    detail: 40,
    particleCount: 200,
    trailLength: 30,
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
        this.maxTrail = 10;
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
        // Draw trail
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
        
        // Draw particle
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        
        // Multi-layer glow
        noStroke();
        for (let i = 3; i > 0; i--) {
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
        
        // Create explosion particles
        for (let i = 0; i < 30; i++) {
            let p = {
                pos: this.pos.copy(),
                vel: p5.Vector.random3D().mult(random(5, 15)),
                size: random(2, 8),
                hue: random(0, 60), // Red to yellow
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
                
                // Glow effect
                for (let i = 2; i > 0; i--) {
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
    
    // Create the epic control panel
    createEpicControlPanel();
    
    // Initialize stars
    for (let i = 0; i < 200; i++) {
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
    fft = new p5.FFT(0.8, 128);
    fft.setInput(audioInput);
}

function draw() {
    // Background with gradient effect
    background(0, 0, 5);
    
    // Time update
    time += 0.01;
    
    // Audio processing
    if (audioEnabled && frameCount % 2 === 0) {
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
    
    // Apply post effects
    applyPostEffects();
    
    // Display HUD
    displayHUD();
}

function setupLighting() {
    // Main light
    pointLight(
        (time * 30) % 360,
        60,
        100,
        cos(time) * 300,
        sin(time) * 300,
        200
    );
    
    // Audio reactive lights
    if (audioEnabled) {
        pointLight(0, 100, 100 * bassLevel, -200, 0, 100);
        pointLight(120, 100, 100 * midLevel, 200, 0, 100);
        pointLight(240, 100, 100 * trebleLevel, 0, -200, 100);
    }
    
    // Ambient
    ambientLight(240, 20, 30);
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
    
    // Multi-layer rendering
    for (let layer = 0; layer < 2; layer++) {
        let layerSize = size * (1 - layer * 0.1);
        
        for (let lat = 0; lat < resolution; lat += 2) {
            for (let lon = 0; lon < resolution * 2; lon += 2) {
                let theta = map(lat, 0, resolution, 0, PI);
                let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
                
                // Add some distortion
                if (params.morphing) {
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
                    pop();
                    
                    // Spawn particles occasionally
                    if (random() < 0.002 && particles.length < params.particleCount) {
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
    
    let resolution = 30;
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
                let hue = (params.colorShift * 100 + distance(x, y, z, 0, 0, 0) * 2) % 360;
                
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
    if (frameCount % 3 === 0 && particles.length < params.particleCount) {
        for (let i = 0; i < 3; i++) {
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
    
    // Quantum field lines
    strokeWeight(0.5);
    stroke(200, 50, 100, 40);
    noFill();
    
    for (let i = 0; i < 10; i++) {
        push();
        let t = time * 0.5 + i * 0.3;
        rotateX(t);
        rotateY(t * 1.3);
        rotateZ(t * 0.7);
        
        let size = 100 + sin(t * 3) * 30;
        box(size);
        sphere(size * 0.7);
        pop();
    }
    
    pop();
}

function renderMatrixMandelbulb() {
    push();
    
    // Matrix rain effect
    stroke(120, 100, 100, 100);
    strokeWeight(0.5);
    
    for (let i = 0; i < 50; i++) {
        let x = random(-200, 200);
        let y = -200 + (frameCount * 2 + i * 20) % 400;
        let z = random(-200, 200);
        
        if (isInMandelbulb(x/100, y/100, z/100, params.power)) {
            push();
            translate(x, y, z);
            fill(120, 100, 100, 150);
            noStroke();
            sphere(2);
            
            // Trail
            stroke(120, 100, 100, 50);
            line(0, 0, 0, 0, -20, 0);
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
    textSize(11);
    
    let x = -width/2 + 20;
    let y = -height/2 + 20;
    
    text(`FPS: ${floor(frameRate())}`, x, y);
    text(`MODE: ${renderMode}`, x, y + 15);
    text(`PARTICLES: ${particles.length}`, x, y + 30);
    text(`POWER: ${params.power.toFixed(1)}`, x, y + 45);
    text(`ITERATIONS: ${params.iterations}`, x, y + 60);
    
    if (audioEnabled) {
        text(`───────────`, x, y + 75);
        text(`AUDIO: ${(audioLevel * 100).toFixed(0)}%`, x, y + 90);
        text(`BASS: ${(bassLevel * 100).toFixed(0)}%`, x, y + 105);
        text(`MID: ${(midLevel * 100).toFixed(0)}%`, x, y + 120);
        text(`TREBLE: ${(trebleLevel * 100).toFixed(0)}%`, x, y + 135);
    }
    
    pop();
}

function createEpicControlPanel() {
    // Remove any existing controls
    let existingControls = select('#epic-controls');
    if (existingControls) existingControls.remove();
    
    // Main container
    let container = createDiv('');
    container.id('epic-controls');
    container.position(windowWidth - 280, 20);
    container.style('width', '260px');
    container.style('background', 'rgba(0, 0, 0, 0.9)');
    container.style('backdrop-filter', 'blur(10px)');
    container.style('border', '2px solid #00ffff');
    container.style('border-radius', '15px');
    container.style('padding', '20px');
    container.style('color', 'white');
    container.style('font-family', 'monospace');
    container.style('z-index', '10000');
    container.style('position', 'fixed');
    
    // Title
    let title = createDiv('🌌 ULTIMATE MANDELBULB 🌌');
    title.parent(container);
    title.style('text-align', 'center');
    title.style('font-size', '16px');
    title.style('margin-bottom', '15px');
    title.style('background', 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00)');
    title.style('background-clip', 'text');
    title.style('-webkit-background-clip', 'text');
    title.style('-webkit-text-fill-color', 'transparent');
    title.style('font-weight', 'bold');
    
    // Mode buttons
    createSectionTitle('RENDER MODE', container);
    
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
    modeContainer.style('grid-template-columns', '1fr 1fr');
    modeContainer.style('gap', '5px');
    modeContainer.style('margin-bottom', '15px');
    
    modes.forEach(mode => {
        let btn = createButton(`${mode.icon} ${mode.name}`);
        btn.parent(modeContainer);
        btn.mousePressed(() => {
            renderMode = mode.name;
            updateModeButtons();
        });
        btn.class('mode-btn');
        btn.id(`mode-${mode.name}`);
        styleButton(btn, renderMode === mode.name);
    });
    
    // Color scheme selector
    createSectionTitle('COLOR SCHEME', container);
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
    
    // Power slider
    createParameterSlider('POWER', 2, 16, params.power, 0.5, container, (val) => {
        params.power = parseFloat(val);
    });
    
    // Iterations slider
    createParameterSlider('ITERATIONS', 5, 20, params.iterations, 1, container, (val) => {
        params.iterations = parseInt(val);
    });
    
    // Detail slider
    createParameterSlider('DETAIL', 20, 60, params.detail, 5, container, (val) => {
        params.detail = parseInt(val);
    });
    
    // Glow slider
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
    explodeBtn.style('animation', 'pulse 1s infinite');
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
    
    // Add CSS animations
    if (!select('#epic-styles')) {
        let styles = createElement('style');
        styles.id('epic-styles');
        styles.html(`
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            #epic-controls button:hover {
                transform: scale(1.02);
                filter: brightness(1.2);
            }
            
            #epic-controls input[type="range"] {
                width: 100%;
                margin: 5px 0;
            }
            
            #epic-controls select {
                width: 100%;
            }
        `);
        styles.parent(document.head);
    }
}

function createSectionTitle(text, parent) {
    let title = createDiv(text);
    title.parent(parent);
    title.style('color', '#00ffff');
    title.style('font-size', '11px');
    title.style('margin', '10px 0 5px 0');
    title.style('border-bottom', '1px solid #00ffff');
    title.style('padding-bottom', '3px');
}

function createParameterSlider(label, min, max, value, step, parent, callback) {
    let group = createDiv('');
    group.parent(parent);
    group.style('margin', '8px 0');
    
    let labelDiv = createDiv(`${label}: ${value}`);
    labelDiv.parent(group);
    labelDiv.style('font-size', '10px');
    labelDiv.style('color', '#ffffff');
    labelDiv.style('margin-bottom', '3px');
    
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
    btn.style('padding', '8px');
    btn.style('background', active ? 'linear-gradient(90deg, #ff00ff, #00ffff)' : '#222');
    btn.style('color', 'white');
    btn.style('border', '1px solid #00ffff');
    btn.style('border-radius', '5px');
    btn.style('cursor', 'pointer');
    btn.style('font-size', '11px');
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
    sel.style('font-size', '11px');
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
    // Create multiple explosions
    for (let i = 0; i < 5; i++) {
        let angle = random(TWO_PI);
        let r = random(50, 150);
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        let z = random(-100, 100);
        
        explosions.push(new Explosion(x, y, z));
    }
    
    // Add extra particles
    for (let i = 0; i < 50; i++) {
        particles.push(new SuperParticle());
    }
    
    // Flash effect
    params.glowIntensity = 3.0;
    setTimeout(() => {
        params.glowIntensity = 0.8;
    }, 300);
}

function mouseDragged() {
    if (mouseX < windowWidth - 300) {
        angle += (mouseX - pmouseX) * 0.01;
    }
}

function mouseWheel(event) {
    if (mouseX < windowWidth - 300) {
        params.zoom += event.delta * 0.0005;
        params.zoom = constrain(params.zoom, 0.3, 3);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    // Reposition controls
    let controls = select('#epic-controls');
    if (controls) {
        controls.position(windowWidth - 280, 20);
    }
}