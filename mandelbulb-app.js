// True Mandelbulb Explorer - Main Application
// 真のマンデルバルブ探索アプリケーション

let mandelbulbShader;
let shaderGraphics;
let currentMode = 'shader';
let autoRotate = true;

// Parameters
let params = {
    power: 8.0,
    iterations: 16,
    detail: 0.8,
    colorShift: 0.0,
    glowIntensity: 0.5,
    zoom: 3.0,
    rotationX: 0,
    rotationY: 0,
    time: 0,
    cameraAngle: 0
};

// Presets
const presets = {
    psychedelic: {
        power: 8.0,
        iterations: 20,
        detail: 0.9,
        colorShift: 0.0,
        glowIntensity: 1.0,
        zoom: 3.0
    },
    organic: {
        power: 5.0,
        iterations: 16,
        detail: 0.7,
        colorShift: 2.0,
        glowIntensity: 0.3,
        zoom: 3.5
    },
    crystal: {
        power: 12.0,
        iterations: 24,
        detail: 1.0,
        colorShift: 3.14,
        glowIntensity: 0.7,
        zoom: 2.5
    },
    electric: {
        power: 7.0,
        iterations: 18,
        detail: 0.85,
        colorShift: 4.7,
        glowIntensity: 1.5,
        zoom: 3.2
    }
};

function setup() {
    // Create canvas
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');
    
    // Set pixel density for quality
    pixelDensity(1);
    
    // Create shader graphics
    shaderGraphics = createGraphics(windowWidth, windowHeight, WEBGL);
    
    // Compile shader
    try {
        mandelbulbShader = shaderGraphics.createShader(
            mandelbulbVertexShader,
            mandelbulbFragmentShader
        );
    } catch (error) {
        console.error('Shader compilation error:', error);
    }
    
    // Setup UI
    setupUI();
    
    // Hide loading
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 500);
    
    // Setup colors for classic mode
    colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
    // Update time
    params.time = millis() * 0.001;
    
    // Auto rotation
    if (autoRotate) {
        params.cameraAngle += 0.005;
    }
    
    // Clear background
    clear();
    background(10, 10, 10);
    
    // Draw based on mode
    switch(currentMode) {
        case 'shader':
            drawShaderMode();
            break;
        case 'classic':
            drawClassicMode();
            break;
        case 'hybrid':
            drawHybridMode();
            break;
    }
    
    // Update FPS
    if (frameCount % 10 === 0) {
        document.getElementById('fps').textContent = floor(frameRate());
    }
}

function drawShaderMode() {
    if (!mandelbulbShader) return;
    
    // Calculate camera position
    let camRadius = params.zoom;
    let camX = camRadius * cos(params.cameraAngle);
    let camY = camRadius * 0.3;
    let camZ = camRadius * sin(params.cameraAngle);
    
    // Apply shader
    shaderGraphics.shader(mandelbulbShader);
    
    // Set uniforms
    mandelbulbShader.setUniform('uResolution', [width, height]);
    mandelbulbShader.setUniform('uTime', params.time);
    mandelbulbShader.setUniform('uPower', params.power);
    mandelbulbShader.setUniform('uIterations', params.iterations);
    mandelbulbShader.setUniform('uCameraPos', [camX, camY, camZ]);
    mandelbulbShader.setUniform('uCameraTarget', [0, 0, 0]);
    mandelbulbShader.setUniform('uColorShift', params.colorShift);
    mandelbulbShader.setUniform('uGlowIntensity', params.glowIntensity);
    mandelbulbShader.setUniform('uDetail', params.detail);
    mandelbulbShader.setUniform('uZoom', 1.0);
    
    // Draw shader
    shaderGraphics.rect(0, 0, width, height);
    
    // Display shader graphics
    push();
    texture(shaderGraphics);
    plane(width, height);
    pop();
}

function drawClassicMode() {
    // Classic point cloud rendering
    push();
    
    // Camera
    orbitControl(2, 2, 0.1);
    
    // Apply transformations
    scale(params.zoom * 0.3);
    rotateX(params.rotationX);
    rotateY(params.cameraAngle);
    
    // Lighting
    ambientLight(30, 20, 50);
    
    // Dynamic lights
    let lightHue1 = (params.time * 20) % 360;
    let lightHue2 = (params.time * 20 + 180) % 360;
    
    pointLight(lightHue1, 80, 100, 200, 0, 0);
    pointLight(lightHue2, 80, 100, -200, 0, 0);
    
    // Draw Mandelbulb using point cloud
    strokeWeight(2);
    
    let detail = floor(map(params.detail, 0.1, 1.0, 10, 30));
    let step = PI / detail;
    
    for (let theta = 0; theta < PI; theta += step) {
        for (let phi = 0; phi < TWO_PI; phi += step * 2) {
            // Sample on sphere surface
            let r = 1.2;
            let x = r * sin(theta) * cos(phi);
            let y = r * sin(theta) * sin(phi);
            let z = r * cos(theta);
            
            // Check if in Mandelbulb set
            if (isInMandelbulb(x, y, z)) {
                push();
                translate(x * 100, y * 100, z * 100);
                
                // Psychedelic colors
                let hue1 = (theta * 57 + phi * 28 + params.colorShift * 57) % 360;
                let hue2 = (hue1 + 120) % 360;
                let hue3 = (hue1 + 240) % 360;
                
                // Multi-colored based on position
                let mixFactor = noise(x * 2 + params.time * 0.5, y * 2, z * 2);
                let finalHue;
                
                if (mixFactor < 0.33) {
                    finalHue = hue1;
                } else if (mixFactor < 0.66) {
                    finalHue = hue2;
                } else {
                    finalHue = hue3;
                }
                
                // Apply color with glow effect
                fill(finalHue, 80, 90, 80);
                stroke(finalHue, 100, 100, 100);
                
                // Dynamic size
                let size = 3 + sin(params.time * 3 + theta + phi) * 1.5;
                sphere(size);
                
                pop();
            }
        }
    }
    
    // Central core
    push();
    let coreSize = 20 + sin(params.time * 2) * 10;
    
    // Glowing core with multiple layers
    for (let i = 3; i > 0; i--) {
        let alpha = map(i, 0, 3, 60, 10);
        let hue = (params.time * 50 + i * 40) % 360;
        fill(hue, 70, 100, alpha);
        noStroke();
        sphere(coreSize * (1 + i * 0.4));
    }
    pop();
    
    pop();
}

function drawHybridMode() {
    // Combine shader and classic rendering
    
    // First draw shader with transparency
    push();
    drawShaderMode();
    pop();
    
    // Then overlay classic points with lower opacity
    push();
    blendMode(ADD);
    tint(255, 100); // Semi-transparent
    drawClassicMode();
    blendMode(BLEND);
    pop();
}

// Check if point is in Mandelbulb set (simplified)
function isInMandelbulb(x, y, z) {
    let zx = x, zy = y, zz = z;
    let r = 0;
    let iterations = min(params.iterations, 16);
    
    for (let i = 0; i < iterations; i++) {
        r = sqrt(zx * zx + zy * zy + zz * zz);
        if (r > 2) return false;
        
        // Spherical coordinates
        let theta = atan2(sqrt(zx * zx + zy * zy), zz);
        let phi = atan2(zy, zx);
        
        // Mandelbulb formula
        let rPower = pow(r, params.power);
        theta *= params.power;
        phi *= params.power;
        
        // Back to Cartesian
        zx = rPower * sin(theta) * cos(phi) + x;
        zy = rPower * sin(theta) * sin(phi) + y;
        zz = rPower * cos(theta) + z;
    }
    
    return true;
}

// UI Setup
function setupUI() {
    // Sliders
    setupSlider('power', (value) => {
        params.power = parseFloat(value);
    });
    
    setupSlider('iterations', (value) => {
        params.iterations = parseInt(value);
    });
    
    setupSlider('detail', (value) => {
        params.detail = parseFloat(value);
        updateQuality();
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
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            document.getElementById('mode').textContent = 
                btn.dataset.mode.charAt(0).toUpperCase() + btn.dataset.mode.slice(1);
        });
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = presets[btn.dataset.preset];
            if (preset) {
                // Apply preset
                Object.assign(params, preset);
                
                // Update UI
                document.getElementById('power').value = preset.power;
                document.getElementById('power-value').textContent = preset.power.toFixed(1);
                
                document.getElementById('iterations').value = preset.iterations;
                document.getElementById('iterations-value').textContent = preset.iterations;
                
                document.getElementById('detail').value = preset.detail;
                document.getElementById('detail-value').textContent = preset.detail.toFixed(2);
                
                document.getElementById('colorshift').value = preset.colorShift;
                document.getElementById('colorshift-value').textContent = preset.colorShift.toFixed(2);
                
                document.getElementById('glow').value = preset.glowIntensity;
                document.getElementById('glow-value').textContent = preset.glowIntensity.toFixed(2);
                
                document.getElementById('zoom').value = preset.zoom;
                document.getElementById('zoom-value').textContent = preset.zoom.toFixed(1);
            }
        });
    });
    
    // Control buttons
    document.getElementById('auto-rotate').addEventListener('click', function() {
        autoRotate = !autoRotate;
        this.textContent = autoRotate ? '⏸️ Pause Rotate' : '🔄 Auto Rotate';
        this.classList.toggle('active');
    });
    
    document.getElementById('screenshot').addEventListener('click', () => {
        saveCanvas('mandelbulb-' + Date.now(), 'png');
    });
    
    document.getElementById('fullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    document.getElementById('reset').addEventListener('click', () => {
        // Reset parameters
        params = {
            power: 8.0,
            iterations: 16,
            detail: 0.8,
            colorShift: 0.0,
            glowIntensity: 0.5,
            zoom: 3.0,
            rotationX: 0,
            rotationY: 0,
            time: 0,
            cameraAngle: 0
        };
        
        // Reset UI
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
    
    slider.addEventListener('input', () => {
        let value = slider.value;
        if (id === 'iterations') {
            display.textContent = value;
        } else {
            display.textContent = parseFloat(value).toFixed(id === 'detail' || id === 'glow' || id === 'colorshift' ? 2 : 1);
        }
        callback(value);
    });
}

function updateAllDisplays() {
    document.getElementById('power-value').textContent = params.power.toFixed(1);
    document.getElementById('iterations-value').textContent = params.iterations;
    document.getElementById('detail-value').textContent = params.detail.toFixed(2);
    document.getElementById('colorshift-value').textContent = params.colorShift.toFixed(2);
    document.getElementById('glow-value').textContent = params.glowIntensity.toFixed(2);
    document.getElementById('zoom-value').textContent = params.zoom.toFixed(1);
}

function updateQuality() {
    let quality;
    if (params.detail < 0.4) {
        quality = 'Low';
    } else if (params.detail < 0.7) {
        quality = 'Medium';
    } else {
        quality = 'High';
    }
    document.getElementById('quality').textContent = quality;
}

// Window resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (shaderGraphics) {
        shaderGraphics = createGraphics(windowWidth, windowHeight, WEBGL);
        // Recompile shader
        try {
            mandelbulbShader = shaderGraphics.createShader(
                mandelbulbVertexShader,
                mandelbulbFragmentShader
            );
        } catch (error) {
            console.error('Shader recompilation error:', error);
        }
    }
}

// Mouse controls
function mouseWheel(event) {
    params.zoom += event.delta * 0.001;
    params.zoom = constrain(params.zoom, 1, 10);
    document.getElementById('zoom').value = params.zoom;
    document.getElementById('zoom-value').textContent = params.zoom.toFixed(1);
    return false;
}

function mousePressed() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        // Pause rotation on click
        if (autoRotate) {
            autoRotate = false;
            document.getElementById('auto-rotate').textContent = '🔄 Auto Rotate';
            document.getElementById('auto-rotate').classList.remove('active');
        }
    }
}

// Keyboard controls
function keyPressed() {
    switch(key) {
        case ' ':
            autoRotate = !autoRotate;
            break;
        case 's':
        case 'S':
            saveCanvas('mandelbulb-' + Date.now(), 'png');
            break;
        case '1':
            currentMode = 'shader';
            break;
        case '2':
            currentMode = 'classic';
            break;
        case '3':
            currentMode = 'hybrid';
            break;
    }
}