// Ultimate Mandelbulb Explorer with Full Space Environment
// 究極のマンデルバルブ - 完全な宇宙環境

let shader;
let audioInput;
let fft;
let amplitude;
let audioEnabled = false;
let stars = [];
let nebulaClouds = [];
let particles = [];
let quantumParticles = [];
let autoRotate = true;

// Parameters
let params = {
    power: 8.0,
    iterations: 16,
    detail: 0.8,
    colorShift: 0.0,
    glowIntensity: 0.5,
    zoom: 3.0,
    time: 0,
    cameraAngle: 0,
    audioReactivity: 1.0,
    bassEnergy: 0,
    midEnergy: 0,
    trebleEnergy: 0,
    audioLevel: 0
};

// Simple vertex shader without any diagonal lines
const vertShader = `
attribute vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition * 2.0 - 1.0, 1.0);
}
`;

// Enhanced fragment shader with space and audio
const fragShader = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uPower;
uniform int uIterations;
uniform vec3 uCameraPos;
uniform float uColorShift;
uniform float uGlowIntensity;
uniform float uDetail;
uniform float uAudioLevel;
uniform float uBassEnergy;
uniform float uMidEnergy;
uniform float uTrebleEnergy;

const float MAX_DIST = 20.0;
const int MAX_STEPS = 128;
const float SURF_DIST = 0.001;

// Mandelbulb Distance Estimator
float mandelbulbDE(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    float power = uPower + sin(uTime * 0.5 + uBassEnergy * 5.0) * uBassEnergy;
    
    for(int i = 0; i < 16; i++) {
        if(i >= uIterations) break;
        
        r = length(z);
        if(r > 2.0) break;
        
        float theta = acos(clamp(z.z/r, -1.0, 1.0));
        float phi = atan(z.y, z.x);
        
        // Audio modulation
        theta += uMidEnergy * 0.1 * sin(uTime * 2.0);
        phi += uTrebleEnergy * 0.1 * cos(uTime * 3.0);
        
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        
        float zr = pow(r, power);
        theta *= power;
        phi *= power;
        
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(theta) * sin(phi),
            cos(theta)
        );
        z += pos;
    }
    
    return 0.5 * log(r) * r / dr;
}

// Normal calculation
vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        mandelbulbDE(p + e.xyy) - mandelbulbDE(p - e.xyy),
        mandelbulbDE(p + e.yxy) - mandelbulbDE(p - e.yxy),
        mandelbulbDE(p + e.yyx) - mandelbulbDE(p - e.yyx)
    ));
}

// Psychedelic colors
vec3 getColor(float t, vec3 pos) {
    vec3 col1 = vec3(0.1, 0.9, 0.4);
    vec3 col2 = vec3(1.0, 0.3, 0.7);
    vec3 col3 = vec3(1.0, 0.9, 0.1);
    vec3 col4 = vec3(0.3, 0.7, 1.0);
    
    float m1 = sin(t * 5.0 + uColorShift + uTime * 0.5) * 0.5 + 0.5;
    float m2 = cos(t * 3.0 + pos.x * 2.0) * 0.5 + 0.5;
    float m3 = sin(pos.y * 3.0 + pos.z * 2.0) * 0.5 + 0.5;
    
    vec3 color = mix(col1, col2, m1);
    color = mix(color, col3, m2);
    color = mix(color, col4, m3);
    
    // Audio reactive color boost
    color *= 1.0 + uAudioLevel * 0.5;
    color.r += uBassEnergy * 0.3;
    color.g += uMidEnergy * 0.3;
    color.b += uTrebleEnergy * 0.3;
    
    return color;
}

// Space background with stars and nebula
vec3 spaceBackground(vec2 uv) {
    vec3 col = vec3(0.02, 0.0, 0.05);
    
    // Multiple star layers
    float stars = 0.0;
    for(int layer = 0; layer < 3; layer++) {
        vec2 seed = uv * (30.0 + float(layer) * 20.0);
        seed += vec2(float(layer) * 123.45, float(layer) * 67.89);
        
        vec2 id = floor(seed);
        vec2 gv = fract(seed) - 0.5;
        
        for(int y = -1; y <= 1; y++) {
            for(int x = -1; x <= 1; x++) {
                vec2 offset = vec2(float(x), float(y));
                float n = sin(id.x * 73.1 + id.y * 97.3 + float(layer) * 31.4);
                float size = fract(n * 43.7);
                float star = smoothstep(0.7, 0.9, size) * exp(-length(gv - offset * 0.5) * 10.0);
                star *= sin(uTime * 3.0 * fract(n * 17.3) + n * 6.28) * 0.5 + 0.5;
                stars += star;
            }
        }
    }
    col += vec3(stars) * (1.0 + uTrebleEnergy);
    
    // Nebula clouds
    float n1 = sin(uv.x * 3.0 + uTime * 0.1) * cos(uv.y * 2.0);
    float n2 = sin(uv.x * 5.0 - uTime * 0.05) * sin(uv.y * 3.0);
    vec3 nebula = vec3(
        abs(n1) * 0.2 * (1.0 + uBassEnergy),
        abs(n2) * 0.15 * (1.0 + uMidEnergy),
        abs(n1 + n2) * 0.25
    );
    col += nebula * uGlowIntensity;
    
    return col;
}

// Ray marching
vec3 rayMarch(vec3 ro, vec3 rd, vec2 uv) {
    float dO = 0.0;
    vec3 color = spaceBackground(uv);
    
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = mandelbulbDE(p) * uDetail;
        
        if(dS < SURF_DIST) {
            vec3 normal = getNormal(p);
            vec3 lightPos = vec3(2.0, 3.0, -2.0);
            vec3 lightDir = normalize(lightPos - p);
            
            float diff = max(dot(normal, lightDir), 0.0);
            float spec = pow(max(dot(reflect(-lightDir, normal), -rd), 0.0), 32.0);
            float fresnel = pow(1.0 - max(dot(normal, -rd), 0.0), 2.0);
            
            float colorT = float(i) / float(MAX_STEPS);
            vec3 baseColor = getColor(colorT, p);
            
            color = baseColor * (0.2 + diff * 0.6);
            color += vec3(1.0) * spec * 0.4;
            color += baseColor * fresnel * 0.3;
            
            // Audio glow
            color += baseColor * uAudioLevel * uGlowIntensity * 0.5;
            
            break;
        }
        
        dO += dS;
        if(dO > MAX_DIST) break;
    }
    
    // Glow effect
    float glow = exp(-dO * 0.2) * uGlowIntensity;
    color += getColor(uTime * 0.1, vec3(0.0)) * glow * 0.2;
    
    return color;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord - uResolution * 0.5) / uResolution.y;
    
    // Camera with audio wobble
    vec3 ro = uCameraPos;
    ro.x += sin(uTime * 2.0) * uBassEnergy * 0.1;
    ro.y += cos(uTime * 1.5) * uMidEnergy * 0.1;
    
    vec3 ta = vec3(0.0);
    vec3 cw = normalize(ta - ro);
    vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3 cv = normalize(cross(cu, cw));
    
    vec3 rd = normalize(cu * uv.x + cv * uv.y + cw * 1.5);
    
    vec3 color = rayMarch(ro, rd, uv);
    
    // Post-processing
    float vignette = 1.0 - length(uv) * 0.3;
    color *= vignette;
    
    // Chromatic aberration on bass hits
    if(uBassEnergy > 0.5) {
        color.r *= 1.0 + uBassEnergy * 0.1;
        color.b *= 1.0 - uBassEnergy * 0.1;
    }
    
    // Tone mapping
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// Quantum Particle Class (from previous version)
class QuantumParticle {
    constructor() {
        this.reset();
        this.phase = random(TWO_PI);
        this.frequency = random(0.001, 0.01);
        this.amplitude = random(50, 200);
    }
    
    reset() {
        let theta = random(TWO_PI);
        let phi = random(-PI, PI);
        let r = random(100, 400);
        
        this.x = r * sin(theta) * cos(phi);
        this.y = r * sin(theta) * sin(phi);
        this.z = r * cos(theta);
        
        this.vx = random(-1, 1);
        this.vy = random(-1, 1);
        this.vz = random(-1, 1);
        
        this.size = random(1, 5);
        this.life = 1.0;
        this.hue = random(180, 300);
        this.quantumState = random(1) > 0.5 ? 1 : -1;
    }
    
    update(audioLevel = 0) {
        let quantumForce = noise(
            this.x * 0.001 + params.time,
            this.y * 0.001 + params.time,
            this.z * 0.001
        ) - 0.5;
        
        this.vx += quantumForce * 0.1 * this.quantumState;
        this.vy += quantumForce * 0.1 * this.quantumState;
        this.vz += quantumForce * 0.05;
        
        if (audioLevel > 0) {
            let audioForce = audioLevel * 10;
            this.vx += random(-audioForce, audioForce);
            this.vy += random(-audioForce, audioForce);
            this.vz += random(-audioForce, audioForce);
        }
        
        let timeInfluence = sin(params.time + this.phase) * this.amplitude;
        
        this.x += this.vx + sin(this.phase) * 0.5;
        this.y += this.vy + cos(this.phase) * 0.5;
        this.z += this.vz + timeInfluence * 0.01;
        
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.vz *= 0.98;
        
        this.life -= 0.002;
        this.phase += this.frequency;
        
        let maxDist = 500;
        let dist = sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (dist > maxDist || this.life <= 0) {
            this.reset();
        }
        
        if (random(1) < 0.001) {
            this.quantumState *= -1;
        }
    }
    
    display() {
        push();
        translate(this.x, this.y, this.z);
        
        let alpha = this.life * 100;
        let brightness = 100 * this.life;
        
        colorMode(HSB, 360, 100, 100, 100);
        
        if (this.quantumState > 0) {
            stroke(this.hue, 80, brightness, alpha);
            fill(this.hue, 60, brightness, alpha * 0.5);
        } else {
            stroke((this.hue + 180) % 360, 80, brightness, alpha);
            fill((this.hue + 180) % 360, 60, brightness, alpha * 0.5);
        }
        
        let displaySize = this.size * (1 + sin(params.time * 2 + this.phase) * 0.3);
        strokeWeight(1);
        sphere(displaySize);
        
        pop();
    }
}

// Star class with warp effect
class Star {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.z = random(0, 1000);
        this.size = random(0.5, 2);
        this.brightness = random(0.5, 1);
    }
    
    update() {
        this.z -= 2 + params.audioLevel * 20;
        if (this.z < 0) {
            this.reset();
            this.z = 1000;
        }
    }
    
    display() {
        push();
        let sx = map(this.x / this.z, 0, 1, 0, width);
        let sy = map(this.y / this.z, 0, 1, 0, height);
        let r = map(this.z, 0, 1000, 4, 0);
        
        translate(sx - width/2, sy - height/2, -this.z);
        noStroke();
        
        let alpha = map(this.z, 0, 1000, 255, 0) * this.brightness;
        fill(255, 255, 255, alpha);
        
        // Star trail effect on high audio
        if (params.audioLevel > 0.3) {
            let trailLength = params.audioLevel * 20;
            strokeWeight(r * 0.5);
            stroke(255, 255, 255, alpha * 0.5);
            line(0, 0, 0, -this.vx * trailLength, -this.vy * trailLength, 0);
        }
        
        sphere(r);
        pop();
    }
}

// Enhanced Nebula cloud
class NebulaCloud {
    constructor() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.z = random(-500, -100);
        this.size = random(200, 500);
        this.hue = random(180, 300);
        this.rotation = random(TWO_PI);
        this.rotSpeed = random(0.0005, 0.002);
    }
    
    update() {
        this.rotation += this.rotSpeed + params.audioLevel * 0.01;
        this.hue = (this.hue + params.midEnergy * 2) % 360;
    }
    
    display() {
        push();
        translate(this.x, this.y, this.z);
        rotateZ(this.rotation);
        noStroke();
        
        colorMode(HSB, 360, 100, 100, 100);
        
        for (let i = 5; i > 0; i--) {
            let alpha = map(i, 0, 5, 10, 2) * (1 + params.bassEnergy);
            fill(this.hue, 70, 80, alpha);
            sphere(this.size * i * 0.2);
        }
        pop();
    }
}

// Floating space particle
class FloatingParticle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = random(-width/2, width/2);
        this.y = random(-height/2, height/2);
        this.z = random(-200, 200);
        this.vx = random(-1, 1);
        this.vy = random(-1, 1);
        this.vz = random(-1, 1);
        this.size = random(1, 3);
        this.hue = random(180, 300);
    }
    
    update() {
        this.x += this.vx + params.midEnergy * random(-5, 5);
        this.y += this.vy + params.trebleEnergy * random(-5, 5);
        this.z += this.vz + params.bassEnergy * random(-5, 5);
        
        if (abs(this.x) > width/2 || abs(this.y) > height/2 || abs(this.z) > 500) {
            this.reset();
        }
    }
    
    display() {
        push();
        translate(this.x, this.y, this.z);
        noStroke();
        colorMode(HSB, 360, 100, 100, 100);
        fill(this.hue, 80, 100, 100);
        sphere(this.size * (1 + params.audioLevel));
        pop();
    }
}

function setup() {
    // Create canvas without any transformations that cause diagonal lines
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');
    
    pixelDensity(1);
    
    // Create shader
    shader = createShader(vertShader, fragShader);
    
    // Initialize audio
    amplitude = new p5.Amplitude();
    fft = new p5.FFT(0.8, 64);
    
    // Create all particles and space elements
    for (let i = 0; i < 300; i++) {
        stars.push(new Star());
    }
    
    for (let i = 0; i < 8; i++) {
        nebulaClouds.push(new NebulaCloud());
    }
    
    for (let i = 0; i < 150; i++) {
        particles.push(new FloatingParticle());
    }
    
    // Add quantum particles from previous version
    for (let i = 0; i < 200; i++) {
        quantumParticles.push(new QuantumParticle());
    }
    
    setupUI();
    
    colorMode(HSB, 360, 100, 100, 100);
    
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 500);
}

function draw() {
    params.time = millis() * 0.001;
    
    if (autoRotate) {
        params.cameraAngle += 0.003;
    }
    
    // Get audio data
    if (audioEnabled && fft) {
        params.audioLevel = amplitude.getLevel();
        
        let spectrum = fft.analyze();
        
        params.bassEnergy = 0;
        for (let i = 0; i < 8; i++) {
            params.bassEnergy += spectrum[i];
        }
        params.bassEnergy = (params.bassEnergy / 8) / 255;
        
        params.midEnergy = 0;
        for (let i = 8; i < 32; i++) {
            params.midEnergy += spectrum[i];
        }
        params.midEnergy = (params.midEnergy / 24) / 255;
        
        params.trebleEnergy = 0;
        for (let i = 32; i < 64; i++) {
            params.trebleEnergy += spectrum[i];
        }
        params.trebleEnergy = (params.trebleEnergy / 32) / 255;
    } else {
        // Simulate audio
        params.bassEnergy = (sin(params.time * 0.5) * 0.5 + 0.5) * 0.3;
        params.midEnergy = (cos(params.time * 0.7) * 0.5 + 0.5) * 0.3;
        params.trebleEnergy = (sin(params.time * 1.3) * 0.5 + 0.5) * 0.3;
        params.audioLevel = 0.2;
    }
    
    // Clear background
    background(5, 0, 10);
    
    // Draw space environment first (behind Mandelbulb)
    push();
    
    // Draw stars
    for (let star of stars) {
        star.update();
        star.display();
    }
    
    // Draw nebula clouds
    blendMode(ADD);
    for (let cloud of nebulaClouds) {
        cloud.update();
        cloud.display();
    }
    blendMode(BLEND);
    
    // Draw floating particles
    for (let particle of particles) {
        particle.update();
        particle.display();
    }
    
    pop();
    
    // Apply shader for Mandelbulb (no diagonal artifacts)
    push();
    shader(shader);
    
    let camRadius = params.zoom;
    let camX = camRadius * cos(params.cameraAngle);
    let camY = camRadius * 0.3;
    let camZ = camRadius * sin(params.cameraAngle);
    
    shader.setUniform('uResolution', [width, height]);
    shader.setUniform('uTime', params.time);
    shader.setUniform('uPower', params.power);
    shader.setUniform('uIterations', params.iterations);
    shader.setUniform('uCameraPos', [camX, camY, camZ]);
    shader.setUniform('uColorShift', params.colorShift);
    shader.setUniform('uGlowIntensity', params.glowIntensity);
    shader.setUniform('uDetail', params.detail);
    shader.setUniform('uAudioLevel', params.audioLevel);
    shader.setUniform('uBassEnergy', params.bassEnergy);
    shader.setUniform('uMidEnergy', params.midEnergy);
    shader.setUniform('uTrebleEnergy', params.trebleEnergy);
    
    // Draw as simple plane without any rotation
    plane(width, height);
    pop();
    
    // Draw quantum particles in front
    resetShader();
    push();
    blendMode(ADD);
    for (let qp of quantumParticles) {
        qp.update(params.audioLevel);
        qp.display();
    }
    blendMode(BLEND);
    pop();
    
    // Update stats
    if (frameCount % 10 === 0) {
        document.getElementById('fps').textContent = floor(frameRate());
        
        if (audioEnabled) {
            document.getElementById('mode').textContent = 'Audio Active';
            document.getElementById('mode').style.color = '#00ff88';
        } else {
            document.getElementById('mode').textContent = 'Visual Only';
            document.getElementById('mode').style.color = '#00ffff';
        }
        
        let quality = params.detail > 0.7 ? 'High' : params.detail > 0.4 ? 'Medium' : 'Low';
        document.getElementById('quality').textContent = quality;
    }
}

// UI Setup
function setupUI() {
    // Audio toggle
    let audioBtn = document.getElementById('audio-toggle');
    if (audioBtn) {
        audioBtn.addEventListener('click', function() {
            if (!audioEnabled) {
                audioInput = new p5.AudioIn();
                audioInput.start();
                amplitude.setInput(audioInput);
                fft.setInput(audioInput);
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
    
    // Setup sliders
    setupSlider('power', (value) => {
        params.power = parseFloat(value);
    });
    
    setupSlider('iterations', (value) => {
        params.iterations = parseInt(value);
    });
    
    setupSlider('detail', (value) => {
        params.detail = parseFloat(value);
    });
    
    setupSlider('colorshift', (value) => {
        params.colorShift = parseFloat(value);
    });
    
    setupSlider('glow', (value) => {
        params.glowIntensity = parseFloat(value);
    });
    
    setupSlider('zoom', (value) => {
        params.zoom = parseFloat(value);
    });
    
    // Auto rotate button
    let rotateBtn = document.getElementById('auto-rotate');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', function() {
            autoRotate = !autoRotate;
            this.textContent = autoRotate ? '⏸️ Pause' : '▶️ Play';
            this.classList.toggle('active');
        });
    }
    
    // Other buttons
    document.getElementById('screenshot')?.addEventListener('click', () => {
        saveCanvas('mandelbulb-' + Date.now(), 'png');
    });
    
    document.getElementById('fullscreen')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    document.getElementById('reset')?.addEventListener('click', () => {
        params.power = 8.0;
        params.iterations = 16;
        params.detail = 0.8;
        params.colorShift = 0.0;
        params.glowIntensity = 0.5;
        params.zoom = 3.0;
        params.cameraAngle = 0;
        
        document.getElementById('power').value = 8;
        document.getElementById('iterations').value = 16;
        document.getElementById('detail').value = 0.8;
        document.getElementById('colorshift').value = 0;
        document.getElementById('glow').value = 0.5;
        document.getElementById('zoom').value = 3;
        
        updateAllDisplays();
    });
}

function setupSlider(id, callback) {
    const slider = document.getElementById(id);
    const display = document.getElementById(id + '-value');
    
    if (slider && display) {
        slider.addEventListener('input', () => {
            let value = slider.value;
            if (id === 'iterations') {
                display.textContent = value;
            } else {
                display.textContent = parseFloat(value).toFixed(id === 'power' || id === 'zoom' ? 1 : 2);
            }
            callback(value);
        });
    }
}

function updateAllDisplays() {
    document.getElementById('power-value').textContent = params.power.toFixed(1);
    document.getElementById('iterations-value').textContent = params.iterations;
    document.getElementById('detail-value').textContent = params.detail.toFixed(2);
    document.getElementById('colorshift-value').textContent = params.colorShift.toFixed(2);
    document.getElementById('glow-value').textContent = params.glowIntensity.toFixed(2);
    document.getElementById('zoom-value').textContent = params.zoom.toFixed(1);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mouseWheel(event) {
    params.zoom += event.delta * 0.001;
    params.zoom = constrain(params.zoom, 1, 10);
    document.getElementById('zoom').value = params.zoom;
    document.getElementById('zoom-value').textContent = params.zoom.toFixed(1);
    return false;
}