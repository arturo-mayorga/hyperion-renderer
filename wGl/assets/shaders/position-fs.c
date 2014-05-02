#extension GL_EXT_draw_buffers : require
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
    
    highp float fDepth = vpPosition.z; 
    gl_FragData[0] = vec4(vec3(fDepth/100.0), 1);
    gl_FragData[1] = vec4(vNormal.xyz, vpPosition.z);
    gl_FragData[2] = vec4(vPosition.xyz, 1);
    gl_FragData[3] = vec4(materialDiffuseColor, 1);
    //gl_FragColor = vec4(color, 1); 
}





