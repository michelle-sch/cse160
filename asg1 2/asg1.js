//vertex shader
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
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

let canvas, gl;
let a_Position, u_FragColor, u_Size;


let g_selectedType = 'POINT'; 
let g_selectedColor = [0, 0, 1, 1];
let g_selectedSize = 10;
let g_selectedSegments = 12;
let g_shapesList = [];

// color cycle feature
let g_colorCycleOn = false;
let g_colorCycleOffset = 0.0;

function showError(msg) {
  console.log(msg);
  const box = document.getElementById('errorBox');
  if (box) {
    box.style.display = 'block';
    box.textContent = msg;
  }
}

function main() {
  canvas = document.getElementById('webgl');
  if (!canvas) {
    showError("Could not find canvas with id='webgl'.");
    return;
  }

  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    showError("Failed to get WebGL context. WebGL may be disabled in your browser.");
    return;
  }
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

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

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');

  if (a_Position < 0 || !u_FragColor || !u_Size) {
    showError("Failed to get GLSL variable locations (a_Position / u_FragColor / u_Size).");
    return;
  }

  //mouse events
  addActionsForHtmlUI();

  canvas.onmousedown = (ev) => click(ev);
  canvas.onmousemove = (ev) => {
    if (ev.buttons === 1) click(ev);
  };
}

function addActionsForHtmlUI() {
  //mode buttons
  const pointBtn = document.getElementById('pointBtn');
  const triBtn = document.getElementById('triBtn');
  const circBtn = document.getElementById('circBtn');

  if (pointBtn) pointBtn.onclick = () => (g_selectedType = 'POINT');
  if (triBtn) triBtn.onclick = () => (g_selectedType = 'TRIANGLE');
  if (circBtn) circBtn.onclick = () => (g_selectedType = 'CIRCLE');

  //clear
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      g_shapesList = [];
      renderAllShapes();
    };
  }

  //picture
  const picBtn = document.getElementById('picBtn');
  if (picBtn) {
    picBtn.onclick = () => drawMyPicture();
  }

  // color cycle on/off
  const colorCycleBtn = document.getElementById('colorCycleBtn');
  if (colorCycleBtn) {
    colorCycleBtn.textContent = `Color Cycle: ${g_colorCycleOn ? 'ON' : 'OFF'}`;
    colorCycleBtn.onclick = () => {
      g_colorCycleOn = !g_colorCycleOn;
      if (!g_colorCycleOn) g_colorCycleOffset = 0.0;
      colorCycleBtn.textContent = `Color Cycle: ${g_colorCycleOn ? 'ON' : 'OFF'}`;
    };
  }

  //sliders
  const rSlide = document.getElementById('rSlide');
  const gSlide = document.getElementById('gSlide');
  const bSlide = document.getElementById('bSlide');

  function updateColorFromSliders() {
    const r = (rSlide ? Number(rSlide.value) : 0) / 100;
    const g = (gSlide ? Number(gSlide.value) : 0) / 100;
    const b = (bSlide ? Number(bSlide.value) : 0) / 100;
    g_selectedColor = [r, g, b, 1.0];
  }

  if (rSlide) rSlide.oninput = updateColorFromSliders;
  if (gSlide) gSlide.oninput = updateColorFromSliders;
  if (bSlide) bSlide.oninput = updateColorFromSliders;
  updateColorFromSliders();

  //size slider
  const sizeSlide = document.getElementById('sizeSlide');
  if (sizeSlide) {
    g_selectedSize = Number(sizeSlide.value);
    sizeSlide.oninput = () => (g_selectedSize = Number(sizeSlide.value));
  }

  //segment slider
  const segSlide = document.getElementById('segSlide');
  if (segSlide) {
    g_selectedSegments = Number(segSlide.value);
    segSlide.oninput = () => (g_selectedSegments = Number(segSlide.value));
  }
}

function convertCoordinatesEventToGL(ev) {
  const rect = ev.target.getBoundingClientRect();
  const x_in_canvas = ev.clientX - rect.left;
  const y_in_canvas = ev.clientY - rect.top;

  const x = (x_in_canvas - canvas.width / 2) / (canvas.width / 2);
  const y = (canvas.height / 2 - y_in_canvas) / (canvas.height / 2);
  return [x, y];
}

function click(ev) {
  const [x, y] = convertCoordinatesEventToGL(ev);

  if (typeof Point !== 'function' || typeof Triangle !== 'function' || typeof Circle !== 'function') {
    showError(
      "One or more shape classes are missing.\n" +
      "Check that these files load and the filenames match EXACTLY:\n" +
      " - Point.js, Triangle.js, Circle.js\n" +
      "Also ensure they define global classes named Point/Triangle/Circle."
    );
    return;
  }

  let drawColor = g_selectedColor.slice();

  if (g_colorCycleOn) {
    g_colorCycleOffset = (g_colorCycleOffset + 0.02) % 1.0;
    drawColor[0] = (g_selectedColor[0] + g_colorCycleOffset) % 1.0;
    drawColor[1] = (g_selectedColor[1] + g_colorCycleOffset * 0.6) % 1.0;
  }

  let shape = null;

  if (g_selectedType === 'POINT') {
    shape = new Point();
    shape.position = [x, y];
    shape.color = drawColor;
    shape.size = g_selectedSize;
  } else if (g_selectedType === 'TRIANGLE') {
    shape = new Triangle();
    shape.position = [x, y];
    shape.color = drawColor;
    shape.size = g_selectedSize;
  } else if (g_selectedType === 'CIRCLE') {
    shape = new Circle();
    shape.position = [x, y];
    shape.color = drawColor;
    shape.size = g_selectedSize;
    shape.segments = g_selectedSegments;
  }

  if (shape) {
    g_shapesList.push(shape);
    renderAllShapes();
  }
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

// triangle picture
function drawMyPicture() {
    if (typeof drawTriangle !== 'function') {
      showError("drawTriangle() is not defined. Your Triangle/drawTriangle helper is missing.");
      return;
    }
      function tri(r, g, b, verts) {
      gl.uniform4f(u_FragColor, r, g, b, 1.0);
      drawTriangle(verts);
    }

    //sky
    tri(0.10, 0.14, 0.25, [-1.0,  1.0,  -1.0,  0.0,   1.0,  1.0]);
    tri(0.10, 0.14, 0.25, [-1.0,  0.0,   1.0,  0.0,   1.0,  1.0]);
  
    //ground
    tri(0.08, 0.25, 0.12, [-1.0,  0.0,  -1.0, -1.0,   1.0,  0.0]);
    tri(0.08, 0.25, 0.12, [-1.0, -1.0,   1.0, -1.0,   1.0,  0.0]);
  
    const cx = 0.65, cy = 0.65, r = 0.12;
    const sun = [
      [cx, cy,  cx + r, cy,      cx + 0.085, cy + 0.085],
      [cx, cy,  cx + 0.085, cy + 0.085,  cx, cy + r],
      [cx, cy,  cx, cy + r,      cx - 0.085, cy + 0.085],
      [cx, cy,  cx - 0.085, cy + 0.085,  cx - r, cy],
      [cx, cy,  cx - r, cy,      cx - 0.085, cy - 0.085],
      [cx, cy,  cx - 0.085, cy - 0.085,  cx, cy - r],
      [cx, cy,  cx, cy - r,      cx + 0.085, cy - 0.085],
      [cx, cy,  cx + 0.085, cy - 0.085,  cx + r, cy]
    ];
    for (const t of sun) tri(0.98, 0.86, 0.20, t);

    function tileTri(r, g, b, x, y, s, flip) {
        gl.uniform4f(u_FragColor, r, g, b, 1.0);
    
        if (!flip) {
        drawTriangle([x, y,  x + s, y,  x, y + s]);
        } else {
        drawTriangle([x + s, y + s,  x + s, y,  x, y + s]);
        }
    }
    
    function fillTriRect(r, g, b, x1, y1, x2, y2, step) {
        for (let y = y1; y < y2 - 1e-6; y += step) {
        for (let x = x1; x < x2 - 1e-6; x += step) {
            tileTri(r, g, b, x, y, step, false);
            tileTri(r, g, b, x, y, step, true);
        }
        }
    }
    
    //settings
    const step = 0.06; 
    
    //colors
    const mCol  = [0.82, 0.90, 1.00];
    const mCol2 = [0.70, 0.82, 0.95];
    const sCol  = [1.00, 0.82, 0.90];
    const sCol2 = [0.95, 0.62, 0.82];

    function strokeTri(r,g,b, x1,y1, x2,y2, thickness) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy / len * thickness;
        const ny =  dx / len * thickness;
    
        gl.uniform4f(u_FragColor, r, g, b, 1.0);
    
        const ax = x1 + nx, ay = y1 + ny;
        const bx = x1 - nx, by = y1 - ny;
        const cx = x2 - nx, cy = y2 - ny;
        const dx2 = x2 + nx, dy2 = y2 + ny;
    
        //two triangles
        drawTriangle([ax, ay,  bx, by,  dx2, dy2]);
        drawTriangle([bx, by,  cx, cy,  dx2, dy2]);
    }
  
    // M initial
    const mt = 0.06;            
    const mxL = -0.82, mxR = -0.38;  
    const myT =  0.55, myB = -0.65;  
    const mxMid1 = -0.66;
    const mxMid2 = -0.54;
    const myMid  = -0.10;
    
    // colors
    const M1 = [0.82, 0.90, 1.00];   
    const M2 = [0.70, 0.82, 0.95];   
    
    // left vertical
    strokeTri(...M1, mxL, myB, mxL, myT, mt);
    // right vertical
    strokeTri(...M1, mxR, myB, mxR, myT, mt);
    
    // diagonals
    strokeTri(...M2, mxL, myT, mxMid1, myMid, mt);
    strokeTri(...M2, mxMid2, myMid, mxR, myT, mt);
    
    // s initial
    const S_LEFT  = 0.18;
    const S_RIGHT = 0.80;
    const S_TOP   = 0.55;
    const S_BOT   = -0.65;
    const BAR_H   = 0.14;
    const CON_W   = 0.16;
    
    // top
    fillTriRect(...sCol,  S_LEFT, S_TOP - BAR_H, S_RIGHT, S_TOP, step);
    // middle
    fillTriRect(...sCol2, S_LEFT, 0.02,          S_RIGHT, 0.02 + BAR_H, step);
    // bottom
    fillTriRect(...sCol,  S_LEFT, S_BOT,         S_RIGHT, S_BOT + BAR_H, step);
    // left connector 
    fillTriRect(...sCol2, S_LEFT, 0.02 + BAR_H,  S_LEFT + CON_W, S_TOP - BAR_H, step);
    // right connector
    fillTriRect(...sCol2, S_RIGHT - CON_W, S_BOT + BAR_H, S_RIGHT, 0.02, step);
    
  }
  