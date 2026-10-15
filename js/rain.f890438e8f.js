/* Original OUCH fragment shader, recovered verbatim from supplied main.js.
 * Native WebGL wrapper replaces only the rendering plumbing. No CDN dependencies.
 * Original complete script is preserved in original/main.js. The former optional
 * Three.js bloom pass is not included. Video refraction and pointer response remain.
 */
(() => {
'use strict';
const fragmentSource = String.raw`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2  uRes;
      uniform vec2  uVid;
      uniform vec2  uReelVid;
      uniform float uHasReel;
      uniform vec2  uMouse;
      uniform float uMouseV;
      uniform sampler2D tRain;
      uniform sampler2D tReel;

      // shoya's optimizationTextureUv (cover-fit a texture in screen aspect)
      vec2 coverUv(vec2 uv, float pa, float ta) {
        vec2 ratio = vec2(min(ta/pa, 1.0), min((1.0/ta)/(1.0/pa), 1.0));
        return vec2((uv.x - 0.5) * ratio.x + 0.5,
                    (uv.y - 0.5) * ratio.y + 0.5);
      }

      // Soften a normal-map channel slightly — keeps structure but kills
      // jagged edges so drops look like glass blobs, not pixel noise.
      float sharpen(float v) {
        return clamp((v - 0.5) * 1.05 + 0.5, 0.0, 1.0);
      }

      void main() {
        float aspect     = uRes.x / uRes.y;
        float reelAspect = uReelVid.x / uReelVid.y;

        // ---- rain normal map ----
        // Zoom IN on the rain video (scale < 1) so each droplet is large
        // on screen, like shoya's. No drift -> the static droplets stay put
        // and only the rivulets baked into the video animate.
        // Aspect-corrected so droplets stay round on wide screens.
        float rainZoom = 0.55;
        vec2 rainScale = vec2(rainZoom * (aspect / 1.7777), rainZoom);
        vec2 nUv = (vUv - 0.5) * rainScale + 0.5;
        vec2 offB = vec2(0.10);
        vec3 nRain;
        nRain.r = sharpen(texture2D(tRain, nUv).r);
        nRain.g = sharpen(texture2D(tRain, nUv).g);
        nRain.b = sharpen(texture2D(tRain, nUv + offB).b);

        // ---- "metal" layer: same rain texture, slightly different zoom ----
        // No drift here either, only sized differently to compound distortion.
        float metalZoom = 0.85;
        vec2 mUv = (vUv - 0.5) * vec2(metalZoom * (aspect / 1.7777), metalZoom)
                 + vec2(0.5 + 0.07, 0.5 - 0.04);
        vec3 nMetal = texture2D(tRain, mUv).rgb;
        nMetal = pow(nMetal * 2.0, vec3(2.0));

        // ---- mouse fluid (faked) ----
        vec2 mp = uMouse;
        vec2 mDelta = (vUv - mp) * vec2(aspect, 1.0);
        float mDist = length(mDelta);
        float fluid = exp(-mDist * mDist * 22.0) * (0.35 + uMouseV * 4.0);
        fluid = clamp(fluid, 0.0, 1.0);

        // ---- diffuse lighting from rain normal (his exact line) ----
        float diffuse = clamp(dot(nRain.rgb, vec3(1.0, 0.5, 0.75)), 0.0, 1.0);

        // ---- vignette (his exact line) ----
        float vignette = smoothstep(0.75, -0.5, distance(vUv, vec2(0.5)));

        // ---- multiplicative refraction of the reel ----
        vec2 uv  = coverUv(vUv, aspect, reelAspect);
        vec2 uv1 = uv;
        uv1 = uv1 * nMetal.xy;
        uv1 = uv1 * nRain.xy * 2.75;
        float thresholdUv = 0.8;
        vec2 sampleUv = uv1 * (1.0 - thresholdUv)
                      + mix(uv1, uv, fluid) * thresholdUv;

        vec4 cVideo = texture2D(tReel, sampleUv);
        // 9-tap box blur on the reel so the BG reads as soft glass, with the
        // sharp droplet sheen layered on top (this is the look shoya gets:
        // blurry scene behind, crystalline rain in front).
        // Heavy blur so the BG reads as soft frosted glass like shoya
        vec2 blurPx = vec2(1.0 / uRes.x, 1.0 / uRes.y) * 11.0;
        vec3 blur = vec3(0.0);
        blur += texture2D(tReel, sampleUv + blurPx * vec2( 0.0, 0.0)).rgb * 0.20;
        blur += texture2D(tReel, sampleUv + blurPx * vec2( 1.5, 0.0)).rgb * 0.10;
        blur += texture2D(tReel, sampleUv + blurPx * vec2(-1.5, 0.0)).rgb * 0.10;
        blur += texture2D(tReel, sampleUv + blurPx * vec2( 0.0, 1.5)).rgb * 0.10;
        blur += texture2D(tReel, sampleUv + blurPx * vec2( 0.0,-1.5)).rgb * 0.10;
        blur += texture2D(tReel, sampleUv + blurPx * vec2( 1.2, 1.2)).rgb * 0.10;
        blur += texture2D(tReel, sampleUv + blurPx * vec2(-1.2, 1.2)).rgb * 0.10;
        blur += texture2D(tReel, sampleUv + blurPx * vec2( 1.2,-1.2)).rgb * 0.10;
        blur += texture2D(tReel, sampleUv + blurPx * vec2(-1.2,-1.2)).rgb * 0.10;
        cVideo.rgb = mix(cVideo.rgb, blur, 0.85);
        cVideo.rgb = mix(vec3(0.05, 0.0, 0.02), cVideo.rgb, uHasReel);

        vec3 col = cVideo.rgb;

        // mix in a 'roughness' tint
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        vec3 rough = vec3(lum) * vec3(1.10, 0.55, 0.62);
        col = mix(col, rough, 0.5);

        // vignette fade
        col = mix(col * vignette * 0.5, col, vignette);

        // diffuse darken
        col = mix(col, col * diffuse, 0.25);

        // OUCH crimson tint — neutralise globally, crimson bleeds in at edges below
        col *= vec3(0.90, 0.82, 0.82);

        // global desaturation toward luminance — kills the gamey reds
        float gray = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(col, vec3(gray), 0.30);

        // base exposure — darker overall to create dread
        col *= 0.58;

        // STRONG center vignette — nearly black centre, opens toward edges
        float vDist = distance(vUv, vec2(0.5));
        float vig2  = smoothstep(0.85, 0.30, vDist);
        col *= mix(0.10, 1.0, vig2);

        // edge-only crimson bleed — colour only where darkness lifts
        float edgeTint = pow(1.0 - vig2, 1.8);
        col.r += edgeTint * 0.22;
        col.gb *= 1.0 - edgeTint * 0.30;

        // fake vertical light bleed (window light through the glass)
        float vert = smoothstep(0.15, 0.75, 1.0 - abs(vUv.y - 0.5) * 1.4);
        col *= mix(0.85, 1.10, vert);

        // fluid highlight: crimson glow under the cursor
        col += vec3(1.0, 0.20, 0.28) * fluid * 0.45;

        // ---- droplet sheen: re-impose the rain so the BEADS read sharp ----
        // Soft Gaussian on the rain normal to give blobs rather than sharp edges
        vec2 bUv = (vUv - 0.5) * vec2(0.55 * (aspect / 1.7777), 0.55) + 0.5;
        float beadSum = 0.0;
        float bw = vec2(1.0 / uRes.x, 1.0 / uRes.y).x * 2.5;
        beadSum += texture2D(tRain, bUv).r * 0.36;
        beadSum += texture2D(tRain, bUv + vec2( bw,  0.0)).r * 0.15;
        beadSum += texture2D(tRain, bUv + vec2(-bw,  0.0)).r * 0.15;
        beadSum += texture2D(tRain, bUv + vec2( 0.0,  bw)).r * 0.15;
        beadSum += texture2D(tRain, bUv + vec2( 0.0, -bw)).r * 0.15;
        beadSum += texture2D(tRain, bUv + vec2( bw,   bw)).r * 0.01;
        beadSum += texture2D(tRain, bUv + vec2(-bw,   bw)).r * 0.01;
        beadSum += texture2D(tRain, bUv + vec2( bw,  -bw)).r * 0.01;
        beadSum += texture2D(tRain, bUv + vec2(-bw,  -bw)).r * 0.01;
        float bead = smoothstep(0.48, 0.85, beadSum);
        // softer sheen now that bloom + vignette do work
        col += vec3(0.85, 0.86, 0.92) * bead * 0.45;
        col.r += bead * 0.10;
        col.b += bead * 0.08;
        // dark wet valleys
        float valley = 1.0 - smoothstep(0.20, 0.58, bead);
        col *= mix(1.0, 0.78, valley * 0.55);

        // ---- RADIAL CHROMATIC ABERRATION (shoya post-pass technique) ----
        // Resample the already-built color with a radial offset whose
        // strength grows toward screen edges. R goes out, B goes in.
        // This is what produces the blue/red split fringing along the rain.
        vec2 toCenter = vUv - 0.5;
        float radial = length(toCenter * vec2(aspect, 1.0));
        float caGate = smoothstep(0.15, 0.95, radial);
        vec2 caDir   = normalize(toCenter + 1e-6);
        // also drive aberration off the rain normal -> the split rides the drops
        float caBoost = bead * 0.6 + caGate * 0.012;
        float caR = caBoost * 1.0;
        float caB = caBoost * 1.0;
        // sample the reel again with red/blue offsets to get true CA on bg
        vec3 caCol;
        caCol.r = texture2D(tReel, sampleUv + caDir * caR).r;
        caCol.g = cVideo.g;
        caCol.b = texture2D(tReel, sampleUv - caDir * caB).b;
        caCol = caCol * vec3(1.10, 0.62, 0.68) + vec3(0.04, 0.0, 0.012);
        col = mix(col, caCol, 0.65 * (caGate + bead * 0.8));

        // ---- ANIMATED FILM GRAIN — exact technique from shoya's post shader ----
        // randomHash -> anime -> noise -> subtract from color
        float rh = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453123);
        float grain = sin(rh * 10.0 + uTime * 5.0) * 0.5;
        col -= grain * 0.055;

        // light gamma
        col = pow(max(col, 0.0), vec3(0.95));

        gl_FragColor = vec4(col, 1.0);
      }
    `;
const canvas=document.getElementById('rain-canvas');
if(!canvas)return;
const rain=document.getElementById('rain-video'),reel=document.getElementById('reel-video');
const button=document.querySelector('.motion-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused=reduced.matches,visible=true,frame=0,disposed=false;
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
function unavailable(){canvas.style.display='none';rain.pause();reel.pause();if(button){button.textContent='Static background';button.disabled=true;}}
if(!gl){unavailable();return;}
function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){console.warn('Rain shader:',gl.getShaderInfoLog(shader));gl.deleteShader(shader);throw Error('Shader compile failed');}return shader;}
let program;
try{
 program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 position; varying vec2 vUv; void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');
}catch(error){unavailable();return;}
gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
const u={};for(const n of ['uTime','uRes','uVid','uReelVid','uHasReel','uMouse','uMouseV','tRain','tReel'])u[n]=gl.getUniformLocation(program,n);
function texture(unit,uniform){gl.activeTexture(gl.TEXTURE0+unit);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([20,10,14,255]));gl.uniform1i(u[uniform],unit);return t;}
const textures=[texture(0,'tRain'),texture(1,'tReel')];
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
let mouse=[.5,.5],smooth=[.5,.5],previous=[.5,.5],velocity=0;
function resize(){const ratio=Math.min(devicePixelRatio||1,window.OUCH_SETTINGS?.rainResolution||1.25);canvas.width=Math.round(canvas.clientWidth*ratio);canvas.height=Math.round(canvas.clientHeight*ratio);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(u.uRes,canvas.width,canvas.height);draw(performance.now(),false);}
function draw(time,loop=true){
 if(disposed)return;
 try{
 [rain,reel].forEach((video,i)=>{if(video.readyState>=2){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);}});
 gl.uniform2f(u.uVid,rain.videoWidth||960,rain.videoHeight||540);gl.uniform2f(u.uReelVid,reel.videoWidth||960,reel.videoHeight||540);gl.uniform1f(u.uHasReel,reel.readyState>=2?1:0);
 smooth[0]+=(mouse[0]-smooth[0])*.12;smooth[1]+=(mouse[1]-smooth[1])*.12;
 const speed=Math.hypot(smooth[0]-previous[0],smooth[1]-previous[1]);velocity+=(speed-velocity)*.18;previous=[...smooth];
 gl.uniform2f(u.uMouse,...smooth);gl.uniform1f(u.uMouseV,velocity);gl.uniform1f(u.uTime,time/1000);gl.drawArrays(gl.TRIANGLES,0,6);
 }catch(error){console.warn('Rain video unavailable',error);disposed=true;unavailable();return;}
 if(loop&&!manuallyPaused&&visible&&!document.hidden)frame=requestAnimationFrame(draw);
}
function sync(){cancelAnimationFrame(frame);const running=!manuallyPaused&&visible&&!document.hidden;
 if(running){rain.play().catch(()=>{});reel.play().catch(()=>{});frame=requestAnimationFrame(draw);}else{rain.pause();reel.pause();draw(performance.now(),false);}
 if(button){button.setAttribute('aria-pressed',String(manuallyPaused));button.setAttribute('aria-label',manuallyPaused?'Resume background motion':'Pause background motion');button.innerHTML=manuallyPaused?'Resume motion <span>▶</span>':'Pause motion <span>Ⅱ</span>';}
}
button?.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;sync();});
reduced.addEventListener('change',e=>{manuallyPaused=e.matches;sync();});
window.addEventListener('resize',resize,{passive:true});
window.addEventListener('pointermove',e=>{if(manuallyPaused)return;mouse=[e.clientX/innerWidth,1-e.clientY/innerHeight];},{passive:true});
document.addEventListener('visibilitychange',sync);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
for(const video of [rain,reel]){video.addEventListener('loadeddata',()=>draw(performance.now(),false));video.addEventListener('error',()=>{canvas.style.opacity='.25';});}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);disposed=true;unavailable();});
// Restore the complete renderer cleanly after a GPU context loss.
canvas.addEventListener('webglcontextrestored',()=>location.reload());
resize();sync();
})();
