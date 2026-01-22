//circle class
class Circle {
    constructor() {
      this.type = "CIRCLE";
      this.position = [0.0, 0.0];        
      this.color = [1.0, 1.0, 1.0, 1.0]; 
      this.size = 10.0;                 
      this.segments = 12;             
    }
  
    render() {
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      gl.uniform1f(u_Size, this.size);
  
      const x = this.position[0];
      const y = this.position[1];
  
      const r = this.size / 200.0;
  
      const seg = Math.max(3, this.segments | 0);
  
      const verts = [];
      verts.push(x, y); 
  
      for (let i = 0; i <= seg; i++) {
        const ang = (i / seg) * Math.PI * 2.0;
        verts.push(x + r * Math.cos(ang), y + r * Math.sin(ang));
      }
  
      const vertices = new Float32Array(verts);
  
      const vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) {
        console.log("Failed to create the buffer object");
        return;
      }
  
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }
  