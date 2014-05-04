precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapShadow;

uniform mat4 uShadowMatrix;

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
    vec4 tv4Position = texture2D(uMapPosition, vTexCoordinate);
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;
	
	vec4 shadowProj = tv4Position * uShadowMatrix;
	
	vec4 t4Shadow    = texture2D(uMapShadow, shadowProj.xy);
	
    vec3 lightColor = vec3( 1, 1, 1 );

    vec4 lightRes = calcLight( normalize(tv4Normal.xyz), 
                               tv4Position.xyz, 
                               uLightPosition0, 
                               lightColor );
        
    if (t4Shadow.z < shadowProj.z)
	{
	    lightRes *= 0.3;
	}
    
    gl_FragColor = vec4(lightRes.xyz*tv3Color, 1);
    
    gl_FragColor = vec4(vec3( (tv4Position.z*-1.0)/32.0  ), 1);
    
    gl_FragColor = vec4(vec3( (shadowProj.z*-1.0)/128.0  ), 1);
    
} 



