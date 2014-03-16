precision mediump float;

uniform vec4 uKs;

uniform vec4 uKd;
varying vec2 vKdMapCoord;
uniform sampler2D uMapKd;
uniform vec2 uMapKdScale;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;

varying highp vec4 lightPosition; 

void main(void)
{
// todo: should this be turned into a uniform variable?
float uKsExponent = 100.0;


    highp vec3 materialDiffuseColor = mix(texture2D(uMapKd, 
										  vec2(vKdMapCoord.s / uMapKdScale.s, 
											   vKdMapCoord.t / uMapKdScale.t)), 
										  uKd, 
										  uKd.a).xyz;

    highp vec3 lightDirection = normalize(vec3(lightPosition - vPosition)); 
    highp vec3 normal = normalize(vNormal.xyz);

    highp float diffuseFactor = max(0.0, dot(normal, lightDirection)); 
    
    vec3 E = normalize(-vPosition.xyz);
    vec3 R = reflect(-lightDirection, normal);
    float specular =  max(dot(R, E), 0.0);

    float specularFactor = pow(specular, uKsExponent);

    highp vec3 color = diffuseFactor * materialDiffuseColor + specularFactor * uKs.xyz;

    gl_FragColor = vec4(color, 1); 
	//gl_FragColor = vec4(vNormal.xyz, 1);
	//gl_FragColor = vec4(materialDiffuseColor, 1);
}





