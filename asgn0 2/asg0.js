let canvas;
let ctx;

function main() {
  canvas = document.getElementById("example");
  ctx = canvas.getContext("2d");

  // initial draw using defaults
  handleDrawEvent();
}

function clearCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Step 2 drawVector(v, color) using lineTo, scale by 20, origin at center
function drawVector(v, color) {
  const canvas = document.getElementById('example');
  const ctx = canvas.getContext('2d');

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();

  // START AT CENTER OF CANVAS
  ctx.moveTo(200, 200);

  // DRAW VECTOR (scaled by 20)
  ctx.lineTo(
    200 + v.elements[0] * 20,
    200 - v.elements[1] * 20   // subtract because canvas y goes DOWN
  );

  ctx.stroke();
}

function readV1() {
  const x = parseFloat(document.getElementById("v1x").value);
  const y = parseFloat(document.getElementById("v1y").value);
  return new Vector3([x, y, 0]);
}

function readV2() {
  const x = parseFloat(document.getElementById("v2x").value);
  const y = parseFloat(document.getElementById("v2y").value);
  return new Vector3([x, y, 0]);
}

// Step 3+4: draw v1 red and v2 blue on Draw button
function handleDrawEvent() {
  clearCanvas();
  const v1 = readV1();
  const v2 = readV2();
  drawVector(v1, "red");
  drawVector(v2, "blue");
}

// Step 5-8: operations
function handleDrawOperationEvent() {
  clearCanvas();

  const v1 = readV1();
  const v2 = readV2();
  drawVector(v1, "red");
  drawVector(v2, "blue");

  const op = document.getElementById("opSelect").value;
  const s = parseFloat(document.getElementById("scalar").value);

  if (op === "add") {
    const v3 = new Vector3(v1.elements);
    v3.add(v2);
    drawVector(v3, "green");
  } else if (op === "sub") {
    const v3 = new Vector3(v1.elements);
    v3.sub(v2);
    drawVector(v3, "green");
  } else if (op === "mul") {
    const v3 = new Vector3(v1.elements);
    const v4 = new Vector3(v2.elements);
    v3.mul(s);
    v4.mul(s);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (op === "div") {
    const v3 = new Vector3(v1.elements);
    const v4 = new Vector3(v2.elements);
    v3.div(s);
    v4.div(s);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (op === "magnitude") {
    console.log("v1 magnitude =", v1.magnitude());
    console.log("v2 magnitude =", v2.magnitude());
  } else if (op === "normalize") {
    console.log("v1 magnitude =", v1.magnitude());
    console.log("v2 magnitude =", v2.magnitude());

    const n1 = new Vector3(v1.elements);
    const n2 = new Vector3(v2.elements);
    n1.normalize();
    n2.normalize();
    drawVector(n1, "green");
    drawVector(n2, "green");
  } else if (op === "angle") {
    const a = angleBetween(v1, v2);
    console.log("angleBetween(v1, v2) degrees =", a);
  } else if (op === "area") {
    const area = areaTriangle(v1, v2);
    console.log("areaTriangle(v1, v2) =", area);
  }
}

// Step 7
function angleBetween(v1, v2) {
  const m1 = v1.magnitude();
  const m2 = v2.magnitude();
  if (m1 === 0 || m2 === 0) return 0;

  const d = Vector3.dot(v1, v2);
  let cosA = d / (m1 * m2);
  cosA = Math.max(-1, Math.min(1, cosA)); // clamp
  return Math.acos(cosA) * (180 / Math.PI);
}

// Step 8
function areaTriangle(v1, v2) {
  const c = Vector3.cross(v1, v2);
  return c.magnitude() / 2;
}

  