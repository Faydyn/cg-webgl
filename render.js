'use strict'
/* jshint 	esversion: 6 */
/* jshint 	-W033 */
/* jshint	-W097 */
/* global 	console, vec3, lookAt, perspective, mat4, flatten, loadMeshData, mult, rotateX, rotateY, rotateZ,
			getLightPosition, getRotation, translate, scalem, window, document, WebGLUtils, initShaders,
			cross, normalize, subtract, initShaders, add*/

//TODO:
/**
 * 2. Finish Phong Shading:
 * 		SRC:
 * 		I.	 https://en.wikipedia.org/wiki/Blinn–Phong_reflection_model (Wikipedia)
 * 		II.  https://www.youtube.com/watch?v=33gn3_khXxw&t=364s (IndigoCode)
 * 		III. https://www.youtube.com/watch?v=hYKK4rIAB48 (GregTatum)
 * 		IV.  https://threejs.org/docs/#api/en/geometries/SphereGeometry
 *
 * 4. Pay Attention to material parameters like "diffuse, spectular, shininess"
 *
 * 5. Make Sun be a Sphere!!!!!!
 *
 * Double check if pyramidNormals are correct.
 *
 * Question:
 */

let gl
let program

let vao
let vaoBunny
let vaoSun
let rotationalState = vec3(0.0)
let sunPosition = vec3(0.0)

const positions = [] //doesnt get reassign (the list itself)
const colors = Array(36).fill(Array(3).fill(0.6))
const normals = []
const sideNormals = []

const numVertices = 36
let bunnyVertices
let sunVertices

const allSideNormalsOrder = [
	[0, 3, 1], // vorn
	[2, 3, 6], // rechts
	[0, 4, 3], // unten
	[1, 2, 5], // oben
	[4, 5, 7], // hinten
	[0, 1, 4] // links
]

// crossproduct with right hand rule to get normal (gets divided by distance before)
const makeSideNormal = (a, b, c) =>
	sideNormals.push(new normalize(cross(subtract(vertices[b], vertices[a]), subtract(vertices[c], vertices[a]))))

const makeAllSideNormals = allSides => allSides.forEach(side => makeSideNormal(...side))

const mapVertexAdjacentSides = [
	[0, 2, 5], // vorn, unten, links
	[0, 3, 5], // vorn, oben, links
	[0, 1, 3], // vorn, oben, rechts
	[0, 1, 2], // vorn, unten, rechts
	[4, 2, 5], // hinten, unten, links
	[4, 3, 5], // hinten, oben, links
	[4, 1, 3], // hinten, oben, rechts
	[4, 1, 2] // hinten, unten, rechts
]

const getVertexNormalFromAdjacentSides = (a, b, c) =>
	new normalize(add(add(sideNormals[a], sideNormals[b]), sideNormals[c])) // map-element gives indices of all 3 adjacent sides' normals (calculated before)

// 1a - BEGINN - Erstellen der Dreiecke fuer die Flaechen
const vertices = [
	vec3(-0.5, 0, 0.5), //0
	vec3(-0.25, 0.25, 0.25), //1
	vec3(0.25, 0.25, 0.25), // 2
	vec3(0.5, 0, 0.5), //3
	vec3(-0.5, 0, -0.5), // 4
	vec3(-0.25, 0.25, -0.25), //5
	vec3(0.25, 0.25, -0.25), //6
	vec3(0.5, 0, -0.5) // 7
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
		normals.push(getVertexNormalFromAdjacentSides(...mapVertexAdjacentSides[i])) // get normal for each Vertex with helper function and map.
	})
}

const makePyramid = allSides => allSides.forEach(side => quad(...side)) //side is a list of 4 Vertices
// 1a - ENDE - Erstellen der Dreiecke fuer die Flaechen

const setUpMatrices = canvas => {
	// 1b - BEGINN - Erstellen der Matrizen
	const eyeVec = vec3(0.0, 1.0, 2.0)
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
	makeAllSideNormals(allSideNormalsOrder) // make normals for each of the 6 sides
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

	let normalsBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW)
	gl.vertexAttribPointer(2, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(2)
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

// 4 - BEGINN
const drawSun = () => {
	vaoSun = gl.createVertexArray()
	gl.bindVertexArray(vaoSun)

	// TEMPORARY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	let coords = [
		vec3(-0.1, -0.1, 0.1),
		vec3(-0.1, 0.1, 0.1),
		vec3(0.1, 0.1, 0.1),
		vec3(0.1, -0.1, 0.1),
		vec3(-0.1, -0.1, -0.1),
		vec3(-0.1, 0.1, -0.1),
		vec3(0.1, 0.1, -0.1),
		vec3(0.1, -0.1, -0.1)
	]

	const sun = {
		pos: [],
		colors: Array(36).fill(vec3(1.0, 1.0, 0.0)),
		vertexCount: 36,
		quads(a, b, c, d) {
			let indices = [a, b, c, a, c, d]
			indices.forEach(i => {
				this.pos.push(coords[i])
			})
		}
	}
	let me = () => {
		sun.quads(0, 3, 2, 1)
		sun.quads(2, 3, 7, 6)
		sun.quads(0, 4, 7, 3)
		sun.quads(1, 2, 6, 5)
		sun.quads(4, 5, 6, 7)
		sun.quads(0, 1, 5, 4)
	}

	me()

	sunVertices = sun.vertexCount

	// TEMPORARY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	let vertexBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(sun.pos), gl.STATIC_DRAW)
	gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(0)

	let vboColor = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vboColor)
	gl.bufferData(gl.ARRAY_BUFFER, flatten(sun.colors), gl.STATIC_DRAW)
	gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.enableVertexAttribArray(1)

	// Braucht keine Normalen, das Lichtquelle selbst
	// let normalsBuffer = gl.createBuffer()
	// gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
	// gl.bufferData(gl.ARRAY_BUFFER, flatten(sun.normals), gl.STATIC_DRAW)
	// gl.vertexAttribPointer(2, 3, gl.FLOAT, gl.FALSE, 0, 0)
	// gl.enableVertexAttribArray(2)

	// HELPER FOR CHECKING NORMALS FOR POINTS!!!!
	const zip = (arr1, arr2) => arr1.map((k, i) => [k, arr2[i]])
	let zipped = zip(positions, normals)
	let alreadyViewed = []
	let foundShit = []

	function searchForArray(haystack, needle) {
		var i, j, current
		for (i = 0; i < haystack.length; ++i) {
			if (needle.length === haystack[i].length) {
				current = haystack[i]
				for (j = 0; j < needle.length && needle[j] === current[j]; ++j);
				if (j === needle.length) return i
			}
		}
		return -1
	}

	zipped.forEach((pair, i) => {
		let foundOnIndex = searchForArray(alreadyViewed, pair[0])
		if (foundOnIndex === -1) {
			alreadyViewed.push(pair[0])
			foundShit.push(pair[1])
		} else {
			let truly = searchForArray(foundShit, pair[1])
			if (truly === -1) {
				foundShit[foundOnIndex].concat([pair[1]])
			}
		}
	})
	console.log(zip(alreadyViewed, foundShit))
	console.log(sideNormals)
	// HELPER FOR CHECKING NORMALS FOR POINTS!!!!
}
// 4 - ENDE

const rotateAllAxis = (matrix, x, y, z) => mult(rotateX(x), mult(rotateY(y), mult(rotateZ(z), matrix)))

const render = () => {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// 3b - BEGINN
	let uniformLocationID = gl.getUniformLocation(program, 'lightPos')
	let light = sunPosition // nicht pro Frame, d.h. die hier erhaltene Position ist immer absolut
	gl.uniform3fv(uniformLocationID, flatten(light))
	// 3b - ENDE

	uniformLocationID = gl.getUniformLocation(program, 'modelMatrix')
	// 1c - BEGINN - Aendern der Modelmatrix der Pyramid
	const t1 = scalem(2.0, 2.0, 2.0)
	const t2 = translate(0, -0.75, 0)
	let modelMatrix = mult(t2, t1) // nicht kommutativ!!!!!

	// 2b - BEGINN - Annahme dass der Wert, um den rotiert wird, Grad ° entsprechen soll.
	modelMatrix = rotateAllAxis(modelMatrix, ...rotationalState)

	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(modelMatrix))
	gl.bindVertexArray(vao)
	gl.drawArrays(gl.TRIANGLES, 0, numVertices) // 1a - Anpassung der Flaechenanzahl
	// 1c - ENDE - Aendern der Modelmatrix

	modelMatrix = rotateAllAxis(mat4(1.0), ...rotationalState) //reset modelMatrix & rotate it
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(modelMatrix))
	gl.bindVertexArray(vaoBunny)
	gl.drawArrays(gl.TRIANGLES, 0, bunnyVertices)

	rotationalState = add(rotationalState, vec3(...getRotation().map(x => parseFloat(x)))) // (de-)increase rotation state for next frame
	// 2b - ENDE

	// no rotation for sun
	modelMatrix = mult(translate(...sunPosition), mat4(1.0)) // nicht kommutativ!!!!!
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(modelMatrix))
	gl.bindVertexArray(vaoSun)
	gl.drawArrays(gl.TRIANGLES, 0, sunVertices) // UNCOMMENT WHEN ACTUAL VERTICES ARE THERE!!

	sunPosition = getLightPosition()

	window.requestAnimFrame(() => render())
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
	drawSun()

	gl.useProgram(program)

	setUpMatrices(canvas) // 1b
	render() // 1c, 2b
}
