let g_cubePosBuffer = null;
let g_cubeUVBuffer = null;
const g_cubeVertCount = 36;

function initCubeVBO() {

  const P = new Float32Array([
    -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,

    // Back 
    -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
    -0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5,-0.5,-0.5,

    // Left
    -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
    -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,

    // Right
     0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
     0.5,-0.5,-0.5,   0.5, 0.5, 0.5,   0.5,-0.5, 0.5,

    // Top
    -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5, 0.5,-0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,

    // Bottom
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
  ]);

  const U = new Float32Array([
    // Front
    0,0,  1,0,  1,1,
    0,0,  1,1,  0,1,

    // Back
    0,0,  0,1,  1,1,
    0,0,  1,1,  1,0,

    // Left
    0,0,  1,0,  1,1,
    0,0,  1,1,  0,1,

    // Right
    0,0,  0,1,  1,1,
    0,0,  1,1,  1,0,

    // Top
    0,0,  0,1,  1,1,
    0,0,  1,1,  1,0,

    // Bottom
    0,0,  1,0,  1,1,
    0,0,  1,1,  0,1,
  ]);

  // Position buffer
  g_cubePosBuffer = gl.createBuffer();
  if (!g_cubePosBuffer) {
    console.error("Failed to create cube position buffer");
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubePosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, P, gl.STATIC_DRAW);

  // UV buffer
  g_cubeUVBuffer = gl.createBuffer();
  if (!g_cubeUVBuffer) {
    console.error("Failed to create cube UV buffer");
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, U, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

class Cube {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.textureNum = -2;
  }

  render() {
    // uniforms
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1i(u_whichTexture, this.textureNum);

    // attributes: position
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubePosBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // attributes: uv
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, g_cubeVertCount);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}