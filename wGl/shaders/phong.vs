attribute vec3 aPositionVertex;
attribute vec3 aNormalVertex;
attribute vec2 aTextureVertex;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec4 uKd;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) 
{
	float zr = 10.0;
	float z = gl_Position.z;
	gl_Position = uPMatrix * uMVMatrix * vec4(aPositionVertex, 1.0);
	vTextureCoord = aTextureVertex;
	vColor = uKd;// * vec4(zr/(gl_Position.z*gl_Position.z), zr/(gl_Position.z*gl_Position.z), zr/(gl_Position.z*gl_Position.z), 1);
	//vTextureCoord = aVertexTexture;
}

