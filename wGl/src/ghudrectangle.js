/**
 * @constructor
 * @implements {HGHudWidget}
 */
function GHudRectangle() 
{
    this.transform = mat3.create();
}

GHudRectangle.prototype.bindToContext = GHudWidget.prototype.bindToContext;
GHudRectangle.prototype.setDrawRec    = GHudWidget.prototype.setDrawRec;

GHudRectangle.prototype.draw = function( mat ) {};


