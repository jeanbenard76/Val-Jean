import sys
import re

file_path = r'c:\Users\jbenard1\Downloads\Cotation_CSS.html'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Fix encoding issues that might have happened
content = content.replace('', '€')

# 1. Add Region input
input_old = '''<div class="control-group">
                    <label>Nom du cas</label>
                    <input type="text" id="scenario-name" placeholder="Ex: Cas de base">
                </div>'''
input_new = '''<div class="control-group">
                    <label>Nom du cas</label>
                    <input type="text" id="scenario-name" placeholder="Ex: Cas de base">
                </div>
                <div class="control-group">
                    <label>Région</label>
                    <input type="text" id="scenario-region" placeholder="Ex: France" value="France">
                </div>'''
content = content.replace(input_old, input_new)

# 2. Update addScenario
add_old = '''        function addScenario() {
            const nameInput = document.getElementById('scenario-name');
            const name = nameInput.value || `Cas ${scenarios.length + 1}`;
            const fg = parseFloat(document.getElementById('scenario-fg').value);
            const fees = parseFloat(document.getElementById('scenario-fees').value);

            if (!isNaN(fg) && !isNaN(fees)) {
                scenarios.push({ name, fg, fees, id: Date.now() });'''
add_new = '''        function addScenario() {
            const nameInput = document.getElementById('scenario-name');
            const regionInput = document.getElementById('scenario-region');
            const name = nameInput.value || `Cas ${scenarios.length + 1}`;
            const region = regionInput.value || 'Défaut';
            const fg = parseFloat(document.getElementById('scenario-fg').value);
            const fees = parseFloat(document.getElementById('scenario-fees').value);

            if (!isNaN(fg) && !isNaN(fees)) {
                scenarios.push({ name, region, fg, fees, id: Date.now() });'''
content = content.replace(add_old, add_new)

# 3. Update traces in updatePlot
content = re.sub(
    r'// Trac.*?des points.*?traces\.push\(scatterTrace\);\s*\}',
    '''// Tracé des points des scénarios groupés par région
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
            }''',
    content, flags=re.DOTALL
)

# 4. Update layout
layout_new = '''            const layout = {
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
            };'''
content = re.sub(r'const layout = \{.*?showlegend: false\s*\};', layout_new, content, flags=re.DOTALL)

# 5. Update updateScenariosList
list_new = r'<span><b>${s.name}</b> (${s.region}) : FG = ${s.fg} | Fees = ${s.fees} € | CSS résultant = ${css.toFixed(2)} €</span>'
content = re.sub(r'<span><b>\$\{s\.name\}</b> : FG = \$\{s\.fg\} \| Fees = \$\{s\.fees\} . \| CSS r.sultant = \$\{css\.toFixed\(2\)\} .</span>', list_new, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Modifications terminees.')
