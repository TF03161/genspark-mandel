// Hyperdimensional Mandelbulb - 4D/5D超次元フラクタル
// 最先端の複雑なフラクタル表現

let renderMode = 'HYPERDIMENSIONAL';
let angle = 0;
let stars = [];
let particles = [];
let quantumFields = [];
let dimensionalSlices = [];
let audioInput, amplitude, fft;
let audioEnabled = false;
let audioLevel = 0, bassLevel = 0, midLevel = 0, trebleLevel = 0;
let autoRotate = true;
let time = 0;
let uiVisible = true;
let isMobile = false;

// 4D/5D parameters
let hyperParams = {
    // Standard parameters
    power: 8.0,
    iterations: 20,
    zoom: 1.0,
    colorShift: 0,
    glowIntensity: 1.0,
    detail: 40,
    
    // 4D/5D specific
    dimension4: 0,
    dimension5: 0,
    w_rotation: 0,
    v_rotation: 0,
    sliceThickness: 0.1,
    timeEvolution: true,
    
    // Complex fractal parameters
    juliaMode: false,
    juliaC: {x: 0.285, y: 0.01, z: 0.1, w: 0.05},
    mandelboxScale: 2.0,
    mandelboxFold: 1.0,
    hybridMix: 0.5,
    
    // Quaternion parameters
    quaternionMode: false,
    quaternionI: 0,
    quaternionJ: 0,
    quaternionK: 0,
    
    // Advanced rendering
    rayMarchSteps: 100,
    aoIterations: 5,
    shadowSoftness: 2.0,
    fractalNoise: 0.1,
    distortionField: 0.2
};

// Complex color palettes for 4D
const hyperPalettes = {
    dimensional: [
        [0, 0, 0], [32, 0, 64], [64, 0, 128], [128, 0, 255],
        [255, 0, 255], [255, 128, 255], [255, 255, 255], [128, 255, 255]
    ],
    quantum: [
        [0, 32, 64], [0, 64, 128], [64, 128, 255], [128, 192, 255],
        [192, 224, 255], [255, 192, 192], [255, 128, 64], [255, 255, 0]
    ],
    tesseract: [
        [255, 0, 0], [255, 64, 0], [255, 128, 0], [255, 255, 0],
        [0, 255, 0], [0, 255, 255], [0, 0, 255], [255, 0, 255]
    ],
    hyperbolic: [
        [0, 0, 0], [64, 32, 0], [128, 64, 0], [192, 128, 64],
        [255, 192, 128], [255, 255, 192], [192, 255, 255], [128, 192, 255]
    ]
};
let currentPalette = 'dimensional';

// 4D Particle with quaternion rotation
class HyperParticle {
    constructor(x, y, z, w) {
        this.pos4D = createVector(
            x || random(-200, 200),
            y || random(-200, 200),
            z || random(-200, 200)
        );
        this.w = w || random(-200, 200);
        this.vel4D = p5.Vector.random3D().mult(random(1, 3));
        this.velW = random(-1, 1);
        this.lifetime = 255;
        this.hue = random(360);
        this.phase = random(TWO_PI);
        this.hyperTrail = [];
    }
    
    update() {
        // 4D physics
        this.phase += 0.05;
        
        // Quaternion rotation in 4D
        let theta = time * 0.5;
        let cos_t = cos(theta);
        let sin_t = sin(theta);
        
        // Rotate in 4D space
        let newW = this.w * cos_t - this.pos4D.z * sin_t;
        let newZ = this.w * sin_t + this.pos4D.z * cos_t;
        this.w = newW;
        this.pos4D.z = newZ;
        
        // Hyperdimensional forces
        let hyperForce = createVector(
            sin(this.phase + this.w * 0.01),
            cos(this.phase - this.w * 0.01),
            sin(this.phase * 2)
        ).mult(0.5);
        
        this.vel4D.add(hyperForce);
        
        // Center attraction in 4D
        let center4D = createVector(0, 0, 0);
        let attraction = p5.Vector.sub(center4D, this.pos4D).mult(0.002);
        this.vel4D.add(attraction);
        this.velW *= 0.98;
        this.w += this.velW;
        
        // Audio reactivity in 4D
        if (audioEnabled) {
            let audioForce4D = p5.Vector.random3D().mult(audioLevel * 3);
            this.vel4D.add(audioForce4D);
            this.velW += (random(-1, 1) * audioLevel);
        }
        
        this.vel4D.limit(5);
        this.pos4D.add(this.vel4D);
        
        // Store trail
        this.hyperTrail.push({
            pos: this.pos4D.copy(),
            w: this.w,
            alpha: this.lifetime
        });
        
        if (this.hyperTrail.length > 10) {
            this.hyperTrail.shift();
        }
        
        this.lifetime -= 1;
    }
    
    project4Dto3D() {
        // Stereographic projection from 4D to 3D
        let projectionDistance = 300;
        let wFactor = 1 / (1 - this.w / projectionDistance);
        
        return createVector(
            this.pos4D.x * wFactor,
            this.pos4D.y * wFactor,
            this.pos4D.z * wFactor
        );
    }
    
    display() {
        let pos3D = this.project4Dto3D();
        
        // Draw hypertrail
        push();
        noFill();
        strokeWeight(1);
        beginShape();
        this.hyperTrail.forEach((point, i) => {
            let alpha = map(i, 0, this.hyperTrail.length, 0, this.lifetime * 0.5);
            let wColor = map(point.w, -200, 200, 0, 360);
            stroke(wColor, 80, 100, alpha);
            
            let trailWFactor = 1 / (1 - point.w / 300);
            vertex(
                point.pos.x * trailWFactor,
                point.pos.y * trailWFactor,
                point.pos.z * trailWFactor
            );
        });
        endShape();
        pop();
        
        // Draw particle with 4D color coding
        push();
        translate(pos3D.x, pos3D.y, pos3D.z);
        
        // Color based on 4th dimension
        let wColor = map(this.w, -200, 200, 0, 360);
        
        // Multi-dimensional glow
        noStroke();
        for (let i = 3; i > 0; i--) {
            fill(wColor, 60, 100, this.lifetime * 0.1 / i);
            sphere(5 * i);
        }
        
        fill(wColor, 40, 100, this.lifetime);
        sphere(5);
        
        // 4D indicator rings
        stroke(wColor, 100, 100, this.lifetime * 0.5);
        strokeWeight(0.5);
        noFill();
        rotateX(this.phase);
        rotateY(this.phase * 1.3);
        for (let i = 0; i < 3; i++) {
            rotateZ(PI / 3);
            ellipse(0, 0, 20, 20);
        }
        
        pop();
    }
}

// Dimensional slice visualizer
class DimensionalSlice {
    constructor(dimension, position) {
        this.dimension = dimension; // 4 or 5
        this.position = position;
        this.points = [];
        this.generateSlice();
    }
    
    generateSlice() {
        let resolution = 30;
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                let theta = map(i, 0, resolution, 0, TWO_PI);
                let phi = map(j, 0, resolution, 0, PI);
                
                let x = sin(phi) * cos(theta) * 100;
                let y = sin(phi) * sin(theta) * 100;
                let z = cos(phi) * 100;
                let w = this.position;
                
                if (this.dimension === 5) {
                    let v = sin(time * 0.1) * 50;
                    if (isIn5DMandelbulb(x/100, y/100, z/100, w/100, v/100)) {
                        this.points.push({x, y, z, w, v});
                    }
                } else {
                    if (isIn4DMandelbulb(x/100, y/100, z/100, w/100)) {
                        this.points.push({x, y, z, w});
                    }
                }
            }
        }
    }
    
    display() {
        push();
        this.points.forEach(p => {
            // Project to 3D
            let projectionFactor = 1 / (1 - p.w / 500);
            let x3D = p.x * projectionFactor;
            let y3D = p.y * projectionFactor;
            let z3D = p.z * projectionFactor;
            
            // Color based on higher dimensions
            let hue = map(p.w, -100, 100, 0, 180);
            if (this.dimension === 5 && p.v) {
                hue += map(p.v, -50, 50, 0, 180);
            }
            
            push();
            translate(x3D, y3D, z3D);
            
            noStroke();
            fill(hue, 70, 90, 150);
            sphere(1.5);
            
            // Dimensional indicator
            if (this.dimension === 5) {
                stroke(hue, 100, 100, 100);
                strokeWeight(0.3);
                noFill();
                rotateX(time);
                box(3);
            }
            
            pop();
        });
        pop();
    }
}

// Quantum field in 4D
class QuantumField4D {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.generateField();
    }
    
    generateField() {
        // Create quantum nodes in 4D space
        for (let i = 0; i < 20; i++) {
            this.nodes.push({
                pos: createVector(random(-150, 150), random(-150, 150), random(-150, 150)),
                w: random(-150, 150),
                phase: random(TWO_PI),
                frequency: random(0.01, 0.05),
                amplitude: random(10, 30)
            });
        }
        
        // Create quantum entanglements
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (random() < 0.3) {
                    this.connections.push([i, j]);
                }
            }
        }
    }
    
    update() {
        this.nodes.forEach(node => {
            node.phase += node.frequency;
            
            // Quantum oscillation in 4D
            node.pos.x += sin(node.phase) * node.amplitude * 0.1;
            node.pos.y += cos(node.phase * 1.3) * node.amplitude * 0.1;
            node.pos.z += sin(node.phase * 0.7) * node.amplitude * 0.1;
            node.w += cos(node.phase * 2) * node.amplitude * 0.05;
        });
    }
    
    display() {
        push();
        
        // Draw quantum connections
        strokeWeight(0.5);
        this.connections.forEach(conn => {
            let n1 = this.nodes[conn[0]];
            let n2 = this.nodes[conn[1]];
            
            // Project 4D positions to 3D
            let p1 = this.project4D(n1.pos, n1.w);
            let p2 = this.project4D(n2.pos, n2.w);
            
            // Quantum entanglement visualization
            let alpha = sin(time * 3 + n1.phase) * 50 + 50;
            stroke(180, 100, 100, alpha);
            line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        });
        
        // Draw quantum nodes
        noStroke();
        this.nodes.forEach(node => {
            let p = this.project4D(node.pos, node.w);
            
            push();
            translate(p.x, p.y, p.z);
            
            // Quantum state visualization
            let hue = map(node.w, -150, 150, 180, 360);
            for (let i = 2; i > 0; i--) {
                fill(hue, 60, 100, 50 / i);
                sphere(5 * i * (1 + sin(node.phase) * 0.3));
            }
            
            fill(hue, 40, 100, 200);
            sphere(3);
            pop();
        });
        
        pop();
    }
    
    project4D(pos3D, w) {
        let factor = 1 / (1 - w / 400);
        return createVector(
            pos3D.x * factor,
            pos3D.y * factor,
            pos3D.z * factor
        );
    }
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent(document.body);
    
    colorMode(HSB, 360, 100, 100, 255);
    frameRate(60);
    
    // Check device
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Adjust for mobile
    if (isMobile) {
        hyperParams.detail = 25;
        hyperParams.iterations = 12;
        hyperParams.rayMarchSteps = 50;
    }
    
    // Create hyperdimensional UI
    createHyperUI();
    
    // Initialize quantum field
    quantumFields.push(new QuantumField4D());
    
    // Initialize dimensional slices
    for (let i = -100; i <= 100; i += 50) {
        dimensionalSlices.push(new DimensionalSlice(4, i));
    }
    
    // Initialize stars
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: random(-width, width),
            y: random(-height, height),
            z: random(0, 1500),
            size: random(0.5, 3),
            dimension: random(3, 5)
        });
    }
    
    // Setup audio
    audioInput = new p5.AudioIn();
    amplitude = new p5.Amplitude();
    fft = new p5.FFT(0.9, 128);
    fft.setInput(audioInput);
}

function draw() {
    background(0, 0, 5);
    
    time += 0.01;
    
    // Update 4D/5D parameters
    if (hyperParams.timeEvolution) {
        hyperParams.dimension4 = sin(time * 0.3) * 100;
        hyperParams.dimension5 = cos(time * 0.2) * 50;
        hyperParams.w_rotation += 0.01;
        hyperParams.v_rotation += 0.007;
    }
    
    // Audio processing
    if (audioEnabled && frameCount % 2 === 0) {
        audioLevel = amplitude.getLevel();
        let spectrum = fft.analyze();
        bassLevel = fft.getEnergy("bass") / 255;
        midLevel = fft.getEnergy("mid") / 255;
        trebleLevel = fft.getEnergy("treble") / 255;
        
        hyperParams.colorShift += midLevel * 0.1;
        hyperParams.distortionField = 0.2 + bassLevel * 0.3;
        hyperParams.fractalNoise = trebleLevel * 0.3;
    }
    
    // 4D camera setup
    let camRadius = 400 * hyperParams.zoom;
    let camX = sin(angle) * camRadius;
    let camY = cos(angle * 0.7) * camRadius * 0.5;
    let camZ = cos(angle) * camRadius;
    
    // Add 4th dimension rotation
    camX += sin(hyperParams.w_rotation) * 50;
    camY += cos(hyperParams.w_rotation) * 50;
    
    camera(camX, camY, camZ + 500, 0, 0, 0, 0, 1, 0);
    
    if (autoRotate) {
        angle += 0.002 + audioLevel * 0.01;
    }
    
    // Hyperdimensional lighting
    setupHyperLighting();
    
    // Render background with 4D stars
    renderHyperStars();
    
    // Main rendering
    push();
    switch(renderMode) {
        case 'HYPERDIMENSIONAL':
            render4DMandelbulb();
            break;
        case 'QUATERNION':
            renderQuaternionJulia();
            break;
        case 'MANDELBOX':
            renderMandelbox4D();
            break;
        case 'HYBRID_COMPLEX':
            renderHybridComplex();
            break;
        case 'DIMENSIONAL_SLICE':
            renderDimensionalSlices();
            break;
        case 'TESSERACT':
            renderTesseractFractal();
            break;
    }
    pop();
    
    // Render quantum field
    quantumFields.forEach(field => {
        field.update();
        field.display();
    });
    
    // Update and render particles
    particles = particles.filter(p => p.lifetime > 0);
    particles.forEach(p => {
        p.update();
        p.display();
    });
    
    // Post processing
    applyHyperEffects();
    
    // Display HUD
    displayHyperHUD();
}

function setupHyperLighting() {
    // 4D lighting system
    let t = time;
    
    // Main hyperdimensional light
    pointLight(
        (t * 30 + hyperParams.dimension4 * 0.5) % 360,
        70,
        100,
        cos(t) * 300 + hyperParams.dimension4 * 0.5,
        sin(t) * 300,
        200 + hyperParams.dimension5 * 0.5
    );
    
    // Quantum lights
    pointLight(240, 60, 80, -200, -200, -200);
    pointLight(120, 60, 80, 200, -200, 200);
    
    // Audio reactive 4D lights
    if (audioEnabled) {
        pointLight(
            bassLevel * 360,
            100,
            100 * bassLevel,
            hyperParams.dimension4,
            0,
            100
        );
    }
    
    ambientLight(280, 20, 25);
}

function renderHyperStars() {
    push();
    stars.forEach(star => {
        star.z -= 2 + audioLevel * 5;
        
        // 4D/5D motion
        if (star.dimension > 3) {
            star.x += sin(time + star.dimension) * 0.5;
            star.y += cos(time * 1.3 + star.dimension) * 0.5;
        }
        
        if (star.z < 0) {
            star.z = 1500;
            star.x = random(-width, width);
            star.y = random(-height, height);
            star.dimension = random(3, 5);
        }
        
        let sx = map(star.x / star.z, 0, 1, 0, width);
        let sy = map(star.y / star.z, 0, 1, 0, height);
        let s = map(star.z, 0, 1500, star.size * 4, 0);
        
        push();
        translate(sx - width/2, sy - height/2, -star.z/5);
        noStroke();
        
        // Color based on dimension
        let hue = map(star.dimension, 3, 5, 200, 360);
        fill(hue, 30, 100, 255 - star.z * 0.15);
        sphere(s);
        
        // Dimensional indicator
        if (star.dimension > 4) {
            stroke(hue, 100, 100, 100);
            strokeWeight(0.3);
            noFill();
            rotateZ(time * 2);
            box(s * 2);
        }
        
        pop();
    });
    pop();
}

function render4DMandelbulb() {
    push();
    strokeWeight(0.5);
    
    let resolution = hyperParams.detail;
    let size = 150;
    
    for (let lat = 0; lat < resolution; lat += 2) {
        for (let lon = 0; lon < resolution * 2; lon += 2) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            // Add 4D distortion
            theta += sin(time + hyperParams.w_rotation) * hyperParams.distortionField;
            phi += cos(time + hyperParams.v_rotation) * hyperParams.distortionField;
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            let w = hyperParams.dimension4 * sin(theta + phi);
            
            if (isIn4DMandelbulb(x/100, y/100, z/100, w/100)) {
                // 4D to 3D projection
                let projectionFactor = 1 / (1 - w / 500);
                let x3D = x * projectionFactor;
                let y3D = y * projectionFactor;
                let z3D = z * projectionFactor;
                
                // Complex color based on 4D position
                let distance = sqrt(x*x + y*y + z*z + w*w);
                let colorData = getHyperColor(distance, size, w);
                
                stroke(colorData[0], colorData[1], colorData[2], 200);
                fill(colorData[0], colorData[1], colorData[2], 150);
                
                push();
                translate(x3D, y3D, z3D);
                
                // 4D rotation
                rotateX(hyperParams.w_rotation);
                rotateY(hyperParams.v_rotation);
                rotateZ(time * 0.5);
                
                // Hyperdimensional geometry
                if (abs(w) > 50) {
                    // Tesseract-like structure for high W values
                    box(2);
                    rotateX(HALF_PI);
                    box(1.5);
                    rotateY(HALF_PI);
                    box(1);
                } else {
                    // Standard geometry for low W values
                    sphere(2);
                }
                
                // Dimensional indicator
                if (abs(w) > 25) {
                    stroke(colorData[0], 100, 100, 100);
                    strokeWeight(0.3);
                    noFill();
                    for (let i = 0; i < 4; i++) {
                        rotateZ(PI / 4);
                        ellipse(0, 0, 8, 8);
                    }
                }
                
                pop();
                
                // Spawn 4D particles
                if (random() < 0.001 && particles.length < 100) {
                    particles.push(new HyperParticle(x3D, y3D, z3D, w));
                }
            }
        }
    }
    pop();
}

function renderQuaternionJulia() {
    push();
    strokeWeight(0.5);
    
    let resolution = hyperParams.detail * 0.8;
    let size = 130;
    
    // Quaternion parameters
    let qi = hyperParams.quaternionI + sin(time * 0.3) * 0.1;
    let qj = hyperParams.quaternionJ + cos(time * 0.4) * 0.1;
    let qk = hyperParams.quaternionK + sin(time * 0.5) * 0.1;
    
    for (let lat = 0; lat < resolution; lat += 2) {
        for (let lon = 0; lon < resolution * 2; lon += 2) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            
            if (isInQuaternionJulia(x/100, y/100, z/100, qi, qj, qk)) {
                let hue = (hyperParams.colorShift * 100 + dist(x, y, z, 0, 0, 0) * 3) % 360;
                
                stroke(hue, 70, 90, 200);
                fill(hue, 60, 100, 150);
                
                push();
                translate(x, y, z);
                
                // Quaternion rotation visualization
                rotateX(qi * PI);
                rotateY(qj * PI);
                rotateZ(qk * PI);
                
                // Crystal structure
                for (let i = 0; i < 4; i++) {
                    rotateZ(PI / 2);
                    box(1, 4, 1);
                }
                sphere(1.5);
                
                pop();
            }
        }
    }
    pop();
}

function renderMandelbox4D() {
    push();
    strokeWeight(0.5);
    
    let resolution = hyperParams.detail * 0.7;
    let size = 140;
    let scale = hyperParams.mandelboxScale;
    let fold = hyperParams.mandelboxFold;
    
    for (let lat = 0; lat < resolution; lat += 2) {
        for (let lon = 0; lon < resolution * 2; lon += 2) {
            let theta = map(lat, 0, resolution, 0, PI);
            let phi = map(lon, 0, resolution * 2, 0, TWO_PI);
            
            let r = size;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            let w = hyperParams.dimension4 * 0.5;
            
            if (isInMandelbox4D(x/100, y/100, z/100, w/100, scale, fold)) {
                // 4D projection
                let projFactor = 1 / (1 - w / 400);
                let x3D = x * projFactor;
                let y3D = y * projFactor;
                let z3D = z * projFactor;
                
                let hue = (abs(w) * 2 + hyperParams.colorShift * 100) % 360;
                
                stroke(hue, 60, 80, 200);
                fill(hue, 50, 90, 150);
                
                push();
                translate(x3D, y3D, z3D);
                
                // Box folding visualization
                rotateX(time * 0.3);
                rotateY(time * 0.4);
                
                // Mandelbox structure
                box(2, 2, 2);
                
                // Folding indicators
                if (abs(x) > size * 0.8 || abs(y) > size * 0.8 || abs(z) > size * 0.8) {
                    stroke(hue, 100, 100, 100);
                    strokeWeight(0.5);
                    noFill();
                    box(4, 4, 4);
                }
                
                pop();
            }
        }
    }
    pop();
}

function renderHybridComplex() {
    // Combine multiple fractal types
    push();
    
    // Layer 1: 4D Mandelbulb
    push();
    blendMode(ADD);
    render4DMandelbulb();
    pop();
    
    // Layer 2: Quaternion Julia
    push();
    blendMode(SCREEN);
    renderQuaternionJulia();
    pop();
    
    // Layer 3: Quantum particles
    for (let i = 0; i < 20; i++) {
        if (particles.length < 150) {
            particles.push(new HyperParticle());
        }
    }
    
    pop();
}

function renderDimensionalSlices() {
    push();
    
    // Update slices
    dimensionalSlices = [];
    for (let i = -100; i <= 100; i += 40) {
        dimensionalSlices.push(new DimensionalSlice(4, i + hyperParams.dimension4));
    }
    
    // Render slices
    dimensionalSlices.forEach(slice => {
        slice.display();
    });
    
    pop();
}

function renderTesseractFractal() {
    push();
    strokeWeight(0.5);
    
    // Tesseract vertices in 4D
    let vertices4D = [];
    for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
            for (let k = -1; k <= 1; k += 2) {
                for (let l = -1; l <= 1; l += 2) {
                    vertices4D.push({
                        x: i * 100,
                        y: j * 100,
                        z: k * 100,
                        w: l * 100
                    });
                }
            }
        }
    }
    
    // Project and render
    vertices4D.forEach(v => {
        // Rotate in 4D
        let theta = time * 0.5;
        let newW = v.w * cos(theta) - v.z * sin(theta);
        let newZ = v.w * sin(theta) + v.z * cos(theta);
        
        // Project to 3D
        let projFactor = 1 / (1 - newW / 500);
        let x3D = v.x * projFactor;
        let y3D = v.y * projFactor;
        let z3D = newZ * projFactor;
        
        push();
        translate(x3D, y3D, z3D);
        
        // Check if point is in fractal
        if (isIn4DMandelbulb(v.x/100, v.y/100, newZ/100, newW/100)) {
            let hue = map(newW, -100, 100, 0, 360);
            
            noStroke();
            fill(hue, 70, 90, 200);
            sphere(3);
            
            // Tesseract edges
            stroke(hue, 100, 100, 100);
            strokeWeight(0.5);
            noFill();
            box(6);
        }
        
        pop();
    });
    
    // Connect tesseract edges
    stroke(200, 50, 100, 50);
    strokeWeight(0.3);
    for (let i = 0; i < vertices4D.length; i++) {
        for (let j = i + 1; j < vertices4D.length; j++) {
            let v1 = vertices4D[i];
            let v2 = vertices4D[j];
            
            // Check if vertices are connected (differ in exactly one coordinate)
            let diffs = 0;
            if (v1.x !== v2.x) diffs++;
            if (v1.y !== v2.y) diffs++;
            if (v1.z !== v2.z) diffs++;
            if (v1.w !== v2.w) diffs++;
            
            if (diffs === 1) {
                // Project and draw edge
                let theta = time * 0.5;
                
                let w1 = v1.w * cos(theta) - v1.z * sin(theta);
                let z1 = v1.w * sin(theta) + v1.z * cos(theta);
                let proj1 = 1 / (1 - w1 / 500);
                
                let w2 = v2.w * cos(theta) - v2.z * sin(theta);
                let z2 = v2.w * sin(theta) + v2.z * cos(theta);
                let proj2 = 1 / (1 - w2 / 500);
                
                line(
                    v1.x * proj1, v1.y * proj1, z1 * proj1,
                    v2.x * proj2, v2.y * proj2, z2 * proj2
                );
            }
        }
    }
    
    pop();
}

// Complex fractal functions
function isIn4DMandelbulb(x, y, z, w) {
    let zx = x, zy = y, zz = z, zw = w;
    let r = 0;
    
    for (let i = 0; i < hyperParams.iterations; i++) {
        r = sqrt(zx*zx + zy*zy + zz*zz + zw*zw);
        if (r > 2) return false;
        
        // 4D spherical coordinates
        let theta = acos(zz / sqrt(zx*zx + zy*zy + zz*zz));
        let phi = atan2(zy, zx);
        let psi = atan2(sqrt(zx*zx + zy*zy + zz*zz), zw);
        
        let power = hyperParams.power;
        let zr = pow(r, power);
        theta *= power;
        phi *= power;
        psi *= power;
        
        zx = zr * sin(psi) * sin(theta) * cos(phi) + x;
        zy = zr * sin(psi) * sin(theta) * sin(phi) + y;
        zz = zr * sin(psi) * cos(theta) + z;
        zw = zr * cos(psi) + w;
        
        // Add fractal noise
        if (hyperParams.fractalNoise > 0) {
            zx += sin(zw * 10) * hyperParams.fractalNoise * 0.01;
            zy += cos(zw * 10) * hyperParams.fractalNoise * 0.01;
        }
    }
    
    return true;
}

function isIn5DMandelbulb(x, y, z, w, v) {
    let zx = x, zy = y, zz = z, zw = w, zv = v;
    let r = 0;
    
    for (let i = 0; i < hyperParams.iterations * 0.8; i++) {
        r = sqrt(zx*zx + zy*zy + zz*zz + zw*zw + zv*zv);
        if (r > 2) return false;
        
        // 5D hyperspherical coordinates
        let r3 = sqrt(zx*zx + zy*zy + zz*zz);
        let r4 = sqrt(r3*r3 + zw*zw);
        
        let theta = acos(zz / r3);
        let phi = atan2(zy, zx);
        let psi = atan2(r3, zw);
        let chi = atan2(r4, zv);
        
        let power = hyperParams.power;
        let zr = pow(r, power);
        
        theta *= power;
        phi *= power;
        psi *= power;
        chi *= power;
        
        zx = zr * sin(chi) * sin(psi) * sin(theta) * cos(phi) + x;
        zy = zr * sin(chi) * sin(psi) * sin(theta) * sin(phi) + y;
        zz = zr * sin(chi) * sin(psi) * cos(theta) + z;
        zw = zr * sin(chi) * cos(psi) + w;
        zv = zr * cos(chi) + v;
    }
    
    return true;
}

function isInQuaternionJulia(x, y, z, qi, qj, qk) {
    // Quaternion Julia set
    let qx = x, qy = y, qz = z;
    let qw = 0;
    
    for (let i = 0; i < hyperParams.iterations; i++) {
        let r = sqrt(qx*qx + qy*qy + qz*qz + qw*qw);
        if (r > 2) return false;
        
        // Quaternion multiplication
        let newX = qx*qx - qy*qy - qz*qz - qw*qw + hyperParams.juliaC.x;
        let newY = 2*qx*qy + hyperParams.juliaC.y + qi;
        let newZ = 2*qx*qz + hyperParams.juliaC.z + qj;
        let newW = 2*qx*qw + hyperParams.juliaC.w + qk;
        
        qx = newX;
        qy = newY;
        qz = newZ;
        qw = newW;
    }
    
    return true;
}

function isInMandelbox4D(x, y, z, w, scale, fold) {
    let zx = x, zy = y, zz = z, zw = w;
    let dr = 1.0;
    
    for (let i = 0; i < hyperParams.iterations * 0.7; i++) {
        // Box fold
        if (zx > fold) zx = 2*fold - zx;
        else if (zx < -fold) zx = -2*fold - zx;
        
        if (zy > fold) zy = 2*fold - zy;
        else if (zy < -fold) zy = -2*fold - zy;
        
        if (zz > fold) zz = 2*fold - zz;
        else if (zz < -fold) zz = -2*fold - zz;
        
        if (zw > fold) zw = 2*fold - zw;
        else if (zw < -fold) zw = -2*fold - zw;
        
        // Sphere fold
        let r = sqrt(zx*zx + zy*zy + zz*zz + zw*zw);
        if (r < 0.5) {
            zx *= 4; zy *= 4; zz *= 4; zw *= 4;
            dr *= 4;
        } else if (r < 1) {
            let factor = 1 / (r*r);
            zx *= factor; zy *= factor; zz *= factor; zw *= factor;
            dr *= factor;
        }
        
        // Scale and translate
        zx = scale * zx + x;
        zy = scale * zy + y;
        zz = scale * zz + z;
        zw = scale * zw + w;
        dr = dr * abs(scale) + 1;
        
        if (sqrt(zx*zx + zy*zy + zz*zz + zw*zw) > 4) return false;
    }
    
    return true;
}

function getHyperColor(distance, maxDist, w) {
    let palette = hyperPalettes[currentPalette];
    
    // Add 4th dimension influence
    let wInfluence = map(abs(w), 0, 200, 0, palette.length / 2);
    let t = (distance / maxDist + wInfluence) * (palette.length - 1);
    let idx = floor(t) % palette.length;
    let frac = t - floor(t);
    
    let nextIdx = (idx + 1) % palette.length;
    
    let c1 = palette[idx];
    let c2 = palette[nextIdx];
    
    return [
        map(lerp(c1[0], c2[0], frac), 0, 255, 0, 360),
        map(lerp(c1[1], c2[1], frac), 0, 255, 0, 100),
        map(lerp(c1[2], c2[2], frac), 0, 255, 0, 100)
    ];
}

function applyHyperEffects() {
    // 4D bloom effect
    if (hyperParams.glowIntensity > 0) {
        push();
        blendMode(ADD);
        noStroke();
        
        // Multi-dimensional glow
        for (let i = 0; i < 3; i++) {
            let phase = time * 0.5 + i * TWO_PI / 3;
            let hue = (phase * 60 + hyperParams.dimension4 * 0.5) % 360;
            
            fill(hue, 30, 50, hyperParams.glowIntensity * 10 / (i + 1));
            
            push();
            translate(
                sin(phase) * 50,
                cos(phase) * 50,
                -200 - i * 100
            );
            sphere(400 + i * 100);
            pop();
        }
        pop();
    }
    
    // Dimensional distortion effect
    if (hyperParams.distortionField > 0) {
        push();
        blendMode(SCREEN);
        noStroke();
        fill(300, 30, 50, hyperParams.distortionField * 20);
        translate(0, 0, -300);
        rotateX(time);
        rotateY(time * 1.3);
        box(800, 800, 100);
        pop();
    }
}

function displayHyperHUD() {
    push();
    resetMatrix();
    camera();
    
    fill(0, 0, 100);
    textAlign(LEFT, TOP);
    textSize(11);
    
    let x = -width/2 + 20;
    let y = -height/2 + 20;
    
    text(`FPS: ${floor(frameRate())}`, x, y);
    text(`MODE: ${renderMode}`, x, y + 15);
    text(`DIMENSION: 4D/5D`, x, y + 30);
    text(`──────────────`, x, y + 45);
    text(`4TH DIM: ${hyperParams.dimension4.toFixed(1)}`, x, y + 60);
    text(`5TH DIM: ${hyperParams.dimension5.toFixed(1)}`, x, y + 75);
    text(`W-ROT: ${(hyperParams.w_rotation % TWO_PI).toFixed(2)}`, x, y + 90);
    text(`V-ROT: ${(hyperParams.v_rotation % TWO_PI).toFixed(2)}`, x, y + 105);
    text(`──────────────`, x, y + 120);
    text(`PARTICLES: ${particles.length}`, x, y + 135);
    text(`POWER: ${hyperParams.power.toFixed(1)}`, x, y + 150);
    text(`ITERATIONS: ${hyperParams.iterations}`, x, y + 165);
    
    if (audioEnabled) {
        text(`──────────────`, x, y + 180);
        text(`AUDIO: ${(audioLevel * 100).toFixed(0)}%`, x, y + 195);
        text(`BASS: ${(bassLevel * 100).toFixed(0)}%`, x, y + 210);
    }
    
    pop();
}

function createHyperUI() {
    // Remove existing controls
    let existing = select('#hyper-controls');
    if (existing) existing.remove();
    
    let container = createDiv('');
    container.id('hyper-controls');
    container.position(windowWidth - 300, 20);
    container.style('width', '280px');
    container.style('max-height', '90vh');
    container.style('overflow-y', 'auto');
    container.style('background', 'rgba(0, 0, 0, 0.95)');
    container.style('backdrop-filter', 'blur(20px)');
    container.style('border', '2px solid #ff00ff');
    container.style('border-radius', '15px');
    container.style('padding', '20px');
    container.style('color', 'white');
    container.style('font-family', 'monospace');
    container.style('z-index', '10000');
    container.style('position', 'fixed');
    
    // Title
    let title = createDiv('🌌 4D/5D HYPERFRACTAL 🌌');
    title.parent(container);
    title.style('text-align', 'center');
    title.style('font-size', '16px');
    title.style('margin-bottom', '15px');
    title.style('background', 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff)');
    title.style('background-clip', 'text');
    title.style('-webkit-background-clip', 'text');
    title.style('-webkit-text-fill-color', 'transparent');
    title.style('font-weight', 'bold');
    
    // Mode buttons
    createHyperSection('FRACTAL MODE', container);
    
    let modes = [
        {name: 'HYPERDIMENSIONAL', label: '4D'},
        {name: 'QUATERNION', label: 'QUAT'},
        {name: 'MANDELBOX', label: 'BOX'},
        {name: 'HYBRID_COMPLEX', label: 'HYBRID'},
        {name: 'DIMENSIONAL_SLICE', label: 'SLICE'},
        {name: 'TESSERACT', label: 'TESS'}
    ];
    
    let modeGrid = createDiv('');
    modeGrid.parent(container);
    modeGrid.style('display', 'grid');
    modeGrid.style('grid-template-columns', '1fr 1fr 1fr');
    modeGrid.style('gap', '5px');
    modeGrid.style('margin-bottom', '15px');
    
    modes.forEach(mode => {
        let btn = createButton(mode.label);
        btn.parent(modeGrid);
        btn.mousePressed(() => {
            renderMode = mode.name;
            updateHyperModeButtons();
        });
        btn.id(`mode-${mode.name}`);
        styleHyperButton(btn, renderMode === mode.name);
    });
    
    // 4D/5D Controls
    createHyperSection('DIMENSIONAL CONTROLS', container);
    
    createHyperSlider('4TH DIM', -200, 200, hyperParams.dimension4, 10, container, (val) => {
        hyperParams.dimension4 = parseFloat(val);
    });
    
    createHyperSlider('5TH DIM', -100, 100, hyperParams.dimension5, 5, container, (val) => {
        hyperParams.dimension5 = parseFloat(val);
    });
    
    createHyperSlider('W-ROTATION', 0, TWO_PI, hyperParams.w_rotation, 0.1, container, (val) => {
        hyperParams.w_rotation = parseFloat(val);
    });
    
    // Fractal parameters
    createHyperSection('FRACTAL PARAMS', container);
    
    createHyperSlider('POWER', 2, 16, hyperParams.power, 0.5, container, (val) => {
        hyperParams.power = parseFloat(val);
    });
    
    createHyperSlider('ITERATIONS', 10, 30, hyperParams.iterations, 1, container, (val) => {
        hyperParams.iterations = parseInt(val);
    });
    
    createHyperSlider('DISTORTION', 0, 1, hyperParams.distortionField, 0.05, container, (val) => {
        hyperParams.distortionField = parseFloat(val);
    });
    
    // Color palette
    createHyperSection('COLOR', container);
    let paletteSelect = createSelect();
    paletteSelect.parent(container);
    Object.keys(hyperPalettes).forEach(p => {
        paletteSelect.option(p.toUpperCase());
    });
    paletteSelect.value(currentPalette.toUpperCase());
    paletteSelect.changed(() => {
        currentPalette = paletteSelect.value().toLowerCase();
    });
    styleHyperSelect(paletteSelect);
    
    // Controls
    createHyperSection('CONTROLS', container);
    
    let controlGrid = createDiv('');
    controlGrid.parent(container);
    controlGrid.style('display', 'grid');
    controlGrid.style('grid-template-columns', '1fr 1fr');
    controlGrid.style('gap', '5px');
    
    // Time evolution
    let timeBtn = createButton('⏱️ TIME: ON');
    timeBtn.parent(controlGrid);
    timeBtn.mousePressed(() => {
        hyperParams.timeEvolution = !hyperParams.timeEvolution;
        timeBtn.html(hyperParams.timeEvolution ? '⏱️ TIME: ON' : '⏱️ TIME: OFF');
    });
    styleHyperButton(timeBtn);
    
    // Audio
    let audioBtn = createButton('🎵 AUDIO');
    audioBtn.parent(controlGrid);
    audioBtn.mousePressed(() => {
        if (!audioEnabled) {
            userStartAudio();
            audioInput.start();
            audioEnabled = true;
            audioBtn.style('background', 'linear-gradient(90deg, #00ff00, #00ffff)');
        } else {
            audioInput.stop();
            audioEnabled = false;
            audioBtn.style('background', '#333');
        }
    });
    styleHyperButton(audioBtn);
    
    // Rotation
    let rotateBtn = createButton('🔄 ROTATE');
    rotateBtn.parent(controlGrid);
    rotateBtn.mousePressed(() => {
        autoRotate = !autoRotate;
        rotateBtn.style('background', autoRotate ? 'linear-gradient(90deg, #ff00ff, #00ffff)' : '#333');
    });
    styleHyperButton(rotateBtn);
    
    // Reset
    let resetBtn = createButton('↺ RESET');
    resetBtn.parent(controlGrid);
    resetBtn.mousePressed(() => {
        angle = 0;
        hyperParams.zoom = 1.0;
        hyperParams.dimension4 = 0;
        hyperParams.dimension5 = 0;
        hyperParams.w_rotation = 0;
        hyperParams.v_rotation = 0;
        particles = [];
    });
    styleHyperButton(resetBtn);
    
    // Hyperdimensional explosion
    let explodeBtn = createButton('💥 HYPER EXPLOSION!');
    explodeBtn.parent(container);
    explodeBtn.style('width', '100%');
    explodeBtn.style('margin-top', '10px');
    explodeBtn.style('padding', '12px');
    explodeBtn.style('background', 'linear-gradient(90deg, #ff0000, #ff00ff, #0000ff, #00ffff)');
    explodeBtn.style('font-weight', 'bold');
    explodeBtn.style('animation', 'hyperpulse 2s infinite');
    explodeBtn.mousePressed(() => {
        createHyperExplosion();
    });
    styleHyperButton(explodeBtn);
    
    // Add animations
    if (!select('#hyper-styles')) {
        let styles = createElement('style');
        styles.id('hyper-styles');
        styles.html(`
            @keyframes hyperpulse {
                0%, 100% { transform: scale(1); filter: hue-rotate(0deg); }
                50% { transform: scale(1.05); filter: hue-rotate(180deg); }
            }
            
            #hyper-controls::-webkit-scrollbar {
                width: 8px;
            }
            
            #hyper-controls::-webkit-scrollbar-track {
                background: rgba(255, 0, 255, 0.1);
            }
            
            #hyper-controls::-webkit-scrollbar-thumb {
                background: rgba(255, 0, 255, 0.5);
                border-radius: 4px;
            }
            
            #hyper-controls button:hover {
                transform: scale(1.02);
                filter: brightness(1.3);
            }
        `);
        styles.parent(document.head);
    }
}

function createHyperSection(text, parent) {
    let section = createDiv(text);
    section.parent(parent);
    section.style('color', '#ff00ff');
    section.style('font-size', '11px');
    section.style('margin', '15px 0 8px 0');
    section.style('border-bottom', '1px solid #ff00ff');
    section.style('padding-bottom', '3px');
    section.style('text-transform', 'uppercase');
    section.style('letter-spacing', '1px');
}

function createHyperSlider(label, min, max, value, step, parent, callback) {
    let group = createDiv('');
    group.parent(parent);
    group.style('margin', '10px 0');
    
    let labelDiv = createDiv(`${label}: ${value.toFixed(1)}`);
    labelDiv.parent(group);
    labelDiv.style('font-size', '10px');
    labelDiv.style('color', '#00ffff');
    labelDiv.style('margin-bottom', '3px');
    
    let slider = createSlider(min, max, value, step);
    slider.parent(group);
    slider.style('width', '100%');
    slider.input(() => {
        let val = slider.value();
        callback(val);
        labelDiv.html(`${label}: ${val.toFixed(1)}`);
    });
}

function styleHyperButton(btn, active = false) {
    btn.style('padding', '8px');
    btn.style('background', active ? 'linear-gradient(90deg, #ff00ff, #00ffff)' : '#333');
    btn.style('color', 'white');
    btn.style('border', '1px solid #ff00ff');
    btn.style('border-radius', '8px');
    btn.style('cursor', 'pointer');
    btn.style('font-size', '11px');
    btn.style('font-family', 'monospace');
    btn.style('transition', 'all 0.3s');
}

function styleHyperSelect(sel) {
    sel.style('width', '100%');
    sel.style('padding', '5px');
    sel.style('background', '#222');
    sel.style('color', 'white');
    sel.style('border', '1px solid #ff00ff');
    sel.style('border-radius', '5px');
    sel.style('font-family', 'monospace');
    sel.style('font-size', '11px');
    sel.style('margin-bottom', '10px');
}

function updateHyperModeButtons() {
    ['HYPERDIMENSIONAL', 'QUATERNION', 'MANDELBOX', 'HYBRID_COMPLEX', 'DIMENSIONAL_SLICE', 'TESSERACT'].forEach(mode => {
        let btn = select(`#mode-${mode}`);
        if (btn) {
            styleHyperButton(btn, renderMode === mode);
        }
    });
}

function createHyperExplosion() {
    // Create 4D explosion
    for (let i = 0; i < 50; i++) {
        let angle1 = random(TWO_PI);
        let angle2 = random(PI);
        let r = random(50, 200);
        
        let x = r * sin(angle2) * cos(angle1);
        let y = r * sin(angle2) * sin(angle1);
        let z = r * cos(angle2);
        let w = random(-100, 100);
        
        particles.push(new HyperParticle(x, y, z, w));
    }
    
    // Flash effect
    hyperParams.glowIntensity = 5.0;
    hyperParams.distortionField = 1.0;
    
    setTimeout(() => {
        hyperParams.glowIntensity = 1.0;
        hyperParams.distortionField = 0.2;
    }, 500);
    
    // Dimensional shift
    hyperParams.dimension4 = random(-200, 200);
    hyperParams.dimension5 = random(-100, 100);
}

function mouseDragged() {
    if (mouseX < windowWidth - 320) {
        angle += (mouseX - pmouseX) * 0.01;
    }
}

function mouseWheel(event) {
    if (mouseX < windowWidth - 320) {
        hyperParams.zoom += event.delta * 0.0005;
        hyperParams.zoom = constrain(hyperParams.zoom, 0.3, 3);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    let controls = select('#hyper-controls');
    if (controls) {
        controls.position(windowWidth - 300, 20);
    }
}