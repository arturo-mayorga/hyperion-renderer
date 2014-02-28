precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMap_Kd;

void main(void)
{
	vec3 color = texture2D(uMap_Kd, vTexCoordinate).xyz;
	gl_FragColor = vec4(color, 1.0);
} 

