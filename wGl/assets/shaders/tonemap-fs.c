precision mediump float;


uniform sampler2D uMapKd;
uniform sampler2D uMapShadow;
varying vec2 vTexCoordinate;

void main(void)
{
    gl_FragColor = vec4( 0.5, 1.0, 0.5, 1.0 );
    
    gl_FragColor = texture2D(uMapKd, vTexCoordinate) * texture2D(uMapShadow, vTexCoordinate);
} 



