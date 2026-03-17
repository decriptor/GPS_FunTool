// ============================================================
// GPS Explorer — Interactive Learning App
// All data is hardcoded / computed locally (no user input XSS risk)
// ============================================================

(function () {
    "use strict";

    // ── Helper: safe text setter ────────────────────────────
    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    function setColor(id, color) {
        var el = document.getElementById(id);
        if (el) el.style.color = color;
    }
    function setWidth(id, pct) {
        var el = document.getElementById(id);
        if (el) el.style.width = pct;
    }
    function setBackground(id, bg) {
        var el = document.getElementById(id);
        if (el) el.style.background = bg;
    }

    // ========================================================
    // STARS BACKGROUND
    // ========================================================
    (function () {
        var canvas = document.getElementById("stars-canvas");
        var ctx = canvas.getContext("2d");
        var stars = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight * 3;
            stars = [];
            for (var i = 0; i < 300; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 1.5 + 0.3,
                    a: Math.random() * 0.8 + 0.2,
                    twinkle: Math.random() * 0.02 + 0.005,
                    phase: Math.random() * Math.PI * 2,
                });
            }
        }

        function draw(t) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var alpha = s.a * (0.6 + 0.4 * Math.sin(t * s.twinkle + s.phase));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(200,220,255," + alpha + ")";
                ctx.fill();
            }
            requestAnimationFrame(draw);
        }

        resize();
        window.addEventListener("resize", resize);
        requestAnimationFrame(draw);
    })();

    // ========================================================
    // CONSTELLATION VISUALIZATION
    // ========================================================
    (function () {
        var canvas = document.getElementById("constellation-canvas");
        var ctx = canvas.getContext("2d");
        var animating = true;
        var showOrbits = true;
        var time = 0;

        var planeColors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#9b59b6", "#e17055"];
        var planeNames = ["A", "B", "C", "D", "E", "F"];
        var planeRAANs = ["0", "60", "120", "180", "240", "300"];
        var satellites = [];
        var PLANES = 6;
        var SATS_PER_PLANE = 5;

        // Build plane legend using safe DOM methods
        var legendContainer = document.getElementById("plane-legend");
        for (var p = 0; p < PLANES; p++) {
            var row = document.createElement("div");
            row.className = "flex items-center gap-3";
            var dot = document.createElement("div");
            dot.className = "w-3 h-3 rounded-full";
            dot.style.background = planeColors[p];
            var label = document.createElement("span");
            label.className = "text-xs text-gray-300";
            label.textContent = "Plane " + planeNames[p] + " \u2014 RAAN " + planeRAANs[p] + "\u00B0";
            row.appendChild(dot);
            row.appendChild(label);
            legendContainer.appendChild(row);
        }

        // Initialize satellites
        for (var pp = 0; pp < PLANES; pp++) {
            for (var s = 0; s < SATS_PER_PLANE; s++) {
                satellites.push({
                    plane: pp,
                    angle: (s / SATS_PER_PLANE) * Math.PI * 2 + pp * 0.3,
                    speed: 0.0003 + Math.random() * 0.0001,
                    color: planeColors[pp],
                    name: "PRN " + (pp * SATS_PER_PLANE + s + 1),
                });
            }
        }

        function getCanvasSize() {
            var rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            return { w: rect.width, h: rect.height };
        }

        function draw() {
            var size = getCanvasSize();
            var w = size.w, h = size.h;
            var cx = w / 2, cy = h / 2;
            var earthR = Math.min(w, h) * 0.1;
            var orbitR = Math.min(w, h) * 0.38;

            ctx.clearRect(0, 0, w, h);

            // Orbital rings
            if (showOrbits) {
                for (var pl = 0; pl < PLANES; pl++) {
                    var tilt = (pl / PLANES) * Math.PI;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, orbitR, orbitR * 0.4, tilt, 0, Math.PI * 2);
                    ctx.strokeStyle = planeColors[pl] + "30";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            // Earth
            var earthGrad = ctx.createRadialGradient(cx - earthR * 0.3, cy - earthR * 0.3, earthR * 0.1, cx, cy, earthR);
            earthGrad.addColorStop(0, "#4da6ff");
            earthGrad.addColorStop(0.5, "#1a7adb");
            earthGrad.addColorStop(1, "#0d3b6e");
            ctx.beginPath();
            ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
            ctx.fillStyle = earthGrad;
            ctx.fill();

            // Simple landmasses
            ctx.fillStyle = "#2d8a4e";
            ctx.beginPath();
            ctx.ellipse(cx - earthR * 0.2, cy - earthR * 0.1, earthR * 0.25, earthR * 0.15, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + earthR * 0.3, cy + earthR * 0.15, earthR * 0.15, earthR * 0.2, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Earth glow
            ctx.beginPath();
            ctx.arc(cx, cy, earthR + 5, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(77, 166, 255, 0.3)";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Satellites
            var visibleCount = 0;
            for (var si = 0; si < satellites.length; si++) {
                var sat = satellites[si];
                var tiltAngle = (sat.plane / PLANES) * Math.PI;
                var angle = sat.angle + time * sat.speed;
                var x = cx + orbitR * Math.cos(angle) * Math.cos(tiltAngle) - orbitR * 0.4 * Math.sin(angle) * Math.sin(tiltAngle);
                var y = cy + orbitR * Math.cos(angle) * Math.sin(tiltAngle) + orbitR * 0.4 * Math.sin(angle) * Math.cos(tiltAngle);

                var distFromCenter = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
                if (distFromCenter > earthR + 10) visibleCount++;

                // Signal line
                if (distFromCenter > earthR + 10) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(cx, cy);
                    ctx.strokeStyle = sat.color + "15";
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }

                // Dot
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = sat.color;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = sat.color + "30";
                ctx.fill();
            }

            setText("visible-count", String(visibleCount));

            if (animating) {
                time++;
                requestAnimationFrame(draw);
            }
        }

        draw();

        document.getElementById("toggle-anim").addEventListener("click", function () {
            animating = !animating;
            this.textContent = animating ? "Pause" : "Play";
            if (animating) draw();
        });

        document.getElementById("toggle-orbits").addEventListener("click", function () {
            showOrbits = !showOrbits;
            if (!animating) draw();
        });
    })();

    // ========================================================
    // TRILATERATION DEMO
    // ========================================================
    (function () {
        var canvas = document.getElementById("trilat-canvas");
        var ctx = canvas.getContext("2d");
        var dragging = null;

        var satColors = ["#ff6b6b", "#4d96ff", "#6bcb77", "#ffd93d", "#9b59b6", "#e17055"];

        var sats = [
            { x: 150, y: 150, r: 180, color: satColors[0], name: "Sat A" },
            { x: 450, y: 120, r: 200, color: satColors[1], name: "Sat B" },
            { x: 300, y: 400, r: 170, color: satColors[2], name: "Sat C" },
        ];

        function getCanvasSize() {
            var rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            return { w: rect.width, h: rect.height };
        }

        function findIntersection() {
            if (sats.length < 2) return null;
            var px = 0, py = 0;
            for (var i = 0; i < sats.length; i++) { px += sats[i].x; py += sats[i].y; }
            px /= sats.length; py /= sats.length;

            for (var iter = 0; iter < 200; iter++) {
                var gx = 0, gy = 0;
                for (var j = 0; j < sats.length; j++) {
                    var dx = px - sats[j].x, dy = py - sats[j].y;
                    var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
                    var err = dist - sats[j].r;
                    gx += err * (dx / dist);
                    gy += err * (dy / dist);
                }
                px -= gx * 0.1;
                py -= gy * 0.1;
            }

            var totalErr = 0;
            for (var k = 0; k < sats.length; k++) {
                var ddx = px - sats[k].x, ddy = py - sats[k].y;
                totalErr += Math.abs(Math.sqrt(ddx * ddx + ddy * ddy) - sats[k].r);
            }

            return { x: px, y: py, error: totalErr / sats.length };
        }

        function updateControls() {
            var container = document.getElementById("sat-controls");
            while (container.firstChild) container.removeChild(container.firstChild);

            for (var i = 0; i < sats.length; i++) {
                (function (idx) {
                    var s = sats[idx];
                    var div = document.createElement("div");
                    div.className = "flex items-center gap-3";

                    var colorDot = document.createElement("div");
                    colorDot.className = "w-4 h-4 rounded-full flex-shrink-0";
                    colorDot.style.background = s.color;

                    var inner = document.createElement("div");
                    inner.className = "flex-1";

                    var labelDiv = document.createElement("div");
                    labelDiv.className = "text-xs text-gray-300 font-medium mb-1";
                    labelDiv.textContent = s.name + " \u2014 Range: " + Math.round(s.r);

                    var slider = document.createElement("input");
                    slider.type = "range";
                    slider.min = "50";
                    slider.max = "350";
                    slider.value = String(s.r);
                    slider.className = "range-slider";
                    slider.addEventListener("input", function () {
                        sats[idx].r = +this.value;
                        draw();
                    });

                    inner.appendChild(labelDiv);
                    inner.appendChild(slider);

                    div.appendChild(colorDot);
                    div.appendChild(inner);

                    if (sats.length > 2) {
                        var removeBtn = document.createElement("button");
                        removeBtn.className = "text-red-400 text-xs hover:text-red-300";
                        removeBtn.textContent = "\u2715";
                        removeBtn.addEventListener("click", function () {
                            sats.splice(idx, 1);
                            updateControls();
                            draw();
                        });
                        div.appendChild(removeBtn);
                    }

                    container.appendChild(div);
                })(i);
            }
        }

        function draw() {
            var size = getCanvasSize();
            var w = size.w, h = size.h;

            ctx.clearRect(0, 0, w, h);

            // Grid
            ctx.strokeStyle = "rgba(255,255,255,0.03)";
            ctx.lineWidth = 1;
            for (var gx = 0; gx < w; gx += 50) {
                ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
            }
            for (var gy = 0; gy < h; gy += 50) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
            }

            // Range circles
            for (var i = 0; i < sats.length; i++) {
                var s = sats[i];
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = s.color + "10";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.strokeStyle = s.color + "60";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Intersection
            var result = findIntersection();
            var resultEl = document.getElementById("trilat-result");

            if (result && result.error < 30) {
                // Intersection dot
                ctx.beginPath();
                ctx.arc(result.x, result.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(result.x, result.y, 14, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255,255,255,0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Lines to sats
                for (var li = 0; li < sats.length; li++) {
                    ctx.beginPath();
                    ctx.moveTo(result.x, result.y);
                    ctx.lineTo(sats[li].x, sats[li].y);
                    ctx.strokeStyle = sats[li].color + "40";
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Update result display
                while (resultEl.firstChild) resultEl.removeChild(resultEl.firstChild);
                var posDiv = document.createElement("div");
                posDiv.className = "text-gps-300 font-mono text-lg";
                posDiv.textContent = "(" + Math.round(result.x) + ", " + Math.round(result.y) + ")";
                var errDiv = document.createElement("div");
                errDiv.className = "text-xs text-gray-500 mt-1";
                errDiv.textContent = "Residual error: " + result.error.toFixed(1) + "px";
                var statusDiv = document.createElement("div");
                statusDiv.className = "text-xs mt-2 " + (sats.length >= 3 ? "text-green-400" : "text-yellow-400");
                statusDiv.textContent = sats.length >= 3 ? "\u2713 Unique solution (3+ satellites)" : "\u26A0 Ambiguous (need 3+ satellites)";
                resultEl.appendChild(posDiv);
                resultEl.appendChild(errDiv);
                resultEl.appendChild(statusDiv);
            } else {
                while (resultEl.firstChild) resultEl.removeChild(resultEl.firstChild);
                var noResult = document.createElement("div");
                noResult.className = "text-yellow-400 text-sm";
                noResult.textContent = "No intersection found";
                var hint = document.createElement("div");
                hint.className = "text-xs text-gray-500 mt-1";
                hint.textContent = "Adjust satellite positions or ranges";
                resultEl.appendChild(noResult);
                resultEl.appendChild(hint);
            }

            // Satellite dots (on top)
            for (var si = 0; si < sats.length; si++) {
                var sat = sats[si];
                ctx.beginPath();
                ctx.arc(sat.x, sat.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = sat.color;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sat.x, sat.y, 14, 0, Math.PI * 2);
                ctx.strokeStyle = sat.color + "50";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.font = "11px Inter, sans-serif";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(sat.name, sat.x, sat.y - 18);
            }
        }

        // Mouse drag
        canvas.addEventListener("mousedown", function (e) {
            var rect = canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left, my = e.clientY - rect.top;
            for (var i = 0; i < sats.length; i++) {
                if (Math.hypot(mx - sats[i].x, my - sats[i].y) < 15) { dragging = i; break; }
            }
        });
        canvas.addEventListener("mousemove", function (e) {
            if (dragging !== null) {
                var rect = canvas.getBoundingClientRect();
                sats[dragging].x = e.clientX - rect.left;
                sats[dragging].y = e.clientY - rect.top;
                draw();
                updateControls();
            }
        });
        canvas.addEventListener("mouseup", function () { dragging = null; });
        canvas.addEventListener("mouseleave", function () { dragging = null; });

        // Touch drag
        canvas.addEventListener("touchstart", function (e) {
            var rect = canvas.getBoundingClientRect();
            var t = e.touches[0];
            var mx = t.clientX - rect.left, my = t.clientY - rect.top;
            for (var i = 0; i < sats.length; i++) {
                if (Math.hypot(mx - sats[i].x, my - sats[i].y) < 25) { dragging = i; break; }
            }
            if (dragging !== null) e.preventDefault();
        }, { passive: false });
        canvas.addEventListener("touchmove", function (e) {
            if (dragging !== null) {
                e.preventDefault();
                var rect = canvas.getBoundingClientRect();
                var t = e.touches[0];
                sats[dragging].x = t.clientX - rect.left;
                sats[dragging].y = t.clientY - rect.top;
                draw();
                updateControls();
            }
        }, { passive: false });
        canvas.addEventListener("touchend", function () { dragging = null; });

        document.getElementById("add-satellite").addEventListener("click", function () {
            if (sats.length >= 6) return;
            var rect = canvas.getBoundingClientRect();
            sats.push({
                x: 100 + Math.random() * (rect.width - 200),
                y: 100 + Math.random() * (rect.height - 200),
                r: 120 + Math.random() * 100,
                color: satColors[sats.length % satColors.length],
                name: "Sat " + String.fromCharCode(65 + sats.length),
            });
            updateControls();
            draw();
        });

        document.getElementById("reset-trilat").addEventListener("click", function () {
            sats = [
                { x: 150, y: 150, r: 180, color: satColors[0], name: "Sat A" },
                { x: 450, y: 120, r: 200, color: satColors[1], name: "Sat B" },
                { x: 300, y: 400, r: 170, color: satColors[2], name: "Sat C" },
            ];
            updateControls();
            draw();
        });

        updateControls();
        draw();
        window.addEventListener("resize", draw);
    })();

    // ========================================================
    // SIGNAL TIMING CHART
    // ========================================================
    (function () {
        var chart = echarts.init(document.getElementById("signal-chart"));
        var C = 299792.458; // km/s

        function update() {
            var dist = +document.getElementById("sat-distance").value;
            var clockErr = +document.getElementById("clock-error").value;

            var trueTime = dist / C;
            var clockErrSec = clockErr * 1e-9;
            var measuredTime = trueTime + clockErrSec;
            var pseudoRange = measuredTime * C;
            var posError = Math.abs(clockErr * 0.299792458);

            setText("dist-label", dist.toLocaleString() + " km");
            setText("clock-err-label", clockErr + " ns");
            setText("travel-time", (trueTime * 1000).toFixed(3) + " ms");
            setText("measured-time", (measuredTime * 1000).toFixed(3) + " ms");
            setText("true-range", dist.toLocaleString() + " km");
            setText("pseudo-range", pseudoRange.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " km");

            setText("pos-error", posError.toFixed(1) + " m");
            var errEl = document.getElementById("pos-error");
            errEl.className = "font-mono font-semibold " + (posError < 1 ? "text-green-400" : posError < 10 ? "text-yellow-400" : "text-red-400");

            // Waveform data
            var n = 200;
            var xData = [], transmitted = [], received = [];
            var delayFrac = trueTime * 50;

            for (var i = 0; i < n; i++) {
                var t = (i / n) * 10;
                xData.push(t.toFixed(2));
                var code = Math.sin(t * 15) > 0 ? 1 : -1;
                transmitted.push(code);
                var tDelayed = t - delayFrac * 0.1;
                var codeDelayed = Math.sin(tDelayed * 15) > 0 ? 1 : -1;
                received.push(codeDelayed * 0.7);
            }

            chart.setOption({
                backgroundColor: "transparent",
                title: {
                    text: "GPS Signal Propagation",
                    textStyle: { color: "#9ca3af", fontSize: 12, fontWeight: 500, fontFamily: "Inter" },
                    left: 0, top: 0,
                },
                tooltip: { trigger: "axis" },
                legend: {
                    data: ["Transmitted (Satellite)", "Received (Ground)"],
                    textStyle: { color: "#6b7280", fontSize: 11 },
                    top: 25,
                },
                grid: { top: 65, right: 20, bottom: 35, left: 50 },
                xAxis: {
                    type: "category", data: xData,
                    axisLine: { lineStyle: { color: "#374151" } },
                    axisLabel: { color: "#6b7280", fontSize: 10 },
                    name: "Time (chips)", nameTextStyle: { color: "#6b7280", fontSize: 10 },
                    splitLine: { show: false },
                },
                yAxis: {
                    type: "value", min: -1.5, max: 1.5,
                    axisLine: { lineStyle: { color: "#374151" } },
                    axisLabel: { color: "#6b7280", fontSize: 10 },
                    splitLine: { lineStyle: { color: "#1f2937" } },
                },
                series: [
                    {
                        name: "Transmitted (Satellite)", type: "line", data: transmitted,
                        lineStyle: { color: "#3394ff", width: 2 }, itemStyle: { color: "#3394ff" },
                        showSymbol: false, step: "start",
                    },
                    {
                        name: "Received (Ground)", type: "line", data: received,
                        lineStyle: { color: "#ff6b6b", width: 2 }, itemStyle: { color: "#ff6b6b" },
                        showSymbol: false, step: "start",
                    },
                ],
                animation: false,
            });
        }

        document.getElementById("sat-distance").addEventListener("input", update);
        document.getElementById("clock-error").addEventListener("input", update);
        update();
        window.addEventListener("resize", function () { chart.resize(); });
    })();

    // ========================================================
    // ERROR SOURCES
    // ========================================================
    (function () {
        var errors = [
            { name: "Ionospheric Delay", value: 7.0, color: "#ff6b6b", desc: "Charged particles in the ionosphere (60-1000km) slow GPS signals. Dual-frequency receivers can correct ~99% of this error by comparing L1 and L2 signals.", enabled: true },
            { name: "Tropospheric Delay", value: 0.7, color: "#ffd93d", desc: "Temperature, pressure, and humidity in the lower atmosphere (0-12km) cause signal delays. Models like Saastamoinen can reduce this to ~0.2m.", enabled: true },
            { name: "Satellite Clock", value: 1.1, color: "#4d96ff", desc: "Despite onboard cesium/rubidium atomic clocks accurate to ~1ns, residual errors exist. Ground stations upload corrections every 2 hours.", enabled: true },
            { name: "Ephemeris Error", value: 0.8, color: "#6bcb77", desc: "Predicted satellite orbital positions have small errors. The ground control segment tracks satellites and computes corrections broadcast in the nav message.", enabled: true },
            { name: "Multipath", value: 1.4, color: "#9b59b6", desc: "Signals reflecting off buildings, terrain, or water arrive later than the direct signal, confusing the receiver. Worst in urban canyons.", enabled: true },
            { name: "Receiver Noise", value: 0.5, color: "#e17055", desc: "Thermal noise, signal processing limitations, and antenna quality contribute to measurement uncertainty in consumer-grade receivers.", enabled: true },
        ];

        var toggleContainer = document.getElementById("error-toggles");
        var chart = echarts.init(document.getElementById("error-chart"));

        function render() {
            // Build toggle cards safely
            while (toggleContainer.firstChild) toggleContainer.removeChild(toggleContainer.firstChild);

            for (var i = 0; i < errors.length; i++) {
                (function (idx) {
                    var err = errors[idx];
                    var card = document.createElement("div");
                    card.className = "bg-space-900/80 rounded-xl p-4 border cursor-pointer transition-all " + (err.enabled ? "border-white/10" : "border-white/5 opacity-40");

                    var row = document.createElement("div");
                    row.className = "flex items-center gap-3";

                    var checkBox = document.createElement("div");
                    checkBox.className = "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center";
                    checkBox.style.background = err.color + "20";
                    checkBox.style.border = "2px solid " + err.color;
                    if (err.enabled) {
                        checkBox.textContent = "\u2713";
                        checkBox.style.color = err.color;
                        checkBox.style.fontSize = "10px";
                        checkBox.style.fontWeight = "bold";
                    }

                    var content = document.createElement("div");
                    content.className = "flex-1 min-w-0";

                    var header = document.createElement("div");
                    header.className = "flex items-center justify-between";

                    var nameSpan = document.createElement("span");
                    nameSpan.className = "text-sm font-medium text-white";
                    nameSpan.textContent = err.name;

                    var valueSpan = document.createElement("span");
                    valueSpan.className = "text-sm font-mono font-semibold";
                    valueSpan.style.color = err.color;
                    valueSpan.textContent = "\u00B1" + err.value + "m";

                    header.appendChild(nameSpan);
                    header.appendChild(valueSpan);

                    var descP = document.createElement("p");
                    descP.className = "text-xs text-gray-500 mt-1 leading-relaxed";
                    descP.textContent = err.desc;

                    content.appendChild(header);
                    content.appendChild(descP);

                    row.appendChild(checkBox);
                    row.appendChild(content);
                    card.appendChild(row);

                    card.addEventListener("click", function () {
                        errors[idx].enabled = !errors[idx].enabled;
                        render();
                    });

                    toggleContainer.appendChild(card);
                })(i);
            }

            // Total error (RSS)
            var totalSquared = 0;
            var activeErrors = [];
            for (var j = 0; j < errors.length; j++) {
                if (errors[j].enabled) {
                    totalSquared += Math.pow(errors[j].value, 2);
                    activeErrors.push(errors[j]);
                }
            }
            var totalError = Math.sqrt(totalSquared);
            setText("total-error", totalError.toFixed(1) + " m");

            // Error budget bar
            var bar = document.getElementById("error-budget-bar");
            while (bar.firstChild) bar.removeChild(bar.firstChild);
            var legend = document.getElementById("error-legend");
            while (legend.firstChild) legend.removeChild(legend.firstChild);

            var totalSq = totalSquared || 1;
            for (var k = 0; k < activeErrors.length; k++) {
                var ae = activeErrors[k];
                var pct = (Math.pow(ae.value, 2) / totalSq) * 100;

                var seg = document.createElement("div");
                seg.className = "h-full transition-all duration-300";
                seg.style.width = pct + "%";
                seg.style.background = ae.color;
                bar.appendChild(seg);

                var legendItem = document.createElement("span");
                legendItem.className = "flex items-center gap-1.5 text-xs text-gray-400";
                var legDot = document.createElement("span");
                legDot.className = "w-2 h-2 rounded-full";
                legDot.style.background = ae.color;
                legendItem.appendChild(legDot);
                var pctLabel = pct < 1 ? "<1" : pct.toFixed(0);
                legendItem.appendChild(document.createTextNode(ae.name + " (" + pctLabel + "%)"));
                legend.appendChild(legendItem);
            }

            // Pie chart
            chart.setOption({
                backgroundColor: "transparent",
                title: {
                    text: "Error Contribution (Variance)",
                    textStyle: { color: "#9ca3af", fontSize: 12, fontWeight: 500, fontFamily: "Inter" },
                    left: "center", top: 0,
                },
                tooltip: { trigger: "item", formatter: "{b}: \u00B1{c}m ({d}%)" },
                series: [{
                    type: "pie", radius: ["40%", "70%"], center: ["50%", "55%"],
                    data: errors.map(function (e) {
                        return {
                            name: e.name,
                            value: e.enabled ? +Math.pow(e.value, 2).toFixed(2) : 0,
                            itemStyle: { color: e.enabled ? e.color : "#374151" },
                        };
                    }),
                    label: {
                        color: "#9ca3af", fontSize: 10,
                        formatter: function (p) {
                            // Hide labels for slices < 5% to avoid overlap
                            return p.percent >= 5 ? p.name + "\n" + p.percent.toFixed(0) + "%" : "";
                        },
                        alignTo: "labelLine",
                        overflow: "truncate",
                    },
                    labelLine: {
                        lineStyle: { color: "#4b5563" },
                        length: 12,
                        length2: 8,
                        showAbove: true,
                    },
                    labelLayout: { hideOverlap: true },
                    minShowLabelAngle: 15,
                    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.5)" } },
                }],
                animation: true,
            });
        }

        render();
        window.addEventListener("resize", function () { chart.resize(); });
    })();

    // ========================================================
    // DOP VISUALIZATION
    // ========================================================
    (function () {
        var canvas = document.getElementById("dop-canvas");
        var ctx = canvas.getContext("2d");
        var dragging = null;

        var dopSats = [
            { az: 45, el: 60, color: "#ff6b6b" },
            { az: 135, el: 45, color: "#4d96ff" },
            { az: 225, el: 50, color: "#6bcb77" },
            { az: 315, el: 70, color: "#ffd93d" },
        ];

        function getCanvasSize() {
            var rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            return { w: rect.width, h: rect.height };
        }

        function azElToXY(az, el, cx, cy, maxR) {
            var r = maxR * (1 - el / 90);
            var rad = (az - 90) * Math.PI / 180;
            return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
        }

        function xyToAzEl(x, y, cx, cy, maxR) {
            var dx = x - cx, dy = y - cy;
            var r = Math.sqrt(dx * dx + dy * dy);
            var el = Math.max(5, Math.min(89, 90 * (1 - r / maxR)));
            var az = Math.atan2(dy, dx) * 180 / Math.PI + 90;
            if (az < 0) az += 360;
            return { az: az, el: el };
        }

        function invert4x4(m) {
            var n = 4;
            var aug = [];
            for (var i = 0; i < n; i++) {
                var row = m[i].slice();
                for (var j = 0; j < n; j++) row.push(i === j ? 1 : 0);
                aug.push(row);
            }
            for (var col = 0; col < n; col++) {
                var maxRow = col;
                for (var row2 = col + 1; row2 < n; row2++)
                    if (Math.abs(aug[row2][col]) > Math.abs(aug[maxRow][col])) maxRow = row2;
                var tmp = aug[col]; aug[col] = aug[maxRow]; aug[maxRow] = tmp;
                if (Math.abs(aug[col][col]) < 1e-10) return null;
                var pivot = aug[col][col];
                for (var jj = 0; jj < 2 * n; jj++) aug[col][jj] /= pivot;
                for (var row3 = 0; row3 < n; row3++) {
                    if (row3 === col) continue;
                    var factor = aug[row3][col];
                    for (var jjj = 0; jjj < 2 * n; jjj++) aug[row3][jjj] -= factor * aug[col][jjj];
                }
            }
            return aug.map(function (r) { return r.slice(n); });
        }

        function computeDOP() {
            var satDirs = dopSats.map(function (s) {
                var elRad = s.el * Math.PI / 180;
                var azRad = s.az * Math.PI / 180;
                return {
                    x: Math.cos(elRad) * Math.sin(azRad),
                    y: Math.cos(elRad) * Math.cos(azRad),
                    z: Math.sin(elRad),
                };
            });

            var nn = satDirs.length;
            var H = satDirs.map(function (s) { return [s.x, s.y, s.z, 1]; });

            var HtH = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
            for (var i = 0; i < 4; i++)
                for (var j = 0; j < 4; j++)
                    for (var k = 0; k < nn; k++)
                        HtH[i][j] += H[k][i] * H[k][j];

            var inv = invert4x4(HtH);
            if (!inv) return null;

            return {
                gdop: Math.sqrt(inv[0][0] + inv[1][1] + inv[2][2] + inv[3][3]),
                pdop: Math.sqrt(inv[0][0] + inv[1][1] + inv[2][2]),
                hdop: Math.sqrt(inv[0][0] + inv[1][1]),
                vdop: Math.sqrt(inv[2][2]),
            };
        }

        function dopColor(val) {
            if (val <= 2) return "#22c55e";
            if (val <= 5) return "#3b82f6";
            if (val <= 10) return "#eab308";
            if (val <= 20) return "#f97316";
            return "#ef4444";
        }

        function draw() {
            var size = getCanvasSize();
            var w = size.w, h = size.h;
            var cx = w / 2, cy = h / 2;
            var maxR = Math.min(w, h) * 0.42;

            ctx.clearRect(0, 0, w, h);

            // Elevation rings
            for (var el = 0; el <= 90; el += 15) {
                var r = maxR * (1 - el / 90);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255,255,255,0.08)";
                ctx.lineWidth = 1;
                ctx.stroke();
                if (el > 0 && el < 90) {
                    ctx.font = "10px Inter";
                    ctx.fillStyle = "#4b5563";
                    ctx.textAlign = "center";
                    ctx.fillText(el + "\u00B0", cx, cy - r + 12);
                }
            }

            // Azimuth lines
            for (var az = 0; az < 360; az += 45) {
                var rad = (az - 90) * Math.PI / 180;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + maxR * Math.cos(rad), cy + maxR * Math.sin(rad));
                ctx.strokeStyle = "rgba(255,255,255,0.05)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Labels
            ctx.font = "12px Inter";
            ctx.fillStyle = "#6b7280";
            ctx.textAlign = "center";
            ctx.fillText("N", cx, cy - maxR - 8);
            ctx.fillText("S", cx, cy + maxR + 16);
            ctx.fillText("E", cx + maxR + 12, cy + 4);
            ctx.fillText("W", cx - maxR - 12, cy + 4);

            ctx.font = "10px Inter";
            ctx.fillStyle = "#374151";
            ctx.fillText("Horizon (0\u00B0)", cx, cy + maxR - 4);
            ctx.fillText("Zenith (90\u00B0)", cx, cy + 12);

            // Uncertainty ellipse
            var dop = computeDOP();
            if (dop) {
                var uere = 6;
                var hRadius = Math.min(dop.hdop * uere * 2, maxR * 0.8);
                var vRadius = Math.min(dop.vdop * uere * 2, maxR * 0.8);

                ctx.beginPath();
                ctx.ellipse(cx, cy, hRadius, Math.min(hRadius, vRadius * 0.5), 0, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(51,148,255,0.08)";
                ctx.fill();
                ctx.strokeStyle = "rgba(51,148,255,0.3)";
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                var keys = ["gdop", "pdop", "hdop", "vdop"];
                for (var ki = 0; ki < keys.length; ki++) {
                    var key = keys[ki];
                    var val = dop[key];
                    setText(key + "-val", val.toFixed(2));
                    setColor(key + "-val", dopColor(val));
                    setWidth(key + "-bar", Math.min(val / 20 * 100, 100) + "%");
                    setBackground(key + "-bar", dopColor(val));
                }

                var acc = (dop.hdop * 6).toFixed(1);
                setText("dop-accuracy", "\u00B1" + acc + "m");
                setColor("dop-accuracy", dopColor(dop.hdop));
            }

            // Satellites
            for (var si = 0; si < dopSats.length; si++) {
                var sat = dopSats[si];
                var pos = azElToXY(sat.az, sat.el, cx, cy, maxR);

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(pos.x, pos.y);
                ctx.strokeStyle = sat.color + "30";
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = sat.color;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
                ctx.strokeStyle = sat.color + "50";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.font = "10px JetBrains Mono";
                ctx.fillStyle = "#d1d5db";
                ctx.textAlign = "center";
                ctx.fillText("SV" + (si + 1), pos.x, pos.y - 18);
                ctx.font = "9px JetBrains Mono";
                ctx.fillStyle = "#6b7280";
                ctx.fillText(Math.round(sat.az) + "\u00B0/" + Math.round(sat.el) + "\u00B0", pos.x, pos.y + 24);
            }
        }

        // Mouse drag
        canvas.addEventListener("mousedown", function (e) {
            var rect = canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left, my = e.clientY - rect.top;
            var cxr = rect.width / 2, cyr = rect.height / 2;
            var maxRR = Math.min(rect.width, rect.height) * 0.42;
            for (var i = 0; i < dopSats.length; i++) {
                var pos = azElToXY(dopSats[i].az, dopSats[i].el, cxr, cyr, maxRR);
                if (Math.hypot(mx - pos.x, my - pos.y) < 18) { dragging = i; break; }
            }
        });
        canvas.addEventListener("mousemove", function (e) {
            if (dragging !== null) {
                var rect = canvas.getBoundingClientRect();
                var mx = e.clientX - rect.left, my = e.clientY - rect.top;
                var cxr = rect.width / 2, cyr = rect.height / 2;
                var maxRR = Math.min(rect.width, rect.height) * 0.42;
                var ae = xyToAzEl(mx, my, cxr, cyr, maxRR);
                dopSats[dragging].az = ae.az;
                dopSats[dragging].el = ae.el;
                draw();
            }
        });
        canvas.addEventListener("mouseup", function () { dragging = null; });
        canvas.addEventListener("mouseleave", function () { dragging = null; });

        // Touch
        canvas.addEventListener("touchstart", function (e) {
            var rect = canvas.getBoundingClientRect();
            var t = e.touches[0];
            var mx = t.clientX - rect.left, my = t.clientY - rect.top;
            var cxr = rect.width / 2, cyr = rect.height / 2;
            var maxRR = Math.min(rect.width, rect.height) * 0.42;
            for (var i = 0; i < dopSats.length; i++) {
                var pos = azElToXY(dopSats[i].az, dopSats[i].el, cxr, cyr, maxRR);
                if (Math.hypot(mx - pos.x, my - pos.y) < 25) { dragging = i; break; }
            }
            if (dragging !== null) e.preventDefault();
        }, { passive: false });
        canvas.addEventListener("touchmove", function (e) {
            if (dragging !== null) {
                e.preventDefault();
                var rect = canvas.getBoundingClientRect();
                var t = e.touches[0];
                var mx = t.clientX - rect.left, my = t.clientY - rect.top;
                var cxr = rect.width / 2, cyr = rect.height / 2;
                var maxRR = Math.min(rect.width, rect.height) * 0.42;
                var ae = xyToAzEl(mx, my, cxr, cyr, maxRR);
                dopSats[dragging].az = ae.az;
                dopSats[dragging].el = ae.el;
                draw();
            }
        }, { passive: false });
        canvas.addEventListener("touchend", function () { dragging = null; });

        draw();
        window.addEventListener("resize", draw);
    })();

    // ========================================================
    // COORDINATE SYSTEMS
    // ========================================================
    (function () {
        var chart = echarts.init(document.getElementById("coord-map"));
        var mapReady = false;
        var WORLD_JSON_URL = "https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json";

        var selectedLat = 40.7128, selectedLng = -74.006;

        function toDMS(deg, pos, neg) {
            var abs = Math.abs(deg);
            var d = Math.floor(abs);
            var m = Math.floor((abs - d) * 60);
            var s = ((abs - d) * 60 - m) * 60;
            return d + "\u00B0" + m + "'" + s.toFixed(1) + '"' + (deg >= 0 ? pos : neg);
        }

        function updateCoords(lat, lng) {
            selectedLat = lat;
            selectedLng = lng;

            setText("coord-lat", lat.toFixed(4) + "\u00B0");
            setText("coord-lng", lng.toFixed(4) + "\u00B0");
            setText("coord-dms", toDMS(lat, "N", "S") + " " + toDMS(lng, "E", "W"));

            // ECEF
            var a = 6378137.0;
            var f = 1 / 298.257223563;
            var e2 = 2 * f - f * f;
            var latRad = lat * Math.PI / 180;
            var lngRad = lng * Math.PI / 180;
            var N = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(latRad), 2));
            var X = N * Math.cos(latRad) * Math.cos(lngRad);
            var Y = N * Math.cos(latRad) * Math.sin(lngRad);
            var Z = N * (1 - e2) * Math.sin(latRad);

            setText("coord-x", Math.round(X).toLocaleString() + " m");
            setText("coord-y", Math.round(Y).toLocaleString() + " m");
            setText("coord-z", Math.round(Z).toLocaleString() + " m");

            // UTM (simplified)
            var zone = Math.floor((lng + 180) / 6) + 1;
            var zoneLetter = lat >= 0 ? "N" : "S";
            var k0 = 0.9996;
            var lngOrigin = (zone - 1) * 6 - 180 + 3;
            var lngOriginRad = lngOrigin * Math.PI / 180;
            var eccPrime = e2 / (1 - e2);
            var Nn = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(latRad), 2));
            var T = Math.pow(Math.tan(latRad), 2);
            var C = eccPrime * Math.pow(Math.cos(latRad), 2);
            var A2 = Math.cos(latRad) * (lngRad - lngOriginRad);
            var M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64) * latRad - (3 * e2 / 8 + 3 * e2 * e2 / 32) * Math.sin(2 * latRad) + (15 * e2 * e2 / 256) * Math.sin(4 * latRad));
            var easting = k0 * Nn * (A2 + (1 - T + C) * Math.pow(A2, 3) / 6) + 500000;
            var northing = k0 * (M + Nn * Math.tan(latRad) * (Math.pow(A2, 2) / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A2, 4) / 24)) + (lat < 0 ? 10000000 : 0);

            setText("coord-zone", zone + zoneLetter);
            setText("coord-easting", Math.round(easting).toLocaleString() + " m");
            setText("coord-northing", Math.round(northing).toLocaleString() + " m");

            renderMap();
        }

        var cities = [
            { name: "New York", value: [-74.0, 40.7] },
            { name: "London", value: [-0.1, 51.5] },
            { name: "Tokyo", value: [139.7, 35.7] },
            { name: "Sydney", value: [151.2, -33.9] },
            { name: "Rio", value: [-43.2, -22.9] },
            { name: "Moscow", value: [37.6, 55.8] },
            { name: "Delhi", value: [77.2, 28.6] },
            { name: "Beijing", value: [116.4, 39.9] },
            { name: "Cairo", value: [31.2, 30.0] },
            { name: "Lagos", value: [3.4, 6.5] },
        ];

        function renderMap() {
            if (!mapReady) return;
            chart.setOption({
                backgroundColor: "transparent",
                title: {
                    text: "Click to Select Location",
                    textStyle: { color: "#6b7280", fontSize: 11, fontWeight: 400, fontFamily: "Inter" },
                    left: "center", top: 5,
                },
                tooltip: {
                    trigger: "item",
                    formatter: function (p) {
                        if (p.seriesType === "effectScatter") return "Selected: " + selectedLat.toFixed(4) + "\u00B0, " + selectedLng.toFixed(4) + "\u00B0";
                        if (p.seriesType === "scatter") return p.name;
                        if (p.name) return p.name;
                        return null;
                    },
                },
                geo: {
                    map: "world",
                    roam: true,
                    center: [selectedLng, selectedLat],
                    zoom: 1.5,
                    scaleLimit: { min: 1, max: 20 },
                    silent: false,
                    itemStyle: {
                        areaColor: "#142240",
                        borderColor: "#1e3a5f",
                        borderWidth: 0.6,
                    },
                    emphasis: {
                        itemStyle: {
                            areaColor: "#1a3352",
                            borderColor: "#3394ff",
                            borderWidth: 1,
                        },
                        label: { show: true, color: "#8ed1ff", fontSize: 10 },
                    },
                    label: { show: false },
                },
                series: [
                    {
                        type: "scatter",
                        coordinateSystem: "geo",
                        data: cities,
                        symbolSize: 6,
                        itemStyle: { color: "#4b5563", borderColor: "#6b7280", borderWidth: 1 },
                        label: {
                            show: true,
                            formatter: function (p) { return p.name; },
                            position: "right",
                            color: "#6b7280",
                            fontSize: 9,
                        },
                    },
                    {
                        type: "effectScatter",
                        coordinateSystem: "geo",
                        data: [{ value: [selectedLng, selectedLat], name: "Selected" }],
                        symbolSize: 14,
                        itemStyle: { color: "#3394ff", shadowBlur: 10, shadowColor: "#3394ff" },
                        rippleEffect: { brushType: "stroke", scale: 4, period: 3 },
                        zlevel: 1,
                    },
                ],
            });
        }

        // Click handler for the geo map
        chart.on("click", function (params) {
            if (params.componentType === "geo" || params.componentType === "series") {
                // Convert pixel to geo coordinate
                var pixel = [params.event.offsetX, params.event.offsetY];
                var coord = chart.convertFromPixel("geo", pixel);
                if (coord && coord.length === 2) {
                    var lng = Math.max(-180, Math.min(180, coord[0]));
                    var lat = Math.max(-90, Math.min(90, coord[1]));
                    updateCoords(lat, lng);
                }
            }
        });

        // Also handle clicking on empty geo area
        chart.getZr().on("click", function (params) {
            var pixel = [params.offsetX, params.offsetY];
            var coord = chart.convertFromPixel("geo", pixel);
            if (coord && coord.length === 2 && isFinite(coord[0]) && isFinite(coord[1])) {
                var lng = Math.max(-180, Math.min(180, coord[0]));
                var lat = Math.max(-90, Math.min(90, coord[1]));
                updateCoords(lat, lng);
            }
        });

        // Fetch world GeoJSON and init the map
        chart.showLoading({ text: "Loading world map...", color: "#3394ff", textColor: "#6b7280", maskColor: "rgba(10,14,26,0.8)" });

        function onMapLoaded(worldJson) {
            try {
                echarts.registerMap("world", worldJson);
                mapReady = true;
                chart.hideLoading();
                updateCoords(selectedLat, selectedLng);
            } catch (e) {
                onMapError();
            }
        }
        function onMapError() {
            chart.hideLoading();
            chart.setOption({
                backgroundColor: "transparent",
                title: {
                    text: "Could not load world map.",
                    textStyle: { color: "#6b7280", fontSize: 11 },
                    left: "center", top: "middle",
                },
            });
        }

        // Use XMLHttpRequest for reliability (fetch can silently fail in some contexts)
        var xhr = new XMLHttpRequest();
        xhr.open("GET", WORLD_JSON_URL, true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var json = JSON.parse(xhr.responseText);
                    onMapLoaded(json);
                } catch (e) { onMapError(); }
            } else { onMapError(); }
        };
        xhr.onerror = onMapError;
        xhr.send();

        // Expose for My Location module
        window._gpsExplorer = window._gpsExplorer || {};
        window._gpsExplorer.updateCoords = updateCoords;

        // "Use My Location" button in coordinate section
        document.getElementById("use-my-location-btn").addEventListener("click", function () {
            var statusEl = document.getElementById("geoloc-status");
            if (!navigator.geolocation) {
                statusEl.textContent = "Geolocation not supported by this browser";
                statusEl.style.color = "#ef4444";
                return;
            }
            statusEl.textContent = "Requesting location...";
            statusEl.style.color = "#eab308";
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    updateCoords(pos.coords.latitude, pos.coords.longitude);
                    statusEl.textContent = "Location acquired (\u00B1" + pos.coords.accuracy.toFixed(0) + "m)";
                    statusEl.style.color = "#22c55e";
                },
                function (err) {
                    statusEl.textContent = "Error: " + err.message;
                    statusEl.style.color = "#ef4444";
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });

        updateCoords(40.7128, -74.006);
        window.addEventListener("resize", function () { chart.resize(); });
    })();

    // ========================================================
    // MY LOCATION — LIVE GPS DETAILS
    // ========================================================
    (function () {
        var accCanvas = document.getElementById("accuracy-canvas");
        var accCtx = accCanvas ? accCanvas.getContext("2d") : null;
        var historyChart = null;
        var historyChartEl = document.getElementById("history-chart");
        if (historyChartEl) historyChart = echarts.init(historyChartEl);

        var watchId = null;
        var isWatching = false;
        var fixHistory = []; // { time, lat, lng, accuracy, altitude }

        var WGS84_A = 6378137.0;
        var WGS84_F = 1 / 298.257223563;
        var WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F;

        // GPS epoch: Jan 6 1980 00:00:00 UTC
        var GPS_EPOCH = Date.UTC(1980, 0, 6, 0, 0, 0);

        function toDMS(deg, pos, neg) {
            var abs = Math.abs(deg);
            var d = Math.floor(abs);
            var m = Math.floor((abs - d) * 60);
            var s = ((abs - d) * 60 - m) * 60;
            return d + "\u00B0" + m + "'" + s.toFixed(1) + '"' + (deg >= 0 ? pos : neg);
        }

        function toECEF(lat, lng, alt) {
            var latRad = lat * Math.PI / 180;
            var lngRad = lng * Math.PI / 180;
            var h = alt || 0;
            var N = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.pow(Math.sin(latRad), 2));
            return {
                x: (N + h) * Math.cos(latRad) * Math.cos(lngRad),
                y: (N + h) * Math.cos(latRad) * Math.sin(lngRad),
                z: (N * (1 - WGS84_E2) + h) * Math.sin(latRad),
            };
        }

        function toUTM(lat, lng) {
            var zone = Math.floor((lng + 180) / 6) + 1;
            var zoneLetter = lat >= 0 ? "N" : "S";
            var k0 = 0.9996;
            var latRad = lat * Math.PI / 180;
            var lngOrigin = (zone - 1) * 6 - 180 + 3;
            var lngOriginRad = lngOrigin * Math.PI / 180;
            var eccPrime = WGS84_E2 / (1 - WGS84_E2);
            var Nn = WGS84_A / Math.sqrt(1 - WGS84_E2 * Math.pow(Math.sin(latRad), 2));
            var T = Math.pow(Math.tan(latRad), 2);
            var C = eccPrime * Math.pow(Math.cos(latRad), 2);
            var lngRad = lng * Math.PI / 180;
            var A2 = Math.cos(latRad) * (lngRad - lngOriginRad);
            var M = WGS84_A * ((1 - WGS84_E2 / 4 - 3 * WGS84_E2 * WGS84_E2 / 64) * latRad - (3 * WGS84_E2 / 8 + 3 * WGS84_E2 * WGS84_E2 / 32) * Math.sin(2 * latRad) + (15 * WGS84_E2 * WGS84_E2 / 256) * Math.sin(4 * latRad));
            var easting = k0 * Nn * (A2 + (1 - T + C) * Math.pow(A2, 3) / 6) + 500000;
            var northing = k0 * (M + Nn * Math.tan(latRad) * (Math.pow(A2, 2) / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A2, 4) / 24)) + (lat < 0 ? 10000000 : 0);
            return { zone: zone + zoneLetter, easting: easting, northing: northing };
        }

        function accuracyColor(meters) {
            if (meters <= 5) return "#22c55e";
            if (meters <= 15) return "#3b82f6";
            if (meters <= 50) return "#eab308";
            if (meters <= 100) return "#f97316";
            return "#ef4444";
        }

        function accuracyLabel(meters) {
            if (meters <= 5) return "Excellent";
            if (meters <= 15) return "Good";
            if (meters <= 50) return "Moderate";
            if (meters <= 100) return "Poor";
            return "Very Poor";
        }

        function drawAccuracyCircle(accuracy) {
            if (!accCanvas || !accCtx) return;
            var rect = accCanvas.getBoundingClientRect();
            accCanvas.width = rect.width * window.devicePixelRatio;
            accCanvas.height = rect.height * window.devicePixelRatio;
            accCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
            var w = rect.width, h = rect.height;
            var cx = w / 2, cy = h / 2;
            var maxR = Math.min(w, h) * 0.4;

            accCtx.clearRect(0, 0, w, h);

            // Grid circles for scale
            var scales = [5, 15, 50, 100];
            var maxScale = Math.max(accuracy * 1.5, 20);
            for (var si = 0; si < scales.length; si++) {
                var scaleR = (scales[si] / maxScale) * maxR;
                if (scaleR > maxR * 1.1) continue;
                accCtx.beginPath();
                accCtx.arc(cx, cy, scaleR, 0, Math.PI * 2);
                accCtx.strokeStyle = "rgba(255,255,255,0.08)";
                accCtx.lineWidth = 1;
                accCtx.stroke();
                accCtx.font = "9px JetBrains Mono";
                accCtx.fillStyle = "#4b5563";
                accCtx.textAlign = "center";
                accCtx.fillText(scales[si] + "m", cx, cy - scaleR + 10);
            }

            // Accuracy circle
            var accR = Math.min((accuracy / maxScale) * maxR, maxR);
            var color = accuracyColor(accuracy);
            accCtx.beginPath();
            accCtx.arc(cx, cy, accR, 0, Math.PI * 2);
            accCtx.fillStyle = color + "18";
            accCtx.fill();
            accCtx.beginPath();
            accCtx.arc(cx, cy, accR, 0, Math.PI * 2);
            accCtx.strokeStyle = color + "80";
            accCtx.lineWidth = 2;
            accCtx.setLineDash([5, 5]);
            accCtx.stroke();
            accCtx.setLineDash([]);

            // Center dot (your position)
            accCtx.beginPath();
            accCtx.arc(cx, cy, 5, 0, Math.PI * 2);
            accCtx.fillStyle = "#3394ff";
            accCtx.fill();
            accCtx.beginPath();
            accCtx.arc(cx, cy, 9, 0, Math.PI * 2);
            accCtx.strokeStyle = "#3394ff60";
            accCtx.lineWidth = 2;
            accCtx.stroke();

            // Label
            accCtx.font = "11px Inter";
            accCtx.fillStyle = color;
            accCtx.textAlign = "center";
            accCtx.fillText("\u00B1" + accuracy.toFixed(1) + "m (" + accuracyLabel(accuracy) + ")", cx, cy + accR + 20);

            // Crosshairs
            accCtx.strokeStyle = "rgba(255,255,255,0.05)";
            accCtx.lineWidth = 1;
            accCtx.beginPath(); accCtx.moveTo(cx, 10); accCtx.lineTo(cx, h - 10); accCtx.stroke();
            accCtx.beginPath(); accCtx.moveTo(10, cy); accCtx.lineTo(w - 10, cy); accCtx.stroke();
        }

        function updateHistoryChart() {
            if (!historyChart || fixHistory.length === 0) return;
            var times = [], accs = [], alts = [];
            for (var i = 0; i < fixHistory.length; i++) {
                var f = fixHistory[i];
                times.push(f.time);
                accs.push(f.accuracy.toFixed(1));
                alts.push(f.altitude !== null ? f.altitude.toFixed(1) : null);
            }
            historyChart.setOption({
                backgroundColor: "transparent",
                tooltip: { trigger: "axis" },
                legend: {
                    data: ["Accuracy (m)", "Altitude (m)"],
                    textStyle: { color: "#6b7280", fontSize: 11 },
                    top: 0,
                },
                grid: { top: 35, right: 60, bottom: 25, left: 50 },
                xAxis: {
                    type: "category", data: times,
                    axisLine: { lineStyle: { color: "#374151" } },
                    axisLabel: { color: "#6b7280", fontSize: 9 },
                },
                yAxis: [
                    {
                        type: "value", name: "Accuracy (m)",
                        nameTextStyle: { color: "#6b7280", fontSize: 10 },
                        axisLine: { lineStyle: { color: "#374151" } },
                        axisLabel: { color: "#6b7280", fontSize: 10 },
                        splitLine: { lineStyle: { color: "#1f2937" } },
                    },
                    {
                        type: "value", name: "Altitude (m)",
                        nameTextStyle: { color: "#6b7280", fontSize: 10 },
                        axisLine: { lineStyle: { color: "#374151" } },
                        axisLabel: { color: "#6b7280", fontSize: 10 },
                        splitLine: { show: false },
                    },
                ],
                series: [
                    {
                        name: "Accuracy (m)", type: "line", data: accs,
                        lineStyle: { color: "#f97316", width: 2 }, itemStyle: { color: "#f97316" },
                        showSymbol: true, symbolSize: 4, areaStyle: { color: "rgba(249,115,22,0.1)" },
                    },
                    {
                        name: "Altitude (m)", type: "line", yAxisIndex: 1, data: alts,
                        lineStyle: { color: "#22c55e", width: 2 }, itemStyle: { color: "#22c55e" },
                        showSymbol: true, symbolSize: 4,
                    },
                ],
                animation: true,
            });
        }

        function handlePosition(pos) {
            var c = pos.coords;
            var lat = c.latitude;
            var lng = c.longitude;
            var accuracy = c.accuracy;
            var altitude = c.altitude;
            var altAccuracy = c.altitudeAccuracy;
            var speed = c.speed;
            var heading = c.heading;
            var timestamp = pos.timestamp;

            // Show data, hide placeholder
            document.getElementById("loc-placeholder").classList.add("hidden");
            document.getElementById("loc-data").classList.remove("hidden");

            // Update Coordinate Systems section too
            if (window._gpsExplorer && window._gpsExplorer.updateCoords) {
                window._gpsExplorer.updateCoords(lat, lng);
            }

            // Big stat cards
            setText("my-lat", lat.toFixed(6) + "\u00B0");
            setText("my-lng", lng.toFixed(6) + "\u00B0");

            setText("my-accuracy", "\u00B1" + accuracy.toFixed(1) + "m");
            var accEl = document.getElementById("my-accuracy");
            if (accEl) accEl.style.color = accuracyColor(accuracy);

            if (altitude !== null) {
                setText("my-altitude", altitude.toFixed(1) + "m");
                setText("my-alt-accuracy", altAccuracy !== null ? ("\u00B1" + altAccuracy.toFixed(1) + "m accuracy") : "");
            } else {
                setText("my-altitude", "N/A");
                setText("my-alt-accuracy", "not available");
            }

            // Position formats
            setText("my-dd", lat.toFixed(6) + ", " + lng.toFixed(6));
            setText("my-dms", toDMS(lat, "N", "S") + " " + toDMS(lng, "E", "W"));

            var utm = toUTM(lat, lng);
            setText("my-utm-zone", utm.zone);
            setText("my-utm-e", Math.round(utm.easting).toLocaleString() + " m");
            setText("my-utm-n", Math.round(utm.northing).toLocaleString() + " m");

            // ECEF
            var ecef = toECEF(lat, lng, altitude);
            setText("my-ecef-x", Math.round(ecef.x).toLocaleString() + " m");
            setText("my-ecef-y", Math.round(ecef.y).toLocaleString() + " m");
            setText("my-ecef-z", Math.round(ecef.z).toLocaleString() + " m");

            // Motion
            if (speed !== null) {
                var speedKmh = speed * 3.6;
                setText("my-speed", speed.toFixed(1) + " m/s (" + speedKmh.toFixed(1) + " km/h)");
            } else {
                setText("my-speed", "stationary / N/A");
            }
            if (heading !== null) {
                var dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
                var dirIdx = Math.round(heading / 45) % 8;
                setText("my-heading", heading.toFixed(1) + "\u00B0 (" + dirs[dirIdx] + ")");
            } else {
                setText("my-heading", "N/A");
            }

            // Accuracy bars
            var hColor = accuracyColor(accuracy);
            setText("my-h-acc-label", "\u00B1" + accuracy.toFixed(1) + "m");
            setColor("my-h-acc-label", hColor);
            var hPct = Math.min((accuracy / 100) * 100, 100);
            setWidth("my-h-acc-bar", hPct + "%");
            setBackground("my-h-acc-bar", hColor);

            if (altAccuracy !== null) {
                var vColor = accuracyColor(altAccuracy);
                setText("my-v-acc-label", "\u00B1" + altAccuracy.toFixed(1) + "m");
                setColor("my-v-acc-label", vColor);
                var vPct = Math.min((altAccuracy / 100) * 100, 100);
                setWidth("my-v-acc-bar", vPct + "%");
                setBackground("my-v-acc-bar", vColor);
            } else {
                setText("my-v-acc-label", "N/A");
                setColor("my-v-acc-label", "#6b7280");
            }

            // Timestamp & GPS time
            var d = new Date(timestamp);
            setText("my-timestamp", d.toLocaleTimeString() + " " + d.toLocaleDateString());

            var msSinceEpoch = timestamp - GPS_EPOCH;
            var secSinceEpoch = msSinceEpoch / 1000;
            // Subtract leap seconds (as of 2024: 18 leap seconds since GPS epoch)
            secSinceEpoch += 18;
            var gpsWeek = Math.floor(secSinceEpoch / (7 * 86400));
            var gpsTOW = secSinceEpoch - gpsWeek * 7 * 86400;
            setText("my-gps-week", String(gpsWeek));
            setText("my-gps-tow", gpsTOW.toFixed(1) + "s");

            // Draw accuracy circle
            drawAccuracyCircle(accuracy);

            // Add to history
            var timeLabel = d.toLocaleTimeString();
            fixHistory.push({
                time: timeLabel,
                lat: lat,
                lng: lng,
                accuracy: accuracy,
                altitude: altitude,
            });
            // Keep last 50 entries
            if (fixHistory.length > 50) fixHistory.shift();
            updateHistoryChart();

            // Status text
            setText("loc-status-text", "Last fix: " + timeLabel + " | " + accuracyLabel(accuracy) + " accuracy");
        }

        function handleError(err) {
            setText("loc-status-text", "Error: " + err.message);
            setColor("loc-status-text", "#ef4444");
        }

        // Get My Position (single)
        var getBtn = document.getElementById("get-location-btn");
        if (getBtn) {
            getBtn.addEventListener("click", function () {
                if (!navigator.geolocation) {
                    setText("loc-status-text", "Geolocation not supported");
                    return;
                }
                setText("loc-status-text", "Requesting GPS fix...");
                setColor("loc-status-text", "#eab308");
                navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
                    enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
                });
            });
        }

        // Watch Position (continuous)
        var watchBtn = document.getElementById("watch-location-btn");
        var watchDot = document.getElementById("watch-indicator");
        var watchBtnText = document.getElementById("watch-btn-text");
        if (watchBtn) {
            watchBtn.addEventListener("click", function () {
                if (!navigator.geolocation) {
                    setText("loc-status-text", "Geolocation not supported");
                    return;
                }
                if (isWatching) {
                    navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                    isWatching = false;
                    if (watchDot) watchDot.className = "w-2 h-2 rounded-full bg-gray-500";
                    if (watchBtnText) watchBtnText.textContent = "Watch Position (Live)";
                    setText("loc-status-text", "Stopped watching");
                } else {
                    isWatching = true;
                    if (watchDot) watchDot.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                    if (watchBtnText) watchBtnText.textContent = "Stop Watching";
                    setText("loc-status-text", "Watching position...");
                    setColor("loc-status-text", "#22c55e");
                    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
                        enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
                    });
                }
            });
        }

        // Resize handlers
        window.addEventListener("resize", function () {
            if (fixHistory.length > 0 && accCanvas) {
                var lastFix = fixHistory[fixHistory.length - 1];
                drawAccuracyCircle(lastFix.accuracy);
            }
            if (historyChart) historyChart.resize();
        });
    })();

    // ========================================================
    // QUIZ
    // ========================================================
    (function () {
        var questions = [
            {
                q: "How many satellites are needed for a 3D position fix (latitude, longitude, altitude)?",
                options: ["2", "3", "4", "6"],
                correct: 2,
                explanation: "You need 4 satellites: 3 to solve for x, y, z coordinates and 1 additional to solve for the receiver clock error (since consumer receivers don't have atomic clocks).",
            },
            {
                q: "At what altitude do GPS satellites orbit?",
                options: ["200 km (LEO)", "2,000 km", "20,200 km (MEO)", "35,786 km (GEO)"],
                correct: 2,
                explanation: "GPS satellites orbit in Medium Earth Orbit (MEO) at approximately 20,200 km altitude, giving them a ~12-hour orbital period.",
            },
            {
                q: "What does GPS use to determine position \u2014 triangulation or trilateration?",
                options: ["Triangulation (angles)", "Trilateration (distances)", "Both equally", "Neither \u2014 it uses Doppler"],
                correct: 1,
                explanation: "GPS uses trilateration \u2014 measuring distances (pseudoranges) from known satellite positions. Triangulation measures angles, which GPS does not do.",
            },
            {
                q: "A 1-nanosecond clock error causes approximately how much position error?",
                options: ["0.003 meters", "0.3 meters", "3 meters", "30 meters"],
                correct: 1,
                explanation: "Since signals travel at the speed of light (\u22483\u00D710\u2078 m/s), a 1 ns timing error = 3\u00D710\u2078 \u00D7 10\u207B\u2079 = 0.3 meters of range error.",
            },
            {
                q: "Which is the largest source of GPS error for civilian receivers?",
                options: ["Receiver noise", "Ionospheric delay", "Multipath", "Satellite clock error"],
                correct: 1,
                explanation: "Ionospheric delay is typically the largest error source (\u00B17m without correction). The ionosphere's charged particles slow GPS signals, and the effect varies with solar activity and time of day.",
            },
            {
                q: "What does a low DOP (Dilution of Precision) value indicate?",
                options: ["Poor satellite geometry", "Good satellite geometry", "More satellites are needed", "Signal is weak"],
                correct: 1,
                explanation: "Low DOP means the satellites are well spread across the sky, giving strong geometry for position calculation. High DOP means satellites are clustered, leading to poor precision.",
            },
            {
                q: "How many orbital planes make up the GPS constellation?",
                options: ["3", "4", "6", "8"],
                correct: 2,
                explanation: "The GPS constellation uses 6 orbital planes, each inclined at 55\u00B0 to the equator and separated by 60\u00B0 in right ascension. Each plane contains ~5-6 satellites.",
            },
            {
                q: "What reference frame does GPS use internally?",
                options: ["NAD83", "WGS-84", "ITRF", "ED50"],
                correct: 1,
                explanation: "GPS uses the World Geodetic System 1984 (WGS-84) as its reference frame. It defines the coordinate system and the reference ellipsoid used for all GPS calculations.",
            },
        ];

        var container = document.getElementById("quiz-container");

        // Build quiz with safe DOM methods
        for (var qi = 0; qi < questions.length; qi++) {
            (function (qIdx) {
                var q = questions[qIdx];
                var qDiv = document.createElement("div");
                qDiv.className = "bg-space-900/80 rounded-xl p-5 border border-white/5";
                qDiv.id = "question-" + qIdx;

                var headerRow = document.createElement("div");
                headerRow.className = "flex gap-3 mb-3";

                var numSpan = document.createElement("span");
                numSpan.className = "text-gps-400 font-mono font-bold text-sm";
                numSpan.textContent = (qIdx + 1) + ".";

                var qText = document.createElement("span");
                qText.className = "text-white text-sm font-medium";
                qText.textContent = q.q;

                headerRow.appendChild(numSpan);
                headerRow.appendChild(qText);
                qDiv.appendChild(headerRow);

                var optionsDiv = document.createElement("div");
                optionsDiv.className = "ml-6 space-y-2";

                for (var oi = 0; oi < q.options.length; oi++) {
                    (function (optIdx) {
                        var label = document.createElement("label");
                        label.className = "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors";

                        var radio = document.createElement("input");
                        radio.type = "radio";
                        radio.name = "q" + qIdx;
                        radio.value = String(optIdx);
                        radio.className = "w-4 h-4 text-gps-600 bg-space-800 border-gray-600 focus:ring-gps-500";

                        var optText = document.createElement("span");
                        optText.className = "text-sm text-gray-300";
                        optText.textContent = q.options[optIdx];

                        label.appendChild(radio);
                        label.appendChild(optText);
                        optionsDiv.appendChild(label);
                    })(oi);
                }

                qDiv.appendChild(optionsDiv);

                var explainDiv = document.createElement("div");
                explainDiv.className = "ml-6 mt-3 hidden";
                explainDiv.id = "explain-" + qIdx;
                qDiv.appendChild(explainDiv);

                container.appendChild(qDiv);
            })(qi);
        }

        document.getElementById("check-quiz").addEventListener("click", function () {
            var score = 0;
            for (var qi2 = 0; qi2 < questions.length; qi2++) {
                var q = questions[qi2];
                var selected = document.querySelector('input[name="q' + qi2 + '"]:checked');
                var explainEl = document.getElementById("explain-" + qi2);
                var questionEl = document.getElementById("question-" + qi2);

                // Clear previous
                while (explainEl.firstChild) explainEl.removeChild(explainEl.firstChild);

                if (selected) {
                    var answer = +selected.value;
                    if (answer === q.correct) {
                        score++;
                        questionEl.style.borderColor = "rgba(34,197,94,0.3)";
                        explainEl.className = "ml-6 mt-3 text-xs text-green-400 p-3 rounded-lg bg-green-500/10";
                        var correctLabel = document.createElement("strong");
                        correctLabel.textContent = "Correct! ";
                        explainEl.appendChild(correctLabel);
                        explainEl.appendChild(document.createTextNode(q.explanation));
                    } else {
                        questionEl.style.borderColor = "rgba(239,68,68,0.3)";
                        explainEl.className = "ml-6 mt-3 text-xs text-red-400 p-3 rounded-lg bg-red-500/10";
                        var incorrectLabel = document.createElement("strong");
                        incorrectLabel.textContent = "Incorrect. ";
                        explainEl.appendChild(incorrectLabel);
                        explainEl.appendChild(document.createTextNode(q.explanation));
                    }
                } else {
                    explainEl.className = "ml-6 mt-3 text-xs text-yellow-400 p-3 rounded-lg bg-yellow-500/10";
                    explainEl.textContent = "No answer selected.";
                }
            }

            var scoreEl = document.getElementById("quiz-score");
            scoreEl.textContent = score + "/" + questions.length;
            scoreEl.style.color = score === questions.length ? "#22c55e" : score >= questions.length * 0.6 ? "#eab308" : "#ef4444";
        });

        document.getElementById("reset-quiz").addEventListener("click", function () {
            for (var qi3 = 0; qi3 < questions.length; qi3++) {
                var questionEl = document.getElementById("question-" + qi3);
                questionEl.style.borderColor = "rgba(255,255,255,0.05)";
                var explainEl = document.getElementById("explain-" + qi3);
                explainEl.className = "ml-6 mt-3 hidden";
                while (explainEl.firstChild) explainEl.removeChild(explainEl.firstChild);
                var radios = document.querySelectorAll('input[name="q' + qi3 + '"]');
                for (var ri = 0; ri < radios.length; ri++) radios[ri].checked = false;
            }
            document.getElementById("quiz-score").textContent = "";
        });
    })();

    // ========================================================
    // NAV ACTIVE STATE
    // ========================================================
    (function () {
        var sections = document.querySelectorAll("section[id], header[id]");
        var navLinks = document.querySelectorAll(".nav-link");

        window.addEventListener("scroll", function () {
            var current = "";
            for (var i = 0; i < sections.length; i++) {
                var top = sections[i].offsetTop - 100;
                if (window.scrollY >= top) current = sections[i].id;
            }
            for (var j = 0; j < navLinks.length; j++) {
                var isActive = navLinks[j].getAttribute("href") === "#" + current;
                if (isActive) navLinks[j].classList.add("active");
                else navLinks[j].classList.remove("active");
            }
        });
    })();

})();
