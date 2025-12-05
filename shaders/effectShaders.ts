
export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;

  // Textures
  uniform sampler2D tDiffuse;
  uniform sampler2D tFeedback;
  
  // Base
  uniform vec2 uResolution;
  uniform float uTime;
  
  // Audio
  uniform float uBass;
  uniform float uMids;
  uniform float uTreble;

  // Style
  uniform float uSaturation;
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uHueRotate;
  uniform bool uInvert;
  uniform float uGrain;
  uniform float uColorAbyss;

  // Retro / Digital
  uniform float uPixelation;
  uniform float uGlitchStrength;
  uniform float uHalftone;
  uniform bool uScanlines;
  uniform bool uVignette;

  // Geometry
  uniform float uRgbShift;
  uniform float uChromaticAberration;
  uniform float uFluidDistortion;
  uniform float uEdgeDistortion;
  uniform float uSobelStrength;
  uniform float uCrtCurvature;
  uniform bool uKaleidoscope;
  uniform float uKaleidoscopeSegments;

  // Feedback
  uniform bool uFeedback;
  uniform float uFeedbackAmount;
  uniform float uFeedbackZoom;
  uniform float uFeedbackRotation;
  uniform float uFeedbackEdgeFade;

  // LFO
  uniform int uLfoTarget; 
  uniform int uLfoWaveform;
  uniform float uLfoSpeed;
  uniform float uLfoAmount;

  // Audio Targets
  uniform int uBassTarget;
  uniform int uMidsTarget;
  uniform int uTrebleTarget;
  uniform float uAudioGain;

  // Constants
  const float PI = 3.14159265359;

  // --- Helper Functions ---

  // 2D Random
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // 2D Noise
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
  }
  
  // LFO value calculation
  float getLfoValue() {
    float t = uTime * uLfoSpeed;
    if (uLfoWaveform == 1) return abs(fract(t) * 2.0 - 1.0); // Triangle
    if (uLfoWaveform == 2) return step(0.5, fract(t)); // Square
    if (uLfoWaveform == 3) return fract(t); // Sawtooth
    return sin(t * 2.0 * PI); // Sine
  }

  // Color Abyss mapping
  vec3 colorAbyss(vec3 color, float amount) {
    vec3 ramp = vec3(
        sin(color.r * PI + uTime * 0.5),
        cos(color.g * PI * 2.0),
        sin(color.b * PI + length(vUv - 0.5))
    );
    return mix(color, ramp, amount);
  }

  // Hue Rotate
  vec3 hueRotate(vec3 color, float angle) {
      float c = cos(angle * 2.0 * PI);
      float s = sin(angle * 2.0 * PI);
      mat3 mat = mat3(
          0.213 + 0.787*c - 0.213*s, 0.715 - 0.715*c - 0.715*s, 0.072 - 0.072*c + 0.928*s,
          0.213 - 0.213*c + 0.143*s, 0.715 + 0.285*c + 0.140*s, 0.072 - 0.072*c - 0.283*s,
          0.213 - 0.213*c - 0.787*s, 0.715 - 0.715*c + 0.715*s, 0.072 + 0.928*c + 0.072*s
      );
      return mat * color;
  }

  // Sobel Edge Detection
  float sobel(sampler2D tex, vec2 uv, vec2 resolution) {
      float x = 1.0 / resolution.x;
      float y = 1.0 / resolution.y;
      vec4 horizEdge = vec4(0.0);
      horizEdge -= texture2D(tex, uv + vec2(-x, -y)) * 1.0;
      horizEdge -= texture2D(tex, uv + vec2(-x,  0)) * 2.0;
      horizEdge -= texture2D(tex, uv + vec2(-x,  y)) * 1.0;
      horizEdge += texture2D(tex, uv + vec2( x, -y)) * 1.0;
      horizEdge += texture2D(tex, uv + vec2( x,  0)) * 2.0;
      horizEdge += texture2D(tex, uv + vec2( x,  y)) * 1.0;
      vec4 vertEdge = vec4(0.0);
      vertEdge -= texture2D(tex, uv + vec2(-x, -y)) * 1.0;
      vertEdge -= texture2D(tex, uv + vec2( 0, -y)) * 2.0;
      vertEdge -= texture2D(tex, uv + vec2( x, -y)) * 1.0;
      vertEdge += texture2D(tex, uv + vec2(-x,  y)) * 1.0;
      vertEdge += texture2D(tex, uv + vec2( 0,  y)) * 2.0;
      vertEdge += texture2D(tex, uv + vec2( x,  y)) * 1.0;
      vec3 edge = sqrt((horizEdge.rgb * horizEdge.rgb) + (vertEdge.rgb * vertEdge.rgb));
      return length(edge);
  }

  // Halftone
  float halftone(vec2 uv, vec2 resolution, float intensity) {
      vec2 center = vec2(0.5, 0.5);
      float scale = resolution.x * 0.05; // Pattern scale
      float angle = 0.785398; // 45 degrees
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec2 st = rot * (uv * scale);
      vec2 nearest = 2.0 * fract(st) - 1.0;
      float dist = length(nearest);
      return 1.0 - step(intensity, dist);
  }

  // --- Main ---

  void main() {
    vec2 uv = vUv;
    
    // --- CRT Curvature ---
    if (uCrtCurvature > 0.0) {
        vec2 cent = uv - 0.5;
        // Apply slight zoom out to keep content visible
        cent *= 1.0 - (uCrtCurvature * 0.5); 
        // Distortion formula
        cent.x *= 1.0 + pow((abs(cent.y) * 2.0), 2.0) * uCrtCurvature * 0.5;
        cent.y *= 1.0 + pow((abs(cent.x) * 2.0), 2.0) * uCrtCurvature * 0.5;
        uv = cent + 0.5;
    }

    // Cutoff for CRT edges
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec2 p = uv - 0.5;

    // --- Parameter Modulation ---
    float lfo = (getLfoValue() * 2.0 - 1.0) * uLfoAmount; // LFO bipolar
    float uniLfo = (lfo + 1.0) * 0.5; // Unipolar 0-1
    float bass = uBass * uAudioGain;
    float mids = uMids * uAudioGain;
    float treble = uTreble * uAudioGain;
    
    // Mapping Strings to Ints (matches types.ts)
    // LFO: none(0), rgbShift(1), feedbackZoom(2), feedbackRotation(3), fluidDistortion(4), edgeDistortion(5), colorAbyss(6), hueRotate(7), glitchStrength(8), pixelation(9)
    // Audio Targets: none(0), rgbShift(1), feedbackZoom(2), fluidDistortion(3), edgeDistortion(4), chromaticAberration(5), glitchStrength(6), pixelation(7), hueRotate(8), sobelStrength(9)

    // Calculated Modulated Values
    float _rgbShift = uRgbShift 
        + (uLfoTarget == 1 ? lfo*50.0 : 0.0) 
        + (uBassTarget == 1 ? bass*50.0 : 0.0) + (uMidsTarget == 1 ? mids*50.0 : 0.0) + (uTrebleTarget == 1 ? treble*50.0 : 0.0);
        
    float _feedbackZoom = uFeedbackZoom 
        + (uLfoTarget == 2 ? lfo*0.02 : 0.0) 
        + (uBassTarget == 2 ? bass*0.02 : 0.0) + (uMidsTarget == 2 ? mids*0.02 : 0.0) + (uTrebleTarget == 2 ? treble*0.02 : 0.0);
        
    float _feedbackRotation = uFeedbackRotation 
        + (uLfoTarget == 3 ? lfo*0.05 : 0.0);
        
    float _fluidDistortion = uFluidDistortion 
        + (uLfoTarget == 4 ? lfo*0.2 : 0.0) 
        + (uBassTarget == 3 ? bass*0.2 : 0.0) + (uMidsTarget == 3 ? mids*0.2 : 0.0) + (uTrebleTarget == 3 ? treble*0.2 : 0.0);
        
    float _edgeDistortion = uEdgeDistortion 
        + (uLfoTarget == 5 ? lfo*0.3 : 0.0) 
        + (uBassTarget == 4 ? bass*0.3 : 0.0) + (uMidsTarget == 4 ? mids*0.3 : 0.0) + (uTrebleTarget == 4 ? treble*0.3 : 0.0);
        
    float _chromaticAberration = uChromaticAberration 
        + (uBassTarget == 5 ? bass*20.0 : 0.0) + (uMidsTarget == 5 ? mids*20.0 : 0.0) + (uTrebleTarget == 5 ? treble*20.0 : 0.0);
        
    float _colorAbyss = uColorAbyss + (uLfoTarget == 6 ? uniLfo : 0.0);
    
    float _hueRotate = uHueRotate 
        + (uLfoTarget == 7 ? lfo : 0.0) 
        + (uBassTarget == 8 ? bass : 0.0) + (uMidsTarget == 8 ? mids : 0.0) + (uTrebleTarget == 8 ? treble : 0.0);
        
    float _glitchStrength = uGlitchStrength 
        + (uLfoTarget == 8 ? uniLfo : 0.0) 
        + (uBassTarget == 6 ? bass : 0.0) + (uMidsTarget == 6 ? mids : 0.0) + (uTrebleTarget == 6 ? treble : 0.0);
        
    float _pixelation = uPixelation 
        + (uLfoTarget == 9 ? uniLfo*20.0 : 0.0)
        + (uBassTarget == 7 ? bass*20.0 : 0.0) + (uMidsTarget == 7 ? mids*20.0 : 0.0) + (uTrebleTarget == 7 ? treble*20.0 : 0.0);
        
    float _sobelStrength = uSobelStrength 
        + (uBassTarget == 9 ? bass*2.0 : 0.0) + (uMidsTarget == 9 ? mids*2.0 : 0.0) + (uTrebleTarget == 9 ? treble*2.0 : 0.0);


    // --- UV Manipulation ---

    // Pixelation
    if (_pixelation > 1.0) {
        float d = 1.0 / _pixelation;
        uv = floor(uv * uResolution * d) / (uResolution * d);
    }

    // Glitch / Datamosh
    if (_glitchStrength > 0.0) {
        float block = floor(uv.y * 20.0 + uTime * 5.0);
        float noiseWave = noise(vec2(block, uTime));
        if (noiseWave > (1.0 - _glitchStrength * 0.5)) {
            uv.x += (random(vec2(block, uTime)) - 0.5) * _glitchStrength * 0.5;
            float rgbSplit = _glitchStrength * 0.05;
        }
    }

    // Edge Distortion (Additional fluid warp)
    float edgeFactor = pow(length(p * 2.0), 2.0);
    uv.x += p.y * _edgeDistortion * edgeFactor;
    uv.y += p.x * _edgeDistortion * edgeFactor;

    // Fluid Distortion
    float noiseVal = noise(uv * 10.0 + uTime * 0.2);
    uv.x += noiseVal * _fluidDistortion;
    uv.y += noise(uv * 10.0 - uTime * 0.2) * _fluidDistortion;

    // Kaleidoscope
    if (uKaleidoscope) {
        vec2 k_p = uv - 0.5;
        float r = length(k_p);
        float a = atan(k_p.y, k_p.x);
        float segs = uKaleidoscopeSegments > 0.0 ? uKaleidoscopeSegments : 2.0;
        float segAngle = 2.0 * PI / segs;
        a = mod(a, segAngle);
        if(mod(floor(a / segAngle) + segs, 2.0) > 0.5) a = segAngle - a;
        uv = r * vec2(cos(a), sin(a)) + 0.5;
    }

    // --- Feedback ---
    vec2 fb_p = uv - 0.5; // Use curved UV for feedback too
    float rot = _feedbackRotation;
    mat2 rotMatrix = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    fb_p = rotMatrix * fb_p;
    
    // Adjusted zoom: positive values expand from center (tunnel effect)
    vec2 fb_uv = fb_p * (1.0 - _feedbackZoom) + 0.5;
    
    vec4 feedbackColor = texture2D(tFeedback, fb_uv);
    float fb_edge_fade = 1.0 - pow(length((vUv - 0.5) * 2.0), uFeedbackEdgeFade);
    feedbackColor.a *= fb_edge_fade;

    // --- Color Sampling & Mixing ---

    // Chromatic Aberration & RGB Shift
    float shift = _rgbShift / uResolution.x;
    float ca = _chromaticAberration / uResolution.x * (1.0 + edgeFactor);
    float r = texture2D(tDiffuse, uv + vec2(shift + ca, 0.0)).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - vec2(shift + ca, 0.0)).b;
    vec4 videoColor = vec4(r,g,b,1.0);

    // Sobel Overlay
    if (_sobelStrength > 0.0) {
        float edge = sobel(tDiffuse, uv, uResolution);
        videoColor.rgb = mix(videoColor.rgb, vec3(edge) + videoColor.rgb, _sobelStrength);
    }

    // Mix with feedback
    vec4 finalColor = uFeedback ? mix(videoColor, feedbackColor, uFeedbackAmount) : videoColor;

    // --- Post-Processing ---

    // Hue Rotate
    if (_hueRotate != 0.0) {
        finalColor.rgb = hueRotate(finalColor.rgb, _hueRotate);
    }
    
    // Invert
    if (uInvert) {
        finalColor.rgb = 1.0 - finalColor.rgb;
    }

    // Color Abyss
    finalColor.rgb = colorAbyss(finalColor.rgb, clamp(_colorAbyss, 0.0, 1.0));

    // Brightness, Contrast, Saturation
    finalColor.rgb = (finalColor.rgb - 0.5) * uContrast + 0.5;
    finalColor.rgb *= uBrightness;
    vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    float gray = dot(finalColor.rgb, luma);
    finalColor.rgb = mix(vec3(gray), finalColor.rgb, uSaturation);

    // Halftone
    if (uHalftone > 0.0) {
        float ht = halftone(vUv, uResolution, uHalftone * 1.5);
        finalColor.rgb *= mix(1.0, ht, uHalftone * 0.8);
    }

    // Grain
    finalColor.rgb += (random(vUv * uTime) - 0.5) * uGrain;
    
    // Vignette (Pronounced, respecting curve)
    if (uVignette) {
      float d = length(p); // p is already curved
      float vig = smoothstep(0.7, 0.3, d);
      finalColor.rgb *= vig;
    }
    
    // Scanlines (Pronounced, respecting curve)
    if (uScanlines) {
      // Use curved uv.y
      float count = uResolution.y * 0.5;
      float scan = sin(uv.y * count * PI * 2.0);
      float intensity = 0.25;
      finalColor.rgb *= (1.0 - intensity * (scan * 0.5 + 0.5));
    }
    
    gl_FragColor = finalColor;
  }
`;
