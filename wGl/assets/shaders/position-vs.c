attribute vec3 aPositionVertex;
attribute vec3 aNormalVertex;
attribute vec2 aTextureVertex;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uNMatrix;

varying vec2 vKdMapCoord;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;
varying highp vec4 vpPosition;


void main(void) 
{
	vNormal = uNMatrix * vec4(aNormalVertex, 1.0);
	vPosition = uMVMatrix * vec4(aPositionVertex, 1.0);
	vpPosition = uPMatrix * vPosition;
	gl_Position = vpPosition;
	vKdMapCoord = aTextureVertex;
}

