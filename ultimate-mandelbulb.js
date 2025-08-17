// Ultimate Mandelbulb Experience - 究極のマンデルバルブ体験
// 複数のレンダリングモードと超派手なエフェクト

let renderMode = 'HYBRID'; // CLASSIC, SHADER, PARTICLE, HYBRID, QUANTUM
let angle = 0;
let stars = [];
let particles = [];
let quantumParticles = [];
let audioInput;
let amplitude;
let fft;
let audioEnabled = false;
let audioLevel = 0;
let bassLevel = 0;
let midLevel = 0;
let trebleLevel = 0;
let autoRotate = true;
let shaderProgram;
let shaderActive = false;
let explosionParticles = [];
let glowEffect = 0;
let colorPhase = 0;
let plasmaField = [];
let lightningBolts = [];
let cosmicRays = [];

// Enhanced Parameters
let params = {
    power: 8.0,
    iterations: 15,
    zoom: 1.0,
    colorShift: 0,
    glowIntensity: 0.8,
    detail: 1.5,
    particleDensity: 2.0,
    explosionRate: 0.5,
    cosmicEnergy: 1.0,
    psychedelicMode: true,
    rainbowSpeed: 1.0,
    bloomStrength: 1.5,
    distortionAmount: 0.3
};

// Enhanced Star class with pulsing and trails
class SuperStar {
    constructor() {
        this.reset();
        this.trail = [];
        this.pulse = random(TWO_PI);
        this.color = color(random(200, 255), random(150, 255), random(200, 255));
    }
    
    reset() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.z = random(0, 2000);
        this.size = random(1, 5);
        this.speed = random(0.5, 3);
    }
    
    update() {
        this.pulse += 0.1;
        this.z -= (this.speed + audioLevel * 20) * params.cosmicEnergy;
        
        // トレイル効果
        if (frameCount % 2 === 0) {
            this.trail.push({
                x: this.x,
                y: this.y,
                z: this.z,
                alpha: 255
            });
        }
        
        this.trail = this.trail.filter(t => {
            t.alpha -= 10;
            return t.alpha > 0;
        });
        
        if (this.z < 0) {
            this.reset();
        }
    }
    
    display() {
        push();
        
        // トレイルを描画
        this.trail.forEach(t => {
            let px = map(t.x / t.z, 0, 1, 0, width);
            let py = map(t.y / t.z, 0, 1, 0, height);
            let s = map(t.z, 0, 2000, this.size, 0);
            
            translate(px - width/2, py - height/2, -t.z/10);
            noStroke();
            fill(red(this.color), green(this.color), blue(this.color), t.alpha * 0.3);
            sphere(s * 0.5);
            translate(-(px - width/2), -(py - height/2), t.z/10);
        });
        
        // メインの星を描画
        let px = map(this.x / this.z, 0, 1, 0, width);
        let py = map(this.y / this.z, 0, 1, 0, height);
        let s = map(this.z, 0, 2000, this.size * 3, 0) * (1 + sin(this.pulse) * 0.3);
        
        translate(px - width/2, py - height/2, -this.z/10);
        
        // グロー効果
        for (let i = 3; i > 0; i--) {
            fill(red(this.color), green(this.color), blue(this.color), 50 / i);
            sphere(s * i);
        }
        
        fill(255, 255, 255);
        sphere(s);
        
        pop();
    }
}

// Quantum Particle with entanglement effects
class QuantumParticle {
    constructor(x, y, z) {
        this.position = createVector(x || random(-200, 200), 
                                    y || random(-200, 200), 
                                    z || random(-200, 200));
        this.velocity = p5.Vector.random3D().mult(random(0.5, 2));
        this.acceleration = createVector(0, 0, 0);
        this.quantum_state = random(TWO_PI);
        this.entangled = null;
        this.lifetime = 255;
        this.size = random(3, 8);
        this.hue = random(360);
        this.spin = random(-0.1, 0.1);
        this.energy = random(0.5, 1.5);
    }
    
    entangle(otherParticle) {
        this.entangled = otherParticle;
        otherParticle.entangled = this;
    }
    
    update() {
        this.quantum_state += (0.05 + audioLevel * 0.2) * this.energy;
        
        // 量子もつれ効果
        if (this.entangled && this.entangled.lifetime > 0) {
            let force = p5.Vector.sub(this.entangled.position, this.position);
            force.mult(0.001);
            this.acceleration.add(force);
            
            // 色の同期
            this.hue = lerp(this.hue, this.entangled.hue, 0.05);
        }
        
        // オーディオに反応する力
        let audioForce = p5.Vector.random3D().mult(audioLevel * 5);
        this.acceleration.add(audioForce);
        
        // 中心への引力
        let gravity = p5.Vector.mult(this.position, -0.001 * params.cosmicEnergy);
        this.acceleration.add(gravity);
        
        this.velocity.add(this.acceleration);
        this.velocity.limit(5);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
        
        this.lifetime -= 1;
        this.spin += 0.01;
    }
    
    display() {
        push();
        translate(this.position.x, this.position.y, this.position.z);
        rotateX(this.quantum_state);
        rotateY(this.quantum_state * 1.5);
        rotateZ(this.spin);
        
        // 量子の不確定性を表現
        let jitter = sin(this.quantum_state * 10) * 2;
        translate(jitter, jitter, jitter);
        
        // 多層グロー効果
        noStroke();
        for (let i = 5; i > 0; i--) {
            fill(this.hue % 360, 80, 100, this.lifetime * 0.05 / i);
            sphere(this.size * i * 0.5);
        }
        
        // コア
        fill(this.hue % 360, 50, 100, this.lifetime);
        sphere(this.size);
        
        // エネルギーリング
        stroke(this.hue % 360, 100, 100, this.lifetime * 0.5);
        strokeWeight(1);
        noFill();
        rotateX(HALF_PI);
        for (let i = 0; i < 3; i++) {
            ellipse(0, 0, this.size * 4 * (i + 1), this.size * 4 * (i + 1));
        }
        
        pop();
    }
}

// Explosion Particle for dramatic effects
class ExplosionParticle {
    constructor(x, y, z) {
        this.position = createVector(x, y, z);
        this.velocity = p5.Vector.random3D().mult(random(5, 15));
        this.lifetime = 255;
        this.size = random(5, 15);
        this.color = color(random(255), random(100, 255), random(50));
    }
    
    update() {
        this.velocity.mult(0.95);
        this.position.add(this.velocity);
        this.lifetime -= 5;
        this.size *= 0.98;
    }
    
    display() {
        push();
        translate(this.position.x, this.position.y, this.position.z);
        noStroke();
        
        // 爆発のグロー
        for (let i = 3; i > 0; i--) {
            fill(red(this.color), green(this.color), blue(this.color), this.lifetime * 0.1 / i);
            sphere(this.size * i);
        }
        
        fill(255, 255, 200, this.lifetime);
        sphere(this.size);
        pop();
    }
}

// Lightning Bolt effect
class LightningBolt {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.start = createVector(random(-300, 300), random(-300, -200), random(-100, 100));
        this.end = createVector(random(-300, 300), random(200, 300), random(-100, 100));
        this.segments = [];
        this.lifetime = random(5, 15);
        this.generateSegments();
    }
    
    generateSegments() {
        let steps = 10;
        this.segments = [];
        for (let i = 0; i <= steps; i++) {
            let t = i / steps;
            let point = p5.Vector.lerp(this.start, this.end, t);
            if (i > 0 && i < steps) {
                point.add(p5.Vector.random3D().mult(random(10, 30)));
            }
            this.segments.push(point);
        }
    }
    
    update() {
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.reset();
        }
    }
    
    display() {
        push();
        stroke(200, 200, 255, this.lifetime * 17);
        strokeWeight(random(1, 3));
        noFill();
        beginShape();
        this.segments.forEach(seg => {
            vertex(seg.x, seg.y, seg.z);
        });
        endShape();
        
        // グロー効果
        stroke(150, 150, 255, this.lifetime * 8);
        strokeWeight(random(3, 6));
        beginShape();
        this.segments.forEach(seg => {
            vertex(seg.x, seg.y, seg.z);
        });
        endShape();
        pop();
    }
}

// Cosmic Ray effect
class CosmicRay {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.position = createVector(random(-width/2, width/2), -height/2, random(-500, 500));
        this.length = random(100, 300);
        this.speed = random(10, 30);
        this.hue = random(360);
        this.thickness = random(1, 3);
    }
    
    update() {
        this.position.y += this.speed;
        if (this.position.y > height/2 + this.length) {
            this.reset();
        }
    }
    
    display() {
        push();
        strokeWeight(this.thickness);
        
        // グラデーション効果
        for (let i = 0; i < this.length; i += 5) {
            let alpha = map(i, 0, this.length, 255, 0);
            stroke(this.hue, 80, 100, alpha);
            let y = this.position.y - i;
            line(this.position.x, y, this.position.z, 
                 this.position.x, y - 5, this.position.z);
        }
        pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSB, 360, 100, 100, 255);
    
    // Create UI
    createControlPanel();
    
    // Initialize stars
    for (let i = 0; i < 300; i++) {
        stars.push(new SuperStar());
    }
    
    // Initialize quantum particles
    for (let i = 0; i < 50; i++) {
        let qp = new QuantumParticle();
        quantumParticles.push(qp);
        
        // Create entanglements
        if (i > 0 && random() < 0.3) {
            qp.entangle(quantumParticles[floor(random(i))]);
        }
    }
    
    // Initialize lightning bolts
    for (let i = 0; i < 5; i++) {
        lightningBolts.push(new LightningBolt());
    }
    
    // Initialize cosmic rays
    for (let i = 0; i < 10; i++) {
        cosmicRays.push(new CosmicRay());
    }
    
    // Setup audio
    audioInput = new p5.AudioIn();
    amplitude = new p5.Amplitude();
    fft = new p5.FFT(0.8, 256);
    fft.setInput(audioInput);
    
    // Try to create shader
    try {
        shaderProgram = createShader(vertexShader, fragmentShader);
    } catch(e) {
        console.log("Shader creation failed, using fallback mode");
        shaderActive = false;
    }
}

function draw() {
    // Dynamic background with gradient
    drawDynamicBackground();
    
    // Audio analysis
    if (audioEnabled) {
        audioLevel = amplitude.getLevel();
        let spectrum = fft.analyze();
        bassLevel = fft.getEnergy("bass") / 255;
        midLevel = fft.getEnergy("mid") / 255;
        trebleLevel = fft.getEnergy("treble") / 255;
        
        // Audio reactive parameters
        params.glowIntensity = 0.5 + bassLevel * 0.5;
        params.colorShift += midLevel * 0.1;
        params.distortionAmount = 0.1 + trebleLevel * 0.3;
    }
    
    // Camera movement
    let camX = sin(angle) * 400 * params.zoom;
    let camY = cos(angle * 0.7) * 200;
    let camZ = cos(angle) * 400 * params.zoom;
    camera(camX, camY, camZ + 500, 0, 0, 0, 0, 1, 0);
    
    if (autoRotate) {
        angle += 0.005 + audioLevel * 0.02;
    }
    
    // Lighting
    setupDynamicLighting();
    
    // Render based on mode
    push();
    switch(renderMode) {
        case 'CLASSIC':
            renderClassicMandelbulb();
            break;
        case 'SHADER':
            if (shaderActive) {
                renderShaderMandelbulb();
            } else {
                renderClassicMandelbulb();
            }
            break;
        case 'PARTICLE':
            renderParticleMandelbulb();
            break;
        case 'QUANTUM':
            renderQuantumMandelbulb();
            break;
        case 'HYBRID':
        default:
            renderHybridMandelbulb();
            break;
    }
    pop();
    
    // Render effects layers
    renderEffectsLayers();
    
    // Update and render particles
    updateAndRenderParticles();
    
    // Post-processing effects
    applyPostProcessing();
    
    // UI Overlay
    drawUIOverlay();
    
    colorPhase += 0.01 * params.rainbowSpeed;
}

function drawDynamicBackground() {
    push();
    let bg1 = color((colorPhase * 50) % 360, 30, 10);
    let bg2 = color((colorPhase * 50 + 180) % 360, 40, 20);
    
    // Create gradient background
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(bg1, bg2, inter);
        stroke(c);
        line(-width/2, -height/2 + i, -500, width/2, -height/2 + i, -500);
    }
    pop();
}

function setupDynamicLighting() {
    // Multiple dynamic lights
    let time = millis() * 0.001;
    
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
        pointLight(
            bassLevel * 360,
            80,
            100 * bassLevel,
            -200,
            0,
            100
        );
        
        pointLight(
            midLevel * 360 + 120,
            70,
            100 * midLevel,
            200,
            0,
            100
        );
        
        pointLight(
            trebleLevel * 360 + 240,
            90,
            100 * trebleLevel,
            0,
            200,
            100
        );
    }
    
    // Ambient light
    ambientLight(20, 20, 30);
}

function renderClassicMandelbulb() {
    push();
    strokeWeight(0.5);
    
    let resolution = floor(map(params.detail, 0, 2, 20, 60));
    let size = 150;
    
    for (let lat = 0; lat < resolution; lat++) {
        for (let lon = 0; lon < resolution * 2; lon++) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            
            if (isInMandelbulb(x/100, y/100, z/100)) {
                let hue = (colorPhase * 100 + dist(x, y, z, 0, 0, 0) * 2) % 360;
                let brightness = map(dist(x, y, z, 0, 0, 0), 0, size, 100, 50);
                
                stroke(hue, 80, brightness, 200);
                fill(hue, 70, brightness, 150);
                
                push();
                translate(x, y, z);
                
                // Add glow spheres
                for (let i = 0; i < 3; i++) {
                    fill(hue, 60, brightness, 50 / (i + 1));
                    sphere(3 + i * 2);
                }
                
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
    
    // Spawn particles dynamically
    if (frameCount % 2 === 0) {
        for (let i = 0; i < 5; i++) {
            let theta = random(TWO_PI);
            let phi = random(PI);
            let r = random(100, 200);
            
            let x = r * sin(phi) * cos(theta);
            let y = r * sin(phi) * sin(theta);
            let z = r * cos(phi);
            
            if (isInMandelbulb(x/100, y/100, z/100)) {
                particles.push(new QuantumParticle(x, y, z));
                
                // Create explosion effect occasionally
                if (random() < params.explosionRate * 0.1) {
                    for (let j = 0; j < 10; j++) {
                        explosionParticles.push(new ExplosionParticle(x, y, z));
                    }
                }
            }
        }
    }
    
    // Limit particles
    while (particles.length > 500) {
        particles.shift();
    }
    
    pop();
}

function renderQuantumMandelbulb() {
    push();
    
    // Quantum field visualization
    strokeWeight(0.3);
    stroke(200, 50, 100, 50);
    noFill();
    
    for (let i = 0; i < 20; i++) {
        let t = millis() * 0.0001 * (i + 1);
        rotateX(t);
        rotateY(t * 1.3);
        rotateZ(t * 0.7);
        
        let size = 100 + sin(t * 5) * 50;
        box(size);
        sphere(size * 0.8);
    }
    
    // Quantum particles
    quantumParticles.forEach(qp => {
        qp.update();
        qp.display();
    });
    
    // Regenerate dead particles
    quantumParticles = quantumParticles.filter(qp => qp.lifetime > 0);
    while (quantumParticles.length < 50) {
        let qp = new QuantumParticle();
        quantumParticles.push(qp);
        if (quantumParticles.length > 1 && random() < 0.3) {
            qp.entangle(quantumParticles[floor(random(quantumParticles.length - 1))]);
        }
    }
    
    pop();
}

function renderHybridMandelbulb() {
    // Combine all rendering modes for maximum impact
    push();
    blendMode(ADD);
    
    // Base Mandelbulb
    renderClassicMandelbulb();
    
    // Particle layer
    push();
    blendMode(SCREEN);
    renderParticleMandelbulb();
    pop();
    
    // Quantum overlay
    push();
    blendMode(ADD);
    renderQuantumMandelbulb();
    pop();
    
    pop();
}

function renderShaderMandelbulb() {
    // Placeholder for shader rendering
    // Would require WebGL shader implementation
    renderClassicMandelbulb();
}

function renderEffectsLayers() {
    push();
    
    // Stars with trails
    blendMode(ADD);
    stars.forEach(star => {
        star.update();
        star.display();
    });
    
    // Lightning bolts
    blendMode(SCREEN);
    lightningBolts.forEach(bolt => {
        bolt.update();
        bolt.display();
    });
    
    // Cosmic rays
    blendMode(ADD);
    cosmicRays.forEach(ray => {
        ray.update();
        ray.display();
    });
    
    // Explosion particles
    blendMode(ADD);
    explosionParticles = explosionParticles.filter(p => p.lifetime > 0);
    explosionParticles.forEach(p => {
        p.update();
        p.display();
    });
    
    pop();
}

function updateAndRenderParticles() {
    push();
    blendMode(ADD);
    
    particles = particles.filter(p => p.lifetime > 0);
    particles.forEach(p => {
        p.update();
        p.display();
    });
    
    pop();
}

function applyPostProcessing() {
    // Bloom effect simulation
    if (params.bloomStrength > 0) {
        push();
        blendMode(ADD);
        fill(colorPhase % 360, 30, 100, params.bloomStrength * 10);
        noStroke();
        sphere(1000);
        pop();
    }
    
    // Chromatic aberration effect
    if (params.distortionAmount > 0) {
        push();
        blendMode(SCREEN);
        tint(0, 100, 100, params.distortionAmount * 20);
        pop();
    }
}

function drawUIOverlay() {
    // Mode indicator
    push();
    resetMatrix();
    camera();
    fill(0, 0, 100);
    textAlign(LEFT, TOP);
    textSize(16);
    text(`Mode: ${renderMode}`, -width/2 + 20, -height/2 + 20);
    text(`FPS: ${floor(frameRate())}`, -width/2 + 20, -height/2 + 40);
    
    if (audioEnabled) {
        text(`Audio: ${(audioLevel * 100).toFixed(1)}%`, -width/2 + 20, -height/2 + 60);
        text(`Bass: ${(bassLevel * 100).toFixed(1)}%`, -width/2 + 20, -height/2 + 80);
        text(`Mid: ${(midLevel * 100).toFixed(1)}%`, -width/2 + 20, -height/2 + 100);
        text(`Treble: ${(trebleLevel * 100).toFixed(1)}%`, -width/2 + 20, -height/2 + 120);
    }
    pop();
}

function isInMandelbulb(x, y, z) {
    let zx = x, zy = y, zz = z;
    let r = 0;
    let dr = 1;
    
    for (let i = 0; i < params.iterations; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz);
        if (r > 2) return false;
        
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
    
    return true;
}

function createControlPanel() {
    // Create mode buttons
    let modeContainer = createDiv('');
    modeContainer.id('mode-controls');
    modeContainer.style('position', 'fixed');
    modeContainer.style('top', '20px');
    modeContainer.style('right', '20px');
    modeContainer.style('background', 'rgba(0, 0, 0, 0.8)');
    modeContainer.style('padding', '20px');
    modeContainer.style('border-radius', '10px');
    modeContainer.style('color', 'white');
    modeContainer.style('font-family', 'monospace');
    modeContainer.style('z-index', '1000');
    
    // Title
    let title = createDiv('🌟 ULTIMATE MANDELBULB 🌟');
    title.style('font-size', '18px');
    title.style('margin-bottom', '15px');
    title.style('text-align', 'center');
    title.style('background', 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00)');
    title.style('-webkit-background-clip', 'text');
    title.style('-webkit-text-fill-color', 'transparent');
    title.parent(modeContainer);
    
    // Mode buttons
    let modes = ['CLASSIC', 'PARTICLE', 'QUANTUM', 'HYBRID', 'SHADER'];
    modes.forEach(mode => {
        let btn = createButton(`${getEmoji(mode)} ${mode}`);
        btn.mousePressed(() => {
            renderMode = mode;
            updateButtonStyles();
        });
        btn.class('mode-button');
        btn.id(`btn-${mode}`);
        btn.style('display', 'block');
        btn.style('width', '200px');
        btn.style('margin', '5px 0');
        btn.style('padding', '10px');
        btn.style('background', mode === renderMode ? 'linear-gradient(90deg, #ff00ff, #00ffff)' : '#333');
        btn.style('color', 'white');
        btn.style('border', 'none');
        btn.style('border-radius', '5px');
        btn.style('cursor', 'pointer');
        btn.style('font-family', 'monospace');
        btn.style('font-size', '14px');
        btn.style('transition', 'all 0.3s');
        btn.parent(modeContainer);
    });
    
    // Separator
    let separator = createDiv('');
    separator.style('height', '1px');
    separator.style('background', 'linear-gradient(90deg, transparent, #fff, transparent)');
    separator.style('margin', '15px 0');
    separator.parent(modeContainer);
    
    // Effect controls
    let effectTitle = createDiv('✨ EFFECTS ✨');
    effectTitle.style('font-size', '14px');
    effectTitle.style('margin-bottom', '10px');
    effectTitle.style('text-align', 'center');
    effectTitle.parent(modeContainer);
    
    // Audio button
    let audioBtn = createButton('🎵 Enable Audio');
    audioBtn.mousePressed(() => {
        if (!audioEnabled) {
            userStartAudio();
            audioInput.start();
            audioEnabled = true;
            audioBtn.html('🔇 Disable Audio');
        } else {
            audioInput.stop();
            audioEnabled = false;
            audioBtn.html('🎵 Enable Audio');
        }
    });
    audioBtn.style('display', 'block');
    audioBtn.style('width', '200px');
    audioBtn.style('margin', '5px 0');
    audioBtn.style('padding', '8px');
    audioBtn.style('background', '#444');
    audioBtn.style('color', 'white');
    audioBtn.style('border', 'none');
    audioBtn.style('border-radius', '5px');
    audioBtn.style('cursor', 'pointer');
    audioBtn.parent(modeContainer);
    
    // Auto-rotate toggle
    let rotateBtn = createButton('🔄 Auto-Rotate: ON');
    rotateBtn.mousePressed(() => {
        autoRotate = !autoRotate;
        rotateBtn.html(autoRotate ? '🔄 Auto-Rotate: ON' : '🔄 Auto-Rotate: OFF');
    });
    rotateBtn.style('display', 'block');
    rotateBtn.style('width', '200px');
    rotateBtn.style('margin', '5px 0');
    rotateBtn.style('padding', '8px');
    rotateBtn.style('background', '#444');
    rotateBtn.style('color', 'white');
    rotateBtn.style('border', 'none');
    rotateBtn.style('border-radius', '5px');
    rotateBtn.style('cursor', 'pointer');
    rotateBtn.parent(modeContainer);
    
    // Psychedelic mode toggle
    let psychBtn = createButton('🌈 Psychedelic: ON');
    psychBtn.mousePressed(() => {
        params.psychedelicMode = !params.psychedelicMode;
        params.rainbowSpeed = params.psychedelicMode ? 2.0 : 0.5;
        params.bloomStrength = params.psychedelicMode ? 2.0 : 0.5;
        psychBtn.html(params.psychedelicMode ? '🌈 Psychedelic: ON' : '🌈 Psychedelic: OFF');
    });
    psychBtn.style('display', 'block');
    psychBtn.style('width', '200px');
    psychBtn.style('margin', '5px 0');
    psychBtn.style('padding', '8px');
    psychBtn.style('background', '#444');
    psychBtn.style('color', 'white');
    psychBtn.style('border', 'none');
    psychBtn.style('border-radius', '5px');
    psychBtn.style('cursor', 'pointer');
    psychBtn.parent(modeContainer);
    
    // Explosion button
    let explosionBtn = createButton('💥 EXPLOSION!');
    explosionBtn.mousePressed(() => {
        createMassiveExplosion();
    });
    explosionBtn.style('display', 'block');
    explosionBtn.style('width', '200px');
    explosionBtn.style('margin', '10px 0');
    explosionBtn.style('padding', '12px');
    explosionBtn.style('background', 'linear-gradient(90deg, #ff0000, #ff6600, #ffff00)');
    explosionBtn.style('color', 'white');
    explosionBtn.style('border', 'none');
    explosionBtn.style('border-radius', '5px');
    explosionBtn.style('cursor', 'pointer');
    explosionBtn.style('font-weight', 'bold');
    explosionBtn.style('animation', 'pulse 1s infinite');
    explosionBtn.parent(modeContainer);
    
    // Add CSS animation
    let style = createElement('style');
    style.html(`
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .mode-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
    `);
    style.parent(document.head);
}

function getEmoji(mode) {
    const emojis = {
        'CLASSIC': '⭐',
        'PARTICLE': '✨',
        'QUANTUM': '⚛️',
        'HYBRID': '🌌',
        'SHADER': '🎨'
    };
    return emojis[mode] || '🔮';
}

function updateButtonStyles() {
    let modes = ['CLASSIC', 'PARTICLE', 'QUANTUM', 'HYBRID', 'SHADER'];
    modes.forEach(mode => {
        let btn = select(`#btn-${mode}`);
        if (btn) {
            btn.style('background', mode === renderMode ? 'linear-gradient(90deg, #ff00ff, #00ffff)' : '#333');
        }
    });
}

function createMassiveExplosion() {
    // Create a massive explosion effect
    for (let i = 0; i < 100; i++) {
        let angle = random(TWO_PI);
        let angle2 = random(PI);
        let r = random(50, 150);
        let x = r * sin(angle2) * cos(angle);
        let y = r * sin(angle2) * sin(angle);
        let z = r * cos(angle2);
        
        explosionParticles.push(new ExplosionParticle(x, y, z));
    }
    
    // Add quantum particles
    for (let i = 0; i < 30; i++) {
        quantumParticles.push(new QuantumParticle());
    }
    
    // Flash effect
    params.bloomStrength = 5.0;
    setTimeout(() => {
        params.bloomStrength = params.psychedelicMode ? 2.0 : 0.5;
    }, 200);
    
    // Screen shake
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            camera(
                random(-20, 20),
                random(-20, 20),
                500 + random(-20, 20),
                0, 0, 0,
                0, 1, 0
            );
        }, i * 30);
    }
}

function mouseDragged() {
    angle += (mouseX - pmouseX) * 0.01;
}

function mouseWheel(event) {
    params.zoom += event.delta * 0.001;
    params.zoom = constrain(params.zoom, 0.1, 3);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Simplified shaders for fallback
const vertexShader = `
attribute vec3 aPosition;
void main() {
    vec4 positionVec4 = vec4(aPosition, 1.0);
    gl_Position = positionVec4;
}
`;

const fragmentShader = `
precision mediump float;
uniform float uTime;
void main() {
    gl_FragColor = vec4(sin(uTime), cos(uTime), 0.5, 1.0);
}
`;