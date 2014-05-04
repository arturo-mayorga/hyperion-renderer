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
    vec3 tv3Normal   = normalize(texture2D(uMapNormal,   vTexCoordinate).xyz);
    vec3 tv3Position = texture2D(uMapPosition, vTexCoordinate).xyz;
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;
	
	vec3 lightColor = vec3(1, 1, 1);

	vec4 lightRes = calcLight(tv3Normal, tv3Position, uLightPosition0, lightColor);

    gl_FragColor = vec4(lightRes.xyz*tv3Color, 1); 
} 



