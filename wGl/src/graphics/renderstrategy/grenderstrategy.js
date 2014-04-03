/**
 * @interface
 */
function GRenderStrategy()
{
}

/**
 * @param {GScene} scene Scene object that needs to be drawn
 * @param (GHudController} hud Hud controller that needs to be drawn
 */
GRenderStrategy.prototype.draw = function ( scene, hud ) {};

/**
 * @constructor
 */
function GRenderStrategyFactory(gl, smap)
{
    this.gl = gl;
    this.smap = smap;
    this.strategyMap = 
    {
        "simplePhong": function(gl, smap) { return new GRenderPhongStrategy( gl, smap ); }
    };
    
}

/**
 * @returns {GRenderStrategy}
 */
GRenderStrategyFactory.prototype.createByName = function ( name )
{
    var createFn = this.strategyMap[name];
    if ( undefined != createFn )
    {
        return createFn(this.gl, this.smap);
    }
    
    return null;
};

/**
 * @returns {GRenderStrategy}
 */
GRenderStrategyFactory.prototype.creteBestFit = function ()
{
    return this.createByName( "simplePhong" );
};



