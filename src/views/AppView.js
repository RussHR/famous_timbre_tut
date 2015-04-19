/*** AppView.js ***/

define(function(require, exports, module) {
  var View          = require('famous/core/View');
  var Surface       = require('famous/core/Surface');
  var Transform     = require('famous/core/Transform');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Transitionable  = require('famous/transitions/Transitionable');
  var Modifier       = require('famous/core/Modifier');

  var PageView = require('views/PageView');
  var MenuView = require('views/MenuView');
  var StripData = require('data/StripData');

  var GenericSync     = require('famous/inputs/GenericSync');
  var MouseSync       = require('famous/inputs/MouseSync');
  var TouchSync       = require('famous/inputs/TouchSync');
  GenericSync.register({'mouse': MouseSync, 'touch': TouchSync});

  function AppView() {
    View.apply(this, arguments);

    this.menuToggle = false;
    // create transitionable with initial value of 0
    this.pageViewPos = new Transitionable(0);

    _createPageView.call(this);
    _createMenuView.call(this);

    _setListeners.call(this);
    _handleSwipe.call(this);
  }

  AppView.prototype = Object.create(View.prototype);
  AppView.prototype.constructor = AppView;

  AppView.DEFAULT_OPTIONS = {
    openPosition: 276,
    transition: {
      duration: 300,
      curve: 'easeOut'
    }
  };

  function _createPageView() {
    this.pageView = new PageView();
    this.pageModifier = new Modifier({
      transform: function() {
        return Transform.translate(this.pageViewPos.get(), 0, 0);
      }.bind(this)
    });

    this.add(this.pageModifier).add(this.pageView);
  }

  function _createMenuView() {
    this.menuView = new MenuView({ stripData: StripData });

    var menuModifier = new StateModifier({
      transform: Transform.behind
    });

    this.add(menuModifier).add(this.menuView);
  }

  function _setListeners() {
    this.pageView.on('menuToggle', this.toggleMenu.bind(this));
  }

  function _handleSwipe() {
    var sync = new GenericSync(
      ['mouse', 'touch'],
      {direction : GenericSync.DIRECTION_X}
    );

    this.pageView.pipe(sync);

    sync.on('update', function(data) {
      var currentPosition = this.pageViewPos.get();

      this.pageViewPos.set(Math.max(0, currentPosition + data.delta));
    }.bind(this));

    sync.on('end', (function(data) {
      var velocity = data.velocity;
      var position = this.pageViewPos.get();
      console.log(velocity);
        if(velocity < 0) {
          this.slideLeft();
        } else {
          this.slideRight();
        }
    }).bind(this));
  }

  AppView.prototype.toggleMenu = function() {
    if(this.menuToggle) {
      this.slideLeft();
    } else {
      this.slideRight();
    }
    this.menuToggle = !this.menuToggle;
  };

  AppView.prototype.slideLeft = function() {
    this.pageViewPos.set(0, this.options.transition, function() {
      this.menuToggle = false;
    }.bind(this));
  };

  AppView.prototype.slideRight = function() {
    this.pageViewPos.set(this.options.openPosition, this.options.transition, function() {
      this.menuToggle = true;
    }.bind(this));
  };

  module.exports = AppView;
});
