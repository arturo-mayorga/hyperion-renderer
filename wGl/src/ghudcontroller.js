/**
 * @interface
 */
function GHudWidget() {}
GHudWidget.prototype.draw = function( mat ) {};
GHudWidget.prototype.bindToContext = function( gl ) {};

/**
 * @interface
 * @extends {GHudWidget}
 */
function GHudGroup() {} 


/**
 * @constructor
 */
function GHudController()
{
	this.gl = undefined;
	this.children = [];
	this.transform = mat3.create();
}



	
GHudController.prototype.bindToContext = function(gl_)
{
    this.gl = gl_;
    var gl = this.gl;
    
    camera.bindToContext(gl);
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].bindToContext(gl);
    }
}

GHudController.prototype.draw = function()
{
    var childCount = this.children.length;
    for (var i = 0; i < childCount; ++i)
    {
        this.children[i].draw(this.transform);
    }
}

GHudController.prototype.addChild = function(child)
{
    child.bindToContext(gl);
    this.children.push(child);
}


