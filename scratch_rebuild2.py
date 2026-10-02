import sys

html_content = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyseur CSS - Janvier 2027</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        :root {
            --bg-color: #0f172a;
            --surface-color: #1e293b;
            --text-color: #f8fafc;
            --primary-color: #3b82f6;
            --border-color: #334155;
            --accent-color: #f59e0b;
        }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 20px;
        }
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            gap: 20px;
            grid-template-columns: 1fr;
        }
        .controls-panel, .scenarios-container, .targets-container {
            background-color: var(--surface-color);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 150px;
        }
        label {
            font-size: 0.875rem;
            color: #94a3b8;
            font-weight: 500;
        }
        input {
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 8px 12px;
            border-radius: 6px;
            outline: none;
        }
        input:focus {
            border-color: var(--primary-color);
        }
        button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #2563eb;
        }
        #plot {
            background-color: var(--surface-color);
            border-radius: 12px;
            padding: 10px;
            min-height: 600px;
            border: 1px solid var(--border-color);
        }
        ul {
            list-style-type: none;
            padding: 0;
            width: 100%;
        }
        li {
            background-color: var(--bg-color);
            margin-bottom: 8px;
            padding: 12px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .delete-btn {
            background-color: #ef4444;
            padding: 6px 12px;
        }
        .delete-btn:hover {
            background-color: #dc2626;
        }
        .panels-wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) {
            .panels-wrapper {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>Matrice du Clean Spark Spread (CSS)</h1>
        
        <div class="controls-panel">
            <div class="control-group">
                <label for="elec">Prix Élec base Jan-27 [€/MWh]</label>
                <input type="number" id="elec" value="60" step="1" onchange="updatePlot()">
            </div>
            <div class="control-group">
                <label for="gaz">Prix Gaz TTF Jan-27 [€/MWh]</label>
                <input type="number" id="gaz" value="40" step="1" onchange="updatePlot()">
            </div>
            <div class="control-group">
                <label for="fg-min">Facteur Gaz (Min)</label>
                <input type="number" id="fg-min" value="1.5" step="0.1" onchange="updatePlot()">
            </div>
            <div class="control-group">
                <label for="fg-max">Facteur Gaz (Max)</label>
                <input type="number" id="fg-max" value="2.5" step="0.1" onchange="updatePlot()">
            </div>
            <div class="control-group">
                <label for="fees-min">Fees élec (Min) [€/MWh]</label>
                <input type="number" id="fees-min" value="5" step="1" onchange="updatePlot()">
            </div>
            <div class="control-group">
                <label for="fees-max">Fees élec (Max) [€/MWh]</label>
                <input type="number" id="fees-max" value="25" step="1" onchange="updatePlot()">
            </div>
        </div>

        <div id="plot"></div>

        <div class="panels-wrapper">
            <!-- Scenarios Panel -->
            <div class="scenarios-container">
                <h3 style="margin-top: 0; width: 100%;">Ajouter des points (Cas)</h3>
                <div class="scenario-inputs" style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                    <div class="control-group" style="flex: 1; min-width: 120px;">
                        <label>Nom du cas</label>
                        <input type="text" id="scenario-name" placeholder="Ex: Hiver">
                    </div>
                    <div class="control-group" style="flex: 1; min-width: 120px;">
                        <label>Région</label>
                        <input type="text" id="scenario-region" placeholder="Ex: France" value="France">
                    </div>
                    <div class="control-group" style="flex: 1; min-width: 100px;">
                        <label>FG</label>
                        <input type="number" id="scenario-fg" value="2.0" step="0.1">
                    </div>
                    <div class="control-group" style="flex: 1; min-width: 100px;">
                        <label>Fees</label>
                        <input type="number" id="scenario-fees" value="10" step="1">
                    </div>
                    <button onclick="addScenario()">Ajouter</button>
                </div>
                <ul id="scenarios-list"></ul>
            </div>

            <!-- Targets Panel -->
            <div class="targets-container">
                <h3 style="margin-top: 0; width: 100%;">Ajouter des Cibles CSS (Lignes)</h3>
                <div class="scenario-inputs" style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                    <div class="control-group" style="flex: 1; min-width: 150px;">
                        <label>Région de la Cible</label>
                        <input type="text" id="target-region" placeholder="Ex: France" value="France">
                    </div>
                    <div class="control-group" style="flex: 1; min-width: 150px;">
                        <label>Cible CSS [€/MWh]</label>
                        <input type="number" id="target-limit" value="0" step="1">
                    </div>
                    <button onclick="addTarget()">Ajouter</button>
                </div>
                <ul id="targets-list"></ul>
            </div>
        </div>
    </div>

    <script>
        let scenarios = [];
        let targets = [
            { id: 1, region: 'France', limit: 0 }
        ];

        // Custom palette to ensure same regions get same colors across lines & markers
        const colorPalette = [
            '#ef4444', '#3b82f6', '#10b981', '#f59e0b', 
            '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16', '#06b6d4'
        ];
        
        function getRegionColor(region) {
            if (!window.regionColors) window.regionColors = {};
            // Normaliser le nom de région
            const normRegion = region.trim().toLowerCase();
            if (!window.regionColors[normRegion]) {
                const nextIdx = Object.keys(window.regionColors).length % colorPalette.length;
                window.regionColors[normRegion] = colorPalette[nextIdx];
            }
            return window.regionColors[normRegion];
        }

        function calculateCSS(elec, gaz, fg, fees) {
            return elec - fg * (gaz + 1.18) - fees;
        }

        function generateData(fgMin, fgMax, feesMin, feesMax, elec, gaz) {
            const steps = 100;
            const fgRange = [];
            const feesRange = [];
            const zData = [];

            for (let i = 0; i <= steps; i++) {
                fgRange.push(fgMin + (fgMax - fgMin) * (i / steps));
                feesRange.push(feesMin + (feesMax - feesMin) * (i / steps));
            }

            for (let f = 0; f < feesRange.length; f++) {
                const row = [];
                for (let g = 0; g < fgRange.length; g++) {
                    row.push(calculateCSS(elec, gaz, fgRange[g], feesRange[f]));
                }
                zData.push(row);
            }

            return { x: fgRange, y: feesRange, z: zData };
        }

        function updatePlot() {
            const elec = parseFloat(document.getElementById('elec').value);
            const gaz = parseFloat(document.getElementById('gaz').value);
            const fgMin = parseFloat(document.getElementById('fg-min').value);
            const fgMax = parseFloat(document.getElementById('fg-max').value);
            const feesMin = parseFloat(document.getElementById('fees-min').value);
            const feesMax = parseFloat(document.getElementById('fees-max').value);

            const data = generateData(fgMin, fgMax, feesMin, feesMax, elec, gaz);

            const heatmapTrace = {
                x: data.x,
                y: data.y,
                z: data.z,
                type: 'heatmap',
                colorscale: 'RdYlGn',
                colorbar: {
                    title: 'CSS (€/MWh)',
                    titleside: 'right'
                },
                hovertemplate: 
                    'FG: %{x:.2f}<br>' +
                    'Fees: %{y:.2f} €<br>' +
                    'CSS: %{z:.2f} €<extra></extra>'
            };

            const traces = [heatmapTrace];

            // Tracé des lignes de limite (cibles)
            targets.forEach(t => {
                const lineX = [fgMin, fgMax];
                const lineY = lineX.map(fg => elec - t.limit - fg * (gaz + 1.18));
                const color = getRegionColor(t.region);

                traces.push({
                    x: lineX,
                    y: lineY,
                    mode: 'lines',
                    type: 'scatter',
                    name: `Cible ${t.region} (${t.limit}€)`,
                    legendgroup: t.region,
                    line: {
                        color: color,
                        width: 3,
                        dash: 'dashdot'
                    },
                    hoverinfo: 'name'
                });
            });

            // Tracé des points des scénarios groupés par région
            if (scenarios.length > 0) {
                const regions = [...new Set(scenarios.map(s => s.region))];
                regions.forEach(region => {
                    const regionScenarios = scenarios.filter(s => s.region === region);
                    const scenariosX = regionScenarios.map(s => s.fg);
                    const scenariosY = regionScenarios.map(s => s.fees);
                    const scenariosText = regionScenarios.map(s => {
                        const css = calculateCSS(elec, gaz, s.fg, s.fees);
                        return `<b>${s.name}</b> (${region})<br>CSS: ${css.toFixed(2)} €`;
                    });
                    const color = getRegionColor(region);

                    traces.push({
                        x: scenariosX,
                        y: scenariosY,
                        mode: 'markers+text',
                        type: 'scatter',
                        name: `Cas ${region}`,
                        legendgroup: region,
                        text: scenariosText,
                        textposition: 'top right',
                        marker: {
                            size: 14,
                            color: color,
                            line: {
                                color: '#ffffff',
                                width: 2
                            }
                        },
                        hoverinfo: 'text',
                        showlegend: true
                    });
                });
            }

            const layout = {
                title: `Matrice du Clean Spark Spread`,
                xaxis: { title: 'Facteur Gaz (FG)', range: [fgMin, fgMax] },
                yaxis: { title: 'Fees élec base [€/MWh]', range: [feesMin, feesMax] },
                paper_bgcolor: '#1e293b',
                plot_bgcolor: '#1e293b',
                font: { color: '#f8fafc' },
                margin: { t: 80, r: 20, b: 60, l: 60 },
                showlegend: true,
                legend: { title: { text: 'Régions' }, x: 1.15, y: 1 },
                annotations: [{
                    xref: 'paper', yref: 'paper',
                    x: 0, y: 1.12,
                    xanchor: 'left', yanchor: 'bottom',
                    text: `<b>Prix Élec : ${elec} €/MWh | Prix Gaz : ${gaz} €/MWh</b>`,
                    showarrow: false,
                    font: { size: 14, color: '#f8fafc' }
                }]
            };

            Plotly.newPlot('plot', traces, layout);
            updateLists();
        }

        function addScenario() {
            const nameInput = document.getElementById('scenario-name');
            const regionInput = document.getElementById('scenario-region');
            const name = nameInput.value || `Cas ${scenarios.length + 1}`;
            const region = regionInput.value || 'Défaut';
            const fg = parseFloat(document.getElementById('scenario-fg').value);
            const fees = parseFloat(document.getElementById('scenario-fees').value);

            if (!isNaN(fg) && !isNaN(fees)) {
                scenarios.push({ name, region, fg, fees, id: Date.now() });
                nameInput.value = '';
                updatePlot();
            }
        }

        function addTarget() {
            const regionInput = document.getElementById('target-region');
            const limitInput = document.getElementById('target-limit');
            const region = regionInput.value || 'Défaut';
            const limit = parseFloat(limitInput.value);

            if (!isNaN(limit)) {
                targets.push({ region, limit, id: Date.now() });
                updatePlot();
            }
        }

        function deleteScenario(id) {
            scenarios = scenarios.filter(s => s.id !== id);
            updatePlot();
        }

        function deleteTarget(id) {
            targets = targets.filter(t => t.id !== id);
            updatePlot();
        }

        function updateLists() {
            const sList = document.getElementById('scenarios-list');
            sList.innerHTML = '';
            const elec = parseFloat(document.getElementById('elec').value);
            const gaz = parseFloat(document.getElementById('gaz').value);

            scenarios.forEach(s => {
                const css = calculateCSS(elec, gaz, s.fg, s.fees);
                const li = document.createElement('li');
                li.innerHTML = `
                    <span style="border-left: 4px solid ${getRegionColor(s.region)}; padding-left: 8px;">
                        <b>${s.name}</b> (${s.region}) : FG=${s.fg} | Fees=${s.fees} € | CSS=${css.toFixed(2)} €
                    </span>
                    <button class="delete-btn" onclick="deleteScenario(${s.id})">X</button>
                `;
                sList.appendChild(li);
            });

            const tList = document.getElementById('targets-list');
            tList.innerHTML = '';
            targets.forEach(t => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span style="border-left: 4px solid ${getRegionColor(t.region)}; padding-left: 8px;">
                        Cible <b>${t.region}</b> : ${t.limit} €
                    </span>
                    <button class="delete-btn" onclick="deleteTarget(${t.id})">X</button>
                `;
                tList.appendChild(li);
            });
        }

        updatePlot();
    </script>
</body>
</html>
"""

file_path = r'c:\Users\jbenard1\Downloads\Cotation_CSS.html'
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
