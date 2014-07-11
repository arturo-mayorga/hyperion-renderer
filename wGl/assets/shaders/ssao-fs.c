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

// based on [http://graphics.cs.williams.edu/papers/SAOHPG12/]
#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapPosition;
uniform sampler2D uMapRandom;

#define NUM_SAMPLES           4
#define NUM_SPIRAL_TURNS      7
#define VARIATION             1
#define PI 3.1415926535897932384626433832795

const float uSampleRadiusWS = 4.0;

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
    const float epsilon = 0.08;
    
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
    vec3 tv3Position = texture2D(uMapPosition, vTexCoordinate).xyz;
    vec3 random = texture2D(uMapRandom, vTexCoordinate).xyz; 
    vec3 tv3Normal = reconstructNormalVS(tv3Position); 
    
    float randomPatternRotationAngle = 2.0 * PI * random.x * random.y * random.z;
    
    float occlusion = 0.0;
    float projScale = 40.0;//1.0 / (2.0 * tan(uFOV * 0.5));
    float radiusWS = uSampleRadiusWS;
    float radiusSS = projScale * radiusWS / tv3Position.z;
    
    for (int i = 0; i < NUM_SAMPLES; ++i) 
    {
        occlusion += sampleAO(vTexCoordinate, tv3Position, tv3Normal, radiusSS, i, randomPatternRotationAngle);
    }
    
    vec3 ovFactor = (vec3(1.0/occlusion)/float(NUM_SAMPLES));
    gl_FragColor = vec4(ovFactor, 1);
} 



