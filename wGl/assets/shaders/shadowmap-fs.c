precision lowp float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapPosition;
uniform sampler2D uMapShadow;
uniform sampler2D uMapPing;

uniform mat4 uShadowMatrix;

void main(void)
{
 
     vec4 tv4Position = texture2D(uMapPosition, vTexCoordinate);
	
	
	 vec4 shadowProj =  uShadowMatrix * vec4(tv4Position.xyz, 1.0);
	
	shadowProj /= shadowProj.w;
	
	vec4 t4Shadow    = texture2D(uMapShadow, vec2( (shadowProj.x+1.0)/2.0, (shadowProj.y+1.0)/2.0));
	
	if ( abs(shadowProj.x) < 1.0 && abs(shadowProj.y) < 1.0 && abs(shadowProj.z) < 1.0 )
	{
	    
	   if ( t4Shadow.w - shadowProj.z > -0.00008 )
        {
            gl_FragColor = vec4(1);// + pingColor;
        } 
        else
        {
            gl_FragColor = vec4(0.0);//pingColor;
        } 
    }
    else
    {
        vec4 pingColor   = texture2D( uMapPing,    vTexCoordinate);
        gl_FragColor = pingColor;
    }
} 



