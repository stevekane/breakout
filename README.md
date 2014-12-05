#Hellmeier's Catechism
##What am I trying to do?
I am building the game Breakout or Arkanoid in the browser.  The game
will feature 2d graphics rendered with webgl, audio played with webaudio,
and will allow gamepad and keyboard input.  The game will feature animated
sprites, simple particle effects, and a basic tweening engine.  
##How is it done today?
Breakout has been built many times over its 30-year existence.  The game
is most often implemented using all the techniques described here.
##What's my new approach and why do I think it will be successful?
My approach is to make a breakout game that plays directly in the browser.
I have no explicit monetary goals up front, but intend to use these games
to build a portfolio of experience and finished games to explore game design,
game implementation, engine design, etc.  I think having the game playable
in the browser will allow me to show my work off easily and will cause me
to favor completion over experimentation.
##Who cares?  If it works, what difference will it make?
I care.  By implementing classic games, I will be teaching myself about
the fundamentals of game programming and eventually game design.  Implementing
this game will provide me a playground to do testing/profiling etc with
a real and completed game.  This is critical for helping me develop an
intuition for designing and implementing video games.
##What are the risks and the payoffs?
###Risks
1. I will get distracted by hypothetical scenarios and won't focus on
   building systems that solve an immediate need.
2. I will take a long time implementing this and will never actually complete
   the game.
3. I will fail.
###Payoffs
1. I will have my first complete game and will have learned about the essential
   systems needed to render 2d games in the browser.
##How much will it cost in time and money?
I believe this game should be built in seven days.  It costs no money to develop
other than of course the ever-present opportunity cost.
##What are the midterm and final checks to verify success?
###Day One
Sound system created.  Basic rendering and update loop created and working.  
Basic assets can be loaded.
###Day Two
Sprite graphics can be displayed in center of screen.
Sprites support animations which are stored by name and can be played from
console command line.
User input can be processed from the keyboard only.  Key mappings can be defined
and the current frames keys are displayed in the console on every game update.
###Day Three
Game objects are defined:  These include Ball, Paddle, Brick.  These should
be stored in a VERY simple entity component system with an entity store that
supports simple queries.  Basic system for updating objects physics implemented.
###Day Four
Collision detection system built.  Should be a naive combination of broadphase (n^2)
and nearphase where resolution happens.  Resolution should be done first along the
y axis and then repeated to correct the x axis.  BP -> NPy -> BP -> NPx
###Day Five
Input system should be built to move the paddle left and right within the bounds
using left and right arrow keys.  Space bar should launch the ball when the ball
is stuck to the paddle.
###Day Six
Game rules implemented:
1. when player loses all lives, game is over and restarts
2. when ball hits bottom of the screen,  a life is lost and the ball is reset
3. when the ball strikes a brick, it should lose 1 health and bounce off
4. when the ball strikes a wall it should bounce off
5. when a brick has 0 life, it should die and disappear.
6. when all bricks in a level have been destroyed, the player has won and the
game should reset.

In summary, game is over when all bricks are dead OR when player has no lives.
###Day Seven
Polish the code base and implement some "juicy features" such as simple animation,
tweens, and particle effects.  Also be sure there is background music, sounds for
various events, and a game over sound.
