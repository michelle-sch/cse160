class Triangle {
    constructor() {
      this.type = "TRIANGLE";
      this.position = [0.0, 0.0];    
      this.color = [1.0, 1.0, 1.0, 1.0]; 
      this.size = 10.0;              
    }
  
    render() {
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      gl.uniform1f(u_Size, this.size);
  
      const x = this.position[0];
      const y = this.position[1];
  
      const d = this.size / 200.0;
  
      const verts = [
        x,     y + d,
        x - d, y - d,
        x + d, y - d
      ];
  
      drawTriangle(verts);
    }
  }
  
  function drawTriangle3DUV(vertices, uv) {
    const vertBuffer = (vertices instanceof Float32Array) ? vertices : new Float32Array(vertices);
    const uvBuffer = (uv instanceof Float32Array) ? uv : new Float32Array(uv);
  
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log("Failed to create vertex buffer");
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertBuffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    const uvBuff = gl.createBuffer();
    if (!uvBuff) {
      console.log("Failed to create UV buffer");
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuff);
    gl.bufferData(gl.ARRAY_BUFFER, uvBuffer, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
  
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function drawTriangle(verts) {
    const vertices = (verts instanceof Float32Array) ? verts : new Float32Array(verts);
  
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log("Failed to create the buffer object");
      return;
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  function drawTriangle3D(verts) {
    const vertices = (verts instanceof Float32Array) ? verts : new Float32Array(verts);
  
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log("Failed to create the buffer object");
      return;
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  