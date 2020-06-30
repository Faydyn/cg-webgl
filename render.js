'use strict'
/* jshint 	esversion: 6 */
/* jshint 	-W033 */
/* jshint	-W097 */
/* global 	console, vec3, lookAt, perspective, mat4, flatten, loadMeshData, mult, rotateX, rotateY, rotateZ,
			getLightPosition, getRotation, translate, scalem, window, document, WebGLUtils, initShaders */

//TODO:
/**
 * 2. Finish Phong Shading:
 * 2.1 REWORK FOR BUNNY
 * 2.2 ADD NORMALS TO PYRAMID, IMPLEMENT FOR PYRAMID
 * 		SRC:
 * 		I.	 https://en.wikipedia.org/wiki/Blinn–Phong_reflection_model (Wikipedia)
 * 		II.  https://www.youtube.com/watch?v=33gn3_khXxw&t=364s (IndigoCode)
 * 		III. https://www.youtube.com/watch?v=hYKK4rIAB48 (GregTatum)
 *
 * 4. Pay Attention to material parameters like "diffuse, spectular, shininess"
 *
 * 5. Generate Sun as a Lightsrc (3D Sphere)
 *
 * 6. Remove tmp Coord Sys
 */

let gl
let program

let vao
let vaoBunny

let positions = []
let colors = []

let bunnyVertices
const numVertices = 36

const rotationalState = {
	// 2b - Helper
	x: 0,
	y: 0,
	z: 0,
	increment(a, b, c) {
		this.x += a
		this.y += b
		this.z += c
	},
	getValues() {
		return [this.x, this.y, this.z]
	}
}

// 1a - BEGINN - Erstellen der Dreiecke fuer die Flaechen
const vertices = [
	vec3(-0.5, 0, -0.5), //0
	vec3(-0.25, 0.25, -0.25), //1
	vec3(0.25, 0.25, -0.25), // 2
	vec3(0.5, 0, -0.5), //3
	vec3(-0.5, 0, 0.5), // 4
	vec3(-0.25, 0.25, 0.25), //5
	vec3(0.25, 0.25, 0.25), //6
	vec3(0.5, 0, 0.5) // 7
]

const vertexColors = [
	[0.0, 0.0, 0.0, 1.0], // black
	[1.0, 0.0, 0.0, 1.0], // red
	[1.0, 1.0, 0.0, 1.0], // yellow
	[0.0, 1.0, 0.0, 1.0], // green
	[0.0, 0.0, 1.0, 1.0], // blue
	[1.0, 0.0, 1.0, 1.0], // magenta
	[0.0, 1.0, 1.0, 1.0], // cyan
	[1.0, 1.0, 1.0, 1.0] // white
]

const allSidesVertixOrder = [
	[0, 3, 2, 1], // vorn
	[2, 3, 7, 6], // rechts
	[0, 4, 7, 3], // unten
	[1, 2, 6, 5], // oben
	[4, 5, 6, 7], // hinten
	[0, 1, 5, 4] // links
]

const quad = (a, b, c, d) => {
	let indices = [a, b, c, a, c, d]
	indices.forEach(i => {
		positions.push(vertices[i])
		colors.push(vertexColors[i])
	})
}

const makePyramid = allSides => allSides.forEach(side => quad(...side)) //side is a list of 4 Vertices
// 1a - ENDE - Erstellen der Dreiecke fuer die Flaechen

const setUpMatrices = canvas => {
	// 1b - BEGINN - Erstellen der Matrizen
	const eyeVec = vec3(0.0, 1.5, 2.5)
	const lookVec = vec3(0.0, 0.0, 0.0)
	const upVec = vec3(0.0, 1.0, 0.0)

	let viewMatrix = lookAt(eyeVec, lookVec, upVec)
	let projectionMatrix = perspective(60.0, canvas.width / canvas.height, 0.1, 100.0)

	let uniformLocationID = gl.getUniformLocation(program, 'viewMatrix')
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(viewMatrix))
	uniformLocationID = gl.getUniformLocation(program, 'projectionMatrix')
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(projectionMatrix))
	// modelMatrix wird in render() uebergeben, da dort die Transformationen sind

	// 1b - ENDE - Erstellen der Matrizen
}

const createGeometry = () => {
	makePyramid(allSidesVertixOrder) // 1a

	vao = gl.createVertexArray()
	gl.bindVertexArray(vao)

	let vertexBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW)
	gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(0)

	let vboColor = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vboColor)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW)
	gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(1)
}

const loadModel = () => {
	let meshData = loadMeshData()

	bunnyVertices = meshData.vertexCount
	vaoBunny = gl.createVertexArray()
	gl.bindVertexArray(vaoBunny)

	let vertexBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(meshData.positions), gl.STATIC_DRAW)
	gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(0)

	let vboColor = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vboColor)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(meshData.colors), gl.STATIC_DRAW)
	gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(1)

	let normalsBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(meshData.normals), gl.STATIC_DRAW)
	gl.vertexAttribPointer(2, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(2)
}

const rotateAllAxis = (matrix, x, y, z) => mult(rotateZ(z), mult(rotateY(y), mult(rotateX(x), matrix)))

const render = (timestamp, previousTimestamp) => {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// 3b - BEGINN
	let uniformLocationID = gl.getUniformLocation(program, 'lightPos')
	let light = getLightPosition() // nicht pro Frame, d.h. die hier erhaltene Position ist immer absolut
	gl.uniform3fv(uniformLocationID, flatten(light))
	// 3b - ENDE

	let modelMatrix = mat4(1.0) // clean modelMatrix, rotational progress is saved in own variable
	uniformLocationID = gl.getUniformLocation(program, 'modelMatrix')

	// TODO: START - Remove Temp Coord System at end
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(modelMatrix))
	gl.bindVertexArray(vao)
	gl.drawArrays(gl.LINES, numVertices, 6)
	// TODO: END - Remove Temp Coord System at end

	// 1c - BEGINN - Aendern der Modelmatrix der Pyramid
	const t1 = translate(0, -0.75, 0)
	const t2 = scalem(2.0, 2.0, 2.0)
	modelMatrix = mult(t2, mult(t1, modelMatrix)) // neue Matrix fuer die Transformationen, um den State der globalen nicht zu 'verunreinigen'

	// 2b - BEGINN - Annahme dass der Wert, um den rotiert wird, Grad ° entsprechen soll.
	modelMatrix = rotateAllAxis(modelMatrix, ...rotationalState.getValues())

	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(modelMatrix))
	gl.bindVertexArray(vao)
	gl.drawArrays(gl.TRIANGLES, 0, numVertices) // 1a - Anpassung der Flaechenanzahl
	// 1c - ENDE - Aendern der Modelmatrix

	modelMatrix = mat4(1.0)
	modelMatrix = rotateAllAxis(modelMatrix, ...rotationalState.getValues())
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(modelMatrix))
	gl.bindVertexArray(vaoBunny)
	gl.drawArrays(gl.TRIANGLES, 0, bunnyVertices)

	rotationalState.increment(...getRotation().map(x => parseFloat(x))) // (de-)increase rotation state for next frame
	// 2b - ENDE

	window.requestAnimFrame(time => render(time, timestamp))
}

window.onload = () => {
	let canvas = document.getElementById('rendering-surface')
	gl = WebGLUtils.setupWebGL(canvas)

	gl.viewport(0, 0, canvas.width, canvas.height)
	gl.enable(gl.DEPTH_TEST)
	gl.clearColor(0.0, 0.0, 0.0, 0.0)
	program = initShaders(gl, 'vertex-shader', 'fragment-shader')

	createGeometry() // 1a
	loadModel() // 2a

	gl.useProgram(program)

	setUpMatrices(canvas) // 1b
	render(0, 0) // 1c, 2b
}
