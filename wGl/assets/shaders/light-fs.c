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
uniform sampler2D uMapNormal;
uniform sampler2D uMapPosition;
uniform sampler2D uMapShadow;
uniform sampler2D uMapPing;

uniform vec3 uLightPosition0;

// todo: should this be turned into a uniform variable?
float uKsExponent = 100.0;

vec4 calcLight(vec3 normal, vec3 position, vec3 lightPosition, vec3 lightColor, float shadowFactor)
{
    highp vec3 lightDirection = normalize(lightPosition - position); 

    highp float diffuseFactor = max(0.0, dot(normal, lightDirection)); 
    
    diffuseFactor *= shadowFactor;
    
    vec3 E = normalize(-position.xyz);
    vec3 R = reflect(-lightDirection, normal);
    float specular =  max(dot(R, E), 0.0);

    float specularFactor = pow(specular, uKsExponent);

    return vec4(lightColor * max(0.0,diffuseFactor), specularFactor * shadowFactor);
}


void main(void)
{
    vec4 tv4Normal   = texture2D(uMapNormal,   vTexCoordinate);
    highp vec4 tv4Position = texture2D(uMapPosition, vTexCoordinate);
	
	vec4 shadowMap   = texture2D( uMapShadow,    vTexCoordinate);
	
	
    vec4 tv4Ping   = texture2D(uMapPing,   vTexCoordinate);
	
	
	

	
	
    vec3 lightColor = vec3( 1, 1, 1 );

    vec4 lightRes = calcLight( normalize(tv4Normal.xyz), 
                               tv4Position.xyz, 
                               uLightPosition0, 
                               lightColor,
                               shadowMap.x );
        
    
	
	gl_FragColor = (lightRes) + tv4Ping;
    
    
} 



