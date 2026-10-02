import sys
import re

file_path = r'c:\Users\jbenard1\Downloads\Cotation_CSS.html'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace css-limit input
old_input = '<input type="number" id="css-limit" value="0" step="1" onchange="updatePlot()">'
new_input = '<input type="text" id="css-limit" value="0" placeholder="Ex: 0, 5, 10" onchange="updatePlot()">'
content = content.replace(old_input, new_input)

# Update the trace code
old_js = '''            // Trac de la ligne de limite
            if (!isNaN(cssLimit)) {
                // Equation: CSS = Elec - FG * (Gaz + 1.18) - Fees
                // => Fees = Elec - CSS - FG * (Gaz + 1.18)
                const lineX = [fgMin, fgMax];
                const lineY = lineX.map(fg => elec - cssLimit - fg * (gaz + 1.18));

                const limitTrace = {
                    x: lineX,
                    y: lineY,
                    mode: 'lines',
                    type: 'scatter',
                    name: `Limite CSS = ${cssLimit}`,
                    line: {
                        color: '#111827', // Sombre pour contraster avec la heatmap
                        width: 4,
                        dash: 'dashdot'
                    },
                    hoverinfo: 'name'
                };
                traces.push(limitTrace);
            }'''
            
# Wait, the word "Tracé" might have lost its accent due to encoding or maybe it's still there. Let's use regex.
js_regex = r'// Trac.*?de la ligne de limite.*?\n\s*if \(\!isNaN\(cssLimit\)\) \{.*?traces\.push\(limitTrace\);\s*\}'
new_js = '''            // Tracé des lignes de limite (cibles multiples)
            const cssLimitString = document.getElementById('css-limit').value;
            const cssLimits = cssLimitString.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            
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
            });'''

content = re.sub(js_regex, new_js, content, flags=re.DOTALL)

# We also need to remove the old definition of `const cssLimit = parseFloat(...)` 
content = re.sub(r'const cssLimit = parseFloat\(document\.getElementById\(\'css-limit\'\)\.value\);\n', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Modifications pour cibles multiples appliquees.')
