precision mediump float;



uniform vec4 uObjid;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;
varying highp vec4 vpPosition;


void main(void)
{
    float d = vpPosition.z/vpPosition.w;
    d = (d+1.0)*0.5;
    float d_ = d*255.0;
    float f = d_  - floor(d_);
    
    gl_FragColor = vec4(uObjid.xy, d, f);
}





