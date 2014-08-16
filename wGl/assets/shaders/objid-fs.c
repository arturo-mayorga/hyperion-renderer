precision mediump float;



uniform vec4 uObjid;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;
varying highp vec4 vpPosition;


void main(void)
{
    gl_FragColor = vec4(uObjid.xyz, 1.0);//vpPosition.z); 
}





