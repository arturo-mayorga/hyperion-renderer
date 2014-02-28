precision mediump float;

varying vec4 vColor;
varying vec2 vTextureCoord;

uniform sampler2D uMapKd;
uniform vec2 uMapKdScale;

void main(void) {
    gl_FragColor = mix(texture2D(uMapKd, 
                                 vec2(vTextureCoord.s / uMapKdScale.s, 
                                      vTextureCoord.t / uMapKdScale.t)), 
                       vColor, 
                       vColor.a);
    
} 

