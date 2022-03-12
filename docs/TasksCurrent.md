## Current Priorities


- How to merge a regular polygon with an inverted polygon?
    - The regular poly must change to be inverted
- How to handle shortcuts?
- Make tests ensure that all poly functions handle maleformed polys gracefully
- Pathfinding via a baked convex poly mesh is turning out to be very involved and not necessary for my needs.  Instead what if I do a kind of localized pathing.  Still start with the inset polygons and try to path a straight line to the target; then if that line collides with a poly, try to route to the left or right corner and tHEN path a straight line and repeat until you get an unobstructed path to the target.  And you could limit it to 10 iterations for example.
- Resolve not adding next's or prev's from another shape that are inside of the current shape
    - Do this with mergeOverlappingPolygons
- Setup Buffer with social medias and start a following
- TODO: Even with Attempt3, I think the order of the points still matters, so if the points are going counter clockwise but the poly is not inverted=true you'll get weird behavior
---
Finish Content:
- More spells:
    - Haste modifier lets you move farther
    - Spells that summon walls or pillars to prevent enemy movement (maybe to trap them)
    - Push spells
        - If you push a unit into a portal they appear in the next level
    - Fix charge, stomp, lance
        - Movement spells could help you cast farther than you should be able to and move a far unit into another group and chain them, cause it should keep the target after they move
    - A card that changes mana cost of spells to health cost (vampire)
    - soul swap (swap bodies with another unit, until they die, then you return to your own body - and you get their abilities as cards)
- More enemies:
    - 