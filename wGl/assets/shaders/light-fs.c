precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapShadow;

uniform mat4 uShadowMatrix;
uniform mat4 uPMatrix;

uniform vec3 uLightPosition0;

// todo: should this be turned into a uniform variable?
float uKsExponent = 100.0;

vec4 calcLight(vec3 normal, vec3 position, vec3 lightPosition, vec3 lightColor)
{
    highp vec3 lightDirection = normalize(lightPosition - position); 

    highp float diffuseFactor = max(0.0, dot(normal, lightDirection)); 
    
    vec3 E = normalize(-position.xyz);
    vec3 R = reflect(-lightDirection, normal);
    float specular =  max(dot(R, E), 0.0);

    float specularFactor = pow(specular, uKsExponent);

    return vec4(lightColor* diffuseFactor, specularFactor);
}


void main(void)
{
    vec4 tv4Normal   = texture2D(uMapNormal,   vTexCoordinate);
    highp vec4 tv4Position = texture2D(uMapPosition, vTexCoordinate);
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;
	
	highp vec4 shadowProj_ =  uShadowMatrix * vec4(tv4Position.xyz, 1.0);
	
	
	
	highp vec4 shadowProj = vec4(shadowProj_.xyz, 1.0) * uPMatrix ;
	
	shadowProj.x /= -shadowProj_.z;
	shadowProj.y /= -shadowProj_.z;
	
	//vec4 t4Shadow    = texture2D(uMapShadow, shadowProj.xy);
	//vec4 t4Shadow    = texture2D(uMapShadow, vTexCoordinate);
	float d = 1.0;
	vec4 t4Shadow    = texture2D(uMapShadow, vec2((shadowProj.x+1.0)/2.0, (shadowProj.y+1.0)/2.0));
	//vec4 t4Shadow    = texture2D(uMapShadow, vec2(shadowProj.x, shadowProj.y));
	
    vec3 lightColor = vec3( 1, 1, 1 );

    vec4 lightRes = calcLight( normalize(tv4Normal.xyz), 
                               tv4Position.xyz, 
                               uLightPosition0, 
                               lightColor );
        
    
	
	if ( abs(shadowProj.x) < 1.0 && abs(shadowProj.y) < 1.0  )
	{
	    
	    if (t4Shadow.w <= shadowProj.z)
        {
            lightRes *= 0.7;
        }
    
	// lightRes *= shadowProj.z/32.0;
	
    gl_FragColor = vec4(lightRes.xyz*tv3Color, 1);
    
    //gl_FragColor = vec4(vec3( (t4Shadow.w)/32.0  ), 1);
    
   // gl_FragColor = vec4( (shadowProj.x/d), shadowProj.y/d, (shadowProj.z)/32.0, 1);
    
    //gl_FragColor = vec4(vec3( (shadowProj.z)/32.0  ), 1);
    }
    else
    {
        gl_FragColor = vec4(lightRes.xyz*tv3Color, 1);
    }
    
} 



