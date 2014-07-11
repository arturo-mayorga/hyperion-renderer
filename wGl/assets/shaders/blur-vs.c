attribute vec3 aPositionVertex;
attribute vec2 aTextureVertex;

uniform mat3 uHMatrix;

varying vec2 vTexCoordinate;
varying vec2 vBlurTexCoords[4];

const float uWidth = 1024.0;

void main(void)
{
	gl_Position = vec4( (uHMatrix * aPositionVertex.xyz), 1);
	
	vTexCoordinate = aTextureVertex;
	vBlurTexCoords[0] = vTexCoordinate + vec2(-3.2307692308*uWidth, 0.0);
    vBlurTexCoords[1] = vTexCoordinate + vec2(-1.3846153846*uWidth, 0.0);
    vBlurTexCoords[2] = vTexCoordinate + vec2( 1.3846153846*uWidth, 0.0);
    vBlurTexCoords[3] = vTexCoordinate + vec2( 3.2307692308*uWidth, 0.0);
} 

