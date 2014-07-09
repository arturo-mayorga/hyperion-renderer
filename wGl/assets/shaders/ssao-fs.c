// Copyright (C) 2014 Arturo Mayorga
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
// SOFTWARE.

#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapRandom;

const float numSamples = 4.0;

float pw = 1.0/1024.0*0.5; 
float ph = 1.0/1024.0*0.5;


#define NUM_SAMPLES           4.0
#define NUM_SAMPLES_i           4
#define NUM_SPIRAL_TURNS      7
#define VARIATION             1
#define PI 3.1415926535897932384626433832795
#define INVERSE_PI 1.0/3.1415926535897932384626433832795

 const float uSampleRadiusWS = 10.0;

float readDepth(in vec2 coord)  
{  
    if (coord.x<0.0||coord.y<0.0) return 1.0;
    
    float posZ = texture2D(uMapPosition, coord).z;  
    return posZ;
    
   /* vec4 RGBDepth = texture2D(uMapRGBDepth, coord);
    float posZ = RGBDepth.x*100.0+ RGBDepth.y*100.0;
    float nearZ = 0.1;  
    float farZ = 100.0;  
    return (2.0 * nearZ) / (nearZ + farZ - posZ * (farZ - nearZ)); */ 
      
} 

float compareDepths(in float depth1, in float depth2,inout int far)  
{  
    float diff = (depth1 - depth2)*100.0; //depth difference (0-100)
    float gdisplace = 0.2; //gauss bell center
    float garea = 10.0; //gauss bell width 2
    
    //reduce left bell width to avoid self-shadowing
    if (diff<gdisplace)
    { 
        garea = 0.1;
    }
    else
    {
        far = 1;
    }
    float gauss = pow(2.7182,-2.0*(diff-gdisplace)*(diff-gdisplace)/(garea*garea));
    
    return gauss;
    
    /*float rangeCheck =  abs(depth1 - depth2) < 0.2 ? 1.0 : 0.0;
     return (depth1 > depth2 ? 1.0 : 0.0) * rangeCheck;*/
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
        int far = 0;
        
        // get sample depth:
        float sampleDepth = readDepth(coord);
        
        temp = compareDepths(depth, sampleDepth,far);
        
        if (far > 0)
        {
            temp2 = compareDepths(readDepth(coord2),depth,far);
            temp += (1.0-temp)*temp2; 
        }
        
        
        float normalAtt = 1.0;
        
        // range check & accumulate:  
        if (temp > 0.0)
        {
            vec4 sampleColor = texture2D(uMapKd, coord);
            vec3 incCol = 1.0 - sampleColor.xyz*0.25;
            return vec3( temp);
        }
    }
    
    return vec3(0);
}

vec3 getOffsetPositionVS(vec2 uv, vec2 unitOffset, float radiusSS) 
{
  uv = uv + radiusSS * unitOffset * (1.0 / vec2(1280.0,720.0));
   
  return texture2D(uMapPosition, uv).xyz;
}

// returns a unit vector and a screen-space radius for the tap on a unit disk
// (the caller should scale by the actual disk radius)
vec2 tapLocation(int sampleNumber, float spinAngle, out float radiusSS) 
{
  // radius relative to radiusSS
  float alpha = (float(sampleNumber) + 0.5) * (1.0 / float(NUM_SAMPLES));
  float angle = alpha * (float(NUM_SPIRAL_TURNS) * 6.28) + spinAngle;
   
  radiusSS = alpha;
  return vec2(cos(angle), sin(angle));
}

float sampleAO(vec2 uv, vec3 positionVS, vec3 normalVS, float sampleRadiusSS,
               int tapIndex, float rotationAngle)
{
  const float epsilon = 0.9;
 
  const float uBias = 0.0;
  float radius2 = uSampleRadiusWS * uSampleRadiusWS;
  
  
   
  // offset on the unit disk, spun for this pixel
  float radiusSS;
  vec2 unitOffset = tapLocation(tapIndex, rotationAngle, radiusSS);
  radiusSS *= sampleRadiusSS;
   
  vec3 Q = getOffsetPositionVS(uv, unitOffset, radiusSS);
  vec3 v = Q - positionVS;
   
  float vv = dot(v, v);
  float vn = dot(v, normalVS) - uBias;
  
  //gl_FragColor = vec4(vec3(float(vv < radius2) * max(vn / (epsilon + vv), 0.0)), 1.0);
   
#if VARIATION == 0
   
  // (from the HPG12 paper)
  // Note large epsilon to avoid overdarkening within cracks
  return float(vv < radius2) * max(vn / (epsilon + vv), 0.0);
   
#elif VARIATION == 1 // default / recommended
   
  // Smoother transition to zero (lowers contrast, smoothing out corners). [Recommended]
  float f = max(radius2 - vv, 0.0) / radius2;
  return f * f * f * max(vn / (epsilon + vv), 0.0);
   
#elif VARIATION == 2
   
  // Medium contrast (which looks better at high radii), no division.  Note that the
  // contribution still falls off with radius^2, but we've adjusted the rate in a way that is
  // more computationally efficient and happens to be aesthetically pleasing.
  float invRadius2 = 1.0 / radius2;
  return 4.0 * max(1.0 - vv * invRadius2, 0.0) * max(vn, 0.0);
   
#else
   
  // Low contrast, no division operation
  return 2.0 * float(vv < radius2) * max(vn, 0.0);
   
#endif
}

vec3 reconstructNormalVS(vec3 positionVS) 
{
  return normalize(cross(dFdx(positionVS), dFdy(positionVS)));
}


void main(void)
{
    vec3 tv3Normal   = texture2D(uMapNormal,   vTexCoordinate).xyz;
    vec3 tv3Position = texture2D(uMapPosition, vTexCoordinate).xyz;
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;
	vec3 random = texture2D(uMapRandom, vTexCoordinate).xyz;

	float tfdDepthValue = readDepth(vTexCoordinate);  
	
	tv3Normal = reconstructNormalVS(tv3Position);
	////
   
  float randomPatternRotationAngle = 2.0 * PI * random.x * random.y;
   
  float radiusSS  = 0.0; // radius of influence in screen space
  float radiusWS  = 0.0; // radius of influence in world space
  float occlusion = 0.0;
   
  // TODO (travis): don't hardcode projScale
  float projScale = 40.0;//1.0 / (2.0 * tan(uFOV * 0.5));
  radiusWS = uSampleRadiusWS;
  radiusSS = projScale * radiusWS / tv3Position.z;
   
  
  ////
	
	/*vec3 occlusionC = vec3(0);
    for (float i = 0.0; i < NUM_SAMPLES; ++i) 
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
        //pw *= 1.7;  
        //ph *= 1.7;
        
        pw *= 3.5;  
        ph *= 3.5;
    }*/
    
    vec3 ovFactor;// = (occlusionC/(NUM_SAMPLES*8.0));
    
    //gl_FragColor = vec4(tv3Color*ovFactor, 1);
     //gl_FragColor = vec4(vec3(oFactor), 1);
    gl_FragColor = vec4(ovFactor, 1);
    //gl_FragColor = vec4(random_, 1);
    
    for (int i = 0; i < NUM_SAMPLES_i; ++i) {
    occlusion += sampleAO(vTexCoordinate, tv3Position, tv3Normal, radiusSS, i,
                          randomPatternRotationAngle);
    }
    
    ovFactor = (vec3(1.0/occlusion)/(NUM_SAMPLES));
    gl_FragColor = vec4(ovFactor, 1);
} 



