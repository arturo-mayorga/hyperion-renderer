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

#ifdef HAS_OES_DERIVATIVES
uniform vec2 uMapNormalScale;
uniform float uNormalEmphasis;
uniform sampler2D uMapNormal;
#endif

varying highp vec4 vNormal;
varying highp vec4 vpPosition;

#ifdef HAS_OES_DERIVATIVES
varying highp vec4 vPosition;
varying vec2 vKdMapCoord; 

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
#ifdef HAS_OES_DERIVATIVES
    highp vec3 materialBump = mix( vec3(0.5, 0.5, 1.0),
	                               texture2D( uMapNormal, 
									          vec2(vKdMapCoord.s / uMapNormalScale.s, 
											       vKdMapCoord.t / uMapNormalScale.t)).xyz, 
								   uNormalEmphasis);
	
	materialBump = normalize (materialBump*2.0 - 1.0);
    
    highp vec3 normal = perturb_normal( normalize(vNormal.xyz), 
                                        vPosition.xyz, 
                                        materialBump, 
                                        vec2(vKdMapCoord.s / uMapNormalScale.s,
                                             vKdMapCoord.t / uMapNormalScale.t) );
    
    gl_FragColor = vec4(normal, vpPosition.z/vpPosition.w);
    //gl_FragColor = vec4(materialBump, vpPosition.z/vpPosition.w);
    //gl_FragColor = vec4(normal.x*0.5 + 0.5, normal.y*0.5 + 0.5, normal.z*0.5 + 0.5, 1);
#else
    gl_FragColor = vec4(vNormal.xyz, vpPosition.z/vpPosition.w);
#endif
    
    
    
    
}





