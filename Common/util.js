function loadMeshData() {

	var positions = LoadedOBJFiles["bunnysmooth.obj"].groups['bunny'].vertices;
	var normals = LoadedOBJFiles["bunnysmooth.obj"].groups['bunny'].normals;
	var faces = LoadedOBJFiles["bunnysmooth.obj"].groups['bunny'].faces;
	var colors = [];

	var vertPos = [];
	var vertNorm = [];
	for (var i = 0; i < faces.length; ++i) {
		Array.prototype.push.apply(
			vertPos, positions[faces[i][0][0]]);		
		Array.prototype.push.apply(
			vertPos, positions[faces[i][1][0]]);		
		Array.prototype.push.apply(
			vertPos, positions[faces[i][2][0]]);		

		Array.prototype.push.apply(
			vertNorm, normals[faces[i][0][2]]);
		Array.prototype.push.apply(
			vertNorm, normals[faces[i][1][2]]);
		Array.prototype.push.apply(
			vertNorm, normals[faces[i][2][2]]);
	}

	for(var i = 0; i< vertPos.length / 3;++i)
	{
		colors.push(0.8, 0.2, 0.2);
	}

	return {		
		positions: new Float32Array(vertPos),
		normals: new Float32Array(vertNorm),
		colors: new Float32Array(colors),
		vertexCount: vertPos.length / 3		
	};
}

function getRotation()
{
	var rotateX = (document.getElementById("rotate-x").value);
	var rotateY = (document.getElementById("rotate-y").value);
	var rotateZ = (document.getElementById("rotate-z").value);

	return vec3(rotateX, rotateY, rotateZ);
}

function getLightPosition()
{
	var light = vec3(
		(document.getElementById("light-x").value - 50.0) / 10.0,
		(document.getElementById("light-y").value - 50.0) / 10.0,
		(document.getElementById("light-z").value - 50.0) / 10.0);

	return light;
}
