precision mediump float;

uniform vec4 uKd;
varying vec2 vKdMapCoord;

uniform sampler2D uMapKd;
uniform vec2 uMapKdScale;


varying mediump vec4 vNormal;
varying highp vec4 vPosition;

uniform highp vec3 uKs;
/*uniform highp float uKsExponent;*/

varying highp vec4 lightPosition; 

/*void main(void) 
{

    gl_FragColor = mix(texture2D(uMapKd, 
                                 vec2(vKdMapCoord.s / uMapKdScale.s, 
                                      vKdMapCoord.t / uMapKdScale.t)), 
                       uKd, 
                       uKd.a);
					   
	gl_FragColor = vec4(vNormal.xyz, 1.0);
    
} */




void main(void)
{
//temp
float uKsExponent = 3.0;


    highp vec3 materialDiffuseColor = mix(texture2D(uMapKd, 
										  vec2(vKdMapCoord.s / uMapKdScale.s, 
											   vKdMapCoord.t / uMapKdScale.t)), 
										  uKd, 
										  uKd.a).xyz;
										  
    //highp vec3 uKs;

    highp vec3 lightDirection; 

   //if (lightPosition.w == 0.0)
	//{
     //   lightDirection = normalize(vec3(lightPosition));
	//}
   // else
	//{
        lightDirection = normalize(vec3(lightPosition - vPosition)); 
	//}

    highp vec3 normal = normalize(vNormal.xyz);
    highp vec3 viewDirection = vec3(0.0, 0.0, 1.0);
    highp vec3 halfPlane = normalize(lightDirection + viewDirection);

    highp float diffuseFactor = max(0.0, dot(normal, lightDirection)); 
    highp float specularFactor = max(0.0, dot(normal, halfPlane)); 

    specularFactor = 0.0;//pow(specularFactor, uKsExponent);

    highp vec3 color = diffuseFactor * materialDiffuseColor + specularFactor * vec3(0.5, 0.5, 0.5);//uKs;

    gl_FragColor = vec4(color, 1); 
}





