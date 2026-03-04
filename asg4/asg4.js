let canvas, gl;
let a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotation, u_ProjectionMatrix, u_NormalMatrix;
let a_UV, a_Normal;
let g_normalsOn = false;  
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let u_ViewMatrix;
let camera;

let gThighAngle = 0;   
let gCalfAngle  = 0;   
let gFootAngle  = 0;   
let gAnimalGlobalRotation = 0;

//animation globals
let g_seconds = 0;
let g_lastFrameTime = performance.now();
let g_animationOn = false;

//mouse rotation globals
let gMouseRotX = 0;
let gMouseRotY = 0;
let gDragging = false;
let gLastX = 0;
let gLastY = 0;

//poke animation globals
let g_poke = false;
let g_pokeTimer = 0;
let g_headTilt = 0;

// fps globals
let g_frameCount = 0;
let g_lastFPSUpdate = performance.now();

// Game variables
let g_bunnyFound = false;
let g_gameMessage = "Find the bunny! (Press F when close)";

let u_LightPos;
let g_lightPos = [2, 2, 2];

let g_lightOn = true;  
let u_LightOn;   

let g_lightAnimate = true;
let g_lightAnimSpeed = 1.0;
let g_lightAnimRadius = 3.0;
let g_lightAnimCenter = [0, 2.0, 0];

let g_lightOrbitCenter = [1, -0.6, 0]; 
let g_lightOrbitRadius = 2.0;

let u_CameraPos;

let g_globalRotMat = new Matrix4(); 

let g_lightColor = [1.0, 1.0, 1.0]; // white by default
let u_LightColor;

let g_spotOn = true;
let u_SpotOn, u_SpotDir, u_SpotCutoff;
let g_spotPos = [0, 3, 0];
let g_spotDir = [0, -1, 0]; // pointing straight down

let g_humanModel = null;

//vertex shader
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV; 
  varying vec3 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_GlobalRotation;
  uniform mat4 u_ProjectionMatrix;
  attribute vec3 a_Normal;   // add this
  varying vec3 v_Normal;     // add this
  uniform mat4 u_NormalMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;
    v_UV = a_UV;

    // world position must match the same "world transform" used for drawing:
    vec4 worldPos = u_GlobalRotation * u_ModelMatrix * a_Position;
    v_VertPos = worldPos.xyz;

    // normals must be transformed with the normal matrix:
    v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
}
`;

//fragment shader
const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;  // NEW: third texture
  uniform int u_whichTexture;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_VertPos;
  uniform vec3 u_LightPos;
  uniform vec3 u_CameraPos;
  uniform bool u_LightOn;   // NEW
  uniform vec3 u_LightColor;
  uniform bool u_SpotOn;
  uniform vec3 u_SpotDir;
  uniform float u_SpotCutoff;

  void main() {
    if (u_CameraPos.x > 999999.0) { gl_FragColor = vec4(1,0,1,1); return; }

    // -------- Base color (same logic as before) --------
    vec4 baseColor;
  
    if (u_whichTexture == -3) {
      // Normal visualization (do NOT apply lighting)
      gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0);
      return;
    } else if (u_whichTexture == -2) {
      baseColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      // UV debug (do NOT apply lighting)
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
      return;
    } else if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      baseColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      baseColor = texture2D(u_Sampler2, v_UV);
    } else {
      baseColor = vec4(1.0, 0.2, 0.2, 1.0);
    }

    // If lighting is off, show baseColor only (no ambient/diffuse/specular)
    if (!u_LightOn) {
    gl_FragColor = baseColor;
    return;
    }
  
    // -------- B) Diffuse (N·L) --------
    vec3 N = normalize(v_Normal);
    vec3 L = normalize(u_LightPos - v_VertPos);   // vertex -> light
  
    float nDotL = max(dot(N, L), 0.0);
    vec3 diffuse = baseColor.rgb * nDotL * u_LightColor;
  
    // -------- B) Ambient --------
    float ambientStrength = 0.2;
    vec3 ambient = baseColor.rgb * ambientStrength;
  
    // -------- C) Specular --------
    vec3 V = normalize(u_CameraPos - v_VertPos);  // vertex -> camera
    vec3 R = reflect(-L, N);                      // reflect wants incoming vector
  
    float specStrength = 0.5;
    float shininess = 10.0;
  
    float spec = pow(max(dot(V, R), 0.0), shininess);
    vec3 specular = vec3(u_LightColor * specStrength * spec);
  
    // -------- Spotlight contribution --------
    float spotEffect = 0.0;
    if (u_SpotOn) {
      vec3 spotL = normalize(u_LightPos - v_VertPos);
      float angle = dot(normalize(-spotL), normalize(u_SpotDir));
      if (angle > u_SpotCutoff) {
        spotEffect = pow(angle, 8.0);
      }
    }

    // -------- Final --------
    vec3 color = ambient + diffuse + specular + (diffuse * spotEffect);
    gl_FragColor = vec4(color, baseColor.a);
  }
`;

function addActionsForHtmlUI_PA4() {
    document.getElementById('normOn').onclick  = () => { g_normalsOn = true; };
    document.getElementById('normOff').onclick = () => { g_normalsOn = false; };
  
    document.getElementById('lightOnBtn').onclick  = () => { g_lightOn = true;  renderScene(); };
    document.getElementById('lightOffBtn').onclick = () => { g_lightOn = false; renderScene(); };

    document.getElementById('lightSlideX').oninput = (ev) => {
      g_lightAnimate = false;
      g_lightPos[0] = Number(ev.target.value);
      document.getElementById('lightXVal').innerText = ev.target.value;
      renderScene();
    };
  
    document.getElementById('lightSlideY').oninput = (ev) => {
      g_lightAnimate = false;
      g_lightPos[1] = Number(ev.target.value);
      document.getElementById('lightYVal').innerText = ev.target.value;
      renderScene();
    };
  
    document.getElementById('lightSlideZ').oninput = (ev) => {
      g_lightAnimate = false;
      g_lightPos[2] = Number(ev.target.value);
      document.getElementById('lightZVal').innerText = ev.target.value;
      renderScene();
    };

    document.getElementById('lightColorR').oninput = (ev) => { g_lightColor[0] = Number(ev.target.value); };
    document.getElementById('lightColorG').oninput = (ev) => { g_lightColor[1] = Number(ev.target.value); };
    document.getElementById('lightColorB').oninput = (ev) => { g_lightColor[2] = Number(ev.target.value); };

    document.getElementById('spotOnBtn').onclick  = () => { g_spotOn = true; };
    document.getElementById('spotOffBtn').onclick = () => { g_spotOn = false; };
  }

function drawHindLeg(xSide) {
    // thigh
    let thighM = new Matrix4();
    thighM.setIdentity();
    thighM.translate(0.3 * xSide, 0.3, -0.3);
    thighM.rotate(gThighAngle, 1, 0, 0);
  
    let thigh = new Cube();
    thigh.color = [0.75, 0.75, 0.75, 1];
    thigh.textureNum = 0;
    thigh.matrix = new Matrix4(thighM);
    thigh.matrix.scale(0.3, 0.3, 0.28);
    thigh.render();
  
    // calf
    let calfM = new Matrix4(thighM);
    calfM.translate(0, -0.28, 0);
    calfM.rotate(gCalfAngle, 1, 0, 0);
  
    let calf = new Cube();
    calf.color = [0.75, 0.75, 0.75, 1];
    calf.textureNum = 0;
    calf.matrix = new Matrix4(calfM);
    calf.matrix.scale(0.25, 0.25, 0.25);
    calf.render();
  
    // foot
    let footM = new Matrix4(calfM);
    footM.translate(0, -0.2, 0.05);
    footM.rotate(gFootAngle, 1, 0, 0);
  
    let foot = new Cube();
    foot.color = [0.7, 0.7, 0.7, 1];
    foot.textureNum = 0;
    foot.matrix = new Matrix4(footM);
    foot.matrix.scale(0.25, 0.2, 0.35);
    foot.render();
  }
  
function setRect(x0, z0, x1, z1, h) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      g_map[x][z] = h;
    }
  }
}
  
function setBorder(h) {
  for (let i = 0; i < 32; i++) {
    g_map[i][0] = h;
    g_map[i][31] = h;
    g_map[0][i] = h;
    g_map[31][i] = h;
  }
}

// Create 32x32 map 
let g_map = [];
for (let i = 0; i < 32; i++) {
  g_map[i] = [];
  for (let j = 0; j < 32; j++) {
    // Put walls on the borders
    if (i === 0 || i === 31 || j === 0 || j === 31) {
      g_map[i][j] = 5;
    } else {
      g_map[i][j] = 0;
    }
  }
}

setBorder(4); 


// Maze walls
//setRect(15, 15, 15, 25, 2);
//setRect(10, 18, 20, 18, 2);
//setRect(18, 10, 18, 20, 3); 

// Corner towers
g_map[5][5] = 5;    // Tower 1
g_map[5][26] = 5;   // Tower 2
g_map[26][5] = 5;   // Tower 3
g_map[26][26] = 5;  // Tower 4

// Pyramid area
//setRect(23, 23, 25, 25, 1);
//setRect(24, 24, 24, 24, 2);

// House structure
//setRect(14, 3, 18, 7, 3);   // House walls
//setRect(15, 4, 17, 6, 0);   // Hollow inside
//g_map[16][3] = 0;            // Door opening

// Low walls creating paths
//setRect(8, 20, 12, 20, 1);
//setRect(20, 12, 20, 16, 1);


function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      const h = g_map[x][z];      // 0..4
      for (let y = 0; y < h; y++) {
        let wall = new Cube();
        wall.textureNum = 2;
        wall.color = [1,1,1,1];
        wall.matrix.setIdentity();
        wall.matrix.translate(x - 16, -1 + y, z - 16);
        wall.render();
      }
    }
  }
}

function drawBunny(x, y, z) {
  // Body
  let body = new Cube();
  body.matrix.setIdentity();
  body.color = [0.8, 0.8, 0.8, 1];
  body.textureNum = 0;
  body.matrix.translate(x, y + 0.35, z);
  body.matrix.rotate(50, 1, 0, 0);
  body.matrix.scale(0.6, 0.5, 0.6);
  body.render();

  // Head
  let head = new Cube();
  head.matrix.setIdentity();
  head.color = [0.9, 0.9, 0.9, 0.9];
  head.textureNum = 0;
  head.matrix.translate(x, y + 0.4, z + 0.48);
  head.matrix.rotate(50, 1, 0, 0);
  head.matrix.scale(0.35, 0.3, 0.3);
  head.render();

  // Nose
  let nose = new Sphere();
  nose.matrix.setIdentity();
  nose.color = [1.0, 0.6, 0.7, 1.0];
  nose.matrix.translate(x, y + 0.39, z + 0.70);
  nose.matrix.scale(0.07, 0.07, 0.07);
  nose.render();

  // Tail
  let tail = new Sphere();
  tail.matrix.setIdentity();
  tail.color = [0.9, 0.9, 0.9, 1];
  tail.matrix.translate(x, y + 0.5, z - 0.5);
  tail.matrix.rotate(51, 1, 0, 0);
  tail.matrix.scale(0.15, 0.15, 0.15);
  tail.render();

  // Left ear
  let earL = new Cube();
  earL.matrix.setIdentity();
  earL.color = [0.9, 0.9, 0.9, 1];
  earL.textureNum = 0;
  earL.matrix.translate(x - 0.12, y + 0.75, z + 0.45);
  earL.matrix.scale(0.11, 0.35, 0.08);
  earL.render();

  // Right ear
  let earR = new Cube();
  earR.matrix.setIdentity();
  earR.color = [0.9, 0.9, 0.9, 1];
  earR.textureNum = 0;
  earR.matrix.translate(x + 0.12, y + 0.75, z + 0.45);
  earR.matrix.scale(0.11, 0.35, 0.08);
  earR.render();

  // Front left leg
  let frontLegL = new Cube();
  frontLegL.matrix.setIdentity();
  frontLegL.color = [0.98, 0.98, 0.98, 1];
  frontLegL.textureNum = 0;
  frontLegL.matrix.translate(x - 0.18, y + 0.06, z + 0.25);
  frontLegL.matrix.scale(0.15, 0.25, 0.15);
  frontLegL.render();

  // Front left paw
  let frontLegP = new Cube();
  frontLegP.matrix.setIdentity();
  frontLegP.color = [0.98, 0.98, 0.98, 1];
  frontLegP.textureNum = 0;
  frontLegP.matrix.translate(x - 0.18, y - 0.1, z + 0.25);
  frontLegP.matrix.scale(0.25, 0.20, 0.20);
  frontLegP.render();

  // Front right leg
  let frontLegR = new Cube();
  frontLegR.matrix.setIdentity();
  frontLegR.color = [0.98, 0.98, 0.98, 1];
  frontLegR.textureNum = 0;
  frontLegR.matrix.translate(x + 0.18, y + 0.06, z + 0.25);
  frontLegR.matrix.scale(0.15, 0.25, 0.15);
  frontLegR.render();

  // Front right paw
  let frontRP = new Cube();
  frontRP.matrix.setIdentity();
  frontRP.color = [0.98, 0.98, 0.98, 1];
  frontRP.textureNum = 0;
  frontRP.matrix.translate(x + 0.18, y - 0.1, z + 0.25);
  frontRP.matrix.scale(0.25, 0.20, 0.20);
  frontRP.render();

  // Back left leg
  let backLegL = new Cube();
  backLegL.color = [0.75, 0.75, 0.75, 1];
  backLegL.textureNum = 0;
  backLegL.matrix.setIdentity();
  backLegL.matrix.translate(x - 0.3, y + 0.3, z - 0.3);
  backLegL.matrix.scale(0.3, 0.3, 0.28);
  backLegL.render();

  // Back right leg
  let backLegR = new Cube();
  backLegR.color = [0.75, 0.75, 0.75, 1];
  backLegR.textureNum = 0;
  backLegR.matrix.setIdentity();
  backLegR.matrix.translate(x + 0.3, y + 0.3, z - 0.3);
  backLegR.matrix.scale(0.3, 0.3, 0.28);
  backLegR.render();
}

//render function
function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  
  let globalRot = new Matrix4();
  globalRot.rotate(gMouseRotX, 1, 0, 0);
  globalRot.rotate(gMouseRotY, 0, 1, 0);

  globalRot.rotate(gAnimalGlobalRotation, 0, 1, 0);
  globalRot.rotate(-1, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRot.elements);

  g_globalRotMat.set(globalRot);  // save it so Cube/Sphere can compute normal matrices
  gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform1i(u_LightOn, g_lightOn ? 1 : 0);
  gl.uniform3f(u_LightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

  gl.uniform1i(u_SpotOn, g_spotOn ? 1 : 0);
  gl.uniform3f(u_SpotDir, g_spotDir[0], g_spotDir[1], g_spotDir[2]);
  gl.uniform1f(u_SpotCutoff, Math.cos(Math.PI / 8.0)); // 22.5 degree cone
  
  if (u_CameraPos && camera && camera.eye) {
    gl.uniform3f(u_CameraPos,
      camera.eye.elements[0],
      camera.eye.elements[1],
      camera.eye.elements[2]
    );

  if (g_humanModel) g_humanModel.render();
  }

  // GROUND
  let ground = new Cube();
  ground.textureNum = g_normalsOn ? -3 : -2;
  ground.color = [0.2, 0.4, 0.2, 1];
  ground.matrix.setIdentity();
  ground.matrix.translate(0, -1.6, 0);
  ground.matrix.scale(100, 0.01, 100);
  ground.render();

  // SKY BOX
  let sky = new Cube();
  sky.textureNum = g_normalsOn ? -3 : 1;
  sky.color = [1, 1, 1, 1];
  sky.matrix.setIdentity();
  sky.matrix.scale(50, 50, 50);
  sky.render();

  let sphere = new Sphere();
  sphere.color = [1,1,1,1];
  sphere.matrix.translate(1, -0.6, 0);
  sphere.matrix.scale(0.5, 0.5, 0.5);
  sphere.render();
  drawMap();
  drawBunny(5, -1.5, 5); 


  let light = new Cube();
  light.textureNum = -2; // color mode
  light.color = [10, 10, 0, 1]; // super bright yellow like the video
  light.matrix.setIdentity();
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.3, -0.3, -0.3);
  light.render();
}

function updateAnimationAngles() {
    let hop = Math.sin(g_seconds * 3);

    hop = Math.max(0, hop);
    gThighAngle = 45 * hop;
    gCalfAngle  = 45 * hop;
    gFootAngle  = 20 * hop;
  }
  
function tick() {
    const now = performance.now();
    g_seconds += (now - g_lastFrameTime) / 1000.0;
    g_lastFrameTime = now;
  
    if (g_lightAnimate) {
        g_lightPos[0] = g_lightOrbitCenter[0] + g_lightOrbitRadius * Math.cos(g_seconds);
        g_lightPos[2] = g_lightOrbitCenter[2] + g_lightOrbitRadius * Math.sin(g_seconds);
        g_lightPos[1] = g_lightOrbitCenter[1] + 1.0;  // keep it above the sphere a bit
   }

    if (g_animationOn) {
      updateAnimationAngles();
    }
  
    // poke animation
    if (g_poke) {
      g_pokeTimer += 0.05;
      g_headTilt = 25 * Math.sin(g_pokeTimer * 4);
  
      if (g_pokeTimer > 1.2) {
        g_poke = false;
        g_headTilt = 0;
      }
    }
    g_frameCount++;
    let nowFPS = performance.now();

    if (nowFPS - g_lastFPSUpdate > 500) {
      let fps = (g_frameCount * 1000) / (nowFPS - g_lastFPSUpdate);
      document.getElementById("fps").innerText = "FPS: " + fps.toFixed(1);
      g_lastFPSUpdate = nowFPS;
      g_frameCount = 0;
}
  
    renderScene();
    requestAnimationFrame(tick);
  }
  

function showError(msg) {
  console.log(msg);
  const box = document.getElementById('errorBox');
  if (box) {
    box.style.display = 'block';
    box.textContent = msg;
  }
}

function addActionsForHtmlUI_PA2() {
    document.getElementById('globalRot').oninput = (ev) => {
      gAnimalGlobalRotation = Number(ev.target.value);
      renderScene();
    };

    // Thigh joint
    document.getElementById('thighSlide').oninput = (ev) => {
      gThighAngle = Number(ev.target.value);
      renderScene();
    };
  
    // Calf joint
    document.getElementById('calfSlide').oninput = (ev) => {
      gCalfAngle = Number(ev.target.value);
      renderScene();
    };
  
    // Foot joint
    document.getElementById('footSlide').oninput = (ev) => {
      gFootAngle = Number(ev.target.value);
      renderScene();
    };
  
    // animation buttons
    document.getElementById('animOn').onclick  = () => g_animationOn = true;
    document.getElementById('animOff').onclick = () => g_animationOn = false;
  }

function triggerPoke() {
    g_poke = true;
    g_pokeTimer = 0;
  }


function initTextures() {
  console.log('INIT TEXTURES STARTING');
  var image = new Image();
  console.log('Image object created:', image);
    
  if (!image) {
    console.log('Failed to create image object');
    return false;
  }
    
  image.crossOrigin = "anonymous";
  console.log('crossOrigin set');
    
  image.onerror = function() {
    console.log('ERROR: Failed to load fur.jpg !!!');
  };
    
  image.onload = function() {
    console.log('SUCCESS: Image loaded! Width:', image.width, 'Height:', image.height);
    sendImageToTexture0(image);
  };
    
  console.log('About to set image.src to fur.jpg');
  image.src = 'fur.jpg';
  console.log('image.src has been set');
    
  return true;
}

function sendImageToTexture0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create texture object');
    return false;
  }
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
    
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
  gl.uniform1i(u_Sampler0, 0);
    
  console.log('Texture loaded successfully');
  renderScene();
}

function initTexture1() {
  console.log('=== INIT TEXTURE1 (SKY) STARTING ===');
  var image = new Image();
  
  if (!image) {
    console.log('Failed to create image object for sky');
    return false;
  }
  
  image.crossOrigin = "anonymous";
  
  image.onerror = function() {
    console.log('!!! ERROR: Failed to load sky.jpg !!!');
  };
  
  image.onload = function() {
    console.log('!!! SUCCESS: Sky loaded! Width:', image.width, 'Height:', image.height);
    sendImageToTexture1(image);
  };
  
  image.src = 'sky.jpg';
  
  return true;
}

function sendImageToTexture1(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create texture object for sky');
    return false;
  }
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(u_Sampler1, 1);
  
  console.log('Sky texture loaded successfully');
  renderScene();
}

function initTexture2() {
  console.log('INIT TEXTURE2 STARTING');
  var image = new Image();
  
  if (!image) {
    console.log('Failed to create image object for stone');
    return false;
  }
  
  image.crossOrigin = "anonymous";
  
  image.onerror = function() {
    console.log('ERROR: Failed to load stone.jpg !!!');
  };
  
  image.onload = function() {
    console.log('SUCCESS: Stone loaded! Width:', image.width, 'Height:', image.height);
    sendImageToTexture2(image);
  };
  
  image.src = 'stone.jpg';
  
  return true;
}

function sendImageToTexture2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create texture object for stone');
    return false;
  }
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  gl.uniform1i(u_Sampler2, 2);
  
  console.log('Stone texture loaded successfully');
  renderScene();
}

function keydown(ev) {
  // W key move forward
  if (ev.keyCode == 87) {
    camera.moveForward(0.2);
    renderScene();
  }
  // S key move backwards
  else if (ev.keyCode == 83) {
    camera.moveBackwards(0.2);
    renderScene();
  }
  // A key move left
  else if (ev.keyCode == 65) {
    camera.moveLeft(0.2);
    renderScene();
  }
  // D key move right
  else if (ev.keyCode == 68) {
    camera.moveRight(0.2);
    renderScene();
  }
  // Q key pan left
  else if (ev.keyCode == 81) {
    camera.panLeft(5);
    renderScene();
  }
  // E key pan right
  else if (ev.keyCode == 69) {
    camera.panRight(5);
    renderScene();
  }
  // B key build block in front of you
  else if (ev.keyCode == 66) {
    placeBlock();
    renderScene();
  }
  // X key delete block in front of you
  else if (ev.keyCode == 88) {
    removeBlock();
    renderScene();
  }
  // F key - Find bunny
  else if (ev.keyCode == 70) {
    checkFoundBunny();
    renderScene();
  }
  
  console.log('Key pressed:', ev.keyCode);
}

function placeBlock() {
  let forward = new Vector3([
    camera.at.elements[0] - camera.eye.elements[0],
    camera.at.elements[1] - camera.eye.elements[1],
    camera.at.elements[2] - camera.eye.elements[2]
  ]);
  forward.normalize();
  
  let frontX = Math.round(camera.eye.elements[0] + forward.elements[0] * 1);
  let frontZ = Math.round(camera.eye.elements[2] + forward.elements[2] * 1);
  
  let mapX = frontX + 16;
  let mapZ = frontZ + 16;
  
  console.log('Camera at:', camera.eye.elements[0].toFixed(1), camera.eye.elements[2].toFixed(1));
  console.log('Placing at map position:', mapX, mapZ);
  
  if (mapX >= 0 && mapX < 32 && mapZ >= 0 && mapZ < 32) {
    if (g_map[mapX][mapZ] < 10) {
      g_map[mapX][mapZ]++;
      console.log('✓ PLACED! New height:', g_map[mapX][mapZ]);
      g_gameMessage = `Block placed! Height: ${g_map[mapX][mapZ]}`;
      if (document.getElementById('gameMessage')) {
        document.getElementById('gameMessage').innerText = g_gameMessage;
      }
    }
  }
}

function removeBlock() {
  let forward = new Vector3([
    camera.at.elements[0] - camera.eye.elements[0],
    camera.at.elements[1] - camera.eye.elements[1],
    camera.at.elements[2] - camera.eye.elements[2]
  ]);
  forward.normalize();
  
  let frontX = Math.round(camera.eye.elements[0] + forward.elements[0] * 1);
  let frontZ = Math.round(camera.eye.elements[2] + forward.elements[2] * 1);
  
  let mapX = frontX + 16;
  let mapZ = frontZ + 16;
  
  console.log('Camera at:', camera.eye.elements[0].toFixed(1), camera.eye.elements[2].toFixed(1));
  console.log('Removing at map position:', mapX, mapZ);
  
  if (mapX >= 0 && mapX < 32 && mapZ >= 0 && mapZ < 32) {
    if (g_map[mapX][mapZ] > 0) {
      g_map[mapX][mapZ]--;
      console.log('✓ REMOVED! New height:', g_map[mapX][mapZ]);
      g_gameMessage = `Block removed! Height: ${g_map[mapX][mapZ]}`;
      if (document.getElementById('gameMessage')) {
        document.getElementById('gameMessage').innerText = g_gameMessage;
      }
    }
  }
}

function checkFoundBunny() {
  let dx = camera.eye.elements[0] - 5;
  let dz = camera.eye.elements[2] - 5;
  let distance = Math.sqrt(dx*dx + dz*dz);
  
  console.log('Distance to bunny:', distance);
  
  if (distance < 15 && !g_bunnyFound) {
    g_bunnyFound = true;
    g_gameMessage = "You found the bunny!";
    document.getElementById('gameMessage').innerText = g_gameMessage;
    console.log("BUNNY FOUND!");
  } else if (g_bunnyFound) {
    g_gameMessage = "You already found the bunny! Now build something!";
    document.getElementById('gameMessage').innerText = g_gameMessage;
  } else {
    g_gameMessage = "Not close enough! Distance: " + distance.toFixed(1) + " (need < 5)";
    document.getElementById('gameMessage').innerText = g_gameMessage;
  }
}
  

function main() {
  canvas = document.getElementById('webgl');
  if (!canvas) {
    showError("Could not find canvas with id='webgl'.");
    return;
  }

  canvas.onmousedown = (ev) => {

    gDragging = true;
    gLastX = ev.clientX;
    gLastY = ev.clientY;
  };
  
  canvas.onmouseup = () => gDragging = false;
  canvas.onmouseleave = () => gDragging = false;
  
  canvas.onmousemove = (ev) => {
    if (!gDragging) return;
  
    let dx = ev.clientX - gLastX;
    let dy = ev.clientY - gLastY;
  
    gLastX = ev.clientX;
    gLastY = ev.clientY;
  
    //gMouseRotY += dx * 0.5;
    //gMouseRotX += dy * 0.5;

    camera.panRight(dx * 0.2);
  
    renderScene();
  };  

  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    showError("Failed to get WebGL context. WebGL may be disabled in your browser.");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  camera = new Camera();
  camera.updateProjectionMatrix(canvas);

  document.onkeydown = function(ev) {
    keydown(ev);
  };

  if (typeof initShaders !== 'function') {
    showError(
      "initShaders is not defined.\n" +
      "This means cuon-utils.js / webgl-utils.js is NOT loading.\n\n" +
      "Fix: make sure these files exist and your <script src> paths are correct:\n" +
      " - lib/cuon-utils.js and lib/webgl-utils.js (OR)\n" +
      " - cuon-utils.js and webgl-utils.js in the SAME folder as asg1.html"
    );
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    showError("Failed to initialize shaders (initShaders returned false).");
    return;
  }
  gl.useProgram(gl.program);


  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');
  u_LightOn = gl.getUniformLocation(gl.program, 'u_LightOn');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_SpotOn = gl.getUniformLocation(gl.program, 'u_SpotOn');
  u_SpotDir = gl.getUniformLocation(gl.program, 'u_SpotDir');
  u_SpotCutoff = gl.getUniformLocation(gl.program, 'u_SpotCutoff');

  console.log('a_Position:', a_Position);
  console.log('a_UV:', a_UV);
  console.log('u_FragColor:', u_FragColor);
  console.log('u_ModelMatrix:', u_ModelMatrix);
  console.log('u_GlobalRotation:', u_GlobalRotation);
  console.log('u_ProjectionMatrix:', u_ProjectionMatrix);
  console.log('u_Sampler0:', u_Sampler0);
  
  if (u_CameraPos === null) { 
    showError("Failed to get u_CameraPos"); 
    return; 
  }

  if (a_Position < 0) {
    showError("Failed to get a_Position");
    return;
  }
  if (a_UV < 0) {
    showError("Failed to get a_UV");
    return;
  }

  if (u_whichTexture === null) {
    showError("Failed to get u_whichTexture");
    return;
  }

  if (u_LightPos === null) {
    showError("Failed to get u_LightPos");
    return;
  }

  if (u_ModelMatrix === null) {
    showError("Failed to get u_ModelMatrix");
    return;
  }
  if (u_GlobalRotation === null) {
    showError("Failed to get u_GlobalRotation");
    return;
  }
  if (u_ViewMatrix === null) {
    showError("Failed to get u_ViewMatrix");
    return;
  }
  if (u_ProjectionMatrix === null) {
    showError("Failed to get u_ProjectionMatrix");
    return;
  }
  if (u_Sampler0 === null) {
    showError("Failed to get u_Sampler0");
    return;
  }
  if (u_Sampler1 === null) {
    showError("Failed to get u_Sampler1");
    return;
  }
  if (u_Sampler2 === null) {
    showError("Failed to get u_Sampler2");
    return;
  }
  //addActionsForHtmlUI_PA2();
  addActionsForHtmlUI_PA4();
  initTextures();
  initTexture1();
  initTexture2();

  initCubeVBO();

  fetch('human.obj')
  .then(r => r.text())
  .then(text => {
    g_humanModel = new Model();
    g_humanModel.parseOBJ(text);
    g_humanModel.color = [0.8, 0.6, 0.5, 1.0];
    g_humanModel.matrix.setIdentity();
    g_humanModel.matrix.translate(3, -1, 0);
    g_humanModel.matrix.scale(0.5, 0.5, 0.5);
  });

  requestAnimationFrame(tick);
}
