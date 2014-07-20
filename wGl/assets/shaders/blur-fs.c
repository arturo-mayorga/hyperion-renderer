precision mediump float;


uniform sampler2D uMapKd;
varying vec2 vTexCoordinate;
varying vec2 vBlurTexCoords[4];

void main(void)
{
    gl_FragColor = vec4(0.0);
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[0])*0.0702702703;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[1])*0.3162162162;
    gl_FragColor += texture2D(uMapKd, vTexCoordinate   )*0.227027027;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[2])*0.3162162162;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[3])*0.0702702703;
} 



