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

uniform vec4 uKs;

uniform vec4 uKd;
varying vec2 vKdMapCoord;
uniform sampler2D uMapKd;
uniform vec2 uMapKdScale;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;

uniform vec3 uLightPosition0;

void main(void)
{
// todo: should this be turned into a uniform variable?
float uKsExponent = 100.0;

    highp vec3 materialDiffuseColor = mix(texture2D(uMapKd, 
										  vec2(vKdMapCoord.s / uMapKdScale.s, 
											   vKdMapCoord.t / uMapKdScale.t)), 
										  uKd, 
										  uKd.a).xyz;

    highp vec3 lightDirection = normalize(uLightPosition0 - vPosition.xyz); 
    highp vec3 normal = normalize(vNormal.xyz);

    highp float diffuseFactor = max(0.0, dot(normal, lightDirection)); 
    
    vec3 E = normalize(-vPosition.xyz);
    vec3 R = reflect(-lightDirection, normal);
    float specular =  max(dot(R, E), 0.0);

    float specularFactor = pow(specular, uKsExponent);

    highp vec3 color = diffuseFactor * materialDiffuseColor;// + specularFactor * uKs.xyz;

    gl_FragColor = vec4(color, 1); 
	//gl_FragColor = vec4(vNormal.xyz, 1);
	//gl_FragColor = vec4(materialDiffuseColor, 1);
}





