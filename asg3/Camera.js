class Camera {
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([0, 1, 5]);     // Eye level
        this.at = new Vector3([0, 1, -10]);    // Look straight
        this.up = new Vector3([0, 1, 0]);
        
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        this.updateViewMatrix();
      }
    
    updateViewMatrix() {
      this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0], this.at.elements[1], this.at.elements[2],
        this.up.elements[0], this.up.elements[1], this.up.elements[2]
      );
    }
    
    updateProjectionMatrix(canvas) {
      this.projectionMatrix.setPerspective(
        this.fov,
        canvas.width / canvas.height,
        0.1,
        1000
      );
    }
    
    moveForward(speed = 0.1) {
      // f = at - eye
      let f = new Vector3([
        this.at.elements[0] - this.eye.elements[0],
        this.at.elements[1] - this.eye.elements[1],
        this.at.elements[2] - this.eye.elements[2]
      ]);
      f.normalize();
      f = new Vector3([f.elements[0] * speed, f.elements[1] * speed, f.elements[2] * speed]);
      
      this.eye.elements[0] += f.elements[0];
      this.eye.elements[1] += f.elements[1];
      this.eye.elements[2] += f.elements[2];
      
      this.at.elements[0] += f.elements[0];
      this.at.elements[1] += f.elements[1];
      this.at.elements[2] += f.elements[2];
      
      this.updateViewMatrix();
    }
    
    moveBackwards(speed = 0.1) {
      let b = new Vector3([
        this.eye.elements[0] - this.at.elements[0],
        this.eye.elements[1] - this.at.elements[1],
        this.eye.elements[2] - this.at.elements[2]
      ]);
      b.normalize();
      b = new Vector3([b.elements[0] * speed, b.elements[1] * speed, b.elements[2] * speed]);
      
      this.eye.elements[0] += b.elements[0];
      this.eye.elements[1] += b.elements[1];
      this.eye.elements[2] += b.elements[2];
      
      this.at.elements[0] += b.elements[0];
      this.at.elements[1] += b.elements[1];
      this.at.elements[2] += b.elements[2];
      
      this.updateViewMatrix();
    }
    
    moveLeft(speed = 0.1) {
        // f = at - eye
        let f = new Vector3([
          this.at.elements[0] - this.eye.elements[0],
          this.at.elements[1] - this.eye.elements[1],
          this.at.elements[2] - this.eye.elements[2]
        ]);
        f.normalize();
        
        let s = new Vector3([
          this.up.elements[1] * f.elements[2] - this.up.elements[2] * f.elements[1],
          this.up.elements[2] * f.elements[0] - this.up.elements[0] * f.elements[2],
          this.up.elements[0] * f.elements[1] - this.up.elements[1] * f.elements[0]
        ]);
        s.normalize();
        
        this.eye.elements[0] += s.elements[0] * speed;
        this.eye.elements[1] += s.elements[1] * speed;
        this.eye.elements[2] += s.elements[2] * speed;
        
        this.at.elements[0] += s.elements[0] * speed;
        this.at.elements[1] += s.elements[1] * speed;
        this.at.elements[2] += s.elements[2] * speed;
        
        this.updateViewMatrix();
      }
      
      moveRight(speed = 0.1) {
        // f = at - eye
        let f = new Vector3([
          this.at.elements[0] - this.eye.elements[0],
          this.at.elements[1] - this.eye.elements[1],
          this.at.elements[2] - this.eye.elements[2]
        ]);
        f.normalize();
        
        // s = f x up
        let s = new Vector3([
          f.elements[1] * this.up.elements[2] - f.elements[2] * this.up.elements[1],
          f.elements[2] * this.up.elements[0] - f.elements[0] * this.up.elements[2],
          f.elements[0] * this.up.elements[1] - f.elements[1] * this.up.elements[0]
        ]);
        s.normalize();
        
        this.eye.elements[0] += s.elements[0] * speed;
        this.eye.elements[1] += s.elements[1] * speed;
        this.eye.elements[2] += s.elements[2] * speed;
        
        this.at.elements[0] += s.elements[0] * speed;
        this.at.elements[1] += s.elements[1] * speed;
        this.at.elements[2] += s.elements[2] * speed;
        
        this.updateViewMatrix();
      }
    
    panLeft(angle = 5) {
      let f = new Vector3([
        this.at.elements[0] - this.eye.elements[0],
        this.at.elements[1] - this.eye.elements[1],
        this.at.elements[2] - this.eye.elements[2]
      ]);
      
      let rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      
      let f_prime = rotationMatrix.multiplyVector3(f);
      
      this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
      this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
      this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
      
      this.updateViewMatrix();
    }
    
    panRight(angle = 5) {
      let f = new Vector3([
        this.at.elements[0] - this.eye.elements[0],
        this.at.elements[1] - this.eye.elements[1],
        this.at.elements[2] - this.eye.elements[2]
      ]);
      
      let rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(-angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      
      let f_prime = rotationMatrix.multiplyVector3(f);
      
      this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
      this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
      this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
      
      this.updateViewMatrix();
    }
  }