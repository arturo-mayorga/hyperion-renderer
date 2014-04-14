precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapRGBDepth;


float random(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453)*2.0 - 1.0 ;
}

void main(void)
{
    vec3 tv3Normal   = texture2D(uMapNormal,   vTexCoordinate).xyz;
    vec3 tv3Position = texture2D(uMapPosition, vTexCoordinate).xyz;
    vec3 tv3RGBDepth = texture2D(uMapRGBDepth, vTexCoordinate).xyz;
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;
	
	vec3 rvec =  normalize(vec3(random(vTexCoordinate),random(vTexCoordinate*23.0),random(vTexCoordinate*36.0)))* 2.0 - 1.0;

	float tfdDepthValue = tv3Position.z; //256.0 * (tv3RGBDepth.x + tv3RGBDepth.y);
	

	float uRadius = 0.10/tfdDepthValue; 
	
	const float numSamples = 10.0;
	
	float occlusion = 0.0;
    for (float i = 0.0; i < numSamples; ++i) 
    {
        // get sample position:
        vec2 sample = normalize(vec2(random(vec2(vTexCoordinate*i)), random(vTexCoordinate*i*32.43))) * random(vTexCoordinate*i*45.6);
        
        sample = sample * uRadius + vTexCoordinate;
        
        // get sample depth:
        float sampleDepth = texture2D(uMapPosition, sample).z;
        
        // range check & accumulate:
        float rangeCheck =  abs(tfdDepthValue - sampleDepth) < 0.2 ? 1.0 : 0.2;
        occlusion += (tfdDepthValue > sampleDepth ? 1.0 : 0.0) * rangeCheck;
    }
    
    float oFactor = 1.0 - (occlusion/numSamples)*0.5;
   // oFactor *= oFactor*oFactor;
    
    gl_FragColor = vec4(tv3Color*oFactor, 1);
    // gl_FragColor = vec4(vec3(oFactor), 1);
} 

