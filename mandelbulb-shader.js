// Mandelbulb Ray Marching Shader for p5.js
// 本格的なマンデルバルブレイマーチングシェーダー

const mandelbulbVertexShader = `
precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    gl_Position = positionVec4;
}
`;

const mandelbulbFragmentShader = `
precision highp float;

varying vec2 vTexCoord;

uniform vec2 uResolution;
uniform float uTime;
uniform float uPower;
uniform int uIterations;
uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;
uniform float uColorShift;
uniform float uGlowIntensity;
uniform float uDetail;
uniform float uZoom;

const float MAX_DIST = 20.0;
const int MAX_STEPS = 256;
const float SURF_DIST = 0.0001;
const float BAILOUT = 2.0;

// Rotation matrix
mat3 rotateX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, -s,
        0.0, s, c
    );
}

mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, 0.0, s,
        0.0, 1.0, 0.0,
        -s, 0.0, c
    );
}

// Mandelbulb Distance Estimator
float mandelbulbDE(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    float power = uPower;
    
    for(int i = 0; i < 32; i++) {
        if(i >= uIterations) break;
        
        r = length(z);
        if(r > BAILOUT) break;
        
        // Convert to spherical coordinates
        float theta = acos(clamp(z.z/r, -1.0, 1.0));
        float phi = atan(z.y, z.x);
        
        // Mandelbulb iteration
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        
        // Scale and rotate
        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;
        
        // Convert back to Cartesian
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(theta) * sin(phi),
            cos(theta)
        );
        z += pos;
    }
    
    return 0.5 * log(r) * r / dr;
}

// Enhanced Mandelbulb with deformations
float mandelbulbEnhanced(vec3 pos) {
    // Apply time-based deformation
    vec3 deformed = pos;
    float wave = sin(uTime * 0.5) * 0.05;
    deformed.x += sin(pos.y * 2.0 + uTime) * wave;
    deformed.y += cos(pos.z * 2.0 + uTime * 0.7) * wave;
    deformed.z += sin(pos.x * 2.0 + uTime * 1.3) * wave;
    
    return mandelbulbDE(deformed);
}

// Get normal
vec3 getNormal(vec3 p) {
    float d = mandelbulbEnhanced(p);
    vec2 e = vec2(0.0001, 0.0);
    
    vec3 n = d - vec3(
        mandelbulbEnhanced(p - e.xyy),
        mandelbulbEnhanced(p - e.yxy),
        mandelbulbEnhanced(p - e.yyx)
    );
    
    return normalize(n);
}

// Soft shadows
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    
    for(int i = 0; i < 64; i++) {
        float h = mandelbulbEnhanced(ro + rd * t);
        res = min(res, k * h / t);
        t += clamp(h, 0.001, 0.1);
        if(h < 0.0001 || t > maxt) break;
    }
    
    return clamp(res, 0.0, 1.0);
}

// Ambient occlusion
float ambientOcclusion(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    
    for(int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = mandelbulbEnhanced(p + h * n);
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

// Color palette - psychedelic colors like in the reference
vec3 getColor(float t, vec3 pos, vec3 normal) {
    // Multi-layered color based on position and iteration
    vec3 col1 = vec3(0.1, 0.9, 0.4); // Green-cyan
    vec3 col2 = vec3(1.0, 0.3, 0.7); // Pink-magenta
    vec3 col3 = vec3(1.0, 0.9, 0.1); // Yellow
    vec3 col4 = vec3(0.3, 0.7, 1.0); // Light blue
    
    // Mix colors based on multiple factors
    float mixer1 = sin(t * 5.0 + uColorShift) * 0.5 + 0.5;
    float mixer2 = cos(t * 3.0 + pos.x * 2.0) * 0.5 + 0.5;
    float mixer3 = sin(pos.y * 3.0 + pos.z * 2.0) * 0.5 + 0.5;
    
    vec3 color = mix(col1, col2, mixer1);
    color = mix(color, col3, mixer2);
    color = mix(color, col4, mixer3);
    
    // Add iridescence based on normal
    float irid = dot(normal, normalize(vec3(1.0, 1.0, 1.0)));
    color += vec3(0.2, 0.1, 0.3) * pow(abs(irid), 2.0);
    
    return color;
}

// Ray marching
vec3 rayMarch(vec3 ro, vec3 rd) {
    float dO = 0.0;
    vec3 color = vec3(0.0);
    float iterations = 0.0;
    
    for(int i = 0; i < MAX_STEPS; i++) {
        iterations = float(i);
        vec3 p = ro + rd * dO;
        float dS = mandelbulbEnhanced(p) * uDetail;
        
        if(dS < SURF_DIST) {
            // Hit surface - calculate lighting
            vec3 normal = getNormal(p);
            
            // Main light
            vec3 lightPos = vec3(3.0, 4.0, -3.0);
            vec3 lightDir = normalize(lightPos - p);
            float diff = max(dot(normal, lightDir), 0.0);
            
            // Shadows
            float shadow = softShadow(p + normal * SURF_DIST * 2.0, lightDir, 0.02, 10.0, 8.0);
            
            // Ambient occlusion
            float ao = ambientOcclusion(p, normal);
            
            // Color based on iteration count and position
            float colorT = iterations / float(MAX_STEPS);
            vec3 baseColor = getColor(colorT, p, normal);
            
            // Specular
            vec3 viewDir = normalize(ro - p);
            vec3 reflectDir = reflect(-lightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            
            // Fresnel effect
            float fresnel = pow(1.0 - max(dot(normal, -rd), 0.0), 2.0);
            
            // Combine lighting
            color = baseColor * 0.2; // Ambient
            color += baseColor * diff * shadow * ao * 0.8; // Diffuse
            color += vec3(1.0) * spec * shadow * 0.5; // Specular
            color += baseColor * fresnel * 0.3; // Rim light
            
            // Sub-surface scattering effect
            float sss = pow(max(dot(normal, -lightDir), 0.0), 3.0);
            color += baseColor * sss * 0.2;
            
            break;
        }
        
        dO += dS;
        
        if(dO > MAX_DIST) {
            // Background with glow effect
            float glow = exp(-iterations * 0.01) * uGlowIntensity;
            color = vec3(0.05, 0.02, 0.1) + getColor(uTime * 0.1, vec3(0.0), vec3(0.0)) * glow * 0.2;
            break;
        }
    }
    
    // Add iteration-based glow
    float iterGlow = iterations / float(MAX_STEPS);
    color += getColor(iterGlow, vec3(0.0), vec3(1.0)) * iterGlow * uGlowIntensity * 0.3;
    
    return color;
}

// Camera matrix
mat3 setCamera(vec3 ro, vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
}

void main() {
    vec2 uv = (vTexCoord - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;
    
    // Camera setup
    vec3 ro = uCameraPos * uZoom;
    vec3 ta = uCameraTarget;
    
    // Camera matrix
    mat3 ca = setCamera(ro, ta, 0.0);
    
    // Ray direction
    vec3 rd = ca * normalize(vec3(uv, 1.5));
    
    // Ray march
    vec3 color = rayMarch(ro, rd);
    
    // Post-processing
    // Vignette
    float vignette = 1.0 - length(uv) * 0.3;
    color *= vignette;
    
    // Contrast and saturation
    color = pow(color, vec3(0.8)); // Gamma correction
    color = mix(vec3(dot(color, vec3(0.299, 0.587, 0.114))), color, 1.2); // Saturation
    
    // Tone mapping
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));
    
    gl_FragColor = vec4(color, 1.0);
}
`;