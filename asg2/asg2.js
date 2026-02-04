let canvas, gl;
let a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotation, u_ProjectionMatrix;

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


//vertex shader
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;

}
`;

//fragment shader
const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

function drawHindLeg(xSide) {
    // thigh
    let thighM = new Matrix4();
    thighM.setIdentity();
    thighM.translate(0.3 * xSide, 0.3, -0.3);
    thighM.rotate(gThighAngle, 1, 0, 0);
  
    let thigh = new Cube();
    thigh.color = [0.75, 0.75, 0.75, 1];
    thigh.matrix = new Matrix4(thighM);
    thigh.matrix.scale(0.3, 0.3, 0.28);
    thigh.render();
  
    // calf
    let calfM = new Matrix4(thighM);
    calfM.translate(0, -0.28, 0);
    calfM.rotate(gCalfAngle, 1, 0, 0);
  
    let calf = new Cube();
    calf.color = [0.75, 0.75, 0.75, 1];
    calf.matrix = new Matrix4(calfM);
    calf.matrix.scale(0.25, 0.25, 0.25);
    calf.render();
  
    // foot
    let footM = new Matrix4(calfM);
    footM.translate(0, -0.2, 0.05);
    footM.rotate(gFootAngle, 1, 0, 0);
  
    let foot = new Cube();
    foot.color = [0.7, 0.7, 0.7, 1];
    foot.matrix = new Matrix4(footM);
    foot.matrix.scale(0.25, 0.2, 0.35);
    foot.render();
  }
  

//render function
function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let globalRot = new Matrix4();

  //mouse rotate
  globalRot.rotate(gMouseRotX, 1, 0, 0);
  globalRot.rotate(gMouseRotY, 0, 1, 0);

  globalRot.rotate(gAnimalGlobalRotation, 0, 1, 0);
  globalRot.rotate(-1, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRot.elements);

  let proj = new Matrix4();
  proj.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
  proj.translate(0, 0, -3); 

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, proj.elements);

  let body = new Cube();
  let bodyLift = 0;

  if (g_animationOn) {
    bodyLift = 0.08 * Math.max(0, Math.sin(g_seconds * 3));
  }

  body.matrix.setIdentity(); 
  body.color = [0.8, 0.8, 0.8, 1];
  body.matrix.translate(0, 0.35 + bodyLift, 0);
  body.matrix.rotate(50, 1, 0, 0)
  body.matrix.scale(0.6, 0.5, 0.6);
  body.render();

  let head = new Cube();
  head.matrix.setIdentity(); 
  head.color = [0.9, 0.9, 0.9, 0.9]; 
  head.matrix.setIdentity();
  head.matrix.translate(0, 0.4 + bodyLift, 0.48);
  head.matrix.rotate(g_headTilt, 0, 0, 1);
  head.matrix.rotate(50, 1, 0, 0)
  head.matrix.scale(0.35, 0.3, 0.3);
  head.render();

  //nose
  let nose = new Sphere();
  nose.matrix.setIdentity();
  nose.color = [1.0, 0.6, 0.7, 1.0]; 
  nose.matrix.translate(0, 0.39 + bodyLift, 0.70); 
  nose.matrix.scale(0.07, 0.07, 0.07);
  nose.render();

  //tail
  let tail = new Sphere();
  tail.matrix.setIdentity(); 
  tail.color = [0.9, 0.9, 0.9, 1]; 
  tail.matrix.setIdentity();
  tail.matrix.translate(0, 0.5 + bodyLift, -0.5);
  tail.matrix.rotate(51, 1, 0, 0); 
  tail.matrix.scale(0.15, 0.15, 0.15);
  tail.render();

  // left ear
  let earL = new Cube();
  earL.matrix.setIdentity();
  earL.color = [0.9, 0.9, 0.9, 1];
  earL.matrix.translate(-0.12, 0.75 + bodyLift, 0.45);
  earL.matrix.rotate(g_headTilt, 1, 0, 0);
  earL.matrix.scale(0.11, 0.35, 0.08);
  earL.render();

  // right ear
  let earR = new Cube();
  earR.matrix.setIdentity();
  earR.color = [0.9, 0.9, 0.9, 1];
  earR.matrix.translate(0.12, 0.75 + bodyLift, 0.45);
  earR.matrix.rotate(g_headTilt, 1, 0, 0);
  earR.matrix.scale(0.11, 0.35, 0.08);
  earR.render();

  // front left leg
  let frontLegL = new Cube();
  frontLegL.matrix.setIdentity();
  frontLegL.color = [0.98, 0.98, 0.98, 1];
  frontLegL.matrix.translate(-0.18, 0.06 + bodyLift, 0.25);
  frontLegL.matrix.scale(0.15, 0.25, 0.15);
  frontLegL.render();

  // front left paw
  let frontLegP = new Cube();
  frontLegP.matrix.setIdentity();
  frontLegP.color = [0.98, 0.98, 0.98, 1];
  frontLegP.matrix.translate(-0.18, -0.1 + bodyLift, 0.25);
  frontLegP.matrix.scale(0.25, 0.20, 0.20);
  frontLegP.render();

  // front right leg
  let frontLegR = new Cube();
  frontLegR.matrix.setIdentity();
  frontLegR.color = [0.98, 0.98, 0.98, 1];
  frontLegR.matrix.translate(0.18, 0.06 + bodyLift, 0.25);
  frontLegR.matrix.scale(0.15, 0.25, 0.15);
  frontLegR.render();

  // front right paw
  let frontRP = new Cube();
  frontRP.matrix.setIdentity();
  frontRP.color = [0.98, 0.98, 0.98, 1];
  frontRP.matrix.translate(0.18, -0.1 + bodyLift, 0.25);
  frontRP.matrix.scale(0.25, 0.20, 0.20);
  frontRP.render();

  drawHindLeg(-1); // left hind leg
  drawHindLeg( 1); // right hind leg
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
  

function main() {
  canvas = document.getElementById('webgl');
  if (!canvas) {
    showError("Could not find canvas with id='webgl'.");
    return;
  }

  canvas.onmousedown = (ev) => {
    // poke animation 
    if (ev.shiftKey) {
      triggerPoke();
      return;
    }
  
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
  
    gMouseRotY += dx * 0.5;
    gMouseRotX += dy * 0.5;
  
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
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');

  if (a_Position < 0 || !u_FragColor || !u_ModelMatrix || !u_GlobalRotation || !u_ProjectionMatrix) {
    showError("Failed to get GLSL variable locations.");
    return;
  }  
  addActionsForHtmlUI_PA2();
  renderScene();
  requestAnimationFrame(tick);
}



