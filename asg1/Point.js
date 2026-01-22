// Point (sqaure class) 

class Point {
    constructor() {
      this.type = "POINT";
      this.position = [0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.size = 10.0; 
    }
  
    render() {
      const x = this.position[0];
      const y = this.position[1];
  
      // color
      gl.uniform4f(u_FragColor,
        this.color[0], this.color[1], this.color[2], this.color[3]
      );
  
      const half = (this.size * 2.0 / canvas.width) / 2.0; // == size / canvas.width
  
      //square (2 triangles)
      drawTriangle([
        x - half, y - half,
        x + half, y - half,
        x - half, y + half
      ]);
  
      drawTriangle([
        x + half, y - half,
        x + half, y + half,
        x - half, y + half
      ]);
    }
  }
  