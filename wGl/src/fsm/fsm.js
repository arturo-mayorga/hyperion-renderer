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
 * @interface
 */
function FsmSignalObserver() {}
FsmSignalObserver.prototype.onFsmSignal = function(signal) {};

/**
 * @interface
 */
function FsmState() 
{
    this.name = "?";
}

FsmState.debugEnable = false;

/**
 * @param {string}
 */
FsmState.debug = function( str )
{
    if ( FsmState.debugEnable )
    {
        console.debug( "[FSM] " + str ); 
    }
};

/**
 * Set state name
 * @param {string} name
 */
FsmState.prototype.setName = function( name )
{
    this.name = name;
};

/**
 * Get state name
 * @return {string}
 */
FsmState.prototype.getName = function()
{
    return this.name;
};

/**
 * Update the state machine
 * @param {number} Number of milliseconds sine the last update
 */
FsmState.prototype.update = function ( time ) {};

/**
 * This function is called each time this state 
 * is entered
 */
FsmState.prototype.enter = function () {};

/**
 * This function is called each time this state
 * is exited
 */
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
 * Return the current observer for the state
 * @return {FsmSignalObserver}
 */
FsmState.prototype.getSignalObserver = function ()
{
    return this.observer;
};

/**
 * Fire the transition signal
 * @param {string} signal Name of the signal to fire
 */
FsmState.prototype.fireSignal = function (signal) 
{   
    FsmState.debug( this.name + "::" + signal + " [fire]" );
    
    if (this.observer != undefined)
	{
	    this.observer.onFsmSignal(signal);
	}
	else
	{
	    FsmState.debug( this.name + "::" + signal + " [lost]" );
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
 * @param {FsmState}
 * @param {function()}
 * @param {function( number )}
 * @param {function()}
 */
 function FsmSubStateWrapper( context, enterFn, updateFn, exitFn )
 {
    this.context = context;
    this.enterFn = enterFn;
    this.updateFn = updateFn;
    this.exitFn = exitFn;
    this.signalQueue = [];
    
 }
 
 FsmSubStateWrapper.prototype = Object.create( FsmState.prototype );
 
 /**
 * Handle an FSM signal. Implementing FsmSignalObserver
 * @param {string} signal Name of the signal that was fired
 */
FsmSubStateWrapper.prototype.onFsmSignal = function( signal ) 
{
	this.signalQueue.push( signal );
};

 /**
 * Update the state machine
 * @param {number} Number of milliseconds sine the last update
 */
FsmSubStateWrapper.prototype.update = function ( time ) 
{
    // make sure that fired signals come from the wrapper context and
    // they propagate back to the observer of this wrapper.
    var oldObserver = this.context.getSignalObserver();
    var oldDebugEnable = FsmState.debugEnable;
    FsmState.debugEnable = false;
    this.context.setSignalObserver( this );
	this.updateFn.call( this.context, time );
	this.context.setSignalObserver( oldObserver );
	FsmState.debugEnable = oldDebugEnable;
	
	while ( this.signalQueue.length > 0 )
	{
	    this.fireSignal( this.signalQueue.shift() );
	}
};

/**
 * This function is called each time this state 
 * is entered
 */
FsmSubStateWrapper.prototype.enter = function () 
{
    this.enterFn.call( this.context );
};

/**
 * This function is called each time this state
 * is exited
 */
FsmSubStateWrapper.prototype.exit = function () 
{
    this.exitFn.call( this.context );
};
 
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
	this.name = "~";
	this.entryStateName = "";
}

FsmMachine.prototype = Object.create( FsmState.prototype );

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
	state.setName( this.name + "/" + name );
};

/**
 * Set state name
 * @param {string} name
 */
FsmMachine.prototype.setName = function( name )
{
    this.name = name;
    
    for ( var i in this.nameStateMap )
    {
        this.nameStateMap[i].state.setName( this.name + "/" + i );
    }
};

/**
 * @param {function()}
 * @param {function( number )}
 * @param {function()}
 */
FsmMachine.prototype.createSubState = function ( name, enterFn, updateFn, exitFn )
{
    var newState = new FsmSubStateWrapper( this, enterFn, updateFn, exitFn );
    this.addState( name, newState );
    newState.setName( this.name + "/" + name );
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
 * Handle an FSM signal. Implementing FsmSignalObserver
 * @param {string} signal Name of the signal that was fired
 */
FsmMachine.prototype.onFsmSignal = function( signal ) 
{
	this.signalQueue.push( signal );
};

/**
 * Set the current state
 * @param {string} stateName Name of the new state to transition to
 */
FsmMachine.prototype.setState = function ( stateName )
{
	if (this.currentStateName != "")
	{
	    var oldState = this.nameStateMap[this.currentStateName].state;
	    
        FsmState.debug( oldState.getName() + " [exit]" );
	    
		oldState.exit();
	}
	
	this.currentStateName = stateName;
	
	var newState = this.nameStateMap[this.currentStateName].state;
	
    FsmState.debug( newState.getName() + " [enter]" );
	
	newState.enter();
};

FsmMachine.prototype.setEnterState = function ( stateName )
{
    this.entryStateName = stateName;
};

/**
 * Update the state machine
 * @param {number} Number of milliseconds sine the last update
 */
FsmMachine.prototype.update = function ( time ) 
{
	if (this.currentStateName === "") return;
	// update the current state
	var currentStateTransitions = this.nameStateMap[this.currentStateName];
	currentStateTransitions.state.update(time);
	
	// find the first transitioning signal if any
	var nextStateName = undefined;
	while (this.signalQueue.length > 0)
	{
	    var sig = this.signalQueue.shift();
		var possibleTransitionTarget = 
			currentStateTransitions.transitions[sig];
		if ( undefined != possibleTransitionTarget )
		{
            FsmState.debug( this.name + "::" + sig + " [consume]" );
		    
			nextStateName = possibleTransitionTarget;
		}
		else
		{
            FsmState.debug( this.name + "::" + sig + " [throw]" );
		    
		    this.fireSignal( sig );
		}
	}
	
	// in the case of a transition
	//     Exit the current state
	//     Enter the new state
	//     update the current state name
	if ( nextStateName != undefined )
	{
		this.setState( nextStateName );
	}
};

/**
 * This function is called each time this state 
 * is entered
 */
FsmMachine.prototype.enter = function () 
{
    if ( "" !== this.entryStateName )
    {
        this.setState( this.entryStateName );
    }
};

/**
 * This function is called each time this state
 * is exited
 */
FsmMachine.prototype.exit = function () {};
