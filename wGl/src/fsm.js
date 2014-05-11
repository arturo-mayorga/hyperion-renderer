/**
 * @interface
 */
function FsmSignalObserver() {}
FsmSignalObserver.prototype.onFsmSignal = function(signal) {};

/**
 * @interface
 */
function FsmState() 
{
}
FsmState.prototype.update = function (time) {};
FsmState.prototype.enter = function () {};
FsmState.prototype.exit = function () {};

/**
 * Set the signal observer
 * @param {FsmSignalObserver} observer The new observer to be used
 */
FsmState.prototype.setSignalObserver = function (observer) 
{
    this.observer = observer;
};

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
FsmState.prototype.fireSignal = function (signal) 
{
    if (this.observer != undefined)
	{
	    this.observer.onFsmSignal(signal);
	}
};

/**
 * @constructor
 * @param {FsmState}
 */
function FsmStateTransitions(state)
{
	this.state = state;
	this.transitions = {};
}

/**
 * Add the target for the given transition
 * @param {string} signalName
 * @param {string} targetStateName
 */
FsmStateTransitions.prototype.addSignalTarget = function(signalName, targetStateName)
{
	this.transitions[signalName] = targetStateName;
}

/**
 * @constructor
 * @implements {FsmSignalObserver}
 * @implements {FsmState}
 */
function FsmMachine()
{
	this.nameStateMap = {};
	this.currentStateName = "";
	this.signalQueue = [];
}

/**
 * Add a named state
 * @param {string] name
 * @param {FsmMachine} state
 */
FsmMachine.prototype.addState = function ( name, state ) 
{
	state.setSignalObserver(this);
	var transitions = new FsmStateTransitions(state);
	this.nameStateMap[name] = transitions;
};

/**
 * Add a transition from start-state to end-state
 * @param {string} startStateName
 * @param {string} signalName
 * @param {string} endStateName
 */
FsmMachine.prototype.addTransition = function ( startStateName, signalName, endStateName ) 
{
	this.nameStateMap[startStateName].addSignalTarget(signalName, endStateName);
};

/**
 * Handle an FSM signal
 * @param {string} signal Name of the signal that was fired
 */
FsmMachine.prototype.onFsmSignal = function( signal ) 
{
	this.signalQueue.push( signal );
};

/**
 * @param {string} stateName Name of the new state to transition to
 */
FsmMachine.prototype.setState = function ( stateNam )
{
	if (this.currentStateName != "")
	{
		this.nameStateMap[this.currentStateName].state.exit();
	}
	
	this.currentStateName = stateName;
	
	this.nameStateMap[this.currentStateName].state.enter();
}

/**
 * Update the state machine
 * @param {number} Number of milliseconds sine the last update
 */
FsmMachine.prototype.update = function (time) 
{
	if (this.currentStateName == "") return;
	// update the current state
	var currentStateTransitions = this.nameStateMap[this.currentStateName];
	currentStateTransitions.state.update(time);
	
	// find the first transitioning signal if any
	var nextStateName = undefined;
	for (var i = 0; i < this.signalQueue.length; ++i)
	{
		var possibleTransitionTarget = 
			currentStateTransitions.transitions[this.signalQueue[i]];
		if (possibleTransitionTarget != undefined)
		{
			nextStateName = possibleTransitionTarget;
		}
	}
	
	this.signalQueue = [];
	
	// in the case of a transition
	//     Exit the current state
	//     Enter the new state
	//     update the current state name
	if ( nextStateName != undefined )
	{
		currentStateTransitions.state.exit();
		this.nameStateMap[nextStateName].state.enter();
		this.currentStateName = nextStateName;
	}
};
FsmMachine.prototype.enter = function () {};
FsmMachine.prototype.exit = function () {};
