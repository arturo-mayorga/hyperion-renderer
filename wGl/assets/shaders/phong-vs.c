//	
// The MIT License
// 
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

varying vec2 vKdMapCoord;

varying mediump vec4 vNormal;
varying highp vec4 vPosition;

// todo: this should be a uniform passed in by the scene object
varying highp vec4 lightPosition;

void main(void) 
{
	vNormal = uNMatrix * vec4(aNormalVertex, 1.0);
	vPosition = uMVMatrix * vec4(aPositionVertex, 1.0);
	gl_Position = uPMatrix * vPosition;
	lightPosition = uMVMatrix * vec4(0, 5, 0, 1.0);	
	vKdMapCoord = aTextureVertex;
}

