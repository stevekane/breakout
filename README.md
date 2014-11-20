#Simple Pong Overview
I want to build a simple game in an afternoon that uses webgl, and an 
entity component system.  I want the game to be as simple as possible
to better demonstrate the techniques being used while still achieving a
complete game in arund five hours.

#Goals
1. You should be able to read the source extremely easily and understand
what is going on at a glance.  
2. You should be able to take some of the core systems and re-use or 
re-purpose them without much trouble.

#Design Requirements
1. Tweening must be implemented and working to allow for "juicy" effects
2. The memory profile of the app should be completely flat.  
3. All data should be stored in TypedArrays and not standard POJOs.
4. A basic particle pool must be implemented
5. Basic sprite rendering must be implemented
6. Basic winning conditions must be implemented

#Game rules
1. Game has two players.  Each player controls a paddle using two keys.
2. Each player has a wall they are responsible for guarding.  When their
wall is hit, they are eliminated
3. The game is over when all but one player is eliminated.  At this point
the game starts over
4. As the game gets longer, the paddle should grow progressively to a maximum
size.  
5. Every 15 seconds the number of balls should increase by 1
