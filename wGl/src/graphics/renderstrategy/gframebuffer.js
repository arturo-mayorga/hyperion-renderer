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
    
    console.debug(cfg.name);
    console.debug(cfg.attachment);
    
      if ( undefined != this.cfg.extensions &&
           undefined != this.cfg.extensions.WEBGL_draw_buffers &&
           // The closure compiler has problems accessing members of extensions unless they are called like this
           cfg.attachment >= this.cfg.extensions.WEBGL_draw_buffers['COLOR_ATTACHMENT0_WEBGL'] &&
           cfg.attachment <= this.cfg.extensions.WEBGL_draw_buffers['COLOR_ATTACHMENT15_WEBGL'] )
      {
          console.debug("adding to drawBuffersList");
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

GFrameBuffer.prototype.bindTexture = function (id, name)
{
    var gl = this.cfg.gl;
    gl.activeTexture(id);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[name]);
};



