import os
import sys
import json
from flask import Flask, jsonify, render_template, abort

app = Flask(__name__, template_folder='templates', static_folder='static')

# Helper to read JSON data safely
def read_json_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/countries')
def get_countries_index():
    index_path = os.path.join('data', 'countries_index.json')
    if not os.path.exists(index_path):
        return jsonify({"error": "Countries index not found"}), 404
        
    data = read_json_file(index_path)
    if data is None:
        return jsonify({"error": "Failed to parse countries index"}), 500
        
    return jsonify(data)

@app.route('/api/countries/<country_id>')
def get_country_details(country_id):
    # Ensure safe filename
    country_id = "".join(c for c in country_id if c.isalnum() or c in ('-', '_')).upper()
    country_path = os.path.join('data', 'countries', f'{country_id}.json')
    
    if not os.path.exists(country_path):
        return jsonify({"error": f"Country {country_id} not found"}), 404
        
    data = read_json_file(country_path)
    if data is None:
        return jsonify({"error": f"Failed to parse country data for {country_id}"}), 500
        
    return jsonify(data)

def run_tests():
    print("Running backend tests...")
    
    # 1. Verify countries_index.json
    index_path = os.path.join('data', 'countries_index.json')
    if not os.path.exists(index_path):
        print("FAIL: data/countries_index.json does not exist.")
        sys.exit(1)
    
    index_data = read_json_file(index_path)
    if not index_data:
        print("FAIL: Could not load index data.")
        sys.exit(1)
    print(f"PASS: loaded {len(index_data)} countries from index.")
    
    # 2. Verify individual country files
    for country in index_data:
        c_id = country.get('id')
        c_name = country.get('name')
        c_path = os.path.join('data', 'countries', f'{c_id}.json')
        if not os.path.exists(c_path):
            print(f"FAIL: Country data file missing for {c_name} (ID: {c_id}) at {c_path}")
            sys.exit(1)
        
        detail_data = read_json_file(c_path)
        if not detail_data:
            print(f"FAIL: Could not parse JSON for {c_name} (ID: {c_id})")
            sys.exit(1)
        print(f"PASS: verified {c_name} details structure.")
        
    # 3. Check GeoJSON
    geojson_path = os.path.join('static', 'data', 'world.json')
    if not os.path.exists(geojson_path):
        print(f"WARNING: static/data/world.json is missing. Attempting to download...")
        try:
            from download_assets import download_geojson
            download_geojson()
        except ImportError:
            print("FAIL: download_assets.py not found.")
            sys.exit(1)
            
        if not os.path.exists(geojson_path):
            print("FAIL: GeoJSON download failed or file still missing.")
            sys.exit(1)
    print("PASS: GeoJSON file is present.")
    print("All backend tests PASSED successfully!")
    sys.exit(0)

if __name__ == '__main__':
    if '--test' in sys.argv:
        run_tests()
    else:
        # Check if assets are missing, download if needed
        geojson_path = os.path.join('static', 'data', 'world.json')
        if not os.path.exists(geojson_path):
            print("GeoJSON data not found, downloading...")
            try:
                from download_assets import download_geojson
                download_geojson()
            except Exception as e:
                print(f"Failed to auto-download assets: {e}")
                
        app.run(debug=True, host='0.0.0.0', port=5000)
