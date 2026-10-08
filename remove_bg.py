import json
import os
import urllib.request
from rembg import remove
from PIL import Image
import io

with open('src/data/registry_gifts.json', 'r', encoding='utf-8') as f:
    gifts = json.load(f)

os.makedirs('public/gifts', exist_ok=True)

for gift in gifts:
    url = gift['imageUrl']
    # Process only if it's a millemercis image
    if url.startswith('http') and 'millemercis' in url:
        filename = url.split('/')[-1].split('.')[0] + '.png'
        filepath = os.path.join('public/gifts', filename)
        
        if not os.path.exists(filepath):
            print(f"Processing {url}...")
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response:
                    input_img = response.read()
                
                output_img = remove(input_img)
                img = Image.open(io.BytesIO(output_img))
                img.save(filepath, 'PNG')
            except Exception as e:
                print(f"Failed {url}: {e}")
                
        gift['imageUrl'] = f'/gifts/{filename}'

with open('src/data/registry_gifts.json', 'w', encoding='utf-8') as f:
    json.dump(gifts, f, indent=2, ensure_ascii=False)

print("Done processing images!")
