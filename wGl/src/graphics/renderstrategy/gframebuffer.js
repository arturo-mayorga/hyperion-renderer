/**
 * @constructor
 */
function GFrameBuffer( config )
{
    var gl = config.gl;
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, config.width, config.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    
    this.textures = {};
    this.fBuffer = framebuffer;
    this.rBuffer = renderbuffer;
    this.cfg = config;
}

GFrameBuffer.prototype.create2dTexture = function (filter, format, type)
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
        if ( undefined == this.WEBGL_draw_buffers_drawBuffersList )
        {
            this.WEBGL_draw_buffers_drawBuffersList = [];
        }
        
        this.WEBGL_draw_buffers_drawBuffersList.push(cfg.attachment);
    }
};

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

GFrameBuffer.prototype.bindBuffer = function ()
{
    var gl = this.cfg.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fBuffer);
    gl.viewport(0, 0, this.cfg.width, this.cfg.height);
};

GFrameBuffer.prototype.unbindBuffer = function ()
{
    var gl = this.cfg.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

GFrameBuffer.prototype.bindTexture = function ( id, name )
{
    var gl = this.cfg.gl;
    gl.activeTexture(id);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[name]);
};

GFrameBuffer.prototype.createGTexture = function ( name )
{
    var textureHandle = this.textures[name];
    
    if ( undefined == textureHandle )
    {
        var gTexture = new GTexture();
        gTexture.bindToContext( this.gl );
        gTexture.setTextureHandle( textureHandle );
        return gTexture;
    }
    
    return undefined;
};


/** 
 * @constructor
 */
function GRenderPassCmd()
{
    this.hMatrix = mat3.create();
}

GRenderPassCmd.prototype.checkValid = function()
{
    if ( undefined == this.shaderProgram ||
         undefined == this.frameBuffer ||
         undefined == this.gl )
    {
        return false;
    }
    
    return true;
};

GRenderPassCmd.prototype.bindToContext = function ( gl )
{
    this.gl = gl;
};

GRenderPassCmd.prototype.setProgram = function( program )
{
    this.shaderProgram = program;
};

GRenderPassCmd.prototype.setFrameBuffer = function( frameBuffer )
{
    this.frameBuffer = frameBuffer;
};

GRenderPassCmd.prototype.setScreenGeometry = function( screenG )
{
    this.screen = screenG;
};

GRenderPassCmd.prototype.setHRec = function( x, y, w, h )
{
    this.hRec = { x:x, y:y, w:w, h:h };
};
 
GRenderPassCmd.prototype.run = function( scene )
{
    this.shaderProgram.activate();
    this.frameBuffer.bindBuffer();
    
    this.drawGeometry( scene );
    
    this.bindTextures();
    this.drawScreenBuffer(this.shaderProgram);
    
    this.frameBuffer.unbindBuffer();
    this.shaderProgram.deactivate();
};

GRenderPassCmd.prototype.bindTextures = function()
{
    if ( undefined == this.textureList ) return;
    
    var texCount = this.textureList.length;
    
    for (var i = 0; i < texCount; ++i)
    {
        this.textureList[i].gTexture.draw(this.textureList[i].glTextureTarget, null, null);
    }
};

GRenderPassCmd.prototype.drawScreenBuffer = function(shader)
{
    if ( undefined == this.hRec ||
         undefined == this.screen )
    {
        return;
    }
    
    var gl = this.gl;
    
    mat3.identity(this.hMatrix);
	mat3.translate(this.hMatrix, this.hMatrix, [hRec.x, hRec.y]);
	mat3.scale(this.hMatrix,this.hMatrix, [hRec.w, hRec.h]); 
    
    if ( null != shader.uniforms.mapKd)
    {
        gl.uniform1i(shader.uniforms.mapKd, 0);
    }
    
    if ( null != shader.uniforms.mapRGBDepth )
    {
        gl.uniform1i(shader.uniforms.mapRGBDepth, 1);
    }
 
    if ( null != shader.uniforms.mapNormal )
    {
        gl.uniform1i(shader.uniforms.mapNormal, 2);
    }
  
    if ( null != shader.uniforms.mapPosition )
    {
        gl.uniform1i(shader.uniforms.mapPosition, 3);
    }
    
    if ( null != shader.uniforms.Kd )
    {
        gl.uniform4fv(shader.uniforms.Kd, [1, 1, 1, 1]);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screen.vertBuffer);
    gl.vertexAttribPointer(shader.attributes.positionVertexAttribute, 
                           this.screen.vertBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screen.textBuffer);
    gl.vertexAttribPointer(shader.attributes.textureVertexAttribute, 
                           this.screen.textBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.screen.indxBuffer);
	
	if ( null != shader.uniforms.hMatrixUniform )
    {
        gl.uniformMatrix3fv(shader.uniforms.hMatrixUniform, false, this.hMatrix);
    }
	
    gl.drawElements(gl.TRIANGLES, this.screen.indxBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

GRenderPassCmd.prototype.addInputTexture = function( gTexture, glTextureTarget )
{
    if ( undefined == this.textureList )
    {
        this.textureList = [];
    }
    
    this.textureList.push( {gTexture:gTexture, glTextureTarget:glTextureTarget} );
};

GRenderPassCmd.prototype.drawGeometry = function( scene )
{
    if ( undefined == scene ) return;
    
    var gl = this.gl;
    
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
    scene.draw(this.shaderProgram);
};

GRenderPassCmd.prototype.drawFullScreen = function()
{
    this.setHRec(0, 0, 1, 1);
    this.drawScreenBuffer(this.shaderProgram);
};


