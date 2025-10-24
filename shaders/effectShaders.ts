export const vertexShader = `
  varying vec2 vUv;
  uniform float uCrtCurvature;

  void main() {
    vUv = uv;
    vec2 pos = position.xy;
    
    // Apply CRT curvature
    pos.x *= 1.0 + pow(abs(pos.y / 1.0), 2.0) * uCrtCurvature;
    pos.y *= 1.0 + pow(abs(pos.x / 1.0), 2.0) * uCrtCurvature;

    gl_Position = vec4(pos, 0.0, 1.0);
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

  // Effect Settings
  uniform float uSaturation;
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uGrain;
  uniform float uColorAbyss;
  uniform float uRgbShift;
  uniform float uChromaticAberration;
  uniform float uFluidDistortion;
  uniform float uEdgeDistortion;
  uniform bool uKaleidoscope;
  uniform float uKaleidoscopeSegments;
  uniform bool uFeedback;
  uniform float uFeedbackAmount;
  uniform float uFeedbackZoom;
  uniform float uFeedbackRotation;
  uniform float uFeedbackEdgeFade;
  uniform bool uScanlines;
  uniform bool uVignette;

  // LFO
  uniform int uLfoTarget; // Mapped from string to int
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

  // --- Main ---

  void main() {
    vec2 p = vUv - 0.5;
    vec2 uv = vUv;

    // --- Parameter Modulation ---
    float lfo = (getLfoValue() * 2.0 - 1.0) * uLfoAmount; // LFO is bipolar
    float bass = uBass * uAudioGain;
    float mids = uMids * uAudioGain;
    float treble = uTreble * uAudioGain;
    
    // Map string enums to int indices
    // Note: This mapping needs to be consistent with the control panel options
    // LFO Targets: none(0), rgbShift(1), feedbackZoom(2), feedbackRotation(3), fluidDistortion(4), edgeDistortion(5), colorAbyss(6)
    // Audio Targets: none(0), rgbShift(1), feedbackZoom(2), fluidDistortion(3), edgeDistortion(4), chromaticAberration(5)
    float _rgbShift = uRgbShift + (uLfoTarget == 1 ? lfo*50.0 : 0.0) + (uBassTarget == 1 ? bass*50.0 : 0.0) + (uMidsTarget == 1 ? mids*50.0 : 0.0) + (uTrebleTarget == 1 ? treble*50.0 : 0.0);
    float _feedbackZoom = uFeedbackZoom + (uLfoTarget == 2 ? lfo*0.1 : 0.0) + (uBassTarget == 2 ? bass*0.1 : 0.0) + (uMidsTarget == 2 ? mids*0.1 : 0.0) + (uTrebleTarget == 2 ? treble*0.1 : 0.0);
    float _feedbackRotation = uFeedbackRotation + (uLfoTarget == 3 ? lfo*0.05 : 0.0);
    float _fluidDistortion = uFluidDistortion + (uLfoTarget == 4 ? lfo*0.2 : 0.0) + (uBassTarget == 3 ? bass*0.2 : 0.0) + (uMidsTarget == 3 ? mids*0.2 : 0.0) + (uTrebleTarget == 3 ? treble*0.2 : 0.0);
    float _edgeDistortion = uEdgeDistortion + (uLfoTarget == 5 ? lfo*0.3 : 0.0) + (uBassTarget == 4 ? bass*0.3 : 0.0) + (uMidsTarget == 4 ? mids*0.3 : 0.0) + (uTrebleTarget == 4 ? treble*0.3 : 0.0);
    float _chromaticAberration = uChromaticAberration + (uBassTarget == 5 ? bass*20.0 : 0.0) + (uMidsTarget == 5 ? mids*20.0 : 0.0) + (uTrebleTarget == 5 ? treble*20.0 : 0.0);
    float _colorAbyss = uColorAbyss + (uLfoTarget == 6 ? lfo : 0.0);

    // --- UV Manipulation ---
    
    // Edge Distortion
    float edgeFactor = pow(length(p * 2.0), 2.0);
    uv.x += p.y * _edgeDistortion * edgeFactor;
    uv.y += p.x * _edgeDistortion * edgeFactor;

    // Fluid Distortion
    float noiseVal = noise(uv * 10.0 + uTime * 0.2);
    uv.x += noiseVal * _fluidDistortion;
    uv.y += noise(uv * 10.0 - uTime * 0.2) * _fluidDistortion;

    // Kaleidoscope
    if (uKaleidoscope) {
        p = uv - 0.5;
        float r = length(p);
        float a = atan(p.y, p.x);
        float segs = uKaleidoscopeSegments > 0.0 ? uKaleidoscopeSegments : 2.0;
        float segAngle = 2.0 * PI / segs;
        a = mod(a, segAngle);
        if(mod(floor(a / segAngle) + segs, 2.0) > 0.5) a = segAngle - a;
        uv = r * vec2(cos(a), sin(a)) + 0.5;
    }

    // --- Feedback ---
    vec2 fb_p = vUv - 0.5;
    float rot = _feedbackRotation;
    mat2 rotMatrix = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    fb_p = rotMatrix * fb_p;
    vec2 fb_uv = (fb_p / (1.0 - _feedbackZoom)) + 0.5;
    
    vec4 feedbackColor = texture2D(tFeedback, fb_uv);
    float fb_edge_fade = 1.0 - pow(length((vUv - 0.5) * 2.0), uFeedbackEdgeFade);
    feedbackColor.a *= fb_edge_fade;

    // --- Color Sampling & Mixing ---

    // Chromatic Aberration & RGB Shift
    float shift = _rgbShift / uResolution.x;
    float ca = _chromaticAberration / uResolution.x * edgeFactor;
    float r = texture2D(tDiffuse, uv + vec2(shift + ca, 0.0)).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - vec2(shift + ca, 0.0)).b;
    vec4 videoColor = vec4(r,g,b,1.0);

    // Mix with feedback
    vec4 finalColor = uFeedback ? mix(videoColor, feedbackColor, uFeedbackAmount) : videoColor;

    // --- Post-Processing ---

    // Color Abyss
    finalColor.rgb = colorAbyss(finalColor.rgb, clamp(_colorAbyss, 0.0, 1.0));

    // Brightness, Contrast, Saturation
    finalColor.rgb = (finalColor.rgb - 0.5) * uContrast + 0.5;
    finalColor.rgb *= uBrightness;
    vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    float gray = dot(finalColor.rgb, luma);
    finalColor.rgb = mix(vec3(gray), finalColor.rgb, uSaturation);

    // Grain
    finalColor.rgb += (random(vUv * uTime) - 0.5) * uGrain;
    
    // Vignette
    if (uVignette) {
      float vig = 1.0 - length(p) * 1.2;
      finalColor.rgb *= vig;
    }
    
    // Scanlines
    if (uScanlines) {
      finalColor.rgb *= (1.0 - 0.25 * sin(vUv.y * uResolution.y * 0.5 * PI));
    }
    
    gl_FragColor = finalColor;
  }
`;
