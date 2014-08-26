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

/**
 * @constructor
 * @param {WebGLRenderingContext}
 */
function GRenderStrategyFactory( gl )
{
    this.gl = gl;
    this.strategyMap = 
    {
        "simplePhong": function(gl) { return new GRenderPhongStrategy( gl ).setName( "simplePhong" ); },
        "deferredPhong": function(gl) { return new GRenderDeferredStrategy( gl ).setName( "deferredPhong" ); }
    };
    
    this.renderLevelSequence =
    [
        "simplePhong",
        "deferredPhong"
    ];
}

/** 
 * Create a render strategy at the next render level
 * @return {GRenderStrategy|null}
 */
GRenderStrategyFactory.prototype.createNextRenderLevel = function ( currentName )
{
    var newIdx = -1;
    var currentIdx = this.renderLevelSequence.indexOf( currentName );
    if ( currentIdx > -1 &&
         currentIdx+1 < this.renderLevelSequence.length )
    {
        newIdx = currentIdx+1;
    }
    
    if ( -1 === newIdx )
    {
        return null;
    }
    
    return this.createByName( this.renderLevelSequence[newIdx] );
};

/**
 * Create a render strategy at the previous render level
 * @return {GRenderStrategy|null}
 */
GRenderStrategyFactory.prototype.createPreviousRenderLevel = function ( currentName )
{
    var newIdx = -1;
    var currentIdx = this.renderLevelSequence.indexOf( currentName );
    if ( currentIdx > -1 &&
         currentIdx-1 >= 0 )
    {
        newIdx = currentIdx-1;
    }
    
    if ( -1 === newIdx )
    {
        return null;
    }
    
    return this.createByName( this.renderLevelSequence[newIdx] );
};

/**
 * Create a new render strategy using the given name
 * @param {string}
 * @return {GRenderStrategy}
 */
GRenderStrategyFactory.prototype.createByName = function ( name )
{
    var createFn = this.strategyMap[name];
    if ( undefined != createFn )
    {
        return createFn(this.gl);
    }
    
    return null;
};

/**
 * @return {GRenderStrategy}
 */
GRenderStrategyFactory.prototype.creteBestFit = function ()
{ 
   // if ( -1 === navigator.userAgent.toLowerCase().indexOf("android") )
   // {
   //     return this.createByName( "deferredPhong" );
   // } 
    
    return this.createByName( "simplePhong" );
};



