// Working Mandelbulb with Space Environment
// 動作確認済みバージョン

let angle = 0;
let stars = [];
let particles = [];
let audioInput;
let amplitude;
let audioEnabled = false;
let audioLevel = 0;
let autoRotate = true;

// Parameters
let params = {
    power: 8.0,
    iterations: 8,
    zoom: 1.0,
    colorShift: 0,
    glowIntensity: 0.5,
    detail: 1.0
};

// Star class
class Star {
    constructor() {
        this.x = random(-width/2, width/2);
        this.y = random(-height/2, height/2);
        this.z = random(0, 1000);
        this.size = random(1, 3);
    }
    
    update() {
        this.z -= 2 + audioLevel * 10;
        if (this.z < 0) {
            this.z = 1000;
            this.x = random(-width/2, width/2);
            this.y = random(-height/2, height/2);
        }
    }
    
    display() {
        push();
        let px = map(this.x / this.z, 0, 1, 0, width);
        let py = map(this.y / this.z, 0, 1, 0, height);
        let s = map(this.z, 0, 1000, this.size * 2, 0);
        
        translate(px - width/2, py - height/2);
        noStroke();
        fill(255, 255, 255, 255 - this.z * 0.25);
        circle(0, 0, s);
        pop();
    }
}

// Particle class
class Particle {
    constructor() {
        this.x = random(-200, 200);
        this.y = random(-200, 200);
        this.z = random(-200, 200);
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, 0.5);
        this.vz = random(-0.5, 0.5);
        this.hue = random(180, 300);
        this.size = random(1, 3);
    }
    
    update() {
        this.x += this.vx + audioLevel * random(-2, 2);
        this.y += this.vy + audioLevel * random(-2, 2);
        this.z += this.vz;
        
        if (abs(this.x) > 300) this.vx *= -1;
        if (abs(this.y) > 300) this.vy *= -1;
        if (abs(this.z) > 300) this.vz *= -1;
    }
    
    display() {
        push();
        translate(this.x, this.y, this.z);
        noStroke();
        fill(this.hue, 80, 100, 150);
        sphere(this.size * (1 + audioLevel * 2));
        pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSB, 360, 100, 100, 255);
    
    // Initialize audio
    amplitude = new p5.Amplitude();
    
    // Create stars
    for (let i = 0; i < 200; i++) {
        stars.push(new Star());
    }
    
    // Create particles
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
    
    // Setup UI
    setupUI();
    
    // Hide loading
    let loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function draw() {
    background(0, 0, 5);
    
    // Get audio level
    if (audioEnabled && amplitude) {
        audioLevel = amplitude.getLevel();
    } else {
        // Simulate audio
        audioLevel = (sin(frameCount * 0.01) * 0.5 + 0.5) * 0.2;
    }
    
    // Draw stars
    push();
    for (let star of stars) {
        star.update();
        star.display();
    }
    pop();
    
    // Camera rotation
    if (autoRotate) {
        angle += 0.003;
    }
    
    // Apply zoom
    scale(params.zoom);
    
    // Rotate view
    rotateY(angle);
    rotateX(sin(frameCount * 0.001) * 0.1);
    
    // Lighting
    ambientLight(200, 20, 30);
    
    let lightHue = (frameCount * 0.5 + params.colorShift * 57.3) % 360;
    pointLight(lightHue, 80, 100, 200, 100, 0);
    pointLight((lightHue + 180) % 360, 80, 100, -200, -100, 0);
    
    // Draw Mandelbulb
    drawMandelbulb();
    
    // Draw particles
    push();
    for (let particle of particles) {
        particle.update();
        particle.display();
    }
    pop();
    
    // Update stats
    if (frameCount % 10 === 0) {
        updateStats();
    }
}

function drawMandelbulb() {
    strokeWeight(1);
    
    let detail = floor(map(params.detail, 0.1, 1, 10, 25));
    let step = PI / detail;
    
    for (let theta = 0; theta < PI; theta += step) {
        for (let phi = 0; phi < TWO_PI; phi += step * 2) {
            let r = 1.5;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            
            if (isInMandelbulb(x, y, z)) {
                push();
                translate(x * 100, y * 100, z * 100);
                
                // Psychedelic colors
                let hue = (theta * 57 + phi * 28 + frameCount * 0.5 + params.colorShift * 57.3) % 360;
                
                // Apply glow
                if (params.glowIntensity > 0) {
                    fill(hue, 70, 100, 100 * params.glowIntensity);
                    noStroke();
                    sphere(5);
                }
                
                fill(hue, 80, 90, 200);
                stroke(hue, 100, 100, 100);
                
                let size = 3 + sin(frameCount * 0.02 + theta + phi) * 1 + audioLevel * 5;
                sphere(size);
                
                pop();
            }
        }
    }
    
    // Central core
    push();
    let coreSize = 20 + sin(frameCount * 0.02) * 10 + audioLevel * 30;
    fill(0, 0, 100, 100);
    noStroke();
    sphere(coreSize);
    
    // Glow layers
    for (let i = 3; i > 0; i--) {
        fill((frameCount + i * 40) % 360, 60, 100, 20);
        sphere(coreSize * (1 + i * 0.3));
    }
    pop();
}

function isInMandelbulb(x, y, z) {
    let zx = x, zy = y, zz = z;
    let r = 0;
    
    for (let i = 0; i < params.iterations; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz);
        if (r > 2) return false;
        
        let theta = atan2(sqrt(zx * zx + zy * zy), zz);
        let phi = atan2(zy, zx);
        
        let rPower = pow(r, params.power);
        theta *= params.power;
        phi *= params.power;
        
        zx = rPower * sin(theta) * cos(phi) + x;
        zy = rPower * sin(theta) * sin(phi) + y;
        zz = rPower * cos(theta) + z;
    }
    
    return true;
}

function setupUI() {
    // Power slider
    let powerSlider = document.getElementById('power');
    if (powerSlider) {
        powerSlider.addEventListener('input', function() {
            params.power = parseFloat(this.value);
            document.getElementById('power-value').textContent = this.value;
        });
    }
    
    // Iterations slider
    let iterSlider = document.getElementById('iterations');
    if (iterSlider) {
        iterSlider.addEventListener('input', function() {
            params.iterations = parseInt(this.value);
            document.getElementById('iterations-value').textContent = this.value;
        });
    }
    
    // Detail slider
    let detailSlider = document.getElementById('detail');
    if (detailSlider) {
        detailSlider.addEventListener('input', function() {
            params.detail = parseFloat(this.value);
            document.getElementById('detail-value').textContent = parseFloat(this.value).toFixed(2);
        });
    }
    
    // Color shift slider
    let colorSlider = document.getElementById('colorshift');
    if (colorSlider) {
        colorSlider.addEventListener('input', function() {
            params.colorShift = parseFloat(this.value);
            document.getElementById('colorshift-value').textContent = parseFloat(this.value).toFixed(2);
        });
    }
    
    // Glow slider
    let glowSlider = document.getElementById('glow');
    if (glowSlider) {
        glowSlider.addEventListener('input', function() {
            params.glowIntensity = parseFloat(this.value);
            document.getElementById('glow-value').textContent = parseFloat(this.value).toFixed(2);
        });
    }
    
    // Zoom slider
    let zoomSlider = document.getElementById('zoom');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', function() {
            params.zoom = parseFloat(this.value);
            document.getElementById('zoom-value').textContent = parseFloat(this.value).toFixed(1);
        });
    }
    
    // Audio toggle
    let audioBtn = document.getElementById('audio-toggle');
    if (audioBtn) {
        audioBtn.addEventListener('click', function() {
            if (!audioEnabled) {
                audioInput = new p5.AudioIn();
                audioInput.start();
                amplitude.setInput(audioInput);
                audioEnabled = true;
                this.textContent = '🔇 Audio OFF';
                this.classList.add('active');
            } else {
                if (audioInput) {
                    audioInput.stop();
                }
                audioEnabled = false;
                this.textContent = '🎵 Audio ON';
                this.classList.remove('active');
            }
        });
    }
    
    // Auto rotate
    let rotateBtn = document.getElementById('auto-rotate');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', function() {
            autoRotate = !autoRotate;
            this.textContent = autoRotate ? '⏸️ Pause' : '▶️ Play';
            this.classList.toggle('active');
        });
    }
    
    // Screenshot
    let screenshotBtn = document.getElementById('screenshot');
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', function() {
            saveCanvas('mandelbulb-' + Date.now(), 'png');
        });
    }
    
    // Fullscreen
    let fullscreenBtn = document.getElementById('fullscreen');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
    }
    
    // Reset
    let resetBtn = document.getElementById('reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            params.power = 8;
            params.iterations = 8;
            params.detail = 1;
            params.colorShift = 0;
            params.glowIntensity = 0.5;
            params.zoom = 1;
            angle = 0;
            
            // Reset sliders
            document.getElementById('power').value = 8;
            document.getElementById('iterations').value = 8;
            document.getElementById('detail').value = 1;
            document.getElementById('colorshift').value = 0;
            document.getElementById('glow').value = 0.5;
            document.getElementById('zoom').value = 1;
            
            // Update displays
            document.getElementById('power-value').textContent = '8.0';
            document.getElementById('iterations-value').textContent = '8';
            document.getElementById('detail-value').textContent = '1.00';
            document.getElementById('colorshift-value').textContent = '0.00';
            document.getElementById('glow-value').textContent = '0.50';
            document.getElementById('zoom-value').textContent = '1.0';
        });
    }
}

function updateStats() {
    let fps = document.getElementById('fps');
    if (fps) {
        fps.textContent = floor(frameRate());
    }
    
    let mode = document.getElementById('mode');
    if (mode) {
        mode.textContent = audioEnabled ? 'Audio' : 'Visual';
    }
    
    let quality = document.getElementById('quality');
    if (quality) {
        quality.textContent = params.detail > 0.7 ? 'High' : params.detail > 0.4 ? 'Medium' : 'Low';
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mouseWheel(event) {
    params.zoom += event.delta * -0.0005;
    params.zoom = constrain(params.zoom, 0.5, 3);
    
    let zoomSlider = document.getElementById('zoom');
    if (zoomSlider) {
        zoomSlider.value = params.zoom;
        document.getElementById('zoom-value').textContent = params.zoom.toFixed(1);
    }
    
    return false;
}