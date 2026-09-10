/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, 
      fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    
    return Class;
  };
})();
/**
 * @preserve Freebird. Entry to the js13kgames.com
 * Copyright © 2012 Starfish Web Consulting - starfishwebconsulting.co.uk
 * Play more of our games at arcade.starfish.ie
 * Source code: http://github.com/eoinmcg/freebird
 * On the twitters: @eoinmcg
*/

"use strict";

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
            window.setTimeout(callback, 1000 / 60);
            };
})();


// namespace our game
var SF = {

    // set up some inital values
    game: null,
    W: 480, 
    H:  320, 
    scale:  1,
    // the position of the canvas
    // in relation to the screen
    entities: [],
    // for tracking player's progress
    distance: 0,
    score: 0,
    hiScore: localStorage.hiScore || 1024,
    // hiScore: 500,
    newHiScore: false,
    // we'll set the rest of these
    // in the init function
    RATIO:  null,
    currentWidth:  null,
    currentHeight:  null,
    canvas: null,
    ctx:  null,
    ua:  null,
    android: null,
    ios:  null,
    lastTick: 0,
    tick: 0,
    time : 0,
    fps: 0,
    state: 'intro',
    action: 'Tap',
    fadeText: 0,
    font: 'Rammetto One, Verdana',
    gradients: {},
    debug: false,
    pause: false,
    tapped: false,
    m: {x: null, y: null},
    offset: {top: 0, left: 0},
    preload: {
        img: ['b.png', 't.png'],
        loaded: 0
    },
    plays: 0,

    init: function() {

        var grad, i, tmp;

        // the proportion of width to height
        SF.RATIO = SF.W / SF.H;
        // these will change when the screen is resized
        SF.currentWidth = SF.W;
        SF.currentHeight = SF.H;
        // this is our canvas element
        SF.canvas = document.getElementsByTagName('canvas')[0];
        // it's important to set this
        // otherwise the browser will
        // default to 320x200
        SF.canvas.width = SF.W;
        SF.canvas.height = SF.H;
        // the canvas context allows us to 
        // interact with the canvas api
        SF.ctx = SF.canvas.getContext('2d');
        // we need to sniff out android & ios
        // so we can hide the address bar in
        // our resize function
        SF.ua = navigator.userAgent.toLowerCase();
        SF.android = SF.ua.indexOf('android') > -1 ? true : false;
        SF.ios = ( SF.ua.indexOf('iphone') > -1 || SF.ua.indexOf('ipad') > -1  ) ? true : false;
    

        SF.action = (SF.android || SF.ios) ? 'Tap' : 'Click';


        // setup some gradients
        grad = SF.ctx.createLinearGradient(0,0,0,SF.H);
        grad.addColorStop(0, '#036');
        grad.addColorStop(0.5, '#69a');
        grad.addColorStop(1, 'yellow');
        SF.gradients.dawn = grad;

        grad = SF.ctx.createLinearGradient(0,0,0,SF.H);
        grad.addColorStop(0, '#69a');
        grad.addColorStop(0.5, '#9cd');
        grad.addColorStop(1, '#fff');
        SF.gradients.day = grad;

        grad = SF.ctx.createLinearGradient(0,0,0,SF.H);
        grad.addColorStop(0, '#036');
        grad.addColorStop(0.3, '#69a');
        grad.addColorStop(1, 'pink');
        SF.gradients.dusk = grad;

        grad = SF.ctx.createLinearGradient(0,0,0,SF.H);
        grad.addColorStop(0, '#036');
        grad.addColorStop(1, 'black');
        SF.gradients.night = grad;

        // listen for clicks
        window.addEventListener('click', function(e) {
            e.preventDefault();
            SF.tapped = true;
            SF.m.x = (e.pageX - SF.offset.left) / SF.scale;
            SF.m.y = (e.pageY - SF.offset.top) / SF.scale;
        }, false);

        // listen for touches
        window.addEventListener('touchstart', function(e) {
            e.preventDefault();
            // the event object has an array
            // called touches, we just want
            // the first touch
            SF.tapped = true;
            var touch = e.touches[0];
            SF.m.x = (touch.pageX - SF.offset.left) / SF.scale;
            SF.m.y = (touch.pageY - SF.offset.top) / SF.scale;
        }, false);
        window.addEventListener('touchmove', function(e) {
            // we're not interested in this
            // but prevent default behaviour
            // so the screen doesn't scroll
            // or zoom
            e.preventDefault();
        }, false);
        window.addEventListener('touchend', function(e) {
            // as above
            e.preventDefault();
        }, false);

        // space bar pauses
        window.addEventListener('keyup', function(e) {
            e.preventDefault();
            if (e.keyCode === 32) {
                SF.pause = !SF.pause;
            }
            return false;
        }, false);

        // crappy preloader. images are (hopefully) small
        // enough to get away with it & image draws are 
        // wrapped in try catch. ugly, i know
        for (i = 0; i < SF.preload.img.length; i += 1) {
            tmp = new Image();
            tmp.src = SF.preload.img[i];
            tmp.onload = SF.preload.loaded += 1;
        }



        // we're ready to resize
        SF.resize();

        SF.changeState(SF.state);
        SF.loop();

        SF.reset();

    },


    resize: function() {

        var o = document.getElementById('o'),
            c = SF.canvas;



        SF.currentHeight = (SF.action === 'Tap') ?
            window.innerHeight : 450;
        // SF.currentHeight = ( !SF.ios && window.innerHeight < 500 ) ?
        //     window.innerHeight : 500;
        // resize the width in proportion
        // to the new height
        SF.currentWidth = SF.currentHeight * SF.RATIO;

        // this will create some extra space on the
        // page, allowing us to scroll pass
        // the address bar, and thus hide it.
        if (SF.android || SF.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }

        // set the new canvas style width & height
        // note: our canvas is still 320x480 but
        // we're essentially scaling it with CSS
        SF.canvas.style.width = SF.currentWidth + 'px';
        SF.canvas.style.height = SF.currentHeight + 'px';

        // the amount by which the css resized canvas
        // is different to the actual (480x320) size.
        SF.scale = SF.currentWidth / SF.W;
        // position of canvas in relation to
        // the screen

        SF.offset.top = SF.canvas.offsetTop;
        SF.offset.left = SF.canvas.offsetLeft;

        if ((window.innerWidth) < window.innerHeight) {
            c.style.display = 'none';
            o.style.display = 'block';
        } else {
            c.style.display = 'block';
            o.style.display = 'none';
        }

        // we use a timeout here as some mobile
        // browsers won't scroll if there is not
        // a small delay
        window.setTimeout(function() {
                window.scrollTo(0,1);
        }, 1);
    },


    // the actual loop
    // requests animation frame
    // and renders the relevant game state
    loop: function() {


        requestAnimFrame( SF.loop );


        SF.game.update();
        SF.game.render();


        SF.tapped = false;
        SF.tick += 1;
        SF.time = new Date().getTime() * 0.02;
        SF.fadeText = Math.sin(SF.time * 0.2) + 1;
        SF.fps = ~~(1000 / ( new Date().getTime() - SF.lastTick ));
        SF.lastTick = new Date().getTime();

    },

    changeState: function(state) {
    
        SF.reset();
        state = 'SF_' + state;
        SF.game = new window[state]({});
    },


    reset: function() {

        SF.entities = [];
        SF.level = 0;
        SF.pause = false;
        SF.tapped = false;
        SF._t = 0;


    }




};


window.addEventListener('load', SF.init, false);
window.addEventListener('resize', SF.resize, false);
// abstracts various canvas operations into
// standalone functions
SF.Draw = {

    clear: function() {
        SF.ctx.clearRect(0, 0, SF.W, SF.H);
    },


    rect: function(x, y, w, h, col) {
        SF.ctx.fillStyle = col;
        SF.ctx.fillRect(x, y, w, h);
    },

    circle: function(x, y, r, col, stroke) {

        if (stroke) {
            SF.ctx.strokeStyle = stroke;
            SF.ctx.lineWidth = 3;
        }
        
        SF.ctx.fillStyle = col;
        SF.ctx.beginPath();
        SF.ctx.arc(x + 5, y + 5, r, 0,  Math.PI * 2, true);
        SF.ctx.closePath();
        if (stroke) {
            SF.ctx.stroke();
        }
        SF.ctx.fill();
    },

    star: function(cx, cy, col) {
 
        var i = 0,
            spikes = 5,
            r0 = 5,
            r1 = 8,
            rot = Math.PI/2*3,x=cx,y=cy,step=Math.PI/spikes;

        SF.ctx.save();
        SF.ctx.beginPath();
        SF.ctx.moveTo(cx,cy-r0);

        for(i=0;i<spikes;i++){
            x=cx+Math.cos(rot)*r0;
            y=cy+Math.sin(rot)*r0;
            SF.ctx.lineTo(x,y);
            rot+=step;

            x=cx+Math.cos(rot)*r1;
            y=cy+Math.sin(rot)*r1;
            SF.ctx.lineTo(x,y);
            rot+=step;
        }

        SF.ctx.lineTo(cx,cy-r0);
        SF.ctx.fillStyle = col;
        SF.ctx.fill();
        SF.ctx.closePath();
        SF.ctx.restore();
   
    
    },


    text: function(str, x, y, size, col, shadow) {


        SF.ctx.font = 'bold '+size+'px ' + SF.font;
        x = x || (SF.W / 2) - (SF.ctx.measureText(str).width / 2);

        if (shadow) {
            SF.ctx.fillStyle = shadow; 
            SF.ctx.fillText(str, x - 2, y + 2);
        }

        SF.ctx.fillStyle = col;
        SF.ctx.fillText(str, x, y);

    }



};

SF.Game = Class.extend({

    init: function(o) {

    },


    update: function() {

        // cycle through all entities and update as necessary
        for (i = 0; i < SF.entities.length; i += 1) {
            SF.entities[i].update();

            if ( SF.entities[i].checkCollision && 
                SF.entities[i].collides(SF.entities[0])) {

                SF.entities[i].hit();
                SF.entities[0].hit(SF.entities[i].strength,
                                    SF.entities[i].name);

            }

            // delete from array if remove property
            // flag is set to true
            if (SF.entities[i].remove) {
                SF.entities.splice(i, 1);
            }
        }

   
    },

    render: function() {


        // cycle through all entities and render to canvas
        for (i = 0; i < SF.entities.length; i += 1) {
            SF.entities[i].render();
        }

   
    
    }


});




SF.Anim = function(o) {

    o = o || {};

    this.xOff = (o.xOff) || 0;
    this.yOff = (o.yOff) || 0;
    this.frames = (o.frames) || 0;
    this.currentFrame = (o.currentFrame) || 0;
    this.nextAnim = (o.nextAnim) || false;
    this.frameSpeed = (o.frameSpeed) || 3;



};
SF.Particle = function(x, y,r, col, type) {

    this.x = x;
    this.y = y;
    this.r = r;
    this.col = col;
    this.type = type || 'circle';
    this.name = 'particle';

    // determines whether particle will
    // travel to the right of left
    // 50% chance of either happening
    this.dir = (Math.random() * 2 > 1) ? 1 : -1;

    // random values so particles do no
    // travel at the same speeds
    this.vx = ~~(Math.random() * 4) * this.dir;
    this.vy = ~~(Math.random() * 7);

    this.remove = false;

    this.update = function() {

        // update coordinates
        this.x += this.vx;
        this.y -= this.vy;

        // increase velocity so particle
        // accelerates off screen
        this.vx *= 0.99;
        this.vy *= 0.99;

        // adding this negative amount to the
        // y velocity exerts an upward pull on
        // the particle, as if drawn to the
        // surface
        this.vy -= 0.35;

        // offscreen
        if (this.y > SF.H) {
            this.remove = true;
        }

    };


    this.render = function() {
        if (this.type === 'star') {
             SF.Draw.star(this.x, this.y, this.col);
        }
        else {
             SF.Draw.circle(this.x, this.y, this.r, this.col);
        }
    };

};

SF.Sprite = Class.extend({

    init: function(o) {

        this.x = o.x;
        this.y = o.y;
        this.w = o.w;
        this.h = o.h;
        this.vx = o.vx;
        this.vy = o.vy;

        this.xOff = o.xOff || 0;
        this.yOff = o.yOff || 0;

        this.anims = [];
        this.remove = false;
        this.killOnRespawn = false;
        this.checkCollision = false;
        this.strength = -1;

        this.r = this.w / 2;
        this.q = this.r / 2;

    },


    update: function() {

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.99;
        if (this.vy) {
            this.vy *= 0.99;
            this.vy += 0.04;
        }
   
    },

    render: function() {
    
        if (this.img.src) {

            this.animate();

            try {
                SF.ctx.drawImage(
                    this.img,
                    this.xOff,this.yOff,
                    this.w,this.h,
                    ~~(this.x),~~(this.y),this.w,this.h
                );


            } catch(e) {
                console.log(e);
            }

        }
        else {
           SF.Draw.rect(this.x, this.y, this.w, this.h, this.col); 
        }
    
    },

    animate: function() {

        if (SF.pause) {
            return;
        }


        if (( SF.tick % this.anims[this.anim].frameSpeed ) === 0) {
                this.anims[this.anim].currentFrame +=1;
        }


        if (this.anims[this.anim].currentFrame > this.anims[this.anim].frames) {
            this.anims[this.anim].currentFrame = 0;
            if (this.anims[this.anim].nextAnim) {
                this.changeAnim(this.anims[this.anim].nextAnim);
            }
        }


        this.xOff = this.anims[this.anim].xOff + 
                    (this.anims[this.anim].currentFrame * this.w);

    },


    changeAnim: function(anim) {
    
        this.anim = anim; 
        this.anims[this.anim].currentFrame = 0;
    },


    collides: function(o) {

        // this sprite's rectangle
        this.left = this.x;
        this.right = this.x + this.w;
        this.top = this.y;
        this.bottom = this.y + this.h;

        // o sprite's rectangle
        o.left = o.x;
        o.right = o.x + o.w;
        o.top = o.y;
        o.bottom = o.y + o.h;

        // determine if not intersecting
        if (this.bottom < o.top) {
            return false; 
        }
        if (this.top > o.bottom) {
            return false; 
        } 

        if (this.right < o.left) {
            return false; 
        }
        if (this.left > o.right) {
            return false; 
        }

        // otherwise, it's a hit
        return true;

    },

    respawn: function() {
    
        if (this.killOnRespawn) {
            this.remove = true;
            return;
        }
    },


    // called when entity gets hit
    hit: function(type, name) {
    
    
    }



});
SF.levels = [];

SF.levels[1] = {
    bg: {
        grad: 'day',
        type: 'hills',
        col: '#002000'
    },
    entities: {
        Coin: 1,
        Tree: 2,
        Fly: 2
    }
};


SF.levels[2] = {
    bg: {
        grad: 'day',
        type: 'hills',
        col: '#003000'
    },
    entities: {
        Coin: 1,
        Tree: 3,
        Fly: 2
    }
};

SF.levels[3] = {
    bg: {
        grad: 'day',
        type: 'hills',
        col: '#004000'
    },
    entities: {
        Coin: 1,
        Tree: 2,
        Fly: 2,
        Hornet: 2,
        Powerup: 1
    }
};

SF.levels[4] = {
    bg: {
        grad: 'dusk',
        type: 'hills',
        col: '#001000'
    },
    entities: {
        Coin: 2,
        Tree: 2,
        Hornet: 2,
        Mozzie: 1
    }
};

SF.levels[5] = {
    bg: {
        grad: 'dusk',
        type: 'hills',
        col: '#001000'
    },
    entities: {
        Coin: 2,
        Hornet: 2,
        Tree: 2,
        Mozzie: 1,
        Powerup: 1

    }
};

SF.levels[6] = {
    bg: {
        grad: 'night',
        type: 'stars',
        col: '#fff'
    },
    entities: {
        Coin: 2,
        Tree: 2,
        Hornet: 2,
        Snapper: 2
    }
};

SF.levels[7] = {
    bg: {
        grad: 'night',
        type: 'stars',
        col: '#fff'
    },
    entities: {
        Coin: 2,
        Tree: 2,
        Mozzie: 2,
        Vamp: 1,
        Powerup: 1
    }
};
SF.levels[8] = {
    bg: {
        grad: 'dawn',
        type: 'city',
        col: '#222'
    },
    entities: {
        Coin: 2,
        Snapper: 1,
        Vamp: 1,
        Mozzie: 1
    }
};
SF.levels[9] = {
    bg: {
        grad: 'day',
        type: 'city',
        col: '#444'
    },
    entities: {
        Coin: 2,
        Tree: 2,
        Hornet: 4,
        Powerup: 1
    }
};
SF.levels[10] = {
    bg: {
        grad: 'day',
        type: 'city',
        col: '#444'
    },
    entities: {
        Coin: 2,
        Tree: 1,
        Vamp: 1,
        Mozzie: 1,
        Hornet: 2
    }
};
SF.levels[11] = {
    bg: {
        grad: 'dusk',
        type: 'city',
        col: '#444'
    },
    entities: {
        Coin: 2,
        Hornet: 4,
        Vamp: 2
    }
};
SF.levels[12] = {
    bg: {
        grad: 'night',
        type: 'stars',
        col: '#fff'
    },
    entities: {
        Coin: 3,
        Tree: 4,
        Hornet: 4,
        Snapper: 2
    }
};
SF.levels[13] = {
    bg: {
        grad: 'dawn',
        type: 'rainbow',
        col: '#444'
    },
    entities: {
        Coin: 3,
        Tree: 1,
        Fly: 1,
        Hornet: 1,
        Mozzie: 1,
        Snapper: 1,
        Vamp: 1,
        Powerup: 1
    }

};


SF.Bg = {

    hills: function(col) {
        SF.Draw.circle(0,SF.H+30,100,col);
        SF.Draw.circle(160,SF.H+30,120,col);
        SF.Draw.circle(300,SF.H+30,90,col);
        SF.Draw.circle(420,SF.H+30,140,col);
   
    }, 


    stars: function() {
   
        SF.Draw.circle(100,100,1,'#fff');
        SF.Draw.circle(150,30,1,'#fff');
        SF.Draw.circle(220,60,1,'#fff');
        SF.Draw.circle(300,50,1,'#fff');
        SF.Draw.circle(430,70,30,'#fff');
        SF.Draw.circle(415,70,30,'#012');

    },

    city: function(col) {
    
        SF.Draw.rect(0,SF.H - 30, SF.W, 100,col);
        SF.Draw.rect(30,SF.H - 100, 30, 100,col);
        SF.Draw.rect(70,SF.H - 140, 50, 140,col);
        SF.Draw.rect(90,SF.H - 50, 90, 140,col);
        SF.Draw.rect(160,SF.H - 140, 40, 140,col);
        SF.Draw.rect(160,SF.H - 80, 100, 100,col);
        SF.Draw.rect(220,SF.H - 130, 20, 140,col);
        SF.Draw.rect(300,SF.H - 170, 40, 140,col);
        SF.Draw.rect(350,SF.H - 120, 60, 100,col);
        SF.Draw.rect(410,SF.H - 140, 40, 140,col);


    }


};
SF_intro = SF.Game.extend({


    init: function(o) {
        this._super(o); 
    },

    update: function() {
    },

    render: function() {

        SF._t = (SF._t) || 1;
        SF._d = (SF._d) || -1;
        SF._r = (SF._r) || 0.01;
        SF._t += SF._r * SF._d;

        if (SF._t <= 0.01) {
            SF._d *= -1;
            SF._r = 0.01;
        } 

        SF.Draw.rect(0, 0, SF.W, SF.H, '#333');
        SF.Draw.text('Starfish Arcade', false, 100, 34, 'green');
        SF.Draw.text('presents...', false,  150, 24, 'green');
        SF.Draw.rect(0, 0, SF.W, SF.H, 'rgba(0,0,0,'+SF._t+')');

        if (SF._t >= 1 || SF.tapped) {
            SF.Draw.clear();
            // SF.reset();
            SF.changeState('splash');
        }


    }

});

SF.intro = function() {



};
SF_splash = SF.Game.extend({

    init: function(o) {
   
        this._super(o);
        this.level = SF.levels[1];


        this.bird = new Image();
        this.bird.src = 'b.png';
    },


    update: function() {

        SF._t -= 0.02; 

        if (SF.tapped) {
            SF.changeState('tutorial');
            SF.tapped = false;
        }

        this._super();

    },

    render: function() {
    
        SF.Draw.clear();
        SF.Draw.rect(0, 0, SF.W, SF.H, SF.gradients.day);
        SF.Bg.hills('#001000');

        SF.Draw.text('Freebird', false, 100, 44, '#fff', '#000');
        SF.Draw.text('13k to freedom!', false, 130, 20, '#fff', 
                'rgba(0,0,0,0.5)');

        SF.Draw.text(SF.action + ' to Start', false, 180, 14, 
                'rgba(255,0,255,'+SF.fadeText+')');

        try {
            SF.ctx.drawImage(
                this.bird,
                128,0,
                32,32,
                130,SF.H - 32,32,32
            );
        } catch(e) { }


        SF.Draw.text('HiScore:  ' + SF.hiScore, false, 30, 14, 
            'rgba(255,255,255,1)');

        SF.Draw.text('by @eoinmcg', 390, SF.H - 20, 10, 
            'rgba(255,255,255,1)');

        this._super();


    }

});


SF_tutorial = SF.Game.extend({

    init: function(o) {
   
        this._super(o);
        this.level = SF.levels[1];


        this.bird = new Image();
        this.bird.src = 'b.png';

        this.coin = new SF.Coin({});
        this.coin.x = 200;
        this.coin.y = SF.H - 140;

        this.baddie = new SF.Fly({});
        this.baddie.x = 300;
        this.baddie.y = SF.H - 140;

    },


    update: function() {

        SF._t -= 0.02; 

        if (SF.tapped || SF._t < -8 || SF.plays >= 2) {
            SF.changeState('play');
            SF.tapped = false;
        }

        this._super();


    },

    render: function() {
    
        SF.Draw.clear();
        SF.Draw.rect(0, 0, SF.W, SF.H, SF.gradients.day);
        SF.Bg.hills('#001000');

        if (SF._t < -0.5) {
            this.step_1.apply(this);
        } else {
            SF.ctx.drawImage(
                this.bird,
                128,0,
                32,32,
                130,SF.H - 32,32,32
            );
        }


        if (SF._t < -2) {
            this.step_2.apply(this);
        }

        if (SF._t < -4) {
            this.step_3.apply(this);
        }

        if (SF._t < -6) {
            this.step_4.apply(this);
        }

        SF.Draw.text('How To Play', false, 40, 22, '#f0f');
        SF.Draw.text('SKIP >', 410, SF.H - 20, 12, 
            'rgba(255,255,255,1)');


        this._super();


    },


    step_1: function() {
    
        SF.Draw.text('1. ' + SF.action + ' screen to Fly', false, 70, 18, 
                '#000', 'rgba(255,255,255,0.4)');


        try {
            SF.ctx.drawImage(
                this.bird,
                0,0,
                32,32,
                130,SF.H - 128,32,32
            );
        } catch(e) { }
    },


    step_2: function() {
    
        SF.Draw.text('2. Eat to keep your strength up', false, 100, 18, 
                '#000', 'rgba(255,255,255,0.4)');

        this.coin.render(); 

    },


    step_3: function() {
    
        SF.Draw.text('3. Avoid the baddies', false, 130, 18, 
                '#000', 'rgba(255,255,255,0.4)');
    
        this.baddie.render();

    },


    step_4: function() {
    
        SF.Draw.text('4. Fly 13km to freedom!', false, 160, 18, 
                '#000', 'rgba(255,255,255,0.4)');
    
        this.baddie.render();

    }
});
// this is where all entities will be moved
// and checked for collisions etcjs/states/play.js

SF_play = SF.Game.extend({


    init: function(o) {
    
        this._super(o);
        SF.entities = [];
        SF.entities.push(new SF.Bird({ }));

        SF.p1 = SF.entities[0];
        SF.p1.health = 100;

        SF.plays += 1;

    },


    update: function() {

        window.scrollTo(0,1);
        var levelUp = ((SF.distance % 1024) === 0) ? true : false,
            i, n;

        if (SF.pause === true) {
            return;
        }


        this._super();

        SF.distance += 2;
        SF.p1.health -= 0.04;
        if (SF.p1.health > 100) {
            SF.p1.health = 100;
        } 


        if (SF.distance > SF.hiScore && SF.newHiScore === false) {
            SF.newHiScore = true;
            for (n = 0; n < 30; n +=1 ) {
                SF.entities.push(new SF.Particle(
                    SF.W / 2, 
                    ( SF.H / 2 ) - 100,
                    10, 
                    'rgba(255,0,255,1)',
                    'star'
                )); 
            }

            SF.entities.push(new SF.Text({
                str: 'New Hi Score',
                col: '#f0f',
                max: 30,
                size: 30,
                fade: 0.007
                }));

        }

        if (SF.distance > 13312) {
            SF.changeState('victory');
        }

        if (levelUp) {
            SF.level += 1;
            this.levelUp();
        }

        if (SF.p1.dead) {
            SF.changeState('gameOver');
        }

    },


    render: function() {

        var i, 
            health = (SF.p1.health > 100) ? 100 : SF.p1.health,
            level = SF.levels[SF.level] || SF.levels[1],
            bg_grad = level.bg.grad || 'day',
            bg_col = level.bg.col,
            bg_type = level.bg.type;

        SF.Draw.clear();
        SF.Draw.rect(0, 0, SF.W, SF.H, SF.gradients[bg_grad]);
        SF.Bg[bg_type](bg_col);

        this._super();

        // display scores
        SF.Draw.rect(19,49,102, 18, '#000');
        SF.Draw.rect(20,50,health, 16, '#c20');
        SF.Draw.rect(20,58,health, 8, 'rgba(255,255,255,0.2)');

        SF.Draw.text(~~(SF.distance)+'m', 20, 30, 14, '#fff');

        if (SF.debug) {

            SF.Draw.text('FPS ' + SF.fps,
                    350, 15, 12, '#fff');
            SF.Draw.text('Entities ' + SF.entities.length,
                    350, 30, 12, '#fff');
        }

        if (SF.pause === true) {
            SF.Draw.text('PAUSED', 
                    false, 130, 20, 
                    'rgba(255,255,255,'+SF.fadeText+')');
        }

    },


    levelUp: function() {
   
         var n, i, levData;
       
        levData = SF.levels[SF.level];
        if (typeof levData === 'undefined') {
            levData = SF.levData[1];
        }

        for (i = 0; i < SF.entities.length; i +=1) {
            if (typeof SF.entities[i].respawn === 'function') {
                SF.entities[i].killOnRespawn = true;
            }
        }

        for (n in levData.entities) {
            if (levData.entities.hasOwnProperty(n)) {
                for (i = 0; i < levData.entities[n]; i += 1) {
                    SF.entities.push(new SF[n]({}));
                }
            }
        }

        SF.entities.push(new SF.Text({
            x: 100, str: 'Level ' + SF.level,
            col: ( levData.bg.grad  === 'night') ? '#fff' : '#000'
        }));

    }


});

SF_gameOver = SF.Game.extend({


    init: function(o) {

        this._super(o); 

        this.button = {
            x: 100, y: 230,
            w: SF.W - 200,
            h: 50,
            col: '#00aced',
            text: {
                str: 'Tweet Score',
                x: false,
                y: 260,
                size: 18,
                col: '#000'
            },
            pressed: function(x, y) {

                return x > this.x &&
                            x < this.x + this.w &&
                            y > this.y &&
                            y < this.y + this.h;

            }
        };

        this.tweet = new Image();
        this.tweet.src = 't.png';

    },


    render: function() {
    

        var b = this.button;

        SF.Draw.rect(0, 0, SF.W, SF.H, 'rgba(255,0,0,0.01)');
        SF.Draw.rect(0,50,SF.W, 70, '#900');
        SF.Draw.text('Game Over', false, 
                100, 44, 'rgba(255,255,255,'+SF.fadeText+')');

        if (SF.newHiScore) {
            SF.hiScore = SF.distance;
            localStorage.hiScore = SF.hiScore; 
            SF.Draw.rect(0,120,SF.W, 50, '#900');
            SF.Draw.text('New HiScore!', false, 150, 20, '#fff');
        }

        if (SF.tapped && SF._t > 60) {
            if (b.pressed(SF.m.x, SF.m.y) === true) {

                window.location = "https://twitter.com/intent/tweet?&text=I+escaped+" + 
                            SF.distance + 
                            "+m+in+in+Freebird+-+http://arcade.starfish.ie/freebird+#js13kgames";
               return; 
            } else {

                SF.distance = 0;
                SF.newHiScore = false;
                SF.changeState('splash');
            
            }

        }


        SF.Draw.rect(b.x,b.y,b.w, b.h, b.col);
        SF.Draw.text(b.text.str, false, b.text.y, b.text.size, b.text.col);
        SF.ctx.drawImage(this.tweet, b.x + 10, b.y + 8);

        SF._t += 1;

    }

});

SF_victory = SF.Game.extend({


    init: function(o) {
    
        this._super(o);

        this.fireworks = [
            'tomato',
            'lightblue',
            'yellow',
            'orange',
            'lightgreen',
            'greenyellow',
            'plum',
            'white'
        ];


        this.timer = 0;
        this.setTimer();

        this.bird = new Image();
        this.bird.src = 'b.png';


    },

    update: function() {

        if (SF.tapped && SF._t > 60) {
            SF.hiScore = SF.distance;
            localStorage.hiScore = SF.hiScore; 
            SF.distance = 0;
            SF.newHiScore = false;
            SF.changeState('splash');
        }

        this.timer -= 1;
        this._super();    


        if (this.timer <= 0) {
            this.setTimer();
        }

    },

    render: function() {
    

        SF.Draw.rect(0, 0, SF.W, SF.H, '#333');
        SF.Draw.text('Victory', false, 100, 44, 'rgba(255,0,255,'+SF.fadeText+')');
        SF.Draw.text('You Win!', false, 150, 30, '#f0f');
        // SF.Draw.star(SF.W / 2, SF.H /2, 'yellow');

        this._super();

        try {
            SF.ctx.drawImage(
                this.bird,
                128,0,
                32,32,
                100,SF.H - 32,32,32
            );
        } catch(e) {
            console.log(e);
        }

    },

    setTimer: function() {

        var col = ~~(Math.random() * this.fireworks.length);

        this.timer = (Math.random() * 5);
        SF.entities.push(new SF.Particle(
            SF.W / 2,
            // SF. H / 2,
            -10,
            3, 
            this.fireworks[col],
            'star'
        )); 

    }

});

SF.Text = SF.Sprite.extend({


    init: function(o) {
        this._super(o);

        this.name = 'text';

        this.max = o.max || 30;
        this.size = o.size || 5;
        this.col = o.col || '#000';
        this.speed = o.speed || 0.5;
        this.fade = o.fade || 0.02;
        this.opacity = 1;
        this.str = o.str;
        this.x = -SF.W;
        this.y = o.y || SF.H / 2;
        this.centerX = SF.W / 2;
        this.shadow = o.shadow || false;

        this.collides = false;
    },

    update: function() {

        if (this.size >= this.max) {
            this.size = this.max;
            this.opacity -= this.fade;
            this.y -= 0.5;
        } else {
            this.size += this.speed;
        }

        if (this.opacity < 0) {
            this.remove = true;
        }

        SF.ctx.font = 'bold '+this.size+'px ' + SF.font;
        this.x = this.centerX - ( SF.ctx.measureText(this.str).width / 2);


    },

    render: function() {

        SF.ctx.globalAlpha = this.opacity;
        if (this.shadow) {
            SF.Draw.text(this.str, this.x + 2, this.y + 2, 
                    this.size, this.shadow);
        }
        SF.Draw.text(this.str, this.x, this.y, this.size, this.col);
        SF.ctx.globalAlpha = 1;

    }


});
SF.Bird = SF.Sprite.extend({

    init: function(o) {

        this._super(o); 

        this.img = new Image();
        this.img.src = 'b.png';
        this.col = o.col || 'green';

        this.x = 150 || o.x;
        this.y = SF.H - 40;
        this.w = 32;
        this.h = 32;
        this.vx = 0;
        this.vy = -1;

        this.anims.flap = new SF.Anim(
            {xOff: 0, yOff: 0, frames: 2, frameSpeed: 3,
            nextAnim: 'glide'});
        this.anims.glide = new SF.Anim(
            {xOff: 0, yOff: 0, frames: 0, frameSpeed: 3});
        this.anims.run = new SF.Anim(
            {xOff: 96, yOff: 0, frames: 1, frameSpeed: 7});
        this.anims.stand = new SF.Anim(
            {xOff: 128, yOff: 0, frames: 0});
        this.anims.hurt = new SF.Anim(
            {xOff: 192, yOff: 0, frames: 0, nextAnim: 'glide'});
        this.anims.dead = new SF.Anim(
            {xOff: 160, yOff: 0, frames: 0});

        this.anim = 'glide';
        this.name = 'bird';
        this.health = 100;

        this.r = this.w / 2;
        this.invincible = false;

        this.counter = 0;

    },

    update: function() {

        if (SF.tapped && this.health > 0) {
            this.vy += -1.7;
            this.changeAnim('flap');
        }

        this._super();

        if (this.health <= 0) {
            this.health = 0;
            this.changeAnim('dead');
        }
        else if (this.y >= SF.H - this.h) {
            this.y = SF.H - this.h;
            this.vy = 0;
            this.changeAnim('run');
        } else if (this.y <= 0 && this.health > 0) {
            this.y = 0;
            this.vy = (this.vy / 2) * -1;
        } 

        if (this.counter > 0) {
            this.counter -= 0.3; 
        }

        if (this.counter <= 0) {
            this.invincible = false;
        }

        if (this.health <= 0 && this.y >= ( SF.H - this.h )) {
            this.dead = true;
        }

    },



    render: function() {
    

        var opacity;

        this._super();
        if (this.invincible) {
            opacity = this.counter / 100;
            SF.Draw.circle(this.x + this.r + 2, 
                this.y + this.r, 
                this.w / 2, 
                'rgba(255,0,255,0.3)', 
                'rgba(85,0,85, '+ opacity  +')');
        }

    },

    hit: function(damage, name) {
    
        if (damage < 0) {
            if (this.invincible === false && this.health > 0) {
                this.health += damage;
                this.changeAnim('hurt'); 
                SF.entities.push(new SF.Particle(
                    this.x, 
                    this.y, 
                    2, 
                    this.col 
                )); 

            }
        } else {
            this.health += damage;
        }

        if (name === 'powerup') {
            this.counter = 100;
            this.invincible = true; 
        }

    }

});
SF.Coin = SF.Sprite.extend({


    init: function(o) {
        this._super(o);

        this.w = 16;
        this.h = 16;
        this.name = 'coin';
        this.checkCollision = true;
        this.strength = 15;
        this.respawn();

        this.sparkle = 0;


    },

    update: function() {

        this.sparkle = SF.fadeText / 4;

        this.x += this.vx;
        if (this.x < (0 - this.w)) {
            this.respawn();
        }

    },

    render: function() {
        SF.Draw.circle(this.x, this.y, this.w / 2, '#ffd700', 'brown');
        SF.Draw.circle(this.x, this.y, this.w / 2, 
            'rgba(255,255,255,'+this.sparkle+')');
    },

    respawn: function() {
    
        this._super();

        this.x = ~~(Math.random() * SF.W) + SF.W;
        this.y = ~~(Math.random() * ( SF.H - (this.h * 3) )) + this.h;

        this.vx = -3;
        this.vy = 0;
    },

    hit: function() {

        var n;

        for (n = 0; n < 3; n +=1 ) {
            SF.entities.push(new SF.Particle(
                this.x, 
                this.y, 
                3, 
                // random opacity to spice it up a bit
                'rgba(255,215,0,'+Math.random()*2+')',
                'star'
            )); 
        }
        this.respawn();

    }

});
SF.Tree = SF.Sprite.extend({


    init: function(o) {
        this._super(o);

        this.name = 'tree';
        this.respawn();
        this.checkCollision = true;
    },

    update: function() {

        this.x += this.vx;
        if (this.x < (0 - this.w)) {
            this.respawn();
        }

    },

    render: function() {
        // SF.Draw.rect(this.x, this.y, this.w, this.h, '#c20');
        SF.Draw.circle(this.x + this.r, ( this.y + this.r ) - 10, this.r, 'green', '#050');
        SF.Draw.circle(this.x + ( this.r / 2 ), ( this.y + this.r ) - 10, this.r / 3, 'rgba(0,0,0,0.08)');
        SF.Draw.rect(this.x + this.r, this.y + this.r, 10, this.r, 'brown', '#d20');

    },

    respawn: function() {

        this._super();

        this.w = ~~(Math.random() * 64 ) + 32;
        this.h = this.w;
        this.r = this.w / 2;
    
        this.x = ~~(Math.random() * SF.W) + SF.W;
        this.y = SF.H - this.h;

        this.vx = -3;
        this.vy = 0;
    }


});
SF.Hornet = SF.Sprite.extend({


    init: function(o) {

        o.w = 16;
        o.h = 12;
        o.vx = 1;
        this._super(o);

        this.name = 'hornet';

        this.r = this.h / 2;
        this.q = Math.ceil( this.r / 2 );

        this.checkCollision = true;
        this.strength = -3;
        this.respawn();

    },

    update: function() {

        this.x += this.vx;
        if (this.x < (0 - this.w)) {
            this.respawn();
        }

    },

    render: function() {
   

        var ctx = SF.ctx,
            x = this.x + this.q,
            y = this.y + this.q;

        // SF.Draw.rect(this.x, this.y, this.w, this.h, '#fff');
        SF.Draw.circle(x, y, this.r, '#000');
        SF.Draw.circle(x - 5, y -2, 2, '#fff');
        SF.Draw.circle(x+this.r, y, this.r, '#000');
        SF.Draw.rect(x + this.r, y - this.q + 2, this.r, this.h, 'yellow');

        ctx.beginPath();
        ctx.moveTo(x + this.w, y + this.r);
        ctx.lineTo(x + this.w, y);
        ctx.lineTo(x + this.w + this.q + this.q, y + this.r);
        ctx.fillStyle = '#000';
        ctx.fill();

        SF.Draw.circle(x+ 5, y - 5, this.q + 2, '#69a');
    },

    respawn: function() {

        this._super();

        this.x = ~~(Math.random() * SF.W) + SF.W;
        this.y = ~~(Math.random() * 200) + 10;

        this.vx = -7;
        this.vy = 0;
    }


});
SF.Fly = SF.Sprite.extend({


    init: function(o) {

        o.w = 22;
        o.h = 22;
        o.vx = 1;
        this._super(o);

        this.name = 'fly';

        this.r = this.h / 2;
        this.q = Math.ceil( this.r / 2 );

        this.checkCollision = true;
        this.respawn();

        this.flap = 0;
        this.strength = -2;

    },

    update: function() {

        this.x += this.vx;
        if (this.x < (0 - this.w)) {
            this.respawn();
        }


        this.flap = (SF.tick % 3) ? 3 : 0;

    },

    render: function() {

        var ctx = SF.ctx,
            x = this.x + this.q,
            y = this.y + this.q;

        ctx.beginPath();
        ctx.moveTo(this.x + this.q, this.y + this.q);
        ctx.lineTo(this.x + this.q, ( this.y + this.h ) - 3);
        ctx.lineTo(this.x - this.q, this.y + (this.h / 2));
        ctx.fillStyle = 'orange';
        ctx.strokeStyle = '#c02';
        ctx.stroke();
        ctx.fill();
  
        SF.Draw.circle(this.x + 16, this.y + this.flap, 6, '#666');
        SF.Draw.circle(this.x + this.r, this.y + this.r, this.r, '#333', '#111');
        SF.Draw.circle(this.x + 18, this.y + 2 + this.flap, 7, '#999');
        SF.Draw.circle(this.x, this.y + 4, 4, '#fff');
        SF.Draw.circle(this.x - 1, this.y + 4, 1, '#600');

    },

    respawn: function() {

        this._super();

        this.x = ~~(Math.random() * SF.W) + SF.W;
        this.y = ~~(Math.random() * 200) + 10;

        this.vx = -4;
        this.vy = 0;
    }


});
SF.Snapper = SF.Sprite.extend({


    init: function(o) {
        this._super(o);

        this.name = 'snapper';
        this.maxH = 0;
        this.yDir = -1;
        this.respawn();
        this.strength = -5;
        this.checkCollision = true;

    },

    update: function() {

        this.x += this.vx;

        if (this.y < this.maxH || this.y > SF.H) {
            this.yDir = this.yDir * -1;
        }


        if (this.x < (0 - this.w)) {
            this.respawn();
        }

        this.y = this.y + (this.yDir * this.vx);

    },

    render: function() {

        SF.Draw.rect(this.x + this.r, this.y + this.r, 5, 
            SF.H - this.y, 'purple');
        SF.Draw.circle(this.x + this.r, this.y + this.r + this.q,
            this.r, 'purple', '#000');

        SF.Draw.circle(this.x + this.q, this.y + this.r + 4, 
            this.q / 2, '#fff');
        SF.Draw.circle(this.x + this.q + this.r, this.y + this.r + 4, 
            this.q / 2, '#fff');
        SF.Draw.circle(this.x + this.r, this.y + this.r + 2, 
            this.q, 'purple');

    },

    respawn: function() {

        this._super();

        this.w = ~~(Math.random() * 32 ) + 32;
        this.h = this.w;
        this.r = this.w / 2;
        this.q = this.r / 2;
        this.maxH = this.getMaxH();


        this.x = ~~(Math.random() * SF.W) + SF.W;
        this.y = SF.H - this.h;

        this.vx = -3;
        this.vy = 0;
    },


    getMaxH: function() {

        return ~~(Math.random() * (SF.H / 2)) + 50;
    
    }


});
SF.Mozzie = SF.Sprite.extend({


    init: function(o) {

        o.w = 16;
        o.h = 10;
        o.vx = 1;
        this._super(o);

        this.name = 'mozzie';

        this.r = this.h / 2;
        this.q = Math.ceil( this.r / 2 );

        this.checkCollision = true;
        this.respawn();

        this.strength = -5;
        this.offScreen = true;

    },

    update: function() {

        this.x += this.vx;
        if (this.x > (SF.W + this.w)) {
            this.respawn();
        }

        this.offScreen = (this.x < 0) ? true : false;
    },

    render: function() {

        var ctx = SF.ctx,
            x = this.x + this.q,
            y = this.y + this.q;

        if (this.offScreen) {
            SF.Draw.circle(16, y, this.h, 
                'rgba(200,0,0,'+SF.fadeText+')');
            SF.Draw.text('!', 18, y + 10, 14, 
                'rgba(255, 255, 255, '+SF.fadeText+')');
        } else {
        
            SF.Draw.circle(x, y, this.r, '#000');
            SF.Draw.circle(x+this.r, y, this.r, '#000');
            SF.Draw.rect(x + this.r, y - this.q + 2, this.r, this.h, 'black');

            ctx.beginPath();
            ctx.moveTo(x + this.w - 3, y + this.q);
            ctx.lineTo(x + this.w, y + this.r);
            ctx.lineTo(x + this.w + this.r + this.q, y + this.r);
            ctx.fillStyle = '#000';
            ctx.fill();

            SF.Draw.circle(x, y - 5, this.q + 2, 'rgba(255,255,255,0.5)');
            SF.Draw.circle(this.x + this.w - 2, this.y, 2, 'red');
        }


    },

    respawn: function() {

        this._super();

        this.x = ( ~~(Math.random() *  SF.W ) + SF.W ) * -1;
        this.y = ~~(Math.random() * 200) + 10;

        this.vx = 5;
        this.vy = 0;
    }




});


SF.Vamp = SF.Sprite.extend({


    init: function(o) {

        this._super(o);

        this.w = 8;
        this.h = 0;
        this.r = this.w / 2;
        this.yDir = 1;
        this.maxH = 0;
        this.speed = 3;

        this.name = 'vamp';
        this.respawn();
        this.checkCollision = true; },

    update: function() {

        this.x += this.vx;

        if (this.h > this.maxH || this.h < 0) {
            this.yDir = this.yDir * -1;
        }

        if (this.x < SF.W) {
            this.h = this.h + (this.yDir * this.speed);
        }



        if (this.x < (0 - this.w)) {
            this.respawn();
        }

    },

    render: function() {

        SF.Draw.rect(this.x, this.y, this.w, this.h, '#c20');
        SF.Draw.circle(this.x - 1, this.h - this.r, 4, '#c20');
        SF.Draw.circle(this.x - 2, 0, 12, 'darkgreen');
        SF.Draw.circle(this.x - this.w, 4, 4, 'white');
        SF.Draw.circle(this.x + this.r, 4, 4, 'white');
        SF.Draw.circle(this.x - 2, 0, 6, 'darkgreen');


    },

    respawn: function() {

        this._super();

        this.x = ~~(Math.random() * SF.W) + SF.W;
        this.y = 0;
        this.r = this.w / 2;
        this.q = this.r / 2;
        this.maxH = this.getMaxH();

        this.h = 32;

        this.vx = -3;
        this.vy = 0;
    },

    getMaxH: function() {

        return ~~(Math.random() * (SF.H / 2)) + 50;
    
    }



});

