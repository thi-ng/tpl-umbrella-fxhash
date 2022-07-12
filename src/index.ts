import { FMT_yyyyMMdd_HHmmss } from "@thi.ng/date";
import { downloadCanvas, downloadWithMime } from "@thi.ng/dl-asset";
import { exposeGlobal } from "@thi.ng/expose";
import {
    asSvg,
    group,
    Polyline,
    polyline,
    rect,
    scale,
    svgDoc,
} from "@thi.ng/geom";
import { draw } from "@thi.ng/hiccup-canvas";
import type { State } from "./api";
import { resolveState } from "./state";

// these declarations ensure TypeScript is aware of these
// externally defined vars/functions
declare var fxhash: string;
declare var isFxpreview: boolean;
declare function fxpreview(): void;

// flag to guard code blocks which are only wanted during development
// any `if (DEBUG) { ... }` code blocks will be removed in production builds
const DEBUG = process.env.NODE_ENV !== "production";

let STATE: State;
let timer: number;
let doUpdate = true;

// main initialization function (called from further below)
const init = () => {
    // cancel any queued updates
    cancelAnimationFrame(timer);

    // update/re-compute state/config (only those parts which are transitively
    // dependent on window size (and/or other dynamically changing factors)
    // the rest of the app state will already be ready/valid at this point...
    // see src/state.ts for further details...
    STATE = resolveState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    // insert any other (re)initialization tasks here
    // ...

    // trigger update with new settings
    update();

    // if needed also trigger fxpreview
    // doing this at this point might not fit every project, YMMV!
    isFxpreview && requestAnimationFrame(fxpreview);
};

/**
 * Main update/loop.
 *
 * YOU'LL PROBABLY WANT TO REPLACE MOST OF THIS WITH YOUR OWN CODE...
 * (if not, expect an invoice :)
 */
const update = () => {
    // destructure state var to pull out the bits we're interested in here...
    const { canvas, particles } = STATE;

    // update all particles
    particles.forEach((p) => p.update());

    // draw everything (using thi.ng/geom & thi.ng/hiccup-canvas)
    // see package docs & readmes for further details...
    draw(canvas.ctx, getScene(STATE));

    // loop unless user requested pause
    // (see keydown handler)
    doUpdate && (timer = requestAnimationFrame(update));
};

/**
 * Constructs a small hierarchy of shapes used to visualize the particle system,
 * both for drawing in the canvas (via {@link update}) and to export the scene
 * as SVG (see key event handler further below)...
 *
 * @param state
 */
const getScene = ({ particles, scaledSize, theme }: State) =>
    group({ lineCap: "round" }, [
        // filled rect (aka background)
        rect(scaledSize, { fill: theme.bg }),
        // wrap each particle's tail as polyline and scale to canvas size
        // (remember: particle positions are using normalized coordinates)
        ...particles.map(
            (p) => <Polyline>scale(
                    polyline(p.tail, {
                        stroke: p.color,
                        weight: p.thick,
                    }),
                    scaledSize
                )
        ),
    ]);

// global key handler
window.onkeydown = (e) => {
    switch (e.key) {
        case " ":
            doUpdate = !doUpdate;
            doUpdate && update();
            break;
        case "x":
            // trigger download of canvas w/ timestamped base filename
            // (uses PNG by default, configurable)
            downloadCanvas(
                STATE!.canvas.canvas,
                `fxhash-${FMT_yyyyMMdd_HHmmss()}`
            );
            break;
        case "s":
            // convert scene to SVG & trigger download w/ timestamped filename
            downloadWithMime(
                `fxhash-${FMT_yyyyMMdd_HHmmss()}.svg`,
                asSvg(svgDoc({}, getScene(STATE))),
                { mime: "image/svg+xml" }
            );
            break;
    }
};

// re-initialize dynamic state when window is resized
window.onresize = init;

// kick off...
init();

// expose selected features/traits/params for FXhash platform
const features = ((<any>window).$fxhashFeatures = {
    theme: STATE!.themeId,
    particles: STATE!.numParticles,
});

// print out to console (will be removed for production build)
DEBUG && console.log(fxhash, features);

// expose state as global variable (during development only, for debug purposes
// in browser console...)
exposeGlobal("state", STATE!);
