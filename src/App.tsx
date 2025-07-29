import { useEffect, useState } from "react";
import populationJson from "./assets/population_data_out.json";

const App = () => {
  const [populationData, setPopulationData] = useState<any[]>([]);
  const [rectangles, setRectangles] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("2024");

  const continentColors = {
    Asia: "#ff9999",
    "North America": "#99ccff",
    "South America": "#ffcc99",
    Africa: "#99ff99",
    Europe: "#ccccff",
    "Europe/Asia": "#ffccff",
  };

  // Build populationData from populationJson, using only 2024 population

  type Country = {
    name: string;
    continent: string;
    population: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    percentage?: string;
  };

  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);

  // Calculate total population for percentage calculations
  const totalPopulation = populationData.reduce(
    (sum, country) => sum + country.population,
    0
  );

  // Simple treemap algorithm - arrange rectangles in rows
  const createTreemapLayout = (
    data: Country[],
    width: number,
    height: number
  ) => {
    const sortedData = [...data].sort((a, b) => b.population - a.population);
    const rectangles = [];

    let currentY = 0;
    let currentRowHeight = 0;
    let currentX = 0;
    let remainingWidth = width;
    let remainingArea = width * height;
    let remainingData = [...sortedData];

    while (remainingData.length > 0 && remainingArea > 0) {
      // Calculate how many items to put in this row
      const rowData: any[] = [];
      let rowArea = 0;

      // Try to fit as many items as possible in the current row
      for (let i = 0; i < remainingData.length; i++) {
        const item = remainingData[i];
        const itemArea = (item.population / totalPopulation) * (width * height);
        if (
          rowArea + itemArea <= (remainingWidth * height) / 4 ||
          rowData.length === 0
        ) {
          rowData.push(item);
          rowArea += itemArea;
        } else {
          break;
        }
      }

      if (rowData.length === 0) break;

      // Calculate row height based on average aspect ratio
      currentRowHeight = Math.min(rowArea / remainingWidth, height - currentY);
      if (currentRowHeight < 1) currentRowHeight = 1; // Allow very small rows

      // Position items in the row
      currentX = 0;
      for (const item of rowData as Country[]) {
        const itemArea = (item.population / totalPopulation) * (width * height);
        const itemWidth =
          currentRowHeight > 0
            ? itemArea / currentRowHeight
            : remainingWidth / rowData.length;

        rectangles.push({
          ...item,
          x: currentX,
          y: currentY,
          color:
            continentColors[item.continent as keyof typeof continentColors] ||
            "#ccc",
          width: Math.max(itemWidth, 1), // Allow very small rectangles
          height: currentRowHeight,
          percentage: ((item.population / totalPopulation) * 100).toFixed(1),
        });

        currentX += itemWidth;
      }

      // Update for next row
      currentY += currentRowHeight;
      remainingArea -= rowArea;
      remainingData = remainingData.filter((item) => !rowData.includes(item));
      remainingWidth = width;
      // No break on currentY, allow all data to be processed
    }
    return rectangles;
  };

  useEffect(() => {
    const tempPopulationData = [];
    for (let i = 0; i < populationJson?.length; i++) {
      const item = populationJson[i];
      if (item["Continent"] === "Unknown") continue; // Skip unknown continents
      const pop = Number(item[selectedYear as keyof typeof item]);
      if (!isNaN(pop) && pop > 0) {
        tempPopulationData.push({
          name: item["Country Name"],
          continent: item["Continent"] || "Unknown",
          population: pop,
        });
      }
    }
    setPopulationData(tempPopulationData);
  }, [selectedYear]);

  useEffect(() => {
    setRectangles(createTreemapLayout(populationData, 800, 600));
  }, [populationData]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50">
      {/* Year Selector */}
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="year-select" className="font-semibold text-gray-700">
          Year:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border rounded px-2 py-1 text-gray-800 bg-white shadow-sm"
        >
          {Array.from({ length: 2024 - 1960 + 1 }, (_, i) => {
            const year = (1960 + i).toString();
            return (
              <option value={year} key={year}>
                {year}
              </option>
            );
          })}
        </select>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          World Population Visualization
        </h1>
        <p className="text-gray-600">
          Each rectangle represents a country, sized by population. Hover to see
          details.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Total Population: {totalPopulation.toLocaleString()} people
        </p>
      </div>

      <div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <svg width="800" height="600" className="block">
          {rectangles.map((rect, index) => (
            <g key={index}>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill={rect.color}
                stroke="#fff"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200 hover:brightness-110"
                onMouseEnter={() => setHoveredCountry(rect)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{
                  filter:
                    hoveredCountry && hoveredCountry.name === rect.name
                      ? "brightness(1.2)"
                      : "none",
                }}
              />
              {/* Show full name for large, 3-letter code for small, nothing for very small */}
              {rect.width > 80 && rect.height > 40 ? (
                <text
                  x={rect.x + rect.width / 2}
                  y={rect.y + rect.height / 2 - 8}
                  textAnchor="middle"
                  className="fill-gray-800 text-sm font-semibold pointer-events-none"
                  style={{
                    fontSize: Math.min(rect.width / 8, rect.height / 4, 14),
                  }}
                >
                  {rect.name}
                </text>
              ) : rect.width > 20 && rect.height > 12 ? (
                <text
                  x={rect.x + rect.width / 2}
                  y={rect.y + rect.height / 2}
                  textAnchor="middle"
                  className="fill-gray-800 pointer-events-none"
                  style={{
                    fontSize: Math.max(
                      Math.min(rect.width, rect.height) / 3,
                      6
                    ),
                    fontWeight: 600,
                  }}
                >
                  {rect.name.slice(0, 3).toUpperCase()}
                </text>
              ) : null}
              {/* Show population for large rectangles only */}
              {rect.width > 80 && rect.height > 40 && (
                <text
                  x={rect.x + rect.width / 2}
                  y={rect.y + rect.height / 2 + 8}
                  textAnchor="middle"
                  className="fill-gray-600 text-xs pointer-events-none"
                  style={{
                    fontSize: Math.min(rect.width / 10, rect.height / 5, 12),
                  }}
                >
                  {rect.population.toLocaleString()}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredCountry && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg shadow-lg pointer-events-none">
            <div className="font-semibold">{hoveredCountry.name}</div>
            <div className="text-sm">
              Population: {hoveredCountry.population.toLocaleString()}
            </div>
            <div className="text-sm">
              Share: {hoveredCountry.percentage}% of world population
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
        {[...populationData]
          .sort((a, b) => b.population - a.population)
          .map((country) => (
            <div key={country.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor:
                    continentColors[
                      country.continent as keyof typeof continentColors
                    ] || "#ccc",
                }}
              ></div>
              <span className="text-gray-700 truncate">
                {country.name}: {country.population.toLocaleString()} people
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default App;
