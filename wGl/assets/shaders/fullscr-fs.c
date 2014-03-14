precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform vec4 uKd;

void main(void)
{
	vec3 tColor = texture2D(uMapKd, vTexCoordinate).xyz;
	vec3 fColor = vec3( min(tColor.x, uKd.x), 
	                    min(tColor.y, uKd.y), 
	                    min(tColor.z, uKd.z) );
	gl_FragColor = vec4(fColor, uKd.a);
} 

