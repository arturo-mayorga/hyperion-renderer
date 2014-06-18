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

precision lowp float;

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
	
	vec4 t4Shadow    = texture2D(uMapShadow, vec2( (shadowProj.x+1.0)/2.0, (shadowProj.y+1.0)/2.0));
	
	if ( abs(shadowProj.x) < 1.0 && abs(shadowProj.y) < 1.0 && abs(shadowProj.z) < 1.0 )
	{
	    
	   if ( t4Shadow.x - shadowProj.z > -0.00008 )
        {
            gl_FragColor = vec4(1);// + pingColor;
        } 
        else
        {
            gl_FragColor = vec4(0.0);//pingColor;
        } 
    }
    else
    {
        vec4 pingColor   = texture2D( uMapPing,    vTexCoordinate);
        gl_FragColor = pingColor;
    }
} 



