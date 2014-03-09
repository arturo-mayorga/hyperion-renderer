attribute vec4 aPositionVertex;
attribute vec2 aTextureVertex;

varying vec2 vTexCoordinate;

void main(void)
{
	vTexCoordinate = aTextureVertex;
	gl_Position = aPositionVertex;
} 

