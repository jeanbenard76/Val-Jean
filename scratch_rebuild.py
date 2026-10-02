import sys
import io

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
        .controls-panel, .scenarios-container {
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
                <label for="css-limit">Cibles CSS multiples [€/MWh]</label>
                <input type="text" id="css-limit" value="0, 5" placeholder="Ex: 0, 5, 10" onchange="updatePlot()">
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

        <div class="scenarios-container">
            <h3 style="margin-top: 0; width: 100%;">Ajouter des cas de figure</h3>
            <div class="scenario-inputs" style="display: flex; gap: 15px; align-items: flex-end;">
                <div class="control-group">
                    <label>Nom du cas</label>
                    <input type="text" id="scenario-name" placeholder="Ex: Cas de base">
                </div>
                <div class="control-group">
                    <label>Région</label>
                    <input type="text" id="scenario-region" placeholder="Ex: France" value="France">
                </div>
                <div class="control-group">
                    <label>Facteur Gaz (FG)</label>
                    <input type="number" id="scenario-fg" value="2.0" step="0.1">
                </div>
                <div class="control-group">
                    <label>Fees élec base</label>
                    <input type="number" id="scenario-fees" value="10" step="1">
                </div>
                <button onclick="addScenario()">Ajouter le point</button>
            </div>
            <ul id="scenarios-list"></ul>
        </div>
    </div>

    <script>
        let scenarios = [];

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
            
            const cssLimitString = document.getElementById('css-limit').value;
            const cssLimits = cssLimitString.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            
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

            // Tracé des lignes de limite (cibles multiples)
            cssLimits.forEach(limit => {
                const lineX = [fgMin, fgMax];
                const lineY = lineX.map(fg => elec - limit - fg * (gaz + 1.18));

                const limitTrace = {
                    x: lineX,
                    y: lineY,
                    mode: 'lines',
                    type: 'scatter',
                    name: `Cible CSS = ${limit} €`,
                    line: {
                        color: '#111827',
                        width: 4,
                        dash: 'dashdot'
                    },
                    hoverinfo: 'name'
                };
                traces.push(limitTrace);
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

                    traces.push({
                        x: scenariosX,
                        y: scenariosY,
                        mode: 'markers+text',
                        type: 'scatter',
                        name: region,
                        text: scenariosText,
                        textposition: 'top right',
                        marker: {
                            size: 14,
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
            updateScenariosList();
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

        function deleteScenario(id) {
            scenarios = scenarios.filter(s => s.id !== id);
            updatePlot();
        }

        function updateScenariosList() {
            const list = document.getElementById('scenarios-list');
            list.innerHTML = '';
            
            const elec = parseFloat(document.getElementById('elec').value);
            const gaz = parseFloat(document.getElementById('gaz').value);

            scenarios.forEach(s => {
                const css = calculateCSS(elec, gaz, s.fg, s.fees);
                const li = document.createElement('li');
                li.innerHTML = `
                    <span><b>${s.name}</b> (${s.region}) : FG = ${s.fg} | Fees = ${s.fees} € | CSS résultant = ${css.toFixed(2)} €</span>
                    <button class="delete-btn" onclick="deleteScenario(${s.id})">Supprimer</button>
                `;
                list.appendChild(li);
            });
        }

        // Add point on enter key
        document.getElementById('scenario-name').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addScenario();
        });

        // Initial plot
        updatePlot();
    </script>
</body>
</html>
"""

file_path = r'c:\Users\jbenard1\Downloads\Cotation_CSS.html'
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
