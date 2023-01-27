Headless examples
===

These are some examples of driving the headless game loop using the bundled module.

The simple `ai-ai.ts` runs an AI-only matchup.   Compile like

    npx tsc --target es2015  --moduleResolution node ai-ai.ts

and then run with [node 18+](https://nodejs.org/en/) via

    node --es-module-specifier-resolution=node ai-ai.js

you should see output like this:

    Turn: 1 score -132
    EF41J5BvHtElNnQJMVG3vsMss7sUiPETFtOEPcnChmEmjT7zEPJzmYRhCmRCDEsosPRhc3S4NQtkXfRPqLkWJwzOZRscvdlPsZxYP6ZXZPr_BQUrhsI7JzvWjXpcDtOpyb1pX9xStmqTMMkYZoGC1NQ9EobSa9NrCgMPA3Z66ANhS8ETnbX6uQqHSf3Nkg6b3T4NW172MgpXCGhugMQhuYZOa9nKhmXi8BX9kvIMPr16fbSoakWfMkQX6n5JB3ZEYHiY7zyFv2Sw_vIBhlLiUqX_iZz3pJp_RzRzhzxVRlVRlzhzwB77xSSM3_nnvuu_p_vZjUgrkVRzR_RhljrZrsivDxu
    ...

You can paste any of the state tokens to the web client URL to see what the game looks like at that point.  For example the position at the end of the game shows the Germans not doing well...

![aivai](../doc/images/aivai.jpg)

As a performance test, `maelstrom.ts` runs all scenarios with both sides hell-bent on Moscow.
You can run at the command line using magic like:

    npx tsc --target es2015  --moduleResolution node maelstrom.ts
    /usr/bin/time -l node --prof --logfile=perf.log --no-logfile-per-isolate --es-module-specifier-resolution=node maelstrom.js
    node --prof-process perf.log > perf.txt

or as a one-liner

    npx tsc --target es2015 maelstrom.ts --moduleResolution node && /usr/bin/time -l node --prof --logfile=perf.log --no-logfile-per-isolate --es-module-specifier-resolution=node maelstrom.js && node --prof-process perf.log > perf.txt
