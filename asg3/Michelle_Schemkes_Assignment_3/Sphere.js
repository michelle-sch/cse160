class Sphere {
    constructor() {
      this.color = [1, 0.6, 0.7, 1];
      this.matrix = new Matrix4();
      this.textureNum = -2;
  
      if (!Sphere.buffer) {
        Sphere.initBuffer();
      }
    }
  
    static initBuffer() {
      const positions = [];
      const slices = 16;
      const stacks = 16;
  
      for (let lat = 0; lat <= stacks; lat++) {
        const theta = (lat * Math.PI) / stacks;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
  
        for (let lon = 0; lon <= slices; lon++) {
          const phi = (lon * 2 * Math.PI) / slices;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);
  
          const x = cosPhi * sinTheta;
          const y = cosTheta;
          const z = sinPhi * sinTheta;
  
          positions.push(x, y, z);
        }
      }
  
      const indices = [];
      for (let lat = 0; lat < stacks; lat++) {
        for (let lon = 0; lon < slices; lon++) {
          const first = lat * (slices + 1) + lon;
          const second = first + slices + 1;
  
          indices.push(first, second, first + 1);
          indices.push(second, second + 1, first + 1);
        }
      }
  
      Sphere.numIndices = indices.length;
  
      Sphere.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
      Sphere.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sphere.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }
  
    render() {
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform4fv(u_FragColor, this.color);
        gl.uniform1i(u_whichTexture, this.textureNum);
      
        gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
      
        const dummyUVs = new Float32Array(Sphere.numIndices * 2).fill(0.5);
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dummyUVs, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
      
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sphere.indexBuffer);
        gl.drawElements(gl.TRIANGLES, Sphere.numIndices, gl.UNSIGNED_SHORT, 0);
      }
  }
  