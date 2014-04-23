precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapRGBDepth;



void main(void)
{
    // todo: should this be turned into a uniform variable?
float uKsExponent = 100.0;

vec3 lightPosition = vec3(0.0, 0.0, 0.0);

    vec3 tv3Normal   = texture2D(uMapNormal,   vTexCoordinate).xyz;
    vec3 tv3Position = texture2D(uMapPosition, vTexCoordinate).xyz;
    vec3 tv3RGBDepth = texture2D(uMapRGBDepth, vTexCoordinate).xyz;
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;

	 

    highp vec3 lightDirection = normalize(vec3(lightPosition - tv3Position)); 
    highp vec3 normal = normalize(tv3Normal.xyz);

    highp float diffuseFactor = max(0.0, dot(normal, lightDirection)); 
    
    vec3 E = normalize(-tv3Position.xyz);
    vec3 R = reflect(-lightDirection, normal);
    float specular =  max(dot(R, E), 0.0);

    float specularFactor = pow(specular, uKsExponent);

    highp vec3 color = diffuseFactor * tv3Color;// + specularFactor * uKs.xyz;

    gl_FragColor = vec4(color, 1); 
} 



