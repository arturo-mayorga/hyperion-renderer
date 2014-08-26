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
#undef HAS_OES_DERIVATIVES

#ifdef HAS_OES_DERIVATIVES
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;

uniform vec4 uKs;

uniform vec4 uKd;
varying vec2 vKdMapCoord;
uniform sampler2D uMapKd;
uniform vec2 uMapKdScale;

#ifdef HAS_OES_DERIVATIVES
uniform vec2 uMapNormalScale;
uniform float uNormalEmphasis;


uniform sampler2D uMapNormal;
#endif

varying mediump vec4 vNormal;
varying mediump vec4 vPosition;

uniform vec3 uLightPosition0;

#ifdef HAS_OES_DERIVATIVES
// from [http://www.thetenthplanet.de/archives/1180]
mat3 cotangent_frame( vec3 N, vec3 p, vec2 uv )
{
    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx( p );
    vec3 dp2 = dFdy( p );
    vec2 duv1 = dFdx( uv );
    vec2 duv2 = dFdy( uv );
 
    // solve the linear system
    vec3 dp2perp = cross( dp2, N );
    vec3 dp1perp = cross( N, dp1 );
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
 
    // construct a scale-invariant frame 
    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
    return mat3( T * invmax, B * invmax, N );
}

vec3 perturb_normal( vec3 N, vec3 V, vec3 Bump, vec2 texcoord )
{
    mat3 TBN = cotangent_frame( N, -V, texcoord );
    
    return normalize( TBN * Bump );
}
#endif

void main(void)
{
// todo: should this be turned into a uniform variable?
float uKsExponent = 100.0;

    mediump vec3 materialDiffuseColor = mix(texture2D(uMapKd, 
                                                    vec2(vKdMapCoord.s / uMapKdScale.s, 
                                                         vKdMapCoord.t / uMapKdScale.t)), 
										  uKd, 
										  uKd.a).xyz;
	
	mediump vec3 lightDirection = normalize(uLightPosition0 - vPosition.xyz);
	
#ifdef HAS_OES_DERIVATIVES	
	mediump vec3 materialBump = mix( vec3(0.5, 0.5, 1.0),
	                               texture2D( uMapNormal, 
									          vec2(vKdMapCoord.s / uMapNormalScale.s, 
											       vKdMapCoord.t / uMapNormalScale.t)).xyz, 
								   uNormalEmphasis);
	
	materialBump = normalize (materialBump*2.0 - 1.0);

     
    mediump vec3 normal = perturb_normal( normalize(vNormal.xyz), 
                                        vPosition.xyz, 
                                        materialBump, 
                                        vec2(vKdMapCoord.s / uMapKdScale.s,
                                             vKdMapCoord.t / uMapKdScale.t) );
#else
    mediump vec3 normal = normalize(vNormal.xyz);
#endif

    mediump float diffuseFactor = max(0.0, dot(normal, lightDirection)); 
    
    vec3 E = normalize(-vPosition.xyz);
    vec3 R = reflect(-lightDirection, normal);
    float specular =  max(dot(R, E), 0.0);

    float specularFactor = pow(specular, uKsExponent);

    mediump vec3 color = diffuseFactor * materialDiffuseColor + specularFactor * uKs.xyz;

    gl_FragColor = vec4(color, 1); 
	//gl_FragColor = vec4(normal.x*0.5 + 0.5, normal.y*0.5 + 0.5, normal.z*0.5 + 0.5, 1);
}





