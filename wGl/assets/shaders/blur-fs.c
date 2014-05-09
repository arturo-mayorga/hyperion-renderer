precision mediump float;


uniform sampler2D uMapKd;
varying vec2 vTexCoordinate;
varying vec2 vBlurTexCoords[14];

void main(void)
{
    gl_FragColor = vec4(0.0);
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 0])*0.0044299121055113265;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 1])*0.00895781211794;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 2])*0.0215963866053;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 3])*0.0443683338718;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 4])*0.0776744219933;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 5])*0.115876621105;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 6])*0.147308056121;
    gl_FragColor += texture2D(uMapKd, vTexCoordinate    )*0.159576912161;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 7])*0.147308056121;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 8])*0.115876621105;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[ 9])*0.0776744219933;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[10])*0.0443683338718;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[11])*0.0215963866053;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[12])*0.00895781211794;
    gl_FragColor += texture2D(uMapKd, vBlurTexCoords[13])*0.0044299121055113265;
} 



