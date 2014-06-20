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

attribute vec3 aPositionVertex;
attribute vec3 aNormalVertex;
attribute vec2 aTextureVertex;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uNMatrix;

#ifdef ARMATURE_SUPPORT
attribute vec4 aSkinVertex;
uniform mat4 uAMatrix[60]; 
#endif

varying vec2 vKdMapCoord;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;
varying highp vec4 vpPosition;

#ifdef ARMATURE_SUPPORT
void applyArmature()
{
    int i0   = int( aSkinVertex[0] );
    mat4 m0  = uAMatrix[i0*2];
    mat4 n0  = uAMatrix[i0*2 + 1];
    float w0 = aSkinVertex[2];
    
    int i1   = int( aSkinVertex[1] );
    mat4 m1  = uAMatrix[i1*2];
    mat4 n1  = uAMatrix[i1*2 + 1];
    float w1 = aSkinVertex[3];
	
	vec4 position0 = m0 * vPosition;
	vec4 normal0   = n0 * vNormal;
	
	vec4 position1 = m1 * vPosition;
	vec4 normal1   = n1 * vNormal;
    
	vPosition = (position0 * w0) + (position1 * w1);
	vNormal   = (normal0 * w0)   + (normal1 * w1);
}
#endif

void main(void) 
{
    vNormal = vec4(aNormalVertex, 1.0);
	vPosition = vec4(aPositionVertex, 1.0);
	
#ifdef ARMATURE_SUPPORT	
	applyArmature();
#endif
	
	vNormal = uNMatrix * vNormal;
	vPosition = uMVMatrix * vPosition;
	vpPosition = uPMatrix * vPosition;
	gl_Position = vpPosition;
	vKdMapCoord = aTextureVertex;
}

