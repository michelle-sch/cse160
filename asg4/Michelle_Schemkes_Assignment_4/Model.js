class Model {
    constructor() {
      this.color = [1.0, 0.8, 0.7, 1.0];
      this.matrix = new Matrix4();
      this.textureNum = -2;
  
      this.vertBuffer = null;
      this.normalBuffer = null;
      this.uvBuffer = null;
      this.numVertices = 0;
    }
  
    parseOBJ(objText) {
      const posArr = [];   
      const normArr = [];  
      const uvArr = [];    
  
      const outPos = [];
      const outNorm = [];
      const outUV = [];
  
      const lines = objText.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('v ')) {
          const parts = line.split(/\s+/);
          posArr.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (line.startsWith('vn ')) {
          const parts = line.split(/\s+/);
          normArr.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (line.startsWith('vt ')) {
          const parts = line.split(/\s+/);
          uvArr.push(parseFloat(parts[1]), parseFloat(parts[2]));
        } else if (line.startsWith('f ')) {
          const parts = line.split(/\s+/).slice(1);
          // Triangulate faces
          const faceVerts = parts.map(p => {
            const idx = p.split('/');
            return {
              v:  parseInt(idx[0]) - 1,
              vt: idx[1] ? parseInt(idx[1]) - 1 : 0,
              vn: idx[2] ? parseInt(idx[2]) - 1 : 0,
            };
          });
  
          // Fan triangulation 
          for (let i = 1; i < faceVerts.length - 1; i++) {
            const tri = [faceVerts[0], faceVerts[i], faceVerts[i + 1]];
            for (const vert of tri) {
              outPos.push(
                posArr[vert.v * 3],
                posArr[vert.v * 3 + 1],
                posArr[vert.v * 3 + 2]
              );
              if (normArr.length > 0) {
                outNorm.push(
                  normArr[vert.vn * 3],
                  normArr[vert.vn * 3 + 1],
                  normArr[vert.vn * 3 + 2]
                );
              } else {
                outNorm.push(0, 1, 0);
              }
              if (uvArr.length > 0) {
                outUV.push(uvArr[vert.vt * 2], uvArr[vert.vt * 2 + 1]);
              } else {
                outUV.push(0, 0);
              }
            }
          }
        }
      }
  
      this.numVertices = outPos.length / 3;
  
      this.vertBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outPos), gl.STATIC_DRAW);
  
      this.normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outNorm), gl.STATIC_DRAW);
  
      this.uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outUV), gl.STATIC_DRAW);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      console.log(`Model loaded: ${this.numVertices} vertices`);
    }
  
    render() {
      if (!this.vertBuffer || this.numVertices === 0) return;
  
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      let worldMat = new Matrix4(g_globalRotMat);
      worldMat.multiply(this.matrix);
      let normalMat = new Matrix4();
      normalMat.setInverseOf(worldMat);
      normalMat.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);
  
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      gl.uniform1i(u_whichTexture, this.textureNum);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Normal);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);
  
      gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }