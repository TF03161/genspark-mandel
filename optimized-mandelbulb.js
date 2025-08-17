// Optimized Mandelbulb Experience - 最適化版マンデルバルブ
// パフォーマンス重視・視覚的にクリーン

let renderMode = 'CLASSIC';
let angle = 0;
let stars = [];
let particles = [];
let audioInput;
let amplitude;
let fft;
let audioEnabled = false;
let audioLevel = 0;
let bassLevel = 0;
let midLevel = 0;
let trebleLevel = 0;
let autoRotate = true;
let targetFPS = 60;
let qualityMode = 'BALANCED'; // PERFORMANCE, BALANCED, QUALITY

// Optimized Parameters
let params = {
    power: 8.0,
    iterations: 8,
    zoom: 1.0,
    colorShift: 0,
    glowIntensity: 0.3,
    detail: 0.5,
    particleCount: 100,
    starCount: 100
};

// Lightweight Star class
class Star {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.z = random(0, 1000);
        this.size = random(0.5, 2);
        this.speed = random(1, 3);
    }
    
    update() {
        this.z -= this.speed + audioLevel * 5;
        if (this.z < 0) {
            this.reset();
        }
    }
    
    display() {
        let px = map(this.x / this.z, 0, 1, 0, width);
        let py = map(this.y / this.z, 0, 1, 0, height);
        let s = map(this.z, 0, 1000, this.size * 2, 0);
        
        push();
        translate(px - width/2, py - height/2);
        noStroke();
        fill(255, 255, 255, 255 - this.z * 0.25);
        circle(0, 0, s);
        pop();
    }
}

// Lightweight Particle class
class Particle {
    constructor(x, y, z) {
        this.position = createVector(x || random(-150, 150), 
                                    y || random(-150, 150), 
                                    z || random(-150, 150));
        this.velocity = p5.Vector.random3D().mult(random(0.5, 2));
        this.lifetime = 255;
        this.size = random(1, 3);
        this.hue = random(360);
    }
    
    update() {
        // Simple physics
        let gravity = p5.Vector.mult(this.position, -0.002);
        this.velocity.add(gravity);
        
        if (audioEnabled) {
            let audioForce = p5.Vector.random3D().mult(audioLevel * 2);
            this.velocity.add(audioForce);
        }
        
        this.velocity.limit(3);
        this.position.add(this.velocity);
        this.lifetime -= 2;
    }
    
    display() {
        if (this.lifetime <= 0) return;
        
        push();
        translate(this.position.x, this.position.y, this.position.z);
        noStroke();
        fill(this.hue % 360, 70, 90, this.lifetime);
        sphere(this.size);
        pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSB, 360, 100, 100, 255);
    frameRate(targetFPS);
    
    // Create simplified UI
    createSimplifiedControlPanel();
    
    // Initialize stars - reduced count
    for (let i = 0; i < params.starCount; i++) {
        stars.push(new Star());
    }
    
    // Setup audio
    audioInput = new p5.AudioIn();
    amplitude = new p5.Amplitude();
    fft = new p5.FFT(0.8, 64); // Reduced FFT bins for performance
    fft.setInput(audioInput);
    
    // Set initial quality
    updateQualitySettings('BALANCED');
}

function draw() {
    // Clear background
    background(0, 0, 5);
    
    // Audio analysis (lightweight)
    if (audioEnabled && frameCount % 2 === 0) { // Update every other frame
        audioLevel = amplitude.getLevel();
        let spectrum = fft.analyze();
        bassLevel = fft.getEnergy("bass") / 255;
        midLevel = fft.getEnergy("mid") / 255;
        trebleLevel = fft.getEnergy("treble") / 255;
        
        // Smooth audio reactive parameters
        params.glowIntensity = lerp(params.glowIntensity, 0.3 + bassLevel * 0.3, 0.1);
        params.colorShift += midLevel * 0.02;
    }
    
    // Camera setup
    let camX = sin(angle) * 300 * params.zoom;
    let camY = cos(angle * 0.7) * 150;
    let camZ = cos(angle) * 300 * params.zoom;
    camera(camX, camY, camZ + 400, 0, 0, 0, 0, 1, 0);
    
    if (autoRotate) {
        angle += 0.003 + audioLevel * 0.01;
    }
    
    // Simple lighting
    ambientLight(20, 20, 30);
    pointLight(
        (params.colorShift * 50) % 360,
        50,
        80,
        200, 0, 100
    );
    pointLight(
        (params.colorShift * 50 + 180) % 360,
        50,
        80,
        -200, 0, 100
    );
    
    // Render stars in background
    push();
    stars.forEach(star => {
        star.update();
        star.display();
    });
    pop();
    
    // Render based on mode
    push();
    switch(renderMode) {
        case 'CLASSIC':
            renderOptimizedClassic();
            break;
        case 'PARTICLE':
            renderOptimizedParticle();
            break;
        case 'QUANTUM':
            renderOptimizedQuantum();
            break;
        case 'HYBRID':
            renderOptimizedHybrid();
            break;
        default:
            renderOptimizedClassic();
    }
    pop();
    
    // Update particles (limited)
    particles = particles.filter(p => p.lifetime > 0);
    particles.forEach(p => {
        p.update();
        p.display();
    });
    
    // Limit particle count
    while (particles.length > params.particleCount) {
        particles.shift();
    }
    
    // Display info
    displayInfo();
}

function renderOptimizedClassic() {
    push();
    strokeWeight(0.5);
    
    let resolution = getResolutionForQuality();
    let size = 120;
    
    for (let lat = 0; lat < resolution; lat += 2) {
        for (let lon = 0; lon < resolution * 2; lon += 2) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            
            if (isInMandelbulbSimple(x/100, y/100, z/100)) {
                let hue = (params.colorShift * 100 + dist(x, y, z, 0, 0, 0)) % 360;
                let brightness = map(dist(x, y, z, 0, 0, 0), 0, size, 90, 60);
                
                stroke(hue, 60, brightness, 150);
                fill(hue, 50, brightness, 100);
                
                push();
                translate(x, y, z);
                box(2);
                pop();
            }
        }
    }
    pop();
}

function renderOptimizedParticle() {
    push();
    noStroke();
    
    // Spawn particles less frequently
    if (frameCount % 5 === 0 && particles.length < params.particleCount) {
        for (let i = 0; i < 2; i++) {
            let theta = random(TWO_PI);
            let phi = random(PI);
            let r = random(80, 150);
            
            let x = r * sin(phi) * cos(theta);
            let y = r * sin(phi) * sin(theta);
            let z = r * cos(phi);
            
            if (isInMandelbulbSimple(x/100, y/100, z/100)) {
                particles.push(new Particle(x, y, z));
            }
        }
    }
    
    // Simple wireframe sphere
    stroke(200, 50, 80, 50);
    noFill();
    sphere(100);
    
    pop();
}

function renderOptimizedQuantum() {
    push();
    
    // Simple quantum field visualization
    strokeWeight(0.5);
    stroke(180, 50, 80, 30);
    noFill();
    
    for (let i = 0; i < 5; i++) {
        push();
        let t = millis() * 0.0001 * (i + 1);
        rotateX(t);
        rotateY(t * 1.3);
        rotateZ(t * 0.7);
        
        let size = 80 + sin(t * 3) * 20;
        sphere(size);
        pop();
    }
    
    pop();
}

function renderOptimizedHybrid() {
    // Lightweight combination
    push();
    
    // Base shape
    renderOptimizedClassic();
    
    // Add some particles
    if (frameCount % 10 === 0 && particles.length < params.particleCount / 2) {
        particles.push(new Particle());
    }
    
    pop();
}

function isInMandelbulbSimple(x, y, z) {
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
        
        zx = zr * sin(theta) * cos(phi) + x;
        zy = zr * sin(theta) * sin(phi) + y;
        zz = zr * cos(theta) + z;
    }
    
    return true;
}

function createSimplifiedControlPanel() {
    // Create mode buttons container
    let modeContainer = createDiv('');
    modeContainer.id('mode-controls');
    modeContainer.style('position', 'fixed');
    modeContainer.style('top', '20px');
    modeContainer.style('right', '20px');
    modeContainer.style('background', 'rgba(0, 0, 0, 0.7)');
    modeContainer.style('padding', '15px');
    modeContainer.style('border-radius', '10px');
    modeContainer.style('backdrop-filter', 'blur(10px)');
    modeContainer.style('z-index', '1000');
    modeContainer.style('min-width', '180px');
    
    // Title
    let title = createDiv('✨ MANDELBULB ✨');
    title.style('font-size', '16px');
    title.style('margin-bottom', '10px');
    title.style('text-align', 'center');
    title.style('color', '#00ffff');
    title.style('font-family', 'monospace');
    title.parent(modeContainer);
    
    // Mode buttons
    let modes = ['CLASSIC', 'PARTICLE', 'QUANTUM', 'HYBRID'];
    modes.forEach(mode => {
        let btn = createButton(mode);
        btn.mousePressed(() => {
            renderMode = mode;
            updateButtonStyles();
        });
        btn.class('mode-button');
        btn.id(`btn-${mode}`);
        btn.style('display', 'block');
        btn.style('width', '100%');
        btn.style('margin', '3px 0');
        btn.style('padding', '8px');
        btn.style('background', mode === renderMode ? '#00ffff' : '#333');
        btn.style('color', mode === renderMode ? '#000' : '#fff');
        btn.style('border', '1px solid #00ffff');
        btn.style('border-radius', '5px');
        btn.style('cursor', 'pointer');
        btn.style('font-family', 'monospace');
        btn.style('font-size', '12px');
        btn.parent(modeContainer);
    });
    
    // Separator
    let sep = createDiv('');
    sep.style('height', '1px');
    sep.style('background', '#00ffff');
    sep.style('margin', '10px 0');
    sep.style('opacity', '0.3');
    sep.parent(modeContainer);
    
    // Controls
    let audioBtn = createButton('🎵 Audio: OFF');
    audioBtn.id('audio-btn');
    audioBtn.mousePressed(() => {
        if (!audioEnabled) {
            userStartAudio();
            audioInput.start();
            audioEnabled = true;
            audioBtn.html('🎵 Audio: ON');
        } else {
            audioInput.stop();
            audioEnabled = false;
            audioLevel = 0;
            audioBtn.html('🎵 Audio: OFF');
        }
    });
    styleControlButton(audioBtn);
    audioBtn.parent(modeContainer);
    
    let rotateBtn = createButton('🔄 Rotate: ON');
    rotateBtn.mousePressed(() => {
        autoRotate = !autoRotate;
        rotateBtn.html(autoRotate ? '🔄 Rotate: ON' : '🔄 Rotate: OFF');
    });
    styleControlButton(rotateBtn);
    rotateBtn.parent(modeContainer);
    
    // Quality selector
    let qualityLabel = createDiv('Quality:');
    qualityLabel.style('color', '#fff');
    qualityLabel.style('font-size', '11px');
    qualityLabel.style('margin-top', '10px');
    qualityLabel.style('font-family', 'monospace');
    qualityLabel.parent(modeContainer);
    
    let qualitySelect = createSelect();
    qualitySelect.option('PERFORMANCE');
    qualitySelect.option('BALANCED');
    qualitySelect.option('QUALITY');
    qualitySelect.value('BALANCED');
    qualitySelect.changed(() => {
        updateQualitySettings(qualitySelect.value());
    });
    qualitySelect.style('width', '100%');
    qualitySelect.style('margin-top', '5px');
    qualitySelect.style('padding', '5px');
    qualitySelect.style('background', '#222');
    qualitySelect.style('color', '#fff');
    qualitySelect.style('border', '1px solid #00ffff');
    qualitySelect.style('border-radius', '3px');
    qualitySelect.parent(modeContainer);
    
    // Reset button
    let resetBtn = createButton('↺ Reset View');
    resetBtn.mousePressed(() => {
        angle = 0;
        params.zoom = 1.0;
        params.colorShift = 0;
    });
    styleControlButton(resetBtn);
    resetBtn.style('margin-top', '10px');
    resetBtn.parent(modeContainer);
}

function styleControlButton(btn) {
    btn.style('display', 'block');
    btn.style('width', '100%');
    btn.style('margin', '3px 0');
    btn.style('padding', '6px');
    btn.style('background', '#222');
    btn.style('color', '#fff');
    btn.style('border', '1px solid #555');
    btn.style('border-radius', '3px');
    btn.style('cursor', 'pointer');
    btn.style('font-family', 'monospace');
    btn.style('font-size', '11px');
}

function updateButtonStyles() {
    let modes = ['CLASSIC', 'PARTICLE', 'QUANTUM', 'HYBRID'];
    modes.forEach(mode => {
        let btn = select(`#btn-${mode}`);
        if (btn) {
            btn.style('background', mode === renderMode ? '#00ffff' : '#333');
            btn.style('color', mode === renderMode ? '#000' : '#fff');
        }
    });
}

function updateQualitySettings(quality) {
    qualityMode = quality;
    switch(quality) {
        case 'PERFORMANCE':
            params.detail = 0.3;
            params.iterations = 6;
            params.particleCount = 50;
            params.starCount = 50;
            frameRate(30);
            break;
        case 'BALANCED':
            params.detail = 0.5;
            params.iterations = 8;
            params.particleCount = 100;
            params.starCount = 100;
            frameRate(60);
            break;
        case 'QUALITY':
            params.detail = 0.8;
            params.iterations = 12;
            params.particleCount = 200;
            params.starCount = 150;
            frameRate(60);
            break;
    }
}

function getResolutionForQuality() {
    switch(qualityMode) {
        case 'PERFORMANCE': return 20;
        case 'BALANCED': return 30;
        case 'QUALITY': return 40;
        default: return 30;
    }
}

function displayInfo() {
    push();
    resetMatrix();
    camera();
    fill(0, 0, 100);
    textAlign(LEFT, TOP);
    textSize(12);
    let x = -width/2 + 20;
    let y = -height/2 + 20;
    
    text(`FPS: ${floor(frameRate())}`, x, y);
    text(`Mode: ${renderMode}`, x, y + 15);
    text(`Quality: ${qualityMode}`, x, y + 30);
    
    if (audioEnabled) {
        text(`Audio: ${(audioLevel * 100).toFixed(0)}%`, x, y + 45);
    }
    
    pop();
}

function mouseDragged() {
    if (mouseX < width - 200) { // Don't interfere with UI
        angle += (mouseX - pmouseX) * 0.01;
    }
}

function mouseWheel(event) {
    if (mouseX < width - 200) { // Don't interfere with UI
        params.zoom += event.delta * 0.0005;
        params.zoom = constrain(params.zoom, 0.5, 2);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}