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

precision highp float;

varying vec2 vTexCoordinate;
uniform sampler2D uMapPosition;
uniform sampler2D uMapShadow;
uniform sampler2D uMapPing;

uniform mat4 uShadowMatrix;

void main(void)
{
 
    vec4 tv4Position = texture2D(uMapPosition, vTexCoordinate);
    
    
    vec4 shadowProj =  uShadowMatrix * vec4(tv4Position.xyz, 1.0);
    
    shadowProj /= shadowProj.w;
	
	
	
	if ( abs(shadowProj.x) < 1.0 && abs(shadowProj.y) < 1.0 && abs(shadowProj.z) < 1.0 )
	{
        vec2 shadowSample = vec2( (shadowProj.x+1.0)/2.0, (shadowProj.y+1.0)/2.0 );
        float shadowVal = 0.0;
        float count = 0.0;
        //float x, y;
        
        vec4 lightMask = texture2D( uMapPing, shadowSample );
        
        for (float y = -1.5; y <= 1.5; y += 1.0)
        {
            for (float x = -1.5; x <= 1.5; x += 1.0)
            {
                vec4 t4Shadow    = texture2D(uMapShadow, 
                                             vec2( shadowSample.x + x/1024.0, 
                                                   shadowSample.y + y/1024.0) ); // assuming a 1024 by 1024 shadow map
                
                if ( t4Shadow.x - shadowProj.z > -0.0000 )
                {
                    shadowVal += 1.0; 
                } 
                else
                {
                    float variance = t4Shadow.y - (t4Shadow.x*t4Shadow.x);
                    variance = max(variance,0.00000002);
                    
                    float d = shadowProj.z - t4Shadow.x;
                    float p_max = variance / (variance + d*d);
                
                    shadowVal += p_max;
                } 
                
                count += 1.0;
            }
        }
        
        shadowVal = shadowVal/count;
        
        gl_FragColor = vec4(shadowVal) * lightMask;
    }
    else
    { 
        gl_FragColor = vec4(0.0);
    }
} 



