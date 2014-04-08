attribute vec3 aPositionVertex;
attribute vec3 aNormalVertex;
attribute vec2 aTextureVertex;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uNMatrix;

varying vec2 vKdMapCoord;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;

// todo: this should be a uniform passed in by the scene object
varying highp vec4 lightPosition;

void main(void) 
{
	vNormal = uNMatrix * vec4(aNormalVertex, 1.0);
	vPosition = uMVMatrix * vec4(aPositionVertex, 1.0);
	gl_Position = uPMatrix * vPosition;
	lightPosition = uMVMatrix * vec4(0, 5, 0, 1.0);	
	vKdMapCoord = aTextureVertex;
}

