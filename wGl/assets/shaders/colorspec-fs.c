precision mediump float;

uniform vec4 uKs;

uniform vec4 uKd;
varying vec2 vKdMapCoord;
uniform sampler2D uMapKd;
uniform vec2 uMapKdScale;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;
varying highp vec4 vpPosition;

varying highp vec4 lightPosition; 

void main(void)
{
    highp vec3 materialDiffuseColor = mix(texture2D(uMapKd, 
										  vec2(vKdMapCoord.s / uMapKdScale.s, 
											   vKdMapCoord.t / uMapKdScale.t)), 
										  uKd, 
										  uKd.a).xyz;
    

    gl_FragColor = vec4(materialDiffuseColor, 1); 
}





