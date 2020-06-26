"use strict"

let gl
let program

let viewMatrix
let projectionMatrix
let modelMatrix
let vao

let positions = []
let colors = []

const numVertices = 36

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
    [1.0, 1.0, 1.0, 1.0]  // white
/* 
Alternative:
    const colorTriangle = [vec3(0.4, 0.4, 0.4), vec3( 0.6, 0.6, 0.6,), vec3(0.7,0.7,0.7)]
    let colors = [].concat(...Array(12).fill(colorTriangle)) // concat (colorTriable * 12)
*/
]

const allSidesVertixOrder = [
    [0, 3, 2, 1], // vorn
    [2, 3, 7, 6], // rechts
    [0, 4, 7, 3], // unten
    [1, 2, 6, 5], // oben
    [4, 5, 6, 7], // hinten
    [0, 1, 5, 4] // links
]

const quad = (a, b, c, d)  => {
    let indices = [a, b, c, a, c, d]
    indices.forEach(i => {
        positions.push(vertices[i])
        colors.push(vertexColors[i])
    })
}

const makePyramid = allSides => allSides.map(side => quad(...side))
// 1a - ENDE - Erstellen der Dreiecke fuer die Flaechen

const setUpMatrices = canvas => {
    // 1b - BEGINN - Erstellen der Matrizen
    const eyePos = vec3(0.0, 3.0, 2.0)
    const lookAtPos = vec3(0.0, 0.0, 0.0)
    const upVector = vec3(0.0, 1.0, 0.0)

	viewMatrix = lookAt(eyePos, lookAtPos, upVector)
    projectionMatrix = perspective(60.0, canvas.width/canvas.height, 0.1, 100.0)

	// 1c - BEGINN - Aendern der Modelmatrix
	const t1 = translate(0, -0.75, 0) 
    const t2 = scalem(2.0, 2.0, 2.0) //TODO: y-value 0.5 or 2.0 -> ScaleTo or ScaleBy?? Think its 2.0, because of MatrixMultiplication
    modelMatrix = mat4(1.0)
    modelMatrix =  mult(t2, mult(t1, modelMatrix)) 
    // 1c - ENDE - Aendern der Modelmatrix
	
	let uniformLocationID = gl.getUniformLocation(program, 'viewMatrix')
    gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(viewMatrix))
	uniformLocationID = gl.getUniformLocation(program, 'projectionMatrix')
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(projectionMatrix))
	uniformLocationID = gl.getUniformLocation(program, 'modelMatrix')
	gl.uniformMatrix4fv(uniformLocationID, gl.FALSE, flatten(modelMatrix))
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
    let bunnyPositions = meshData.positions
    let bunnyColors = meshData.colors
    let normals = meshData.normals
    let vertexCount = meshData.vertexCount
}

const render = (timestamp, previousTimestamp) => {
    let light = getLightPosition() // vec3
    let rotation = getRotation() // vec3	

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.bindVertexArray(vao)
    gl.drawArrays(gl.TRIANGLES, 0, numVertices) // 1a - Anpassung der Flaechenanzahl

    window.requestAnimFrame(time => render(time, timestamp))
}

window.onload = () => {
    let canvas = document.getElementById('rendering-surface')
    gl = WebGLUtils.setupWebGL(canvas)

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    program = initShaders(gl, "vertex-shader", "fragment-shader")

    createGeometry()
    loadModel()
    
    gl.useProgram(program)
    
    setUpMatrices(canvas) // 1b, 1c
    render(0, 0)
}