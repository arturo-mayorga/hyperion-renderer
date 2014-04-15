precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapRGBDepth;

const float numSamples = 16.0;

float randoms(float co){
  //  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453)*2.0 - 1.0 ;
  //  return sin(co.x * co.y)*2.0 - 1.0 ;
    return sin(co * (3.1416/1.5));
}

float randomc(float co){
  //  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453)*2.0 - 1.0 ;
  //  return sin(co.x * co.y)*2.0 - 1.0 ;
    return cos(co * (3.1416/1.5));
}

float random(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453)*2.0 - 1.0 ;
}



void main(void)
{
    vec3 tv3Normal   = texture2D(uMapNormal,   vTexCoordinate).xyz;
    vec3 tv3Position = texture2D(uMapPosition, vTexCoordinate).xyz;
    vec3 tv3RGBDepth = texture2D(uMapRGBDepth, vTexCoordinate).xyz;
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;

	float tfdDepthValue = tv3Position.z; //256.0 * (tv3RGBDepth.x + tv3RGBDepth.y);
	

	// there is greater sampling penalty for larger radii
    float uRadius = min (0.06, 0.10/tfdDepthValue); 
	
	
	
	float occlusion = 0.0;
	vec3 occlusionC = vec3(0);
    for (float i = 0.0; i < numSamples; ++i) 
    {
        // get sample position:
        
        // the commented out approach produces faster results but the other has
        // beter sampling distibution
        //vec2 sample = vec2(randoms(i), randomc(i)) * (i+1.0)/numSamples;   
        vec2 sample = normalize(vec2(random(vec2(vTexCoordinate*i)), random(vTexCoordinate*i*32.43))) * random(vTexCoordinate*i*45.6);
        
        
        sample = sample * uRadius + vTexCoordinate;
        
        // get sample depth:
        float sampleDepth = texture2D(uMapPosition, sample).z;
        vec4 sampleColor = texture2D(uMapKd, sample);
        vec4 sampleNormal = texture2D(uMapNormal, sample);
        
        float normalAtt = 1.0;//dot(sampleNormal.xyz, tv3Normal) < 0.059?1.0:0.0;
        //normalAtt *= normalAtt;
        
        // range check & accumulate:
        vec3 incCol = 1.0 - sampleColor.xyz*0.5;
        float rangeCheck =  abs(tfdDepthValue - sampleDepth) < 0.2 ? normalAtt : 0.0;
        occlusionC += incCol.xyz * vec3((tfdDepthValue >= sampleDepth ? 1.0 : 0.0) * rangeCheck);
    }
    
    vec3 ovFactor = 1.0 - (occlusionC/numSamples);
    
    gl_FragColor = vec4(tv3Color*ovFactor, 1);
    // gl_FragColor = vec4(vec3(oFactor), 1);
    //gl_FragColor = vec4(ovFactor, 1);
} 

