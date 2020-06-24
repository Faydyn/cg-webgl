"use strict"

var gl;

var viewMatrix;
var projectionMatrix;

var program;

var vao;

function render(timestamp, previousTimestamp) 
{
	var light = getLightPosition(); // vec3
	var rotation = getRotation();	// vec3	

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.useProgram(program);	

	gl.bindVertexArray(vao);
	gl.drawArrays(gl.TRIANGLES, 0, 3);	

	window.requestAnimFrame(function (time) {		
		render(time, timestamp);
	});
}

function createGeometry()
{
	var positions = [];
	positions.push(vec3(-1.0, -1.0,  -1.0));
	positions.push(vec3(0,  1.0,  -1.0));
	positions.push(vec3(1.0, -1.0,  -1.0));	

	vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);
	gl.enableVertexAttribArray(0);

	var colors = [];
	colors.push(vec3(1.0, 0.0, 0.0));
	colors.push(vec3(1.0, 0.0, 1.0));
	colors.push(vec3(1.0, 1.0, 0.0));

	var vboColor = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vboColor);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);	
	gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 0, 0);
	gl.enableVertexAttribArray(1);	 
}

function loadModel()
{
	var meshData = loadMeshData();
	var positions = meshData.positions;
	var normals = meshData.normals;
	var colors = meshData.colors;
	var vertexCount = meshData.vertexCount;
}

window.onload = function init() {

	var canvas = document.getElementById('rendering-surface');	
	gl = WebGLUtils.setupWebGL( canvas );
	
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0.0, 0.0, 0.0, 0.0);	

	program = initShaders(gl, "vertex-shader","fragment-shader");
	gl.useProgram(program);	
	
	createGeometry();
	loadModel();	

	var projectionMatrix = mat4(1.0);
	projectionMatrix = perspective(90, canvas.width / canvas.height,0.1, 100);	

	var eyePos = vec3(0, 1.0, 2.0);
	var lookAtPos = vec3(0.0, 0.0, 0.0);
	var upVector = vec3(0.0, 1.0, 0.0);
	viewMatrix = lookAt(eyePos, lookAtPos, upVector);

	render(0,0);
}

