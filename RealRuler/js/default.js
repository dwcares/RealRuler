(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nativePPI;
    var logicalPPI;
    var screenSize;
    var defaultRulerSizeInches = 4;

    var pointers = [];
    var rulerHeight = 120;
    var fingerWidth = 100;
    function init() {
        if (!window.localStorage.noTutorial) {
            WinJS.Utilities.addClass(touchCanvas, "howTo");
        }

        WinJS.Application.onsettings = function (e) {
            e.detail.applicationcommands = { "displaySettings": { title: "Display info", href: "/default.html" } };
            WinJS.UI.SettingsFlyout.populateSettings(e);
        };

        var floatRuler = document.getElementById("floatRuler");
        floatRuler.addEventListener("MSGestureChange", touchHandler);
        floatRuler.addEventListener("MSPointerDown", downHandler);
        floatRuler.addEventListener("wheel", onMouseWheel, false);
        floatRuler.addEventListener("MSGestureEnd", onGestureEnd, false);
        floatRuler.addEventListener("dragstart", function (e) { e.preventDefault(); }, false);

        loadDisplayInfo();
        window.onresize = loadDisplayInfo;
    }

    function loadDisplayInfo() {
        var info = Windows.Graphics.Display.DisplayInformation.getForCurrentView();

        if (info.rawDpiX >= 0) {
            nativePPI = info.rawDpiX;
            logicalPPI = nativePPI * 100 / info.resolutionScale;
            var screenSizeX = window.screen.width / logicalPPI;
            var screenSizeY = window.screen.height / logicalPPI;
            screenSize = Math.sqrt(screenSizeX * screenSizeX + screenSizeY * screenSizeY);

        } else {
            // Simulate screen size if unavaliable 
            nativePPI = 135;
            logicalPPI = nativePPI;
        }

        updateSettingsInfo(screenSize);

        createRuler(100, edgeRuler, true);
        createRuler(defaultRulerSizeInches, floatRuler);
        updateFloatRulerLabel(defaultRulerSizeInches);
    }

    function updateSettingsInfo(screenSize) {

        if (screenSize) {
            screenSizeLabel.innerText = screenSize.toFixed(1) + " inches";
        } else {
            screenSizeLabel.innerText = "Simulated";
        }
    }

    
    function updateFloatRulerLabel(lengthInInches) {
        var label = document.querySelector("#floatRuler .label");
        label.innerText = lengthInInches.toFixed(2) + " inches";
    }

    function createRuler(inches, parentDiv, showNumbers) {

        var ruler = parentDiv.querySelector(".ruler");

        if (!ruler) {
            ruler = document.createElement("ruler");
            ruler.className = "ruler";
            parentDiv.appendChild(ruler);
        }

        ruler.style.width = inches * logicalPPI + "px";
        ruler.style.height = rulerHeight + "px";
        ruler.style.backgroundSize = logicalPPI + "px " + rulerHeight + "px";

        if (showNumbers) {
            ruler.innerHTML = "";
            for (var i = 0; i < inches; i++) {
                var label = document.createElement("div");
                label.className = "label";
                label.innerText = i + 1;
                label.style.width = logicalPPI - 5 + "px";
                ruler.appendChild(label);
            }
        }
    }

    function downHandler(eventObject) {
        var target = getManipulationElement(eventObject.target);
        target.gestureObject.addPointer(eventObject.pointerId);
        target.gestureObject.pointerType = eventObject.pointerType;
    }


    function onMouseWheel(e) {
        e.pointerId = 1;
        downHandler(e);
    }

    function onGestureEnd(e) {
        var target = getManipulationElement(e.target);
        target.gestureObject.pointerType = null;
    }

    function getManipulationElement(element) {
        var retValue = element;
        while (!WinJS.Utilities.hasClass(retValue, "ManipulationElement")) {
            retValue = retValue.parentNode;
        }

        if (retValue.scale === null || typeof retValue.scale === "undefined") {
            retValue.scale = 1;
        }
        if (retValue.translationX === null || typeof retValue.translationX === "undefined") {
            retValue.translationX = 0;
        }
        if (retValue.translationY === null || typeof retValue.translationY === "undefined") {
            retValue.translationY = 0;
        }
        if (retValue.rotation === null || typeof retValue.rotation === "undefined") {
            retValue.rotation = 0;
        }

        if (retValue.gestureObject === null || typeof retValue.gestureObject === "undefined") {
            retValue.gestureObject = new MSGesture();
            retValue.gestureObject.target = retValue;
        }
        return retValue;
    };

    function touchHandler(e) {
        var target = getManipulationElement(e.target);

        var elt = e.target;
        var m = new MSCSSMatrix(elt.style.transform);
        target.scale *= e.scale;

        elt.style.transform = m.
            translate(e.offsetX, e.offsetY).
            translate(e.translationX, e.translationY).
            rotate(e.rotation * 180 / Math.PI).
            translate(-e.offsetX, -e.offsetY);

        // #perf
        requestAnimationFrame(function () {
            createRuler(target.scale * defaultRulerSizeInches, floatRuler);
            updateFloatRulerLabel(target.scale * defaultRulerSizeInches);
        });

    }

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
            } else {
            }
            args.setPromise(WinJS.UI.processAll().then(init));
        }
    };

    app.oncheckpoint = function (args) {
    };

    app.start();
})();
