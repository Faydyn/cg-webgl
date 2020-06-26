"use strict"

var gl;
var program;
var numVertices = 36;
var positions = [];
var colors = [];
 

var vao;

function render(timestamp, previousTimestamp) {
    var light = getLightPosition(); // vec3
    var rotation = getRotation(); // vec3	

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, numVertices); // 1a - Anpassung der Flaechenanzahl

    window.requestAnimFrame(function(time) {
        render(time, timestamp);
    });
}



function colorCube() {
    quad(0, 3, 2, 1); // vorn
    quad(2, 3, 7, 6); // rechts
    quad(0, 4, 7, 3); // unten
    quad(1, 2, 6, 5); // oben
    quad(4, 5, 6, 7); // hinten
    quad(0, 1, 5, 4); // links
}

function quad(a, b, c, d) {

    var vertices = [vec3(-0.5, 0, -0.5), //0
        vec3(-0.25, 0.25, -0.25), //1
        vec3(0.25, 0.25, -0.25), // 2
        vec3(0.5, 0, -0.5), //3
        vec3(-0.5, 0, 0.5), // 4
        vec3(-0.25, 0.25, 0.25), //5
        vec3(0.25, 0.25, 0.25), //6
        vec3(0.5, 0, 0.5) // 7
    ];

    var vertexColors = [
        [0.0, 0.0, 0.0, 1.0], // black
        [1.0, 0.0, 0.0, 1.0], // red
        [1.0, 1.0, 0.0, 1.0], // yellow
        [0.0, 1.0, 0.0, 1.0], // green
        [0.0, 0.0, 1.0, 1.0], // blue
        [1.0, 0.0, 1.0, 1.0], // magenta
        [0.0, 1.0, 1.0, 1.0], // cyan
        [1.0, 1.0, 1.0, 1.0] // white
        ];


    var indices = [a, b, c, a, c, d];
    for (var i = 0; i < indices.length; ++i) {
        positions.push(vertices[indices[i]]);
        colors.push(vertexColors[indices[i]]);
    }
}

function createGeometry() {

    // 1a - BEGINN - Erstellen der Dreiecke fuer die Flaechen
       
    quad(0, 3, 2, 1);
    quad(2, 3, 7, 6);
    quad(0, 4, 7, 3);
    quad(1, 2, 6, 5);
    quad(4, 5, 6, 7);
    quad(0, 1, 5, 4);

    // 1a - ENDE - Erstellen der Dreiecke fuer die Flaechen

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(0);


    // const colorTriangle = [vec3(0.4, 0.4, 0.4), vec3( 0.6, 0.6, 0.6,), vec3(0.7,0.7,0.7)];
    // var colors = [].concat(...Array(12).fill(colorTriangle)); // concat (colorTriable * 12)

    var vboColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vboColor);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.enableVertexAttribArray(1);
}

function loadModel() {
    var meshData = loadMeshData();
    var positions = meshData.positions;
    var colors = meshData.colors;  
    var normals = meshData.normals;
    var vertexCount = meshData.vertexCount;
}

window.onload = function init() {

    var canvas = document.getElementById('rendering-surface');
    gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");


    createGeometry();
    loadModel();

    gl.useProgram(program);

    // 1b - BEGINN - Erstellen der Matrizen
    var eyePos = vec3(0.0, 3.0, 2.0);
    var lookAtPos = vec3(0.0, 0.0, 0.0);
    var upVector = vec3(0.0, 1.0, 0.0);

	//var viewMatrix = lookAt(vec3(40*Math.cos(timestamp/10000.),0, 20.0), lookAtVector, upVector);
	var viewMatrix = lookAt(eyePos, lookAtPos, upVector);
	
	// 1c - BEGINN - Aendern der Modelmatrix

	var alpha = Math.acos(4.0/5.0) * 360/(2*Math.PI);

	var t1 = translate(0, -0.075, 0); // TODO: Does this work?*
    var t2 = scalem(2.0, 2.0, 2.0);
    
    var modelMatrix = mat4(1.0);
    modelMatrix =  mult(t2, mult(t1, modelMatrix)); // TODO: The first (inner) Multiplication, ddoes it work?*
    
    // 1c - ENDE - Aendern der Modelmatrix
	
	var projectionMatrix = perspective(60.0, canvas.width/canvas.height, 0.1, 100.0);
	
	var uniformLocationID = gl.getUniformLocation(program, 'viewMatrix');
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(viewMatrix));

	var uniformmodelID = gl.getUniformLocation(program, 'modelMatrix');
	gl.uniformMatrix4fv(uniformmodelID, gl.FALSE, flatten(modelMatrix));

	var uniformLocationID = gl.getUniformLocation(program, 'projectionMatrix');
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(projectionMatrix));

    // 1b - ENDE - Erstellen der Matrizen
    

    render(0, 0);
}