import csv
import json

# Step 1: Build mapping from 3-letter country code to continent
continent_map = {}
with open('continent_data.csv', mode='r', encoding='utf-8-sig') as continent_file:
    reader = csv.DictReader(continent_file)
    for row in reader:
        code = row["Three_Letter_Country_Code"]
        continent = row["Continent_Name"]
        continent_map[code] = continent

# Step 2: Read population data and convert to JSON
countries_data = []

with open('population_data.csv', mode='r', encoding='utf-8-sig') as pop_file:
    reader = csv.DictReader(pop_file)
    
    for row in reader:
        country_code_3 = row["Country Code"]
        country_name = row["Country Name"]
        continent = continent_map.get(country_code_3, "Unknown")
        
        # Create a new dictionary with continent first
        country_data = {
            "Continent": continent,
            **row  # Add all original fields
        }
        
        countries_data.append(country_data)

# Write to JSON file
with open('population_data_out.json', 'w', encoding='utf-8') as json_file:
    json.dump(countries_data, json_file, indent=2, ensure_ascii=False)

print(f"Converted {len(countries_data)} countries to JSON format.")
print("Output saved as: population_data_out.json")
