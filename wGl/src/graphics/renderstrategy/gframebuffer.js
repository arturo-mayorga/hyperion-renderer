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
 * @param {Object}
 */
function GFrameBuffer( config )
{
    /** @type {WebGLRenderingContext} */ var gl = config.gl;
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, config.width, config.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    
    this.textures = {};  // webGL texture handlers
    this.gTextures = []; // GTexture handlers for cashing 
    this.fBuffer = framebuffer;
    this.rBuffer = renderbuffer;
    this.cfg = config;
}

/**
 * Helper function to create a 2d texture
 * @param {number} Filter to use for the new texture
 * @param {number} Format to use for the new texture
 * @param {number} Datatype for the new texture
 */
GFrameBuffer.prototype.create2dTexture = function ( filter, format, type )
{
    var gl = this.cfg.gl;
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, this.cfg.width, this.cfg.height, 0, format, type, null);
    
    return texture;
};

/**
 * Add a texture to this frame buffer
 * @param {Object} configuration object for the new texture
 */
GFrameBuffer.prototype.addBufferTexture = function ( cfg )
{ 
    var gl = this.cfg.gl;
    var texture = this.create2dTexture(cfg.filter, cfg.format, cfg.type);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, cfg.attachment, gl.TEXTURE_2D, texture, 0);
    this.textures[cfg.name] = texture;
    
    if ( undefined != this.cfg.extensions &&
         undefined != this.cfg.extensions.WEBGL_draw_buffers &&
         // The closure compiler has problems accessing members of extensions unless they are called like this
         cfg.attachment >= this.cfg.extensions.WEBGL_draw_buffers['COLOR_ATTACHMENT0_WEBGL'] &&
         cfg.attachment <= this.cfg.extensions.WEBGL_draw_buffers['COLOR_ATTACHMENT15_WEBGL'] )
    {
        if ( undefined === this.WEBGL_draw_buffers_drawBuffersList )
        {
            this.WEBGL_draw_buffers_drawBuffersList = [];
        }
        
        this.WEBGL_draw_buffers_drawBuffersList.push(cfg.attachment);
    }
};

/**
 * Complete the creation of this frame buffer and make it ready for use
 */
GFrameBuffer.prototype.complete = function ()
{
    var gl = this.cfg.gl;
    
    if ( undefined != this.WEBGL_draw_buffers_drawBuffersList )
    {
        // The closure compiler has problems accessing members of extensions unless they are called like this
        this.cfg.extensions.WEBGL_draw_buffers['drawBuffersWEBGL'](this.WEBGL_draw_buffers_drawBuffersList);
    }
    
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    {
        console.debug("incomplete famebuffer");
    }
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Bind the current frame buffer for rendering
 */
GFrameBuffer.prototype.bindBuffer = function ()
{
    var gl = this.cfg.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fBuffer);
    gl.viewport(0, 0, this.cfg.width, this.cfg.height);
};

/**
 * Release the current buffer
 */
GFrameBuffer.prototype.unbindBuffer = function ()
{
    var gl = this.cfg.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * Low level texture binding for textures in this frame buffer
 * @param {number} Texture unit to bind to
 * @param {string} Name of the texture that we want to bind
 */
GFrameBuffer.prototype.bindTexture = function ( texture, name )
{
    var gl = this.cfg.gl;
    gl.activeTexture(texture);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[name]);
};

/**
 * Get the GTexture object for the requested texture in this frame buffer
 * The texture is created at the time of the first request
 * @param {string=} name of the texture being requested
 * @return {GTexture}
 */
GFrameBuffer.prototype.getGTexture = function ( name )
{
    var _name = (undefined === name)?"color":name;
    var ret = this.gTextures[_name];
    
    if ( undefined === ret )
    {
        var textureHandle = this.textures[_name];
        
        if ( undefined != textureHandle )
        {
            var gTexture = new GTexture();
            gTexture.bindToContext( this.cfg.gl );
            gTexture.setTextureHandle( textureHandle );
            ret = gTexture;
            this.gTextures[_name] = ret;
        }
    }
    
    return ret;
};

/**
 * Used to sample the color texture of the frame buffer
 * @param {number} x coordinate for sampling
 * @param {number} y coordinate for sampling
 * @param {Array<number>} out argument with the returned value
 */
GFrameBuffer.prototype.getColorValueAt = function( x, y, outArg )
{
    this.bindBuffer();
    var gl = this.cfg.gl;
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, outArg);
};

/**
 * Called to delete all the resources under this buffer
 */
GFrameBuffer.prototype.deleteResources = function()
{
    var gl = this.cfg.gl;
    
    gl.deleteFramebuffer( this.fBuffer );
    gl.deleteRenderbuffer( this.rBuffer );
    
    for ( var key in this.textures )
    {
        gl.deleteTexture( this.textures[key] );
    }
};

