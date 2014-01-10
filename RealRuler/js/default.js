(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nativePPI;
    var logicalPPI;
    var screenSize = 13;

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

        touchCanvas.onpointerdown = pointerDown;
        touchCanvas.onpointermove = updateFloatRuler;
        touchCanvas.onpointerup = pointerUp;

        loadDisplayInfo();
        window.onresize = loadDisplayInfo;
    }

    function loadDisplayInfo() {
        var info = Windows.Graphics.Display.DisplayInformation.getForCurrentView();
        nativePPI = info.rawDpiX;
        logicalPPI = nativePPI * 100 / info.resolutionScale;
        var screenSizeX = window.screen.width / logicalPPI;
        var screenSizeY = window.screen.height / logicalPPI;
        screenSize = Math.sqrt(screenSizeX * screenSizeX + screenSizeY * screenSizeY);

        updateSettingsInfo(screenSize);

        createRuler(100, edgeRuler, true);
    }

    function updateSettingsInfo(screenSize) {
        screenSizeLabel.innerText = screenSize.toFixed(1) + " inches";
    }

    function pointerDown(e) {
        pointers.push(e);
        updateFloatRuler();

        if (!window.localStorage.noTutorial && pointers.length >= 2) {
            WinJS.Utilities.removeClass(touchCanvas, "howTo");
            window.localStorage.noTutorial = true;
        }

    }

    function pointerUp(e) {
        pointers.splice(pointers.indexOf(e), 1);
    }

    function updateFloatRuler() {
        if (pointers.length >= 2 && pointers[0].currentPoint.isInContact && pointers[1].currentPoint.isInContact) {
            var opp = pointers[1].currentPoint.position.y - pointers[0].currentPoint.position.y;
            var adj = pointers[1].currentPoint.position.x - pointers[0].currentPoint.position.x;

            // The left pointer should always be first
            if (adj < 0) {
                pointers = [pointers[1], pointers[0]];
                opp = pointers[1].currentPoint.position.y - pointers[0].currentPoint.position.y;
                adj = pointers[1].currentPoint.position.x - pointers[0].currentPoint.position.x;
            }

            var angleBetweenPoints = Math.atan(opp / adj);
            var distanceBetweenPoints = opp / Math.sin(angleBetweenPoints) - fingerWidth;

            // #perf
            requestAnimationFrame(function () {
                createRuler(distanceBetweenPoints / logicalPPI, floatRuler);
                updateFloatRulerLabel(distanceBetweenPoints / logicalPPI);
            });

            floatRuler.style.transform = "translateX(" + (pointers[0].currentPoint.position.x + fingerWidth / 2) + "px) "
                + "translateY(" + (pointers[0].currentPoint.position.y - (rulerHeight / 2)) + "px) "
                + "rotate(" + angleBetweenPoints + "rad)";
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
