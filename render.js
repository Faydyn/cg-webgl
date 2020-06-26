"use strict"

var gl;

var viewMatrix;
var projectionMatrix;

var program;

var vao;

function render(timestamp, previousTimestamp) {
    var light = getLightPosition(); // vec3
    var rotation = getRotation(); // vec3	

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    gl.bindVertexArray(vao);
    var amount = 36; // 6 Flachen, 2 Dreiecke pro Flaeche, 3 Punkte pro Dreieck
    gl.drawArrays(gl.TRIANGLES, 0, amount);

    window.requestAnimFrame(function(time) {
        render(time, timestamp);
    });
}

function createGeometry() {
    var positions = [];
    const p1 = vec3(-0.5, 0, -0.5);
    const p2 = vec3(0.5, 0, -0.5);
    const p3 = vec3(0.5, 0, 0.5);
    const p4 = vec3(-0.5, 0, 0.5);

    const p5 = vec3(-0.25, 0.25, -0.25);
    const p6 = vec3(0.25, 0.25, -0.25);
    const p7 = vec3(0.25, 0.25, 0.25);
    const p8 = vec3(-0.25, 0.25, 0.25);

    // Unten
    positions.push(p1);
    positions.push(p2);
    positions.push(p3);

    positions.push(p1);
    positions.push(p3);
    positions.push(p4);

    // Vorn
    positions.push(p1);
    positions.push(p2);
    positions.push(p5);

    positions.push(p2);
    positions.push(p5);
    positions.push(p6);

    // Rechts
    positions.push(p2);
    positions.push(p3);
    positions.push(p7);

    positions.push(p2);
    positions.push(p7);
    positions.push(p6);

    // Hinten
    positions.push(p3);
    positions.push(p4);
    positions.push(p7);

    positions.push(p4);
    positions.push(p7);
    positions.push(p8);

    // Links
    positions.push(p1);
    positions.push(p4);
    positions.push(p8);

    positions.push(p1);
    positions.push(p5);
    positions.push(p8);

    // Oben
    positions.push(p5);
    positions.push(p6);
    positions.push(p7);

    positions.push(p5);
    positions.push(p7);
    positions.push(p8);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(0);


    const colorTriangle = [vec3(1.0, 0.0, 0.0), vec3(1.0, 0.0, 1.0), vec3(1.0, 1.0, 0.0)];
    var colors = [].concat(...Array(12).fill(colorTriangle)); // concat (colorTriable * 12)



    var vboColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vboColor);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(1);
}

function loadModel() {
    var meshData = loadMeshData();
    var positions = meshData.positions;
    var normals = meshData.normals;
    var colors = meshData.colors;
    var vertexCount = meshData.vertexCount;
}

window.onload = function init() {

    var canvas = document.getElementById('rendering-surface');
    gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    createGeometry();
    loadModel();

    var projectionMatrix = mat4(1.0);
    projectionMatrix = perspective(90, canvas.width / canvas.height, 0.1, 100);

    var eyePos = vec3(0, 1.0, 2.0);
    var lookAtPos = vec3(0.0, 0.0, 0.0);
    var upVector = vec3(0.0, 1.0, 0.0);
    viewMatrix = lookAt(eyePos, lookAtPos, upVector);

    render(0, 0);
}