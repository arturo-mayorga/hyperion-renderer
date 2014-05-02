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


void main(void)
{
    gl_FragColor = vec4(vPosition.xyz, 1);
}





