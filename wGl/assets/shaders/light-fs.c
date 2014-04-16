precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapRGBDepth;

const float numSamples = 4.0;

float pw = 1.0/1280.0*0.5; 
float ph = 1.0/720.0*0.5;

//float pw = 1.0/800.0*0.5; 
//float ph = 1.0/600.0*0.5;

float randoms(float co)
{
  //  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453)*2.0 - 1.0 ;
  //  return sin(co.x * co.y)*2.0 - 1.0 ;
    return sin(co * (3.1416/1.5));
}

float randomc(float co)
{
  //  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453)*2.0 - 1.0 ;
  //  return sin(co.x * co.y)*2.0 - 1.0 ;
    return cos(co * (3.1416/1.5));
}

float random(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453)*2.0 - 1.0 ;
}


float readDepth(in vec2 coord)  
{  
    if (coord.x<0.0||coord.y<0.0) return 1.0;
    
    float posZ = texture2D(uMapPosition, coord).z;   
    return posZ;  
} 


vec3 calAO(float depth, vec2 sample)
{
    float temp = 0.0;
    float temp2 = 0.0;
    float coordw = vTexCoordinate.x + sample.x/depth;
    float coordh = vTexCoordinate.y + sample.y/depth;
    float coordw2 = vTexCoordinate.x - sample.x/depth;
    float coordh2 = vTexCoordinate.y - sample.y/depth;
    
    if (coordw  < 1.0 && coordw  > 0.0 && coordh < 1.0 && coordh  > 0.0)
    {
        vec2 coord = vec2(coordw , coordh);
        vec2 coord2 = vec2(coordw2, coordh2);
        
        // get sample depth:
        float sampleDepth = readDepth(coord);
        
        
        float normalAtt = 1.0;
        
        // range check & accumulate:
        
        float rangeCheck =  abs(depth - sampleDepth) < 0.2 ? normalAtt : 0.0;
        
        if (depth >= sampleDepth)
        {
            vec4 sampleColor = texture2D(uMapKd, coord);
            vec3 incCol = 1.0 - sampleColor.xyz*0.5;
            return incCol.xyz * rangeCheck;
        }
    }
    
    return vec3(0);
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
    
    vec3 random = vec3(random(vTexCoordinate), random(vTexCoordinate*32.43), random(vTexCoordinate*45.6));
	
	
	
	float occlusion = 0.0;
	vec3 occlusionC = vec3(0);
    for (float i = 0.0; i < numSamples; ++i) 
    {
        occlusionC += calAO(tfdDepthValue, vec2(pw, ph));
        occlusionC += calAO(tfdDepthValue, vec2(pw, -ph));
        occlusionC += calAO(tfdDepthValue, vec2(-pw, ph));
        occlusionC += calAO(tfdDepthValue, vec2(-pw, -ph));
            
        occlusionC += calAO(tfdDepthValue, vec2(pw*1.2, ph));
        occlusionC += calAO(tfdDepthValue, vec2(-pw*1.2, ph));
        occlusionC += calAO(tfdDepthValue, vec2(0, ph*1.2));
        occlusionC += calAO(tfdDepthValue, vec2(0, -ph*1.2));
            
        //sample jittering:
        pw += random.x*0.0007;
        ph += random.y*0.0007;
        
        //increase sampling area:
        pw *= 1.7;  
        ph *= 1.7;    
    }
    
    vec3 ovFactor = 1.0 - (occlusionC/(numSamples*8.0));
    
    gl_FragColor = vec4(tv3Color*ovFactor, 1);
    // gl_FragColor = vec4(vec3(oFactor), 1);
    // gl_FragColor = vec4(ovFactor, 1);
} 



