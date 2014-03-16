
/**
 * @return {FsmState}
 * @param {GScene} scene Scene that is driven by the returned state machine
 * @param {GHudController}
 */
function createLesson( scene, hud )
{
	var ret = new FsmMachine();
	
	ret.addState("Load", new LoadState( scene, hud ));
	ret.addState("Explore", new ExploreState( scene, hud ));
	
	ret.addTransition( "Load", "loadComplete", "Explore" );
	ret.setState("Load");
	return ret;
}

/**
 * @constructor
 * @implements {FsmState}
 * @implements {GObjLoaderObserver}
 * @param {GScene} scene Scene that is driven by this state
 * @param {GHudController}
 */
function LoadState( scene, hud ) 
{
    this.scene = scene;
	this.hud = hud;
	this.envLoader = new GObjLoader(this.scene);
	this.envLoader.setObserver(this);
	
	this.penLoader = new GObjLoader(this.scene);
	this.penLoader.setObserver(this);
}

/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
LoadState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
LoadState.prototype.fireSignal = FsmState.prototype.fireSignal;

LoadState.prototype.enter = function () 
{
	this.envLoader.loadObj("assets/3d/office3d/18361-obj-4/", "OfficeOBJ.obj");
	this.penLoader.loadObj("assets/3d/stylus/", "stylus.obj");

	this.ui = {};
	var bg = new GHudRectangle();
	bg.setColor(0, .2, 0, 1);
	this.hud.addChild(bg);
	
	var bg2 = new GHudRectangle();
	bg2.setColor(.1, .2, .1, .9);
	this.hud.addChild(bg2);
	bg2.setDrawRec(0, 0, 1, .7);
	
	var progressBg = new GHudRectangle();
	progressBg.setColor(1, 1, 1, .02);
	progressBg.setDrawRec(0, 0, .7, .05);
	this.hud.addChild(progressBg);
	
	var progressFg = new GHudRectangle();
	progressFg.setColor(1, 1, 1, .3);
	progressFg.setDrawRec(0, 0, 0, .05);
	this.hud.addChild(progressFg);
	
	this.ui.components = [bg, bg2, progressBg, progressFg];
	this.ui.pFg = progressFg;
};

LoadState.prototype.exit = function () 
{
	var len = this.ui.components.length;
	for (var i = 0; i < len; ++i)
	{
		this.hud.removeChild(this.ui.components[i]);
	} 
};

LoadState.prototype.update = function (time) 
{
    this.envLoader.update(time);
	this.penLoader.update(time);
};
 
LoadState.prototype.onObjLoaderCompleted = function ( loader ) 
{
	// wait for 2 loaders
	if (this.loadCount == undefined)
	{
		this.loadCount = 1;
	}
	else
	{
		++this.loadCount;
	}
	
	if (this.loadCount >= 2)
	{
		this.fireSignal("loadComplete");
	}
};

/**
 * @param {number} progress Progress value
 */
LoadState.prototype.onObjLoaderProgress = function ( loader, progress ) 
{
	var tProgress = this.penLoader.totalProgress * this.envLoader.totalProgress;
	this.ui.pFg.setDrawRec( .7*(tProgress-1), 0, tProgress*.7, .05);
};


/**
 * @constructor
 * @implements {FsmState}
 * @param {GScene} scene Scene that is driven by this state
 * @param {GHudController} hud  Hud to be driven by this state
 */
function ExploreState( scene ) 
{
    this.scene = scene;
	this.hud = hud;
}
/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
ExploreState.prototype.setSignalObserver = FsmState.prototype.setSignalObserver;
/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
ExploreState.prototype.fireSignal = FsmState.prototype.fireSignal;

ExploreState.prototype.enter = function () 
{
	console.debug("entering ExploreState");
};
ExploreState.prototype.exit = function () 
{
	console.debug("exiting ExploreState");
};
ExploreState.prototype.update = function (time) 
{
};

