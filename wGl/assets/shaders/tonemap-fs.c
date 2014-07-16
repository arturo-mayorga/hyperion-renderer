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


uniform sampler2D uMapKd;
uniform sampler2D uMapLight;
uniform sampler2D uMapShadow;
varying vec2 vTexCoordinate;

void main(void)
{
    float toneFactor = 1.0/2.0;///2.0;
    
    vec4 mapC = texture2D(uMapKd, vTexCoordinate);
    vec4 light= texture2D(uMapLight, vTexCoordinate);
    vec4 shad = texture2D(uMapShadow, vTexCoordinate);
    
    vec4 ambient = mapC * shad * 0.2;
    
    light *= toneFactor * shad;
    
   gl_FragColor = mapC * light + light * (light.w - 1.0)*mapC.w + ambient; 
} 



