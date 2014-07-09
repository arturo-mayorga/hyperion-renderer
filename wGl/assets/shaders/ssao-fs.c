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

precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapKd;
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapRandom;

const float numSamples = 4.0;

float pw = 1.0/1024.0*0.5; 
float ph = 1.0/1024.0*0.5;




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
            return incCol.xyz * temp;
        }
    }
    
    return vec3(0);
}


void main(void)
{
    vec3 tv3Normal   = texture2D(uMapNormal,   vTexCoordinate).xyz;
    vec3 tv3Position = texture2D(uMapPosition, vTexCoordinate).xyz;
	vec3 tv3Color    = texture2D(uMapKd,       vTexCoordinate).xyz;
	vec3 random = texture2D(uMapRandom, vTexCoordinate).xyz;

	float tfdDepthValue = readDepth(vTexCoordinate);  
	
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
        //pw *= 1.7;  
        //ph *= 1.7;
        
        pw *= 3.5;  
        ph *= 3.5;
    }
    
    vec3 ovFactor = 1.0-(occlusionC/(numSamples*8.0));
    
    //gl_FragColor = vec4(tv3Color*ovFactor, 1);
    // gl_FragColor = vec4(vec3(oFactor), 1);
    gl_FragColor = vec4(ovFactor, 1);
    //gl_FragColor = vec4(random_, 1);
} 



