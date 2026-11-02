// 952 dataset nodes, 3291 SIMILAR_TO edges
// Generated from https://api.tryopendata.ai/v1/graph/subgraph on 2026-09-10
// Filter: nodes with properties.status === "ready" (963 nodes in the
// raw subgraph, 952 ready); edges kept only when both endpoints survive
// that filter (3371 raw edges in, 3291 kept).
// Regenerate: node blog/scripts/generate-dataset-graph.mjs, then copy the result
// here (the blog script writes to blog/src/data/dataset-graph.ts).
//
// categoryCounts is a category -> node count summary, sorted descending, used by
// the scale slide for cluster labels.

export const graphNodes = [
  {
    "id": "e2965509",
    "label": "CBSA Delineation Files (July 2023)",
    "category": "Geography"
  },
  {
    "id": "120de3cc",
    "label": "US Motor Vehicle Traffic Fatalities, 1899-2024",
    "category": "Transportation"
  },
  {
    "id": "a5c05e83",
    "label": "Average Hourly Earnings",
    "category": "Labor"
  },
  {
    "id": "8a96906c",
    "label": "Real Median Household Income",
    "category": "Economics"
  },
  {
    "id": "e762c6c7",
    "label": "Healthcare Spending per Capita",
    "category": "Health"
  },
  {
    "id": "7be51af9",
    "label": "Billion-Dollar Weather Disasters by State",
    "category": "Environment"
  },
  {
    "id": "c653f3db",
    "label": "Palmer Penguins",
    "category": "Technology"
  },
  {
    "id": "2fafe82c",
    "label": "GISTEMP Global Temperature",
    "category": "Environment"
  },
  {
    "id": "1e194f91",
    "label": "Agricultural Land per Capita",
    "category": "Agriculture"
  },
  {
    "id": "56a1067e",
    "label": "Unemployment Rate",
    "category": "Economics"
  },
  {
    "id": "e3d2b0bf",
    "label": "Storm Events Database",
    "category": "Environment"
  },
  {
    "id": "c9a123b4",
    "label": "Texas Consecutive Unacceptable Campus & District List",
    "category": "Education"
  },
  {
    "id": "d15368f8",
    "label": "Historical Weather Data",
    "category": "Environment"
  },
  {
    "id": "1db2ee60",
    "label": "California Housing",
    "category": "Housing"
  },
  {
    "id": "4b5309ba",
    "label": "Global Life Expectancy",
    "category": "Demographics"
  },
  {
    "id": "450639fa",
    "label": "Income Share of Top 1%",
    "category": "Economics"
  },
  {
    "id": "84ce2585",
    "label": "Children Not in School",
    "category": "Education"
  },
  {
    "id": "aa376596",
    "label": "Bank Marketing Dataset",
    "category": "Technology"
  },
  {
    "id": "df006bea",
    "label": "Diabetes Dataset",
    "category": "Health"
  },
  {
    "id": "50a5f7d8",
    "label": "Life Expectancy at Birth",
    "category": "Health"
  },
  {
    "id": "aaa374aa",
    "label": "PJM Capacity Market (RPM) Clearing Prices",
    "category": "Energy"
  },
  {
    "id": "4d19eb47",
    "label": "Life Expectancy",
    "category": "Health"
  },
  {
    "id": "5dc77801",
    "label": "Weekly Petroleum Prices",
    "category": "Energy"
  },
  {
    "id": "7a860867",
    "label": "GHCN Daily - Central Park NYC",
    "category": "Environment"
  },
  {
    "id": "6b296ce4",
    "label": "Educational Attainment by State",
    "category": "Education"
  },
  {
    "id": "1efcb5e1",
    "label": "Learning Outcomes",
    "category": "Education"
  },
  {
    "id": "f00be631",
    "label": "Malaria Deaths",
    "category": "Health"
  },
  {
    "id": "0e7508a4",
    "label": "Per-Pupil Expenditure by State",
    "category": "Education"
  },
  {
    "id": "0eadb747",
    "label": "Wdi",
    "category": "Economics"
  },
  {
    "id": "436ec7d4",
    "label": "Particulate Matter Air Pollution",
    "category": "Environment"
  },
  {
    "id": "3d3db1d4",
    "label": "Comparable Wage Index for Teachers (CWIFT)",
    "category": "Education"
  },
  {
    "id": "ca574889",
    "label": "Natural Gas Prices",
    "category": "Energy"
  },
  {
    "id": "4aaa270a",
    "label": "College Tuition Costs",
    "category": "Education"
  },
  {
    "id": "2551e62f",
    "label": "Suicide Rate",
    "category": "Health"
  },
  {
    "id": "0238c976",
    "label": "Debt to the Penny",
    "category": "Finance"
  },
  {
    "id": "f82f91ca",
    "label": "IPEDS Admissions and Test Scores",
    "category": "Education"
  },
  {
    "id": "98615cc0",
    "label": "Adult Income Dataset",
    "category": "Technology"
  },
  {
    "id": "17be5124",
    "label": "Breast Cancer Wisconsin (Diagnostic)",
    "category": "Technology"
  },
  {
    "id": "4099b1cd",
    "label": "Daily Air Quality (PM2.5)",
    "category": "Environment"
  },
  {
    "id": "560cc767",
    "label": "Annual Working Hours",
    "category": "Labor"
  },
  {
    "id": "3ce262e8",
    "label": "NFHS High School Athletics Participation Survey",
    "category": "Education"
  },
  {
    "id": "84d6b81d",
    "label": "WTI Crude Oil Price (Cushing, Oklahoma)",
    "category": "Energy"
  },
  {
    "id": "115b3abd",
    "label": "Houston ISD NES Campus Designations",
    "category": "Education"
  },
  {
    "id": "a996cfda",
    "label": "US Wind Turbine Database (USWTDB)",
    "category": "Energy"
  },
  {
    "id": "2d2fa764",
    "label": "Acs State",
    "category": "Demographics"
  },
  {
    "id": "d2ea2417",
    "label": "Beyonce Lyrics",
    "category": "Technology"
  },
  {
    "id": "3eda6b3d",
    "label": "Food Consumption CO2",
    "category": "Environment"
  },
  {
    "id": "af1126fa",
    "label": "Import Export Prices",
    "category": "Economics"
  },
  {
    "id": "0f7b2641",
    "label": "Wine Quality (White)",
    "category": "Technology"
  },
  {
    "id": "5eb80aa5",
    "label": "Average Consumer Prices",
    "category": "Economics"
  },
  {
    "id": "ad49b781",
    "label": "World Population Prospects",
    "category": "Demographics"
  },
  {
    "id": "084521e5",
    "label": "Composite Leading Indicators (CLI)",
    "category": "Economics"
  },
  {
    "id": "efa07496",
    "label": "Nobel Prize Winners",
    "category": "Demographics"
  },
  {
    "id": "808b411f",
    "label": "Maternal Mortality Ratio",
    "category": "Health"
  },
  {
    "id": "10ad2362",
    "label": "Mauna Loa CO2 (Keeling Curve)",
    "category": "Environment"
  },
  {
    "id": "dd904cd7",
    "label": "Philadelphia Parking Tickets",
    "category": "Government"
  },
  {
    "id": "0cb3f964",
    "label": "Life Satisfaction (Happiness)",
    "category": "Demographics"
  },
  {
    "id": "6a72e662",
    "label": "Parent and Family Involvement in Education (PFI) Survey, 2019",
    "category": "Education"
  },
  {
    "id": "39138d1e",
    "label": "Iris Dataset",
    "category": "Technology"
  },
  {
    "id": "3a212289",
    "label": "Spotify Songs",
    "category": "Technology"
  },
  {
    "id": "3215f78c",
    "label": "Fertility Rate",
    "category": "Demographics"
  },
  {
    "id": "35cdd473",
    "label": "Extreme Poverty Rate",
    "category": "Economics"
  },
  {
    "id": "9b3cb959",
    "label": "Airline Safety",
    "category": "Transportation"
  },
  {
    "id": "ec49291d",
    "label": "CO2 and Greenhouse Gas Emissions",
    "category": "Environment"
  },
  {
    "id": "a18b6665",
    "label": "Leading Causes of Death in the United States",
    "category": "Health"
  },
  {
    "id": "82c3869c",
    "label": "Productivity Costs",
    "category": "Labor"
  },
  {
    "id": "0f1eb55f",
    "label": "World Poverty and Inequality",
    "category": "Economics"
  },
  {
    "id": "2a01498b",
    "label": "Chained Cpi",
    "category": "Economics"
  },
  {
    "id": "ddd14ae3",
    "label": "College Majors",
    "category": "Labor"
  },
  {
    "id": "8a66c9bc",
    "label": "GDP per Capita (Current US$)",
    "category": "Economics"
  },
  {
    "id": "33031019",
    "label": "Labor Force",
    "category": "Labor"
  },
  {
    "id": "68d82c31",
    "label": "Crop and Livestock Production",
    "category": "Agriculture"
  },
  {
    "id": "3ea0627f",
    "label": "Occupational Employment",
    "category": "Labor"
  },
  {
    "id": "e84b1e2f",
    "label": "Global Energy Data",
    "category": "Energy"
  },
  {
    "id": "99d279cd",
    "label": "Education Spending",
    "category": "Education"
  },
  {
    "id": "a60ce701",
    "label": "State Employment",
    "category": "Labor"
  },
  {
    "id": "0ff4b159",
    "label": "Cpi W",
    "category": "Economics"
  },
  {
    "id": "1914dd63",
    "label": "Jolts",
    "category": "Labor"
  },
  {
    "id": "c84d7088",
    "label": "Current Employment Statistics - National",
    "category": "Labor"
  },
  {
    "id": "28272a35",
    "label": "Total Credit",
    "category": "Finance"
  },
  {
    "id": "37688dad",
    "label": "Common Core of Data (K-12)",
    "category": "Education"
  },
  {
    "id": "2b71f799",
    "label": "Real Gross Domestic Product",
    "category": "Economics"
  },
  {
    "id": "a357dfa8",
    "label": "Vaccination Coverage",
    "category": "Health"
  },
  {
    "id": "2e1af33d",
    "label": "Energy Consumption per Capita",
    "category": "Energy"
  },
  {
    "id": "be08a2e2",
    "label": "CDC WONDER Mortality Data",
    "category": "Health"
  },
  {
    "id": "fef77e18",
    "label": "NIBRS Property Crimes (National Estimates)",
    "category": "Crime"
  },
  {
    "id": "9ba64e50",
    "label": "S&P 500",
    "category": "Finance"
  },
  {
    "id": "eef16a28",
    "label": "NBA Player Statistics",
    "category": "Sports"
  },
  {
    "id": "8ec9d4c9",
    "label": "Airline On-Time Performance",
    "category": "Transportation"
  },
  {
    "id": "12470f7f",
    "label": "Gender Gap in Education",
    "category": "Education"
  },
  {
    "id": "e041ca9c",
    "label": "Titanic Passengers",
    "category": "Technology"
  },
  {
    "id": "9f56e7c9",
    "label": "HIV Prevalence",
    "category": "Health"
  },
  {
    "id": "2de020f3",
    "label": "FAO Food Price Index",
    "category": "Agriculture"
  },
  {
    "id": "29a7322d",
    "label": "U.S. Recession Indicator",
    "category": "Economics"
  },
  {
    "id": "c6136ab6",
    "label": "Canada Births",
    "category": "Demographics"
  },
  {
    "id": "6a2536bd",
    "label": "Mismanaged Plastic Waste",
    "category": "Environment"
  },
  {
    "id": "2e822ae1",
    "label": "S&P/Case-Shiller U.S. National Home Price Index",
    "category": "Housing"
  },
  {
    "id": "9e51c024",
    "label": "Birth and Death Rates",
    "category": "Demographics"
  },
  {
    "id": "b49b36b7",
    "label": "Wildlife Aircraft Strikes",
    "category": "Transportation"
  },
  {
    "id": "c9555977",
    "label": "Plastic Pollution",
    "category": "Environment"
  },
  {
    "id": "674e8b89",
    "label": "World Cheeses",
    "category": "Agriculture"
  },
  {
    "id": "5a577e3d",
    "label": "Cpi U",
    "category": "Economics"
  },
  {
    "id": "b73bc4c6",
    "label": "Literacy Rate",
    "category": "Education"
  },
  {
    "id": "6a4cfe3c",
    "label": "Renewable Electricity Generation",
    "category": "Energy"
  },
  {
    "id": "725517c2",
    "label": "CO2 Emissions per Capita",
    "category": "Environment"
  },
  {
    "id": "07fb8f8d",
    "label": "University of Michigan Consumer Sentiment Index",
    "category": "Economics"
  },
  {
    "id": "6cf22e37",
    "label": "Retail Sales",
    "category": "Economics"
  },
  {
    "id": "590b4841",
    "label": "American Community Survey 5-Year Estimates",
    "category": "Demographics"
  },
  {
    "id": "3dd29ab5",
    "label": "Federal Funds Effective Rate",
    "category": "Economics"
  },
  {
    "id": "8bf049b5",
    "label": "Housing Starts",
    "category": "Housing"
  },
  {
    "id": "f33a7b4b",
    "label": "Personal Consumption Expenditures",
    "category": "Economics"
  },
  {
    "id": "44697716",
    "label": "Consumer Price Index for All Urban Consumers",
    "category": "Economics"
  },
  {
    "id": "7177105c",
    "label": "Industrial Production Index",
    "category": "Economics"
  },
  {
    "id": "b38b70f4",
    "label": "GDP (Current US$)",
    "category": "Economics"
  },
  {
    "id": "33c92385",
    "label": "Animals Slaughtered for Meat",
    "category": "Agriculture"
  },
  {
    "id": "497a8e09",
    "label": "Global Earthquake Catalog",
    "category": "Environment"
  },
  {
    "id": "05c11d7e",
    "label": "Initial Unemployment Claims",
    "category": "Labor"
  },
  {
    "id": "eeae336d",
    "label": "M2 Money Supply",
    "category": "Economics"
  },
  {
    "id": "8536b2fa",
    "label": "Candy Power Ranking",
    "category": "Agriculture"
  },
  {
    "id": "144b6c42",
    "label": "Tour de France Winners",
    "category": "Sports"
  },
  {
    "id": "431f97f2",
    "label": "Population",
    "category": "Demographics"
  },
  {
    "id": "c42bef2c",
    "label": "10-Year Treasury Constant Maturity Rate",
    "category": "Finance"
  },
  {
    "id": "ce852fed",
    "label": "Daily Treasury Yield Curve",
    "category": "Finance"
  },
  {
    "id": "f01f07c0",
    "label": "Trade as Percentage of GDP",
    "category": "Economics"
  },
  {
    "id": "fff00cf4",
    "label": "Electric Vehicle Sales Share",
    "category": "Transportation"
  },
  {
    "id": "92f886ef",
    "label": "Nba Elo",
    "category": "Sports"
  },
  {
    "id": "85d0fecb",
    "label": "Boston Housing (Legacy)",
    "category": "Housing"
  },
  {
    "id": "9b4e05e4",
    "label": "Executive Corruption Index",
    "category": "Government"
  },
  {
    "id": "14324148",
    "label": "NIBRS Crime Incidents (National Estimates)",
    "category": "Crime"
  },
  {
    "id": "3eb245c0",
    "label": "Heart Disease Dataset",
    "category": "Health"
  },
  {
    "id": "a8c45ee3",
    "label": "Tuberculosis Incidence",
    "category": "Health"
  },
  {
    "id": "915683b2",
    "label": "English Monarchs",
    "category": "Demographics"
  },
  {
    "id": "a2bc0e5e",
    "label": "Heart Failure Clinical Records",
    "category": "Health"
  },
  {
    "id": "f5819b06",
    "label": "Wine Quality (Red)",
    "category": "Technology"
  },
  {
    "id": "fe8325c8",
    "label": "Digits Dataset",
    "category": "Technology"
  },
  {
    "id": "b105ac84",
    "label": "Gross Domestic Product",
    "category": "Economics"
  },
  {
    "id": "9dc974de",
    "label": "2020 Decennial Census",
    "category": "Demographics"
  },
  {
    "id": "a6e15bd3",
    "label": "Chess Games",
    "category": "Sports"
  },
  {
    "id": "5c648979",
    "label": "NYC Yellow Taxi Trips (2024-01)",
    "category": "Transportation"
  },
  {
    "id": "56620299",
    "label": "County Personal Income & GDP by Industry (BEA)",
    "category": "Economics"
  },
  {
    "id": "dd7af505",
    "label": "Nuclear Power Generation",
    "category": "Energy"
  },
  {
    "id": "2541e5ce",
    "label": "US Cheese Consumption",
    "category": "Agriculture"
  },
  {
    "id": "4d1d962e",
    "label": "Valentines Spending",
    "category": "Economics"
  },
  {
    "id": "fecbb633",
    "label": "Behavioral Risk Factor Surveillance System (BRFSS)",
    "category": "Health"
  },
  {
    "id": "74be3d9a",
    "label": "Bad Drivers",
    "category": "Health"
  },
  {
    "id": "15da530a",
    "label": "Unemployment Rate",
    "category": "Economics"
  },
  {
    "id": "453662c7",
    "label": "GDP by Industry",
    "category": "Economics"
  },
  {
    "id": "f0ee5389",
    "label": "Global Vaccination Coverage",
    "category": "Health"
  },
  {
    "id": "1e39edcd",
    "label": "Population by Age Group",
    "category": "Demographics"
  },
  {
    "id": "0e57a1d2",
    "label": "Store Sales Time Series",
    "category": "Technology"
  },
  {
    "id": "1dbbde7f",
    "label": "Ramen Ratings",
    "category": "Agriculture"
  },
  {
    "id": "09f8dd6a",
    "label": "Women's World Cup Results",
    "category": "Sports"
  },
  {
    "id": "1e5ca178",
    "label": "Democracy Index",
    "category": "Government"
  },
  {
    "id": "3a812be5",
    "label": "Credit Card Fraud Detection",
    "category": "Technology"
  },
  {
    "id": "3a3ddeea",
    "label": "S&P 500 Companies",
    "category": "Finance"
  },
  {
    "id": "bbb485e1",
    "label": "Space Launches",
    "category": "Technology"
  },
  {
    "id": "b2917c87",
    "label": "Ppi",
    "category": "Economics"
  },
  {
    "id": "71d6bd43",
    "label": "Ames Iowa Housing",
    "category": "Housing"
  },
  {
    "id": "771a950b",
    "label": "State Housing Price Index",
    "category": "Housing"
  },
  {
    "id": "36e2ef47",
    "label": "IPEDS College Data",
    "category": "Education"
  },
  {
    "id": "7684c0d6",
    "label": "Forest Coverage",
    "category": "Environment"
  },
  {
    "id": "b51d865f",
    "label": "Texas Crude Oil & Natural Gas Production",
    "category": "Energy"
  },
  {
    "id": "c847d0cc",
    "label": "Local Unemployment",
    "category": "Labor"
  },
  {
    "id": "715bffbd",
    "label": "Influenza Surveillance (ILINet)",
    "category": "Health"
  },
  {
    "id": "44d2368a",
    "label": "ECB Official Interest Rates",
    "category": "Finance"
  },
  {
    "id": "9016d792",
    "label": "U.S. Trade Balance",
    "category": "Economics"
  },
  {
    "id": "2d227071",
    "label": "Global Fossil Fuel Consumption",
    "category": "Energy"
  },
  {
    "id": "78518dc3",
    "label": "IMDb Movie Reviews",
    "category": "Technology"
  },
  {
    "id": "6deed922",
    "label": "Freedom of Expression Index",
    "category": "Government"
  },
  {
    "id": "daefe08b",
    "label": "Influenza Virology (WHO/NREVSS)",
    "category": "Health"
  },
  {
    "id": "cd309991",
    "label": "Monthly Treasury Statement",
    "category": "Government"
  },
  {
    "id": "cef214da",
    "label": "Historical Debt Outstanding",
    "category": "Finance"
  },
  {
    "id": "268ea809",
    "label": "Tax Revenue as Share of GDP",
    "category": "Economics"
  },
  {
    "id": "443d2919",
    "label": "Obesity Prevalence",
    "category": "Health"
  },
  {
    "id": "b8adbe4f",
    "label": "Renewable Energy Production",
    "category": "Energy"
  },
  {
    "id": "67d76234",
    "label": "Average Years of Schooling",
    "category": "Education"
  },
  {
    "id": "6c009f14",
    "label": "Atlantic Hurricanes",
    "category": "Environment"
  },
  {
    "id": "d1b47db7",
    "label": "Personal Food Expenditures",
    "category": "Agriculture"
  },
  {
    "id": "fc1ba7b8",
    "label": "Trade as Share of GDP",
    "category": "Economics"
  },
  {
    "id": "0f96e5c0",
    "label": "Electricity Production by Source",
    "category": "Energy"
  },
  {
    "id": "c4733c74",
    "label": "Global Temperature Anomaly",
    "category": "Environment"
  },
  {
    "id": "2686da58",
    "label": "Employment Cost Index",
    "category": "Economics"
  },
  {
    "id": "473c9cee",
    "label": "COVID-19 Global Data",
    "category": "Health"
  },
  {
    "id": "48afc7c9",
    "label": "Human Development Index",
    "category": "Demographics"
  },
  {
    "id": "1f2ba0f7",
    "label": "Wine Dataset",
    "category": "Technology"
  },
  {
    "id": "8971b345",
    "label": "Water Quality Measurements",
    "category": "Environment"
  },
  {
    "id": "39a6689b",
    "label": "WHO Global Health Observatory Indicators",
    "category": "Health"
  },
  {
    "id": "557417a3",
    "label": "Coffee Quality Ratings",
    "category": "Agriculture"
  },
  {
    "id": "2277635d",
    "label": "Competition",
    "category": "Technology"
  },
  {
    "id": "1352e65b",
    "label": "HadCRUT5 Global Temperature",
    "category": "Environment"
  },
  {
    "id": "c78d884e",
    "label": "Penn World Table",
    "category": "Economics"
  },
  {
    "id": "7c50570c",
    "label": "Global Mean Sea Level",
    "category": "Environment"
  },
  {
    "id": "54db5551",
    "label": "Mental Health (Anxiety/Depression)",
    "category": "Health"
  },
  {
    "id": "0982491b",
    "label": "Homicide Rate",
    "category": "Crime"
  },
  {
    "id": "974e7e71",
    "label": "Average Height",
    "category": "Demographics"
  },
  {
    "id": "14153458",
    "label": "Child Mortality Rate",
    "category": "Health"
  },
  {
    "id": "d041e296",
    "label": "Global Electricity Generation",
    "category": "Energy"
  },
  {
    "id": "69d330da",
    "label": "GDP per Capita",
    "category": "Economics"
  },
  {
    "id": "049a933e",
    "label": "Gini Coefficient",
    "category": "Economics"
  },
  {
    "id": "923f29c4",
    "label": "Human Rights Index",
    "category": "Government"
  },
  {
    "id": "50b16c4e",
    "label": "World Population",
    "category": "Demographics"
  },
  {
    "id": "8e671004",
    "label": "Work Stoppages",
    "category": "Labor"
  },
  {
    "id": "ce06614e",
    "label": "Weekly Earnings",
    "category": "Labor"
  },
  {
    "id": "fbc4faaf",
    "label": "Wage Estimates",
    "category": "Labor"
  },
  {
    "id": "ad9c19aa",
    "label": "Union Affiliation",
    "category": "Labor"
  },
  {
    "id": "48885493",
    "label": "Time Use",
    "category": "Labor"
  },
  {
    "id": "c72f6835",
    "label": "Ppi Commodities",
    "category": "Economics"
  },
  {
    "id": "bdfed3c3",
    "label": "Occupational Requirements",
    "category": "Labor"
  },
  {
    "id": "e88a3319",
    "label": "Weekly Unemployment Claims by State",
    "category": "Labor"
  },
  {
    "id": "ad332145",
    "label": "National Compensation",
    "category": "Labor"
  },
  {
    "id": "ab158b59",
    "label": "Multifactor Productivity",
    "category": "Labor"
  },
  {
    "id": "1bfadfc7",
    "label": "International Labor",
    "category": "Labor"
  },
  {
    "id": "56442841",
    "label": "Injuries Industry",
    "category": "Labor"
  },
  {
    "id": "56dda441",
    "label": "Employer Costs",
    "category": "Economics"
  },
  {
    "id": "502c7f61",
    "label": "Consumer Expenditure",
    "category": "Economics"
  },
  {
    "id": "92f6487f",
    "label": "Employee Benefits",
    "category": "Labor"
  },
  {
    "id": "a6e16eab",
    "label": "Business Dynamics",
    "category": "Labor"
  },
  {
    "id": "3283659e",
    "label": "Geographic Profile",
    "category": "Labor"
  },
  {
    "id": "98d2ca01",
    "label": "Industry Productivity",
    "category": "Labor"
  },
  {
    "id": "b362a86a",
    "label": "Fatal Injuries",
    "category": "Labor"
  },
  {
    "id": "4358224a",
    "label": "Family Labor Force",
    "category": "Labor"
  },
  {
    "id": "8ac0d11c",
    "label": "EIA-860 Annual Generator Inventory",
    "category": "Energy"
  },
  {
    "id": "879a27ab",
    "label": "Annual Area Burnt by Wildfires",
    "category": "Environment"
  },
  {
    "id": "1628cb00",
    "label": "Arctic Sea Ice Extent (Daily)",
    "category": "Environment"
  },
  {
    "id": "66fc9c5b",
    "label": "Illinois Report Card",
    "category": "Education"
  },
  {
    "id": "1516d201",
    "label": "State Population (Decennial Census)",
    "category": "Demographics"
  },
  {
    "id": "18dd7983",
    "label": "Small Area Income and Poverty Estimates (SAIPE)",
    "category": "Economics"
  },
  {
    "id": "7f5d92ad",
    "label": "ACT Scores (State & National)",
    "category": "Education"
  },
  {
    "id": "2107c251",
    "label": "Federal Disaster Declarations",
    "category": "Environment"
  },
  {
    "id": "d6b61b7d",
    "label": "NAEP Scores (Nation's Report Card)",
    "category": "Education"
  },
  {
    "id": "63ef8999",
    "label": "NAEP Long-Term Trend (Ages 9, 13, 17)",
    "category": "Education"
  },
  {
    "id": "fcd2fdfb",
    "label": "Vital Statistics Provisional Birth Counts",
    "category": "Health"
  },
  {
    "id": "700c90d2",
    "label": "HCAHPS Patient Satisfaction Survey",
    "category": "Health"
  },
  {
    "id": "5a8c385b",
    "label": "CPI: Food and Beverages",
    "category": "Economics"
  },
  {
    "id": "cfbdae52",
    "label": "CPI: Medical Care",
    "category": "Economics"
  },
  {
    "id": "dc9058e2",
    "label": "CPI: Shelter",
    "category": "Housing"
  },
  {
    "id": "df9e6431",
    "label": "Median Sales Price of New Houses Sold",
    "category": "Housing"
  },
  {
    "id": "74d1d47b",
    "label": "IPEDS Graduation Rates (150% Normal Time)",
    "category": "Education"
  },
  {
    "id": "b6243e8d",
    "label": "CPI: Transportation",
    "category": "Economics"
  },
  {
    "id": "ef877814",
    "label": "30-Year Fixed Rate Mortgage Average",
    "category": "Finance"
  },
  {
    "id": "a6c6b8c4",
    "label": "National Health Expenditure Per Capita",
    "category": "Health"
  },
  {
    "id": "2d240e95",
    "label": "SAT Scores (State & National)",
    "category": "Education"
  },
  {
    "id": "17ff9ab4",
    "label": "CPI: Rent of Primary Residence",
    "category": "Economics"
  },
  {
    "id": "ad1d40fa",
    "label": "Healthcare Spending by Function (USD PPP per Capita)",
    "category": "Health"
  },
  {
    "id": "5fecd4ce",
    "label": "Pharmaceutical Spending (USD PPP per Capita)",
    "category": "Health"
  },
  {
    "id": "97895716",
    "label": "National Health Expenditure by Category",
    "category": "Health"
  },
  {
    "id": "24c922b0",
    "label": "Health Insurance Coverage by State",
    "category": "Health"
  },
  {
    "id": "1555f94b",
    "label": "Health Expenditure by Source",
    "category": "Government"
  },
  {
    "id": "ce8f07f6",
    "label": "Mirror Mirror Healthcare Rankings",
    "category": "Health"
  },
  {
    "id": "9bb38101",
    "label": "Short-Term Rental Locations",
    "category": "Housing"
  },
  {
    "id": "7cecad26",
    "label": "Campaign Finance Transaction Detail",
    "category": "Government"
  },
  {
    "id": "bef6c19b",
    "label": "Members of Congress",
    "category": "Government"
  },
  {
    "id": "b7a21a0d",
    "label": "Real-Time Traffic Incident Reports",
    "category": "Transportation"
  },
  {
    "id": "82c20686",
    "label": "Construction Permits - New Construction & Remodels (Since 2016)",
    "category": "Housing"
  },
  {
    "id": "1f08d7ae",
    "label": "Austin Crime Reports",
    "category": "Crime"
  },
  {
    "id": "899b7fc5",
    "label": "CRDC - Advanced Placement Enrollment",
    "category": "Education"
  },
  {
    "id": "7a82b2e3",
    "label": "Issued Construction Permits",
    "category": "Housing"
  },
  {
    "id": "07a26cdf",
    "label": "Residential Demolitions",
    "category": "Housing"
  },
  {
    "id": "d782b600",
    "label": "Affordable Housing Inventory",
    "category": "Housing"
  },
  {
    "id": "41118414",
    "label": "Austin Code Complaint Cases",
    "category": "Housing"
  },
  {
    "id": "c6993b06",
    "label": "Texas ISD Debt Outstanding (BRB)",
    "category": "Finance"
  },
  {
    "id": "202e91a5",
    "label": "Austin Crash Report Data",
    "category": "Transportation"
  },
  {
    "id": "67d45e81",
    "label": "CRDC - Referrals to Law Enforcement & School Arrests",
    "category": "Education"
  },
  {
    "id": "027a65ce",
    "label": "APD Arrests",
    "category": "Crime"
  },
  {
    "id": "22d6f057",
    "label": "Austin MetroBike Trips",
    "category": "Transportation"
  },
  {
    "id": "7e06c948",
    "label": "County Housing Costs (ACS)",
    "category": "Housing"
  },
  {
    "id": "c580c6fd",
    "label": "Austin 311 Public Data",
    "category": "Government"
  },
  {
    "id": "d2ad2d04",
    "label": "APD Computer Aided Dispatch Incidents",
    "category": "Crime"
  },
  {
    "id": "9a8d4ed3",
    "label": "Parking Transactions",
    "category": "Economics"
  },
  {
    "id": "e458e31c",
    "label": "Provisional Drug Overdose Death Counts",
    "category": "Health"
  },
  {
    "id": "5deb01c2",
    "label": "City Demographics by Race/Ethnicity (ACS)",
    "category": "Demographics"
  },
  {
    "id": "d4ab43e0",
    "label": "College Scorecard (Institution Level)",
    "category": "Education"
  },
  {
    "id": "eebb5ed8",
    "label": "Net Migration by Country",
    "category": "Demographics"
  },
  {
    "id": "1bae87b9",
    "label": "Texas Charter School Finance (PEIMS)",
    "category": "Education"
  },
  {
    "id": "70a91a40",
    "label": "Cancer Incidence by State (USCS)",
    "category": "Health"
  },
  {
    "id": "25f908c0",
    "label": "Austin Population by Year",
    "category": "Demographics"
  },
  {
    "id": "a1ea0b9c",
    "label": "Zillow Home Value Index (ZHVI)",
    "category": "Housing"
  },
  {
    "id": "49b2393f",
    "label": "Education Pays - Earnings and Unemployment by Education Level",
    "category": "Economics"
  },
  {
    "id": "331fa22e",
    "label": "State Median Household Income (ACS)",
    "category": "Demographics"
  },
  {
    "id": "f8667a98",
    "label": "Human Capital Index (HCI)",
    "category": "Education"
  },
  {
    "id": "9cf14f1e",
    "label": "FDA New Molecular Entity Approvals",
    "category": "Health"
  },
  {
    "id": "7ac15094",
    "label": "Texas ISD Financial Statements Discovery",
    "category": "Government"
  },
  {
    "id": "2b8277fb",
    "label": "IRA Negotiated Drug Prices (Maximum Fair Prices)",
    "category": "Health"
  },
  {
    "id": "aa8bc157",
    "label": "FDA Orange Book",
    "category": "Health"
  },
  {
    "id": "1d0aadfb",
    "label": "Medicare Part D Spending by Drug",
    "category": "Health"
  },
  {
    "id": "4fadc33f",
    "label": "National Average Drug Acquisition Cost (NADAC)",
    "category": "Health"
  },
  {
    "id": "fed9cdaa",
    "label": "PPI: Pharmaceutical Preparations",
    "category": "Health"
  },
  {
    "id": "21e7a058",
    "label": "Illinois SAT Scores",
    "category": "Education"
  },
  {
    "id": "df2c54a4",
    "label": "Drugs@FDA: Complete Database",
    "category": "Health"
  },
  {
    "id": "b00d370c",
    "label": "Medicare Part B Drug Payment Limits (ASP Pricing)",
    "category": "Health"
  },
  {
    "id": "8fbc9de8",
    "label": "CIP to SOC Crosswalk (2020-2018)",
    "category": "Education"
  },
  {
    "id": "f643ecac",
    "label": "PPI: Pharmaceuticals for Human Use (Prescription)",
    "category": "Economics"
  },
  {
    "id": "610ed501",
    "label": "PPI: Pharmaceutical & Medicine Manufacturing",
    "category": "Economics"
  },
  {
    "id": "bd305a53",
    "label": "PPI: Pharmacy Retailing of Prescription Drugs",
    "category": "Economics"
  },
  {
    "id": "5f0b9fec",
    "label": "Medicare Part B Spending by Drug",
    "category": "Health"
  },
  {
    "id": "0b541098",
    "label": "IPEDS Student Financial Aid",
    "category": "Education"
  },
  {
    "id": "c9fc6032",
    "label": "Medicaid Spending by Drug",
    "category": "Health"
  },
  {
    "id": "777a289e",
    "label": "ACA Federal Upper Limits (FUL)",
    "category": "Health"
  },
  {
    "id": "e337f334",
    "label": "California Prescription Drug WAC Price Increases",
    "category": "Health"
  },
  {
    "id": "1ab6738e",
    "label": "California New Drug Launch Prices",
    "category": "Health"
  },
  {
    "id": "b164a37d",
    "label": "VA Federal Supply Schedule Drug Prices",
    "category": "Health"
  },
  {
    "id": "da1f2440",
    "label": "Medicaid Drug Rebate Program Products",
    "category": "Health"
  },
  {
    "id": "5a4829ca",
    "label": "FDA Drug Shortages",
    "category": "Health"
  },
  {
    "id": "1b7dc192",
    "label": "FDA National Drug Code (NDC) Directory",
    "category": "Health"
  },
  {
    "id": "5a8dbd74",
    "label": "Dallas Fed Energy Survey",
    "category": "Energy"
  },
  {
    "id": "3eae51cb",
    "label": "FDA Drug Recalls & Enforcement Actions",
    "category": "Health"
  },
  {
    "id": "a2436776",
    "label": "Medicaid State Drug Utilization Data (SDUD)",
    "category": "Health"
  },
  {
    "id": "a82bc0f4",
    "label": "Nominal Median Household Income",
    "category": "Demographics"
  },
  {
    "id": "5e7c42f4",
    "label": "Dialysis Facility Compare",
    "category": "Health"
  },
  {
    "id": "654b94b2",
    "label": "Federal Student Loan Portfolio by Age and Debt Size",
    "category": "Finance"
  },
  {
    "id": "d3006053",
    "label": "Federal Student Loan Portfolio by Loan Status",
    "category": "Finance"
  },
  {
    "id": "0ec8d1a5",
    "label": "TEFA Applications",
    "category": "Education"
  },
  {
    "id": "77256190",
    "label": "Direct Loan Portfolio by Repayment Plan",
    "category": "Education"
  },
  {
    "id": "00cf0443",
    "label": "SNAP (Food Stamps) Annual Participation & Costs",
    "category": "Economics"
  },
  {
    "id": "7fe016a3",
    "label": "Point-in-Time Homeless Counts by State",
    "category": "Housing"
  },
  {
    "id": "f37290ab",
    "label": "Federal Poverty Guidelines",
    "category": "Economics"
  },
  {
    "id": "6657fbbd",
    "label": "Fair Market Rents by County (2-Bedroom)",
    "category": "Housing"
  },
  {
    "id": "aae279fa",
    "label": "NCHS Drug Poisoning Mortality by County",
    "category": "Health"
  },
  {
    "id": "18d48d6a",
    "label": "VSRR Provisional County-Level Drug Overdose Death Counts",
    "category": "Health"
  },
  {
    "id": "ff72ab46",
    "label": "Opioid Treatment Program Providers",
    "category": "Health"
  },
  {
    "id": "c28fb945",
    "label": "TEDS Treatment Episode Data Set - Admissions",
    "category": "Health"
  },
  {
    "id": "484024e3",
    "label": "County Health Rankings",
    "category": "Health"
  },
  {
    "id": "00ead12b",
    "label": "Medicare Part D Opioid Prescribing Rates by Geography",
    "category": "Health"
  },
  {
    "id": "bd265307",
    "label": "Medicaid Opioid Prescribing Rates by Geography",
    "category": "Health"
  },
  {
    "id": "ed1206b2",
    "label": "TEFA Special Education Applicants",
    "category": "Education"
  },
  {
    "id": "5d467ffd",
    "label": "Mental Health Professional Shortage Areas (HPSAs)",
    "category": "Health"
  },
  {
    "id": "b2b2c029",
    "label": "EU Drug-Induced Deaths",
    "category": "Health"
  },
  {
    "id": "15b28022",
    "label": "Opioid Prescribing in Primary Care",
    "category": "Health"
  },
  {
    "id": "dcb1db02",
    "label": "Analgesic Consumption (DDD per 1,000 Population per Day)",
    "category": "Health"
  },
  {
    "id": "3b9717bc",
    "label": "EU Treatment Demand by Substance",
    "category": "Health"
  },
  {
    "id": "1f6c8a5e",
    "label": "WHO Drug Poisoning & Substance Use Mortality",
    "category": "Health"
  },
  {
    "id": "6e357310",
    "label": "UNODC World Drug Report Statistical Annex",
    "category": "Crime"
  },
  {
    "id": "20b66d65",
    "label": "Texas Public School District Finance (PEIMS)",
    "category": "Education"
  },
  {
    "id": "72ef498b",
    "label": "Texas Recapture (Robin Hood) Payments by District",
    "category": "Education"
  },
  {
    "id": "0d4dee1a",
    "label": "Texas A-F Accountability Ratings",
    "category": "Education"
  },
  {
    "id": "811328b8",
    "label": "Texas TAPR District STAAR Performance",
    "category": "Education"
  },
  {
    "id": "dbbb54e5",
    "label": "Texas Average Daily Attendance & Weighted ADA",
    "category": "Education"
  },
  {
    "id": "5361811c",
    "label": "Texas School District Geographic Boundaries",
    "category": "Education"
  },
  {
    "id": "94922603",
    "label": "Texas School District Directory (AskTED)",
    "category": "Education"
  },
  {
    "id": "63f586be",
    "label": "Texas Superintendent Compensation",
    "category": "Education"
  },
  {
    "id": "a5d1e558",
    "label": "Texas School Campus Locations",
    "category": "Education"
  },
  {
    "id": "4d44ba53",
    "label": "Texas Summarized PEIMS Financial Data",
    "category": "Education"
  },
  {
    "id": "b762c64a",
    "label": "Texas Excess Local Revenue (Chapter 41/49) Districts",
    "category": "Government"
  },
  {
    "id": "c71d2daf",
    "label": "Texas District Wealth per Weighted ADA",
    "category": "Education"
  },
  {
    "id": "70f37b65",
    "label": "District Dropout Rates",
    "category": "Education"
  },
  {
    "id": "81aa80b0",
    "label": "District Graduation/Completion Rates",
    "category": "Education"
  },
  {
    "id": "1a248c3f",
    "label": "District Enrollment by Demographics",
    "category": "Education"
  },
  {
    "id": "acfbc88d",
    "label": "District Staffing Levels",
    "category": "Education"
  },
  {
    "id": "42a0f495",
    "label": "Free/Reduced Lunch Eligibility",
    "category": "Education"
  },
  {
    "id": "0b57e258",
    "label": "F-33 School District Finance Survey",
    "category": "Education"
  },
  {
    "id": "74c8accc",
    "label": "Average Teacher Salary by State",
    "category": "Education"
  },
  {
    "id": "b798b44d",
    "label": "Texas Basic Allotment History",
    "category": "Education"
  },
  {
    "id": "1c32c00d",
    "label": "Texas Economic Stabilization Fund (Rainy Day Fund)",
    "category": "Government"
  },
  {
    "id": "41836b44",
    "label": "Texas School District Tax Rates and Levies",
    "category": "Education"
  },
  {
    "id": "c624be6b",
    "label": "Hospital General Information",
    "category": "Health"
  },
  {
    "id": "3277f8da",
    "label": "Hospital Readmissions Reduction Program",
    "category": "Health"
  },
  {
    "id": "ca369d81",
    "label": "Medicaid & CHIP Enrollment by State",
    "category": "Health"
  },
  {
    "id": "11b77b6c",
    "label": "ACA Marketplace Plans (QHP Landscape)",
    "category": "Health"
  },
  {
    "id": "eb68efad",
    "label": "Texas Appropriation Numbers and Titles by Agency",
    "category": "Government"
  },
  {
    "id": "b87ed21f",
    "label": "Texas State Expenditures by County",
    "category": "Government"
  },
  {
    "id": "3eafc6ab",
    "label": "RRC Underground Injection Control Well Locations",
    "category": "Energy"
  },
  {
    "id": "8d96b61f",
    "label": "RRC Well Bottom Hole Locations",
    "category": "Energy"
  },
  {
    "id": "507ff4c9",
    "label": "TABC License and Permit Information",
    "category": "Government"
  },
  {
    "id": "713dbcd3",
    "label": "TCEQ Notices of Violation",
    "category": "Environment"
  },
  {
    "id": "76fe7a09",
    "label": "Texas WARN Act Layoff Notices",
    "category": "Labor"
  },
  {
    "id": "b3f0b660",
    "label": "Nursing Home Provider Information",
    "category": "Health"
  },
  {
    "id": "e7719d07",
    "label": "Dental Health Professional Shortage Areas (HPSAs)",
    "category": "Health"
  },
  {
    "id": "60cb3d6a",
    "label": "WHO Noncommunicable Disease Mortality",
    "category": "Health"
  },
  {
    "id": "3728477e",
    "label": "Primary Care Health Professional Shortage Areas (HPSAs)",
    "category": "Health"
  },
  {
    "id": "f82a68b0",
    "label": "WHO Universal Health Coverage Service Index",
    "category": "Health"
  },
  {
    "id": "c6a1d9fc",
    "label": "Home Health Care Agency Quality",
    "category": "Health"
  },
  {
    "id": "41090665",
    "label": "CBP Border Encounters (USBP)",
    "category": "Government"
  },
  {
    "id": "d3823c15",
    "label": "State-to-State Migration Flows (ACS)",
    "category": "Demographics"
  },
  {
    "id": "3c682d57",
    "label": "ICE Enforcement Arrests",
    "category": "Government"
  },
  {
    "id": "54b4a7a1",
    "label": "DHS Yearbook - Lawful Permanent Residents by Country",
    "category": "Government"
  },
  {
    "id": "a667e0b2",
    "label": "DHS Immigration Enforcement Monthly Tables",
    "category": "Government"
  },
  {
    "id": "42972329",
    "label": "DHS Yearbook - Naturalizations by Country",
    "category": "Government"
  },
  {
    "id": "f88f53dd",
    "label": "Refugee Admissions (WRAPS)",
    "category": "Government"
  },
  {
    "id": "0267e3a9",
    "label": "International Migrant Stock",
    "category": "Demographics"
  },
  {
    "id": "cd9ec31b",
    "label": "Nonimmigrant Visa Issuances",
    "category": "Government"
  },
  {
    "id": "7f0db69b",
    "label": "H-1B Employer Data Hub",
    "category": "Government"
  },
  {
    "id": "2c35647f",
    "label": "County-to-County Migration Inflow (IRS SOI)",
    "category": "Demographics"
  },
  {
    "id": "2751f4b9",
    "label": "Florida Federal Cohort Graduation Rates",
    "category": "Education"
  },
  {
    "id": "a9e72655",
    "label": "Florida FAST Assessment Scores (District Level)",
    "category": "Education"
  },
  {
    "id": "d025bd47",
    "label": "Florida Education Finance Program (FEFP) Allocations",
    "category": "Other"
  },
  {
    "id": "e933072b",
    "label": "Florida Family Empowerment Scholarship FTE by Program",
    "category": "Other"
  },
  {
    "id": "5f173065",
    "label": "Florida Public School Grades",
    "category": "Education"
  },
  {
    "id": "e96d4b53",
    "label": "Florida Public School Enrollment by Race/Ethnicity",
    "category": "Education"
  },
  {
    "id": "a7c90e13",
    "label": "Florida Public School Enrollment by Grade",
    "category": "Education"
  },
  {
    "id": "91164edd",
    "label": "Florida FSA Assessment Scores (District Level)",
    "category": "Education"
  },
  {
    "id": "8ce78d6f",
    "label": "OFAC Specially Designated Nationals (SDN) List",
    "category": "Government"
  },
  {
    "id": "de1c4994",
    "label": "Annual Survey of School System Finances (F-33)",
    "category": "Education"
  },
  {
    "id": "9d53774d",
    "label": "DHS Fentanyl Disruption Seizures",
    "category": "Government"
  },
  {
    "id": "3795df99",
    "label": "Global Organized Crime Index",
    "category": "Crime"
  },
  {
    "id": "7bbc096c",
    "label": "MLR Insurer Directory",
    "category": "Health"
  },
  {
    "id": "0f920e26",
    "label": "Hospital Provider Cost Report",
    "category": "Health"
  },
  {
    "id": "a46b0cfd",
    "label": "Medical Loss Ratio Financial Data",
    "category": "Health"
  },
  {
    "id": "d1fad88d",
    "label": "AHA Costs of Caring Report",
    "category": "Health"
  },
  {
    "id": "11f957b1",
    "label": "Texas TAPR Campus Graduation Rates",
    "category": "Other"
  },
  {
    "id": "21242f03",
    "label": "School Neighborhood Poverty Estimates",
    "category": "Education"
  },
  {
    "id": "93015201",
    "label": "AHA Hospital Service Line Margins",
    "category": "Health"
  },
  {
    "id": "7404846d",
    "label": "SOC 2010 to 2018 Crosswalk",
    "category": "Labor"
  },
  {
    "id": "44f62544",
    "label": "Texas STAAR EOC Campus Performance (Cambium)",
    "category": "Education"
  },
  {
    "id": "a298aefe",
    "label": "TEFA Participating Schools & Vendors",
    "category": "Education"
  },
  {
    "id": "7f71a117",
    "label": "Living Veterans by State and Age Group (VetPop2023)",
    "category": "Demographics"
  },
  {
    "id": "f9cc7272",
    "label": "ACS Variable Definitions (Dimension Table)",
    "category": "Demographics"
  },
  {
    "id": "421e680f",
    "label": "County-to-County Migration Outflow (IRS SOI)",
    "category": "Demographics"
  },
  {
    "id": "ab2ffcf1",
    "label": "Household Composition by Type (ACS)",
    "category": "Demographics"
  },
  {
    "id": "ad318027",
    "label": "Texas ISD AV by Property Category",
    "category": "Government"
  },
  {
    "id": "b3b47b62",
    "label": "Texas ISD Levy and Collections",
    "category": "Government"
  },
  {
    "id": "b7335fc3",
    "label": "Texas ISD Top Taxpayers",
    "category": "Government"
  },
  {
    "id": "ca2048d1",
    "label": "Quarterly Census of Employment and Wages (QCEW)",
    "category": "Labor"
  },
  {
    "id": "1026b0fb",
    "label": "County Population by Age Group (Census Estimates)",
    "category": "Demographics"
  },
  {
    "id": "1c74633e",
    "label": "Texas ISD Audit Investments",
    "category": "Finance"
  },
  {
    "id": "3569df75",
    "label": "Texas ISD Overlapping Jurisdictions",
    "category": "Education"
  },
  {
    "id": "38c575dc",
    "label": "CRDC - Math & Science Course Enrollment",
    "category": "Education"
  },
  {
    "id": "3c1c826f",
    "label": "Texas ISD Registry",
    "category": "Education"
  },
  {
    "id": "3ef5f003",
    "label": "Adult BMI Distribution by Country",
    "category": "Health"
  },
  {
    "id": "84aa4ab6",
    "label": "CBP Nationwide Drug Seizures",
    "category": "Government"
  },
  {
    "id": "7ee890d7",
    "label": "Business Formation Statistics (Quarterly)",
    "category": "Economics"
  },
  {
    "id": "624fc1c0",
    "label": "Business Formation Statistics (Weekly by State)",
    "category": "Economics"
  },
  {
    "id": "00896e83",
    "label": "SBA State Small Business Statistics",
    "category": "Economics"
  },
  {
    "id": "6ce61009",
    "label": "National School Lunch Program Participation",
    "category": "Education"
  },
  {
    "id": "7e5a3994",
    "label": "School Survey on Crime and Safety (SSOCS)",
    "category": "Education"
  },
  {
    "id": "b6d2192d",
    "label": "Statistics of U.S. Businesses (SUSB)",
    "category": "Labor"
  },
  {
    "id": "6440883c",
    "label": "ERCOT Daily Generation by Fuel Type",
    "category": "Energy"
  },
  {
    "id": "18fc213a",
    "label": "Washington State PDMP Controlled Substance Dispensations",
    "category": "Health"
  },
  {
    "id": "2dfa4958",
    "label": "National Ambulatory Medical Care Survey (NAMCS)",
    "category": "Health"
  },
  {
    "id": "6f174a1f",
    "label": "Texas Hotel Occupancy Tax Revenue",
    "category": "Economics"
  },
  {
    "id": "9eb95500",
    "label": "Texas Mixed Beverage Gross Receipts",
    "category": "Economics"
  },
  {
    "id": "eec4da11",
    "label": "Texas Sales Tax Allocation by City",
    "category": "Economics"
  },
  {
    "id": "bf0c2bd5",
    "label": "CBOE VIX Daily Prices",
    "category": "Finance"
  },
  {
    "id": "d2c2e76c",
    "label": "H.15 Selected Interest Rates",
    "category": "Finance"
  },
  {
    "id": "bd3ae202",
    "label": "SEC Financial Statements - Numeric Data",
    "category": "Finance"
  },
  {
    "id": "3e924212",
    "label": "SEC Financial Statements - Submissions",
    "category": "Finance"
  },
  {
    "id": "a6be27c2",
    "label": "SEC Financial Statements - Tag Definitions",
    "category": "Finance"
  },
  {
    "id": "283ec879",
    "label": "FDIC Summary of Deposits",
    "category": "Finance"
  },
  {
    "id": "02ca73fa",
    "label": "SBA 7(a) Loan Program Data",
    "category": "Economics"
  },
  {
    "id": "1d9a20ed",
    "label": "TEC Lobbyist Gift Expenditures",
    "category": "Government"
  },
  {
    "id": "84cb89ee",
    "label": "TEC Lobbyist Activity Cover Sheets",
    "category": "Government"
  },
  {
    "id": "cd7678ff",
    "label": "TEC Campaign Finance Filer Registry",
    "category": "Government"
  },
  {
    "id": "891d788a",
    "label": "TEC Campaign Finance Contributions",
    "category": "Government"
  },
  {
    "id": "4b721142",
    "label": "DIR Eligible Customers",
    "category": "Government"
  },
  {
    "id": "8cbf6c51",
    "label": "TEC Campaign Finance Expenditures",
    "category": "Government"
  },
  {
    "id": "fdd1ea1a",
    "label": "FEC Candidate-Committee Linkage",
    "category": "Government"
  },
  {
    "id": "ce9f2bd6",
    "label": "FEC Candidate Master File",
    "category": "Government"
  },
  {
    "id": "981e53c8",
    "label": "FEC Committee Master File",
    "category": "Government"
  },
  {
    "id": "052d3ba0",
    "label": "FEC Contributions to Committees",
    "category": "Government"
  },
  {
    "id": "d53ead70",
    "label": "FEC Independent Expenditures",
    "category": "Government"
  },
  {
    "id": "ca43e00f",
    "label": "ADP National Employment Report",
    "category": "Labor"
  },
  {
    "id": "6613f864",
    "label": "Transparency in Coverage - Claims Denials & Appeals",
    "category": "Health"
  },
  {
    "id": "50b3cede",
    "label": "Medicare Part C IRE Reconsideration Appeals",
    "category": "Health"
  },
  {
    "id": "2a449e12",
    "label": "CPI: Tuition, School Fees, and Childcare",
    "category": "Economics"
  },
  {
    "id": "b3200f55",
    "label": "TEC Lobbyist Entertainment Expenditures",
    "category": "Government"
  },
  {
    "id": "dcd6b90e",
    "label": "Indeed Job Postings Index by Metro Area (Canada)",
    "category": "Labor"
  },
  {
    "id": "920a0977",
    "label": "Indeed AI Job Postings Share",
    "category": "Labor"
  },
  {
    "id": "28b03254",
    "label": "Indeed Job Postings Index by Province (Canada)",
    "category": "Labor"
  },
  {
    "id": "6199cbbe",
    "label": "Indeed Job Postings Index by City (UK)",
    "category": "Labor"
  },
  {
    "id": "e460b963",
    "label": "Indeed Job Postings Index by Sector (International)",
    "category": "Labor"
  },
  {
    "id": "77ae4969",
    "label": "Indeed Job Postings Index by Region (UK)",
    "category": "Labor"
  },
  {
    "id": "744bde3a",
    "label": "Indeed Job Postings Index (International)",
    "category": "Labor"
  },
  {
    "id": "1ae74063",
    "label": "Indeed Job Postings Index by Metro Area",
    "category": "Labor"
  },
  {
    "id": "ba2d414b",
    "label": "Indeed Job Postings Index by Sector",
    "category": "Labor"
  },
  {
    "id": "ff479f27",
    "label": "Indeed Job Postings Index by State",
    "category": "Labor"
  },
  {
    "id": "814d915c",
    "label": "Indeed Job Postings Index (National)",
    "category": "Labor"
  },
  {
    "id": "d8717967",
    "label": "Indeed Pay Transparency Share",
    "category": "Labor"
  },
  {
    "id": "3171829f",
    "label": "Indeed Pay Transparency Share by Sector",
    "category": "Labor"
  },
  {
    "id": "5338f26b",
    "label": "Indeed Remote Job Postings Share",
    "category": "Labor"
  },
  {
    "id": "4f9627dc",
    "label": "Indeed Remote Job Searches Share",
    "category": "Labor"
  },
  {
    "id": "1a733ec3",
    "label": "Indeed Remote Job Postings Share by Sector",
    "category": "Labor"
  },
  {
    "id": "904a75d9",
    "label": "Indeed Posted Wage Tracker",
    "category": "Labor"
  },
  {
    "id": "b3976b4b",
    "label": "Indeed Posted Wage Tracker (International)",
    "category": "Labor"
  },
  {
    "id": "acdb356e",
    "label": "Austin Population by Council District",
    "category": "Demographics"
  },
  {
    "id": "a772b977",
    "label": "Texas TAPR Campus CCMR Rates",
    "category": "Other"
  },
  {
    "id": "184e688f",
    "label": "California Homelessness by Age Group (HDIS)",
    "category": "Housing"
  },
  {
    "id": "bcd2bf34",
    "label": "Texas SAT/ACT Campus Performance",
    "category": "Education"
  },
  {
    "id": "0a830e20",
    "label": "Austin ISD School Attendance Zones",
    "category": "Education"
  },
  {
    "id": "f3c0378f",
    "label": "EIA Drilling Productivity Report",
    "category": "Energy"
  },
  {
    "id": "c25dd86c",
    "label": "Texas Year-to-Year Student Reporting (Graduation/Dropout)",
    "category": "Education"
  },
  {
    "id": "d8c60f80",
    "label": "NCES CCD Public School Characteristics",
    "category": "Education"
  },
  {
    "id": "d9c97e1f",
    "label": "IPEDS Tuition and Fees",
    "category": "Education"
  },
  {
    "id": "60159ada",
    "label": "Austin ISD Campus Capacity & Utilization",
    "category": "Education"
  },
  {
    "id": "f660097c",
    "label": "Texas Discipline Data (State Summary)",
    "category": "Education"
  },
  {
    "id": "f785a439",
    "label": "NHES Early Childhood Program Participation (2019)",
    "category": "Education"
  },
  {
    "id": "2d473467",
    "label": "Texas Sources of State Revenue by Tax Type, 1972-2024",
    "category": "Government"
  },
  {
    "id": "462d2756",
    "label": "Texas TAPR Campus Attendance, Chronic Absenteeism, and Dropout",
    "category": "Education"
  },
  {
    "id": "6915cd56",
    "label": "Kindergarten Vaccination Coverage & Exemptions",
    "category": "Health"
  },
  {
    "id": "449ea271",
    "label": "College Graduate Labor Market Outcomes by Major",
    "category": "Labor"
  },
  {
    "id": "f35badb9",
    "label": "arXiv Monthly Submissions",
    "category": "Education"
  },
  {
    "id": "dde2d07a",
    "label": "Texas TAPR Campus STAAR Performance",
    "category": "Education"
  },
  {
    "id": "85351a6c",
    "label": "FIO Homeowners Insurance Market Data (2018-2022)",
    "category": "Finance"
  },
  {
    "id": "8e1de309",
    "label": "Provisional Drug Overdose Deaths by Drug Class",
    "category": "Health"
  },
  {
    "id": "1c890135",
    "label": "County Homeowners Insurance Non-Renewals (2018-2023)",
    "category": "Finance"
  },
  {
    "id": "33efa396",
    "label": "AI Occupational Exposure (AIOE) Scores",
    "category": "Labor"
  },
  {
    "id": "c7f38bf4",
    "label": "Anthropic Economic Index",
    "category": "Technology"
  },
  {
    "id": "cbc05683",
    "label": "Housing Age as a Lead-Paint Risk Proxy by State (ACS 1-Year, 2015-2024)",
    "category": "Housing"
  },
  {
    "id": "1b873f7e",
    "label": "English Wikipedia Monthly Unique Devices",
    "category": "Technology"
  },
  {
    "id": "c75728e1",
    "label": "English Wikipedia Monthly Pageviews by Agent Type",
    "category": "Education"
  },
  {
    "id": "32968e66",
    "label": "Zillow Observed Rent Index (ZORI)",
    "category": "Housing"
  },
  {
    "id": "13eaae62",
    "label": "Eviction Lab Historical County Eviction Filings (2000-2018)",
    "category": "Housing"
  },
  {
    "id": "768f28d0",
    "label": "IRS SOI Individual Income Tax Returns by ZIP Code",
    "category": "Economics"
  },
  {
    "id": "89038ccd",
    "label": "NHTSA Automated Driving System Incident Reports",
    "category": "Transportation"
  },
  {
    "id": "184ddecc",
    "label": "Census County Population Estimates (1900-2025)",
    "category": "Demographics"
  },
  {
    "id": "bcb2d2ed",
    "label": "NHTSA FARS Fatal Crash Records (2018-2024)",
    "category": "Transportation"
  },
  {
    "id": "de024239",
    "label": "California Residential Insurance New/Renew/Non-Renew by ZIP (2015-2023)",
    "category": "Finance"
  },
  {
    "id": "a2a526fb",
    "label": "EIA Retail Electricity Prices by State and Sector",
    "category": "Energy"
  },
  {
    "id": "8072c9ca",
    "label": "FERC Form 1 Plant in Service (PUDL)",
    "category": "Energy"
  },
  {
    "id": "6738ecf9",
    "label": "NCES Private School Universe Survey (PSS)",
    "category": "Education"
  },
  {
    "id": "c5a6fd02",
    "label": "Waymo Autonomous Vehicle Monthly Operations (CPUC)",
    "category": "Transportation"
  },
  {
    "id": "6f5f3d7a",
    "label": "NFIP Flood Insurance Policies (Redacted)",
    "category": "Finance"
  },
  {
    "id": "6335c531",
    "label": "ZIP Code to County Crosswalk (2020)",
    "category": "Geography"
  },
  {
    "id": "fcb300c2",
    "label": "US Measles Cases and Deaths",
    "category": "Health"
  },
  {
    "id": "f2659aaa",
    "label": "WHO Measles Elimination Status by Country",
    "category": "Health"
  },
  {
    "id": "8452733e",
    "label": "US Measles Surveillance (1888-2002)",
    "category": "Health"
  },
  {
    "id": "9c838abb",
    "label": "School-Level Kindergarten Vaccination Rates",
    "category": "Health"
  },
  {
    "id": "ec1a7e77",
    "label": "State Vaccine Exemption Laws (School Immunization Requirements)",
    "category": "Health"
  },
  {
    "id": "8a69f457",
    "label": "Texas Student Programs & Special Populations (District)",
    "category": "Education"
  },
  {
    "id": "034ebb60",
    "label": "Texas Emergent Bilingual Students by Category and Grade",
    "category": "Education"
  },
  {
    "id": "6bbfb9e9",
    "label": "Texas Student Programs & Special Populations (Campus)",
    "category": "Education"
  },
  {
    "id": "654cba2e",
    "label": "Texas EB Students by Category and Grade (2019+)",
    "category": "Education"
  },
  {
    "id": "79fdf425",
    "label": "High School Graduates Enrolled in Higher Education by District",
    "category": "Education"
  },
  {
    "id": "19be21ea",
    "label": "TSIA Summary Score Report by District",
    "category": "Education"
  },
  {
    "id": "d85b4cb1",
    "label": "TSI Report of Student Performance by District",
    "category": "Education"
  },
  {
    "id": "95c55296",
    "label": "Census State Population Estimates (2020-2024)",
    "category": "Demographics"
  },
  {
    "id": "11d26b1b",
    "label": "Provisional Drug Overdose Deaths by Urban-Rural Classification",
    "category": "Health"
  },
  {
    "id": "40506927",
    "label": "NFIP Residential Penetration Rates",
    "category": "Environment"
  },
  {
    "id": "436bfcd3",
    "label": "NFIP Multiple Loss Properties (Redacted)",
    "category": "Environment"
  },
  {
    "id": "17930d92",
    "label": "Unemployment Rate for Recent College Graduates vs All Workers",
    "category": "Labor"
  },
  {
    "id": "3f1ef044",
    "label": "Underemployment Rate for Recent College Graduates",
    "category": "Labor"
  },
  {
    "id": "e2c04cb1",
    "label": "Median Wage Percentiles for Recent College Graduates",
    "category": "Labor"
  },
  {
    "id": "259bea0c",
    "label": "State-to-State Migration Inflow/Outflow (IRS SOI)",
    "category": "Demographics"
  },
  {
    "id": "70d42f14",
    "label": "Census Household Pulse Survey (HPS)",
    "category": "Economics"
  },
  {
    "id": "e0706c1f",
    "label": "EIA State Electricity Generation Mix by Fuel",
    "category": "Energy"
  },
  {
    "id": "065336c9",
    "label": "Final Drug Overdose Deaths by State (NCHS)",
    "category": "Health"
  },
  {
    "id": "a0f66f7c",
    "label": "English Wikipedia Per-Article Monthly Pageviews (Basket Divergence)",
    "category": "Technology"
  },
  {
    "id": "97d66247",
    "label": "Waymo Safety Impact Data (Crashes + Rider-Only Miles)",
    "category": "Transportation"
  },
  {
    "id": "396bacc6",
    "label": "Eviction Tracking - Austin",
    "category": "Housing"
  },
  {
    "id": "8b5f33bc",
    "label": "Plan Review Cases",
    "category": "Housing"
  },
  {
    "id": "93e9f8f9",
    "label": "Eviction Tracking - All Sites (National)",
    "category": "Housing"
  },
  {
    "id": "c0c1ee16",
    "label": "State Migration by AGI and Age Cohort (IRS SOI Gross Migration File)",
    "category": "Demographics"
  },
  {
    "id": "992d2f01",
    "label": "ACS Renter-Occupied Households (Tract + ZCTA)",
    "category": "Housing"
  },
  {
    "id": "68b1f8c2",
    "label": "California FAIR Plan Policies in Force by ZIP Code",
    "category": "Finance"
  },
  {
    "id": "46341b52",
    "label": "CRDC - School Characteristics",
    "category": "Education"
  },
  {
    "id": "e2b1f5c1",
    "label": "California FAIR Plan Policies in Force by County",
    "category": "Finance"
  },
  {
    "id": "6b737d82",
    "label": "CRDC - School Enrollment",
    "category": "Education"
  },
  {
    "id": "60bf1355",
    "label": "California FAIR Plan Dwelling Policies by Wildfire Risk Category",
    "category": "Finance"
  },
  {
    "id": "8bd9418d",
    "label": "CRDC - Gifted & Talented Enrollment",
    "category": "Education"
  },
  {
    "id": "35235662",
    "label": "CRDC - Suspensions & Expulsions",
    "category": "Education"
  },
  {
    "id": "5f8a8dbb",
    "label": "California FAIR Plan Residential Exposure by Wildfire Risk Category",
    "category": "Finance"
  },
  {
    "id": "defec7e8",
    "label": "English Wikipedia Monthly Active Editors by Activity Level",
    "category": "Education"
  },
  {
    "id": "fdbed79e",
    "label": "TEC Campaign Finance Loans",
    "category": "Government"
  },
  {
    "id": "09b2e1e5",
    "label": "Texas State Employee Salaries",
    "category": "Government"
  },
  {
    "id": "1b9d7b0f",
    "label": "WHO Infant Mortality Rate",
    "category": "Health"
  },
  {
    "id": "6e42c956",
    "label": "Trust in the CDC by Political Party (KFF Tracking Polls)",
    "category": "Health"
  },
  {
    "id": "d707092c",
    "label": "WHO Hospital Beds",
    "category": "Health"
  },
  {
    "id": "e868a706",
    "label": "TEC Direct Campaign Expenditure Candidates",
    "category": "Government"
  },
  {
    "id": "d395c926",
    "label": "WHO Health Workforce Density",
    "category": "Health"
  },
  {
    "id": "652b35e9",
    "label": "OECD Avoidable Mortality",
    "category": "Health"
  },
  {
    "id": "bb2895ae",
    "label": "OECD Perceived Health Status",
    "category": "Health"
  },
  {
    "id": "032d5a45",
    "label": "Interest Expense on the Public Debt",
    "category": "Finance"
  },
  {
    "id": "c340b1b1",
    "label": "TEFA Applicant Demographics",
    "category": "Education"
  },
  {
    "id": "4eb12843",
    "label": "TEFA Application Status",
    "category": "Education"
  },
  {
    "id": "bde505d7",
    "label": "TEFA Applications Submitted by Day",
    "category": "Education"
  },
  {
    "id": "1395e24f",
    "label": "TEFA Applications by School District",
    "category": "Education"
  },
  {
    "id": "c27c48eb",
    "label": "TEFA Applications by Education Service Region",
    "category": "Education"
  },
  {
    "id": "d6f1ac13",
    "label": "TEFA Applications by Grade Level",
    "category": "Education"
  },
  {
    "id": "31c706f6",
    "label": "TEFA Applications by Priority Tier",
    "category": "Education"
  },
  {
    "id": "412c4095",
    "label": "Texas Newly Certified Educators by Role",
    "category": "Education"
  },
  {
    "id": "bd329ca9",
    "label": "TEFA Applications by Prior Enrollment",
    "category": "Education"
  },
  {
    "id": "c79c24fb",
    "label": "TEFA Applications by Race/Ethnicity",
    "category": "Education"
  },
  {
    "id": "f367ee22",
    "label": "TEFA Special Education IEP Instructional Codes",
    "category": "Education"
  },
  {
    "id": "8cafce0c",
    "label": "Texas TIA Allotment by District",
    "category": "Education"
  },
  {
    "id": "88bfcef6",
    "label": "TEFA Special Education IEP Indication & Documentation",
    "category": "Education"
  },
  {
    "id": "c24618b6",
    "label": "Monthly Statement of the Public Debt by Security Type",
    "category": "Economics"
  },
  {
    "id": "031a83c0",
    "label": "U.S. Treasury Securities Auctions",
    "category": "Finance"
  },
  {
    "id": "f596130d",
    "label": "CPI: Education and Communication",
    "category": "Economics"
  },
  {
    "id": "1f58a25a",
    "label": "FIPS County Codes (2020)",
    "category": "Geography"
  },
  {
    "id": "1566632d",
    "label": "Texas Employed & Certified Teachers by Preparation Route",
    "category": "Education"
  },
  {
    "id": "96b300ee",
    "label": "FIPS State Codes",
    "category": "Geography"
  },
  {
    "id": "71327717",
    "label": "Census Gazetteer - Counties (2025)",
    "category": "Geography"
  },
  {
    "id": "9b4b83a7",
    "label": "NAICS 2022 Industry Codes",
    "category": "Economics"
  },
  {
    "id": "eee56dce",
    "label": "LISEP True Rate of Unemployment",
    "category": "Labor"
  },
  {
    "id": "58404a8f",
    "label": "Census Gazetteer - Places (2025)",
    "category": "Geography"
  },
  {
    "id": "fab8fae9",
    "label": "Texas TIA Allotment by Campus",
    "category": "Education"
  },
  {
    "id": "088fbd95",
    "label": "FAERS: GLP-1 Adverse Event Signals",
    "category": "Health"
  },
  {
    "id": "7166c42e",
    "label": "NHANES: Prescription Medication Use",
    "category": "Health"
  },
  {
    "id": "58917d63",
    "label": "FARA Foreign Principals",
    "category": "Government"
  },
  {
    "id": "cc2c0152",
    "label": "FARA Registrants",
    "category": "Government"
  },
  {
    "id": "384333a0",
    "label": "ACS Congressional District Demographics",
    "category": "Demographics"
  },
  {
    "id": "e7359e73",
    "label": "Title II Teacher Preparation Program Report Card (Texas)",
    "category": "Education"
  },
  {
    "id": "a28a1d96",
    "label": "Pennsylvania Precinct Election Results",
    "category": "Government"
  },
  {
    "id": "fe361e00",
    "label": "Texas Precinct Election Results",
    "category": "Government"
  },
  {
    "id": "6f7991c3",
    "label": "MEDSL State Precinct-Level Election Returns",
    "category": "Government"
  },
  {
    "id": "0c874231",
    "label": "California Campaign Finance Expenditures (Cal-Access)",
    "category": "Government"
  },
  {
    "id": "0f39d1d0",
    "label": "Texas Instructional Materials Entitlements",
    "category": "Education"
  },
  {
    "id": "779a54d1",
    "label": "Texas Instructional Materials and Technology Allotment (IMTA)",
    "category": "Education"
  },
  {
    "id": "73a7b195",
    "label": "Congress Bills (118th Congress)",
    "category": "Government"
  },
  {
    "id": "ff61ad30",
    "label": "Texas TAPR Campus AP/IB Performance",
    "category": "Education"
  },
  {
    "id": "5554b93a",
    "label": "Mean Blood Pressure by Country",
    "category": "Health"
  },
  {
    "id": "f407754c",
    "label": "Mean Cholesterol by Country",
    "category": "Health"
  },
  {
    "id": "67852f37",
    "label": "UNICEF/WHO Immunisation Coverage by Antigen",
    "category": "Health"
  },
  {
    "id": "8510510c",
    "label": "Texas IMRA SBOE-Approved Instructional Materials",
    "category": "Education"
  },
  {
    "id": "165a9245",
    "label": "UNICEF Child Nutrition (Stunting, Wasting, Overweight)",
    "category": "Health"
  },
  {
    "id": "65b452ff",
    "label": "UNICEF/WHO Water, Sanitation & Hygiene (WASH)",
    "category": "Health"
  },
  {
    "id": "944d72a4",
    "label": "Eurostat BMI Distribution (European Health Interview Survey)",
    "category": "Health"
  },
  {
    "id": "acbc47ee",
    "label": "Eurostat Chronic Disease Prevalence (EHIS)",
    "category": "Health"
  },
  {
    "id": "dcd74763",
    "label": "IM3 Open Source Data Center Atlas",
    "category": "Geography"
  },
  {
    "id": "7f54d9f5",
    "label": "Eurostat Health Expenditure by Financing Scheme",
    "category": "Health"
  },
  {
    "id": "52b2940f",
    "label": "Eurostat Age-Standardized Death Rates by Cause",
    "category": "Health"
  },
  {
    "id": "baa3420b",
    "label": "FEC Operating Expenditures",
    "category": "Government"
  },
  {
    "id": "049d3e16",
    "label": "FEC Enforcement - Matters Under Review (MURs)",
    "category": "Government"
  },
  {
    "id": "26dcecc3",
    "label": "IM3 Projected US Data Center Locations",
    "category": "Energy"
  },
  {
    "id": "85877c54",
    "label": "Texas Teacher Retention Rates",
    "category": "Education"
  },
  {
    "id": "7abd1f95",
    "label": "Texas Teacher Attrition Rates",
    "category": "Education"
  },
  {
    "id": "dd9e5eee",
    "label": "Texas Uncertified Teachers",
    "category": "Education"
  },
  {
    "id": "9713a513",
    "label": "Texas TAPR Data Dictionary",
    "category": "Education"
  },
  {
    "id": "86bebae9",
    "label": "Texas Student Enrollment by Ethnicity",
    "category": "Education"
  },
  {
    "id": "44b98e29",
    "label": "Texas Staff FTE and Salary Counts",
    "category": "Education"
  },
  {
    "id": "ae4a3d83",
    "label": "Texas ISD Property Value by State Category (2003)",
    "category": "Government"
  },
  {
    "id": "c0675d4c",
    "label": "Texas TAPR Staff and Student Profile",
    "category": "Education"
  },
  {
    "id": "8fe33575",
    "label": "Houston ISD Takeover: By the Numbers",
    "category": "Education"
  },
  {
    "id": "4b2a6104",
    "label": "Texas SB 1882 District-Charter Partnerships",
    "category": "Education"
  },
  {
    "id": "06b41849",
    "label": "Texas ESSER Allocations by District",
    "category": "Education"
  },
  {
    "id": "f62101da",
    "label": "Texas School District Taxable Property Values (CPTD)",
    "category": "Education"
  },
  {
    "id": "ea8a0669",
    "label": "Texas Property Value Study (ISD Summary)",
    "category": "Education"
  },
  {
    "id": "bff8bcfb",
    "label": "Economic Complexity by Country and Year",
    "category": "Economics"
  },
  {
    "id": "e14aaa8f",
    "label": "BACI Country Codes (CEPII)",
    "category": "Economics"
  },
  {
    "id": "7d3ae136",
    "label": "HS92 Product Code Lookup (BACI)",
    "category": "Economics"
  },
  {
    "id": "303706d1",
    "label": "Tariff Rates by Country",
    "category": "Economics"
  },
  {
    "id": "ac5bc0e0",
    "label": "California City Financial Transactions, Per Capita (SCO)",
    "category": "Government"
  },
  {
    "id": "3b4f7e97",
    "label": "Texas A-F Accountability Summary",
    "category": "Education"
  },
  {
    "id": "23261095",
    "label": "State & Local Government Finances by State",
    "category": "Government"
  },
  {
    "id": "340f748f",
    "label": "State & Local Public Pension Systems by State (Census ASPP)",
    "category": "Economics"
  },
  {
    "id": "65bf4cb7",
    "label": "California City Government Compensation (Government Compensation in California)",
    "category": "Labor"
  },
  {
    "id": "12a82302",
    "label": "California City Expenditures, Line-Item Detail (SCO)",
    "category": "Government"
  },
  {
    "id": "844ed030",
    "label": "California City Revenues, Line-Item Detail (SCO)",
    "category": "Government"
  },
  {
    "id": "b46c4f5d",
    "label": "Texas School Immunization Conscientious Exemptions by County",
    "category": "Health"
  },
  {
    "id": "533a197a",
    "label": "Regional Price Parities (Metro Area)",
    "category": "Economics"
  },
  {
    "id": "edf67988",
    "label": "Regional Price Parities (State)",
    "category": "Economics"
  },
  {
    "id": "324e26ff",
    "label": "Average Interest Rates on U.S. Treasury Securities",
    "category": "Finance"
  },
  {
    "id": "9aca9e2c",
    "label": "California Homeless Veterans by Continuum of Care (HDIS)",
    "category": "Housing"
  },
  {
    "id": "14249bdc",
    "label": "California Homeless Persons with a Disability by Continuum of Care (HDIS)",
    "category": "Housing"
  },
  {
    "id": "cb8a26f7",
    "label": "California Housing Element Annual Progress Report (Table A2)",
    "category": "Housing"
  },
  {
    "id": "cbd55411",
    "label": "Travis County Voter Precincts",
    "category": "Government"
  },
  {
    "id": "80d17c7b",
    "label": "Travis County Precinct Election Results",
    "category": "Government"
  },
  {
    "id": "4884c5c6",
    "label": "Land Use Inventory",
    "category": "Housing"
  },
  {
    "id": "89e7af05",
    "label": "Texas TAPR Campus Staff and Student Profile",
    "category": "Education"
  },
  {
    "id": "4e42c198",
    "label": "TEC Lobbyist Food & Beverage Expenditures",
    "category": "Government"
  },
  {
    "id": "21e43253",
    "label": "Texas STAAR Accountability Performance",
    "category": "Education"
  },
  {
    "id": "7a06e089",
    "label": "Texas STAAR 3-8 Campus Performance (Cambium)",
    "category": "Education"
  },
  {
    "id": "033b7f08",
    "label": "CFPB Consumer Complaint Database",
    "category": "Finance"
  },
  {
    "id": "42baabe8",
    "label": "Texas Teacher New Hires by Pathway",
    "category": "Education"
  },
  {
    "id": "4e7b4100",
    "label": "Diabetes Prevalence by Country",
    "category": "Health"
  },
  {
    "id": "0982a977",
    "label": "California Registered Vehicles by ZIP Code, Fuel Type, Make, Duty and Model Year (2019-2026)",
    "category": "Transportation"
  },
  {
    "id": "5c657965",
    "label": "Texas Biennial Property Tax Report (CAD Summary)",
    "category": "Economics"
  },
  {
    "id": "7473081c",
    "label": "Texas ISD Certified Values",
    "category": "Education"
  },
  {
    "id": "76eedcca",
    "label": "Texas ISD Population (Census ACS)",
    "category": "Demographics"
  },
  {
    "id": "7f503589",
    "label": "FEC Individual Contributions",
    "category": "Government"
  },
  {
    "id": "87cb1256",
    "label": "UNICEF/UN IGME Child Mortality Estimates",
    "category": "Health"
  },
  {
    "id": "998a86c4",
    "label": "Zoning Districts",
    "category": "Housing"
  },
  {
    "id": "a794ada0",
    "label": "Texas ISD Audit Fund Financials",
    "category": "Government"
  },
  {
    "id": "abaccdbf",
    "label": "Users",
    "category": "Other"
  },
  {
    "id": "ba56b992",
    "label": "ClinicalTrials.gov: GLP-1 Receptor Agonist Trials",
    "category": "Health"
  },
  {
    "id": "c394909f",
    "label": "Texas ISD Tax Rates",
    "category": "Government"
  },
  {
    "id": "d3275657",
    "label": "Texas ISD Debt Service Schedules (BRB)",
    "category": "Government"
  },
  {
    "id": "df6e49d5",
    "label": "Texas ISD Debt Outstanding (BRB)",
    "category": "Finance"
  },
  {
    "id": "9a4d7488",
    "label": "California Homelessness by Gender (HDIS)",
    "category": "Housing"
  },
  {
    "id": "f5523e83",
    "label": "City Council Districts",
    "category": "Geography"
  },
  {
    "id": "f59ea0d5",
    "label": "Child & Adolescent BMI Distribution by Country",
    "category": "Health"
  },
  {
    "id": "fe81fa43",
    "label": "Hypertension Prevalence & Treatment by Country",
    "category": "Health"
  },
  {
    "id": "ff81c4c2",
    "label": "FEC Committee-to-Committee Transfers",
    "category": "Government"
  },
  {
    "id": "e4d9c920",
    "label": "California Homelessness by Race and Ethnicity (HDIS)",
    "category": "Housing"
  },
  {
    "id": "c59cc2d6",
    "label": "California Components of Population Change by County",
    "category": "Demographics"
  },
  {
    "id": "e86b25f7",
    "label": "California County Population Projections (P-3, 2020-2070)",
    "category": "Demographics"
  },
  {
    "id": "b7a6866e",
    "label": "California Personal Income Tax Statistics by ZIP Code (1992-2023)",
    "category": "Economics"
  },
  {
    "id": "df6905c9",
    "label": "California County Financial Transactions, Per Capita (SCO)",
    "category": "Government"
  },
  {
    "id": "7071fc23",
    "label": "QCEW Data Center Employment and Wages (NAICS 518210)",
    "category": "Labor"
  },
  {
    "id": "812ec23e",
    "label": "Census County Building Permits (1990-2025)",
    "category": "Housing"
  },
  {
    "id": "e5cffcbd",
    "label": "Texas ISD Property Value by State Category",
    "category": "Finance"
  },
  {
    "id": "08580816",
    "label": "Texas Gross Value of Oil & Gas Production (Monthly)",
    "category": "Energy"
  },
  {
    "id": "58196f0e",
    "label": "Bilateral Trade Flows by Product (BACI, HS92)",
    "category": "Economics"
  },
  {
    "id": "3c8361d1",
    "label": "California Voter Registration by Precinct (Statement of Registration, 2016-2024)",
    "category": "Government"
  },
  {
    "id": "b0b78f22",
    "label": "California Local Government Net OPEB Asset/Liability (SCO)",
    "category": "Government"
  },
  {
    "id": "d879b838",
    "label": "California Local Government Net Pension Asset/Liability (SCO)",
    "category": "Government"
  },
  {
    "id": "d7de203f",
    "label": "California Historic Fire Perimeters (1878-2025)",
    "category": "Environment"
  },
  {
    "id": "53e0a25c",
    "label": "California Greenhouse Gas Emission Inventory by Sector (2000-2023)",
    "category": "Environment"
  },
  {
    "id": "08623e39",
    "label": "California Groundwater Monitoring Station Registry",
    "category": "Environment"
  },
  {
    "id": "1c83f120",
    "label": "California GeoTracker Regulated Sites",
    "category": "Environment"
  },
  {
    "id": "65164a95",
    "label": "Veteran Poverty and Disability by State (ACS 1-Year, 2008-2024)",
    "category": "Demographics"
  },
  {
    "id": "198f9476",
    "label": "Dedicated Veteran Beds by Continuum of Care (HIC, 2017-2025)",
    "category": "Housing"
  },
  {
    "id": "e581ba91",
    "label": "Homeless Veterans by State, Race, and Ethnicity (PIT, 2015-2025)",
    "category": "Housing"
  },
  {
    "id": "5fa0aec1",
    "label": "Homeless Veterans by Continuum of Care (PIT, 2011-2025)",
    "category": "Housing"
  },
  {
    "id": "ca1f30eb",
    "label": "California Voter Registration by 2020 Census Block (G22, G24)",
    "category": "Government"
  },
  {
    "id": "a6c0d091",
    "label": "Veteran Housing Cost Burden (ACS PUMS 2023 5-Year)",
    "category": "Housing"
  },
  {
    "id": "f27822a4",
    "label": "California Hospital Annual Financial Data (2012-2024)",
    "category": "Health"
  },
  {
    "id": "40e39568",
    "label": "California State Vendor Payment Transactions (FI$Cal)",
    "category": "Government"
  },
  {
    "id": "700bb926",
    "label": "California Special District Revenues, Line-Item Detail (SCO)",
    "category": "Government"
  },
  {
    "id": "5a816525",
    "label": "California Special District Expenditures, Line-Item Detail (SCO)",
    "category": "Government"
  },
  {
    "id": "41633d1c",
    "label": "California County Revenues, Line-Item Detail (SCO)",
    "category": "Government"
  },
  {
    "id": "a1237503",
    "label": "California County Expenditures, Line-Item Detail (SCO)",
    "category": "Government"
  },
  {
    "id": "8933fac9",
    "label": "CalPERS Contracting Agency Funding Position (FY2002-03 to 2023-24)",
    "category": "Finance"
  },
  {
    "id": "47e15cd1",
    "label": "California Groundwater Level Measurements (1888-present)",
    "category": "Environment"
  },
  {
    "id": "d9809648",
    "label": "California County Births, Deaths, and Migration, 1999-2025",
    "category": "Demographics"
  },
  {
    "id": "5dbe1c48",
    "label": "FARA Registrant Filing Index",
    "category": "Government"
  },
  {
    "id": "5a3552bf",
    "label": "IRS Section 527 Political Organization Registrations (Form 8871)",
    "category": "Government"
  },
  {
    "id": "803c94ed",
    "label": "IRS Section 527 Political Organization Contributions & Expenditures (Form 8872)",
    "category": "Government"
  },
  {
    "id": "b2779dbe",
    "label": "Federal Audit Clearinghouse Single Audits",
    "category": "Government"
  },
  {
    "id": "a3cc3511",
    "label": "FAC Audit Findings",
    "category": "Government"
  },
  {
    "id": "40921b5f",
    "label": "FAC Federal Awards & Expenditures",
    "category": "Government"
  },
  {
    "id": "5a2c697e",
    "label": "IRS Form 990 Schedule C Political Campaign Activity",
    "category": "Government"
  },
  {
    "id": "7e96aae4",
    "label": "Texas Criminal Court Caseload",
    "category": "Crime"
  },
  {
    "id": "440bb080",
    "label": "New York Index Crimes by County and Agency",
    "category": "Crime"
  },
  {
    "id": "8399e64b",
    "label": "National Income and Product Accounts (NIPA)",
    "category": "Economics"
  },
  {
    "id": "37ce4f23",
    "label": "Personal Consumption Expenditures (PCE)",
    "category": "Economics"
  },
  {
    "id": "4c610dd6",
    "label": "Saving & Investment Accounts",
    "category": "Economics"
  },
  {
    "id": "254a1e6e",
    "label": "State Personal Income",
    "category": "Economics"
  },
  {
    "id": "c84393fe",
    "label": "GDP by State",
    "category": "Economics"
  },
  {
    "id": "05319853",
    "label": "Input-Output Accounts",
    "category": "Economics"
  },
  {
    "id": "f997db4d",
    "label": "International Transactions (Balance of Payments)",
    "category": "Economics"
  },
  {
    "id": "7f339c79",
    "label": "Fixed Assets Accounts",
    "category": "Economics"
  },
  {
    "id": "7b95bcc2",
    "label": "Multinational Enterprises & Direct Investment",
    "category": "Economics"
  },
  {
    "id": "370388bf",
    "label": "Revolving Consumer Credit Outstanding",
    "category": "Finance"
  },
  {
    "id": "93ef12e7",
    "label": "Total Consumer Credit Outstanding",
    "category": "Economics"
  },
  {
    "id": "2858d765",
    "label": "Consumer Credit - Non-Revolving",
    "category": "Finance"
  },
  {
    "id": "fc86c518",
    "label": "Household Debt Balance and Composition",
    "category": "Economics"
  },
  {
    "id": "3bd4e161",
    "label": "CFPB Making Ends Meet Survey (Sample 6)",
    "category": "Finance"
  },
  {
    "id": "3204b29d",
    "label": "Childhood Blood Lead Surveillance (State Data, 1997-2022)",
    "category": "Health"
  },
  {
    "id": "ebabfc01",
    "label": "FBI UCR Estimated Crimes, National and State (1979-Present)",
    "category": "Crime"
  },
  {
    "id": "982fa9b2",
    "label": "US Lead Consumption in Gasoline Antiknock Additives, 1941-1986",
    "category": "Environment"
  },
  {
    "id": "e59590b5",
    "label": "Federal Outlays by Budget Function",
    "category": "Government"
  },
  {
    "id": "b8707264",
    "label": "Social Security & Medicare Trust Fund Operations",
    "category": "Government"
  },
  {
    "id": "004d40f3",
    "label": "CBO Budget and Economic Outlook",
    "category": "Government"
  },
  {
    "id": "b1daacfb",
    "label": "Federal Spending by Budget Function",
    "category": "Government"
  },
  {
    "id": "f0188a1f",
    "label": "National Health Expenditure by Payer",
    "category": "Health"
  },
  {
    "id": "1b1e47f1",
    "label": "FARA Short-Form Registrants",
    "category": "Government"
  },
  {
    "id": "9262ea46",
    "label": "10-Year Treasury Minus 3-Month Treasury Spread",
    "category": "Finance"
  },
  {
    "id": "a30ed378",
    "label": "Sahm Rule Recession Indicator",
    "category": "Economics"
  },
  {
    "id": "0098b464",
    "label": "10-Year Treasury Minus 2-Year Treasury Spread",
    "category": "Finance"
  },
  {
    "id": "df56723b",
    "label": "Chicago Fed National Activity Index",
    "category": "Economics"
  },
  {
    "id": "dd81fabe",
    "label": "Private Residential Construction Spending",
    "category": "Economics"
  },
  {
    "id": "a234f622",
    "label": "ICE BofA US High Yield Option-Adjusted Spread",
    "category": "Finance"
  },
  {
    "id": "7ab18aee",
    "label": "Real Personal Consumption Expenditures - Durable Goods",
    "category": "Economics"
  },
  {
    "id": "27c9af8d",
    "label": "Heavy Truck Retail Sales",
    "category": "Economics"
  },
  {
    "id": "a3c1b744",
    "label": "PPI: Corrugated Box Manufacturing",
    "category": "Economics"
  },
  {
    "id": "ae065b9b",
    "label": "Temporary Help Services Employment",
    "category": "Labor"
  },
  {
    "id": "9bcf064c",
    "label": "Retail Sales: Men's Clothing Stores",
    "category": "Economics"
  },
  {
    "id": "38555413",
    "label": "PPI: Cosmetics and Toilet Preparations",
    "category": "Economics"
  },
  {
    "id": "a65fea51",
    "label": "Rail Freight Carload Traffic",
    "category": "Economics"
  },
  {
    "id": "e33eda5e",
    "label": "WARN Act Mass Layoff Notices (All States)",
    "category": "Labor"
  },
  {
    "id": "620db8d8",
    "label": "Illinois Directory of Education Entities",
    "category": "Education"
  },
  {
    "id": "08a5b88e",
    "label": "Illinois Evidence-Based Funding",
    "category": "Education"
  },
  {
    "id": "2b4d6af0",
    "label": "Illinois Educator Salary and Benefits",
    "category": "Education"
  },
  {
    "id": "2c176ead",
    "label": "Illinois Fall Enrollment",
    "category": "Education"
  },
  {
    "id": "f4294a8c",
    "label": "Illinois Postsecondary Enrollment and Completions by Program",
    "category": "Education"
  },
  {
    "id": "712d82de",
    "label": "Illinois Postsecondary Completions by Institution and Program",
    "category": "Education"
  },
  {
    "id": "4a620a8c",
    "label": "Illinois Colleges and Universities Directory",
    "category": "Education"
  },
  {
    "id": "d8fe293c",
    "label": "Illinois Postsecondary Enrollment and Completions by Institution",
    "category": "Education"
  },
  {
    "id": "23ead4b8",
    "label": "Massachusetts Student Enrollment by District and School",
    "category": "Education"
  },
  {
    "id": "318d2a99",
    "label": "Massachusetts Student Attendance and Chronic Absenteeism",
    "category": "Education"
  },
  {
    "id": "712493f3",
    "label": "Massachusetts High School Graduation Rates",
    "category": "Education"
  },
  {
    "id": "801fb65f",
    "label": "Massachusetts School and District Accountability Classifications",
    "category": "Education"
  },
  {
    "id": "11f331fd",
    "label": "California Public School and District Directory",
    "category": "Education"
  },
  {
    "id": "134bce1a",
    "label": "California Census Day Student Enrollment",
    "category": "Education"
  },
  {
    "id": "98547843",
    "label": "New York School District Fiscal Masterfile",
    "category": "Education"
  },
  {
    "id": "ba8f2fd6",
    "label": "California Chronic Absenteeism",
    "category": "Education"
  },
  {
    "id": "605020d4",
    "label": "California School Expulsions",
    "category": "Education"
  },
  {
    "id": "cccbd49a",
    "label": "California Four-Year Adjusted Cohort Graduation and Dropout Outcomes",
    "category": "Education"
  },
  {
    "id": "43f0dc09",
    "label": "California Free and Reduced Price Meal (FRPM) Eligibility",
    "category": "Education"
  },
  {
    "id": "58a5260f",
    "label": "California SARC District Salary Schedules and Expenditure Benchmarks",
    "category": "Education"
  },
  {
    "id": "014f54bd",
    "label": "California School Dashboard Accountability Indicators",
    "category": "Education"
  },
  {
    "id": "1699005f",
    "label": "California School District Finance (LCFF Funding and Current Expense of Education)",
    "category": "Education"
  },
  {
    "id": "a9565f6e",
    "label": "California Student Suspension Counts and Rates",
    "category": "Education"
  },
  {
    "id": "084e44c1",
    "label": "Texas County Appraisal District Software Vendor Directory",
    "category": "Government"
  },
  {
    "id": "92c97ef9",
    "label": "Budget Authority by Function & Subfunction",
    "category": "Government"
  },
  {
    "id": "4c2b4ea0",
    "label": "Executive Branch Civilian Employment (FTE)",
    "category": "Government"
  },
  {
    "id": "3c7322d6",
    "label": "Composition of Federal Outlays",
    "category": "Government"
  },
  {
    "id": "ae00fae6",
    "label": "Discretionary Budget Authority by Agency",
    "category": "Government"
  },
  {
    "id": "327df9f1",
    "label": "Discretionary Program Outlays",
    "category": "Government"
  },
  {
    "id": "d0dcfb60",
    "label": "Federal Grants to State & Local Governments",
    "category": "Government"
  },
  {
    "id": "b0a86fd1",
    "label": "Federal Health Program Outlays",
    "category": "Government"
  },
  {
    "id": "dc389c74",
    "label": "Federal Investment Outlays",
    "category": "Government"
  },
  {
    "id": "f3f94a68",
    "label": "Mandatory Program Outlays",
    "category": "Economics"
  },
  {
    "id": "99112fe6",
    "label": "Federal Other Receipts",
    "category": "Government"
  },
  {
    "id": "647a9a97",
    "label": "Federal Outlays by Agency",
    "category": "Government"
  },
  {
    "id": "aee9cfd5",
    "label": "Outlays by Budget Enforcement Act Category",
    "category": "Government"
  },
  {
    "id": "d9e3aa5c",
    "label": "Federal Payments for Individuals by Program",
    "category": "Government"
  },
  {
    "id": "def61559",
    "label": "Federal Receipts by Source",
    "category": "Economics"
  },
  {
    "id": "0ab39191",
    "label": "Texas Chapter 313 Value-Limitation Agreements",
    "category": "Government"
  },
  {
    "id": "0b023624",
    "label": "State-to-County Migration Flows (ACS 5-Year)",
    "category": "Demographics"
  },
  {
    "id": "0bb3dad5",
    "label": "GitHub Innovation Graph: Repository Topics by Economy",
    "category": "Technology"
  },
  {
    "id": "14f56a6a",
    "label": "California County Assessed Property Values (SCO)",
    "category": "Economics"
  },
  {
    "id": "16e3d814",
    "label": "U.S. Drought Monitor - Weekly Drought Conditions by State",
    "category": "Environment"
  },
  {
    "id": "1843f5e0",
    "label": "GitHub Innovation Graph: Developers by Economy",
    "category": "Economics"
  },
  {
    "id": "1d164677",
    "label": "OEWS National Employment & Wages (Multi-Year)",
    "category": "Labor"
  },
  {
    "id": "2dfedb1d",
    "label": "State of Devs 2025",
    "category": "Labor"
  },
  {
    "id": "30b02fb4",
    "label": "GISTEMP Zonal Temperature Anomalies",
    "category": "Environment"
  },
  {
    "id": "31046b05",
    "label": "WGMS Glacier Inventory (Location & Identifiers)",
    "category": "Environment"
  },
  {
    "id": "3b7b01a3",
    "label": "CalEnviroScreen 5.0: California Tract-Level Pollution & Vulnerability Scores",
    "category": "Environment"
  },
  {
    "id": "46dfaf07",
    "label": "Federal R&D Outlays",
    "category": "Economics"
  },
  {
    "id": "484da334",
    "label": "Generative AI Usage Among Workers",
    "category": "Labor"
  },
  {
    "id": "4f10fd6e",
    "label": "SEC Company Financials - Dow 30 Annual Income Statement",
    "category": "Finance"
  },
  {
    "id": "8e025b7f",
    "label": "Federal Receipts, Outlays & Deficits",
    "category": "Government"
  },
  {
    "id": "527b1b5d",
    "label": "USDA Equine Farm Inventory (1850-2022)",
    "category": "Agriculture"
  },
  {
    "id": "52993e5e",
    "label": "METR AI Developer Productivity RCT (Round 1 + Round 2)",
    "category": "Technology"
  },
  {
    "id": "556b5801",
    "label": "State of AI 2026",
    "category": "Technology"
  },
  {
    "id": "5a952db4",
    "label": "Quarterly Census of Employment and Wages (Texas)",
    "category": "Labor"
  },
  {
    "id": "5abd7ce0",
    "label": "FEC Enforcement Cases by Respondent",
    "category": "Government"
  },
  {
    "id": "5d18e7cd",
    "label": "Leaded Petrol Bans by Country",
    "category": "Environment"
  },
  {
    "id": "67f11c63",
    "label": "USAspending Federal Contract Awards (FY2024)",
    "category": "Government"
  },
  {
    "id": "68082205",
    "label": "GitHub Innovation Graph: Programming Languages by Economy",
    "category": "Technology"
  },
  {
    "id": "6a565d52",
    "label": "Anthropic Economic Index - Automation vs Augmentation by Task",
    "category": "Labor"
  },
  {
    "id": "73cf8b65",
    "label": "TEC Form 1295 Certificates of Interested Parties",
    "category": "Government"
  },
  {
    "id": "74146974",
    "label": "Population-Weighted Heating and Cooling Degree Days",
    "category": "Environment"
  },
  {
    "id": "76f882cf",
    "label": "Airborne Lead (Pb) Concentrations by Monitor",
    "category": "Environment"
  },
  {
    "id": "78517778",
    "label": "GitHub Innovation Graph: Git Pushes by Economy",
    "category": "Technology"
  },
  {
    "id": "7a9e7c73",
    "label": "Work Hours Assisted by Generative AI",
    "category": "Labor"
  },
  {
    "id": "7b140d47",
    "label": "Texas Statewide Oil & Gas Production History (1932/1935-2018)",
    "category": "Energy"
  },
  {
    "id": "80aadaec",
    "label": "California Arrests by County, Demographics, and Offense, 1980-2024",
    "category": "Crime"
  },
  {
    "id": "872fe4a6",
    "label": "U.S. Wind & Utility-Scale Solar Capacity by State",
    "category": "Energy"
  },
  {
    "id": "8c41e5ae",
    "label": "GitHub Innovation Graph: Organizations by Economy",
    "category": "Technology"
  },
  {
    "id": "8f928790",
    "label": "Global Ocean Heat Content Anomaly by Basin and Depth Layer",
    "category": "Environment"
  },
  {
    "id": "904813fe",
    "label": "FEC Lobbyist Bundled Contributions",
    "category": "Government"
  },
  {
    "id": "92e51970",
    "label": "Texas Annual Leavers by District",
    "category": "Education"
  },
  {
    "id": "a2bb0ad3",
    "label": "State of JavaScript 2025",
    "category": "Technology"
  },
  {
    "id": "a709ebcd",
    "label": "Baker Hughes North America Rotary Rig Count - Texas & Permian Basin",
    "category": "Energy"
  },
  {
    "id": "a8c89681",
    "label": "Texas Chapter 312 Property Tax Abatement Agreements",
    "category": "Government"
  },
  {
    "id": "aa2ea348",
    "label": "California Fire Hazard Severity Zones (SRA + LRA, 2025)",
    "category": "Environment"
  },
  {
    "id": "aaca8e26",
    "label": "Global Findex Database (Financial Inclusion)",
    "category": "Economics"
  },
  {
    "id": "abaa55ea",
    "label": "2020 Census ZCTA Boundaries (Cartographic, National)",
    "category": "Geography"
  },
  {
    "id": "b373f4a8",
    "label": "ACS Field of Degree by Occupation (PUMS 2022)",
    "category": "Education"
  },
  {
    "id": "b3baf326",
    "label": "US Wildland Fire Statistics",
    "category": "Environment"
  },
  {
    "id": "b562e5d5",
    "label": "GitHub Innovation Graph: Cross-Economy Collaborators",
    "category": "Economics"
  },
  {
    "id": "b5e97d91",
    "label": "WGMS Glacier Mass Balance (Land Ice)",
    "category": "Environment"
  },
  {
    "id": "b63a3813",
    "label": "GitHub Innovation Graph: Repositories by Economy",
    "category": "Technology"
  },
  {
    "id": "b966c124",
    "label": "EIA Short-Term Energy Outlook -- Regional Drilling Productivity and Shale Production",
    "category": "Energy"
  },
  {
    "id": "bcd8a281",
    "label": "TExES Certification Exam Pass Rates by Educator Preparation Program (Texas)",
    "category": "Education"
  },
  {
    "id": "c50b2280",
    "label": "Relative Sea Level Trends by Tide Gauge Station",
    "category": "Environment"
  },
  {
    "id": "cc57178f",
    "label": "Texas DIR Cooperative Contracts",
    "category": "Government"
  },
  {
    "id": "d0a21c02",
    "label": "California Sales and Use Tax Rates by Jurisdiction",
    "category": "Economics"
  },
  {
    "id": "d2982205",
    "label": "Social Insurance & Excise Tax Receipts",
    "category": "Economics"
  },
  {
    "id": "d7851dc5",
    "label": "US National Lead Emissions Trends, 1970-1998",
    "category": "Environment"
  },
  {
    "id": "d9a61e0c",
    "label": "Stack Overflow Developer Survey",
    "category": "Technology"
  },
  {
    "id": "e7286478",
    "label": "PIP Percentiles - Global Income & Consumption Distribution",
    "category": "Economics"
  },
  {
    "id": "e8caaf21",
    "label": "California Criminal Justice Performance Metrics (Measures for Justice)",
    "category": "Crime"
  },
  {
    "id": "ec6718be",
    "label": "Country-Level Annual Temperature Anomaly",
    "category": "Environment"
  },
  {
    "id": "ed673f33",
    "label": "GitHub Innovation Graph: Licenses by Economy",
    "category": "Technology"
  },
  {
    "id": "f3e29ce3",
    "label": "U.S. Grid Interconnection Queues (Queued Up)",
    "category": "Energy"
  },
  {
    "id": "f4f4472e",
    "label": "NFIP Flood Insurance Claims (Redacted)",
    "category": "Finance"
  },
  {
    "id": "f51da9b9",
    "label": "BLS Employment Projections 2024-34",
    "category": "Labor"
  },
  {
    "id": "f551d355",
    "label": "U.S. Drought Monitor - Weekly Drought Conditions by County",
    "category": "Environment"
  },
  {
    "id": "f5776fde",
    "label": "US Prison Population, 1977-Present (National Prisoner Statistics)",
    "category": "Crime"
  },
  {
    "id": "a0d5c625",
    "label": "Texas Retail Sales Tax Collections by Subsector",
    "category": "Economics"
  },
  {
    "id": "f1b2a17f",
    "label": "Texas Active Sales Tax Permit Holders",
    "category": "Economics"
  },
  {
    "id": "9cb08386",
    "label": "Texas HB 103 Local Bond & Tax Rate Elections",
    "category": "Government"
  },
  {
    "id": "6123bd9d",
    "label": "Texas Monthly Revenue Watch - All Funds",
    "category": "Government"
  },
  {
    "id": "12febdc3",
    "label": "Texas Monthly Net Revenue by Source, General Revenue-Related Funds",
    "category": "Government"
  },
  {
    "id": "fe99d23a",
    "label": "Texas Sales Tax Collections by Industry (NAICS)",
    "category": "Economics"
  },
  {
    "id": "829796c5",
    "label": "Texas Tax-Exempt Entities",
    "category": "Government"
  },
  {
    "id": "d4c74dd2",
    "label": "Texas Sales Tax Allocation City-County Comparison",
    "category": "Government"
  },
  {
    "id": "7be084b2",
    "label": "Texas Active Franchise Taxpayers",
    "category": "Economics"
  },
  {
    "id": "6d059011",
    "label": "Taxes of Texas: Ten-Year Tax Collections by Tax Type",
    "category": "Government"
  },
  {
    "id": "75734010",
    "label": "Texas Court Activity, FY 2015-2024",
    "category": "Crime"
  },
  {
    "id": "21cf0920",
    "label": "Texas State Bond Debt by Agency and Fiscal Year",
    "category": "Finance"
  },
  {
    "id": "17447be0",
    "label": "Texas Capital Construction Assistance Projects (CCAP) Debt Service",
    "category": "Government"
  },
  {
    "id": "09ee5de7",
    "label": "Texas Public Community and Junior College Funding by Source",
    "category": "Education"
  },
  {
    "id": "24612a6f",
    "label": "Texas Adult and Juvenile Correctional Population, Staffing & Supervision",
    "category": "Crime"
  },
  {
    "id": "1f7e3c70",
    "label": "Texas Economic Stabilization Fund - Ending Balance and Cap",
    "category": "Government"
  },
  {
    "id": "0010ef78",
    "label": "Texas Economic Stabilization Fund - Expenditures by Agency and Program",
    "category": "Government"
  },
  {
    "id": "260f015b",
    "label": "Texas Economic Stabilization Fund - Revenue by Source",
    "category": "Government"
  },
  {
    "id": "5b4ec0d9",
    "label": "Texas Higher Education Formula Funding",
    "category": "Education"
  },
  {
    "id": "530b9625",
    "label": "Texas Major State Investment Funds - Asset Class Holdings",
    "category": "Finance"
  },
  {
    "id": "32e264e5",
    "label": "Texas Major State Investment Funds - Fund-Year Performance",
    "category": "Finance"
  },
  {
    "id": "575fc898",
    "label": "Texas State Contracts Database",
    "category": "Government"
  },
  {
    "id": "2d7df2fe",
    "label": "Austin Purchase Order Commodity/Goods Detail",
    "category": "Government"
  },
  {
    "id": "0f700783",
    "label": "Federal Product and Service Codes (PSC)",
    "category": "Government"
  },
  {
    "id": "ffc5ba5e",
    "label": "Texas Unified Transportation Program (UTP) Listed Projects",
    "category": "Transportation"
  },
  {
    "id": "c7239f23",
    "label": "City of Austin Contracts",
    "category": "Government"
  },
  {
    "id": "9ebdb8c5",
    "label": "City of Austin Active Solicitations",
    "category": "Government"
  },
  {
    "id": "ad011f28",
    "label": "California Unclaimed Property ($500 and Above)",
    "category": "Finance"
  },
  {
    "id": "8bed27b1",
    "label": "California Annual Debt Transparency Reports (ADTR)",
    "category": "Finance"
  },
  {
    "id": "37e5becb",
    "label": "California Public Debt Issuance",
    "category": "Finance"
  },
  {
    "id": "5d832347",
    "label": "California Public Debt Defaults and Draws on Reserve",
    "category": "Finance"
  },
  {
    "id": "41f6c1dd",
    "label": "Infant Mortality Rates by Maternal Race (Linked Birth/Infant Death)",
    "category": "Health"
  },
  {
    "id": "e7d7a682",
    "label": "Maternal Mortality by State (NCHS)",
    "category": "Health"
  },
  {
    "id": "f1ed80eb",
    "label": "Provisional Maternal Mortality Rates (VSRR)",
    "category": "Health"
  },
  {
    "id": "0b7faa65",
    "label": "OECD Maternal and Infant Mortality",
    "category": "Health"
  },
  {
    "id": "e4ce790b",
    "label": "Maternal Mortality Estimates",
    "category": "Health"
  },
  {
    "id": "123052fa",
    "label": "WHO Maternal Mortality Indicators",
    "category": "Health"
  },
  {
    "id": "6c4e8997",
    "label": "Infant Mortality Rate",
    "category": "Health"
  },
  {
    "id": "241d1484",
    "label": "Maternal Mortality Ratio",
    "category": "Health"
  },
  {
    "id": "cd10b32b",
    "label": "Cesarean Delivery Rates by State",
    "category": "Health"
  },
  {
    "id": "a5c2eb9f",
    "label": "State Paid Family & Medical Leave Insurance Laws",
    "category": "Labor"
  },
  {
    "id": "8c2c0866",
    "label": "WIC Program Monthly Participation by State Agency",
    "category": "Health"
  },
  {
    "id": "2ecf582c",
    "label": "Incarceration Trends (County-Level)",
    "category": "Crime"
  },
  {
    "id": "246f5b38",
    "label": "Rural Hospital Closures (US, since 2005)",
    "category": "Health"
  },
  {
    "id": "4aa8d1d0",
    "label": "Preterm Birth Rates by State",
    "category": "Health"
  },
  {
    "id": "cb40ccd5",
    "label": "County OB-GYN and Primary Care Physician Workforce (AHRF)",
    "category": "Health"
  },
  {
    "id": "243bac8d",
    "label": "Food Access Research Atlas (Food Deserts)",
    "category": "Agriculture"
  },
  {
    "id": "22803b15",
    "label": "CDC/ATSDR Social Vulnerability Index (SVI), by Census Tract",
    "category": "Health"
  },
  {
    "id": "5d9aaf8c",
    "label": "FINESS National Registry of Health & Social Establishments (France)",
    "category": "Health"
  },
  {
    "id": "ef5b4d82",
    "label": "EHPAD Accommodation and Dependency Pricing (France)",
    "category": "Economics"
  },
  {
    "id": "5f99bc4a",
    "label": "FINESS Historical Establishments Archive (France, 2004-2025)",
    "category": "Health"
  },
  {
    "id": "6b4db884",
    "label": "EHPAD Accommodation and Dependency Pricing (France, 2018-2024 Archive)",
    "category": "Economics"
  },
  {
    "id": "d01c35e5",
    "label": "Bilateral Trade Flows (Exporter-Importer Pairs)",
    "category": "Economics"
  },
  {
    "id": "7d591f2f",
    "label": "IMF Direction of Trade Statistics (Bilateral Trade by Partner Country)",
    "category": "Economics"
  },
  {
    "id": "fca4cb9c",
    "label": "City of Austin Current Contract List",
    "category": "Government"
  },
  {
    "id": "55a8796d",
    "label": "City of Austin Contracts Expiring Within 180 Days",
    "category": "Government"
  },
  {
    "id": "bece555b",
    "label": "Census Gazetteer - ZIP Code Tabulation Areas (2025)",
    "category": "Geography"
  },
  {
    "id": "e89cdeb8",
    "label": "FEC Committee Receipts (Schedule A)",
    "category": "Government"
  },
  {
    "id": "bc28e434",
    "label": "Merchandise Trade Matrix",
    "category": "Economics"
  },
  {
    "id": "84ea0c9c",
    "label": "California Late Independent Expenditure Reports (Cal-Access)",
    "category": "Government"
  },
  {
    "id": "454175a6",
    "label": "California Lobbying Payments (Cal-Access)",
    "category": "Government"
  },
  {
    "id": "62405109",
    "label": "DIME Candidate & Committee Ideology (CFscores), 1979-2024",
    "category": "Government"
  },
  {
    "id": "598faab1",
    "label": "FEC Transaction Type Codes",
    "category": "Government"
  },
  {
    "id": "c8b607e8",
    "label": "Oakland 311 Service Requests",
    "category": "Government"
  },
  {
    "id": "9cff86c4",
    "label": "Sacramento 311 Calls (2016 - April 2020)",
    "category": "Government"
  },
  {
    "id": "8dd3f5a6",
    "label": "San Jose 311 Service Requests",
    "category": "Government"
  },
  {
    "id": "af18548d",
    "label": "City of Los Angeles MyLA311 Service Requests",
    "category": "Crime"
  },
  {
    "id": "38c5f627",
    "label": "San Francisco 311 Cases",
    "category": "Government"
  },
  {
    "id": "53576bdb",
    "label": "2020 Census Tract to PUMA Crosswalk",
    "category": "Geography"
  },
  {
    "id": "ad9f99fd",
    "label": "HUD-USPS ZIP Code to Census Tract Crosswalk",
    "category": "Geography"
  },
  {
    "id": "c14cbc2f",
    "label": "California Late Contribution Reports (Cal-Access)",
    "category": "Government"
  },
  {
    "id": "10caa798",
    "label": "Federal Contract Opportunities",
    "category": "Government"
  },
  {
    "id": "8ee323f1",
    "label": "San Diego \"Get It Done\" Service Requests",
    "category": "Government"
  },
  {
    "id": "50ae1cf2",
    "label": "Federal Lobbying Registrants",
    "category": "Government"
  },
  {
    "id": "93f5a7e2",
    "label": "California 311 Service Requests",
    "category": "Government"
  },
  {
    "id": "5db6ecf8",
    "label": "California Homelessness by Demographic Group",
    "category": "Housing"
  },
  {
    "id": "05a8cd42",
    "label": "US City 311 Service Requests",
    "category": "Government"
  },
  {
    "id": "d4e7ac7a",
    "label": "Life Expectancy, WHO and World Bank Compared",
    "category": "Health"
  },
  {
    "id": "43979938",
    "label": "Maternal Mortality Ratio, WHO, World Bank and UNICEF Compared",
    "category": "Health"
  },
  {
    "id": "e4ec1c9c",
    "label": "Texas ISD Property Value by Category, 2003 and 2022-2024",
    "category": "Housing"
  },
  {
    "id": "daeef8c2",
    "label": "TEC Office Codes",
    "category": "Government"
  },
  {
    "id": "73825afb",
    "label": "ADU Building Permits",
    "category": "Housing"
  },
  {
    "id": "b71050e4",
    "label": "Texas Lobbyist Expenditures on Officials",
    "category": "Government"
  },
  {
    "id": "2f188eac",
    "label": "Corporate Profits",
    "category": "Economics"
  },
  {
    "id": "018225db",
    "label": "State Housing Price Index",
    "category": "Housing"
  },
  {
    "id": "67820bc2",
    "label": "Trade-Weighted U.S. Dollar Index",
    "category": "Economics"
  },
  {
    "id": "c3777980",
    "label": "Durable Goods Orders",
    "category": "Economics"
  },
  {
    "id": "c997b990",
    "label": "Lahman Batting Statistics",
    "category": "Sports"
  },
  {
    "id": "ee1791e5",
    "label": "Lahman Pitching Statistics",
    "category": "Sports"
  },
  {
    "id": "d29fa000",
    "label": "NFL Game Results & Schedules",
    "category": "Sports"
  },
  {
    "id": "489d609e",
    "label": "NFL Player Season Stats",
    "category": "Sports"
  },
  {
    "id": "5f7f5650",
    "label": "Empire State Manufacturing Survey",
    "category": "Economics"
  },
  {
    "id": "ac5b06dc",
    "label": "Manufacturing Business Outlook Survey",
    "category": "Economics"
  },
  {
    "id": "c6f463bd",
    "label": "Fifth District Manufacturing Survey",
    "category": "Economics"
  },
  {
    "id": "3f7371af",
    "label": "ERCOT Day-Ahead Market Settlement Point Prices",
    "category": "Energy"
  },
  {
    "id": "80aa4812",
    "label": "PJM Load Forecast by Zone",
    "category": "Energy"
  },
  {
    "id": "c72a6912",
    "label": "MISO Planning Resource Auction Clearing Prices",
    "category": "Energy"
  },
  {
    "id": "58e61f8a",
    "label": "US Electric Disturbance Events (DOE Form OE-417)",
    "category": "Energy"
  },
  {
    "id": "d1028509",
    "label": "EIA-861 Electricity Sales to Ultimate Customers",
    "category": "Energy"
  },
  {
    "id": "b372ccbd",
    "label": "Wholesale Electricity Prices (ICE)",
    "category": "Energy"
  },
  {
    "id": "b5601eb0",
    "label": "Cost Plus Drugs Retail Price List",
    "category": "Health"
  }
];

export const graphEdges = [
  {
    "source": "e2965509",
    "target": "71327717",
    "confidence": 0.6
  },
  {
    "source": "e2965509",
    "target": "1ae74063",
    "confidence": 0.58
  },
  {
    "source": "120de3cc",
    "target": "9b3cb959",
    "confidence": 0.65
  },
  {
    "source": "120de3cc",
    "target": "bcb2d2ed",
    "confidence": 0.77
  },
  {
    "source": "120de3cc",
    "target": "b362a86a",
    "confidence": 0.63
  },
  {
    "source": "120de3cc",
    "target": "a18b6665",
    "confidence": 0.67
  },
  {
    "source": "120de3cc",
    "target": "74be3d9a",
    "confidence": 0.71
  },
  {
    "source": "a5c05e83",
    "target": "ce06614e",
    "confidence": 0.74
  },
  {
    "source": "a5c05e83",
    "target": "8a96906c",
    "confidence": 0.71
  },
  {
    "source": "a5c05e83",
    "target": "ca43e00f",
    "confidence": 0.66
  },
  {
    "source": "a5c05e83",
    "target": "560cc767",
    "confidence": 0.68
  },
  {
    "source": "a5c05e83",
    "target": "fbc4faaf",
    "confidence": 0.72
  },
  {
    "source": "8a96906c",
    "target": "98615cc0",
    "confidence": 0.62
  },
  {
    "source": "8a96906c",
    "target": "a82bc0f4",
    "confidence": 0.85
  },
  {
    "source": "8a96906c",
    "target": "331fa22e",
    "confidence": 0.75
  },
  {
    "source": "8a96906c",
    "target": "df9e6431",
    "confidence": 0.73
  },
  {
    "source": "e762c6c7",
    "target": "99d279cd",
    "confidence": 0.7
  },
  {
    "source": "e762c6c7",
    "target": "5fecd4ce",
    "confidence": 0.77
  },
  {
    "source": "e762c6c7",
    "target": "7f54d9f5",
    "confidence": 0.75
  },
  {
    "source": "e762c6c7",
    "target": "97895716",
    "confidence": 0.76
  },
  {
    "source": "e762c6c7",
    "target": "a6c6b8c4",
    "confidence": 0.86
  },
  {
    "source": "e762c6c7",
    "target": "ad1d40fa",
    "confidence": 0.81
  },
  {
    "source": "e762c6c7",
    "target": "1555f94b",
    "confidence": 0.82
  },
  {
    "source": "7be51af9",
    "target": "2107c251",
    "confidence": 0.56
  },
  {
    "source": "7be51af9",
    "target": "e3d2b0bf",
    "confidence": 0.66
  },
  {
    "source": "7be51af9",
    "target": "6c009f14",
    "confidence": 0.56
  },
  {
    "source": "c653f3db",
    "target": "2fafe82c",
    "confidence": 0.48
  },
  {
    "source": "c653f3db",
    "target": "1628cb00",
    "confidence": 0.5
  },
  {
    "source": "c653f3db",
    "target": "39138d1e",
    "confidence": 0.56
  },
  {
    "source": "2fafe82c",
    "target": "d15368f8",
    "confidence": 0.62
  },
  {
    "source": "2fafe82c",
    "target": "7a860867",
    "confidence": 0.62
  },
  {
    "source": "2fafe82c",
    "target": "1628cb00",
    "confidence": 0.57
  },
  {
    "source": "2fafe82c",
    "target": "7c50570c",
    "confidence": 0.62
  },
  {
    "source": "2fafe82c",
    "target": "1352e65b",
    "confidence": 0.76
  },
  {
    "source": "2fafe82c",
    "target": "c4733c74",
    "confidence": 0.78
  },
  {
    "source": "1e194f91",
    "target": "68d82c31",
    "confidence": 0.74
  },
  {
    "source": "1e194f91",
    "target": "33c92385",
    "confidence": 0.64
  },
  {
    "source": "1e194f91",
    "target": "7684c0d6",
    "confidence": 0.65
  },
  {
    "source": "1e194f91",
    "target": "725517c2",
    "confidence": 0.66
  },
  {
    "source": "56a1067e",
    "target": "eee56dce",
    "confidence": 0.65
  },
  {
    "source": "56a1067e",
    "target": "1bfadfc7",
    "confidence": 0.73
  },
  {
    "source": "56a1067e",
    "target": "c847d0cc",
    "confidence": 0.68
  },
  {
    "source": "56a1067e",
    "target": "15da530a",
    "confidence": 0.82
  },
  {
    "source": "e3d2b0bf",
    "target": "2107c251",
    "confidence": 0.61
  },
  {
    "source": "e3d2b0bf",
    "target": "7be51af9",
    "confidence": 0.66
  },
  {
    "source": "e3d2b0bf",
    "target": "6c009f14",
    "confidence": 0.71
  },
  {
    "source": "e3d2b0bf",
    "target": "497a8e09",
    "confidence": 0.59
  },
  {
    "source": "e3d2b0bf",
    "target": "d15368f8",
    "confidence": 0.62
  },
  {
    "source": "c9a123b4",
    "target": "c25dd86c",
    "confidence": 0.71
  },
  {
    "source": "c9a123b4",
    "target": "3b4f7e97",
    "confidence": 0.8
  },
  {
    "source": "c9a123b4",
    "target": "0d4dee1a",
    "confidence": 0.79
  },
  {
    "source": "d15368f8",
    "target": "2fafe82c",
    "confidence": 0.62
  },
  {
    "source": "d15368f8",
    "target": "2277635d",
    "confidence": 0.52
  },
  {
    "source": "d15368f8",
    "target": "7a860867",
    "confidence": 0.66
  },
  {
    "source": "1db2ee60",
    "target": "85d0fecb",
    "confidence": 0.7
  },
  {
    "source": "1db2ee60",
    "target": "71d6bd43",
    "confidence": 0.64
  },
  {
    "source": "4b5309ba",
    "target": "50a5f7d8",
    "confidence": 0.9
  },
  {
    "source": "4b5309ba",
    "target": "4d19eb47",
    "confidence": 0.92
  },
  {
    "source": "450639fa",
    "target": "0f1eb55f",
    "confidence": 0.64
  },
  {
    "source": "450639fa",
    "target": "049a933e",
    "confidence": 0.67
  },
  {
    "source": "84ce2585",
    "target": "67d76234",
    "confidence": 0.65
  },
  {
    "source": "84ce2585",
    "target": "165a9245",
    "confidence": 0.65
  },
  {
    "source": "84ce2585",
    "target": "1efcb5e1",
    "confidence": 0.62
  },
  {
    "source": "84ce2585",
    "target": "14153458",
    "confidence": 0.62
  },
  {
    "source": "aa376596",
    "target": "3a812be5",
    "confidence": 0.58
  },
  {
    "source": "aa376596",
    "target": "0e57a1d2",
    "confidence": 0.5
  },
  {
    "source": "aa376596",
    "target": "df006bea",
    "confidence": 0.58
  },
  {
    "source": "aa376596",
    "target": "283ec879",
    "confidence": 0.56
  },
  {
    "source": "df006bea",
    "target": "aa376596",
    "confidence": 0.58
  },
  {
    "source": "df006bea",
    "target": "4e7b4100",
    "confidence": 0.59
  },
  {
    "source": "df006bea",
    "target": "3eb245c0",
    "confidence": 0.71
  },
  {
    "source": "df006bea",
    "target": "17be5124",
    "confidence": 0.58
  },
  {
    "source": "df006bea",
    "target": "a2bc0e5e",
    "confidence": 0.63
  },
  {
    "source": "50a5f7d8",
    "target": "4b5309ba",
    "confidence": 0.9
  },
  {
    "source": "50a5f7d8",
    "target": "4d19eb47",
    "confidence": 0.92
  },
  {
    "source": "aaa374aa",
    "target": "8072c9ca",
    "confidence": 0.56
  },
  {
    "source": "4d19eb47",
    "target": "14153458",
    "confidence": 0.74
  },
  {
    "source": "4d19eb47",
    "target": "b73bc4c6",
    "confidence": 0.67
  },
  {
    "source": "4d19eb47",
    "target": "974e7e71",
    "confidence": 0.7
  },
  {
    "source": "4d19eb47",
    "target": "4b5309ba",
    "confidence": 0.92
  },
  {
    "source": "4d19eb47",
    "target": "50a5f7d8",
    "confidence": 0.92
  },
  {
    "source": "4d19eb47",
    "target": "0cb3f964",
    "confidence": 0.68
  },
  {
    "source": "5dc77801",
    "target": "ca574889",
    "confidence": 0.64
  },
  {
    "source": "5dc77801",
    "target": "5eb80aa5",
    "confidence": 0.71
  },
  {
    "source": "7a860867",
    "target": "d15368f8",
    "confidence": 0.66
  },
  {
    "source": "7a860867",
    "target": "2fafe82c",
    "confidence": 0.62
  },
  {
    "source": "7a860867",
    "target": "1352e65b",
    "confidence": 0.61
  },
  {
    "source": "6b296ce4",
    "target": "2d2fa764",
    "confidence": 0.67
  },
  {
    "source": "6b296ce4",
    "target": "49b2393f",
    "confidence": 0.67
  },
  {
    "source": "6b296ce4",
    "target": "81aa80b0",
    "confidence": 0.74
  },
  {
    "source": "1efcb5e1",
    "target": "84ce2585",
    "confidence": 0.62
  },
  {
    "source": "1efcb5e1",
    "target": "d6b61b7d",
    "confidence": 0.64
  },
  {
    "source": "1efcb5e1",
    "target": "67d76234",
    "confidence": 0.64
  },
  {
    "source": "f00be631",
    "target": "14153458",
    "confidence": 0.71
  },
  {
    "source": "f00be631",
    "target": "9e51c024",
    "confidence": 0.68
  },
  {
    "source": "f00be631",
    "target": "808b411f",
    "confidence": 0.72
  },
  {
    "source": "0e7508a4",
    "target": "a6c6b8c4",
    "confidence": 0.7
  },
  {
    "source": "0e7508a4",
    "target": "99d279cd",
    "confidence": 0.71
  },
  {
    "source": "0e7508a4",
    "target": "74c8accc",
    "confidence": 0.73
  },
  {
    "source": "0eadb747",
    "target": "0f1eb55f",
    "confidence": 0.69
  },
  {
    "source": "0eadb747",
    "target": "431f97f2",
    "confidence": 0.73
  },
  {
    "source": "0eadb747",
    "target": "48afc7c9",
    "confidence": 0.73
  },
  {
    "source": "0eadb747",
    "target": "65b452ff",
    "confidence": 0.66
  },
  {
    "source": "436ec7d4",
    "target": "c9555977",
    "confidence": 0.55
  },
  {
    "source": "436ec7d4",
    "target": "6a2536bd",
    "confidence": 0.58
  },
  {
    "source": "436ec7d4",
    "target": "4099b1cd",
    "confidence": 0.8
  },
  {
    "source": "436ec7d4",
    "target": "443d2919",
    "confidence": 0.59
  },
  {
    "source": "436ec7d4",
    "target": "725517c2",
    "confidence": 0.6
  },
  {
    "source": "3d3db1d4",
    "target": "74c8accc",
    "confidence": 0.6
  },
  {
    "source": "3d3db1d4",
    "target": "0ff4b159",
    "confidence": 0.59
  },
  {
    "source": "3d3db1d4",
    "target": "ca2048d1",
    "confidence": 0.58
  },
  {
    "source": "3d3db1d4",
    "target": "fbc4faaf",
    "confidence": 0.57
  },
  {
    "source": "ca574889",
    "target": "5dc77801",
    "confidence": 0.64
  },
  {
    "source": "ca574889",
    "target": "5eb80aa5",
    "confidence": 0.62
  },
  {
    "source": "4aaa270a",
    "target": "d9c97e1f",
    "confidence": 0.77
  },
  {
    "source": "4aaa270a",
    "target": "d4ab43e0",
    "confidence": 0.68
  },
  {
    "source": "4aaa270a",
    "target": "2a449e12",
    "confidence": 0.71
  },
  {
    "source": "2551e62f",
    "target": "52b2940f",
    "confidence": 0.7
  },
  {
    "source": "2551e62f",
    "target": "14153458",
    "confidence": 0.73
  },
  {
    "source": "2551e62f",
    "target": "0982491b",
    "confidence": 0.73
  },
  {
    "source": "2551e62f",
    "target": "54db5551",
    "confidence": 0.74
  },
  {
    "source": "0238c976",
    "target": "cef214da",
    "confidence": 0.82
  },
  {
    "source": "0238c976",
    "target": "032d5a45",
    "confidence": 0.77
  },
  {
    "source": "0238c976",
    "target": "c24618b6",
    "confidence": 0.84
  },
  {
    "source": "0238c976",
    "target": "28272a35",
    "confidence": 0.65
  },
  {
    "source": "f82f91ca",
    "target": "d4ab43e0",
    "confidence": 0.73
  },
  {
    "source": "f82f91ca",
    "target": "36e2ef47",
    "confidence": 0.73
  },
  {
    "source": "98615cc0",
    "target": "8a96906c",
    "confidence": 0.62
  },
  {
    "source": "98615cc0",
    "target": "ddd14ae3",
    "confidence": 0.62
  },
  {
    "source": "98615cc0",
    "target": "ce06614e",
    "confidence": 0.65
  },
  {
    "source": "17be5124",
    "target": "df006bea",
    "confidence": 0.58
  },
  {
    "source": "17be5124",
    "target": "fe8325c8",
    "confidence": 0.53
  },
  {
    "source": "17be5124",
    "target": "1f2ba0f7",
    "confidence": 0.55
  },
  {
    "source": "17be5124",
    "target": "3eb245c0",
    "confidence": 0.55
  },
  {
    "source": "4099b1cd",
    "target": "436ec7d4",
    "confidence": 0.8
  },
  {
    "source": "4099b1cd",
    "target": "8971b345",
    "confidence": 0.68
  },
  {
    "source": "560cc767",
    "target": "1bfadfc7",
    "confidence": 0.67
  },
  {
    "source": "560cc767",
    "target": "a5c05e83",
    "confidence": 0.68
  },
  {
    "source": "560cc767",
    "target": "8e671004",
    "confidence": 0.65
  },
  {
    "source": "560cc767",
    "target": "67d76234",
    "confidence": 0.69
  },
  {
    "source": "3ce262e8",
    "target": "7e5a3994",
    "confidence": 0.58
  },
  {
    "source": "3ce262e8",
    "target": "6a72e662",
    "confidence": 0.61
  },
  {
    "source": "3ce262e8",
    "target": "f785a439",
    "confidence": 0.59
  },
  {
    "source": "3ce262e8",
    "target": "de1c4994",
    "confidence": 0.58
  },
  {
    "source": "84d6b81d",
    "target": "5dc77801",
    "confidence": 0.7
  },
  {
    "source": "84d6b81d",
    "target": "5eb80aa5",
    "confidence": 0.59
  },
  {
    "source": "115b3abd",
    "target": "60159ada",
    "confidence": 0.62
  },
  {
    "source": "115b3abd",
    "target": "94922603",
    "confidence": 0.63
  },
  {
    "source": "115b3abd",
    "target": "8fe33575",
    "confidence": 0.69
  },
  {
    "source": "115b3abd",
    "target": "7a06e089",
    "confidence": 0.66
  },
  {
    "source": "a996cfda",
    "target": "b8adbe4f",
    "confidence": 0.68
  },
  {
    "source": "a996cfda",
    "target": "6a4cfe3c",
    "confidence": 0.63
  },
  {
    "source": "2d2fa764",
    "target": "590b4841",
    "confidence": 0.82
  },
  {
    "source": "2d2fa764",
    "target": "9dc974de",
    "confidence": 0.69
  },
  {
    "source": "2d2fa764",
    "target": "384333a0",
    "confidence": 0.72
  },
  {
    "source": "2d2fa764",
    "target": "24c922b0",
    "confidence": 0.67
  },
  {
    "source": "2d2fa764",
    "target": "d3823c15",
    "confidence": 0.73
  },
  {
    "source": "2d2fa764",
    "target": "ab2ffcf1",
    "confidence": 0.67
  },
  {
    "source": "2d2fa764",
    "target": "5deb01c2",
    "confidence": 0.7
  },
  {
    "source": "2d2fa764",
    "target": "1516d201",
    "confidence": 0.76
  },
  {
    "source": "d2ea2417",
    "target": "5c648979",
    "confidence": 0.41
  },
  {
    "source": "d2ea2417",
    "target": "09f8dd6a",
    "confidence": 0.4
  },
  {
    "source": "d2ea2417",
    "target": "3a212289",
    "confidence": 0.56
  },
  {
    "source": "d2ea2417",
    "target": "78518dc3",
    "confidence": 0.44
  },
  {
    "source": "3eda6b3d",
    "target": "33c92385",
    "confidence": 0.61
  },
  {
    "source": "3eda6b3d",
    "target": "ec49291d",
    "confidence": 0.78
  },
  {
    "source": "3eda6b3d",
    "target": "e84b1e2f",
    "confidence": 0.66
  },
  {
    "source": "3eda6b3d",
    "target": "725517c2",
    "confidence": 0.78
  },
  {
    "source": "af1126fa",
    "target": "2de020f3",
    "confidence": 0.66
  },
  {
    "source": "af1126fa",
    "target": "9016d792",
    "confidence": 0.66
  },
  {
    "source": "0f7b2641",
    "target": "f5819b06",
    "confidence": 0.95
  },
  {
    "source": "0f7b2641",
    "target": "557417a3",
    "confidence": 0.65
  },
  {
    "source": "0f7b2641",
    "target": "1f2ba0f7",
    "confidence": 0.8
  },
  {
    "source": "5eb80aa5",
    "target": "533a197a",
    "confidence": 0.65
  },
  {
    "source": "5eb80aa5",
    "target": "5dc77801",
    "confidence": 0.71
  },
  {
    "source": "5eb80aa5",
    "target": "5a8c385b",
    "confidence": 0.7
  },
  {
    "source": "5eb80aa5",
    "target": "44697716",
    "confidence": 0.72
  },
  {
    "source": "ad49b781",
    "target": "431f97f2",
    "confidence": 0.77
  },
  {
    "source": "ad49b781",
    "target": "50b16c4e",
    "confidence": 0.87
  },
  {
    "source": "ad49b781",
    "target": "1e39edcd",
    "confidence": 0.68
  },
  {
    "source": "084521e5",
    "target": "29a7322d",
    "confidence": 0.58
  },
  {
    "source": "084521e5",
    "target": "07fb8f8d",
    "confidence": 0.57
  },
  {
    "source": "efa07496",
    "target": "9e51c024",
    "confidence": 0.52
  },
  {
    "source": "efa07496",
    "target": "144b6c42",
    "confidence": 0.63
  },
  {
    "source": "efa07496",
    "target": "4d19eb47",
    "confidence": 0.55
  },
  {
    "source": "efa07496",
    "target": "4b5309ba",
    "confidence": 0.54
  },
  {
    "source": "808b411f",
    "target": "f00be631",
    "confidence": 0.72
  },
  {
    "source": "808b411f",
    "target": "3215f78c",
    "confidence": 0.68
  },
  {
    "source": "808b411f",
    "target": "14153458",
    "confidence": 0.8
  },
  {
    "source": "808b411f",
    "target": "9e51c024",
    "confidence": 0.73
  },
  {
    "source": "808b411f",
    "target": "1b9d7b0f",
    "confidence": 0.75
  },
  {
    "source": "10ad2362",
    "target": "1352e65b",
    "confidence": 0.59
  },
  {
    "source": "10ad2362",
    "target": "ec49291d",
    "confidence": 0.66
  },
  {
    "source": "10ad2362",
    "target": "725517c2",
    "confidence": 0.63
  },
  {
    "source": "dd904cd7",
    "target": "c580c6fd",
    "confidence": 0.53
  },
  {
    "source": "dd904cd7",
    "target": "9a8d4ed3",
    "confidence": 0.63
  },
  {
    "source": "dd904cd7",
    "target": "41118414",
    "confidence": 0.55
  },
  {
    "source": "dd904cd7",
    "target": "713dbcd3",
    "confidence": 0.53
  },
  {
    "source": "0cb3f964",
    "target": "4b5309ba",
    "confidence": 0.66
  },
  {
    "source": "0cb3f964",
    "target": "48afc7c9",
    "confidence": 0.66
  },
  {
    "source": "0cb3f964",
    "target": "4d19eb47",
    "confidence": 0.68
  },
  {
    "source": "6a72e662",
    "target": "f785a439",
    "confidence": 0.73
  },
  {
    "source": "6a72e662",
    "target": "6738ecf9",
    "confidence": 0.69
  },
  {
    "source": "6a72e662",
    "target": "70d42f14",
    "confidence": 0.63
  },
  {
    "source": "39138d1e",
    "target": "c653f3db",
    "confidence": 0.56
  },
  {
    "source": "39138d1e",
    "target": "fe8325c8",
    "confidence": 0.54
  },
  {
    "source": "39138d1e",
    "target": "1f2ba0f7",
    "confidence": 0.58
  },
  {
    "source": "3a212289",
    "target": "d2ea2417",
    "confidence": 0.56
  },
  {
    "source": "3a212289",
    "target": "f5819b06",
    "confidence": 0.53
  },
  {
    "source": "3a212289",
    "target": "1f2ba0f7",
    "confidence": 0.51
  },
  {
    "source": "3215f78c",
    "target": "9e51c024",
    "confidence": 0.77
  },
  {
    "source": "3215f78c",
    "target": "14153458",
    "confidence": 0.71
  },
  {
    "source": "35cdd473",
    "target": "69d330da",
    "confidence": 0.67
  },
  {
    "source": "35cdd473",
    "target": "0f1eb55f",
    "confidence": 0.8
  },
  {
    "source": "9b3cb959",
    "target": "8ec9d4c9",
    "confidence": 0.58
  },
  {
    "source": "9b3cb959",
    "target": "b49b36b7",
    "confidence": 0.58
  },
  {
    "source": "9b3cb959",
    "target": "74be3d9a",
    "confidence": 0.63
  },
  {
    "source": "9b3cb959",
    "target": "b362a86a",
    "confidence": 0.6
  },
  {
    "source": "9b3cb959",
    "target": "e041ca9c",
    "confidence": 0.54
  },
  {
    "source": "ec49291d",
    "target": "3eda6b3d",
    "confidence": 0.78
  },
  {
    "source": "ec49291d",
    "target": "e84b1e2f",
    "confidence": 0.74
  },
  {
    "source": "ec49291d",
    "target": "725517c2",
    "confidence": 0.84
  },
  {
    "source": "ec49291d",
    "target": "10ad2362",
    "confidence": 0.66
  },
  {
    "source": "a18b6665",
    "target": "be08a2e2",
    "confidence": 0.78
  },
  {
    "source": "a18b6665",
    "target": "70a91a40",
    "confidence": 0.67
  },
  {
    "source": "a18b6665",
    "target": "52b2940f",
    "confidence": 0.74
  },
  {
    "source": "82c3869c",
    "target": "2686da58",
    "confidence": 0.7
  },
  {
    "source": "82c3869c",
    "target": "ab158b59",
    "confidence": 0.71
  },
  {
    "source": "82c3869c",
    "target": "98d2ca01",
    "confidence": 0.89
  },
  {
    "source": "82c3869c",
    "target": "1bfadfc7",
    "confidence": 0.7
  },
  {
    "source": "82c3869c",
    "target": "56dda441",
    "confidence": 0.71
  },
  {
    "source": "0f1eb55f",
    "target": "35cdd473",
    "confidence": 0.8
  },
  {
    "source": "0f1eb55f",
    "target": "450639fa",
    "confidence": 0.64
  },
  {
    "source": "0f1eb55f",
    "target": "049a933e",
    "confidence": 0.72
  },
  {
    "source": "2a01498b",
    "target": "44697716",
    "confidence": 0.82
  },
  {
    "source": "2a01498b",
    "target": "5a577e3d",
    "confidence": 0.84
  },
  {
    "source": "2a01498b",
    "target": "0ff4b159",
    "confidence": 0.75
  },
  {
    "source": "ddd14ae3",
    "target": "49b2393f",
    "confidence": 0.71
  },
  {
    "source": "8a66c9bc",
    "target": "b38b70f4",
    "confidence": 0.85
  },
  {
    "source": "8a66c9bc",
    "target": "049a933e",
    "confidence": 0.68
  },
  {
    "source": "8a66c9bc",
    "target": "69d330da",
    "confidence": 0.87
  },
  {
    "source": "8a66c9bc",
    "target": "c78d884e",
    "confidence": 0.69
  },
  {
    "source": "33031019",
    "target": "a60ce701",
    "confidence": 0.71
  },
  {
    "source": "33031019",
    "target": "15da530a",
    "confidence": 0.69
  },
  {
    "source": "33031019",
    "target": "c847d0cc",
    "confidence": 0.71
  },
  {
    "source": "33031019",
    "target": "3283659e",
    "confidence": 0.78
  },
  {
    "source": "33031019",
    "target": "ad9c19aa",
    "confidence": 0.69
  },
  {
    "source": "33031019",
    "target": "1bfadfc7",
    "confidence": 0.74
  },
  {
    "source": "33031019",
    "target": "4358224a",
    "confidence": 0.81
  },
  {
    "source": "68d82c31",
    "target": "674e8b89",
    "confidence": 0.57
  },
  {
    "source": "68d82c31",
    "target": "33c92385",
    "confidence": 0.66
  },
  {
    "source": "68d82c31",
    "target": "1e194f91",
    "confidence": 0.74
  },
  {
    "source": "68d82c31",
    "target": "2de020f3",
    "confidence": 0.71
  },
  {
    "source": "3ea0627f",
    "target": "ca2048d1",
    "confidence": 0.74
  },
  {
    "source": "3ea0627f",
    "target": "a60ce701",
    "confidence": 0.74
  },
  {
    "source": "3ea0627f",
    "target": "ad332145",
    "confidence": 0.69
  },
  {
    "source": "3ea0627f",
    "target": "c84d7088",
    "confidence": 0.73
  },
  {
    "source": "3ea0627f",
    "target": "bdfed3c3",
    "confidence": 0.63
  },
  {
    "source": "3ea0627f",
    "target": "fbc4faaf",
    "confidence": 0.83
  },
  {
    "source": "e84b1e2f",
    "target": "d041e296",
    "confidence": 0.85
  },
  {
    "source": "e84b1e2f",
    "target": "0f96e5c0",
    "confidence": 0.84
  },
  {
    "source": "e84b1e2f",
    "target": "2d227071",
    "confidence": 0.82
  },
  {
    "source": "e84b1e2f",
    "target": "2e1af33d",
    "confidence": 0.83
  },
  {
    "source": "e84b1e2f",
    "target": "dd7af505",
    "confidence": 0.77
  },
  {
    "source": "e84b1e2f",
    "target": "6a4cfe3c",
    "confidence": 0.81
  },
  {
    "source": "99d279cd",
    "target": "0e7508a4",
    "confidence": 0.71
  },
  {
    "source": "99d279cd",
    "target": "268ea809",
    "confidence": 0.65
  },
  {
    "source": "99d279cd",
    "target": "67d76234",
    "confidence": 0.71
  },
  {
    "source": "99d279cd",
    "target": "12470f7f",
    "confidence": 0.69
  },
  {
    "source": "a60ce701",
    "target": "c84d7088",
    "confidence": 0.88
  },
  {
    "source": "a60ce701",
    "target": "a6e16eab",
    "confidence": 0.66
  },
  {
    "source": "a60ce701",
    "target": "3ea0627f",
    "confidence": 0.74
  },
  {
    "source": "0ff4b159",
    "target": "44697716",
    "confidence": 0.77
  },
  {
    "source": "0ff4b159",
    "target": "5a577e3d",
    "confidence": 0.82
  },
  {
    "source": "1914dd63",
    "target": "a60ce701",
    "confidence": 0.63
  },
  {
    "source": "1914dd63",
    "target": "3ea0627f",
    "confidence": 0.63
  },
  {
    "source": "1914dd63",
    "target": "33031019",
    "confidence": 0.67
  },
  {
    "source": "1914dd63",
    "target": "8e671004",
    "confidence": 0.62
  },
  {
    "source": "c84d7088",
    "target": "3ea0627f",
    "confidence": 0.73
  },
  {
    "source": "c84d7088",
    "target": "a60ce701",
    "confidence": 0.88
  },
  {
    "source": "c84d7088",
    "target": "ce06614e",
    "confidence": 0.73
  },
  {
    "source": "37688dad",
    "target": "1a248c3f",
    "confidence": 0.81
  },
  {
    "source": "37688dad",
    "target": "7e5a3994",
    "confidence": 0.71
  },
  {
    "source": "37688dad",
    "target": "6738ecf9",
    "confidence": 0.7
  },
  {
    "source": "2b71f799",
    "target": "6cf22e37",
    "confidence": 0.68
  },
  {
    "source": "2b71f799",
    "target": "b105ac84",
    "confidence": 0.91
  },
  {
    "source": "2b71f799",
    "target": "b38b70f4",
    "confidence": 0.77
  },
  {
    "source": "2b71f799",
    "target": "453662c7",
    "confidence": 0.72
  },
  {
    "source": "a357dfa8",
    "target": "24c922b0",
    "confidence": 0.69
  },
  {
    "source": "a357dfa8",
    "target": "fecbb633",
    "confidence": 0.62
  },
  {
    "source": "a357dfa8",
    "target": "67852f37",
    "confidence": 0.77
  },
  {
    "source": "a357dfa8",
    "target": "f0ee5389",
    "confidence": 0.78
  },
  {
    "source": "2e1af33d",
    "target": "e84b1e2f",
    "confidence": 0.83
  },
  {
    "source": "2e1af33d",
    "target": "725517c2",
    "confidence": 0.79
  },
  {
    "source": "2e1af33d",
    "target": "2d227071",
    "confidence": 0.71
  },
  {
    "source": "2e1af33d",
    "target": "0f96e5c0",
    "confidence": 0.74
  },
  {
    "source": "be08a2e2",
    "target": "52b2940f",
    "confidence": 0.69
  },
  {
    "source": "be08a2e2",
    "target": "a18b6665",
    "confidence": 0.78
  },
  {
    "source": "fef77e18",
    "target": "14324148",
    "confidence": 0.87
  },
  {
    "source": "9ba64e50",
    "target": "bf0c2bd5",
    "confidence": 0.6
  },
  {
    "source": "9ba64e50",
    "target": "2e822ae1",
    "confidence": 0.62
  },
  {
    "source": "9ba64e50",
    "target": "3a3ddeea",
    "confidence": 0.81
  },
  {
    "source": "eef16a28",
    "target": "92f886ef",
    "confidence": 0.65
  },
  {
    "source": "eef16a28",
    "target": "a6e15bd3",
    "confidence": 0.5
  },
  {
    "source": "8ec9d4c9",
    "target": "21e43253",
    "confidence": 0.5
  },
  {
    "source": "8ec9d4c9",
    "target": "48885493",
    "confidence": 0.51
  },
  {
    "source": "8ec9d4c9",
    "target": "bbb485e1",
    "confidence": 0.49
  },
  {
    "source": "8ec9d4c9",
    "target": "462d2756",
    "confidence": 0.52
  },
  {
    "source": "8ec9d4c9",
    "target": "9b3cb959",
    "confidence": 0.58
  },
  {
    "source": "12470f7f",
    "target": "67d76234",
    "confidence": 0.77
  },
  {
    "source": "12470f7f",
    "target": "b73bc4c6",
    "confidence": 0.62
  },
  {
    "source": "12470f7f",
    "target": "99d279cd",
    "confidence": 0.69
  },
  {
    "source": "e041ca9c",
    "target": "a2bc0e5e",
    "confidence": 0.53
  },
  {
    "source": "e041ca9c",
    "target": "3eb245c0",
    "confidence": 0.52
  },
  {
    "source": "e041ca9c",
    "target": "9b3cb959",
    "confidence": 0.54
  },
  {
    "source": "9f56e7c9",
    "target": "473c9cee",
    "confidence": 0.66
  },
  {
    "source": "9f56e7c9",
    "target": "a8c45ee3",
    "confidence": 0.64
  },
  {
    "source": "9f56e7c9",
    "target": "443d2919",
    "confidence": 0.72
  },
  {
    "source": "2de020f3",
    "target": "5a8c385b",
    "confidence": 0.72
  },
  {
    "source": "2de020f3",
    "target": "af1126fa",
    "confidence": 0.66
  },
  {
    "source": "2de020f3",
    "target": "68d82c31",
    "confidence": 0.71
  },
  {
    "source": "29a7322d",
    "target": "084521e5",
    "confidence": 0.58
  },
  {
    "source": "29a7322d",
    "target": "07fb8f8d",
    "confidence": 0.61
  },
  {
    "source": "29a7322d",
    "target": "15da530a",
    "confidence": 0.61
  },
  {
    "source": "c6136ab6",
    "target": "50a5f7d8",
    "confidence": 0.58
  },
  {
    "source": "c6136ab6",
    "target": "fcd2fdfb",
    "confidence": 0.67
  },
  {
    "source": "c6136ab6",
    "target": "9e51c024",
    "confidence": 0.68
  },
  {
    "source": "c6136ab6",
    "target": "3215f78c",
    "confidence": 0.63
  },
  {
    "source": "6a2536bd",
    "target": "725517c2",
    "confidence": 0.61
  },
  {
    "source": "6a2536bd",
    "target": "c9555977",
    "confidence": 0.76
  },
  {
    "source": "6a2536bd",
    "target": "2e1af33d",
    "confidence": 0.59
  },
  {
    "source": "2e822ae1",
    "target": "9ba64e50",
    "confidence": 0.62
  },
  {
    "source": "2e822ae1",
    "target": "771a950b",
    "confidence": 0.78
  },
  {
    "source": "2e822ae1",
    "target": "df9e6431",
    "confidence": 0.68
  },
  {
    "source": "2e822ae1",
    "target": "a1ea0b9c",
    "confidence": 0.69
  },
  {
    "source": "9e51c024",
    "target": "431f97f2",
    "confidence": 0.74
  },
  {
    "source": "9e51c024",
    "target": "3215f78c",
    "confidence": 0.77
  },
  {
    "source": "9e51c024",
    "target": "14153458",
    "confidence": 0.81
  },
  {
    "source": "b49b36b7",
    "target": "b3baf326",
    "confidence": 0.54
  },
  {
    "source": "b49b36b7",
    "target": "bcb2d2ed",
    "confidence": 0.54
  },
  {
    "source": "b49b36b7",
    "target": "9b3cb959",
    "confidence": 0.56
  },
  {
    "source": "c9555977",
    "target": "6a2536bd",
    "confidence": 0.76
  },
  {
    "source": "c9555977",
    "target": "436ec7d4",
    "confidence": 0.55
  },
  {
    "source": "674e8b89",
    "target": "33c92385",
    "confidence": 0.57
  },
  {
    "source": "674e8b89",
    "target": "68d82c31",
    "confidence": 0.57
  },
  {
    "source": "674e8b89",
    "target": "2541e5ce",
    "confidence": 0.72
  },
  {
    "source": "5a577e3d",
    "target": "f596130d",
    "confidence": 0.77
  },
  {
    "source": "5a577e3d",
    "target": "5a8c385b",
    "confidence": 0.81
  },
  {
    "source": "5a577e3d",
    "target": "cfbdae52",
    "confidence": 0.73
  },
  {
    "source": "5a577e3d",
    "target": "b6243e8d",
    "confidence": 0.78
  },
  {
    "source": "5a577e3d",
    "target": "2a01498b",
    "confidence": 0.84
  },
  {
    "source": "5a577e3d",
    "target": "0ff4b159",
    "confidence": 0.82
  },
  {
    "source": "5a577e3d",
    "target": "44697716",
    "confidence": 0.93
  },
  {
    "source": "b73bc4c6",
    "target": "67d76234",
    "confidence": 0.69
  },
  {
    "source": "b73bc4c6",
    "target": "4d19eb47",
    "confidence": 0.67
  },
  {
    "source": "b73bc4c6",
    "target": "9e51c024",
    "confidence": 0.68
  },
  {
    "source": "6a4cfe3c",
    "target": "b8adbe4f",
    "confidence": 0.82
  },
  {
    "source": "6a4cfe3c",
    "target": "d041e296",
    "confidence": 0.8
  },
  {
    "source": "6a4cfe3c",
    "target": "dd7af505",
    "confidence": 0.76
  },
  {
    "source": "6a4cfe3c",
    "target": "0f96e5c0",
    "confidence": 0.87
  },
  {
    "source": "725517c2",
    "target": "2e1af33d",
    "confidence": 0.79
  },
  {
    "source": "725517c2",
    "target": "3eda6b3d",
    "confidence": 0.78
  },
  {
    "source": "725517c2",
    "target": "ec49291d",
    "confidence": 0.84
  },
  {
    "source": "725517c2",
    "target": "1e194f91",
    "confidence": 0.66
  },
  {
    "source": "07fb8f8d",
    "target": "29a7322d",
    "confidence": 0.61
  },
  {
    "source": "07fb8f8d",
    "target": "44697716",
    "confidence": 0.6
  },
  {
    "source": "07fb8f8d",
    "target": "084521e5",
    "confidence": 0.57
  },
  {
    "source": "6cf22e37",
    "target": "2b71f799",
    "confidence": 0.68
  },
  {
    "source": "6cf22e37",
    "target": "4d1d962e",
    "confidence": 0.62
  },
  {
    "source": "6cf22e37",
    "target": "b105ac84",
    "confidence": 0.68
  },
  {
    "source": "590b4841",
    "target": "2d2fa764",
    "confidence": 0.82
  },
  {
    "source": "590b4841",
    "target": "7e06c948",
    "confidence": 0.7
  },
  {
    "source": "590b4841",
    "target": "331fa22e",
    "confidence": 0.8
  },
  {
    "source": "590b4841",
    "target": "ab2ffcf1",
    "confidence": 0.66
  },
  {
    "source": "590b4841",
    "target": "384333a0",
    "confidence": 0.77
  },
  {
    "source": "3dd29ab5",
    "target": "ef877814",
    "confidence": 0.64
  },
  {
    "source": "3dd29ab5",
    "target": "d2c2e76c",
    "confidence": 0.67
  },
  {
    "source": "3dd29ab5",
    "target": "44d2368a",
    "confidence": 0.59
  },
  {
    "source": "3dd29ab5",
    "target": "15da530a",
    "confidence": 0.63
  },
  {
    "source": "8bf049b5",
    "target": "df9e6431",
    "confidence": 0.62
  },
  {
    "source": "8bf049b5",
    "target": "771a950b",
    "confidence": 0.62
  },
  {
    "source": "f33a7b4b",
    "target": "502c7f61",
    "confidence": 0.78
  },
  {
    "source": "f33a7b4b",
    "target": "44697716",
    "confidence": 0.75
  },
  {
    "source": "f33a7b4b",
    "target": "d1b47db7",
    "confidence": 0.74
  },
  {
    "source": "44697716",
    "target": "2a449e12",
    "confidence": 0.75
  },
  {
    "source": "44697716",
    "target": "17ff9ab4",
    "confidence": 0.77
  },
  {
    "source": "44697716",
    "target": "b6243e8d",
    "confidence": 0.81
  },
  {
    "source": "44697716",
    "target": "5a8c385b",
    "confidence": 0.83
  },
  {
    "source": "44697716",
    "target": "2a01498b",
    "confidence": 0.82
  },
  {
    "source": "44697716",
    "target": "5a577e3d",
    "confidence": 0.93
  },
  {
    "source": "44697716",
    "target": "f33a7b4b",
    "confidence": 0.75
  },
  {
    "source": "44697716",
    "target": "0ff4b159",
    "confidence": 0.77
  },
  {
    "source": "7177105c",
    "target": "98d2ca01",
    "confidence": 0.67
  },
  {
    "source": "7177105c",
    "target": "b2917c87",
    "confidence": 0.64
  },
  {
    "source": "b38b70f4",
    "target": "2b71f799",
    "confidence": 0.77
  },
  {
    "source": "b38b70f4",
    "target": "69d330da",
    "confidence": 0.76
  },
  {
    "source": "b38b70f4",
    "target": "c78d884e",
    "confidence": 0.69
  },
  {
    "source": "b38b70f4",
    "target": "8a66c9bc",
    "confidence": 0.85
  },
  {
    "source": "b38b70f4",
    "target": "b105ac84",
    "confidence": 0.78
  },
  {
    "source": "b38b70f4",
    "target": "f01f07c0",
    "confidence": 0.68
  },
  {
    "source": "33c92385",
    "target": "68d82c31",
    "confidence": 0.66
  },
  {
    "source": "33c92385",
    "target": "1e194f91",
    "confidence": 0.64
  },
  {
    "source": "497a8e09",
    "target": "7c50570c",
    "confidence": 0.56
  },
  {
    "source": "497a8e09",
    "target": "e3d2b0bf",
    "confidence": 0.59
  },
  {
    "source": "497a8e09",
    "target": "8971b345",
    "confidence": 0.58
  },
  {
    "source": "05c11d7e",
    "target": "ff479f27",
    "confidence": 0.57
  },
  {
    "source": "05c11d7e",
    "target": "56a1067e",
    "confidence": 0.58
  },
  {
    "source": "05c11d7e",
    "target": "e88a3319",
    "confidence": 0.84
  },
  {
    "source": "05c11d7e",
    "target": "15da530a",
    "confidence": 0.59
  },
  {
    "source": "eeae336d",
    "target": "6cf22e37",
    "confidence": 0.54
  },
  {
    "source": "eeae336d",
    "target": "b105ac84",
    "confidence": 0.55
  },
  {
    "source": "eeae336d",
    "target": "cd309991",
    "confidence": 0.55
  },
  {
    "source": "eeae336d",
    "target": "c24618b6",
    "confidence": 0.53
  },
  {
    "source": "8536b2fa",
    "target": "484024e3",
    "confidence": 0.45
  },
  {
    "source": "8536b2fa",
    "target": "4d1d962e",
    "confidence": 0.52
  },
  {
    "source": "8536b2fa",
    "target": "1dbbde7f",
    "confidence": 0.47
  },
  {
    "source": "8536b2fa",
    "target": "557417a3",
    "confidence": 0.46
  },
  {
    "source": "144b6c42",
    "target": "09f8dd6a",
    "confidence": 0.58
  },
  {
    "source": "144b6c42",
    "target": "2277635d",
    "confidence": 0.48
  },
  {
    "source": "144b6c42",
    "target": "4d19eb47",
    "confidence": 0.52
  },
  {
    "source": "144b6c42",
    "target": "efa07496",
    "confidence": 0.63
  },
  {
    "source": "431f97f2",
    "target": "eebb5ed8",
    "confidence": 0.71
  },
  {
    "source": "431f97f2",
    "target": "1e39edcd",
    "confidence": 0.72
  },
  {
    "source": "431f97f2",
    "target": "50b16c4e",
    "confidence": 0.82
  },
  {
    "source": "431f97f2",
    "target": "ad49b781",
    "confidence": 0.77
  },
  {
    "source": "431f97f2",
    "target": "0eadb747",
    "confidence": 0.73
  },
  {
    "source": "c42bef2c",
    "target": "ef877814",
    "confidence": 0.61
  },
  {
    "source": "c42bef2c",
    "target": "d2c2e76c",
    "confidence": 0.79
  },
  {
    "source": "c42bef2c",
    "target": "031a83c0",
    "confidence": 0.66
  },
  {
    "source": "c42bef2c",
    "target": "ce852fed",
    "confidence": 0.83
  },
  {
    "source": "ce852fed",
    "target": "031a83c0",
    "confidence": 0.7
  },
  {
    "source": "ce852fed",
    "target": "d2c2e76c",
    "confidence": 0.81
  },
  {
    "source": "ce852fed",
    "target": "c42bef2c",
    "confidence": 0.83
  },
  {
    "source": "f01f07c0",
    "target": "268ea809",
    "confidence": 0.64
  },
  {
    "source": "f01f07c0",
    "target": "fc1ba7b8",
    "confidence": 0.92
  },
  {
    "source": "fff00cf4",
    "target": "d041e296",
    "confidence": 0.65
  },
  {
    "source": "fff00cf4",
    "target": "e84b1e2f",
    "confidence": 0.66
  },
  {
    "source": "fff00cf4",
    "target": "0f96e5c0",
    "confidence": 0.67
  },
  {
    "source": "92f886ef",
    "target": "eef16a28",
    "confidence": 0.65
  },
  {
    "source": "92f886ef",
    "target": "a6e15bd3",
    "confidence": 0.61
  },
  {
    "source": "85d0fecb",
    "target": "1db2ee60",
    "confidence": 0.7
  },
  {
    "source": "85d0fecb",
    "target": "71d6bd43",
    "confidence": 0.62
  },
  {
    "source": "85d0fecb",
    "target": "771a950b",
    "confidence": 0.57
  },
  {
    "source": "9b4e05e4",
    "target": "1e5ca178",
    "confidence": 0.68
  },
  {
    "source": "9b4e05e4",
    "target": "6deed922",
    "confidence": 0.63
  },
  {
    "source": "9b4e05e4",
    "target": "923f29c4",
    "confidence": 0.62
  },
  {
    "source": "14324148",
    "target": "fef77e18",
    "confidence": 0.87
  },
  {
    "source": "3eb245c0",
    "target": "a2bc0e5e",
    "confidence": 0.77
  },
  {
    "source": "3eb245c0",
    "target": "f407754c",
    "confidence": 0.58
  },
  {
    "source": "3eb245c0",
    "target": "df006bea",
    "confidence": 0.71
  },
  {
    "source": "a8c45ee3",
    "target": "473c9cee",
    "confidence": 0.62
  },
  {
    "source": "a8c45ee3",
    "target": "f0ee5389",
    "confidence": 0.63
  },
  {
    "source": "a8c45ee3",
    "target": "9f56e7c9",
    "confidence": 0.64
  },
  {
    "source": "915683b2",
    "target": "560cc767",
    "confidence": 0.49
  },
  {
    "source": "915683b2",
    "target": "4d19eb47",
    "confidence": 0.49
  },
  {
    "source": "915683b2",
    "target": "efa07496",
    "confidence": 0.49
  },
  {
    "source": "915683b2",
    "target": "1026b0fb",
    "confidence": 0.48
  },
  {
    "source": "915683b2",
    "target": "c6136ab6",
    "confidence": 0.49
  },
  {
    "source": "a2bc0e5e",
    "target": "5e7c42f4",
    "confidence": 0.6
  },
  {
    "source": "a2bc0e5e",
    "target": "e041ca9c",
    "confidence": 0.53
  },
  {
    "source": "a2bc0e5e",
    "target": "3eb245c0",
    "confidence": 0.77
  },
  {
    "source": "a2bc0e5e",
    "target": "df006bea",
    "confidence": 0.63
  },
  {
    "source": "f5819b06",
    "target": "0f7b2641",
    "confidence": 0.95
  },
  {
    "source": "f5819b06",
    "target": "3a212289",
    "confidence": 0.53
  },
  {
    "source": "f5819b06",
    "target": "78518dc3",
    "confidence": 0.53
  },
  {
    "source": "f5819b06",
    "target": "557417a3",
    "confidence": 0.65
  },
  {
    "source": "f5819b06",
    "target": "1f2ba0f7",
    "confidence": 0.84
  },
  {
    "source": "fe8325c8",
    "target": "3a812be5",
    "confidence": 0.56
  },
  {
    "source": "fe8325c8",
    "target": "39138d1e",
    "confidence": 0.54
  },
  {
    "source": "b105ac84",
    "target": "453662c7",
    "confidence": 0.74
  },
  {
    "source": "b105ac84",
    "target": "b38b70f4",
    "confidence": 0.78
  },
  {
    "source": "b105ac84",
    "target": "2b71f799",
    "confidence": 0.91
  },
  {
    "source": "9dc974de",
    "target": "1516d201",
    "confidence": 0.82
  },
  {
    "source": "a6e15bd3",
    "target": "92f886ef",
    "confidence": 0.61
  },
  {
    "source": "5c648979",
    "target": "9a8d4ed3",
    "confidence": 0.55
  },
  {
    "source": "5c648979",
    "target": "22d6f057",
    "confidence": 0.58
  },
  {
    "source": "5c648979",
    "target": "c5a6fd02",
    "confidence": 0.52
  },
  {
    "source": "56620299",
    "target": "98615cc0",
    "confidence": 0.62
  },
  {
    "source": "56620299",
    "target": "18dd7983",
    "confidence": 0.61
  },
  {
    "source": "56620299",
    "target": "ca2048d1",
    "confidence": 0.63
  },
  {
    "source": "56620299",
    "target": "453662c7",
    "confidence": 0.71
  },
  {
    "source": "dd7af505",
    "target": "e84b1e2f",
    "confidence": 0.77
  },
  {
    "source": "dd7af505",
    "target": "0f96e5c0",
    "confidence": 0.8
  },
  {
    "source": "2541e5ce",
    "target": "5a8c385b",
    "confidence": 0.6
  },
  {
    "source": "2541e5ce",
    "target": "d1b47db7",
    "confidence": 0.65
  },
  {
    "source": "2541e5ce",
    "target": "674e8b89",
    "confidence": 0.72
  },
  {
    "source": "4d1d962e",
    "target": "502c7f61",
    "confidence": 0.63
  },
  {
    "source": "4d1d962e",
    "target": "d1b47db7",
    "confidence": 0.68
  },
  {
    "source": "fecbb633",
    "target": "acbc47ee",
    "confidence": 0.61
  },
  {
    "source": "fecbb633",
    "target": "a357dfa8",
    "confidence": 0.62
  },
  {
    "source": "74be3d9a",
    "target": "9b3cb959",
    "confidence": 0.63
  },
  {
    "source": "74be3d9a",
    "target": "b362a86a",
    "confidence": 0.61
  },
  {
    "source": "15da530a",
    "target": "eee56dce",
    "confidence": 0.66
  },
  {
    "source": "15da530a",
    "target": "29a7322d",
    "confidence": 0.61
  },
  {
    "source": "15da530a",
    "target": "33031019",
    "confidence": 0.69
  },
  {
    "source": "15da530a",
    "target": "56a1067e",
    "confidence": 0.82
  },
  {
    "source": "453662c7",
    "target": "2b71f799",
    "confidence": 0.72
  },
  {
    "source": "453662c7",
    "target": "b105ac84",
    "confidence": 0.74
  },
  {
    "source": "453662c7",
    "target": "98d2ca01",
    "confidence": 0.7
  },
  {
    "source": "f0ee5389",
    "target": "a357dfa8",
    "confidence": 0.78
  },
  {
    "source": "f0ee5389",
    "target": "473c9cee",
    "confidence": 0.72
  },
  {
    "source": "f0ee5389",
    "target": "67852f37",
    "confidence": 0.86
  },
  {
    "source": "f0ee5389",
    "target": "a8c45ee3",
    "confidence": 0.63
  },
  {
    "source": "1e39edcd",
    "target": "431f97f2",
    "confidence": 0.72
  },
  {
    "source": "1e39edcd",
    "target": "50b16c4e",
    "confidence": 0.72
  },
  {
    "source": "1e39edcd",
    "target": "1026b0fb",
    "confidence": 0.75
  },
  {
    "source": "0e57a1d2",
    "target": "4d1d962e",
    "confidence": 0.56
  },
  {
    "source": "0e57a1d2",
    "target": "d1b47db7",
    "confidence": 0.55
  },
  {
    "source": "0e57a1d2",
    "target": "2de020f3",
    "confidence": 0.51
  },
  {
    "source": "0e57a1d2",
    "target": "6cf22e37",
    "confidence": 0.56
  },
  {
    "source": "1dbbde7f",
    "target": "8536b2fa",
    "confidence": 0.47
  },
  {
    "source": "1dbbde7f",
    "target": "78518dc3",
    "confidence": 0.49
  },
  {
    "source": "1dbbde7f",
    "target": "557417a3",
    "confidence": 0.52
  },
  {
    "source": "1dbbde7f",
    "target": "674e8b89",
    "confidence": 0.51
  },
  {
    "source": "09f8dd6a",
    "target": "144b6c42",
    "confidence": 0.58
  },
  {
    "source": "09f8dd6a",
    "target": "431f97f2",
    "confidence": 0.52
  },
  {
    "source": "09f8dd6a",
    "target": "0eadb747",
    "confidence": 0.53
  },
  {
    "source": "1e5ca178",
    "target": "6deed922",
    "confidence": 0.69
  },
  {
    "source": "1e5ca178",
    "target": "923f29c4",
    "confidence": 0.7
  },
  {
    "source": "1e5ca178",
    "target": "9b4e05e4",
    "confidence": 0.68
  },
  {
    "source": "3a812be5",
    "target": "28272a35",
    "confidence": 0.54
  },
  {
    "source": "3a812be5",
    "target": "fe8325c8",
    "confidence": 0.56
  },
  {
    "source": "3a812be5",
    "target": "aa376596",
    "confidence": 0.58
  },
  {
    "source": "3a3ddeea",
    "target": "3e924212",
    "confidence": 0.55
  },
  {
    "source": "3a3ddeea",
    "target": "9ba64e50",
    "confidence": 0.81
  },
  {
    "source": "bbb485e1",
    "target": "9b3cb959",
    "confidence": 0.51
  },
  {
    "source": "bbb485e1",
    "target": "8ec9d4c9",
    "confidence": 0.49
  },
  {
    "source": "bbb485e1",
    "target": "00896e83",
    "confidence": 0.52
  },
  {
    "source": "b2917c87",
    "target": "fed9cdaa",
    "confidence": 0.84
  },
  {
    "source": "b2917c87",
    "target": "610ed501",
    "confidence": 0.84
  },
  {
    "source": "b2917c87",
    "target": "c72f6835",
    "confidence": 0.88
  },
  {
    "source": "71d6bd43",
    "target": "1db2ee60",
    "confidence": 0.64
  },
  {
    "source": "71d6bd43",
    "target": "85d0fecb",
    "confidence": 0.62
  },
  {
    "source": "71d6bd43",
    "target": "771a950b",
    "confidence": 0.61
  },
  {
    "source": "771a950b",
    "target": "edf67988",
    "confidence": 0.65
  },
  {
    "source": "771a950b",
    "target": "2e822ae1",
    "confidence": 0.78
  },
  {
    "source": "771a950b",
    "target": "a1ea0b9c",
    "confidence": 0.74
  },
  {
    "source": "36e2ef47",
    "target": "f82f91ca",
    "confidence": 0.73
  },
  {
    "source": "36e2ef47",
    "target": "74d1d47b",
    "confidence": 0.72
  },
  {
    "source": "7684c0d6",
    "target": "879a27ab",
    "confidence": 0.64
  },
  {
    "source": "7684c0d6",
    "target": "443d2919",
    "confidence": 0.62
  },
  {
    "source": "7684c0d6",
    "target": "1e194f91",
    "confidence": 0.65
  },
  {
    "source": "b51d865f",
    "target": "3eafc6ab",
    "confidence": 0.58
  },
  {
    "source": "b51d865f",
    "target": "8d96b61f",
    "confidence": 0.61
  },
  {
    "source": "b51d865f",
    "target": "84d6b81d",
    "confidence": 0.69
  },
  {
    "source": "c847d0cc",
    "target": "33031019",
    "confidence": 0.71
  },
  {
    "source": "c847d0cc",
    "target": "eee56dce",
    "confidence": 0.63
  },
  {
    "source": "c847d0cc",
    "target": "e88a3319",
    "confidence": 0.65
  },
  {
    "source": "c847d0cc",
    "target": "3283659e",
    "confidence": 0.69
  },
  {
    "source": "715bffbd",
    "target": "a357dfa8",
    "confidence": 0.6
  },
  {
    "source": "715bffbd",
    "target": "daefe08b",
    "confidence": 0.7
  },
  {
    "source": "44d2368a",
    "target": "d2c2e76c",
    "confidence": 0.58
  },
  {
    "source": "44d2368a",
    "target": "3dd29ab5",
    "confidence": 0.59
  },
  {
    "source": "44d2368a",
    "target": "28272a35",
    "confidence": 0.55
  },
  {
    "source": "9016d792",
    "target": "af1126fa",
    "confidence": 0.66
  },
  {
    "source": "9016d792",
    "target": "cd309991",
    "confidence": 0.66
  },
  {
    "source": "2d227071",
    "target": "e84b1e2f",
    "confidence": 0.82
  },
  {
    "source": "2d227071",
    "target": "d041e296",
    "confidence": 0.73
  },
  {
    "source": "78518dc3",
    "target": "f5819b06",
    "confidence": 0.53
  },
  {
    "source": "78518dc3",
    "target": "1f2ba0f7",
    "confidence": 0.53
  },
  {
    "source": "78518dc3",
    "target": "1dbbde7f",
    "confidence": 0.49
  },
  {
    "source": "78518dc3",
    "target": "df006bea",
    "confidence": 0.5
  },
  {
    "source": "6deed922",
    "target": "923f29c4",
    "confidence": 0.74
  },
  {
    "source": "6deed922",
    "target": "1e5ca178",
    "confidence": 0.69
  },
  {
    "source": "6deed922",
    "target": "9b4e05e4",
    "confidence": 0.63
  },
  {
    "source": "daefe08b",
    "target": "a357dfa8",
    "confidence": 0.6
  },
  {
    "source": "daefe08b",
    "target": "715bffbd",
    "confidence": 0.7
  },
  {
    "source": "cd309991",
    "target": "9016d792",
    "confidence": 0.66
  },
  {
    "source": "cd309991",
    "target": "032d5a45",
    "confidence": 0.72
  },
  {
    "source": "cd309991",
    "target": "c24618b6",
    "confidence": 0.71
  },
  {
    "source": "cef214da",
    "target": "c24618b6",
    "confidence": 0.75
  },
  {
    "source": "cef214da",
    "target": "0238c976",
    "confidence": 0.82
  },
  {
    "source": "268ea809",
    "target": "fc1ba7b8",
    "confidence": 0.67
  },
  {
    "source": "268ea809",
    "target": "99d279cd",
    "confidence": 0.65
  },
  {
    "source": "443d2919",
    "target": "9f56e7c9",
    "confidence": 0.72
  },
  {
    "source": "443d2919",
    "target": "3ef5f003",
    "confidence": 0.82
  },
  {
    "source": "443d2919",
    "target": "54db5551",
    "confidence": 0.7
  },
  {
    "source": "443d2919",
    "target": "f59ea0d5",
    "confidence": 0.76
  },
  {
    "source": "b8adbe4f",
    "target": "0f96e5c0",
    "confidence": 0.8
  },
  {
    "source": "b8adbe4f",
    "target": "6a4cfe3c",
    "confidence": 0.82
  },
  {
    "source": "67d76234",
    "target": "974e7e71",
    "confidence": 0.71
  },
  {
    "source": "67d76234",
    "target": "12470f7f",
    "confidence": 0.77
  },
  {
    "source": "67d76234",
    "target": "b73bc4c6",
    "confidence": 0.69
  },
  {
    "source": "67d76234",
    "target": "560cc767",
    "confidence": 0.69
  },
  {
    "source": "67d76234",
    "target": "99d279cd",
    "confidence": 0.71
  },
  {
    "source": "67d76234",
    "target": "84ce2585",
    "confidence": 0.65
  },
  {
    "source": "6c009f14",
    "target": "7be51af9",
    "confidence": 0.56
  },
  {
    "source": "6c009f14",
    "target": "e3d2b0bf",
    "confidence": 0.71
  },
  {
    "source": "d1b47db7",
    "target": "502c7f61",
    "confidence": 0.75
  },
  {
    "source": "d1b47db7",
    "target": "2541e5ce",
    "confidence": 0.65
  },
  {
    "source": "d1b47db7",
    "target": "4d1d962e",
    "confidence": 0.68
  },
  {
    "source": "d1b47db7",
    "target": "f33a7b4b",
    "confidence": 0.74
  },
  {
    "source": "fc1ba7b8",
    "target": "f01f07c0",
    "confidence": 0.92
  },
  {
    "source": "fc1ba7b8",
    "target": "268ea809",
    "confidence": 0.67
  },
  {
    "source": "0f96e5c0",
    "target": "b8adbe4f",
    "confidence": 0.8
  },
  {
    "source": "0f96e5c0",
    "target": "6a4cfe3c",
    "confidence": 0.87
  },
  {
    "source": "0f96e5c0",
    "target": "dd7af505",
    "confidence": 0.8
  },
  {
    "source": "0f96e5c0",
    "target": "e84b1e2f",
    "confidence": 0.84
  },
  {
    "source": "0f96e5c0",
    "target": "fff00cf4",
    "confidence": 0.67
  },
  {
    "source": "0f96e5c0",
    "target": "d041e296",
    "confidence": 0.83
  },
  {
    "source": "c4733c74",
    "target": "2fafe82c",
    "confidence": 0.78
  },
  {
    "source": "c4733c74",
    "target": "1352e65b",
    "confidence": 0.73
  },
  {
    "source": "2686da58",
    "target": "82c3869c",
    "confidence": 0.72
  },
  {
    "source": "2686da58",
    "target": "c84d7088",
    "confidence": 0.68
  },
  {
    "source": "2686da58",
    "target": "56dda441",
    "confidence": 0.81
  },
  {
    "source": "473c9cee",
    "target": "9f56e7c9",
    "confidence": 0.66
  },
  {
    "source": "473c9cee",
    "target": "f0ee5389",
    "confidence": 0.72
  },
  {
    "source": "473c9cee",
    "target": "9e51c024",
    "confidence": 0.66
  },
  {
    "source": "48afc7c9",
    "target": "0eadb747",
    "confidence": 0.73
  },
  {
    "source": "48afc7c9",
    "target": "0cb3f964",
    "confidence": 0.66
  },
  {
    "source": "48afc7c9",
    "target": "923f29c4",
    "confidence": 0.72
  },
  {
    "source": "48afc7c9",
    "target": "f8667a98",
    "confidence": 0.79
  },
  {
    "source": "1f2ba0f7",
    "target": "17be5124",
    "confidence": 0.55
  },
  {
    "source": "1f2ba0f7",
    "target": "78518dc3",
    "confidence": 0.53
  },
  {
    "source": "1f2ba0f7",
    "target": "0f7b2641",
    "confidence": 0.8
  },
  {
    "source": "1f2ba0f7",
    "target": "f5819b06",
    "confidence": 0.84
  },
  {
    "source": "1f2ba0f7",
    "target": "39138d1e",
    "confidence": 0.58
  },
  {
    "source": "1f2ba0f7",
    "target": "557417a3",
    "confidence": 0.57
  },
  {
    "source": "8971b345",
    "target": "497a8e09",
    "confidence": 0.58
  },
  {
    "source": "8971b345",
    "target": "4099b1cd",
    "confidence": 0.68
  },
  {
    "source": "39a6689b",
    "target": "d707092c",
    "confidence": 0.65
  },
  {
    "source": "39a6689b",
    "target": "1f6c8a5e",
    "confidence": 0.65
  },
  {
    "source": "39a6689b",
    "target": "f82a68b0",
    "confidence": 0.65
  },
  {
    "source": "557417a3",
    "target": "1dbbde7f",
    "confidence": 0.52
  },
  {
    "source": "557417a3",
    "target": "f5819b06",
    "confidence": 0.65
  },
  {
    "source": "557417a3",
    "target": "0f7b2641",
    "confidence": 0.65
  },
  {
    "source": "2277635d",
    "target": "e3d2b0bf",
    "confidence": 0.5
  },
  {
    "source": "2277635d",
    "target": "df006bea",
    "confidence": 0.48
  },
  {
    "source": "2277635d",
    "target": "d15368f8",
    "confidence": 0.52
  },
  {
    "source": "1352e65b",
    "target": "10ad2362",
    "confidence": 0.59
  },
  {
    "source": "1352e65b",
    "target": "2fafe82c",
    "confidence": 0.76
  },
  {
    "source": "1352e65b",
    "target": "c4733c74",
    "confidence": 0.73
  },
  {
    "source": "c78d884e",
    "target": "8a66c9bc",
    "confidence": 0.69
  },
  {
    "source": "c78d884e",
    "target": "69d330da",
    "confidence": 0.72
  },
  {
    "source": "7c50570c",
    "target": "1628cb00",
    "confidence": 0.62
  },
  {
    "source": "7c50570c",
    "target": "2fafe82c",
    "confidence": 0.62
  },
  {
    "source": "54db5551",
    "target": "443d2919",
    "confidence": 0.7
  },
  {
    "source": "54db5551",
    "target": "2551e62f",
    "confidence": 0.74
  },
  {
    "source": "0982491b",
    "target": "1f6c8a5e",
    "confidence": 0.68
  },
  {
    "source": "0982491b",
    "target": "3795df99",
    "confidence": 0.62
  },
  {
    "source": "0982491b",
    "target": "9e51c024",
    "confidence": 0.67
  },
  {
    "source": "0982491b",
    "target": "2551e62f",
    "confidence": 0.73
  },
  {
    "source": "974e7e71",
    "target": "f59ea0d5",
    "confidence": 0.69
  },
  {
    "source": "974e7e71",
    "target": "67d76234",
    "confidence": 0.7
  },
  {
    "source": "14153458",
    "target": "87cb1256",
    "confidence": 0.83
  },
  {
    "source": "14153458",
    "target": "2551e62f",
    "confidence": 0.73
  },
  {
    "source": "14153458",
    "target": "f00be631",
    "confidence": 0.71
  },
  {
    "source": "14153458",
    "target": "3215f78c",
    "confidence": 0.71
  },
  {
    "source": "14153458",
    "target": "808b411f",
    "confidence": 0.8
  },
  {
    "source": "14153458",
    "target": "1b9d7b0f",
    "confidence": 0.8
  },
  {
    "source": "14153458",
    "target": "9e51c024",
    "confidence": 0.81
  },
  {
    "source": "d041e296",
    "target": "e84b1e2f",
    "confidence": 0.85
  },
  {
    "source": "d041e296",
    "target": "2d227071",
    "confidence": 0.73
  },
  {
    "source": "d041e296",
    "target": "fff00cf4",
    "confidence": 0.65
  },
  {
    "source": "d041e296",
    "target": "0f96e5c0",
    "confidence": 0.83
  },
  {
    "source": "69d330da",
    "target": "8a66c9bc",
    "confidence": 0.87
  },
  {
    "source": "69d330da",
    "target": "c78d884e",
    "confidence": 0.72
  },
  {
    "source": "69d330da",
    "target": "049a933e",
    "confidence": 0.71
  },
  {
    "source": "69d330da",
    "target": "b38b70f4",
    "confidence": 0.76
  },
  {
    "source": "69d330da",
    "target": "35cdd473",
    "confidence": 0.67
  },
  {
    "source": "049a933e",
    "target": "0f1eb55f",
    "confidence": 0.72
  },
  {
    "source": "049a933e",
    "target": "69d330da",
    "confidence": 0.71
  },
  {
    "source": "049a933e",
    "target": "450639fa",
    "confidence": 0.67
  },
  {
    "source": "923f29c4",
    "target": "48afc7c9",
    "confidence": 0.72
  },
  {
    "source": "923f29c4",
    "target": "f8667a98",
    "confidence": 0.63
  },
  {
    "source": "923f29c4",
    "target": "1e5ca178",
    "confidence": 0.7
  },
  {
    "source": "923f29c4",
    "target": "6deed922",
    "confidence": 0.74
  },
  {
    "source": "50b16c4e",
    "target": "431f97f2",
    "confidence": 0.82
  },
  {
    "source": "50b16c4e",
    "target": "ad49b781",
    "confidence": 0.87
  },
  {
    "source": "50b16c4e",
    "target": "1e39edcd",
    "confidence": 0.72
  },
  {
    "source": "8e671004",
    "target": "560cc767",
    "confidence": 0.65
  },
  {
    "source": "8e671004",
    "target": "1bfadfc7",
    "confidence": 0.65
  },
  {
    "source": "8e671004",
    "target": "33031019",
    "confidence": 0.68
  },
  {
    "source": "ce06614e",
    "target": "fbc4faaf",
    "confidence": 0.73
  },
  {
    "source": "ce06614e",
    "target": "49b2393f",
    "confidence": 0.71
  },
  {
    "source": "ce06614e",
    "target": "a82bc0f4",
    "confidence": 0.7
  },
  {
    "source": "ce06614e",
    "target": "a5c05e83",
    "confidence": 0.74
  },
  {
    "source": "fbc4faaf",
    "target": "ce06614e",
    "confidence": 0.73
  },
  {
    "source": "fbc4faaf",
    "target": "ad332145",
    "confidence": 0.73
  },
  {
    "source": "fbc4faaf",
    "target": "a5c05e83",
    "confidence": 0.72
  },
  {
    "source": "fbc4faaf",
    "target": "3ea0627f",
    "confidence": 0.83
  },
  {
    "source": "ad9c19aa",
    "target": "33031019",
    "confidence": 0.69
  },
  {
    "source": "ad9c19aa",
    "target": "92f6487f",
    "confidence": 0.66
  },
  {
    "source": "ad9c19aa",
    "target": "3283659e",
    "confidence": 0.69
  },
  {
    "source": "48885493",
    "target": "4358224a",
    "confidence": 0.62
  },
  {
    "source": "48885493",
    "target": "c84d7088",
    "confidence": 0.59
  },
  {
    "source": "48885493",
    "target": "33031019",
    "confidence": 0.6
  },
  {
    "source": "48885493",
    "target": "560cc767",
    "confidence": 0.65
  },
  {
    "source": "48885493",
    "target": "82c3869c",
    "confidence": 0.59
  },
  {
    "source": "c72f6835",
    "target": "fed9cdaa",
    "confidence": 0.79
  },
  {
    "source": "c72f6835",
    "target": "610ed501",
    "confidence": 0.78
  },
  {
    "source": "c72f6835",
    "target": "b2917c87",
    "confidence": 0.88
  },
  {
    "source": "bdfed3c3",
    "target": "56442841",
    "confidence": 0.63
  },
  {
    "source": "bdfed3c3",
    "target": "b362a86a",
    "confidence": 0.56
  },
  {
    "source": "bdfed3c3",
    "target": "3ea0627f",
    "confidence": 0.63
  },
  {
    "source": "e88a3319",
    "target": "c847d0cc",
    "confidence": 0.65
  },
  {
    "source": "e88a3319",
    "target": "ca2048d1",
    "confidence": 0.62
  },
  {
    "source": "e88a3319",
    "target": "05c11d7e",
    "confidence": 0.84
  },
  {
    "source": "ad332145",
    "target": "92f6487f",
    "confidence": 0.73
  },
  {
    "source": "ad332145",
    "target": "fbc4faaf",
    "confidence": 0.73
  },
  {
    "source": "ab158b59",
    "target": "98d2ca01",
    "confidence": 0.7
  },
  {
    "source": "ab158b59",
    "target": "82c3869c",
    "confidence": 0.71
  },
  {
    "source": "ab158b59",
    "target": "7177105c",
    "confidence": 0.59
  },
  {
    "source": "1bfadfc7",
    "target": "8e671004",
    "confidence": 0.65
  },
  {
    "source": "1bfadfc7",
    "target": "4358224a",
    "confidence": 0.67
  },
  {
    "source": "1bfadfc7",
    "target": "33031019",
    "confidence": 0.74
  },
  {
    "source": "1bfadfc7",
    "target": "56a1067e",
    "confidence": 0.73
  },
  {
    "source": "56442841",
    "target": "b362a86a",
    "confidence": 0.74
  },
  {
    "source": "56442841",
    "target": "bdfed3c3",
    "confidence": 0.63
  },
  {
    "source": "56442841",
    "target": "9b4b83a7",
    "confidence": 0.63
  },
  {
    "source": "56dda441",
    "target": "92f6487f",
    "confidence": 0.74
  },
  {
    "source": "56dda441",
    "target": "82c3869c",
    "confidence": 0.71
  },
  {
    "source": "56dda441",
    "target": "2686da58",
    "confidence": 0.81
  },
  {
    "source": "502c7f61",
    "target": "f33a7b4b",
    "confidence": 0.78
  },
  {
    "source": "502c7f61",
    "target": "d1b47db7",
    "confidence": 0.75
  },
  {
    "source": "92f6487f",
    "target": "ad332145",
    "confidence": 0.73
  },
  {
    "source": "92f6487f",
    "target": "56dda441",
    "confidence": 0.74
  },
  {
    "source": "a6e16eab",
    "target": "a60ce701",
    "confidence": 0.66
  },
  {
    "source": "a6e16eab",
    "target": "ca2048d1",
    "confidence": 0.71
  },
  {
    "source": "a6e16eab",
    "target": "1914dd63",
    "confidence": 0.63
  },
  {
    "source": "3283659e",
    "target": "c847d0cc",
    "confidence": 0.69
  },
  {
    "source": "3283659e",
    "target": "4358224a",
    "confidence": 0.71
  },
  {
    "source": "3283659e",
    "target": "ad9c19aa",
    "confidence": 0.69
  },
  {
    "source": "3283659e",
    "target": "33031019",
    "confidence": 0.78
  },
  {
    "source": "98d2ca01",
    "target": "453662c7",
    "confidence": 0.7
  },
  {
    "source": "98d2ca01",
    "target": "82c3869c",
    "confidence": 0.89
  },
  {
    "source": "98d2ca01",
    "target": "ab158b59",
    "confidence": 0.7
  },
  {
    "source": "98d2ca01",
    "target": "7177105c",
    "confidence": 0.67
  },
  {
    "source": "b362a86a",
    "target": "56442841",
    "confidence": 0.74
  },
  {
    "source": "4358224a",
    "target": "33031019",
    "confidence": 0.81
  },
  {
    "source": "4358224a",
    "target": "3283659e",
    "confidence": 0.71
  },
  {
    "source": "8ac0d11c",
    "target": "e0706c1f",
    "confidence": 0.75
  },
  {
    "source": "8ac0d11c",
    "target": "8072c9ca",
    "confidence": 0.69
  },
  {
    "source": "8ac0d11c",
    "target": "a996cfda",
    "confidence": 0.69
  },
  {
    "source": "8ac0d11c",
    "target": "b8adbe4f",
    "confidence": 0.7
  },
  {
    "source": "879a27ab",
    "target": "7684c0d6",
    "confidence": 0.64
  },
  {
    "source": "1628cb00",
    "target": "7c50570c",
    "confidence": 0.62
  },
  {
    "source": "1628cb00",
    "target": "c653f3db",
    "confidence": 0.5
  },
  {
    "source": "66fc9c5b",
    "target": "21e7a058",
    "confidence": 0.79
  },
  {
    "source": "1516d201",
    "target": "2d2fa764",
    "confidence": 0.76
  },
  {
    "source": "1516d201",
    "target": "9dc974de",
    "confidence": 0.82
  },
  {
    "source": "18dd7983",
    "target": "331fa22e",
    "confidence": 0.61
  },
  {
    "source": "18dd7983",
    "target": "f37290ab",
    "confidence": 0.58
  },
  {
    "source": "18dd7983",
    "target": "421e680f",
    "confidence": 0.61
  },
  {
    "source": "18dd7983",
    "target": "590b4841",
    "confidence": 0.63
  },
  {
    "source": "7f5d92ad",
    "target": "bcd2bf34",
    "confidence": 0.7
  },
  {
    "source": "7f5d92ad",
    "target": "63ef8999",
    "confidence": 0.63
  },
  {
    "source": "7f5d92ad",
    "target": "d6b61b7d",
    "confidence": 0.69
  },
  {
    "source": "7f5d92ad",
    "target": "2d240e95",
    "confidence": 0.76
  },
  {
    "source": "2107c251",
    "target": "e3d2b0bf",
    "confidence": 0.61
  },
  {
    "source": "d6b61b7d",
    "target": "7f5d92ad",
    "confidence": 0.69
  },
  {
    "source": "d6b61b7d",
    "target": "63ef8999",
    "confidence": 0.83
  },
  {
    "source": "d6b61b7d",
    "target": "2d240e95",
    "confidence": 0.73
  },
  {
    "source": "d6b61b7d",
    "target": "1efcb5e1",
    "confidence": 0.64
  },
  {
    "source": "63ef8999",
    "target": "d6b61b7d",
    "confidence": 0.83
  },
  {
    "source": "63ef8999",
    "target": "2d240e95",
    "confidence": 0.64
  },
  {
    "source": "fcd2fdfb",
    "target": "e458e31c",
    "confidence": 0.7
  },
  {
    "source": "fcd2fdfb",
    "target": "c6136ab6",
    "confidence": 0.67
  },
  {
    "source": "fcd2fdfb",
    "target": "9e51c024",
    "confidence": 0.68
  },
  {
    "source": "700c90d2",
    "target": "c6a1d9fc",
    "confidence": 0.68
  },
  {
    "source": "700c90d2",
    "target": "c624be6b",
    "confidence": 0.69
  },
  {
    "source": "5a8c385b",
    "target": "2a449e12",
    "confidence": 0.78
  },
  {
    "source": "5a8c385b",
    "target": "cfbdae52",
    "confidence": 0.76
  },
  {
    "source": "5a8c385b",
    "target": "17ff9ab4",
    "confidence": 0.78
  },
  {
    "source": "5a8c385b",
    "target": "b6243e8d",
    "confidence": 0.82
  },
  {
    "source": "5a8c385b",
    "target": "44697716",
    "confidence": 0.83
  },
  {
    "source": "cfbdae52",
    "target": "b6243e8d",
    "confidence": 0.76
  },
  {
    "source": "cfbdae52",
    "target": "5a8c385b",
    "confidence": 0.76
  },
  {
    "source": "dc9058e2",
    "target": "17ff9ab4",
    "confidence": 0.77
  },
  {
    "source": "dc9058e2",
    "target": "b6243e8d",
    "confidence": 0.71
  },
  {
    "source": "dc9058e2",
    "target": "44697716",
    "confidence": 0.71
  },
  {
    "source": "df9e6431",
    "target": "2e822ae1",
    "confidence": 0.68
  },
  {
    "source": "df9e6431",
    "target": "8bf049b5",
    "confidence": 0.62
  },
  {
    "source": "df9e6431",
    "target": "8a96906c",
    "confidence": 0.73
  },
  {
    "source": "74d1d47b",
    "target": "81aa80b0",
    "confidence": 0.74
  },
  {
    "source": "74d1d47b",
    "target": "36e2ef47",
    "confidence": 0.72
  },
  {
    "source": "b6243e8d",
    "target": "f596130d",
    "confidence": 0.77
  },
  {
    "source": "b6243e8d",
    "target": "44697716",
    "confidence": 0.81
  },
  {
    "source": "b6243e8d",
    "target": "dc9058e2",
    "confidence": 0.71
  },
  {
    "source": "b6243e8d",
    "target": "cfbdae52",
    "confidence": 0.76
  },
  {
    "source": "b6243e8d",
    "target": "5a8c385b",
    "confidence": 0.82
  },
  {
    "source": "ef877814",
    "target": "d2c2e76c",
    "confidence": 0.64
  },
  {
    "source": "ef877814",
    "target": "3dd29ab5",
    "confidence": 0.64
  },
  {
    "source": "a6c6b8c4",
    "target": "97895716",
    "confidence": 0.86
  },
  {
    "source": "a6c6b8c4",
    "target": "e762c6c7",
    "confidence": 0.86
  },
  {
    "source": "2d240e95",
    "target": "21e7a058",
    "confidence": 0.74
  },
  {
    "source": "2d240e95",
    "target": "7f5d92ad",
    "confidence": 0.76
  },
  {
    "source": "2d240e95",
    "target": "d6b61b7d",
    "confidence": 0.73
  },
  {
    "source": "2d240e95",
    "target": "63ef8999",
    "confidence": 0.64
  },
  {
    "source": "17ff9ab4",
    "target": "44697716",
    "confidence": 0.77
  },
  {
    "source": "17ff9ab4",
    "target": "5a8c385b",
    "confidence": 0.78
  },
  {
    "source": "17ff9ab4",
    "target": "dc9058e2",
    "confidence": 0.77
  },
  {
    "source": "ad1d40fa",
    "target": "5fecd4ce",
    "confidence": 0.84
  },
  {
    "source": "ad1d40fa",
    "target": "e762c6c7",
    "confidence": 0.81
  },
  {
    "source": "ad1d40fa",
    "target": "7f54d9f5",
    "confidence": 0.75
  },
  {
    "source": "5fecd4ce",
    "target": "dcb1db02",
    "confidence": 0.75
  },
  {
    "source": "5fecd4ce",
    "target": "ad1d40fa",
    "confidence": 0.84
  },
  {
    "source": "5fecd4ce",
    "target": "e762c6c7",
    "confidence": 0.77
  },
  {
    "source": "97895716",
    "target": "1555f94b",
    "confidence": 0.73
  },
  {
    "source": "97895716",
    "target": "e762c6c7",
    "confidence": 0.76
  },
  {
    "source": "97895716",
    "target": "a6c6b8c4",
    "confidence": 0.86
  },
  {
    "source": "24c922b0",
    "target": "ca369d81",
    "confidence": 0.65
  },
  {
    "source": "24c922b0",
    "target": "70a91a40",
    "confidence": 0.64
  },
  {
    "source": "24c922b0",
    "target": "a357dfa8",
    "confidence": 0.69
  },
  {
    "source": "24c922b0",
    "target": "2d2fa764",
    "confidence": 0.67
  },
  {
    "source": "1555f94b",
    "target": "e762c6c7",
    "confidence": 0.82
  },
  {
    "source": "1555f94b",
    "target": "7f54d9f5",
    "confidence": 0.77
  },
  {
    "source": "ce8f07f6",
    "target": "3277f8da",
    "confidence": 0.57
  },
  {
    "source": "ce8f07f6",
    "target": "1555f94b",
    "confidence": 0.58
  },
  {
    "source": "ce8f07f6",
    "target": "f82a68b0",
    "confidence": 0.6
  },
  {
    "source": "ce8f07f6",
    "target": "484024e3",
    "confidence": 0.58
  },
  {
    "source": "ce8f07f6",
    "target": "e762c6c7",
    "confidence": 0.6
  },
  {
    "source": "9bb38101",
    "target": "d782b600",
    "confidence": 0.7
  },
  {
    "source": "9bb38101",
    "target": "41118414",
    "confidence": 0.72
  },
  {
    "source": "7cecad26",
    "target": "891d788a",
    "confidence": 0.79
  },
  {
    "source": "7cecad26",
    "target": "8cbf6c51",
    "confidence": 0.77
  },
  {
    "source": "bef6c19b",
    "target": "73a7b195",
    "confidence": 0.72
  },
  {
    "source": "bef6c19b",
    "target": "384333a0",
    "confidence": 0.64
  },
  {
    "source": "bef6c19b",
    "target": "9dc974de",
    "confidence": 0.59
  },
  {
    "source": "b7a21a0d",
    "target": "1f08d7ae",
    "confidence": 0.77
  },
  {
    "source": "b7a21a0d",
    "target": "202e91a5",
    "confidence": 0.78
  },
  {
    "source": "b7a21a0d",
    "target": "22d6f057",
    "confidence": 0.63
  },
  {
    "source": "b7a21a0d",
    "target": "c580c6fd",
    "confidence": 0.7
  },
  {
    "source": "82c20686",
    "target": "8b5f33bc",
    "confidence": 0.81
  },
  {
    "source": "82c20686",
    "target": "7a82b2e3",
    "confidence": 0.93
  },
  {
    "source": "82c20686",
    "target": "07a26cdf",
    "confidence": 0.81
  },
  {
    "source": "1f08d7ae",
    "target": "202e91a5",
    "confidence": 0.71
  },
  {
    "source": "1f08d7ae",
    "target": "027a65ce",
    "confidence": 0.81
  },
  {
    "source": "1f08d7ae",
    "target": "25f908c0",
    "confidence": 0.67
  },
  {
    "source": "1f08d7ae",
    "target": "d2ad2d04",
    "confidence": 0.81
  },
  {
    "source": "1f08d7ae",
    "target": "b7a21a0d",
    "confidence": 0.74
  },
  {
    "source": "899b7fc5",
    "target": "46341b52",
    "confidence": 0.78
  },
  {
    "source": "899b7fc5",
    "target": "6b737d82",
    "confidence": 0.85
  },
  {
    "source": "899b7fc5",
    "target": "8bd9418d",
    "confidence": 0.76
  },
  {
    "source": "899b7fc5",
    "target": "38c575dc",
    "confidence": 0.84
  },
  {
    "source": "7a82b2e3",
    "target": "8b5f33bc",
    "confidence": 0.78
  },
  {
    "source": "7a82b2e3",
    "target": "812ec23e",
    "confidence": 0.69
  },
  {
    "source": "7a82b2e3",
    "target": "07a26cdf",
    "confidence": 0.79
  },
  {
    "source": "7a82b2e3",
    "target": "82c20686",
    "confidence": 0.91
  },
  {
    "source": "07a26cdf",
    "target": "8b5f33bc",
    "confidence": 0.75
  },
  {
    "source": "07a26cdf",
    "target": "7a82b2e3",
    "confidence": 0.81
  },
  {
    "source": "07a26cdf",
    "target": "82c20686",
    "confidence": 0.81
  },
  {
    "source": "d782b600",
    "target": "7a82b2e3",
    "confidence": 0.69
  },
  {
    "source": "d782b600",
    "target": "9bb38101",
    "confidence": 0.7
  },
  {
    "source": "41118414",
    "target": "8b5f33bc",
    "confidence": 0.72
  },
  {
    "source": "41118414",
    "target": "9bb38101",
    "confidence": 0.72
  },
  {
    "source": "41118414",
    "target": "c580c6fd",
    "confidence": 0.8
  },
  {
    "source": "c6993b06",
    "target": "df6e49d5",
    "confidence": 0.98
  },
  {
    "source": "c6993b06",
    "target": "d3275657",
    "confidence": 0.92
  },
  {
    "source": "202e91a5",
    "target": "74be3d9a",
    "confidence": 0.63
  },
  {
    "source": "202e91a5",
    "target": "b7a21a0d",
    "confidence": 0.79
  },
  {
    "source": "202e91a5",
    "target": "97d66247",
    "confidence": 0.63
  },
  {
    "source": "202e91a5",
    "target": "22d6f057",
    "confidence": 0.63
  },
  {
    "source": "202e91a5",
    "target": "1f08d7ae",
    "confidence": 0.75
  },
  {
    "source": "202e91a5",
    "target": "120de3cc",
    "confidence": 0.64
  },
  {
    "source": "202e91a5",
    "target": "bcb2d2ed",
    "confidence": 0.71
  },
  {
    "source": "67d45e81",
    "target": "6b737d82",
    "confidence": 0.83
  },
  {
    "source": "67d45e81",
    "target": "35235662",
    "confidence": 0.8
  },
  {
    "source": "027a65ce",
    "target": "d2ad2d04",
    "confidence": 0.8
  },
  {
    "source": "027a65ce",
    "target": "c580c6fd",
    "confidence": 0.66
  },
  {
    "source": "027a65ce",
    "target": "1f08d7ae",
    "confidence": 0.81
  },
  {
    "source": "22d6f057",
    "target": "9a8d4ed3",
    "confidence": 0.68
  },
  {
    "source": "22d6f057",
    "target": "9bb38101",
    "confidence": 0.6
  },
  {
    "source": "22d6f057",
    "target": "5c648979",
    "confidence": 0.59
  },
  {
    "source": "7e06c948",
    "target": "6657fbbd",
    "confidence": 0.69
  },
  {
    "source": "7e06c948",
    "target": "590b4841",
    "confidence": 0.7
  },
  {
    "source": "7e06c948",
    "target": "331fa22e",
    "confidence": 0.72
  },
  {
    "source": "c580c6fd",
    "target": "d2ad2d04",
    "confidence": 0.75
  },
  {
    "source": "c580c6fd",
    "target": "41118414",
    "confidence": 0.8
  },
  {
    "source": "d2ad2d04",
    "target": "027a65ce",
    "confidence": 0.79
  },
  {
    "source": "d2ad2d04",
    "target": "1f08d7ae",
    "confidence": 0.78
  },
  {
    "source": "9a8d4ed3",
    "target": "22d6f057",
    "confidence": 0.67
  },
  {
    "source": "9a8d4ed3",
    "target": "c580c6fd",
    "confidence": 0.62
  },
  {
    "source": "9a8d4ed3",
    "target": "dd904cd7",
    "confidence": 0.64
  },
  {
    "source": "e458e31c",
    "target": "fcd2fdfb",
    "confidence": 0.7
  },
  {
    "source": "e458e31c",
    "target": "18d48d6a",
    "confidence": 0.87
  },
  {
    "source": "e458e31c",
    "target": "b2b2c029",
    "confidence": 0.73
  },
  {
    "source": "e458e31c",
    "target": "aae279fa",
    "confidence": 0.78
  },
  {
    "source": "5deb01c2",
    "target": "2d2fa764",
    "confidence": 0.7
  },
  {
    "source": "5deb01c2",
    "target": "1a248c3f",
    "confidence": 0.68
  },
  {
    "source": "5deb01c2",
    "target": "384333a0",
    "confidence": 0.7
  },
  {
    "source": "d4ab43e0",
    "target": "0b541098",
    "confidence": 0.71
  },
  {
    "source": "d4ab43e0",
    "target": "f82f91ca",
    "confidence": 0.73
  },
  {
    "source": "eebb5ed8",
    "target": "0267e3a9",
    "confidence": 0.68
  },
  {
    "source": "eebb5ed8",
    "target": "431f97f2",
    "confidence": 0.71
  },
  {
    "source": "eebb5ed8",
    "target": "9e51c024",
    "confidence": 0.68
  },
  {
    "source": "1bae87b9",
    "target": "20b66d65",
    "confidence": 0.87
  },
  {
    "source": "1bae87b9",
    "target": "4d44ba53",
    "confidence": 0.84
  },
  {
    "source": "1bae87b9",
    "target": "63f586be",
    "confidence": 0.7
  },
  {
    "source": "1bae87b9",
    "target": "a794ada0",
    "confidence": 0.74
  },
  {
    "source": "70a91a40",
    "target": "24c922b0",
    "confidence": 0.64
  },
  {
    "source": "70a91a40",
    "target": "a18b6665",
    "confidence": 0.67
  },
  {
    "source": "25f908c0",
    "target": "acdb356e",
    "confidence": 0.79
  },
  {
    "source": "25f908c0",
    "target": "1f08d7ae",
    "confidence": 0.67
  },
  {
    "source": "a1ea0b9c",
    "target": "2e822ae1",
    "confidence": 0.69
  },
  {
    "source": "a1ea0b9c",
    "target": "771a950b",
    "confidence": 0.74
  },
  {
    "source": "a1ea0b9c",
    "target": "bf0c2bd5",
    "confidence": 0.54
  },
  {
    "source": "49b2393f",
    "target": "6b296ce4",
    "confidence": 0.67
  },
  {
    "source": "49b2393f",
    "target": "ddd14ae3",
    "confidence": 0.71
  },
  {
    "source": "49b2393f",
    "target": "ce06614e",
    "confidence": 0.71
  },
  {
    "source": "331fa22e",
    "target": "8a96906c",
    "confidence": 0.75
  },
  {
    "source": "331fa22e",
    "target": "384333a0",
    "confidence": 0.73
  },
  {
    "source": "331fa22e",
    "target": "7e06c948",
    "confidence": 0.72
  },
  {
    "source": "331fa22e",
    "target": "a82bc0f4",
    "confidence": 0.79
  },
  {
    "source": "331fa22e",
    "target": "590b4841",
    "confidence": 0.8
  },
  {
    "source": "f8667a98",
    "target": "48afc7c9",
    "confidence": 0.79
  },
  {
    "source": "f8667a98",
    "target": "f82a68b0",
    "confidence": 0.65
  },
  {
    "source": "9cf14f1e",
    "target": "df2c54a4",
    "confidence": 0.75
  },
  {
    "source": "9cf14f1e",
    "target": "088fbd95",
    "confidence": 0.59
  },
  {
    "source": "9cf14f1e",
    "target": "3eae51cb",
    "confidence": 0.65
  },
  {
    "source": "9cf14f1e",
    "target": "1b7dc192",
    "confidence": 0.67
  },
  {
    "source": "9cf14f1e",
    "target": "aa8bc157",
    "confidence": 0.71
  },
  {
    "source": "7ac15094",
    "target": "a794ada0",
    "confidence": 0.84
  },
  {
    "source": "2b8277fb",
    "target": "1d0aadfb",
    "confidence": 0.65
  },
  {
    "source": "2b8277fb",
    "target": "b164a37d",
    "confidence": 0.64
  },
  {
    "source": "2b8277fb",
    "target": "5f0b9fec",
    "confidence": 0.64
  },
  {
    "source": "aa8bc157",
    "target": "df2c54a4",
    "confidence": 0.78
  },
  {
    "source": "aa8bc157",
    "target": "1b7dc192",
    "confidence": 0.69
  },
  {
    "source": "aa8bc157",
    "target": "5a4829ca",
    "confidence": 0.67
  },
  {
    "source": "aa8bc157",
    "target": "9cf14f1e",
    "confidence": 0.71
  },
  {
    "source": "1d0aadfb",
    "target": "00ead12b",
    "confidence": 0.75
  },
  {
    "source": "1d0aadfb",
    "target": "a2436776",
    "confidence": 0.71
  },
  {
    "source": "1d0aadfb",
    "target": "c9fc6032",
    "confidence": 0.86
  },
  {
    "source": "1d0aadfb",
    "target": "2b8277fb",
    "confidence": 0.65
  },
  {
    "source": "1d0aadfb",
    "target": "5f0b9fec",
    "confidence": 0.9
  },
  {
    "source": "1d0aadfb",
    "target": "b00d370c",
    "confidence": 0.71
  },
  {
    "source": "4fadc33f",
    "target": "1ab6738e",
    "confidence": 0.62
  },
  {
    "source": "4fadc33f",
    "target": "b164a37d",
    "confidence": 0.65
  },
  {
    "source": "4fadc33f",
    "target": "a2436776",
    "confidence": 0.7
  },
  {
    "source": "4fadc33f",
    "target": "c9fc6032",
    "confidence": 0.68
  },
  {
    "source": "4fadc33f",
    "target": "e337f334",
    "confidence": 0.65
  },
  {
    "source": "fed9cdaa",
    "target": "f643ecac",
    "confidence": 0.92
  },
  {
    "source": "fed9cdaa",
    "target": "bd305a53",
    "confidence": 0.9
  },
  {
    "source": "fed9cdaa",
    "target": "610ed501",
    "confidence": 0.92
  },
  {
    "source": "fed9cdaa",
    "target": "c72f6835",
    "confidence": 0.79
  },
  {
    "source": "21e7a058",
    "target": "2d240e95",
    "confidence": 0.74
  },
  {
    "source": "21e7a058",
    "target": "66fc9c5b",
    "confidence": 0.79
  },
  {
    "source": "df2c54a4",
    "target": "5a4829ca",
    "confidence": 0.72
  },
  {
    "source": "df2c54a4",
    "target": "3eae51cb",
    "confidence": 0.69
  },
  {
    "source": "df2c54a4",
    "target": "1b7dc192",
    "confidence": 0.74
  },
  {
    "source": "df2c54a4",
    "target": "9cf14f1e",
    "confidence": 0.75
  },
  {
    "source": "df2c54a4",
    "target": "aa8bc157",
    "confidence": 0.78
  },
  {
    "source": "b00d370c",
    "target": "777a289e",
    "confidence": 0.66
  },
  {
    "source": "b00d370c",
    "target": "5f0b9fec",
    "confidence": 0.8
  },
  {
    "source": "b00d370c",
    "target": "1d0aadfb",
    "confidence": 0.71
  },
  {
    "source": "8fbc9de8",
    "target": "7e5a3994",
    "confidence": 0.56
  },
  {
    "source": "8fbc9de8",
    "target": "6335c531",
    "confidence": 0.56
  },
  {
    "source": "f643ecac",
    "target": "bd305a53",
    "confidence": 0.9
  },
  {
    "source": "f643ecac",
    "target": "610ed501",
    "confidence": 0.91
  },
  {
    "source": "f643ecac",
    "target": "fed9cdaa",
    "confidence": 0.92
  },
  {
    "source": "610ed501",
    "target": "fed9cdaa",
    "confidence": 0.92
  },
  {
    "source": "610ed501",
    "target": "f643ecac",
    "confidence": 0.91
  },
  {
    "source": "610ed501",
    "target": "b2917c87",
    "confidence": 0.84
  },
  {
    "source": "610ed501",
    "target": "bd305a53",
    "confidence": 0.89
  },
  {
    "source": "bd305a53",
    "target": "f643ecac",
    "confidence": 0.9
  },
  {
    "source": "bd305a53",
    "target": "fed9cdaa",
    "confidence": 0.9
  },
  {
    "source": "5f0b9fec",
    "target": "c9fc6032",
    "confidence": 0.82
  },
  {
    "source": "5f0b9fec",
    "target": "b00d370c",
    "confidence": 0.8
  },
  {
    "source": "5f0b9fec",
    "target": "1d0aadfb",
    "confidence": 0.9
  },
  {
    "source": "0b541098",
    "target": "f82f91ca",
    "confidence": 0.74
  },
  {
    "source": "0b541098",
    "target": "36e2ef47",
    "confidence": 0.74
  },
  {
    "source": "0b541098",
    "target": "6a72e662",
    "confidence": 0.66
  },
  {
    "source": "0b541098",
    "target": "d9c97e1f",
    "confidence": 0.79
  },
  {
    "source": "0b541098",
    "target": "74d1d47b",
    "confidence": 0.72
  },
  {
    "source": "c9fc6032",
    "target": "bd265307",
    "confidence": 0.75
  },
  {
    "source": "c9fc6032",
    "target": "a2436776",
    "confidence": 0.79
  },
  {
    "source": "c9fc6032",
    "target": "da1f2440",
    "confidence": 0.72
  },
  {
    "source": "c9fc6032",
    "target": "1d0aadfb",
    "confidence": 0.86
  },
  {
    "source": "c9fc6032",
    "target": "4fadc33f",
    "confidence": 0.68
  },
  {
    "source": "c9fc6032",
    "target": "5f0b9fec",
    "confidence": 0.82
  },
  {
    "source": "777a289e",
    "target": "b00d370c",
    "confidence": 0.66
  },
  {
    "source": "777a289e",
    "target": "11b77b6c",
    "confidence": 0.62
  },
  {
    "source": "777a289e",
    "target": "da1f2440",
    "confidence": 0.65
  },
  {
    "source": "777a289e",
    "target": "c9fc6032",
    "confidence": 0.65
  },
  {
    "source": "e337f334",
    "target": "1ab6738e",
    "confidence": 0.83
  },
  {
    "source": "e337f334",
    "target": "c9fc6032",
    "confidence": 0.65
  },
  {
    "source": "e337f334",
    "target": "4fadc33f",
    "confidence": 0.65
  },
  {
    "source": "1ab6738e",
    "target": "e337f334",
    "confidence": 0.83
  },
  {
    "source": "1ab6738e",
    "target": "c9fc6032",
    "confidence": 0.62
  },
  {
    "source": "1ab6738e",
    "target": "4fadc33f",
    "confidence": 0.62
  },
  {
    "source": "b164a37d",
    "target": "2b8277fb",
    "confidence": 0.64
  },
  {
    "source": "b164a37d",
    "target": "5a4829ca",
    "confidence": 0.64
  },
  {
    "source": "b164a37d",
    "target": "4fadc33f",
    "confidence": 0.65
  },
  {
    "source": "da1f2440",
    "target": "777a289e",
    "confidence": 0.65
  },
  {
    "source": "da1f2440",
    "target": "a2436776",
    "confidence": 0.71
  },
  {
    "source": "da1f2440",
    "target": "1b7dc192",
    "confidence": 0.65
  },
  {
    "source": "da1f2440",
    "target": "c9fc6032",
    "confidence": 0.72
  },
  {
    "source": "5a4829ca",
    "target": "3eae51cb",
    "confidence": 0.7
  },
  {
    "source": "5a4829ca",
    "target": "b164a37d",
    "confidence": 0.64
  },
  {
    "source": "5a4829ca",
    "target": "df2c54a4",
    "confidence": 0.72
  },
  {
    "source": "1b7dc192",
    "target": "df2c54a4",
    "confidence": 0.74
  },
  {
    "source": "1b7dc192",
    "target": "aa8bc157",
    "confidence": 0.69
  },
  {
    "source": "3eae51cb",
    "target": "5a4829ca",
    "confidence": 0.7
  },
  {
    "source": "3eae51cb",
    "target": "df2c54a4",
    "confidence": 0.69
  },
  {
    "source": "a2436776",
    "target": "ca369d81",
    "confidence": 0.63
  },
  {
    "source": "a2436776",
    "target": "da1f2440",
    "confidence": 0.71
  },
  {
    "source": "a2436776",
    "target": "c9fc6032",
    "confidence": 0.79
  },
  {
    "source": "a2436776",
    "target": "4fadc33f",
    "confidence": 0.7
  },
  {
    "source": "a82bc0f4",
    "target": "8a96906c",
    "confidence": 0.85
  },
  {
    "source": "a82bc0f4",
    "target": "331fa22e",
    "confidence": 0.79
  },
  {
    "source": "5e7c42f4",
    "target": "c624be6b",
    "confidence": 0.75
  },
  {
    "source": "5e7c42f4",
    "target": "b3f0b660",
    "confidence": 0.76
  },
  {
    "source": "5e7c42f4",
    "target": "c6a1d9fc",
    "confidence": 0.74
  },
  {
    "source": "5e7c42f4",
    "target": "3277f8da",
    "confidence": 0.68
  },
  {
    "source": "5e7c42f4",
    "target": "50b3cede",
    "confidence": 0.59
  },
  {
    "source": "654b94b2",
    "target": "d3006053",
    "confidence": 0.77
  },
  {
    "source": "654b94b2",
    "target": "77256190",
    "confidence": 0.69
  },
  {
    "source": "d3006053",
    "target": "77256190",
    "confidence": 0.8
  },
  {
    "source": "d3006053",
    "target": "02ca73fa",
    "confidence": 0.6
  },
  {
    "source": "d3006053",
    "target": "0b541098",
    "confidence": 0.65
  },
  {
    "source": "d3006053",
    "target": "654b94b2",
    "confidence": 0.77
  },
  {
    "source": "0ec8d1a5",
    "target": "4eb12843",
    "confidence": 0.91
  },
  {
    "source": "0ec8d1a5",
    "target": "31c706f6",
    "confidence": 0.89
  },
  {
    "source": "0ec8d1a5",
    "target": "d6f1ac13",
    "confidence": 0.9
  },
  {
    "source": "0ec8d1a5",
    "target": "c79c24fb",
    "confidence": 0.9
  },
  {
    "source": "0ec8d1a5",
    "target": "bde505d7",
    "confidence": 0.93
  },
  {
    "source": "0ec8d1a5",
    "target": "c27c48eb",
    "confidence": 0.91
  },
  {
    "source": "0ec8d1a5",
    "target": "c340b1b1",
    "confidence": 0.91
  },
  {
    "source": "0ec8d1a5",
    "target": "1395e24f",
    "confidence": 0.92
  },
  {
    "source": "77256190",
    "target": "d3006053",
    "confidence": 0.8
  },
  {
    "source": "77256190",
    "target": "0b541098",
    "confidence": 0.67
  },
  {
    "source": "77256190",
    "target": "654b94b2",
    "confidence": 0.69
  },
  {
    "source": "00cf0443",
    "target": "f37290ab",
    "confidence": 0.68
  },
  {
    "source": "7fe016a3",
    "target": "93e9f8f9",
    "confidence": 0.57
  },
  {
    "source": "f37290ab",
    "target": "00cf0443",
    "confidence": 0.68
  },
  {
    "source": "f37290ab",
    "target": "42a0f495",
    "confidence": 0.59
  },
  {
    "source": "6657fbbd",
    "target": "17ff9ab4",
    "confidence": 0.6
  },
  {
    "source": "6657fbbd",
    "target": "7e06c948",
    "confidence": 0.69
  },
  {
    "source": "6657fbbd",
    "target": "533a197a",
    "confidence": 0.59
  },
  {
    "source": "aae279fa",
    "target": "484024e3",
    "confidence": 0.76
  },
  {
    "source": "aae279fa",
    "target": "1f6c8a5e",
    "confidence": 0.75
  },
  {
    "source": "aae279fa",
    "target": "18d48d6a",
    "confidence": 0.83
  },
  {
    "source": "18d48d6a",
    "target": "484024e3",
    "confidence": 0.76
  },
  {
    "source": "18d48d6a",
    "target": "e458e31c",
    "confidence": 0.87
  },
  {
    "source": "18d48d6a",
    "target": "aae279fa",
    "confidence": 0.83
  },
  {
    "source": "ff72ab46",
    "target": "15b28022",
    "confidence": 0.63
  },
  {
    "source": "ff72ab46",
    "target": "bd265307",
    "confidence": 0.69
  },
  {
    "source": "ff72ab46",
    "target": "c28fb945",
    "confidence": 0.61
  },
  {
    "source": "ff72ab46",
    "target": "00ead12b",
    "confidence": 0.69
  },
  {
    "source": "c28fb945",
    "target": "2dfa4958",
    "confidence": 0.58
  },
  {
    "source": "c28fb945",
    "target": "3b9717bc",
    "confidence": 0.66
  },
  {
    "source": "c28fb945",
    "target": "ff72ab46",
    "confidence": 0.61
  },
  {
    "source": "484024e3",
    "target": "18d48d6a",
    "confidence": 0.76
  },
  {
    "source": "484024e3",
    "target": "aae279fa",
    "confidence": 0.76
  },
  {
    "source": "00ead12b",
    "target": "ff72ab46",
    "confidence": 0.69
  },
  {
    "source": "00ead12b",
    "target": "15b28022",
    "confidence": 0.75
  },
  {
    "source": "00ead12b",
    "target": "dcb1db02",
    "confidence": 0.69
  },
  {
    "source": "00ead12b",
    "target": "bd265307",
    "confidence": 0.89
  },
  {
    "source": "00ead12b",
    "target": "1d0aadfb",
    "confidence": 0.75
  },
  {
    "source": "bd265307",
    "target": "15b28022",
    "confidence": 0.76
  },
  {
    "source": "bd265307",
    "target": "00ead12b",
    "confidence": 0.89
  },
  {
    "source": "bd265307",
    "target": "ff72ab46",
    "confidence": 0.69
  },
  {
    "source": "ed1206b2",
    "target": "f367ee22",
    "confidence": 0.89
  },
  {
    "source": "ed1206b2",
    "target": "88bfcef6",
    "confidence": 0.94
  },
  {
    "source": "ed1206b2",
    "target": "c340b1b1",
    "confidence": 0.86
  },
  {
    "source": "5d467ffd",
    "target": "3728477e",
    "confidence": 0.93
  },
  {
    "source": "5d467ffd",
    "target": "e7719d07",
    "confidence": 0.89
  },
  {
    "source": "b2b2c029",
    "target": "6e357310",
    "confidence": 0.69
  },
  {
    "source": "b2b2c029",
    "target": "3b9717bc",
    "confidence": 0.72
  },
  {
    "source": "b2b2c029",
    "target": "1f6c8a5e",
    "confidence": 0.73
  },
  {
    "source": "b2b2c029",
    "target": "e458e31c",
    "confidence": 0.73
  },
  {
    "source": "15b28022",
    "target": "dcb1db02",
    "confidence": 0.82
  },
  {
    "source": "15b28022",
    "target": "bb2895ae",
    "confidence": 0.64
  },
  {
    "source": "15b28022",
    "target": "bd265307",
    "confidence": 0.76
  },
  {
    "source": "15b28022",
    "target": "3b9717bc",
    "confidence": 0.7
  },
  {
    "source": "dcb1db02",
    "target": "15b28022",
    "confidence": 0.82
  },
  {
    "source": "dcb1db02",
    "target": "5fecd4ce",
    "confidence": 0.75
  },
  {
    "source": "3b9717bc",
    "target": "c28fb945",
    "confidence": 0.68
  },
  {
    "source": "3b9717bc",
    "target": "b2b2c029",
    "confidence": 0.72
  },
  {
    "source": "3b9717bc",
    "target": "15b28022",
    "confidence": 0.7
  },
  {
    "source": "1f6c8a5e",
    "target": "39a6689b",
    "confidence": 0.65
  },
  {
    "source": "1f6c8a5e",
    "target": "aae279fa",
    "confidence": 0.75
  },
  {
    "source": "1f6c8a5e",
    "target": "b2b2c029",
    "confidence": 0.73
  },
  {
    "source": "1f6c8a5e",
    "target": "0982491b",
    "confidence": 0.68
  },
  {
    "source": "1f6c8a5e",
    "target": "60cb3d6a",
    "confidence": 0.7
  },
  {
    "source": "6e357310",
    "target": "9d53774d",
    "confidence": 0.73
  },
  {
    "source": "6e357310",
    "target": "84aa4ab6",
    "confidence": 0.78
  },
  {
    "source": "6e357310",
    "target": "3795df99",
    "confidence": 0.65
  },
  {
    "source": "20b66d65",
    "target": "4d44ba53",
    "confidence": 0.88
  },
  {
    "source": "20b66d65",
    "target": "a794ada0",
    "confidence": 0.76
  },
  {
    "source": "20b66d65",
    "target": "1bae87b9",
    "confidence": 0.87
  },
  {
    "source": "72ef498b",
    "target": "4d44ba53",
    "confidence": 0.68
  },
  {
    "source": "72ef498b",
    "target": "c71d2daf",
    "confidence": 0.78
  },
  {
    "source": "72ef498b",
    "target": "b762c64a",
    "confidence": 0.78
  },
  {
    "source": "0d4dee1a",
    "target": "3b4f7e97",
    "confidence": 0.9
  },
  {
    "source": "0d4dee1a",
    "target": "c9a123b4",
    "confidence": 0.79
  },
  {
    "source": "811328b8",
    "target": "dde2d07a",
    "confidence": 0.93
  },
  {
    "source": "811328b8",
    "target": "44f62544",
    "confidence": 0.76
  },
  {
    "source": "811328b8",
    "target": "9713a513",
    "confidence": 0.78
  },
  {
    "source": "811328b8",
    "target": "c0675d4c",
    "confidence": 0.88
  },
  {
    "source": "811328b8",
    "target": "21e43253",
    "confidence": 0.89
  },
  {
    "source": "dbbb54e5",
    "target": "c71d2daf",
    "confidence": 0.78
  },
  {
    "source": "dbbb54e5",
    "target": "3b4f7e97",
    "confidence": 0.72
  },
  {
    "source": "dbbb54e5",
    "target": "b762c64a",
    "confidence": 0.74
  },
  {
    "source": "5361811c",
    "target": "a5d1e558",
    "confidence": 0.83
  },
  {
    "source": "5361811c",
    "target": "94922603",
    "confidence": 0.81
  },
  {
    "source": "5361811c",
    "target": "76eedcca",
    "confidence": 0.71
  },
  {
    "source": "5361811c",
    "target": "0a830e20",
    "confidence": 0.71
  },
  {
    "source": "5361811c",
    "target": "3c1c826f",
    "confidence": 0.75
  },
  {
    "source": "94922603",
    "target": "5361811c",
    "confidence": 0.81
  },
  {
    "source": "94922603",
    "target": "a5d1e558",
    "confidence": 0.79
  },
  {
    "source": "94922603",
    "target": "3c1c826f",
    "confidence": 0.76
  },
  {
    "source": "63f586be",
    "target": "09b2e1e5",
    "confidence": 0.72
  },
  {
    "source": "63f586be",
    "target": "74c8accc",
    "confidence": 0.66
  },
  {
    "source": "63f586be",
    "target": "44b98e29",
    "confidence": 0.83
  },
  {
    "source": "a5d1e558",
    "target": "5361811c",
    "confidence": 0.83
  },
  {
    "source": "a5d1e558",
    "target": "94922603",
    "confidence": 0.79
  },
  {
    "source": "4d44ba53",
    "target": "20b66d65",
    "confidence": 0.88
  },
  {
    "source": "4d44ba53",
    "target": "1bae87b9",
    "confidence": 0.84
  },
  {
    "source": "4d44ba53",
    "target": "44b98e29",
    "confidence": 0.75
  },
  {
    "source": "4d44ba53",
    "target": "a794ada0",
    "confidence": 0.78
  },
  {
    "source": "4d44ba53",
    "target": "de1c4994",
    "confidence": 0.72
  },
  {
    "source": "4d44ba53",
    "target": "0b57e258",
    "confidence": 0.74
  },
  {
    "source": "b762c64a",
    "target": "72ef498b",
    "confidence": 0.78
  },
  {
    "source": "b762c64a",
    "target": "dbbb54e5",
    "confidence": 0.74
  },
  {
    "source": "b762c64a",
    "target": "c71d2daf",
    "confidence": 0.83
  },
  {
    "source": "c71d2daf",
    "target": "dbbb54e5",
    "confidence": 0.78
  },
  {
    "source": "c71d2daf",
    "target": "72ef498b",
    "confidence": 0.78
  },
  {
    "source": "c71d2daf",
    "target": "b762c64a",
    "confidence": 0.83
  },
  {
    "source": "70f37b65",
    "target": "1a248c3f",
    "confidence": 0.78
  },
  {
    "source": "70f37b65",
    "target": "81aa80b0",
    "confidence": 0.81
  },
  {
    "source": "70f37b65",
    "target": "42a0f495",
    "confidence": 0.66
  },
  {
    "source": "70f37b65",
    "target": "acfbc88d",
    "confidence": 0.74
  },
  {
    "source": "81aa80b0",
    "target": "74d1d47b",
    "confidence": 0.74
  },
  {
    "source": "81aa80b0",
    "target": "6b296ce4",
    "confidence": 0.74
  },
  {
    "source": "81aa80b0",
    "target": "70f37b65",
    "confidence": 0.81
  },
  {
    "source": "1a248c3f",
    "target": "acfbc88d",
    "confidence": 0.74
  },
  {
    "source": "1a248c3f",
    "target": "70f37b65",
    "confidence": 0.78
  },
  {
    "source": "1a248c3f",
    "target": "37688dad",
    "confidence": 0.81
  },
  {
    "source": "acfbc88d",
    "target": "1a248c3f",
    "confidence": 0.74
  },
  {
    "source": "acfbc88d",
    "target": "70f37b65",
    "confidence": 0.74
  },
  {
    "source": "42a0f495",
    "target": "70f37b65",
    "confidence": 0.66
  },
  {
    "source": "42a0f495",
    "target": "37688dad",
    "confidence": 0.68
  },
  {
    "source": "0b57e258",
    "target": "de1c4994",
    "confidence": 0.93
  },
  {
    "source": "0b57e258",
    "target": "4d44ba53",
    "confidence": 0.74
  },
  {
    "source": "74c8accc",
    "target": "44b98e29",
    "confidence": 0.68
  },
  {
    "source": "74c8accc",
    "target": "0e7508a4",
    "confidence": 0.73
  },
  {
    "source": "74c8accc",
    "target": "3d3db1d4",
    "confidence": 0.6
  },
  {
    "source": "b798b44d",
    "target": "0f39d1d0",
    "confidence": 0.73
  },
  {
    "source": "b798b44d",
    "target": "779a54d1",
    "confidence": 0.69
  },
  {
    "source": "41836b44",
    "target": "c394909f",
    "confidence": 0.9
  },
  {
    "source": "c624be6b",
    "target": "3277f8da",
    "confidence": 0.68
  },
  {
    "source": "c624be6b",
    "target": "b3f0b660",
    "confidence": 0.78
  },
  {
    "source": "c624be6b",
    "target": "c6a1d9fc",
    "confidence": 0.73
  },
  {
    "source": "c624be6b",
    "target": "0f920e26",
    "confidence": 0.74
  },
  {
    "source": "c624be6b",
    "target": "700c90d2",
    "confidence": 0.69
  },
  {
    "source": "c624be6b",
    "target": "5e7c42f4",
    "confidence": 0.75
  },
  {
    "source": "3277f8da",
    "target": "c6a1d9fc",
    "confidence": 0.66
  },
  {
    "source": "3277f8da",
    "target": "c624be6b",
    "confidence": 0.68
  },
  {
    "source": "3277f8da",
    "target": "5e7c42f4",
    "confidence": 0.68
  },
  {
    "source": "ca369d81",
    "target": "a2436776",
    "confidence": 0.63
  },
  {
    "source": "ca369d81",
    "target": "24c922b0",
    "confidence": 0.65
  },
  {
    "source": "11b77b6c",
    "target": "7bbc096c",
    "confidence": 0.6
  },
  {
    "source": "11b77b6c",
    "target": "a46b0cfd",
    "confidence": 0.63
  },
  {
    "source": "11b77b6c",
    "target": "6613f864",
    "confidence": 0.72
  },
  {
    "source": "eb68efad",
    "target": "b87ed21f",
    "confidence": 0.73
  },
  {
    "source": "eb68efad",
    "target": "eec4da11",
    "confidence": 0.68
  },
  {
    "source": "b87ed21f",
    "target": "44b98e29",
    "confidence": 0.72
  },
  {
    "source": "b87ed21f",
    "target": "eb68efad",
    "confidence": 0.73
  },
  {
    "source": "3eafc6ab",
    "target": "8d96b61f",
    "confidence": 0.77
  },
  {
    "source": "8d96b61f",
    "target": "3eafc6ab",
    "confidence": 0.77
  },
  {
    "source": "507ff4c9",
    "target": "9eb95500",
    "confidence": 0.78
  },
  {
    "source": "507ff4c9",
    "target": "4e42c198",
    "confidence": 0.59
  },
  {
    "source": "713dbcd3",
    "target": "41118414",
    "confidence": 0.6
  },
  {
    "source": "713dbcd3",
    "target": "5a952db4",
    "confidence": 0.59
  },
  {
    "source": "713dbcd3",
    "target": "507ff4c9",
    "confidence": 0.59
  },
  {
    "source": "76fe7a09",
    "target": "09b2e1e5",
    "confidence": 0.56
  },
  {
    "source": "76fe7a09",
    "target": "dd9e5eee",
    "confidence": 0.56
  },
  {
    "source": "76fe7a09",
    "target": "44b98e29",
    "confidence": 0.56
  },
  {
    "source": "76fe7a09",
    "target": "b762c64a",
    "confidence": 0.56
  },
  {
    "source": "b3f0b660",
    "target": "c6a1d9fc",
    "confidence": 0.8
  },
  {
    "source": "b3f0b660",
    "target": "2dfa4958",
    "confidence": 0.63
  },
  {
    "source": "b3f0b660",
    "target": "c624be6b",
    "confidence": 0.78
  },
  {
    "source": "b3f0b660",
    "target": "5e7c42f4",
    "confidence": 0.76
  },
  {
    "source": "e7719d07",
    "target": "5d467ffd",
    "confidence": 0.89
  },
  {
    "source": "e7719d07",
    "target": "3728477e",
    "confidence": 0.9
  },
  {
    "source": "60cb3d6a",
    "target": "1f6c8a5e",
    "confidence": 0.7
  },
  {
    "source": "60cb3d6a",
    "target": "1b9d7b0f",
    "confidence": 0.7
  },
  {
    "source": "60cb3d6a",
    "target": "652b35e9",
    "confidence": 0.69
  },
  {
    "source": "60cb3d6a",
    "target": "14153458",
    "confidence": 0.7
  },
  {
    "source": "3728477e",
    "target": "5d467ffd",
    "confidence": 0.93
  },
  {
    "source": "3728477e",
    "target": "e7719d07",
    "confidence": 0.9
  },
  {
    "source": "f82a68b0",
    "target": "39a6689b",
    "confidence": 0.65
  },
  {
    "source": "f82a68b0",
    "target": "d395c926",
    "confidence": 0.63
  },
  {
    "source": "f82a68b0",
    "target": "d707092c",
    "confidence": 0.63
  },
  {
    "source": "f82a68b0",
    "target": "65b452ff",
    "confidence": 0.69
  },
  {
    "source": "f82a68b0",
    "target": "67852f37",
    "confidence": 0.66
  },
  {
    "source": "f82a68b0",
    "target": "f8667a98",
    "confidence": 0.65
  },
  {
    "source": "c6a1d9fc",
    "target": "700c90d2",
    "confidence": 0.68
  },
  {
    "source": "c6a1d9fc",
    "target": "b3f0b660",
    "confidence": 0.8
  },
  {
    "source": "c6a1d9fc",
    "target": "2dfa4958",
    "confidence": 0.63
  },
  {
    "source": "c6a1d9fc",
    "target": "5e7c42f4",
    "confidence": 0.74
  },
  {
    "source": "41090665",
    "target": "9d53774d",
    "confidence": 0.67
  },
  {
    "source": "41090665",
    "target": "54b4a7a1",
    "confidence": 0.62
  },
  {
    "source": "41090665",
    "target": "84aa4ab6",
    "confidence": 0.73
  },
  {
    "source": "41090665",
    "target": "3c682d57",
    "confidence": 0.64
  },
  {
    "source": "41090665",
    "target": "a667e0b2",
    "confidence": 0.72
  },
  {
    "source": "41090665",
    "target": "f88f53dd",
    "confidence": 0.56
  },
  {
    "source": "41090665",
    "target": "42972329",
    "confidence": 0.66
  },
  {
    "source": "d3823c15",
    "target": "2d2fa764",
    "confidence": 0.73
  },
  {
    "source": "3c682d57",
    "target": "a667e0b2",
    "confidence": 0.69
  },
  {
    "source": "3c682d57",
    "target": "41090665",
    "confidence": 0.64
  },
  {
    "source": "54b4a7a1",
    "target": "f88f53dd",
    "confidence": 0.6
  },
  {
    "source": "54b4a7a1",
    "target": "cd9ec31b",
    "confidence": 0.6
  },
  {
    "source": "54b4a7a1",
    "target": "42972329",
    "confidence": 0.77
  },
  {
    "source": "54b4a7a1",
    "target": "a667e0b2",
    "confidence": 0.65
  },
  {
    "source": "a667e0b2",
    "target": "54b4a7a1",
    "confidence": 0.65
  },
  {
    "source": "a667e0b2",
    "target": "42972329",
    "confidence": 0.68
  },
  {
    "source": "a667e0b2",
    "target": "3c682d57",
    "confidence": 0.69
  },
  {
    "source": "a667e0b2",
    "target": "41090665",
    "confidence": 0.72
  },
  {
    "source": "42972329",
    "target": "7f0db69b",
    "confidence": 0.57
  },
  {
    "source": "42972329",
    "target": "cd9ec31b",
    "confidence": 0.61
  },
  {
    "source": "42972329",
    "target": "a667e0b2",
    "confidence": 0.68
  },
  {
    "source": "42972329",
    "target": "54b4a7a1",
    "confidence": 0.77
  },
  {
    "source": "f88f53dd",
    "target": "41090665",
    "confidence": 0.56
  },
  {
    "source": "f88f53dd",
    "target": "54b4a7a1",
    "confidence": 0.6
  },
  {
    "source": "f88f53dd",
    "target": "42972329",
    "confidence": 0.55
  },
  {
    "source": "0267e3a9",
    "target": "d3823c15",
    "confidence": 0.57
  },
  {
    "source": "0267e3a9",
    "target": "eebb5ed8",
    "confidence": 0.68
  },
  {
    "source": "0267e3a9",
    "target": "50b16c4e",
    "confidence": 0.57
  },
  {
    "source": "0267e3a9",
    "target": "ad49b781",
    "confidence": 0.61
  },
  {
    "source": "cd9ec31b",
    "target": "7f0db69b",
    "confidence": 0.64
  },
  {
    "source": "cd9ec31b",
    "target": "42972329",
    "confidence": 0.61
  },
  {
    "source": "7f0db69b",
    "target": "b6d2192d",
    "confidence": 0.6
  },
  {
    "source": "7f0db69b",
    "target": "cd9ec31b",
    "confidence": 0.64
  },
  {
    "source": "2c35647f",
    "target": "421e680f",
    "confidence": 0.96
  },
  {
    "source": "2c35647f",
    "target": "768f28d0",
    "confidence": 0.67
  },
  {
    "source": "2751f4b9",
    "target": "e96d4b53",
    "confidence": 0.77
  },
  {
    "source": "2751f4b9",
    "target": "a7c90e13",
    "confidence": 0.76
  },
  {
    "source": "2751f4b9",
    "target": "5f173065",
    "confidence": 0.81
  },
  {
    "source": "2751f4b9",
    "target": "a9e72655",
    "confidence": 0.69
  },
  {
    "source": "2751f4b9",
    "target": "91164edd",
    "confidence": 0.74
  },
  {
    "source": "a9e72655",
    "target": "5f173065",
    "confidence": 0.74
  },
  {
    "source": "a9e72655",
    "target": "91164edd",
    "confidence": 0.92
  },
  {
    "source": "d025bd47",
    "target": "e933072b",
    "confidence": 0.8
  },
  {
    "source": "d025bd47",
    "target": "91164edd",
    "confidence": 0.67
  },
  {
    "source": "d025bd47",
    "target": "a7c90e13",
    "confidence": 0.66
  },
  {
    "source": "e933072b",
    "target": "d025bd47",
    "confidence": 0.8
  },
  {
    "source": "e933072b",
    "target": "2751f4b9",
    "confidence": 0.58
  },
  {
    "source": "e933072b",
    "target": "91164edd",
    "confidence": 0.61
  },
  {
    "source": "e933072b",
    "target": "bd329ca9",
    "confidence": 0.6
  },
  {
    "source": "5f173065",
    "target": "a9e72655",
    "confidence": 0.74
  },
  {
    "source": "5f173065",
    "target": "2751f4b9",
    "confidence": 0.81
  },
  {
    "source": "5f173065",
    "target": "e96d4b53",
    "confidence": 0.74
  },
  {
    "source": "5f173065",
    "target": "a7c90e13",
    "confidence": 0.79
  },
  {
    "source": "5f173065",
    "target": "91164edd",
    "confidence": 0.78
  },
  {
    "source": "e96d4b53",
    "target": "2751f4b9",
    "confidence": 0.77
  },
  {
    "source": "e96d4b53",
    "target": "a7c90e13",
    "confidence": 0.9
  },
  {
    "source": "a7c90e13",
    "target": "e96d4b53",
    "confidence": 0.9
  },
  {
    "source": "a7c90e13",
    "target": "5f173065",
    "confidence": 0.79
  },
  {
    "source": "91164edd",
    "target": "5f173065",
    "confidence": 0.78
  },
  {
    "source": "91164edd",
    "target": "a9e72655",
    "confidence": 0.92
  },
  {
    "source": "91164edd",
    "target": "d025bd47",
    "confidence": 0.67
  },
  {
    "source": "8ce78d6f",
    "target": "6e357310",
    "confidence": 0.57
  },
  {
    "source": "8ce78d6f",
    "target": "1b7dc192",
    "confidence": 0.55
  },
  {
    "source": "de1c4994",
    "target": "4d44ba53",
    "confidence": 0.72
  },
  {
    "source": "de1c4994",
    "target": "0b57e258",
    "confidence": 0.93
  },
  {
    "source": "9d53774d",
    "target": "8ce78d6f",
    "confidence": 0.55
  },
  {
    "source": "9d53774d",
    "target": "84aa4ab6",
    "confidence": 0.87
  },
  {
    "source": "9d53774d",
    "target": "6e357310",
    "confidence": 0.73
  },
  {
    "source": "3795df99",
    "target": "0982491b",
    "confidence": 0.62
  },
  {
    "source": "3795df99",
    "target": "6e357310",
    "confidence": 0.65
  },
  {
    "source": "3795df99",
    "target": "b2b2c029",
    "confidence": 0.58
  },
  {
    "source": "7bbc096c",
    "target": "a46b0cfd",
    "confidence": 0.78
  },
  {
    "source": "7bbc096c",
    "target": "c624be6b",
    "confidence": 0.61
  },
  {
    "source": "7bbc096c",
    "target": "11b77b6c",
    "confidence": 0.6
  },
  {
    "source": "0f920e26",
    "target": "d1fad88d",
    "confidence": 0.74
  },
  {
    "source": "0f920e26",
    "target": "93015201",
    "confidence": 0.71
  },
  {
    "source": "0f920e26",
    "target": "c624be6b",
    "confidence": 0.73
  },
  {
    "source": "a46b0cfd",
    "target": "7bbc096c",
    "confidence": 0.78
  },
  {
    "source": "a46b0cfd",
    "target": "11b77b6c",
    "confidence": 0.63
  },
  {
    "source": "a46b0cfd",
    "target": "93015201",
    "confidence": 0.65
  },
  {
    "source": "a46b0cfd",
    "target": "6613f864",
    "confidence": 0.63
  },
  {
    "source": "d1fad88d",
    "target": "93015201",
    "confidence": 0.77
  },
  {
    "source": "d1fad88d",
    "target": "0f920e26",
    "confidence": 0.74
  },
  {
    "source": "11f957b1",
    "target": "a772b977",
    "confidence": 0.82
  },
  {
    "source": "11f957b1",
    "target": "89e7af05",
    "confidence": 0.82
  },
  {
    "source": "21242f03",
    "target": "42a0f495",
    "confidence": 0.64
  },
  {
    "source": "21242f03",
    "target": "18dd7983",
    "confidence": 0.68
  },
  {
    "source": "21242f03",
    "target": "d8c60f80",
    "confidence": 0.65
  },
  {
    "source": "21242f03",
    "target": "37688dad",
    "confidence": 0.65
  },
  {
    "source": "21242f03",
    "target": "6738ecf9",
    "confidence": 0.63
  },
  {
    "source": "93015201",
    "target": "a46b0cfd",
    "confidence": 0.65
  },
  {
    "source": "93015201",
    "target": "0f920e26",
    "confidence": 0.69
  },
  {
    "source": "93015201",
    "target": "d1fad88d",
    "confidence": 0.77
  },
  {
    "source": "7404846d",
    "target": "bdfed3c3",
    "confidence": 0.55
  },
  {
    "source": "7404846d",
    "target": "56442841",
    "confidence": 0.53
  },
  {
    "source": "7404846d",
    "target": "6335c531",
    "confidence": 0.53
  },
  {
    "source": "7404846d",
    "target": "8fbc9de8",
    "confidence": 0.8
  },
  {
    "source": "7404846d",
    "target": "9b4b83a7",
    "confidence": 0.56
  },
  {
    "source": "44f62544",
    "target": "7a06e089",
    "confidence": 0.83
  },
  {
    "source": "44f62544",
    "target": "21e43253",
    "confidence": 0.79
  },
  {
    "source": "a298aefe",
    "target": "1395e24f",
    "confidence": 0.8
  },
  {
    "source": "a298aefe",
    "target": "c27c48eb",
    "confidence": 0.8
  },
  {
    "source": "a298aefe",
    "target": "0ec8d1a5",
    "confidence": 0.79
  },
  {
    "source": "a298aefe",
    "target": "d6f1ac13",
    "confidence": 0.8
  },
  {
    "source": "a298aefe",
    "target": "bd329ca9",
    "confidence": 0.79
  },
  {
    "source": "7f71a117",
    "target": "9aca9e2c",
    "confidence": 0.64
  },
  {
    "source": "f9cc7272",
    "target": "331fa22e",
    "confidence": 0.57
  },
  {
    "source": "f9cc7272",
    "target": "384333a0",
    "confidence": 0.62
  },
  {
    "source": "f9cc7272",
    "target": "590b4841",
    "confidence": 0.62
  },
  {
    "source": "f9cc7272",
    "target": "2d2fa764",
    "confidence": 0.57
  },
  {
    "source": "f9cc7272",
    "target": "ab2ffcf1",
    "confidence": 0.6
  },
  {
    "source": "421e680f",
    "target": "768f28d0",
    "confidence": 0.68
  },
  {
    "source": "421e680f",
    "target": "2c35647f",
    "confidence": 0.96
  },
  {
    "source": "ab2ffcf1",
    "target": "76eedcca",
    "confidence": 0.68
  },
  {
    "source": "ad318027",
    "target": "7473081c",
    "confidence": 0.86
  },
  {
    "source": "ad318027",
    "target": "c394909f",
    "confidence": 0.79
  },
  {
    "source": "ad318027",
    "target": "5c657965",
    "confidence": 0.77
  },
  {
    "source": "ad318027",
    "target": "ea8a0669",
    "confidence": 0.84
  },
  {
    "source": "b3b47b62",
    "target": "41836b44",
    "confidence": 0.82
  },
  {
    "source": "b3b47b62",
    "target": "a794ada0",
    "confidence": 0.85
  },
  {
    "source": "b3b47b62",
    "target": "c394909f",
    "confidence": 0.79
  },
  {
    "source": "b3b47b62",
    "target": "1c74633e",
    "confidence": 0.79
  },
  {
    "source": "b3b47b62",
    "target": "7ac15094",
    "confidence": 0.79
  },
  {
    "source": "b7335fc3",
    "target": "41836b44",
    "confidence": 0.79
  },
  {
    "source": "b7335fc3",
    "target": "7473081c",
    "confidence": 0.81
  },
  {
    "source": "b7335fc3",
    "target": "76eedcca",
    "confidence": 0.72
  },
  {
    "source": "b7335fc3",
    "target": "c394909f",
    "confidence": 0.81
  },
  {
    "source": "ca2048d1",
    "target": "a6e16eab",
    "confidence": 0.71
  },
  {
    "source": "ca2048d1",
    "target": "3ea0627f",
    "confidence": 0.74
  },
  {
    "source": "1026b0fb",
    "target": "e86b25f7",
    "confidence": 0.69
  },
  {
    "source": "1026b0fb",
    "target": "95c55296",
    "confidence": 0.72
  },
  {
    "source": "1026b0fb",
    "target": "184ddecc",
    "confidence": 0.8
  },
  {
    "source": "1c74633e",
    "target": "a794ada0",
    "confidence": 0.86
  },
  {
    "source": "1c74633e",
    "target": "7ac15094",
    "confidence": 0.79
  },
  {
    "source": "1c74633e",
    "target": "b3b47b62",
    "confidence": 0.79
  },
  {
    "source": "3569df75",
    "target": "3c1c826f",
    "confidence": 0.78
  },
  {
    "source": "3569df75",
    "target": "df6e49d5",
    "confidence": 0.7
  },
  {
    "source": "38c575dc",
    "target": "46341b52",
    "confidence": 0.81
  },
  {
    "source": "38c575dc",
    "target": "899b7fc5",
    "confidence": 0.84
  },
  {
    "source": "38c575dc",
    "target": "6b737d82",
    "confidence": 0.88
  },
  {
    "source": "3c1c826f",
    "target": "94922603",
    "confidence": 0.76
  },
  {
    "source": "3c1c826f",
    "target": "3569df75",
    "confidence": 0.78
  },
  {
    "source": "3ef5f003",
    "target": "f407754c",
    "confidence": 0.7
  },
  {
    "source": "3ef5f003",
    "target": "f59ea0d5",
    "confidence": 0.85
  },
  {
    "source": "3ef5f003",
    "target": "944d72a4",
    "confidence": 0.75
  },
  {
    "source": "3ef5f003",
    "target": "443d2919",
    "confidence": 0.8
  },
  {
    "source": "84aa4ab6",
    "target": "6e357310",
    "confidence": 0.78
  },
  {
    "source": "84aa4ab6",
    "target": "41090665",
    "confidence": 0.73
  },
  {
    "source": "84aa4ab6",
    "target": "9d53774d",
    "confidence": 0.87
  },
  {
    "source": "7ee890d7",
    "target": "b6d2192d",
    "confidence": 0.69
  },
  {
    "source": "7ee890d7",
    "target": "624fc1c0",
    "confidence": 0.88
  },
  {
    "source": "7ee890d7",
    "target": "ca2048d1",
    "confidence": 0.66
  },
  {
    "source": "7ee890d7",
    "target": "a6e16eab",
    "confidence": 0.67
  },
  {
    "source": "7ee890d7",
    "target": "7f0db69b",
    "confidence": 0.59
  },
  {
    "source": "624fc1c0",
    "target": "7ee890d7",
    "confidence": 0.89
  },
  {
    "source": "624fc1c0",
    "target": "00896e83",
    "confidence": 0.66
  },
  {
    "source": "624fc1c0",
    "target": "b6d2192d",
    "confidence": 0.68
  },
  {
    "source": "00896e83",
    "target": "b6d2192d",
    "confidence": 0.77
  },
  {
    "source": "00896e83",
    "target": "02ca73fa",
    "confidence": 0.68
  },
  {
    "source": "6ce61009",
    "target": "00cf0443",
    "confidence": 0.73
  },
  {
    "source": "6ce61009",
    "target": "42a0f495",
    "confidence": 0.8
  },
  {
    "source": "6ce61009",
    "target": "f785a439",
    "confidence": 0.62
  },
  {
    "source": "6ce61009",
    "target": "f37290ab",
    "confidence": 0.6
  },
  {
    "source": "6ce61009",
    "target": "3ce262e8",
    "confidence": 0.64
  },
  {
    "source": "7e5a3994",
    "target": "37688dad",
    "confidence": 0.69
  },
  {
    "source": "7e5a3994",
    "target": "d8c60f80",
    "confidence": 0.69
  },
  {
    "source": "b6d2192d",
    "target": "00896e83",
    "confidence": 0.77
  },
  {
    "source": "b6d2192d",
    "target": "624fc1c0",
    "confidence": 0.68
  },
  {
    "source": "6440883c",
    "target": "b8adbe4f",
    "confidence": 0.66
  },
  {
    "source": "6440883c",
    "target": "d041e296",
    "confidence": 0.69
  },
  {
    "source": "6440883c",
    "target": "e0706c1f",
    "confidence": 0.75
  },
  {
    "source": "18fc213a",
    "target": "a2436776",
    "confidence": 0.65
  },
  {
    "source": "18fc213a",
    "target": "dcb1db02",
    "confidence": 0.63
  },
  {
    "source": "18fc213a",
    "target": "bd265307",
    "confidence": 0.66
  },
  {
    "source": "18fc213a",
    "target": "00ead12b",
    "confidence": 0.66
  },
  {
    "source": "18fc213a",
    "target": "8e1de309",
    "confidence": 0.65
  },
  {
    "source": "2dfa4958",
    "target": "b3f0b660",
    "confidence": 0.63
  },
  {
    "source": "2dfa4958",
    "target": "c6a1d9fc",
    "confidence": 0.63
  },
  {
    "source": "6f174a1f",
    "target": "eec4da11",
    "confidence": 0.71
  },
  {
    "source": "9eb95500",
    "target": "507ff4c9",
    "confidence": 0.78
  },
  {
    "source": "eec4da11",
    "target": "6f174a1f",
    "confidence": 0.71
  },
  {
    "source": "eec4da11",
    "target": "eb68efad",
    "confidence": 0.68
  },
  {
    "source": "bf0c2bd5",
    "target": "a1ea0b9c",
    "confidence": 0.54
  },
  {
    "source": "bf0c2bd5",
    "target": "9ba64e50",
    "confidence": 0.6
  },
  {
    "source": "d2c2e76c",
    "target": "44d2368a",
    "confidence": 0.58
  },
  {
    "source": "d2c2e76c",
    "target": "ce852fed",
    "confidence": 0.81
  },
  {
    "source": "d2c2e76c",
    "target": "3dd29ab5",
    "confidence": 0.67
  },
  {
    "source": "d2c2e76c",
    "target": "ef877814",
    "confidence": 0.64
  },
  {
    "source": "d2c2e76c",
    "target": "c42bef2c",
    "confidence": 0.79
  },
  {
    "source": "d2c2e76c",
    "target": "031a83c0",
    "confidence": 0.69
  },
  {
    "source": "bd3ae202",
    "target": "3e924212",
    "confidence": 0.84
  },
  {
    "source": "bd3ae202",
    "target": "283ec879",
    "confidence": 0.59
  },
  {
    "source": "bd3ae202",
    "target": "a6be27c2",
    "confidence": 0.77
  },
  {
    "source": "3e924212",
    "target": "a6be27c2",
    "confidence": 0.69
  },
  {
    "source": "3e924212",
    "target": "3a3ddeea",
    "confidence": 0.55
  },
  {
    "source": "3e924212",
    "target": "bd3ae202",
    "confidence": 0.84
  },
  {
    "source": "a6be27c2",
    "target": "bd3ae202",
    "confidence": 0.77
  },
  {
    "source": "a6be27c2",
    "target": "3e924212",
    "confidence": 0.69
  },
  {
    "source": "283ec879",
    "target": "bd3ae202",
    "confidence": 0.59
  },
  {
    "source": "283ec879",
    "target": "de1c4994",
    "confidence": 0.6
  },
  {
    "source": "283ec879",
    "target": "2d2fa764",
    "confidence": 0.59
  },
  {
    "source": "02ca73fa",
    "target": "d3006053",
    "confidence": 0.6
  },
  {
    "source": "02ca73fa",
    "target": "b6d2192d",
    "confidence": 0.59
  },
  {
    "source": "02ca73fa",
    "target": "00896e83",
    "confidence": 0.68
  },
  {
    "source": "1d9a20ed",
    "target": "b3200f55",
    "confidence": 0.88
  },
  {
    "source": "1d9a20ed",
    "target": "4e42c198",
    "confidence": 0.88
  },
  {
    "source": "1d9a20ed",
    "target": "84cb89ee",
    "confidence": 0.88
  },
  {
    "source": "84cb89ee",
    "target": "4e42c198",
    "confidence": 0.91
  },
  {
    "source": "84cb89ee",
    "target": "b3200f55",
    "confidence": 0.91
  },
  {
    "source": "cd7678ff",
    "target": "8cbf6c51",
    "confidence": 0.86
  },
  {
    "source": "cd7678ff",
    "target": "891d788a",
    "confidence": 0.88
  },
  {
    "source": "891d788a",
    "target": "cd7678ff",
    "confidence": 0.87
  },
  {
    "source": "891d788a",
    "target": "7cecad26",
    "confidence": 0.79
  },
  {
    "source": "891d788a",
    "target": "8cbf6c51",
    "confidence": 0.89
  },
  {
    "source": "891d788a",
    "target": "fdbed79e",
    "confidence": 0.84
  },
  {
    "source": "891d788a",
    "target": "e868a706",
    "confidence": 0.83
  },
  {
    "source": "4b721142",
    "target": "7ac15094",
    "confidence": 0.6
  },
  {
    "source": "4b721142",
    "target": "3c1c826f",
    "confidence": 0.6
  },
  {
    "source": "8cbf6c51",
    "target": "891d788a",
    "confidence": 0.89
  },
  {
    "source": "8cbf6c51",
    "target": "fdbed79e",
    "confidence": 0.85
  },
  {
    "source": "8cbf6c51",
    "target": "e868a706",
    "confidence": 0.88
  },
  {
    "source": "fdd1ea1a",
    "target": "ff81c4c2",
    "confidence": 0.8
  },
  {
    "source": "fdd1ea1a",
    "target": "981e53c8",
    "confidence": 0.83
  },
  {
    "source": "fdd1ea1a",
    "target": "ce9f2bd6",
    "confidence": 0.82
  },
  {
    "source": "ce9f2bd6",
    "target": "fdd1ea1a",
    "confidence": 0.82
  },
  {
    "source": "ce9f2bd6",
    "target": "981e53c8",
    "confidence": 0.87
  },
  {
    "source": "ce9f2bd6",
    "target": "052d3ba0",
    "confidence": 0.8
  },
  {
    "source": "981e53c8",
    "target": "ff81c4c2",
    "confidence": 0.85
  },
  {
    "source": "981e53c8",
    "target": "ce9f2bd6",
    "confidence": 0.87
  },
  {
    "source": "981e53c8",
    "target": "052d3ba0",
    "confidence": 0.84
  },
  {
    "source": "981e53c8",
    "target": "fdd1ea1a",
    "confidence": 0.83
  },
  {
    "source": "052d3ba0",
    "target": "981e53c8",
    "confidence": 0.84
  },
  {
    "source": "052d3ba0",
    "target": "803c94ed",
    "confidence": 0.71
  },
  {
    "source": "052d3ba0",
    "target": "904813fe",
    "confidence": 0.81
  },
  {
    "source": "052d3ba0",
    "target": "7f503589",
    "confidence": 0.85
  },
  {
    "source": "052d3ba0",
    "target": "ff81c4c2",
    "confidence": 0.88
  },
  {
    "source": "d53ead70",
    "target": "7f503589",
    "confidence": 0.8
  },
  {
    "source": "d53ead70",
    "target": "052d3ba0",
    "confidence": 0.8
  },
  {
    "source": "d53ead70",
    "target": "baa3420b",
    "confidence": 0.84
  },
  {
    "source": "ca43e00f",
    "target": "33031019",
    "confidence": 0.63
  },
  {
    "source": "ca43e00f",
    "target": "a5c05e83",
    "confidence": 0.66
  },
  {
    "source": "ca43e00f",
    "target": "c84d7088",
    "confidence": 0.62
  },
  {
    "source": "6613f864",
    "target": "11b77b6c",
    "confidence": 0.72
  },
  {
    "source": "6613f864",
    "target": "50b3cede",
    "confidence": 0.69
  },
  {
    "source": "50b3cede",
    "target": "3277f8da",
    "confidence": 0.6
  },
  {
    "source": "50b3cede",
    "target": "6613f864",
    "confidence": 0.69
  },
  {
    "source": "50b3cede",
    "target": "5e7c42f4",
    "confidence": 0.59
  },
  {
    "source": "2a449e12",
    "target": "5a8c385b",
    "confidence": 0.78
  },
  {
    "source": "2a449e12",
    "target": "f596130d",
    "confidence": 0.81
  },
  {
    "source": "2a449e12",
    "target": "4aaa270a",
    "confidence": 0.71
  },
  {
    "source": "b3200f55",
    "target": "4e42c198",
    "confidence": 0.93
  },
  {
    "source": "b3200f55",
    "target": "1d9a20ed",
    "confidence": 0.88
  },
  {
    "source": "b3200f55",
    "target": "84cb89ee",
    "confidence": 0.91
  },
  {
    "source": "dcd6b90e",
    "target": "e460b963",
    "confidence": 0.82
  },
  {
    "source": "dcd6b90e",
    "target": "1ae74063",
    "confidence": 0.88
  },
  {
    "source": "dcd6b90e",
    "target": "28b03254",
    "confidence": 0.88
  },
  {
    "source": "920a0977",
    "target": "744bde3a",
    "confidence": 0.73
  },
  {
    "source": "920a0977",
    "target": "5338f26b",
    "confidence": 0.74
  },
  {
    "source": "920a0977",
    "target": "4f9627dc",
    "confidence": 0.72
  },
  {
    "source": "28b03254",
    "target": "814d915c",
    "confidence": 0.84
  },
  {
    "source": "28b03254",
    "target": "e460b963",
    "confidence": 0.88
  },
  {
    "source": "28b03254",
    "target": "dcd6b90e",
    "confidence": 0.88
  },
  {
    "source": "6199cbbe",
    "target": "77ae4969",
    "confidence": 0.9
  },
  {
    "source": "6199cbbe",
    "target": "744bde3a",
    "confidence": 0.84
  },
  {
    "source": "6199cbbe",
    "target": "e460b963",
    "confidence": 0.83
  },
  {
    "source": "e460b963",
    "target": "744bde3a",
    "confidence": 0.92
  },
  {
    "source": "e460b963",
    "target": "ba2d414b",
    "confidence": 0.91
  },
  {
    "source": "e460b963",
    "target": "28b03254",
    "confidence": 0.88
  },
  {
    "source": "77ae4969",
    "target": "ff479f27",
    "confidence": 0.81
  },
  {
    "source": "77ae4969",
    "target": "744bde3a",
    "confidence": 0.84
  },
  {
    "source": "77ae4969",
    "target": "6199cbbe",
    "confidence": 0.9
  },
  {
    "source": "744bde3a",
    "target": "b3976b4b",
    "confidence": 0.78
  },
  {
    "source": "744bde3a",
    "target": "ba2d414b",
    "confidence": 0.87
  },
  {
    "source": "744bde3a",
    "target": "ff479f27",
    "confidence": 0.83
  },
  {
    "source": "744bde3a",
    "target": "814d915c",
    "confidence": 0.91
  },
  {
    "source": "744bde3a",
    "target": "e460b963",
    "confidence": 0.92
  },
  {
    "source": "744bde3a",
    "target": "6199cbbe",
    "confidence": 0.84
  },
  {
    "source": "744bde3a",
    "target": "77ae4969",
    "confidence": 0.84
  },
  {
    "source": "1ae74063",
    "target": "814d915c",
    "confidence": 0.82
  },
  {
    "source": "1ae74063",
    "target": "ba2d414b",
    "confidence": 0.82
  },
  {
    "source": "1ae74063",
    "target": "dcd6b90e",
    "confidence": 0.88
  },
  {
    "source": "ba2d414b",
    "target": "e460b963",
    "confidence": 0.91
  },
  {
    "source": "ba2d414b",
    "target": "814d915c",
    "confidence": 0.91
  },
  {
    "source": "ba2d414b",
    "target": "ff479f27",
    "confidence": 0.87
  },
  {
    "source": "ba2d414b",
    "target": "904a75d9",
    "confidence": 0.78
  },
  {
    "source": "ba2d414b",
    "target": "1ae74063",
    "confidence": 0.82
  },
  {
    "source": "ff479f27",
    "target": "814d915c",
    "confidence": 0.88
  },
  {
    "source": "ff479f27",
    "target": "ba2d414b",
    "confidence": 0.87
  },
  {
    "source": "814d915c",
    "target": "744bde3a",
    "confidence": 0.91
  },
  {
    "source": "814d915c",
    "target": "ff479f27",
    "confidence": 0.88
  },
  {
    "source": "814d915c",
    "target": "ba2d414b",
    "confidence": 0.91
  },
  {
    "source": "d8717967",
    "target": "b3976b4b",
    "confidence": 0.78
  },
  {
    "source": "d8717967",
    "target": "904a75d9",
    "confidence": 0.76
  },
  {
    "source": "d8717967",
    "target": "3171829f",
    "confidence": 0.9
  },
  {
    "source": "3171829f",
    "target": "b3976b4b",
    "confidence": 0.72
  },
  {
    "source": "3171829f",
    "target": "904a75d9",
    "confidence": 0.78
  },
  {
    "source": "3171829f",
    "target": "d8717967",
    "confidence": 0.9
  },
  {
    "source": "5338f26b",
    "target": "920a0977",
    "confidence": 0.74
  },
  {
    "source": "5338f26b",
    "target": "1a733ec3",
    "confidence": 0.94
  },
  {
    "source": "5338f26b",
    "target": "4f9627dc",
    "confidence": 0.94
  },
  {
    "source": "4f9627dc",
    "target": "1a733ec3",
    "confidence": 0.92
  },
  {
    "source": "4f9627dc",
    "target": "5338f26b",
    "confidence": 0.94
  },
  {
    "source": "1a733ec3",
    "target": "5338f26b",
    "confidence": 0.94
  },
  {
    "source": "1a733ec3",
    "target": "4f9627dc",
    "confidence": 0.92
  },
  {
    "source": "1a733ec3",
    "target": "ba2d414b",
    "confidence": 0.78
  },
  {
    "source": "904a75d9",
    "target": "b3976b4b",
    "confidence": 0.91
  },
  {
    "source": "904a75d9",
    "target": "3171829f",
    "confidence": 0.78
  },
  {
    "source": "b3976b4b",
    "target": "d8717967",
    "confidence": 0.78
  },
  {
    "source": "b3976b4b",
    "target": "904a75d9",
    "confidence": 0.91
  },
  {
    "source": "acdb356e",
    "target": "76eedcca",
    "confidence": 0.7
  },
  {
    "source": "acdb356e",
    "target": "25f908c0",
    "confidence": 0.79
  },
  {
    "source": "acdb356e",
    "target": "f5523e83",
    "confidence": 0.77
  },
  {
    "source": "a772b977",
    "target": "11f957b1",
    "confidence": 0.82
  },
  {
    "source": "a772b977",
    "target": "89e7af05",
    "confidence": 0.77
  },
  {
    "source": "184e688f",
    "target": "9aca9e2c",
    "confidence": 0.86
  },
  {
    "source": "184e688f",
    "target": "9a4d7488",
    "confidence": 0.91
  },
  {
    "source": "184e688f",
    "target": "cb8a26f7",
    "confidence": 0.66
  },
  {
    "source": "184e688f",
    "target": "14249bdc",
    "confidence": 0.89
  },
  {
    "source": "bcd2bf34",
    "target": "21e43253",
    "confidence": 0.78
  },
  {
    "source": "bcd2bf34",
    "target": "dde2d07a",
    "confidence": 0.8
  },
  {
    "source": "bcd2bf34",
    "target": "7a06e089",
    "confidence": 0.81
  },
  {
    "source": "bcd2bf34",
    "target": "d85b4cb1",
    "confidence": 0.75
  },
  {
    "source": "0a830e20",
    "target": "60159ada",
    "confidence": 0.67
  },
  {
    "source": "0a830e20",
    "target": "998a86c4",
    "confidence": 0.73
  },
  {
    "source": "0a830e20",
    "target": "a5d1e558",
    "confidence": 0.71
  },
  {
    "source": "0a830e20",
    "target": "5361811c",
    "confidence": 0.73
  },
  {
    "source": "f3c0378f",
    "target": "b51d865f",
    "confidence": 0.66
  },
  {
    "source": "f3c0378f",
    "target": "5a8dbd74",
    "confidence": 0.69
  },
  {
    "source": "c25dd86c",
    "target": "79fdf425",
    "confidence": 0.78
  },
  {
    "source": "c25dd86c",
    "target": "7abd1f95",
    "confidence": 0.76
  },
  {
    "source": "d8c60f80",
    "target": "37688dad",
    "confidence": 0.87
  },
  {
    "source": "d8c60f80",
    "target": "7e5a3994",
    "confidence": 0.7
  },
  {
    "source": "d8c60f80",
    "target": "1a248c3f",
    "confidence": 0.75
  },
  {
    "source": "d8c60f80",
    "target": "6738ecf9",
    "confidence": 0.76
  },
  {
    "source": "d8c60f80",
    "target": "46341b52",
    "confidence": 0.76
  },
  {
    "source": "d8c60f80",
    "target": "acfbc88d",
    "confidence": 0.72
  },
  {
    "source": "d9c97e1f",
    "target": "0b541098",
    "confidence": 0.82
  },
  {
    "source": "d9c97e1f",
    "target": "f82f91ca",
    "confidence": 0.74
  },
  {
    "source": "d9c97e1f",
    "target": "4aaa270a",
    "confidence": 0.74
  },
  {
    "source": "60159ada",
    "target": "3b4f7e97",
    "confidence": 0.69
  },
  {
    "source": "60159ada",
    "target": "0a830e20",
    "confidence": 0.68
  },
  {
    "source": "60159ada",
    "target": "7a06e089",
    "confidence": 0.73
  },
  {
    "source": "f660097c",
    "target": "8a69f457",
    "confidence": 0.75
  },
  {
    "source": "f660097c",
    "target": "4d44ba53",
    "confidence": 0.76
  },
  {
    "source": "f660097c",
    "target": "86bebae9",
    "confidence": 0.76
  },
  {
    "source": "f660097c",
    "target": "20b66d65",
    "confidence": 0.74
  },
  {
    "source": "f785a439",
    "target": "37688dad",
    "confidence": 0.65
  },
  {
    "source": "f785a439",
    "target": "70d42f14",
    "confidence": 0.67
  },
  {
    "source": "f785a439",
    "target": "6a72e662",
    "confidence": 0.75
  },
  {
    "source": "2d473467",
    "target": "b51d865f",
    "confidence": 0.75
  },
  {
    "source": "462d2756",
    "target": "dde2d07a",
    "confidence": 0.85
  },
  {
    "source": "462d2756",
    "target": "c25dd86c",
    "confidence": 0.77
  },
  {
    "source": "462d2756",
    "target": "ff61ad30",
    "confidence": 0.81
  },
  {
    "source": "462d2756",
    "target": "89e7af05",
    "confidence": 0.88
  },
  {
    "source": "462d2756",
    "target": "c0675d4c",
    "confidence": 0.84
  },
  {
    "source": "6915cd56",
    "target": "f0ee5389",
    "confidence": 0.76
  },
  {
    "source": "6915cd56",
    "target": "a357dfa8",
    "confidence": 0.78
  },
  {
    "source": "6915cd56",
    "target": "67852f37",
    "confidence": 0.72
  },
  {
    "source": "449ea271",
    "target": "ddd14ae3",
    "confidence": 0.86
  },
  {
    "source": "449ea271",
    "target": "49b2393f",
    "confidence": 0.69
  },
  {
    "source": "f35badb9",
    "target": "bd3ae202",
    "confidence": 0.5
  },
  {
    "source": "f35badb9",
    "target": "bbb485e1",
    "confidence": 0.49
  },
  {
    "source": "f35badb9",
    "target": "1628cb00",
    "confidence": 0.49
  },
  {
    "source": "dde2d07a",
    "target": "bcd2bf34",
    "confidence": 0.8
  },
  {
    "source": "dde2d07a",
    "target": "a772b977",
    "confidence": 0.8
  },
  {
    "source": "dde2d07a",
    "target": "ff61ad30",
    "confidence": 0.85
  },
  {
    "source": "dde2d07a",
    "target": "11f957b1",
    "confidence": 0.82
  },
  {
    "source": "dde2d07a",
    "target": "462d2756",
    "confidence": 0.86
  },
  {
    "source": "dde2d07a",
    "target": "811328b8",
    "confidence": 0.94
  },
  {
    "source": "dde2d07a",
    "target": "89e7af05",
    "confidence": 0.89
  },
  {
    "source": "dde2d07a",
    "target": "c0675d4c",
    "confidence": 0.87
  },
  {
    "source": "8e1de309",
    "target": "18d48d6a",
    "confidence": 0.83
  },
  {
    "source": "8e1de309",
    "target": "aae279fa",
    "confidence": 0.75
  },
  {
    "source": "8e1de309",
    "target": "e458e31c",
    "confidence": 0.91
  },
  {
    "source": "1c890135",
    "target": "85351a6c",
    "confidence": 0.73
  },
  {
    "source": "1c890135",
    "target": "24c922b0",
    "confidence": 0.6
  },
  {
    "source": "33efa396",
    "target": "920a0977",
    "confidence": 0.57
  },
  {
    "source": "c7f38bf4",
    "target": "556b5801",
    "confidence": 0.57
  },
  {
    "source": "c7f38bf4",
    "target": "6a565d52",
    "confidence": 0.71
  },
  {
    "source": "cbc05683",
    "target": "590b4841",
    "confidence": 0.61
  },
  {
    "source": "cbc05683",
    "target": "7e06c948",
    "confidence": 0.62
  },
  {
    "source": "cbc05683",
    "target": "2d2fa764",
    "confidence": 0.61
  },
  {
    "source": "cbc05683",
    "target": "771a950b",
    "confidence": 0.6
  },
  {
    "source": "1b873f7e",
    "target": "f35badb9",
    "confidence": 0.49
  },
  {
    "source": "1b873f7e",
    "target": "0eadb747",
    "confidence": 0.48
  },
  {
    "source": "c75728e1",
    "target": "f35badb9",
    "confidence": 0.51
  },
  {
    "source": "c75728e1",
    "target": "1b873f7e",
    "confidence": 0.76
  },
  {
    "source": "32968e66",
    "target": "a1ea0b9c",
    "confidence": 0.68
  },
  {
    "source": "32968e66",
    "target": "768f28d0",
    "confidence": 0.57
  },
  {
    "source": "32968e66",
    "target": "17ff9ab4",
    "confidence": 0.62
  },
  {
    "source": "32968e66",
    "target": "6657fbbd",
    "confidence": 0.55
  },
  {
    "source": "32968e66",
    "target": "771a950b",
    "confidence": 0.57
  },
  {
    "source": "13eaae62",
    "target": "7e06c948",
    "confidence": 0.6
  },
  {
    "source": "13eaae62",
    "target": "396bacc6",
    "confidence": 0.79
  },
  {
    "source": "13eaae62",
    "target": "1c890135",
    "confidence": 0.59
  },
  {
    "source": "13eaae62",
    "target": "93e9f8f9",
    "confidence": 0.84
  },
  {
    "source": "768f28d0",
    "target": "2c35647f",
    "confidence": 0.67
  },
  {
    "source": "768f28d0",
    "target": "421e680f",
    "confidence": 0.68
  },
  {
    "source": "89038ccd",
    "target": "74be3d9a",
    "confidence": 0.58
  },
  {
    "source": "89038ccd",
    "target": "202e91a5",
    "confidence": 0.6
  },
  {
    "source": "184ddecc",
    "target": "1026b0fb",
    "confidence": 0.81
  },
  {
    "source": "184ddecc",
    "target": "812ec23e",
    "confidence": 0.65
  },
  {
    "source": "184ddecc",
    "target": "9dc974de",
    "confidence": 0.77
  },
  {
    "source": "184ddecc",
    "target": "25f908c0",
    "confidence": 0.67
  },
  {
    "source": "184ddecc",
    "target": "1516d201",
    "confidence": 0.78
  },
  {
    "source": "bcb2d2ed",
    "target": "9b3cb959",
    "confidence": 0.61
  },
  {
    "source": "bcb2d2ed",
    "target": "b362a86a",
    "confidence": 0.65
  },
  {
    "source": "bcb2d2ed",
    "target": "74be3d9a",
    "confidence": 0.68
  },
  {
    "source": "bcb2d2ed",
    "target": "89038ccd",
    "confidence": 0.65
  },
  {
    "source": "bcb2d2ed",
    "target": "202e91a5",
    "confidence": 0.67
  },
  {
    "source": "de024239",
    "target": "1c890135",
    "confidence": 0.76
  },
  {
    "source": "de024239",
    "target": "85351a6c",
    "confidence": 0.69
  },
  {
    "source": "a2a526fb",
    "target": "5eb80aa5",
    "confidence": 0.7
  },
  {
    "source": "a2a526fb",
    "target": "5dc77801",
    "confidence": 0.67
  },
  {
    "source": "8072c9ca",
    "target": "d041e296",
    "confidence": 0.57
  },
  {
    "source": "6738ecf9",
    "target": "37688dad",
    "confidence": 0.7
  },
  {
    "source": "6738ecf9",
    "target": "6a72e662",
    "confidence": 0.69
  },
  {
    "source": "c5a6fd02",
    "target": "5c648979",
    "confidence": 0.53
  },
  {
    "source": "c5a6fd02",
    "target": "89038ccd",
    "confidence": 0.58
  },
  {
    "source": "c5a6fd02",
    "target": "c75728e1",
    "confidence": 0.48
  },
  {
    "source": "6f5f3d7a",
    "target": "85351a6c",
    "confidence": 0.71
  },
  {
    "source": "6f5f3d7a",
    "target": "283ec879",
    "confidence": 0.59
  },
  {
    "source": "6f5f3d7a",
    "target": "1c890135",
    "confidence": 0.61
  },
  {
    "source": "6f5f3d7a",
    "target": "2107c251",
    "confidence": 0.61
  },
  {
    "source": "6335c531",
    "target": "71327717",
    "confidence": 0.64
  },
  {
    "source": "fcb300c2",
    "target": "a18b6665",
    "confidence": 0.67
  },
  {
    "source": "fcb300c2",
    "target": "f0ee5389",
    "confidence": 0.65
  },
  {
    "source": "f2659aaa",
    "target": "f0ee5389",
    "confidence": 0.61
  },
  {
    "source": "f2659aaa",
    "target": "67852f37",
    "confidence": 0.63
  },
  {
    "source": "f2659aaa",
    "target": "fcb300c2",
    "confidence": 0.71
  },
  {
    "source": "8452733e",
    "target": "fcb300c2",
    "confidence": 0.88
  },
  {
    "source": "8452733e",
    "target": "f2659aaa",
    "confidence": 0.68
  },
  {
    "source": "8452733e",
    "target": "a357dfa8",
    "confidence": 0.67
  },
  {
    "source": "8452733e",
    "target": "9c838abb",
    "confidence": 0.67
  },
  {
    "source": "9c838abb",
    "target": "b46c4f5d",
    "confidence": 0.68
  },
  {
    "source": "9c838abb",
    "target": "a357dfa8",
    "confidence": 0.7
  },
  {
    "source": "9c838abb",
    "target": "f2659aaa",
    "confidence": 0.59
  },
  {
    "source": "9c838abb",
    "target": "6915cd56",
    "confidence": 0.86
  },
  {
    "source": "9c838abb",
    "target": "f0ee5389",
    "confidence": 0.71
  },
  {
    "source": "ec1a7e77",
    "target": "b46c4f5d",
    "confidence": 0.72
  },
  {
    "source": "ec1a7e77",
    "target": "6915cd56",
    "confidence": 0.75
  },
  {
    "source": "ec1a7e77",
    "target": "9c838abb",
    "confidence": 0.73
  },
  {
    "source": "ec1a7e77",
    "target": "a357dfa8",
    "confidence": 0.64
  },
  {
    "source": "8a69f457",
    "target": "034ebb60",
    "confidence": 0.83
  },
  {
    "source": "8a69f457",
    "target": "c25dd86c",
    "confidence": 0.77
  },
  {
    "source": "8a69f457",
    "target": "86bebae9",
    "confidence": 0.79
  },
  {
    "source": "034ebb60",
    "target": "86bebae9",
    "confidence": 0.73
  },
  {
    "source": "034ebb60",
    "target": "c25dd86c",
    "confidence": 0.72
  },
  {
    "source": "6bbfb9e9",
    "target": "034ebb60",
    "confidence": 0.81
  },
  {
    "source": "6bbfb9e9",
    "target": "8a69f457",
    "confidence": 0.94
  },
  {
    "source": "6bbfb9e9",
    "target": "a5d1e558",
    "confidence": 0.76
  },
  {
    "source": "6bbfb9e9",
    "target": "86bebae9",
    "confidence": 0.77
  },
  {
    "source": "654cba2e",
    "target": "c25dd86c",
    "confidence": 0.7
  },
  {
    "source": "654cba2e",
    "target": "8a69f457",
    "confidence": 0.8
  },
  {
    "source": "654cba2e",
    "target": "034ebb60",
    "confidence": 0.93
  },
  {
    "source": "654cba2e",
    "target": "6bbfb9e9",
    "confidence": 0.78
  },
  {
    "source": "654cba2e",
    "target": "86bebae9",
    "confidence": 0.72
  },
  {
    "source": "79fdf425",
    "target": "c25dd86c",
    "confidence": 0.8
  },
  {
    "source": "79fdf425",
    "target": "8a69f457",
    "confidence": 0.74
  },
  {
    "source": "19be21ea",
    "target": "811328b8",
    "confidence": 0.71
  },
  {
    "source": "19be21ea",
    "target": "21e43253",
    "confidence": 0.72
  },
  {
    "source": "19be21ea",
    "target": "bcd2bf34",
    "confidence": 0.73
  },
  {
    "source": "19be21ea",
    "target": "7a06e089",
    "confidence": 0.71
  },
  {
    "source": "d85b4cb1",
    "target": "79fdf425",
    "confidence": 0.73
  },
  {
    "source": "d85b4cb1",
    "target": "21e43253",
    "confidence": 0.75
  },
  {
    "source": "d85b4cb1",
    "target": "bcd2bf34",
    "confidence": 0.78
  },
  {
    "source": "d85b4cb1",
    "target": "811328b8",
    "confidence": 0.76
  },
  {
    "source": "d85b4cb1",
    "target": "19be21ea",
    "confidence": 0.83
  },
  {
    "source": "95c55296",
    "target": "1516d201",
    "confidence": 0.8
  },
  {
    "source": "95c55296",
    "target": "1026b0fb",
    "confidence": 0.73
  },
  {
    "source": "95c55296",
    "target": "9dc974de",
    "confidence": 0.79
  },
  {
    "source": "95c55296",
    "target": "184ddecc",
    "confidence": 0.88
  },
  {
    "source": "11d26b1b",
    "target": "8e1de309",
    "confidence": 0.84
  },
  {
    "source": "11d26b1b",
    "target": "e458e31c",
    "confidence": 0.81
  },
  {
    "source": "11d26b1b",
    "target": "aae279fa",
    "confidence": 0.8
  },
  {
    "source": "11d26b1b",
    "target": "18d48d6a",
    "confidence": 0.84
  },
  {
    "source": "40506927",
    "target": "6f5f3d7a",
    "confidence": 0.8
  },
  {
    "source": "40506927",
    "target": "1c890135",
    "confidence": 0.59
  },
  {
    "source": "40506927",
    "target": "85351a6c",
    "confidence": 0.61
  },
  {
    "source": "436bfcd3",
    "target": "2107c251",
    "confidence": 0.57
  },
  {
    "source": "436bfcd3",
    "target": "1c890135",
    "confidence": 0.6
  },
  {
    "source": "436bfcd3",
    "target": "40506927",
    "confidence": 0.75
  },
  {
    "source": "436bfcd3",
    "target": "6f5f3d7a",
    "confidence": 0.81
  },
  {
    "source": "436bfcd3",
    "target": "85351a6c",
    "confidence": 0.62
  },
  {
    "source": "17930d92",
    "target": "ddd14ae3",
    "confidence": 0.72
  },
  {
    "source": "17930d92",
    "target": "449ea271",
    "confidence": 0.77
  },
  {
    "source": "17930d92",
    "target": "15da530a",
    "confidence": 0.69
  },
  {
    "source": "3f1ef044",
    "target": "49b2393f",
    "confidence": 0.67
  },
  {
    "source": "3f1ef044",
    "target": "ddd14ae3",
    "confidence": 0.73
  },
  {
    "source": "3f1ef044",
    "target": "17930d92",
    "confidence": 0.86
  },
  {
    "source": "3f1ef044",
    "target": "449ea271",
    "confidence": 0.84
  },
  {
    "source": "e2c04cb1",
    "target": "ddd14ae3",
    "confidence": 0.71
  },
  {
    "source": "e2c04cb1",
    "target": "17930d92",
    "confidence": 0.75
  },
  {
    "source": "e2c04cb1",
    "target": "449ea271",
    "confidence": 0.8
  },
  {
    "source": "e2c04cb1",
    "target": "3f1ef044",
    "confidence": 0.8
  },
  {
    "source": "e2c04cb1",
    "target": "49b2393f",
    "confidence": 0.7
  },
  {
    "source": "259bea0c",
    "target": "421e680f",
    "confidence": 0.89
  },
  {
    "source": "259bea0c",
    "target": "d3823c15",
    "confidence": 0.79
  },
  {
    "source": "259bea0c",
    "target": "2c35647f",
    "confidence": 0.9
  },
  {
    "source": "70d42f14",
    "target": "f785a439",
    "confidence": 0.64
  },
  {
    "source": "70d42f14",
    "target": "6a72e662",
    "confidence": 0.62
  },
  {
    "source": "e0706c1f",
    "target": "a2a526fb",
    "confidence": 0.73
  },
  {
    "source": "e0706c1f",
    "target": "d041e296",
    "confidence": 0.73
  },
  {
    "source": "065336c9",
    "target": "8e1de309",
    "confidence": 0.84
  },
  {
    "source": "065336c9",
    "target": "1f6c8a5e",
    "confidence": 0.73
  },
  {
    "source": "065336c9",
    "target": "b2b2c029",
    "confidence": 0.76
  },
  {
    "source": "065336c9",
    "target": "aae279fa",
    "confidence": 0.79
  },
  {
    "source": "065336c9",
    "target": "be08a2e2",
    "confidence": 0.68
  },
  {
    "source": "065336c9",
    "target": "11d26b1b",
    "confidence": 0.79
  },
  {
    "source": "065336c9",
    "target": "18d48d6a",
    "confidence": 0.82
  },
  {
    "source": "065336c9",
    "target": "484024e3",
    "confidence": 0.71
  },
  {
    "source": "065336c9",
    "target": "e458e31c",
    "confidence": 0.86
  },
  {
    "source": "a0f66f7c",
    "target": "920a0977",
    "confidence": 0.49
  },
  {
    "source": "a0f66f7c",
    "target": "c75728e1",
    "confidence": 0.74
  },
  {
    "source": "a0f66f7c",
    "target": "f35badb9",
    "confidence": 0.54
  },
  {
    "source": "a0f66f7c",
    "target": "1b873f7e",
    "confidence": 0.68
  },
  {
    "source": "97d66247",
    "target": "89038ccd",
    "confidence": 0.71
  },
  {
    "source": "97d66247",
    "target": "bcb2d2ed",
    "confidence": 0.63
  },
  {
    "source": "97d66247",
    "target": "c5a6fd02",
    "confidence": 0.73
  },
  {
    "source": "97d66247",
    "target": "74be3d9a",
    "confidence": 0.62
  },
  {
    "source": "396bacc6",
    "target": "93e9f8f9",
    "confidence": 0.9
  },
  {
    "source": "396bacc6",
    "target": "41118414",
    "confidence": 0.65
  },
  {
    "source": "8b5f33bc",
    "target": "82c20686",
    "confidence": 0.76
  },
  {
    "source": "8b5f33bc",
    "target": "73825afb",
    "confidence": 0.79
  },
  {
    "source": "93e9f8f9",
    "target": "396bacc6",
    "confidence": 0.9
  },
  {
    "source": "c0c1ee16",
    "target": "421e680f",
    "confidence": 0.83
  },
  {
    "source": "c0c1ee16",
    "target": "2c35647f",
    "confidence": 0.82
  },
  {
    "source": "c0c1ee16",
    "target": "259bea0c",
    "confidence": 0.87
  },
  {
    "source": "c0c1ee16",
    "target": "d3823c15",
    "confidence": 0.73
  },
  {
    "source": "992d2f01",
    "target": "ab2ffcf1",
    "confidence": 0.66
  },
  {
    "source": "992d2f01",
    "target": "396bacc6",
    "confidence": 0.65
  },
  {
    "source": "992d2f01",
    "target": "7e06c948",
    "confidence": 0.69
  },
  {
    "source": "992d2f01",
    "target": "13eaae62",
    "confidence": 0.65
  },
  {
    "source": "992d2f01",
    "target": "93e9f8f9",
    "confidence": 0.65
  },
  {
    "source": "68b1f8c2",
    "target": "de024239",
    "confidence": 0.72
  },
  {
    "source": "68b1f8c2",
    "target": "6f5f3d7a",
    "confidence": 0.65
  },
  {
    "source": "68b1f8c2",
    "target": "85351a6c",
    "confidence": 0.63
  },
  {
    "source": "46341b52",
    "target": "37688dad",
    "confidence": 0.76
  },
  {
    "source": "46341b52",
    "target": "67d45e81",
    "confidence": 0.8
  },
  {
    "source": "46341b52",
    "target": "7e5a3994",
    "confidence": 0.69
  },
  {
    "source": "46341b52",
    "target": "d8c60f80",
    "confidence": 0.77
  },
  {
    "source": "46341b52",
    "target": "38c575dc",
    "confidence": 0.82
  },
  {
    "source": "46341b52",
    "target": "6b737d82",
    "confidence": 0.87
  },
  {
    "source": "e2b1f5c1",
    "target": "68b1f8c2",
    "confidence": 0.91
  },
  {
    "source": "e2b1f5c1",
    "target": "de024239",
    "confidence": 0.65
  },
  {
    "source": "6b737d82",
    "target": "899b7fc5",
    "confidence": 0.85
  },
  {
    "source": "6b737d82",
    "target": "8bd9418d",
    "confidence": 0.82
  },
  {
    "source": "6b737d82",
    "target": "35235662",
    "confidence": 0.79
  },
  {
    "source": "6b737d82",
    "target": "37688dad",
    "confidence": 0.76
  },
  {
    "source": "6b737d82",
    "target": "38c575dc",
    "confidence": 0.88
  },
  {
    "source": "6b737d82",
    "target": "1a248c3f",
    "confidence": 0.78
  },
  {
    "source": "6b737d82",
    "target": "46341b52",
    "confidence": 0.88
  },
  {
    "source": "6b737d82",
    "target": "67d45e81",
    "confidence": 0.84
  },
  {
    "source": "60bf1355",
    "target": "de024239",
    "confidence": 0.71
  },
  {
    "source": "60bf1355",
    "target": "e2b1f5c1",
    "confidence": 0.86
  },
  {
    "source": "60bf1355",
    "target": "68b1f8c2",
    "confidence": 0.86
  },
  {
    "source": "8bd9418d",
    "target": "38c575dc",
    "confidence": 0.77
  },
  {
    "source": "8bd9418d",
    "target": "899b7fc5",
    "confidence": 0.76
  },
  {
    "source": "8bd9418d",
    "target": "6b737d82",
    "confidence": 0.83
  },
  {
    "source": "35235662",
    "target": "6b737d82",
    "confidence": 0.78
  },
  {
    "source": "35235662",
    "target": "67d45e81",
    "confidence": 0.82
  },
  {
    "source": "35235662",
    "target": "46341b52",
    "confidence": 0.75
  },
  {
    "source": "5f8a8dbb",
    "target": "de024239",
    "confidence": 0.65
  },
  {
    "source": "5f8a8dbb",
    "target": "60bf1355",
    "confidence": 0.94
  },
  {
    "source": "5f8a8dbb",
    "target": "e2b1f5c1",
    "confidence": 0.82
  },
  {
    "source": "5f8a8dbb",
    "target": "68b1f8c2",
    "confidence": 0.81
  },
  {
    "source": "defec7e8",
    "target": "a0f66f7c",
    "confidence": 0.65
  },
  {
    "source": "defec7e8",
    "target": "f35badb9",
    "confidence": 0.52
  },
  {
    "source": "defec7e8",
    "target": "560cc767",
    "confidence": 0.48
  },
  {
    "source": "defec7e8",
    "target": "1b873f7e",
    "confidence": 0.71
  },
  {
    "source": "defec7e8",
    "target": "c75728e1",
    "confidence": 0.72
  },
  {
    "source": "fdbed79e",
    "target": "8cbf6c51",
    "confidence": 0.85
  },
  {
    "source": "09b2e1e5",
    "target": "44b98e29",
    "confidence": 0.75
  },
  {
    "source": "09b2e1e5",
    "target": "63f586be",
    "confidence": 0.72
  },
  {
    "source": "1b9d7b0f",
    "target": "808b411f",
    "confidence": 0.75
  },
  {
    "source": "1b9d7b0f",
    "target": "60cb3d6a",
    "confidence": 0.7
  },
  {
    "source": "1b9d7b0f",
    "target": "14153458",
    "confidence": 0.8
  },
  {
    "source": "1b9d7b0f",
    "target": "87cb1256",
    "confidence": 0.8
  },
  {
    "source": "6e42c956",
    "target": "6915cd56",
    "confidence": 0.54
  },
  {
    "source": "6e42c956",
    "target": "24c922b0",
    "confidence": 0.52
  },
  {
    "source": "6e42c956",
    "target": "473c9cee",
    "confidence": 0.55
  },
  {
    "source": "6e42c956",
    "target": "fecbb633",
    "confidence": 0.56
  },
  {
    "source": "6e42c956",
    "target": "a357dfa8",
    "confidence": 0.55
  },
  {
    "source": "d707092c",
    "target": "39a6689b",
    "confidence": 0.65
  },
  {
    "source": "d707092c",
    "target": "d395c926",
    "confidence": 0.7
  },
  {
    "source": "e868a706",
    "target": "8cbf6c51",
    "confidence": 0.88
  },
  {
    "source": "e868a706",
    "target": "891d788a",
    "confidence": 0.83
  },
  {
    "source": "d395c926",
    "target": "f82a68b0",
    "confidence": 0.63
  },
  {
    "source": "d395c926",
    "target": "d707092c",
    "confidence": 0.7
  },
  {
    "source": "652b35e9",
    "target": "14153458",
    "confidence": 0.69
  },
  {
    "source": "652b35e9",
    "target": "52b2940f",
    "confidence": 0.69
  },
  {
    "source": "652b35e9",
    "target": "bb2895ae",
    "confidence": 0.68
  },
  {
    "source": "652b35e9",
    "target": "60cb3d6a",
    "confidence": 0.69
  },
  {
    "source": "bb2895ae",
    "target": "15b28022",
    "confidence": 0.64
  },
  {
    "source": "bb2895ae",
    "target": "652b35e9",
    "confidence": 0.68
  },
  {
    "source": "032d5a45",
    "target": "031a83c0",
    "confidence": 0.7
  },
  {
    "source": "032d5a45",
    "target": "324e26ff",
    "confidence": 0.85
  },
  {
    "source": "032d5a45",
    "target": "c24618b6",
    "confidence": 0.79
  },
  {
    "source": "032d5a45",
    "target": "cd309991",
    "confidence": 0.72
  },
  {
    "source": "c340b1b1",
    "target": "c79c24fb",
    "confidence": 0.92
  },
  {
    "source": "c340b1b1",
    "target": "bd329ca9",
    "confidence": 0.89
  },
  {
    "source": "c340b1b1",
    "target": "4eb12843",
    "confidence": 0.89
  },
  {
    "source": "c340b1b1",
    "target": "0ec8d1a5",
    "confidence": 0.91
  },
  {
    "source": "4eb12843",
    "target": "c340b1b1",
    "confidence": 0.89
  },
  {
    "source": "4eb12843",
    "target": "31c706f6",
    "confidence": 0.88
  },
  {
    "source": "4eb12843",
    "target": "bde505d7",
    "confidence": 0.87
  },
  {
    "source": "4eb12843",
    "target": "0ec8d1a5",
    "confidence": 0.91
  },
  {
    "source": "4eb12843",
    "target": "c27c48eb",
    "confidence": 0.89
  },
  {
    "source": "bde505d7",
    "target": "1395e24f",
    "confidence": 0.88
  },
  {
    "source": "bde505d7",
    "target": "0ec8d1a5",
    "confidence": 0.93
  },
  {
    "source": "1395e24f",
    "target": "d6f1ac13",
    "confidence": 0.9
  },
  {
    "source": "1395e24f",
    "target": "bd329ca9",
    "confidence": 0.89
  },
  {
    "source": "1395e24f",
    "target": "c27c48eb",
    "confidence": 0.91
  },
  {
    "source": "1395e24f",
    "target": "0ec8d1a5",
    "confidence": 0.92
  },
  {
    "source": "1395e24f",
    "target": "bde505d7",
    "confidence": 0.88
  },
  {
    "source": "c27c48eb",
    "target": "0ec8d1a5",
    "confidence": 0.91
  },
  {
    "source": "c27c48eb",
    "target": "1395e24f",
    "confidence": 0.91
  },
  {
    "source": "d6f1ac13",
    "target": "31c706f6",
    "confidence": 0.88
  },
  {
    "source": "d6f1ac13",
    "target": "bd329ca9",
    "confidence": 0.88
  },
  {
    "source": "d6f1ac13",
    "target": "c79c24fb",
    "confidence": 0.89
  },
  {
    "source": "d6f1ac13",
    "target": "0ec8d1a5",
    "confidence": 0.9
  },
  {
    "source": "d6f1ac13",
    "target": "1395e24f",
    "confidence": 0.9
  },
  {
    "source": "31c706f6",
    "target": "4eb12843",
    "confidence": 0.88
  },
  {
    "source": "31c706f6",
    "target": "0ec8d1a5",
    "confidence": 0.89
  },
  {
    "source": "412c4095",
    "target": "42baabe8",
    "confidence": 0.83
  },
  {
    "source": "412c4095",
    "target": "dd9e5eee",
    "confidence": 0.8
  },
  {
    "source": "412c4095",
    "target": "85877c54",
    "confidence": 0.78
  },
  {
    "source": "bd329ca9",
    "target": "1395e24f",
    "confidence": 0.89
  },
  {
    "source": "bd329ca9",
    "target": "c340b1b1",
    "confidence": 0.89
  },
  {
    "source": "c79c24fb",
    "target": "0ec8d1a5",
    "confidence": 0.9
  },
  {
    "source": "c79c24fb",
    "target": "c340b1b1",
    "confidence": 0.92
  },
  {
    "source": "f367ee22",
    "target": "ed1206b2",
    "confidence": 0.89
  },
  {
    "source": "f367ee22",
    "target": "c340b1b1",
    "confidence": 0.8
  },
  {
    "source": "f367ee22",
    "target": "88bfcef6",
    "confidence": 0.89
  },
  {
    "source": "8cafce0c",
    "target": "44b98e29",
    "confidence": 0.71
  },
  {
    "source": "8cafce0c",
    "target": "4d44ba53",
    "confidence": 0.7
  },
  {
    "source": "88bfcef6",
    "target": "f367ee22",
    "confidence": 0.89
  },
  {
    "source": "88bfcef6",
    "target": "c340b1b1",
    "confidence": 0.83
  },
  {
    "source": "88bfcef6",
    "target": "ed1206b2",
    "confidence": 0.94
  },
  {
    "source": "c24618b6",
    "target": "324e26ff",
    "confidence": 0.74
  },
  {
    "source": "c24618b6",
    "target": "cd309991",
    "confidence": 0.71
  },
  {
    "source": "c24618b6",
    "target": "cef214da",
    "confidence": 0.75
  },
  {
    "source": "c24618b6",
    "target": "0238c976",
    "confidence": 0.84
  },
  {
    "source": "c24618b6",
    "target": "032d5a45",
    "confidence": 0.79
  },
  {
    "source": "031a83c0",
    "target": "324e26ff",
    "confidence": 0.77
  },
  {
    "source": "031a83c0",
    "target": "032d5a45",
    "confidence": 0.7
  },
  {
    "source": "f596130d",
    "target": "5a577e3d",
    "confidence": 0.77
  },
  {
    "source": "f596130d",
    "target": "2a449e12",
    "confidence": 0.81
  },
  {
    "source": "1f58a25a",
    "target": "71327717",
    "confidence": 0.79
  },
  {
    "source": "1f58a25a",
    "target": "58404a8f",
    "confidence": 0.65
  },
  {
    "source": "1f58a25a",
    "target": "96b300ee",
    "confidence": 0.85
  },
  {
    "source": "1566632d",
    "target": "42baabe8",
    "confidence": 0.86
  },
  {
    "source": "1566632d",
    "target": "dd9e5eee",
    "confidence": 0.79
  },
  {
    "source": "1566632d",
    "target": "412c4095",
    "confidence": 0.86
  },
  {
    "source": "1566632d",
    "target": "85877c54",
    "confidence": 0.79
  },
  {
    "source": "96b300ee",
    "target": "1f58a25a",
    "confidence": 0.85
  },
  {
    "source": "96b300ee",
    "target": "2d2fa764",
    "confidence": 0.61
  },
  {
    "source": "96b300ee",
    "target": "71327717",
    "confidence": 0.68
  },
  {
    "source": "71327717",
    "target": "58404a8f",
    "confidence": 0.84
  },
  {
    "source": "71327717",
    "target": "1f58a25a",
    "confidence": 0.79
  },
  {
    "source": "71327717",
    "target": "e2965509",
    "confidence": 0.6
  },
  {
    "source": "71327717",
    "target": "96b300ee",
    "confidence": 0.68
  },
  {
    "source": "9b4b83a7",
    "target": "b6d2192d",
    "confidence": 0.6
  },
  {
    "source": "9b4b83a7",
    "target": "c84d7088",
    "confidence": 0.59
  },
  {
    "source": "9b4b83a7",
    "target": "56442841",
    "confidence": 0.63
  },
  {
    "source": "9b4b83a7",
    "target": "98d2ca01",
    "confidence": 0.62
  },
  {
    "source": "eee56dce",
    "target": "15da530a",
    "confidence": 0.66
  },
  {
    "source": "eee56dce",
    "target": "56a1067e",
    "confidence": 0.65
  },
  {
    "source": "58404a8f",
    "target": "1f58a25a",
    "confidence": 0.65
  },
  {
    "source": "58404a8f",
    "target": "71327717",
    "confidence": 0.84
  },
  {
    "source": "fab8fae9",
    "target": "89e7af05",
    "confidence": 0.71
  },
  {
    "source": "fab8fae9",
    "target": "a5d1e558",
    "confidence": 0.68
  },
  {
    "source": "fab8fae9",
    "target": "8cafce0c",
    "confidence": 0.93
  },
  {
    "source": "fab8fae9",
    "target": "ff61ad30",
    "confidence": 0.7
  },
  {
    "source": "088fbd95",
    "target": "ba56b992",
    "confidence": 0.71
  },
  {
    "source": "088fbd95",
    "target": "7166c42e",
    "confidence": 0.63
  },
  {
    "source": "7166c42e",
    "target": "ba56b992",
    "confidence": 0.63
  },
  {
    "source": "7166c42e",
    "target": "088fbd95",
    "confidence": 0.63
  },
  {
    "source": "7166c42e",
    "target": "c9fc6032",
    "confidence": 0.62
  },
  {
    "source": "58917d63",
    "target": "1b1e47f1",
    "confidence": 0.88
  },
  {
    "source": "58917d63",
    "target": "8ce78d6f",
    "confidence": 0.55
  },
  {
    "source": "58917d63",
    "target": "5dbe1c48",
    "confidence": 0.9
  },
  {
    "source": "58917d63",
    "target": "cc2c0152",
    "confidence": 0.91
  },
  {
    "source": "cc2c0152",
    "target": "58917d63",
    "confidence": 0.94
  },
  {
    "source": "cc2c0152",
    "target": "8ce78d6f",
    "confidence": 0.54
  },
  {
    "source": "384333a0",
    "target": "331fa22e",
    "confidence": 0.73
  },
  {
    "source": "384333a0",
    "target": "5deb01c2",
    "confidence": 0.7
  },
  {
    "source": "384333a0",
    "target": "bef6c19b",
    "confidence": 0.66
  },
  {
    "source": "384333a0",
    "target": "590b4841",
    "confidence": 0.77
  },
  {
    "source": "e7359e73",
    "target": "412c4095",
    "confidence": 0.75
  },
  {
    "source": "e7359e73",
    "target": "1566632d",
    "confidence": 0.75
  },
  {
    "source": "e7359e73",
    "target": "8a69f457",
    "confidence": 0.71
  },
  {
    "source": "e7359e73",
    "target": "85877c54",
    "confidence": 0.72
  },
  {
    "source": "a28a1d96",
    "target": "fe361e00",
    "confidence": 0.81
  },
  {
    "source": "a28a1d96",
    "target": "6f7991c3",
    "confidence": 0.76
  },
  {
    "source": "a28a1d96",
    "target": "80d17c7b",
    "confidence": 0.76
  },
  {
    "source": "fe361e00",
    "target": "80d17c7b",
    "confidence": 0.87
  },
  {
    "source": "fe361e00",
    "target": "cbd55411",
    "confidence": 0.75
  },
  {
    "source": "fe361e00",
    "target": "6f7991c3",
    "confidence": 0.77
  },
  {
    "source": "fe361e00",
    "target": "a28a1d96",
    "confidence": 0.81
  },
  {
    "source": "6f7991c3",
    "target": "3c8361d1",
    "confidence": 0.66
  },
  {
    "source": "6f7991c3",
    "target": "fe361e00",
    "confidence": 0.78
  },
  {
    "source": "6f7991c3",
    "target": "a28a1d96",
    "confidence": 0.77
  },
  {
    "source": "0f39d1d0",
    "target": "4d44ba53",
    "confidence": 0.73
  },
  {
    "source": "0f39d1d0",
    "target": "a794ada0",
    "confidence": 0.72
  },
  {
    "source": "0f39d1d0",
    "target": "b798b44d",
    "confidence": 0.74
  },
  {
    "source": "0f39d1d0",
    "target": "8cafce0c",
    "confidence": 0.72
  },
  {
    "source": "779a54d1",
    "target": "20b66d65",
    "confidence": 0.72
  },
  {
    "source": "779a54d1",
    "target": "8cafce0c",
    "confidence": 0.77
  },
  {
    "source": "779a54d1",
    "target": "b798b44d",
    "confidence": 0.69
  },
  {
    "source": "779a54d1",
    "target": "0f39d1d0",
    "confidence": 0.8
  },
  {
    "source": "779a54d1",
    "target": "4d44ba53",
    "confidence": 0.72
  },
  {
    "source": "779a54d1",
    "target": "fab8fae9",
    "confidence": 0.74
  },
  {
    "source": "73a7b195",
    "target": "bef6c19b",
    "confidence": 0.73
  },
  {
    "source": "73a7b195",
    "target": "384333a0",
    "confidence": 0.57
  },
  {
    "source": "ff61ad30",
    "target": "89e7af05",
    "confidence": 0.83
  },
  {
    "source": "ff61ad30",
    "target": "dde2d07a",
    "confidence": 0.84
  },
  {
    "source": "5554b93a",
    "target": "f407754c",
    "confidence": 0.73
  },
  {
    "source": "5554b93a",
    "target": "fe81fa43",
    "confidence": 0.81
  },
  {
    "source": "f407754c",
    "target": "fe81fa43",
    "confidence": 0.7
  },
  {
    "source": "f407754c",
    "target": "5554b93a",
    "confidence": 0.73
  },
  {
    "source": "f407754c",
    "target": "3ef5f003",
    "confidence": 0.69
  },
  {
    "source": "67852f37",
    "target": "f0ee5389",
    "confidence": 0.86
  },
  {
    "source": "67852f37",
    "target": "f82a68b0",
    "confidence": 0.66
  },
  {
    "source": "67852f37",
    "target": "a357dfa8",
    "confidence": 0.77
  },
  {
    "source": "8510510c",
    "target": "811328b8",
    "confidence": 0.59
  },
  {
    "source": "8510510c",
    "target": "0f39d1d0",
    "confidence": 0.72
  },
  {
    "source": "8510510c",
    "target": "f660097c",
    "confidence": 0.59
  },
  {
    "source": "8510510c",
    "target": "4d44ba53",
    "confidence": 0.59
  },
  {
    "source": "8510510c",
    "target": "779a54d1",
    "confidence": 0.71
  },
  {
    "source": "165a9245",
    "target": "14153458",
    "confidence": 0.69
  },
  {
    "source": "165a9245",
    "target": "84ce2585",
    "confidence": 0.65
  },
  {
    "source": "165a9245",
    "target": "65b452ff",
    "confidence": 0.68
  },
  {
    "source": "165a9245",
    "target": "87cb1256",
    "confidence": 0.72
  },
  {
    "source": "165a9245",
    "target": "f59ea0d5",
    "confidence": 0.77
  },
  {
    "source": "65b452ff",
    "target": "165a9245",
    "confidence": 0.68
  },
  {
    "source": "65b452ff",
    "target": "f82a68b0",
    "confidence": 0.69
  },
  {
    "source": "944d72a4",
    "target": "f59ea0d5",
    "confidence": 0.7
  },
  {
    "source": "944d72a4",
    "target": "3ef5f003",
    "confidence": 0.76
  },
  {
    "source": "944d72a4",
    "target": "acbc47ee",
    "confidence": 0.74
  },
  {
    "source": "acbc47ee",
    "target": "944d72a4",
    "confidence": 0.74
  },
  {
    "source": "acbc47ee",
    "target": "fecbb633",
    "confidence": 0.61
  },
  {
    "source": "acbc47ee",
    "target": "7f54d9f5",
    "confidence": 0.65
  },
  {
    "source": "acbc47ee",
    "target": "52b2940f",
    "confidence": 0.67
  },
  {
    "source": "dcd74763",
    "target": "e2965509",
    "confidence": 0.54
  },
  {
    "source": "dcd74763",
    "target": "7071fc23",
    "confidence": 0.58
  },
  {
    "source": "dcd74763",
    "target": "a996cfda",
    "confidence": 0.55
  },
  {
    "source": "7f54d9f5",
    "target": "e762c6c7",
    "confidence": 0.75
  },
  {
    "source": "7f54d9f5",
    "target": "1555f94b",
    "confidence": 0.77
  },
  {
    "source": "52b2940f",
    "target": "2551e62f",
    "confidence": 0.7
  },
  {
    "source": "52b2940f",
    "target": "acbc47ee",
    "confidence": 0.67
  },
  {
    "source": "52b2940f",
    "target": "be08a2e2",
    "confidence": 0.69
  },
  {
    "source": "52b2940f",
    "target": "a18b6665",
    "confidence": 0.74
  },
  {
    "source": "baa3420b",
    "target": "d53ead70",
    "confidence": 0.83
  },
  {
    "source": "baa3420b",
    "target": "ff81c4c2",
    "confidence": 0.83
  },
  {
    "source": "baa3420b",
    "target": "052d3ba0",
    "confidence": 0.85
  },
  {
    "source": "049d3e16",
    "target": "d53ead70",
    "confidence": 0.59
  },
  {
    "source": "049d3e16",
    "target": "ff81c4c2",
    "confidence": 0.6
  },
  {
    "source": "049d3e16",
    "target": "baa3420b",
    "confidence": 0.61
  },
  {
    "source": "049d3e16",
    "target": "ce9f2bd6",
    "confidence": 0.6
  },
  {
    "source": "26dcecc3",
    "target": "a996cfda",
    "confidence": 0.58
  },
  {
    "source": "26dcecc3",
    "target": "7071fc23",
    "confidence": 0.59
  },
  {
    "source": "26dcecc3",
    "target": "dcd74763",
    "confidence": 0.8
  },
  {
    "source": "85877c54",
    "target": "42baabe8",
    "confidence": 0.78
  },
  {
    "source": "85877c54",
    "target": "dd9e5eee",
    "confidence": 0.76
  },
  {
    "source": "85877c54",
    "target": "7abd1f95",
    "confidence": 0.87
  },
  {
    "source": "7abd1f95",
    "target": "c25dd86c",
    "confidence": 0.75
  },
  {
    "source": "7abd1f95",
    "target": "85877c54",
    "confidence": 0.87
  },
  {
    "source": "dd9e5eee",
    "target": "42baabe8",
    "confidence": 0.81
  },
  {
    "source": "9713a513",
    "target": "89e7af05",
    "confidence": 0.8
  },
  {
    "source": "9713a513",
    "target": "c0675d4c",
    "confidence": 0.83
  },
  {
    "source": "86bebae9",
    "target": "f660097c",
    "confidence": 0.76
  },
  {
    "source": "44b98e29",
    "target": "b87ed21f",
    "confidence": 0.72
  },
  {
    "source": "44b98e29",
    "target": "c0675d4c",
    "confidence": 0.75
  },
  {
    "source": "44b98e29",
    "target": "4d44ba53",
    "confidence": 0.75
  },
  {
    "source": "44b98e29",
    "target": "09b2e1e5",
    "confidence": 0.75
  },
  {
    "source": "44b98e29",
    "target": "63f586be",
    "confidence": 0.83
  },
  {
    "source": "ae4a3d83",
    "target": "e5cffcbd",
    "confidence": 0.9
  },
  {
    "source": "ae4a3d83",
    "target": "ea8a0669",
    "confidence": 0.86
  },
  {
    "source": "c0675d4c",
    "target": "811328b8",
    "confidence": 0.88
  },
  {
    "source": "c0675d4c",
    "target": "89e7af05",
    "confidence": 0.94
  },
  {
    "source": "c0675d4c",
    "target": "9713a513",
    "confidence": 0.83
  },
  {
    "source": "8fe33575",
    "target": "7a06e089",
    "confidence": 0.7
  },
  {
    "source": "8fe33575",
    "target": "76eedcca",
    "confidence": 0.67
  },
  {
    "source": "8fe33575",
    "target": "115b3abd",
    "confidence": 0.69
  },
  {
    "source": "8fe33575",
    "target": "86bebae9",
    "confidence": 0.67
  },
  {
    "source": "4b2a6104",
    "target": "1bae87b9",
    "confidence": 0.66
  },
  {
    "source": "4b2a6104",
    "target": "c9a123b4",
    "confidence": 0.63
  },
  {
    "source": "4b2a6104",
    "target": "7ac15094",
    "confidence": 0.64
  },
  {
    "source": "4b2a6104",
    "target": "a5d1e558",
    "confidence": 0.69
  },
  {
    "source": "4b2a6104",
    "target": "5361811c",
    "confidence": 0.64
  },
  {
    "source": "06b41849",
    "target": "20b66d65",
    "confidence": 0.66
  },
  {
    "source": "06b41849",
    "target": "4d44ba53",
    "confidence": 0.68
  },
  {
    "source": "06b41849",
    "target": "1395e24f",
    "confidence": 0.65
  },
  {
    "source": "06b41849",
    "target": "44b98e29",
    "confidence": 0.66
  },
  {
    "source": "06b41849",
    "target": "b762c64a",
    "confidence": 0.66
  },
  {
    "source": "f62101da",
    "target": "41836b44",
    "confidence": 0.83
  },
  {
    "source": "f62101da",
    "target": "b762c64a",
    "confidence": 0.79
  },
  {
    "source": "f62101da",
    "target": "ad318027",
    "confidence": 0.8
  },
  {
    "source": "f62101da",
    "target": "ae4a3d83",
    "confidence": 0.82
  },
  {
    "source": "f62101da",
    "target": "ea8a0669",
    "confidence": 0.87
  },
  {
    "source": "f62101da",
    "target": "b7335fc3",
    "confidence": 0.79
  },
  {
    "source": "f62101da",
    "target": "7473081c",
    "confidence": 0.82
  },
  {
    "source": "bff8bcfb",
    "target": "f01f07c0",
    "confidence": 0.66
  },
  {
    "source": "bff8bcfb",
    "target": "b38b70f4",
    "confidence": 0.62
  },
  {
    "source": "bff8bcfb",
    "target": "fc1ba7b8",
    "confidence": 0.65
  },
  {
    "source": "e14aaa8f",
    "target": "1f58a25a",
    "confidence": 0.5
  },
  {
    "source": "e14aaa8f",
    "target": "96b300ee",
    "confidence": 0.5
  },
  {
    "source": "e14aaa8f",
    "target": "bff8bcfb",
    "confidence": 0.52
  },
  {
    "source": "7d3ae136",
    "target": "f9cc7272",
    "confidence": 0.53
  },
  {
    "source": "7d3ae136",
    "target": "e14aaa8f",
    "confidence": 0.73
  },
  {
    "source": "7d3ae136",
    "target": "9b4b83a7",
    "confidence": 0.57
  },
  {
    "source": "303706d1",
    "target": "56a1067e",
    "confidence": 0.63
  },
  {
    "source": "303706d1",
    "target": "f01f07c0",
    "confidence": 0.7
  },
  {
    "source": "3b4f7e97",
    "target": "0d4dee1a",
    "confidence": 0.91
  },
  {
    "source": "3b4f7e97",
    "target": "21e43253",
    "confidence": 0.82
  },
  {
    "source": "3b4f7e97",
    "target": "c9a123b4",
    "confidence": 0.8
  },
  {
    "source": "23261095",
    "target": "de1c4994",
    "confidence": 0.69
  },
  {
    "source": "23261095",
    "target": "b87ed21f",
    "confidence": 0.66
  },
  {
    "source": "340f748f",
    "target": "92f6487f",
    "confidence": 0.63
  },
  {
    "source": "340f748f",
    "target": "de1c4994",
    "confidence": 0.62
  },
  {
    "source": "340f748f",
    "target": "23261095",
    "confidence": 0.7
  },
  {
    "source": "65bf4cb7",
    "target": "ac5bc0e0",
    "confidence": 0.71
  },
  {
    "source": "12a82302",
    "target": "ac5bc0e0",
    "confidence": 0.88
  },
  {
    "source": "12a82302",
    "target": "65bf4cb7",
    "confidence": 0.72
  },
  {
    "source": "844ed030",
    "target": "12a82302",
    "confidence": 0.9
  },
  {
    "source": "844ed030",
    "target": "ac5bc0e0",
    "confidence": 0.88
  },
  {
    "source": "844ed030",
    "target": "65bf4cb7",
    "confidence": 0.71
  },
  {
    "source": "b46c4f5d",
    "target": "6915cd56",
    "confidence": 0.7
  },
  {
    "source": "b46c4f5d",
    "target": "9c838abb",
    "confidence": 0.66
  },
  {
    "source": "b46c4f5d",
    "target": "ec1a7e77",
    "confidence": 0.73
  },
  {
    "source": "533a197a",
    "target": "edf67988",
    "confidence": 0.89
  },
  {
    "source": "533a197a",
    "target": "b2917c87",
    "confidence": 0.61
  },
  {
    "source": "533a197a",
    "target": "5eb80aa5",
    "confidence": 0.65
  },
  {
    "source": "533a197a",
    "target": "6657fbbd",
    "confidence": 0.59
  },
  {
    "source": "edf67988",
    "target": "771a950b",
    "confidence": 0.65
  },
  {
    "source": "edf67988",
    "target": "533a197a",
    "confidence": 0.89
  },
  {
    "source": "324e26ff",
    "target": "032d5a45",
    "confidence": 0.85
  },
  {
    "source": "324e26ff",
    "target": "031a83c0",
    "confidence": 0.77
  },
  {
    "source": "14249bdc",
    "target": "9aca9e2c",
    "confidence": 0.88
  },
  {
    "source": "cb8a26f7",
    "target": "1db2ee60",
    "confidence": 0.68
  },
  {
    "source": "cbd55411",
    "target": "fe361e00",
    "confidence": 0.75
  },
  {
    "source": "cbd55411",
    "target": "80d17c7b",
    "confidence": 0.87
  },
  {
    "source": "80d17c7b",
    "target": "cbd55411",
    "confidence": 0.87
  },
  {
    "source": "80d17c7b",
    "target": "fe361e00",
    "confidence": 0.87
  },
  {
    "source": "80d17c7b",
    "target": "a28a1d96",
    "confidence": 0.76
  },
  {
    "source": "80d17c7b",
    "target": "6f7991c3",
    "confidence": 0.73
  },
  {
    "source": "4884c5c6",
    "target": "998a86c4",
    "confidence": 0.74
  },
  {
    "source": "4884c5c6",
    "target": "f5523e83",
    "confidence": 0.7
  },
  {
    "source": "4884c5c6",
    "target": "d782b600",
    "confidence": 0.69
  },
  {
    "source": "89e7af05",
    "target": "a772b977",
    "confidence": 0.77
  },
  {
    "source": "89e7af05",
    "target": "462d2756",
    "confidence": 0.88
  },
  {
    "source": "89e7af05",
    "target": "ff61ad30",
    "confidence": 0.83
  },
  {
    "source": "89e7af05",
    "target": "dde2d07a",
    "confidence": 0.87
  },
  {
    "source": "89e7af05",
    "target": "11f957b1",
    "confidence": 0.82
  },
  {
    "source": "89e7af05",
    "target": "9713a513",
    "confidence": 0.8
  },
  {
    "source": "89e7af05",
    "target": "c0675d4c",
    "confidence": 0.93
  },
  {
    "source": "4e42c198",
    "target": "1d9a20ed",
    "confidence": 0.88
  },
  {
    "source": "4e42c198",
    "target": "84cb89ee",
    "confidence": 0.91
  },
  {
    "source": "4e42c198",
    "target": "b3200f55",
    "confidence": 0.93
  },
  {
    "source": "21e43253",
    "target": "44f62544",
    "confidence": 0.8
  },
  {
    "source": "21e43253",
    "target": "7a06e089",
    "confidence": 0.85
  },
  {
    "source": "21e43253",
    "target": "3b4f7e97",
    "confidence": 0.82
  },
  {
    "source": "21e43253",
    "target": "dde2d07a",
    "confidence": 0.86
  },
  {
    "source": "21e43253",
    "target": "811328b8",
    "confidence": 0.89
  },
  {
    "source": "21e43253",
    "target": "0d4dee1a",
    "confidence": 0.8
  },
  {
    "source": "7a06e089",
    "target": "21e43253",
    "confidence": 0.85
  },
  {
    "source": "7a06e089",
    "target": "bcd2bf34",
    "confidence": 0.81
  },
  {
    "source": "7a06e089",
    "target": "44f62544",
    "confidence": 0.84
  },
  {
    "source": "7a06e089",
    "target": "dde2d07a",
    "confidence": 0.84
  },
  {
    "source": "7a06e089",
    "target": "60159ada",
    "confidence": 0.73
  },
  {
    "source": "033b7f08",
    "target": "6f5f3d7a",
    "confidence": 0.57
  },
  {
    "source": "033b7f08",
    "target": "41118414",
    "confidence": 0.58
  },
  {
    "source": "42baabe8",
    "target": "dd9e5eee",
    "confidence": 0.81
  },
  {
    "source": "4e7b4100",
    "target": "5554b93a",
    "confidence": 0.73
  },
  {
    "source": "4e7b4100",
    "target": "fe81fa43",
    "confidence": 0.8
  },
  {
    "source": "4e7b4100",
    "target": "3ef5f003",
    "confidence": 0.74
  },
  {
    "source": "4e7b4100",
    "target": "9f56e7c9",
    "confidence": 0.72
  },
  {
    "source": "4e7b4100",
    "target": "443d2919",
    "confidence": 0.74
  },
  {
    "source": "0982a977",
    "target": "de024239",
    "confidence": 0.66
  },
  {
    "source": "0982a977",
    "target": "c5a6fd02",
    "confidence": 0.61
  },
  {
    "source": "0982a977",
    "target": "68b1f8c2",
    "confidence": 0.63
  },
  {
    "source": "5c657965",
    "target": "e5cffcbd",
    "confidence": 0.76
  },
  {
    "source": "7473081c",
    "target": "ea8a0669",
    "confidence": 0.84
  },
  {
    "source": "7473081c",
    "target": "b7335fc3",
    "confidence": 0.81
  },
  {
    "source": "7473081c",
    "target": "ad318027",
    "confidence": 0.86
  },
  {
    "source": "7473081c",
    "target": "76eedcca",
    "confidence": 0.71
  },
  {
    "source": "76eedcca",
    "target": "c394909f",
    "confidence": 0.71
  },
  {
    "source": "76eedcca",
    "target": "a794ada0",
    "confidence": 0.71
  },
  {
    "source": "76eedcca",
    "target": "ab2ffcf1",
    "confidence": 0.7
  },
  {
    "source": "7f503589",
    "target": "baa3420b",
    "confidence": 0.83
  },
  {
    "source": "7f503589",
    "target": "904813fe",
    "confidence": 0.79
  },
  {
    "source": "7f503589",
    "target": "5abd7ce0",
    "confidence": 0.71
  },
  {
    "source": "7f503589",
    "target": "ff81c4c2",
    "confidence": 0.81
  },
  {
    "source": "7f503589",
    "target": "052d3ba0",
    "confidence": 0.91
  },
  {
    "source": "7f503589",
    "target": "d53ead70",
    "confidence": 0.8
  },
  {
    "source": "87cb1256",
    "target": "1b9d7b0f",
    "confidence": 0.8
  },
  {
    "source": "998a86c4",
    "target": "0a830e20",
    "confidence": 0.73
  },
  {
    "source": "998a86c4",
    "target": "4884c5c6",
    "confidence": 0.74
  },
  {
    "source": "998a86c4",
    "target": "f5523e83",
    "confidence": 0.77
  },
  {
    "source": "a794ada0",
    "target": "7ac15094",
    "confidence": 0.84
  },
  {
    "source": "ba56b992",
    "target": "088fbd95",
    "confidence": 0.74
  },
  {
    "source": "ba56b992",
    "target": "7166c42e",
    "confidence": 0.64
  },
  {
    "source": "ba56b992",
    "target": "9cf14f1e",
    "confidence": 0.6
  },
  {
    "source": "c394909f",
    "target": "41836b44",
    "confidence": 0.9
  },
  {
    "source": "d3275657",
    "target": "c6993b06",
    "confidence": 0.92
  },
  {
    "source": "d3275657",
    "target": "df6e49d5",
    "confidence": 0.92
  },
  {
    "source": "df6e49d5",
    "target": "d3275657",
    "confidence": 0.92
  },
  {
    "source": "df6e49d5",
    "target": "c6993b06",
    "confidence": 0.98
  },
  {
    "source": "9a4d7488",
    "target": "14249bdc",
    "confidence": 0.86
  },
  {
    "source": "9a4d7488",
    "target": "9aca9e2c",
    "confidence": 0.84
  },
  {
    "source": "9a4d7488",
    "target": "cb8a26f7",
    "confidence": 0.66
  },
  {
    "source": "9a4d7488",
    "target": "7fe016a3",
    "confidence": 0.73
  },
  {
    "source": "f5523e83",
    "target": "4884c5c6",
    "confidence": 0.68
  },
  {
    "source": "f5523e83",
    "target": "998a86c4",
    "confidence": 0.74
  },
  {
    "source": "f5523e83",
    "target": "acdb356e",
    "confidence": 0.78
  },
  {
    "source": "f5523e83",
    "target": "5361811c",
    "confidence": 0.71
  },
  {
    "source": "f59ea0d5",
    "target": "165a9245",
    "confidence": 0.75
  },
  {
    "source": "f59ea0d5",
    "target": "974e7e71",
    "confidence": 0.71
  },
  {
    "source": "f59ea0d5",
    "target": "3ef5f003",
    "confidence": 0.85
  },
  {
    "source": "f59ea0d5",
    "target": "443d2919",
    "confidence": 0.78
  },
  {
    "source": "fe81fa43",
    "target": "5554b93a",
    "confidence": 0.8
  },
  {
    "source": "fe81fa43",
    "target": "54db5551",
    "confidence": 0.66
  },
  {
    "source": "fe81fa43",
    "target": "3ef5f003",
    "confidence": 0.7
  },
  {
    "source": "fe81fa43",
    "target": "4e7b4100",
    "confidence": 0.83
  },
  {
    "source": "ff81c4c2",
    "target": "052d3ba0",
    "confidence": 0.89
  },
  {
    "source": "e4d9c920",
    "target": "9aca9e2c",
    "confidence": 0.85
  },
  {
    "source": "e4d9c920",
    "target": "184e688f",
    "confidence": 0.91
  },
  {
    "source": "e4d9c920",
    "target": "14249bdc",
    "confidence": 0.88
  },
  {
    "source": "e4d9c920",
    "target": "9a4d7488",
    "confidence": 0.89
  },
  {
    "source": "e4d9c920",
    "target": "7fe016a3",
    "confidence": 0.73
  },
  {
    "source": "c59cc2d6",
    "target": "cb8a26f7",
    "confidence": 0.62
  },
  {
    "source": "e86b25f7",
    "target": "c59cc2d6",
    "confidence": 0.76
  },
  {
    "source": "e86b25f7",
    "target": "184ddecc",
    "confidence": 0.68
  },
  {
    "source": "b7a6866e",
    "target": "844ed030",
    "confidence": 0.64
  },
  {
    "source": "b7a6866e",
    "target": "768f28d0",
    "confidence": 0.71
  },
  {
    "source": "b7a6866e",
    "target": "de024239",
    "confidence": 0.65
  },
  {
    "source": "b7a6866e",
    "target": "0982a977",
    "confidence": 0.63
  },
  {
    "source": "df6905c9",
    "target": "b7a6866e",
    "confidence": 0.66
  },
  {
    "source": "df6905c9",
    "target": "12a82302",
    "confidence": 0.84
  },
  {
    "source": "df6905c9",
    "target": "844ed030",
    "confidence": 0.84
  },
  {
    "source": "df6905c9",
    "target": "ac5bc0e0",
    "confidence": 0.95
  },
  {
    "source": "df6905c9",
    "target": "c59cc2d6",
    "confidence": 0.64
  },
  {
    "source": "7071fc23",
    "target": "3ea0627f",
    "confidence": 0.71
  },
  {
    "source": "7071fc23",
    "target": "5a952db4",
    "confidence": 0.78
  },
  {
    "source": "7071fc23",
    "target": "ca2048d1",
    "confidence": 0.87
  },
  {
    "source": "7071fc23",
    "target": "c84d7088",
    "confidence": 0.67
  },
  {
    "source": "812ec23e",
    "target": "184ddecc",
    "confidence": 0.66
  },
  {
    "source": "812ec23e",
    "target": "82c20686",
    "confidence": 0.69
  },
  {
    "source": "812ec23e",
    "target": "7a82b2e3",
    "confidence": 0.69
  },
  {
    "source": "e5cffcbd",
    "target": "5c657965",
    "confidence": 0.76
  },
  {
    "source": "e5cffcbd",
    "target": "ea8a0669",
    "confidence": 0.87
  },
  {
    "source": "e5cffcbd",
    "target": "ae4a3d83",
    "confidence": 0.91
  },
  {
    "source": "e5cffcbd",
    "target": "f62101da",
    "confidence": 0.83
  },
  {
    "source": "08580816",
    "target": "e5cffcbd",
    "confidence": 0.64
  },
  {
    "source": "08580816",
    "target": "84d6b81d",
    "confidence": 0.62
  },
  {
    "source": "08580816",
    "target": "2d473467",
    "confidence": 0.72
  },
  {
    "source": "08580816",
    "target": "b51d865f",
    "confidence": 0.82
  },
  {
    "source": "58196f0e",
    "target": "7d3ae136",
    "confidence": 0.72
  },
  {
    "source": "58196f0e",
    "target": "e14aaa8f",
    "confidence": 0.77
  },
  {
    "source": "3c8361d1",
    "target": "6f7991c3",
    "confidence": 0.66
  },
  {
    "source": "3c8361d1",
    "target": "ca1f30eb",
    "confidence": 0.87
  },
  {
    "source": "3c8361d1",
    "target": "0982a977",
    "confidence": 0.63
  },
  {
    "source": "b0b78f22",
    "target": "844ed030",
    "confidence": 0.73
  },
  {
    "source": "b0b78f22",
    "target": "12a82302",
    "confidence": 0.76
  },
  {
    "source": "b0b78f22",
    "target": "ac5bc0e0",
    "confidence": 0.74
  },
  {
    "source": "d879b838",
    "target": "ac5bc0e0",
    "confidence": 0.75
  },
  {
    "source": "d879b838",
    "target": "b0b78f22",
    "confidence": 0.9
  },
  {
    "source": "d879b838",
    "target": "65bf4cb7",
    "confidence": 0.71
  },
  {
    "source": "d879b838",
    "target": "340f748f",
    "confidence": 0.69
  },
  {
    "source": "d879b838",
    "target": "12a82302",
    "confidence": 0.76
  },
  {
    "source": "d7de203f",
    "target": "60bf1355",
    "confidence": 0.67
  },
  {
    "source": "d7de203f",
    "target": "5f8a8dbb",
    "confidence": 0.64
  },
  {
    "source": "d7de203f",
    "target": "879a27ab",
    "confidence": 0.61
  },
  {
    "source": "53e0a25c",
    "target": "ec49291d",
    "confidence": 0.67
  },
  {
    "source": "53e0a25c",
    "target": "cb8a26f7",
    "confidence": 0.56
  },
  {
    "source": "53e0a25c",
    "target": "725517c2",
    "confidence": 0.59
  },
  {
    "source": "53e0a25c",
    "target": "0982a977",
    "confidence": 0.56
  },
  {
    "source": "08623e39",
    "target": "ca1f30eb",
    "confidence": 0.58
  },
  {
    "source": "08623e39",
    "target": "cb8a26f7",
    "confidence": 0.59
  },
  {
    "source": "08623e39",
    "target": "8971b345",
    "confidence": 0.63
  },
  {
    "source": "1c83f120",
    "target": "ca1f30eb",
    "confidence": 0.62
  },
  {
    "source": "1c83f120",
    "target": "d7de203f",
    "confidence": 0.61
  },
  {
    "source": "1c83f120",
    "target": "cb8a26f7",
    "confidence": 0.64
  },
  {
    "source": "1c83f120",
    "target": "713dbcd3",
    "confidence": 0.59
  },
  {
    "source": "1c83f120",
    "target": "08623e39",
    "confidence": 0.72
  },
  {
    "source": "65164a95",
    "target": "7f71a117",
    "confidence": 0.77
  },
  {
    "source": "65164a95",
    "target": "7fe016a3",
    "confidence": 0.67
  },
  {
    "source": "198f9476",
    "target": "9aca9e2c",
    "confidence": 0.76
  },
  {
    "source": "198f9476",
    "target": "7fe016a3",
    "confidence": 0.7
  },
  {
    "source": "e581ba91",
    "target": "65164a95",
    "confidence": 0.74
  },
  {
    "source": "e581ba91",
    "target": "9aca9e2c",
    "confidence": 0.73
  },
  {
    "source": "e581ba91",
    "target": "7fe016a3",
    "confidence": 0.79
  },
  {
    "source": "e581ba91",
    "target": "7f71a117",
    "confidence": 0.7
  },
  {
    "source": "e581ba91",
    "target": "198f9476",
    "confidence": 0.72
  },
  {
    "source": "5fa0aec1",
    "target": "65164a95",
    "confidence": 0.73
  },
  {
    "source": "5fa0aec1",
    "target": "7f71a117",
    "confidence": 0.66
  },
  {
    "source": "5fa0aec1",
    "target": "198f9476",
    "confidence": 0.83
  },
  {
    "source": "5fa0aec1",
    "target": "7fe016a3",
    "confidence": 0.79
  },
  {
    "source": "5fa0aec1",
    "target": "e581ba91",
    "confidence": 0.83
  },
  {
    "source": "5fa0aec1",
    "target": "9aca9e2c",
    "confidence": 0.82
  },
  {
    "source": "ca1f30eb",
    "target": "3b7b01a3",
    "confidence": 0.63
  },
  {
    "source": "ca1f30eb",
    "target": "cbd55411",
    "confidence": 0.67
  },
  {
    "source": "ca1f30eb",
    "target": "3c8361d1",
    "confidence": 0.88
  },
  {
    "source": "ca1f30eb",
    "target": "0982a977",
    "confidence": 0.63
  },
  {
    "source": "ca1f30eb",
    "target": "1c83f120",
    "confidence": 0.63
  },
  {
    "source": "a6c0d091",
    "target": "5fa0aec1",
    "confidence": 0.71
  },
  {
    "source": "a6c0d091",
    "target": "198f9476",
    "confidence": 0.71
  },
  {
    "source": "a6c0d091",
    "target": "7f71a117",
    "confidence": 0.72
  },
  {
    "source": "a6c0d091",
    "target": "e581ba91",
    "confidence": 0.7
  },
  {
    "source": "a6c0d091",
    "target": "65164a95",
    "confidence": 0.79
  },
  {
    "source": "f27822a4",
    "target": "0f920e26",
    "confidence": 0.73
  },
  {
    "source": "f27822a4",
    "target": "14249bdc",
    "confidence": 0.66
  },
  {
    "source": "f27822a4",
    "target": "d1fad88d",
    "confidence": 0.72
  },
  {
    "source": "f27822a4",
    "target": "700c90d2",
    "confidence": 0.66
  },
  {
    "source": "f27822a4",
    "target": "cb8a26f7",
    "confidence": 0.67
  },
  {
    "source": "40e39568",
    "target": "12a82302",
    "confidence": 0.71
  },
  {
    "source": "40e39568",
    "target": "ac5bc0e0",
    "confidence": 0.73
  },
  {
    "source": "40e39568",
    "target": "0c874231",
    "confidence": 0.74
  },
  {
    "source": "40e39568",
    "target": "df6905c9",
    "confidence": 0.74
  },
  {
    "source": "700bb926",
    "target": "12a82302",
    "confidence": 0.81
  },
  {
    "source": "700bb926",
    "target": "844ed030",
    "confidence": 0.86
  },
  {
    "source": "5a816525",
    "target": "844ed030",
    "confidence": 0.81
  },
  {
    "source": "5a816525",
    "target": "700bb926",
    "confidence": 0.93
  },
  {
    "source": "5a816525",
    "target": "d879b838",
    "confidence": 0.73
  },
  {
    "source": "5a816525",
    "target": "12a82302",
    "confidence": 0.88
  },
  {
    "source": "41633d1c",
    "target": "12a82302",
    "confidence": 0.86
  },
  {
    "source": "41633d1c",
    "target": "700bb926",
    "confidence": 0.85
  },
  {
    "source": "41633d1c",
    "target": "5a816525",
    "confidence": 0.79
  },
  {
    "source": "41633d1c",
    "target": "df6905c9",
    "confidence": 0.87
  },
  {
    "source": "41633d1c",
    "target": "ac5bc0e0",
    "confidence": 0.85
  },
  {
    "source": "41633d1c",
    "target": "844ed030",
    "confidence": 0.94
  },
  {
    "source": "a1237503",
    "target": "41633d1c",
    "confidence": 0.91
  },
  {
    "source": "a1237503",
    "target": "df6905c9",
    "confidence": 0.87
  },
  {
    "source": "a1237503",
    "target": "5a816525",
    "confidence": 0.87
  },
  {
    "source": "a1237503",
    "target": "40e39568",
    "confidence": 0.71
  },
  {
    "source": "a1237503",
    "target": "ac5bc0e0",
    "confidence": 0.84
  },
  {
    "source": "a1237503",
    "target": "700bb926",
    "confidence": 0.8
  },
  {
    "source": "a1237503",
    "target": "12a82302",
    "confidence": 0.93
  },
  {
    "source": "a1237503",
    "target": "844ed030",
    "confidence": 0.87
  },
  {
    "source": "a1237503",
    "target": "b0b78f22",
    "confidence": 0.73
  },
  {
    "source": "8933fac9",
    "target": "b0b78f22",
    "confidence": 0.71
  },
  {
    "source": "8933fac9",
    "target": "e2b1f5c1",
    "confidence": 0.65
  },
  {
    "source": "8933fac9",
    "target": "65bf4cb7",
    "confidence": 0.71
  },
  {
    "source": "8933fac9",
    "target": "40e39568",
    "confidence": 0.69
  },
  {
    "source": "8933fac9",
    "target": "340f748f",
    "confidence": 0.68
  },
  {
    "source": "8933fac9",
    "target": "d879b838",
    "confidence": 0.76
  },
  {
    "source": "47e15cd1",
    "target": "8971b345",
    "confidence": 0.66
  },
  {
    "source": "47e15cd1",
    "target": "1c83f120",
    "confidence": 0.7
  },
  {
    "source": "47e15cd1",
    "target": "08623e39",
    "confidence": 0.85
  },
  {
    "source": "d9809648",
    "target": "e86b25f7",
    "confidence": 0.77
  },
  {
    "source": "d9809648",
    "target": "1db2ee60",
    "confidence": 0.67
  },
  {
    "source": "d9809648",
    "target": "c59cc2d6",
    "confidence": 0.9
  },
  {
    "source": "d9809648",
    "target": "184ddecc",
    "confidence": 0.69
  },
  {
    "source": "5dbe1c48",
    "target": "1b1e47f1",
    "confidence": 0.91
  },
  {
    "source": "5dbe1c48",
    "target": "cc2c0152",
    "confidence": 0.92
  },
  {
    "source": "5dbe1c48",
    "target": "58917d63",
    "confidence": 0.91
  },
  {
    "source": "5a3552bf",
    "target": "ff81c4c2",
    "confidence": 0.63
  },
  {
    "source": "5a3552bf",
    "target": "d53ead70",
    "confidence": 0.63
  },
  {
    "source": "5a3552bf",
    "target": "cd7678ff",
    "confidence": 0.65
  },
  {
    "source": "803c94ed",
    "target": "5a3552bf",
    "confidence": 0.89
  },
  {
    "source": "803c94ed",
    "target": "052d3ba0",
    "confidence": 0.7
  },
  {
    "source": "b2779dbe",
    "target": "0b57e258",
    "confidence": 0.64
  },
  {
    "source": "a3cc3511",
    "target": "5abd7ce0",
    "confidence": 0.59
  },
  {
    "source": "a3cc3511",
    "target": "0b57e258",
    "confidence": 0.59
  },
  {
    "source": "a3cc3511",
    "target": "5dbe1c48",
    "confidence": 0.59
  },
  {
    "source": "a3cc3511",
    "target": "b2779dbe",
    "confidence": 0.85
  },
  {
    "source": "40921b5f",
    "target": "a3cc3511",
    "confidence": 0.9
  },
  {
    "source": "40921b5f",
    "target": "b2779dbe",
    "confidence": 0.85
  },
  {
    "source": "40921b5f",
    "target": "0b57e258",
    "confidence": 0.63
  },
  {
    "source": "5a2c697e",
    "target": "baa3420b",
    "confidence": 0.66
  },
  {
    "source": "5a2c697e",
    "target": "803c94ed",
    "confidence": 0.78
  },
  {
    "source": "5a2c697e",
    "target": "d53ead70",
    "confidence": 0.69
  },
  {
    "source": "5a2c697e",
    "target": "5a3552bf",
    "confidence": 0.77
  },
  {
    "source": "5a2c697e",
    "target": "0c874231",
    "confidence": 0.66
  },
  {
    "source": "7e96aae4",
    "target": "1f08d7ae",
    "confidence": 0.61
  },
  {
    "source": "7e96aae4",
    "target": "b87ed21f",
    "confidence": 0.6
  },
  {
    "source": "440bb080",
    "target": "14324148",
    "confidence": 0.66
  },
  {
    "source": "440bb080",
    "target": "5c648979",
    "confidence": 0.53
  },
  {
    "source": "440bb080",
    "target": "1f08d7ae",
    "confidence": 0.59
  },
  {
    "source": "440bb080",
    "target": "fef77e18",
    "confidence": 0.62
  },
  {
    "source": "8399e64b",
    "target": "453662c7",
    "confidence": 0.68
  },
  {
    "source": "8399e64b",
    "target": "b105ac84",
    "confidence": 0.67
  },
  {
    "source": "8399e64b",
    "target": "56620299",
    "confidence": 0.66
  },
  {
    "source": "8399e64b",
    "target": "2b71f799",
    "confidence": 0.68
  },
  {
    "source": "37ce4f23",
    "target": "44697716",
    "confidence": 0.74
  },
  {
    "source": "37ce4f23",
    "target": "b2917c87",
    "confidence": 0.73
  },
  {
    "source": "37ce4f23",
    "target": "5a8c385b",
    "confidence": 0.74
  },
  {
    "source": "37ce4f23",
    "target": "f33a7b4b",
    "confidence": 0.93
  },
  {
    "source": "37ce4f23",
    "target": "502c7f61",
    "confidence": 0.77
  },
  {
    "source": "4c610dd6",
    "target": "8399e64b",
    "confidence": 0.74
  },
  {
    "source": "254a1e6e",
    "target": "331fa22e",
    "confidence": 0.71
  },
  {
    "source": "254a1e6e",
    "target": "56620299",
    "confidence": 0.75
  },
  {
    "source": "254a1e6e",
    "target": "ce06614e",
    "confidence": 0.66
  },
  {
    "source": "254a1e6e",
    "target": "259bea0c",
    "confidence": 0.66
  },
  {
    "source": "c84393fe",
    "target": "254a1e6e",
    "confidence": 0.75
  },
  {
    "source": "c84393fe",
    "target": "b105ac84",
    "confidence": 0.75
  },
  {
    "source": "c84393fe",
    "target": "edf67988",
    "confidence": 0.64
  },
  {
    "source": "c84393fe",
    "target": "2b71f799",
    "confidence": 0.75
  },
  {
    "source": "c84393fe",
    "target": "b38b70f4",
    "confidence": 0.78
  },
  {
    "source": "c84393fe",
    "target": "453662c7",
    "confidence": 0.75
  },
  {
    "source": "c84393fe",
    "target": "56620299",
    "confidence": 0.7
  },
  {
    "source": "05319853",
    "target": "98d2ca01",
    "confidence": 0.65
  },
  {
    "source": "05319853",
    "target": "453662c7",
    "confidence": 0.65
  },
  {
    "source": "05319853",
    "target": "82c3869c",
    "confidence": 0.61
  },
  {
    "source": "f997db4d",
    "target": "af1126fa",
    "confidence": 0.67
  },
  {
    "source": "f997db4d",
    "target": "05319853",
    "confidence": 0.68
  },
  {
    "source": "f997db4d",
    "target": "9016d792",
    "confidence": 0.79
  },
  {
    "source": "f997db4d",
    "target": "4c610dd6",
    "confidence": 0.67
  },
  {
    "source": "7f339c79",
    "target": "4c610dd6",
    "confidence": 0.72
  },
  {
    "source": "7f339c79",
    "target": "f997db4d",
    "confidence": 0.64
  },
  {
    "source": "7f339c79",
    "target": "8399e64b",
    "confidence": 0.64
  },
  {
    "source": "7f339c79",
    "target": "05319853",
    "confidence": 0.61
  },
  {
    "source": "7b95bcc2",
    "target": "05319853",
    "confidence": 0.62
  },
  {
    "source": "7b95bcc2",
    "target": "f997db4d",
    "confidence": 0.7
  },
  {
    "source": "7b95bcc2",
    "target": "4c610dd6",
    "confidence": 0.65
  },
  {
    "source": "7b95bcc2",
    "target": "453662c7",
    "confidence": 0.63
  },
  {
    "source": "370388bf",
    "target": "28272a35",
    "confidence": 0.71
  },
  {
    "source": "370388bf",
    "target": "cef214da",
    "confidence": 0.63
  },
  {
    "source": "370388bf",
    "target": "033b7f08",
    "confidence": 0.59
  },
  {
    "source": "93ef12e7",
    "target": "28272a35",
    "confidence": 0.77
  },
  {
    "source": "93ef12e7",
    "target": "370388bf",
    "confidence": 0.89
  },
  {
    "source": "93ef12e7",
    "target": "cef214da",
    "confidence": 0.66
  },
  {
    "source": "2858d765",
    "target": "d3006053",
    "confidence": 0.63
  },
  {
    "source": "2858d765",
    "target": "93ef12e7",
    "confidence": 0.87
  },
  {
    "source": "2858d765",
    "target": "28272a35",
    "confidence": 0.72
  },
  {
    "source": "2858d765",
    "target": "370388bf",
    "confidence": 0.88
  },
  {
    "source": "2858d765",
    "target": "033b7f08",
    "confidence": 0.58
  },
  {
    "source": "fc86c518",
    "target": "370388bf",
    "confidence": 0.68
  },
  {
    "source": "fc86c518",
    "target": "93ef12e7",
    "confidence": 0.67
  },
  {
    "source": "fc86c518",
    "target": "654b94b2",
    "confidence": 0.64
  },
  {
    "source": "fc86c518",
    "target": "0238c976",
    "confidence": 0.65
  },
  {
    "source": "fc86c518",
    "target": "28272a35",
    "confidence": 0.66
  },
  {
    "source": "fc86c518",
    "target": "2858d765",
    "confidence": 0.67
  },
  {
    "source": "3bd4e161",
    "target": "de1c4994",
    "confidence": 0.62
  },
  {
    "source": "3bd4e161",
    "target": "70d42f14",
    "confidence": 0.65
  },
  {
    "source": "3bd4e161",
    "target": "033b7f08",
    "confidence": 0.7
  },
  {
    "source": "3bd4e161",
    "target": "502c7f61",
    "confidence": 0.62
  },
  {
    "source": "3bd4e161",
    "target": "0b57e258",
    "confidence": 0.62
  },
  {
    "source": "3204b29d",
    "target": "a357dfa8",
    "confidence": 0.61
  },
  {
    "source": "3204b29d",
    "target": "fecbb633",
    "confidence": 0.61
  },
  {
    "source": "3204b29d",
    "target": "a18b6665",
    "confidence": 0.6
  },
  {
    "source": "3204b29d",
    "target": "6915cd56",
    "confidence": 0.62
  },
  {
    "source": "ebabfc01",
    "target": "fef77e18",
    "confidence": 0.74
  },
  {
    "source": "ebabfc01",
    "target": "80aadaec",
    "confidence": 0.64
  },
  {
    "source": "ebabfc01",
    "target": "14324148",
    "confidence": 0.76
  },
  {
    "source": "ebabfc01",
    "target": "440bb080",
    "confidence": 0.7
  },
  {
    "source": "ebabfc01",
    "target": "1f08d7ae",
    "confidence": 0.65
  },
  {
    "source": "982fa9b2",
    "target": "76f882cf",
    "confidence": 0.64
  },
  {
    "source": "982fa9b2",
    "target": "5d18e7cd",
    "confidence": 0.62
  },
  {
    "source": "982fa9b2",
    "target": "120de3cc",
    "confidence": 0.54
  },
  {
    "source": "982fa9b2",
    "target": "3204b29d",
    "confidence": 0.57
  },
  {
    "source": "982fa9b2",
    "target": "5eb80aa5",
    "confidence": 0.52
  },
  {
    "source": "004d40f3",
    "target": "23261095",
    "confidence": 0.65
  },
  {
    "source": "004d40f3",
    "target": "e59590b5",
    "confidence": 0.71
  },
  {
    "source": "b1daacfb",
    "target": "b8707264",
    "confidence": 0.64
  },
  {
    "source": "b1daacfb",
    "target": "e59590b5",
    "confidence": 0.88
  },
  {
    "source": "b1daacfb",
    "target": "67f11c63",
    "confidence": 0.68
  },
  {
    "source": "f0188a1f",
    "target": "97895716",
    "confidence": 0.87
  },
  {
    "source": "f0188a1f",
    "target": "e762c6c7",
    "confidence": 0.77
  },
  {
    "source": "f0188a1f",
    "target": "1555f94b",
    "confidence": 0.73
  },
  {
    "source": "f0188a1f",
    "target": "a6c6b8c4",
    "confidence": 0.82
  },
  {
    "source": "1b1e47f1",
    "target": "cc2c0152",
    "confidence": 0.93
  },
  {
    "source": "1b1e47f1",
    "target": "58917d63",
    "confidence": 0.89
  },
  {
    "source": "1b1e47f1",
    "target": "5dbe1c48",
    "confidence": 0.9
  },
  {
    "source": "9262ea46",
    "target": "ce852fed",
    "confidence": 0.77
  },
  {
    "source": "9262ea46",
    "target": "d2c2e76c",
    "confidence": 0.63
  },
  {
    "source": "9262ea46",
    "target": "c42bef2c",
    "confidence": 0.63
  },
  {
    "source": "a30ed378",
    "target": "15da530a",
    "confidence": 0.54
  },
  {
    "source": "a30ed378",
    "target": "29a7322d",
    "confidence": 0.64
  },
  {
    "source": "a30ed378",
    "target": "07fb8f8d",
    "confidence": 0.5
  },
  {
    "source": "a30ed378",
    "target": "eee56dce",
    "confidence": 0.48
  },
  {
    "source": "a30ed378",
    "target": "904a75d9",
    "confidence": 0.46
  },
  {
    "source": "0098b464",
    "target": "c42bef2c",
    "confidence": 0.63
  },
  {
    "source": "0098b464",
    "target": "d2c2e76c",
    "confidence": 0.61
  },
  {
    "source": "0098b464",
    "target": "ce852fed",
    "confidence": 0.73
  },
  {
    "source": "0098b464",
    "target": "9262ea46",
    "confidence": 0.9
  },
  {
    "source": "0098b464",
    "target": "eeae336d",
    "confidence": 0.53
  },
  {
    "source": "df56723b",
    "target": "084521e5",
    "confidence": 0.58
  },
  {
    "source": "df56723b",
    "target": "07fb8f8d",
    "confidence": 0.61
  },
  {
    "source": "df56723b",
    "target": "7177105c",
    "confidence": 0.65
  },
  {
    "source": "df56723b",
    "target": "29a7322d",
    "confidence": 0.68
  },
  {
    "source": "df56723b",
    "target": "15da530a",
    "confidence": 0.61
  },
  {
    "source": "dd81fabe",
    "target": "502c7f61",
    "confidence": 0.64
  },
  {
    "source": "dd81fabe",
    "target": "d1b47db7",
    "confidence": 0.65
  },
  {
    "source": "dd81fabe",
    "target": "8bf049b5",
    "confidence": 0.67
  },
  {
    "source": "dd81fabe",
    "target": "df9e6431",
    "confidence": 0.64
  },
  {
    "source": "a234f622",
    "target": "9262ea46",
    "confidence": 0.6
  },
  {
    "source": "a234f622",
    "target": "ce852fed",
    "confidence": 0.55
  },
  {
    "source": "a234f622",
    "target": "bf0c2bd5",
    "confidence": 0.55
  },
  {
    "source": "a234f622",
    "target": "d2c2e76c",
    "confidence": 0.55
  },
  {
    "source": "a234f622",
    "target": "0098b464",
    "confidence": 0.59
  },
  {
    "source": "7ab18aee",
    "target": "f33a7b4b",
    "confidence": 0.74
  },
  {
    "source": "7ab18aee",
    "target": "d1b47db7",
    "confidence": 0.75
  },
  {
    "source": "7ab18aee",
    "target": "37ce4f23",
    "confidence": 0.73
  },
  {
    "source": "7ab18aee",
    "target": "dd81fabe",
    "confidence": 0.72
  },
  {
    "source": "27c9af8d",
    "target": "6cf22e37",
    "confidence": 0.69
  },
  {
    "source": "27c9af8d",
    "target": "7ab18aee",
    "confidence": 0.59
  },
  {
    "source": "a3c1b744",
    "target": "610ed501",
    "confidence": 0.71
  },
  {
    "source": "a3c1b744",
    "target": "c72f6835",
    "confidence": 0.71
  },
  {
    "source": "a3c1b744",
    "target": "f643ecac",
    "confidence": 0.69
  },
  {
    "source": "a3c1b744",
    "target": "b2917c87",
    "confidence": 0.73
  },
  {
    "source": "a3c1b744",
    "target": "7177105c",
    "confidence": 0.65
  },
  {
    "source": "ae065b9b",
    "target": "15da530a",
    "confidence": 0.64
  },
  {
    "source": "ae065b9b",
    "target": "ca43e00f",
    "confidence": 0.61
  },
  {
    "source": "ae065b9b",
    "target": "33031019",
    "confidence": 0.61
  },
  {
    "source": "ae065b9b",
    "target": "a5c05e83",
    "confidence": 0.62
  },
  {
    "source": "ae065b9b",
    "target": "c84d7088",
    "confidence": 0.64
  },
  {
    "source": "ae065b9b",
    "target": "a60ce701",
    "confidence": 0.63
  },
  {
    "source": "9bcf064c",
    "target": "29a7322d",
    "confidence": 0.61
  },
  {
    "source": "9bcf064c",
    "target": "6cf22e37",
    "confidence": 0.73
  },
  {
    "source": "9bcf064c",
    "target": "27c9af8d",
    "confidence": 0.66
  },
  {
    "source": "9bcf064c",
    "target": "7ab18aee",
    "confidence": 0.63
  },
  {
    "source": "9bcf064c",
    "target": "4d1d962e",
    "confidence": 0.62
  },
  {
    "source": "38555413",
    "target": "c72f6835",
    "confidence": 0.75
  },
  {
    "source": "38555413",
    "target": "fed9cdaa",
    "confidence": 0.77
  },
  {
    "source": "38555413",
    "target": "a3c1b744",
    "confidence": 0.7
  },
  {
    "source": "38555413",
    "target": "f643ecac",
    "confidence": 0.76
  },
  {
    "source": "38555413",
    "target": "610ed501",
    "confidence": 0.73
  },
  {
    "source": "38555413",
    "target": "b2917c87",
    "confidence": 0.76
  },
  {
    "source": "a65fea51",
    "target": "9016d792",
    "confidence": 0.61
  },
  {
    "source": "a65fea51",
    "target": "9bcf064c",
    "confidence": 0.61
  },
  {
    "source": "a65fea51",
    "target": "27c9af8d",
    "confidence": 0.71
  },
  {
    "source": "a65fea51",
    "target": "6cf22e37",
    "confidence": 0.62
  },
  {
    "source": "e33eda5e",
    "target": "8e671004",
    "confidence": 0.57
  },
  {
    "source": "e33eda5e",
    "target": "c847d0cc",
    "confidence": 0.55
  },
  {
    "source": "e33eda5e",
    "target": "e88a3319",
    "confidence": 0.57
  },
  {
    "source": "e33eda5e",
    "target": "76fe7a09",
    "confidence": 0.82
  },
  {
    "source": "e33eda5e",
    "target": "33031019",
    "confidence": 0.54
  },
  {
    "source": "620db8d8",
    "target": "2b4d6af0",
    "confidence": 0.71
  },
  {
    "source": "620db8d8",
    "target": "2c176ead",
    "confidence": 0.73
  },
  {
    "source": "08a5b88e",
    "target": "66fc9c5b",
    "confidence": 0.65
  },
  {
    "source": "08a5b88e",
    "target": "0b57e258",
    "confidence": 0.63
  },
  {
    "source": "08a5b88e",
    "target": "de1c4994",
    "confidence": 0.61
  },
  {
    "source": "08a5b88e",
    "target": "21e7a058",
    "confidence": 0.64
  },
  {
    "source": "2b4d6af0",
    "target": "620db8d8",
    "confidence": 0.71
  },
  {
    "source": "2b4d6af0",
    "target": "66fc9c5b",
    "confidence": 0.72
  },
  {
    "source": "2b4d6af0",
    "target": "74c8accc",
    "confidence": 0.72
  },
  {
    "source": "2b4d6af0",
    "target": "08a5b88e",
    "confidence": 0.65
  },
  {
    "source": "2c176ead",
    "target": "21e7a058",
    "confidence": 0.72
  },
  {
    "source": "2c176ead",
    "target": "620db8d8",
    "confidence": 0.72
  },
  {
    "source": "2c176ead",
    "target": "66fc9c5b",
    "confidence": 0.85
  },
  {
    "source": "2c176ead",
    "target": "2b4d6af0",
    "confidence": 0.68
  },
  {
    "source": "2c176ead",
    "target": "6b737d82",
    "confidence": 0.75
  },
  {
    "source": "f4294a8c",
    "target": "66fc9c5b",
    "confidence": 0.73
  },
  {
    "source": "f4294a8c",
    "target": "2c176ead",
    "confidence": 0.76
  },
  {
    "source": "712d82de",
    "target": "2c176ead",
    "confidence": 0.71
  },
  {
    "source": "712d82de",
    "target": "f4294a8c",
    "confidence": 0.89
  },
  {
    "source": "712d82de",
    "target": "36e2ef47",
    "confidence": 0.75
  },
  {
    "source": "4a620a8c",
    "target": "712d82de",
    "confidence": 0.77
  },
  {
    "source": "4a620a8c",
    "target": "2c176ead",
    "confidence": 0.69
  },
  {
    "source": "4a620a8c",
    "target": "f4294a8c",
    "confidence": 0.77
  },
  {
    "source": "4a620a8c",
    "target": "620db8d8",
    "confidence": 0.75
  },
  {
    "source": "d8fe293c",
    "target": "36e2ef47",
    "confidence": 0.76
  },
  {
    "source": "d8fe293c",
    "target": "4a620a8c",
    "confidence": 0.8
  },
  {
    "source": "d8fe293c",
    "target": "f4294a8c",
    "confidence": 0.91
  },
  {
    "source": "d8fe293c",
    "target": "712d82de",
    "confidence": 0.92
  },
  {
    "source": "d8fe293c",
    "target": "2c176ead",
    "confidence": 0.8
  },
  {
    "source": "d8fe293c",
    "target": "66fc9c5b",
    "confidence": 0.76
  },
  {
    "source": "23ead4b8",
    "target": "2c176ead",
    "confidence": 0.74
  },
  {
    "source": "23ead4b8",
    "target": "1a248c3f",
    "confidence": 0.73
  },
  {
    "source": "318d2a99",
    "target": "462d2756",
    "confidence": 0.68
  },
  {
    "source": "318d2a99",
    "target": "23ead4b8",
    "confidence": 0.73
  },
  {
    "source": "712493f3",
    "target": "81aa80b0",
    "confidence": 0.75
  },
  {
    "source": "712493f3",
    "target": "23ead4b8",
    "confidence": 0.74
  },
  {
    "source": "712493f3",
    "target": "74d1d47b",
    "confidence": 0.69
  },
  {
    "source": "712493f3",
    "target": "318d2a99",
    "confidence": 0.68
  },
  {
    "source": "801fb65f",
    "target": "318d2a99",
    "confidence": 0.68
  },
  {
    "source": "801fb65f",
    "target": "37688dad",
    "confidence": 0.63
  },
  {
    "source": "801fb65f",
    "target": "712493f3",
    "confidence": 0.71
  },
  {
    "source": "801fb65f",
    "target": "23ead4b8",
    "confidence": 0.76
  },
  {
    "source": "801fb65f",
    "target": "3b4f7e97",
    "confidence": 0.64
  },
  {
    "source": "11f331fd",
    "target": "37688dad",
    "confidence": 0.75
  },
  {
    "source": "11f331fd",
    "target": "d8c60f80",
    "confidence": 0.74
  },
  {
    "source": "11f331fd",
    "target": "620db8d8",
    "confidence": 0.72
  },
  {
    "source": "134bce1a",
    "target": "11f331fd",
    "confidence": 0.79
  },
  {
    "source": "134bce1a",
    "target": "ca1f30eb",
    "confidence": 0.69
  },
  {
    "source": "134bce1a",
    "target": "e86b25f7",
    "confidence": 0.68
  },
  {
    "source": "98547843",
    "target": "de1c4994",
    "confidence": 0.77
  },
  {
    "source": "98547843",
    "target": "37688dad",
    "confidence": 0.67
  },
  {
    "source": "98547843",
    "target": "4d44ba53",
    "confidence": 0.73
  },
  {
    "source": "98547843",
    "target": "b762c64a",
    "confidence": 0.69
  },
  {
    "source": "98547843",
    "target": "0b57e258",
    "confidence": 0.79
  },
  {
    "source": "ba8f2fd6",
    "target": "318d2a99",
    "confidence": 0.82
  },
  {
    "source": "ba8f2fd6",
    "target": "134bce1a",
    "confidence": 0.75
  },
  {
    "source": "605020d4",
    "target": "11f331fd",
    "confidence": 0.74
  },
  {
    "source": "605020d4",
    "target": "134bce1a",
    "confidence": 0.77
  },
  {
    "source": "605020d4",
    "target": "ba8f2fd6",
    "confidence": 0.73
  },
  {
    "source": "cccbd49a",
    "target": "81aa80b0",
    "confidence": 0.77
  },
  {
    "source": "cccbd49a",
    "target": "134bce1a",
    "confidence": 0.77
  },
  {
    "source": "cccbd49a",
    "target": "712493f3",
    "confidence": 0.72
  },
  {
    "source": "cccbd49a",
    "target": "605020d4",
    "confidence": 0.76
  },
  {
    "source": "cccbd49a",
    "target": "ba8f2fd6",
    "confidence": 0.72
  },
  {
    "source": "43f0dc09",
    "target": "605020d4",
    "confidence": 0.67
  },
  {
    "source": "43f0dc09",
    "target": "6ce61009",
    "confidence": 0.63
  },
  {
    "source": "43f0dc09",
    "target": "11f331fd",
    "confidence": 0.7
  },
  {
    "source": "43f0dc09",
    "target": "134bce1a",
    "confidence": 0.7
  },
  {
    "source": "43f0dc09",
    "target": "cccbd49a",
    "confidence": 0.67
  },
  {
    "source": "43f0dc09",
    "target": "42a0f495",
    "confidence": 0.72
  },
  {
    "source": "58a5260f",
    "target": "11f331fd",
    "confidence": 0.69
  },
  {
    "source": "58a5260f",
    "target": "5a816525",
    "confidence": 0.71
  },
  {
    "source": "014f54bd",
    "target": "605020d4",
    "confidence": 0.74
  },
  {
    "source": "014f54bd",
    "target": "cccbd49a",
    "confidence": 0.77
  },
  {
    "source": "014f54bd",
    "target": "134bce1a",
    "confidence": 0.75
  },
  {
    "source": "014f54bd",
    "target": "11f331fd",
    "confidence": 0.76
  },
  {
    "source": "014f54bd",
    "target": "58a5260f",
    "confidence": 0.73
  },
  {
    "source": "1699005f",
    "target": "134bce1a",
    "confidence": 0.72
  },
  {
    "source": "1699005f",
    "target": "58a5260f",
    "confidence": 0.75
  },
  {
    "source": "1699005f",
    "target": "11f331fd",
    "confidence": 0.73
  },
  {
    "source": "1699005f",
    "target": "5a816525",
    "confidence": 0.74
  },
  {
    "source": "1699005f",
    "target": "014f54bd",
    "confidence": 0.73
  },
  {
    "source": "a9565f6e",
    "target": "80aadaec",
    "confidence": 0.68
  },
  {
    "source": "a9565f6e",
    "target": "58a5260f",
    "confidence": 0.69
  },
  {
    "source": "a9565f6e",
    "target": "014f54bd",
    "confidence": 0.77
  },
  {
    "source": "a9565f6e",
    "target": "cccbd49a",
    "confidence": 0.76
  },
  {
    "source": "a9565f6e",
    "target": "605020d4",
    "confidence": 0.84
  },
  {
    "source": "a9565f6e",
    "target": "ba8f2fd6",
    "confidence": 0.74
  },
  {
    "source": "a9565f6e",
    "target": "134bce1a",
    "confidence": 0.77
  },
  {
    "source": "084e44c1",
    "target": "5c657965",
    "confidence": 0.78
  },
  {
    "source": "084e44c1",
    "target": "e5cffcbd",
    "confidence": 0.65
  },
  {
    "source": "084e44c1",
    "target": "7ac15094",
    "confidence": 0.66
  },
  {
    "source": "084e44c1",
    "target": "f62101da",
    "confidence": 0.63
  },
  {
    "source": "92c97ef9",
    "target": "b1daacfb",
    "confidence": 0.79
  },
  {
    "source": "92c97ef9",
    "target": "e59590b5",
    "confidence": 0.83
  },
  {
    "source": "4c2b4ea0",
    "target": "b1daacfb",
    "confidence": 0.57
  },
  {
    "source": "4c2b4ea0",
    "target": "e59590b5",
    "confidence": 0.58
  },
  {
    "source": "4c2b4ea0",
    "target": "33031019",
    "confidence": 0.57
  },
  {
    "source": "4c2b4ea0",
    "target": "004d40f3",
    "confidence": 0.58
  },
  {
    "source": "3c7322d6",
    "target": "b8707264",
    "confidence": 0.67
  },
  {
    "source": "3c7322d6",
    "target": "004d40f3",
    "confidence": 0.72
  },
  {
    "source": "3c7322d6",
    "target": "92c97ef9",
    "confidence": 0.68
  },
  {
    "source": "3c7322d6",
    "target": "b1daacfb",
    "confidence": 0.79
  },
  {
    "source": "3c7322d6",
    "target": "e59590b5",
    "confidence": 0.83
  },
  {
    "source": "ae00fae6",
    "target": "e59590b5",
    "confidence": 0.72
  },
  {
    "source": "ae00fae6",
    "target": "4c2b4ea0",
    "confidence": 0.61
  },
  {
    "source": "ae00fae6",
    "target": "92c97ef9",
    "confidence": 0.81
  },
  {
    "source": "327df9f1",
    "target": "ae00fae6",
    "confidence": 0.78
  },
  {
    "source": "327df9f1",
    "target": "e59590b5",
    "confidence": 0.77
  },
  {
    "source": "327df9f1",
    "target": "3c7322d6",
    "confidence": 0.81
  },
  {
    "source": "327df9f1",
    "target": "92c97ef9",
    "confidence": 0.7
  },
  {
    "source": "d0dcfb60",
    "target": "23261095",
    "confidence": 0.69
  },
  {
    "source": "d0dcfb60",
    "target": "3c7322d6",
    "confidence": 0.72
  },
  {
    "source": "d0dcfb60",
    "target": "e59590b5",
    "confidence": 0.76
  },
  {
    "source": "b0a86fd1",
    "target": "b1daacfb",
    "confidence": 0.75
  },
  {
    "source": "b0a86fd1",
    "target": "d0dcfb60",
    "confidence": 0.73
  },
  {
    "source": "b0a86fd1",
    "target": "3c7322d6",
    "confidence": 0.81
  },
  {
    "source": "b0a86fd1",
    "target": "f0188a1f",
    "confidence": 0.72
  },
  {
    "source": "b0a86fd1",
    "target": "e59590b5",
    "confidence": 0.83
  },
  {
    "source": "b0a86fd1",
    "target": "b8707264",
    "confidence": 0.67
  },
  {
    "source": "dc389c74",
    "target": "e59590b5",
    "confidence": 0.76
  },
  {
    "source": "dc389c74",
    "target": "7b95bcc2",
    "confidence": 0.65
  },
  {
    "source": "dc389c74",
    "target": "3c7322d6",
    "confidence": 0.79
  },
  {
    "source": "dc389c74",
    "target": "327df9f1",
    "confidence": 0.76
  },
  {
    "source": "f3f94a68",
    "target": "b8707264",
    "confidence": 0.67
  },
  {
    "source": "f3f94a68",
    "target": "3c7322d6",
    "confidence": 0.81
  },
  {
    "source": "f3f94a68",
    "target": "b0a86fd1",
    "confidence": 0.82
  },
  {
    "source": "f3f94a68",
    "target": "327df9f1",
    "confidence": 0.8
  },
  {
    "source": "99112fe6",
    "target": "cd309991",
    "confidence": 0.67
  },
  {
    "source": "99112fe6",
    "target": "3c7322d6",
    "confidence": 0.71
  },
  {
    "source": "647a9a97",
    "target": "3c7322d6",
    "confidence": 0.85
  },
  {
    "source": "647a9a97",
    "target": "327df9f1",
    "confidence": 0.8
  },
  {
    "source": "647a9a97",
    "target": "ae00fae6",
    "confidence": 0.79
  },
  {
    "source": "647a9a97",
    "target": "f3f94a68",
    "confidence": 0.8
  },
  {
    "source": "647a9a97",
    "target": "b1daacfb",
    "confidence": 0.77
  },
  {
    "source": "647a9a97",
    "target": "004d40f3",
    "confidence": 0.72
  },
  {
    "source": "647a9a97",
    "target": "e59590b5",
    "confidence": 0.85
  },
  {
    "source": "647a9a97",
    "target": "d0dcfb60",
    "confidence": 0.74
  },
  {
    "source": "647a9a97",
    "target": "b0a86fd1",
    "confidence": 0.83
  },
  {
    "source": "647a9a97",
    "target": "dc389c74",
    "confidence": 0.81
  },
  {
    "source": "aee9cfd5",
    "target": "ae00fae6",
    "confidence": 0.73
  },
  {
    "source": "aee9cfd5",
    "target": "004d40f3",
    "confidence": 0.7
  },
  {
    "source": "aee9cfd5",
    "target": "b0a86fd1",
    "confidence": 0.77
  },
  {
    "source": "aee9cfd5",
    "target": "e59590b5",
    "confidence": 0.8
  },
  {
    "source": "aee9cfd5",
    "target": "647a9a97",
    "confidence": 0.8
  },
  {
    "source": "aee9cfd5",
    "target": "f3f94a68",
    "confidence": 0.85
  },
  {
    "source": "aee9cfd5",
    "target": "3c7322d6",
    "confidence": 0.82
  },
  {
    "source": "d9e3aa5c",
    "target": "647a9a97",
    "confidence": 0.72
  },
  {
    "source": "d9e3aa5c",
    "target": "b0a86fd1",
    "confidence": 0.78
  },
  {
    "source": "d9e3aa5c",
    "target": "f3f94a68",
    "confidence": 0.8
  },
  {
    "source": "d9e3aa5c",
    "target": "d0dcfb60",
    "confidence": 0.74
  },
  {
    "source": "d9e3aa5c",
    "target": "00cf0443",
    "confidence": 0.72
  },
  {
    "source": "d9e3aa5c",
    "target": "3c7322d6",
    "confidence": 0.76
  },
  {
    "source": "def61559",
    "target": "99112fe6",
    "confidence": 0.85
  },
  {
    "source": "def61559",
    "target": "d9e3aa5c",
    "confidence": 0.67
  },
  {
    "source": "def61559",
    "target": "3c7322d6",
    "confidence": 0.68
  },
  {
    "source": "0ab39191",
    "target": "ea8a0669",
    "confidence": 0.68
  },
  {
    "source": "0ab39191",
    "target": "ae4a3d83",
    "confidence": 0.65
  },
  {
    "source": "0ab39191",
    "target": "b762c64a",
    "confidence": 0.69
  },
  {
    "source": "0ab39191",
    "target": "f62101da",
    "confidence": 0.67
  },
  {
    "source": "0ab39191",
    "target": "e5cffcbd",
    "confidence": 0.68
  },
  {
    "source": "0b023624",
    "target": "d9809648",
    "confidence": 0.71
  },
  {
    "source": "0b023624",
    "target": "259bea0c",
    "confidence": 0.77
  },
  {
    "source": "0b023624",
    "target": "421e680f",
    "confidence": 0.78
  },
  {
    "source": "0b023624",
    "target": "d3823c15",
    "confidence": 0.87
  },
  {
    "source": "0b023624",
    "target": "2c35647f",
    "confidence": 0.78
  },
  {
    "source": "0b023624",
    "target": "c0c1ee16",
    "confidence": 0.74
  },
  {
    "source": "0b023624",
    "target": "2d2fa764",
    "confidence": 0.73
  },
  {
    "source": "0bb3dad5",
    "target": "920a0977",
    "confidence": 0.55
  },
  {
    "source": "14f56a6a",
    "target": "ac5bc0e0",
    "confidence": 0.77
  },
  {
    "source": "14f56a6a",
    "target": "844ed030",
    "confidence": 0.77
  },
  {
    "source": "14f56a6a",
    "target": "df6905c9",
    "confidence": 0.78
  },
  {
    "source": "14f56a6a",
    "target": "a1237503",
    "confidence": 0.76
  },
  {
    "source": "14f56a6a",
    "target": "41633d1c",
    "confidence": 0.76
  },
  {
    "source": "16e3d814",
    "target": "74146974",
    "confidence": 0.56
  },
  {
    "source": "16e3d814",
    "target": "f551d355",
    "confidence": 0.93
  },
  {
    "source": "16e3d814",
    "target": "7be51af9",
    "confidence": 0.56
  },
  {
    "source": "16e3d814",
    "target": "8971b345",
    "confidence": 0.64
  },
  {
    "source": "16e3d814",
    "target": "4099b1cd",
    "confidence": 0.57
  },
  {
    "source": "16e3d814",
    "target": "47e15cd1",
    "confidence": 0.62
  },
  {
    "source": "1d164677",
    "target": "ce06614e",
    "confidence": 0.69
  },
  {
    "source": "1d164677",
    "target": "ca2048d1",
    "confidence": 0.68
  },
  {
    "source": "1d164677",
    "target": "fbc4faaf",
    "confidence": 0.84
  },
  {
    "source": "1d164677",
    "target": "3ea0627f",
    "confidence": 0.85
  },
  {
    "source": "2dfedb1d",
    "target": "0bb3dad5",
    "confidence": 0.61
  },
  {
    "source": "2dfedb1d",
    "target": "3ea0627f",
    "confidence": 0.54
  },
  {
    "source": "2dfedb1d",
    "target": "1843f5e0",
    "confidence": 0.6
  },
  {
    "source": "30b02fb4",
    "target": "1628cb00",
    "confidence": 0.58
  },
  {
    "source": "30b02fb4",
    "target": "c4733c74",
    "confidence": 0.73
  },
  {
    "source": "30b02fb4",
    "target": "1352e65b",
    "confidence": 0.67
  },
  {
    "source": "30b02fb4",
    "target": "2fafe82c",
    "confidence": 0.83
  },
  {
    "source": "31046b05",
    "target": "30b02fb4",
    "confidence": 0.51
  },
  {
    "source": "31046b05",
    "target": "2fafe82c",
    "confidence": 0.52
  },
  {
    "source": "31046b05",
    "target": "8971b345",
    "confidence": 0.51
  },
  {
    "source": "31046b05",
    "target": "08623e39",
    "confidence": 0.52
  },
  {
    "source": "3b7b01a3",
    "target": "cb8a26f7",
    "confidence": 0.63
  },
  {
    "source": "3b7b01a3",
    "target": "4099b1cd",
    "confidence": 0.58
  },
  {
    "source": "46dfaf07",
    "target": "e59590b5",
    "confidence": 0.76
  },
  {
    "source": "46dfaf07",
    "target": "dc389c74",
    "confidence": 0.83
  },
  {
    "source": "46dfaf07",
    "target": "327df9f1",
    "confidence": 0.77
  },
  {
    "source": "46dfaf07",
    "target": "3c7322d6",
    "confidence": 0.77
  },
  {
    "source": "46dfaf07",
    "target": "647a9a97",
    "confidence": 0.82
  },
  {
    "source": "484da334",
    "target": "920a0977",
    "confidence": 0.73
  },
  {
    "source": "484da334",
    "target": "560cc767",
    "confidence": 0.57
  },
  {
    "source": "4f10fd6e",
    "target": "3e924212",
    "confidence": 0.64
  },
  {
    "source": "4f10fd6e",
    "target": "9ba64e50",
    "confidence": 0.58
  },
  {
    "source": "4f10fd6e",
    "target": "bd3ae202",
    "confidence": 0.7
  },
  {
    "source": "4f10fd6e",
    "target": "a6be27c2",
    "confidence": 0.59
  },
  {
    "source": "4f10fd6e",
    "target": "3a3ddeea",
    "confidence": 0.56
  },
  {
    "source": "8e025b7f",
    "target": "cd309991",
    "confidence": 0.79
  },
  {
    "source": "8e025b7f",
    "target": "647a9a97",
    "confidence": 0.81
  },
  {
    "source": "8e025b7f",
    "target": "004d40f3",
    "confidence": 0.75
  },
  {
    "source": "8e025b7f",
    "target": "99112fe6",
    "confidence": 0.78
  },
  {
    "source": "8e025b7f",
    "target": "def61559",
    "confidence": 0.79
  },
  {
    "source": "8e025b7f",
    "target": "e59590b5",
    "confidence": 0.78
  },
  {
    "source": "8e025b7f",
    "target": "cef214da",
    "confidence": 0.73
  },
  {
    "source": "527b1b5d",
    "target": "2541e5ce",
    "confidence": 0.53
  },
  {
    "source": "527b1b5d",
    "target": "1516d201",
    "confidence": 0.55
  },
  {
    "source": "527b1b5d",
    "target": "68d82c31",
    "confidence": 0.56
  },
  {
    "source": "527b1b5d",
    "target": "33c92385",
    "confidence": 0.56
  },
  {
    "source": "527b1b5d",
    "target": "184ddecc",
    "confidence": 0.54
  },
  {
    "source": "52993e5e",
    "target": "484da334",
    "confidence": 0.56
  },
  {
    "source": "52993e5e",
    "target": "c7f38bf4",
    "confidence": 0.52
  },
  {
    "source": "556b5801",
    "target": "484da334",
    "confidence": 0.69
  },
  {
    "source": "556b5801",
    "target": "52993e5e",
    "confidence": 0.63
  },
  {
    "source": "556b5801",
    "target": "33efa396",
    "confidence": 0.6
  },
  {
    "source": "556b5801",
    "target": "920a0977",
    "confidence": 0.66
  },
  {
    "source": "556b5801",
    "target": "2dfedb1d",
    "confidence": 0.65
  },
  {
    "source": "556b5801",
    "target": "c7f38bf4",
    "confidence": 0.61
  },
  {
    "source": "5a952db4",
    "target": "09b2e1e5",
    "confidence": 0.73
  },
  {
    "source": "5a952db4",
    "target": "7071fc23",
    "confidence": 0.76
  },
  {
    "source": "5a952db4",
    "target": "ca2048d1",
    "confidence": 0.86
  },
  {
    "source": "5abd7ce0",
    "target": "ce9f2bd6",
    "confidence": 0.7
  },
  {
    "source": "5abd7ce0",
    "target": "baa3420b",
    "confidence": 0.7
  },
  {
    "source": "5abd7ce0",
    "target": "049d3e16",
    "confidence": 0.9
  },
  {
    "source": "5abd7ce0",
    "target": "fdd1ea1a",
    "confidence": 0.69
  },
  {
    "source": "5d18e7cd",
    "target": "c9555977",
    "confidence": 0.55
  },
  {
    "source": "5d18e7cd",
    "target": "fff00cf4",
    "confidence": 0.56
  },
  {
    "source": "67f11c63",
    "target": "b2779dbe",
    "confidence": 0.65
  },
  {
    "source": "67f11c63",
    "target": "40921b5f",
    "confidence": 0.65
  },
  {
    "source": "68082205",
    "target": "1843f5e0",
    "confidence": 0.85
  },
  {
    "source": "68082205",
    "target": "b3976b4b",
    "confidence": 0.52
  },
  {
    "source": "68082205",
    "target": "920a0977",
    "confidence": 0.52
  },
  {
    "source": "6a565d52",
    "target": "33efa396",
    "confidence": 0.65
  },
  {
    "source": "6a565d52",
    "target": "c7f38bf4",
    "confidence": 0.76
  },
  {
    "source": "6a565d52",
    "target": "920a0977",
    "confidence": 0.57
  },
  {
    "source": "73cf8b65",
    "target": "891d788a",
    "confidence": 0.71
  },
  {
    "source": "73cf8b65",
    "target": "cd7678ff",
    "confidence": 0.74
  },
  {
    "source": "73cf8b65",
    "target": "8cbf6c51",
    "confidence": 0.72
  },
  {
    "source": "73cf8b65",
    "target": "713dbcd3",
    "confidence": 0.65
  },
  {
    "source": "74146974",
    "target": "16e3d814",
    "confidence": 0.56
  },
  {
    "source": "74146974",
    "target": "7be51af9",
    "confidence": 0.57
  },
  {
    "source": "74146974",
    "target": "1352e65b",
    "confidence": 0.56
  },
  {
    "source": "74146974",
    "target": "7a860867",
    "confidence": 0.58
  },
  {
    "source": "76f882cf",
    "target": "4099b1cd",
    "confidence": 0.72
  },
  {
    "source": "76f882cf",
    "target": "5d18e7cd",
    "confidence": 0.58
  },
  {
    "source": "76f882cf",
    "target": "436ec7d4",
    "confidence": 0.65
  },
  {
    "source": "76f882cf",
    "target": "3b7b01a3",
    "confidence": 0.57
  },
  {
    "source": "76f882cf",
    "target": "8971b345",
    "confidence": 0.58
  },
  {
    "source": "78517778",
    "target": "484da334",
    "confidence": 0.53
  },
  {
    "source": "7a9e7c73",
    "target": "33efa396",
    "confidence": 0.54
  },
  {
    "source": "7a9e7c73",
    "target": "920a0977",
    "confidence": 0.71
  },
  {
    "source": "7a9e7c73",
    "target": "6a565d52",
    "confidence": 0.61
  },
  {
    "source": "7a9e7c73",
    "target": "560cc767",
    "confidence": 0.6
  },
  {
    "source": "7a9e7c73",
    "target": "484da334",
    "confidence": 0.91
  },
  {
    "source": "7b140d47",
    "target": "f3c0378f",
    "confidence": 0.68
  },
  {
    "source": "7b140d47",
    "target": "8d96b61f",
    "confidence": 0.68
  },
  {
    "source": "7b140d47",
    "target": "08580816",
    "confidence": 0.75
  },
  {
    "source": "7b140d47",
    "target": "3eafc6ab",
    "confidence": 0.67
  },
  {
    "source": "7b140d47",
    "target": "2d473467",
    "confidence": 0.75
  },
  {
    "source": "7b140d47",
    "target": "b51d865f",
    "confidence": 0.83
  },
  {
    "source": "80aadaec",
    "target": "c59cc2d6",
    "confidence": 0.65
  },
  {
    "source": "80aadaec",
    "target": "d9809648",
    "confidence": 0.69
  },
  {
    "source": "80aadaec",
    "target": "3c682d57",
    "confidence": 0.68
  },
  {
    "source": "872fe4a6",
    "target": "a996cfda",
    "confidence": 0.76
  },
  {
    "source": "872fe4a6",
    "target": "b8adbe4f",
    "confidence": 0.75
  },
  {
    "source": "872fe4a6",
    "target": "6a4cfe3c",
    "confidence": 0.71
  },
  {
    "source": "872fe4a6",
    "target": "8ac0d11c",
    "confidence": 0.71
  },
  {
    "source": "8c41e5ae",
    "target": "78517778",
    "confidence": 0.85
  },
  {
    "source": "8c41e5ae",
    "target": "bff8bcfb",
    "confidence": 0.55
  },
  {
    "source": "8c41e5ae",
    "target": "1843f5e0",
    "confidence": 0.88
  },
  {
    "source": "8f928790",
    "target": "6c009f14",
    "confidence": 0.58
  },
  {
    "source": "8f928790",
    "target": "1352e65b",
    "confidence": 0.62
  },
  {
    "source": "8f928790",
    "target": "2fafe82c",
    "confidence": 0.6
  },
  {
    "source": "8f928790",
    "target": "30b02fb4",
    "confidence": 0.63
  },
  {
    "source": "8f928790",
    "target": "c4733c74",
    "confidence": 0.66
  },
  {
    "source": "904813fe",
    "target": "ff81c4c2",
    "confidence": 0.77
  },
  {
    "source": "904813fe",
    "target": "052d3ba0",
    "confidence": 0.8
  },
  {
    "source": "92e51970",
    "target": "7abd1f95",
    "confidence": 0.77
  },
  {
    "source": "92e51970",
    "target": "8a69f457",
    "confidence": 0.74
  },
  {
    "source": "92e51970",
    "target": "c25dd86c",
    "confidence": 0.87
  },
  {
    "source": "92e51970",
    "target": "86bebae9",
    "confidence": 0.72
  },
  {
    "source": "92e51970",
    "target": "79fdf425",
    "confidence": 0.73
  },
  {
    "source": "a2bb0ad3",
    "target": "2dfedb1d",
    "confidence": 0.73
  },
  {
    "source": "a2bb0ad3",
    "target": "52993e5e",
    "confidence": 0.52
  },
  {
    "source": "a2bb0ad3",
    "target": "68082205",
    "confidence": 0.55
  },
  {
    "source": "a2bb0ad3",
    "target": "0bb3dad5",
    "confidence": 0.56
  },
  {
    "source": "a2bb0ad3",
    "target": "556b5801",
    "confidence": 0.69
  },
  {
    "source": "a709ebcd",
    "target": "5a8dbd74",
    "confidence": 0.66
  },
  {
    "source": "a709ebcd",
    "target": "8d96b61f",
    "confidence": 0.63
  },
  {
    "source": "a709ebcd",
    "target": "b51d865f",
    "confidence": 0.65
  },
  {
    "source": "a709ebcd",
    "target": "f3c0378f",
    "confidence": 0.75
  },
  {
    "source": "a709ebcd",
    "target": "3eafc6ab",
    "confidence": 0.59
  },
  {
    "source": "a8c89681",
    "target": "5c657965",
    "confidence": 0.67
  },
  {
    "source": "a8c89681",
    "target": "ea8a0669",
    "confidence": 0.68
  },
  {
    "source": "aa2ea348",
    "target": "700bb926",
    "confidence": 0.58
  },
  {
    "source": "aa2ea348",
    "target": "60bf1355",
    "confidence": 0.66
  },
  {
    "source": "aa2ea348",
    "target": "d7de203f",
    "confidence": 0.7
  },
  {
    "source": "aa2ea348",
    "target": "5f8a8dbb",
    "confidence": 0.64
  },
  {
    "source": "aa2ea348",
    "target": "1c83f120",
    "confidence": 0.61
  },
  {
    "source": "aaca8e26",
    "target": "431f97f2",
    "confidence": 0.65
  },
  {
    "source": "aaca8e26",
    "target": "0f1eb55f",
    "confidence": 0.62
  },
  {
    "source": "aaca8e26",
    "target": "48afc7c9",
    "confidence": 0.63
  },
  {
    "source": "aaca8e26",
    "target": "28272a35",
    "confidence": 0.61
  },
  {
    "source": "aaca8e26",
    "target": "0eadb747",
    "confidence": 0.68
  },
  {
    "source": "abaa55ea",
    "target": "6335c531",
    "confidence": 0.73
  },
  {
    "source": "abaa55ea",
    "target": "998a86c4",
    "confidence": 0.63
  },
  {
    "source": "abaa55ea",
    "target": "71327717",
    "confidence": 0.62
  },
  {
    "source": "abaa55ea",
    "target": "992d2f01",
    "confidence": 0.62
  },
  {
    "source": "abaa55ea",
    "target": "e2965509",
    "confidence": 0.59
  },
  {
    "source": "b373f4a8",
    "target": "6b296ce4",
    "confidence": 0.62
  },
  {
    "source": "b373f4a8",
    "target": "8fbc9de8",
    "confidence": 0.6
  },
  {
    "source": "b373f4a8",
    "target": "3f1ef044",
    "confidence": 0.62
  },
  {
    "source": "b373f4a8",
    "target": "449ea271",
    "confidence": 0.65
  },
  {
    "source": "b373f4a8",
    "target": "ddd14ae3",
    "confidence": 0.71
  },
  {
    "source": "b3baf326",
    "target": "b49b36b7",
    "confidence": 0.54
  },
  {
    "source": "b3baf326",
    "target": "7be51af9",
    "confidence": 0.56
  },
  {
    "source": "b3baf326",
    "target": "879a27ab",
    "confidence": 0.74
  },
  {
    "source": "b3baf326",
    "target": "60bf1355",
    "confidence": 0.55
  },
  {
    "source": "b3baf326",
    "target": "d7de203f",
    "confidence": 0.65
  },
  {
    "source": "b562e5d5",
    "target": "78517778",
    "confidence": 0.82
  },
  {
    "source": "b562e5d5",
    "target": "0bb3dad5",
    "confidence": 0.84
  },
  {
    "source": "b562e5d5",
    "target": "1843f5e0",
    "confidence": 0.84
  },
  {
    "source": "b562e5d5",
    "target": "68082205",
    "confidence": 0.77
  },
  {
    "source": "b562e5d5",
    "target": "8c41e5ae",
    "confidence": 0.81
  },
  {
    "source": "b5e97d91",
    "target": "2fafe82c",
    "confidence": 0.56
  },
  {
    "source": "b5e97d91",
    "target": "1628cb00",
    "confidence": 0.61
  },
  {
    "source": "b5e97d91",
    "target": "47e15cd1",
    "confidence": 0.57
  },
  {
    "source": "b5e97d91",
    "target": "7c50570c",
    "confidence": 0.6
  },
  {
    "source": "b5e97d91",
    "target": "31046b05",
    "confidence": 0.81
  },
  {
    "source": "b63a3813",
    "target": "bff8bcfb",
    "confidence": 0.56
  },
  {
    "source": "b63a3813",
    "target": "b105ac84",
    "confidence": 0.54
  },
  {
    "source": "b63a3813",
    "target": "78517778",
    "confidence": 0.88
  },
  {
    "source": "b63a3813",
    "target": "1843f5e0",
    "confidence": 0.89
  },
  {
    "source": "b966c124",
    "target": "7b140d47",
    "confidence": 0.64
  },
  {
    "source": "b966c124",
    "target": "5a8dbd74",
    "confidence": 0.71
  },
  {
    "source": "b966c124",
    "target": "b51d865f",
    "confidence": 0.63
  },
  {
    "source": "b966c124",
    "target": "f3c0378f",
    "confidence": 0.88
  },
  {
    "source": "b966c124",
    "target": "a709ebcd",
    "confidence": 0.7
  },
  {
    "source": "bcd8a281",
    "target": "1566632d",
    "confidence": 0.77
  },
  {
    "source": "bcd8a281",
    "target": "dd9e5eee",
    "confidence": 0.72
  },
  {
    "source": "bcd8a281",
    "target": "412c4095",
    "confidence": 0.75
  },
  {
    "source": "bcd8a281",
    "target": "85877c54",
    "confidence": 0.72
  },
  {
    "source": "bcd8a281",
    "target": "e7359e73",
    "confidence": 0.75
  },
  {
    "source": "c50b2280",
    "target": "2fafe82c",
    "confidence": 0.55
  },
  {
    "source": "c50b2280",
    "target": "497a8e09",
    "confidence": 0.55
  },
  {
    "source": "c50b2280",
    "target": "8971b345",
    "confidence": 0.55
  },
  {
    "source": "c50b2280",
    "target": "7c50570c",
    "confidence": 0.75
  },
  {
    "source": "c50b2280",
    "target": "47e15cd1",
    "confidence": 0.55
  },
  {
    "source": "cc57178f",
    "target": "4b721142",
    "confidence": 0.79
  },
  {
    "source": "d0a21c02",
    "target": "41633d1c",
    "confidence": 0.57
  },
  {
    "source": "d0a21c02",
    "target": "df6905c9",
    "confidence": 0.6
  },
  {
    "source": "d0a21c02",
    "target": "b7a6866e",
    "confidence": 0.65
  },
  {
    "source": "d0a21c02",
    "target": "844ed030",
    "confidence": 0.6
  },
  {
    "source": "d0a21c02",
    "target": "700bb926",
    "confidence": 0.58
  },
  {
    "source": "d2982205",
    "target": "99112fe6",
    "confidence": 0.77
  },
  {
    "source": "d2982205",
    "target": "def61559",
    "confidence": 0.79
  },
  {
    "source": "d2982205",
    "target": "d9e3aa5c",
    "confidence": 0.68
  },
  {
    "source": "d2982205",
    "target": "b8707264",
    "confidence": 0.69
  },
  {
    "source": "d2982205",
    "target": "8e025b7f",
    "confidence": 0.73
  },
  {
    "source": "d7851dc5",
    "target": "cbc05683",
    "confidence": 0.67
  },
  {
    "source": "d7851dc5",
    "target": "53e0a25c",
    "confidence": 0.57
  },
  {
    "source": "d7851dc5",
    "target": "fcb300c2",
    "confidence": 0.57
  },
  {
    "source": "d7851dc5",
    "target": "120de3cc",
    "confidence": 0.6
  },
  {
    "source": "d7851dc5",
    "target": "5d18e7cd",
    "confidence": 0.66
  },
  {
    "source": "d9a61e0c",
    "target": "c7f38bf4",
    "confidence": 0.6
  },
  {
    "source": "d9a61e0c",
    "target": "920a0977",
    "confidence": 0.63
  },
  {
    "source": "d9a61e0c",
    "target": "33efa396",
    "confidence": 0.61
  },
  {
    "source": "d9a61e0c",
    "target": "7a9e7c73",
    "confidence": 0.6
  },
  {
    "source": "d9a61e0c",
    "target": "484da334",
    "confidence": 0.59
  },
  {
    "source": "d9a61e0c",
    "target": "52993e5e",
    "confidence": 0.61
  },
  {
    "source": "e7286478",
    "target": "049a933e",
    "confidence": 0.66
  },
  {
    "source": "e7286478",
    "target": "0f1eb55f",
    "confidence": 0.83
  },
  {
    "source": "e7286478",
    "target": "450639fa",
    "confidence": 0.67
  },
  {
    "source": "e7286478",
    "target": "35cdd473",
    "confidence": 0.67
  },
  {
    "source": "e7286478",
    "target": "69d330da",
    "confidence": 0.65
  },
  {
    "source": "e8caaf21",
    "target": "80aadaec",
    "confidence": 0.72
  },
  {
    "source": "e8caaf21",
    "target": "7e96aae4",
    "confidence": 0.6
  },
  {
    "source": "e8caaf21",
    "target": "d9809648",
    "confidence": 0.62
  },
  {
    "source": "e8caaf21",
    "target": "cb8a26f7",
    "confidence": 0.62
  },
  {
    "source": "e8caaf21",
    "target": "df6905c9",
    "confidence": 0.63
  },
  {
    "source": "ec6718be",
    "target": "30b02fb4",
    "confidence": 0.69
  },
  {
    "source": "ec6718be",
    "target": "c4733c74",
    "confidence": 0.84
  },
  {
    "source": "ec6718be",
    "target": "879a27ab",
    "confidence": 0.62
  },
  {
    "source": "ec6718be",
    "target": "8f928790",
    "confidence": 0.65
  },
  {
    "source": "ec6718be",
    "target": "1352e65b",
    "confidence": 0.7
  },
  {
    "source": "ec6718be",
    "target": "2fafe82c",
    "confidence": 0.76
  },
  {
    "source": "ed673f33",
    "target": "1843f5e0",
    "confidence": 0.82
  },
  {
    "source": "ed673f33",
    "target": "b63a3813",
    "confidence": 0.82
  },
  {
    "source": "ed673f33",
    "target": "8c41e5ae",
    "confidence": 0.78
  },
  {
    "source": "ed673f33",
    "target": "78517778",
    "confidence": 0.81
  },
  {
    "source": "ed673f33",
    "target": "d9a61e0c",
    "confidence": 0.55
  },
  {
    "source": "f3e29ce3",
    "target": "b8adbe4f",
    "confidence": 0.56
  },
  {
    "source": "f3e29ce3",
    "target": "8072c9ca",
    "confidence": 0.59
  },
  {
    "source": "f4f4472e",
    "target": "2107c251",
    "confidence": 0.65
  },
  {
    "source": "f4f4472e",
    "target": "85351a6c",
    "confidence": 0.69
  },
  {
    "source": "f4f4472e",
    "target": "40506927",
    "confidence": 0.74
  },
  {
    "source": "f4f4472e",
    "target": "436bfcd3",
    "confidence": 0.82
  },
  {
    "source": "f4f4472e",
    "target": "6f5f3d7a",
    "confidence": 0.88
  },
  {
    "source": "f51da9b9",
    "target": "3ea0627f",
    "confidence": 0.65
  },
  {
    "source": "f51da9b9",
    "target": "33031019",
    "confidence": 0.68
  },
  {
    "source": "f51da9b9",
    "target": "fbc4faaf",
    "confidence": 0.68
  },
  {
    "source": "f51da9b9",
    "target": "1d164677",
    "confidence": 0.72
  },
  {
    "source": "f51da9b9",
    "target": "3283659e",
    "confidence": 0.66
  },
  {
    "source": "f551d355",
    "target": "4099b1cd",
    "confidence": 0.58
  },
  {
    "source": "f551d355",
    "target": "47e15cd1",
    "confidence": 0.6
  },
  {
    "source": "f551d355",
    "target": "8971b345",
    "confidence": 0.65
  },
  {
    "source": "f551d355",
    "target": "16e3d814",
    "confidence": 0.93
  },
  {
    "source": "f5776fde",
    "target": "fef77e18",
    "confidence": 0.58
  },
  {
    "source": "f5776fde",
    "target": "14324148",
    "confidence": 0.59
  },
  {
    "source": "f5776fde",
    "target": "1516d201",
    "confidence": 0.61
  },
  {
    "source": "a0d5c625",
    "target": "eec4da11",
    "confidence": 0.79
  },
  {
    "source": "a0d5c625",
    "target": "6f174a1f",
    "confidence": 0.69
  },
  {
    "source": "a0d5c625",
    "target": "2d473467",
    "confidence": 0.76
  },
  {
    "source": "a0d5c625",
    "target": "9eb95500",
    "confidence": 0.73
  },
  {
    "source": "a0d5c625",
    "target": "a8c89681",
    "confidence": 0.66
  },
  {
    "source": "f1b2a17f",
    "target": "507ff4c9",
    "confidence": 0.72
  },
  {
    "source": "f1b2a17f",
    "target": "9eb95500",
    "confidence": 0.71
  },
  {
    "source": "f1b2a17f",
    "target": "a0d5c625",
    "confidence": 0.74
  },
  {
    "source": "9cb08386",
    "target": "41836b44",
    "confidence": 0.7
  },
  {
    "source": "9cb08386",
    "target": "df6e49d5",
    "confidence": 0.7
  },
  {
    "source": "9cb08386",
    "target": "c6993b06",
    "confidence": 0.71
  },
  {
    "source": "6123bd9d",
    "target": "9eb95500",
    "confidence": 0.72
  },
  {
    "source": "6123bd9d",
    "target": "a0d5c625",
    "confidence": 0.76
  },
  {
    "source": "6123bd9d",
    "target": "eec4da11",
    "confidence": 0.76
  },
  {
    "source": "6123bd9d",
    "target": "2d473467",
    "confidence": 0.74
  },
  {
    "source": "12febdc3",
    "target": "a0d5c625",
    "confidence": 0.75
  },
  {
    "source": "12febdc3",
    "target": "eec4da11",
    "confidence": 0.74
  },
  {
    "source": "12febdc3",
    "target": "08580816",
    "confidence": 0.65
  },
  {
    "source": "12febdc3",
    "target": "2d473467",
    "confidence": 0.78
  },
  {
    "source": "12febdc3",
    "target": "6123bd9d",
    "confidence": 0.89
  },
  {
    "source": "12febdc3",
    "target": "9eb95500",
    "confidence": 0.72
  },
  {
    "source": "fe99d23a",
    "target": "12febdc3",
    "confidence": 0.74
  },
  {
    "source": "fe99d23a",
    "target": "5a952db4",
    "confidence": 0.7
  },
  {
    "source": "fe99d23a",
    "target": "a0d5c625",
    "confidence": 0.9
  },
  {
    "source": "fe99d23a",
    "target": "eec4da11",
    "confidence": 0.77
  },
  {
    "source": "fe99d23a",
    "target": "f1b2a17f",
    "confidence": 0.74
  },
  {
    "source": "fe99d23a",
    "target": "2d473467",
    "confidence": 0.78
  },
  {
    "source": "829796c5",
    "target": "a8c89681",
    "confidence": 0.71
  },
  {
    "source": "829796c5",
    "target": "f1b2a17f",
    "confidence": 0.71
  },
  {
    "source": "829796c5",
    "target": "a0d5c625",
    "confidence": 0.7
  },
  {
    "source": "d4c74dd2",
    "target": "b87ed21f",
    "confidence": 0.72
  },
  {
    "source": "d4c74dd2",
    "target": "eec4da11",
    "confidence": 0.94
  },
  {
    "source": "d4c74dd2",
    "target": "fe99d23a",
    "confidence": 0.76
  },
  {
    "source": "d4c74dd2",
    "target": "a0d5c625",
    "confidence": 0.76
  },
  {
    "source": "d4c74dd2",
    "target": "6f174a1f",
    "confidence": 0.7
  },
  {
    "source": "7be084b2",
    "target": "fe99d23a",
    "confidence": 0.69
  },
  {
    "source": "7be084b2",
    "target": "a8c89681",
    "confidence": 0.69
  },
  {
    "source": "7be084b2",
    "target": "f1b2a17f",
    "confidence": 0.76
  },
  {
    "source": "7be084b2",
    "target": "a0d5c625",
    "confidence": 0.7
  },
  {
    "source": "7be084b2",
    "target": "829796c5",
    "confidence": 0.79
  },
  {
    "source": "6d059011",
    "target": "829796c5",
    "confidence": 0.71
  },
  {
    "source": "6d059011",
    "target": "fe99d23a",
    "confidence": 0.81
  },
  {
    "source": "6d059011",
    "target": "12febdc3",
    "confidence": 0.78
  },
  {
    "source": "6d059011",
    "target": "2d473467",
    "confidence": 0.87
  },
  {
    "source": "6d059011",
    "target": "6f174a1f",
    "confidence": 0.72
  },
  {
    "source": "6d059011",
    "target": "a0d5c625",
    "confidence": 0.8
  },
  {
    "source": "6d059011",
    "target": "6123bd9d",
    "confidence": 0.76
  },
  {
    "source": "6d059011",
    "target": "d4c74dd2",
    "confidence": 0.74
  },
  {
    "source": "75734010",
    "target": "21e43253",
    "confidence": 0.64
  },
  {
    "source": "75734010",
    "target": "f660097c",
    "confidence": 0.64
  },
  {
    "source": "75734010",
    "target": "b87ed21f",
    "confidence": 0.65
  },
  {
    "source": "75734010",
    "target": "7e96aae4",
    "confidence": 0.86
  },
  {
    "source": "21cf0920",
    "target": "d3275657",
    "confidence": 0.78
  },
  {
    "source": "21cf0920",
    "target": "c6993b06",
    "confidence": 0.82
  },
  {
    "source": "21cf0920",
    "target": "df6e49d5",
    "confidence": 0.82
  },
  {
    "source": "21cf0920",
    "target": "9cb08386",
    "confidence": 0.72
  },
  {
    "source": "21cf0920",
    "target": "eb68efad",
    "confidence": 0.69
  },
  {
    "source": "17447be0",
    "target": "d3275657",
    "confidence": 0.74
  },
  {
    "source": "17447be0",
    "target": "21cf0920",
    "confidence": 0.76
  },
  {
    "source": "17447be0",
    "target": "c6993b06",
    "confidence": 0.73
  },
  {
    "source": "17447be0",
    "target": "df6e49d5",
    "confidence": 0.72
  },
  {
    "source": "09ee5de7",
    "target": "b87ed21f",
    "confidence": 0.71
  },
  {
    "source": "09ee5de7",
    "target": "4d44ba53",
    "confidence": 0.71
  },
  {
    "source": "09ee5de7",
    "target": "a794ada0",
    "confidence": 0.71
  },
  {
    "source": "24612a6f",
    "target": "44b98e29",
    "confidence": 0.65
  },
  {
    "source": "24612a6f",
    "target": "75734010",
    "confidence": 0.7
  },
  {
    "source": "24612a6f",
    "target": "7e96aae4",
    "confidence": 0.71
  },
  {
    "source": "24612a6f",
    "target": "f5776fde",
    "confidence": 0.62
  },
  {
    "source": "24612a6f",
    "target": "f660097c",
    "confidence": 0.69
  },
  {
    "source": "1f7e3c70",
    "target": "6123bd9d",
    "confidence": 0.66
  },
  {
    "source": "1f7e3c70",
    "target": "1c32c00d",
    "confidence": 0.93
  },
  {
    "source": "0010ef78",
    "target": "1c32c00d",
    "confidence": 0.9
  },
  {
    "source": "0010ef78",
    "target": "1f7e3c70",
    "confidence": 0.89
  },
  {
    "source": "260f015b",
    "target": "1f7e3c70",
    "confidence": 0.9
  },
  {
    "source": "260f015b",
    "target": "0010ef78",
    "confidence": 0.93
  },
  {
    "source": "260f015b",
    "target": "1c32c00d",
    "confidence": 0.94
  },
  {
    "source": "260f015b",
    "target": "6123bd9d",
    "confidence": 0.71
  },
  {
    "source": "5b4ec0d9",
    "target": "b798b44d",
    "confidence": 0.71
  },
  {
    "source": "5b4ec0d9",
    "target": "09ee5de7",
    "confidence": 0.81
  },
  {
    "source": "5b4ec0d9",
    "target": "0f39d1d0",
    "confidence": 0.72
  },
  {
    "source": "530b9625",
    "target": "5b4ec0d9",
    "confidence": 0.72
  },
  {
    "source": "530b9625",
    "target": "1c32c00d",
    "confidence": 0.71
  },
  {
    "source": "530b9625",
    "target": "0010ef78",
    "confidence": 0.73
  },
  {
    "source": "530b9625",
    "target": "a794ada0",
    "confidence": 0.72
  },
  {
    "source": "530b9625",
    "target": "09ee5de7",
    "confidence": 0.71
  },
  {
    "source": "530b9625",
    "target": "4d44ba53",
    "confidence": 0.74
  },
  {
    "source": "32e264e5",
    "target": "1c32c00d",
    "confidence": 0.73
  },
  {
    "source": "32e264e5",
    "target": "0010ef78",
    "confidence": 0.75
  },
  {
    "source": "32e264e5",
    "target": "4d44ba53",
    "confidence": 0.74
  },
  {
    "source": "32e264e5",
    "target": "530b9625",
    "confidence": 0.92
  },
  {
    "source": "32e264e5",
    "target": "1f7e3c70",
    "confidence": 0.72
  },
  {
    "source": "32e264e5",
    "target": "5b4ec0d9",
    "confidence": 0.72
  },
  {
    "source": "32e264e5",
    "target": "260f015b",
    "confidence": 0.74
  },
  {
    "source": "575fc898",
    "target": "cc57178f",
    "confidence": 0.74
  },
  {
    "source": "575fc898",
    "target": "73cf8b65",
    "confidence": 0.69
  },
  {
    "source": "2d7df2fe",
    "target": "7cecad26",
    "confidence": 0.69
  },
  {
    "source": "0f700783",
    "target": "1f58a25a",
    "confidence": 0.52
  },
  {
    "source": "0f700783",
    "target": "8072c9ca",
    "confidence": 0.52
  },
  {
    "source": "0f700783",
    "target": "9b4b83a7",
    "confidence": 0.53
  },
  {
    "source": "0f700783",
    "target": "7d3ae136",
    "confidence": 0.55
  },
  {
    "source": "0f700783",
    "target": "1b7dc192",
    "confidence": 0.53
  },
  {
    "source": "ffc5ba5e",
    "target": "4d44ba53",
    "confidence": 0.61
  },
  {
    "source": "ffc5ba5e",
    "target": "0010ef78",
    "confidence": 0.6
  },
  {
    "source": "ffc5ba5e",
    "target": "530b9625",
    "confidence": 0.61
  },
  {
    "source": "ffc5ba5e",
    "target": "8a69f457",
    "confidence": 0.59
  },
  {
    "source": "c7239f23",
    "target": "cc57178f",
    "confidence": 0.64
  },
  {
    "source": "c7239f23",
    "target": "575fc898",
    "confidence": 0.74
  },
  {
    "source": "c7239f23",
    "target": "67f11c63",
    "confidence": 0.65
  },
  {
    "source": "c7239f23",
    "target": "2d7df2fe",
    "confidence": 0.79
  },
  {
    "source": "9ebdb8c5",
    "target": "cc57178f",
    "confidence": 0.62
  },
  {
    "source": "9ebdb8c5",
    "target": "2d7df2fe",
    "confidence": 0.73
  },
  {
    "source": "9ebdb8c5",
    "target": "c7239f23",
    "confidence": 0.8
  },
  {
    "source": "ad011f28",
    "target": "ac5bc0e0",
    "confidence": 0.69
  },
  {
    "source": "ad011f28",
    "target": "844ed030",
    "confidence": 0.68
  },
  {
    "source": "ad011f28",
    "target": "df6905c9",
    "confidence": 0.69
  },
  {
    "source": "ad011f28",
    "target": "14f56a6a",
    "confidence": 0.73
  },
  {
    "source": "ad011f28",
    "target": "12a82302",
    "confidence": 0.68
  },
  {
    "source": "8bed27b1",
    "target": "df6e49d5",
    "confidence": 0.67
  },
  {
    "source": "37e5becb",
    "target": "0238c976",
    "confidence": 0.69
  },
  {
    "source": "37e5becb",
    "target": "df6e49d5",
    "confidence": 0.7
  },
  {
    "source": "37e5becb",
    "target": "8bed27b1",
    "confidence": 0.9
  },
  {
    "source": "37e5becb",
    "target": "1699005f",
    "confidence": 0.69
  },
  {
    "source": "5d832347",
    "target": "37e5becb",
    "confidence": 0.84
  },
  {
    "source": "5d832347",
    "target": "014f54bd",
    "confidence": 0.66
  },
  {
    "source": "5d832347",
    "target": "8bed27b1",
    "confidence": 0.78
  },
  {
    "source": "5d832347",
    "target": "700bb926",
    "confidence": 0.67
  },
  {
    "source": "5d832347",
    "target": "5a816525",
    "confidence": 0.66
  },
  {
    "source": "e7d7a682",
    "target": "41f6c1dd",
    "confidence": 0.79
  },
  {
    "source": "e7d7a682",
    "target": "a18b6665",
    "confidence": 0.7
  },
  {
    "source": "f1ed80eb",
    "target": "41f6c1dd",
    "confidence": 0.71
  },
  {
    "source": "f1ed80eb",
    "target": "e7d7a682",
    "confidence": 0.75
  },
  {
    "source": "f1ed80eb",
    "target": "fcd2fdfb",
    "confidence": 0.79
  },
  {
    "source": "0b7faa65",
    "target": "41f6c1dd",
    "confidence": 0.71
  },
  {
    "source": "0b7faa65",
    "target": "652b35e9",
    "confidence": 0.8
  },
  {
    "source": "0b7faa65",
    "target": "e7d7a682",
    "confidence": 0.76
  },
  {
    "source": "0b7faa65",
    "target": "bb2895ae",
    "confidence": 0.68
  },
  {
    "source": "e4ce790b",
    "target": "0b7faa65",
    "confidence": 0.77
  },
  {
    "source": "e4ce790b",
    "target": "87cb1256",
    "confidence": 0.8
  },
  {
    "source": "e4ce790b",
    "target": "e7d7a682",
    "confidence": 0.76
  },
  {
    "source": "123052fa",
    "target": "e7d7a682",
    "confidence": 0.76
  },
  {
    "source": "123052fa",
    "target": "39a6689b",
    "confidence": 0.68
  },
  {
    "source": "123052fa",
    "target": "1b9d7b0f",
    "confidence": 0.79
  },
  {
    "source": "123052fa",
    "target": "e4ce790b",
    "confidence": 0.89
  },
  {
    "source": "123052fa",
    "target": "0b7faa65",
    "confidence": 0.78
  },
  {
    "source": "6c4e8997",
    "target": "87cb1256",
    "confidence": 0.82
  },
  {
    "source": "6c4e8997",
    "target": "e4ce790b",
    "confidence": 0.81
  },
  {
    "source": "6c4e8997",
    "target": "0b7faa65",
    "confidence": 0.79
  },
  {
    "source": "6c4e8997",
    "target": "41f6c1dd",
    "confidence": 0.77
  },
  {
    "source": "6c4e8997",
    "target": "1b9d7b0f",
    "confidence": 0.87
  },
  {
    "source": "241d1484",
    "target": "6c4e8997",
    "confidence": 0.77
  },
  {
    "source": "241d1484",
    "target": "1b9d7b0f",
    "confidence": 0.74
  },
  {
    "source": "241d1484",
    "target": "f1ed80eb",
    "confidence": 0.69
  },
  {
    "source": "241d1484",
    "target": "123052fa",
    "confidence": 0.86
  },
  {
    "source": "241d1484",
    "target": "e4ce790b",
    "confidence": 0.89
  },
  {
    "source": "cd10b32b",
    "target": "f1ed80eb",
    "confidence": 0.64
  },
  {
    "source": "cd10b32b",
    "target": "41f6c1dd",
    "confidence": 0.67
  },
  {
    "source": "cd10b32b",
    "target": "e7d7a682",
    "confidence": 0.73
  },
  {
    "source": "cd10b32b",
    "target": "70a91a40",
    "confidence": 0.67
  },
  {
    "source": "a5c2eb9f",
    "target": "d9e3aa5c",
    "confidence": 0.56
  },
  {
    "source": "a5c2eb9f",
    "target": "ca369d81",
    "confidence": 0.57
  },
  {
    "source": "a5c2eb9f",
    "target": "92f6487f",
    "confidence": 0.59
  },
  {
    "source": "a5c2eb9f",
    "target": "e88a3319",
    "confidence": 0.6
  },
  {
    "source": "8c2c0866",
    "target": "6ce61009",
    "confidence": 0.57
  },
  {
    "source": "8c2c0866",
    "target": "ca369d81",
    "confidence": 0.66
  },
  {
    "source": "8c2c0866",
    "target": "00cf0443",
    "confidence": 0.66
  },
  {
    "source": "8c2c0866",
    "target": "e7d7a682",
    "confidence": 0.57
  },
  {
    "source": "8c2c0866",
    "target": "fcd2fdfb",
    "confidence": 0.57
  },
  {
    "source": "8c2c0866",
    "target": "a5c2eb9f",
    "confidence": 0.57
  },
  {
    "source": "2ecf582c",
    "target": "24612a6f",
    "confidence": 0.66
  },
  {
    "source": "2ecf582c",
    "target": "440bb080",
    "confidence": 0.61
  },
  {
    "source": "2ecf582c",
    "target": "f5776fde",
    "confidence": 0.69
  },
  {
    "source": "2ecf582c",
    "target": "80aadaec",
    "confidence": 0.7
  },
  {
    "source": "2ecf582c",
    "target": "67d45e81",
    "confidence": 0.66
  },
  {
    "source": "2ecf582c",
    "target": "e8caaf21",
    "confidence": 0.67
  },
  {
    "source": "246f5b38",
    "target": "c624be6b",
    "confidence": 0.64
  },
  {
    "source": "246f5b38",
    "target": "5e7c42f4",
    "confidence": 0.59
  },
  {
    "source": "246f5b38",
    "target": "0f920e26",
    "confidence": 0.61
  },
  {
    "source": "246f5b38",
    "target": "3277f8da",
    "confidence": 0.62
  },
  {
    "source": "246f5b38",
    "target": "11d26b1b",
    "confidence": 0.59
  },
  {
    "source": "4aa8d1d0",
    "target": "3204b29d",
    "confidence": 0.6
  },
  {
    "source": "4aa8d1d0",
    "target": "e7d7a682",
    "confidence": 0.75
  },
  {
    "source": "4aa8d1d0",
    "target": "cd10b32b",
    "confidence": 0.76
  },
  {
    "source": "4aa8d1d0",
    "target": "fcd2fdfb",
    "confidence": 0.7
  },
  {
    "source": "4aa8d1d0",
    "target": "f1ed80eb",
    "confidence": 0.66
  },
  {
    "source": "4aa8d1d0",
    "target": "41f6c1dd",
    "confidence": 0.73
  },
  {
    "source": "cb40ccd5",
    "target": "d395c926",
    "confidence": 0.64
  },
  {
    "source": "cb40ccd5",
    "target": "484024e3",
    "confidence": 0.65
  },
  {
    "source": "cb40ccd5",
    "target": "e7719d07",
    "confidence": 0.64
  },
  {
    "source": "cb40ccd5",
    "target": "5d467ffd",
    "confidence": 0.67
  },
  {
    "source": "cb40ccd5",
    "target": "3728477e",
    "confidence": 0.69
  },
  {
    "source": "243bac8d",
    "target": "37688dad",
    "confidence": 0.6
  },
  {
    "source": "243bac8d",
    "target": "992d2f01",
    "confidence": 0.61
  },
  {
    "source": "243bac8d",
    "target": "1026b0fb",
    "confidence": 0.59
  },
  {
    "source": "22803b15",
    "target": "fecbb633",
    "confidence": 0.6
  },
  {
    "source": "22803b15",
    "target": "65164a95",
    "confidence": 0.57
  },
  {
    "source": "22803b15",
    "target": "243bac8d",
    "confidence": 0.64
  },
  {
    "source": "22803b15",
    "target": "18dd7983",
    "confidence": 0.58
  },
  {
    "source": "22803b15",
    "target": "3b7b01a3",
    "confidence": 0.64
  },
  {
    "source": "5d9aaf8c",
    "target": "b3f0b660",
    "confidence": 0.6
  },
  {
    "source": "5d9aaf8c",
    "target": "c624be6b",
    "confidence": 0.58
  },
  {
    "source": "ef5b4d82",
    "target": "d9c97e1f",
    "confidence": 0.6
  },
  {
    "source": "ef5b4d82",
    "target": "0f920e26",
    "confidence": 0.6
  },
  {
    "source": "ef5b4d82",
    "target": "5d9aaf8c",
    "confidence": 0.67
  },
  {
    "source": "5f99bc4a",
    "target": "b3f0b660",
    "confidence": 0.56
  },
  {
    "source": "5f99bc4a",
    "target": "ef5b4d82",
    "confidence": 0.66
  },
  {
    "source": "5f99bc4a",
    "target": "2dfa4958",
    "confidence": 0.56
  },
  {
    "source": "5f99bc4a",
    "target": "5d9aaf8c",
    "confidence": 0.89
  },
  {
    "source": "6b4db884",
    "target": "5d9aaf8c",
    "confidence": 0.65
  },
  {
    "source": "6b4db884",
    "target": "b3f0b660",
    "confidence": 0.59
  },
  {
    "source": "6b4db884",
    "target": "ef5b4d82",
    "confidence": 0.93
  },
  {
    "source": "6b4db884",
    "target": "0f920e26",
    "confidence": 0.59
  },
  {
    "source": "6b4db884",
    "target": "5f99bc4a",
    "confidence": 0.72
  },
  {
    "source": "d01c35e5",
    "target": "9016d792",
    "confidence": 0.67
  },
  {
    "source": "d01c35e5",
    "target": "f01f07c0",
    "confidence": 0.68
  },
  {
    "source": "d01c35e5",
    "target": "303706d1",
    "confidence": 0.64
  },
  {
    "source": "d01c35e5",
    "target": "bff8bcfb",
    "confidence": 0.69
  },
  {
    "source": "d01c35e5",
    "target": "58196f0e",
    "confidence": 0.74
  },
  {
    "source": "7d591f2f",
    "target": "7b95bcc2",
    "confidence": 0.62
  },
  {
    "source": "7d591f2f",
    "target": "f01f07c0",
    "confidence": 0.68
  },
  {
    "source": "7d591f2f",
    "target": "f997db4d",
    "confidence": 0.69
  },
  {
    "source": "7d591f2f",
    "target": "d01c35e5",
    "confidence": 0.74
  },
  {
    "source": "7d591f2f",
    "target": "9016d792",
    "confidence": 0.65
  },
  {
    "source": "7d591f2f",
    "target": "58196f0e",
    "confidence": 0.64
  },
  {
    "source": "7d591f2f",
    "target": "303706d1",
    "confidence": 0.64
  },
  {
    "source": "fca4cb9c",
    "target": "7cecad26",
    "confidence": 0.7
  },
  {
    "source": "fca4cb9c",
    "target": "2d7df2fe",
    "confidence": 0.74
  },
  {
    "source": "fca4cb9c",
    "target": "9ebdb8c5",
    "confidence": 0.74
  },
  {
    "source": "fca4cb9c",
    "target": "c7239f23",
    "confidence": 0.93
  },
  {
    "source": "55a8796d",
    "target": "2d7df2fe",
    "confidence": 0.71
  },
  {
    "source": "55a8796d",
    "target": "fca4cb9c",
    "confidence": 0.86
  },
  {
    "source": "55a8796d",
    "target": "575fc898",
    "confidence": 0.69
  },
  {
    "source": "55a8796d",
    "target": "c7239f23",
    "confidence": 0.86
  },
  {
    "source": "55a8796d",
    "target": "9ebdb8c5",
    "confidence": 0.7
  },
  {
    "source": "bece555b",
    "target": "71327717",
    "confidence": 0.77
  },
  {
    "source": "bece555b",
    "target": "e2965509",
    "confidence": 0.6
  },
  {
    "source": "bece555b",
    "target": "6335c531",
    "confidence": 0.71
  },
  {
    "source": "bece555b",
    "target": "abaa55ea",
    "confidence": 0.83
  },
  {
    "source": "bece555b",
    "target": "58404a8f",
    "confidence": 0.77
  },
  {
    "source": "e89cdeb8",
    "target": "ff81c4c2",
    "confidence": 0.83
  },
  {
    "source": "e89cdeb8",
    "target": "052d3ba0",
    "confidence": 0.85
  },
  {
    "source": "e89cdeb8",
    "target": "baa3420b",
    "confidence": 0.81
  },
  {
    "source": "e89cdeb8",
    "target": "803c94ed",
    "confidence": 0.71
  },
  {
    "source": "e89cdeb8",
    "target": "904813fe",
    "confidence": 0.78
  },
  {
    "source": "e89cdeb8",
    "target": "7f503589",
    "confidence": 0.83
  },
  {
    "source": "bc28e434",
    "target": "7d591f2f",
    "confidence": 0.7
  },
  {
    "source": "bc28e434",
    "target": "d01c35e5",
    "confidence": 0.73
  },
  {
    "source": "bc28e434",
    "target": "f997db4d",
    "confidence": 0.66
  },
  {
    "source": "bc28e434",
    "target": "303706d1",
    "confidence": 0.67
  },
  {
    "source": "bc28e434",
    "target": "bff8bcfb",
    "confidence": 0.65
  },
  {
    "source": "bc28e434",
    "target": "f01f07c0",
    "confidence": 0.7
  },
  {
    "source": "bc28e434",
    "target": "58196f0e",
    "confidence": 0.65
  },
  {
    "source": "84ea0c9c",
    "target": "0c874231",
    "confidence": 0.81
  },
  {
    "source": "84ea0c9c",
    "target": "5a816525",
    "confidence": 0.71
  },
  {
    "source": "84ea0c9c",
    "target": "d53ead70",
    "confidence": 0.73
  },
  {
    "source": "454175a6",
    "target": "40e39568",
    "confidence": 0.66
  },
  {
    "source": "454175a6",
    "target": "84ea0c9c",
    "confidence": 0.71
  },
  {
    "source": "454175a6",
    "target": "0c874231",
    "confidence": 0.77
  },
  {
    "source": "62405109",
    "target": "052d3ba0",
    "confidence": 0.68
  },
  {
    "source": "62405109",
    "target": "fdd1ea1a",
    "confidence": 0.64
  },
  {
    "source": "62405109",
    "target": "d53ead70",
    "confidence": 0.66
  },
  {
    "source": "62405109",
    "target": "ff81c4c2",
    "confidence": 0.64
  },
  {
    "source": "62405109",
    "target": "7f503589",
    "confidence": 0.64
  },
  {
    "source": "598faab1",
    "target": "7f503589",
    "confidence": 0.69
  },
  {
    "source": "598faab1",
    "target": "baa3420b",
    "confidence": 0.72
  },
  {
    "source": "598faab1",
    "target": "e89cdeb8",
    "confidence": 0.67
  },
  {
    "source": "598faab1",
    "target": "052d3ba0",
    "confidence": 0.69
  },
  {
    "source": "598faab1",
    "target": "ff81c4c2",
    "confidence": 0.71
  },
  {
    "source": "9cff86c4",
    "target": "c8b607e8",
    "confidence": 0.78
  },
  {
    "source": "8dd3f5a6",
    "target": "c8b607e8",
    "confidence": 0.76
  },
  {
    "source": "af18548d",
    "target": "c8b607e8",
    "confidence": 0.78
  },
  {
    "source": "38c5f627",
    "target": "9cff86c4",
    "confidence": 0.8
  },
  {
    "source": "38c5f627",
    "target": "c580c6fd",
    "confidence": 0.75
  },
  {
    "source": "38c5f627",
    "target": "af18548d",
    "confidence": 0.76
  },
  {
    "source": "38c5f627",
    "target": "8dd3f5a6",
    "confidence": 0.81
  },
  {
    "source": "38c5f627",
    "target": "c8b607e8",
    "confidence": 0.82
  },
  {
    "source": "53576bdb",
    "target": "bece555b",
    "confidence": 0.56
  },
  {
    "source": "53576bdb",
    "target": "abaa55ea",
    "confidence": 0.6
  },
  {
    "source": "53576bdb",
    "target": "6335c531",
    "confidence": 0.64
  },
  {
    "source": "53576bdb",
    "target": "243bac8d",
    "confidence": 0.57
  },
  {
    "source": "ad9f99fd",
    "target": "abaa55ea",
    "confidence": 0.61
  },
  {
    "source": "ad9f99fd",
    "target": "243bac8d",
    "confidence": 0.6
  },
  {
    "source": "ad9f99fd",
    "target": "53576bdb",
    "confidence": 0.7
  },
  {
    "source": "ad9f99fd",
    "target": "992d2f01",
    "confidence": 0.61
  },
  {
    "source": "ad9f99fd",
    "target": "bece555b",
    "confidence": 0.66
  },
  {
    "source": "ad9f99fd",
    "target": "6335c531",
    "confidence": 0.74
  },
  {
    "source": "c14cbc2f",
    "target": "0c874231",
    "confidence": 0.82
  },
  {
    "source": "c14cbc2f",
    "target": "052d3ba0",
    "confidence": 0.69
  },
  {
    "source": "c14cbc2f",
    "target": "454175a6",
    "confidence": 0.74
  },
  {
    "source": "c14cbc2f",
    "target": "84ea0c9c",
    "confidence": 0.8
  },
  {
    "source": "10caa798",
    "target": "67f11c63",
    "confidence": 0.72
  },
  {
    "source": "10caa798",
    "target": "575fc898",
    "confidence": 0.71
  },
  {
    "source": "10caa798",
    "target": "40921b5f",
    "confidence": 0.64
  },
  {
    "source": "10caa798",
    "target": "9ebdb8c5",
    "confidence": 0.7
  },
  {
    "source": "10caa798",
    "target": "b2779dbe",
    "confidence": 0.64
  },
  {
    "source": "10caa798",
    "target": "c7239f23",
    "confidence": 0.66
  },
  {
    "source": "8ee323f1",
    "target": "af18548d",
    "confidence": 0.78
  },
  {
    "source": "8ee323f1",
    "target": "38c5f627",
    "confidence": 0.84
  },
  {
    "source": "8ee323f1",
    "target": "8dd3f5a6",
    "confidence": 0.8
  },
  {
    "source": "8ee323f1",
    "target": "05a8cd42",
    "confidence": 0.81
  },
  {
    "source": "8ee323f1",
    "target": "93f5a7e2",
    "confidence": 0.82
  },
  {
    "source": "8ee323f1",
    "target": "9cff86c4",
    "confidence": 0.76
  },
  {
    "source": "8ee323f1",
    "target": "c8b607e8",
    "confidence": 0.78
  },
  {
    "source": "50ae1cf2",
    "target": "cc2c0152",
    "confidence": 0.69
  },
  {
    "source": "50ae1cf2",
    "target": "84cb89ee",
    "confidence": 0.64
  },
  {
    "source": "50ae1cf2",
    "target": "904813fe",
    "confidence": 0.69
  },
  {
    "source": "50ae1cf2",
    "target": "1b1e47f1",
    "confidence": 0.66
  },
  {
    "source": "50ae1cf2",
    "target": "454175a6",
    "confidence": 0.66
  },
  {
    "source": "93f5a7e2",
    "target": "38c5f627",
    "confidence": 0.85
  },
  {
    "source": "93f5a7e2",
    "target": "c8b607e8",
    "confidence": 0.85
  },
  {
    "source": "93f5a7e2",
    "target": "8ee323f1",
    "confidence": 0.82
  },
  {
    "source": "93f5a7e2",
    "target": "9cff86c4",
    "confidence": 0.83
  },
  {
    "source": "93f5a7e2",
    "target": "af18548d",
    "confidence": 0.81
  },
  {
    "source": "93f5a7e2",
    "target": "8dd3f5a6",
    "confidence": 0.83
  },
  {
    "source": "5db6ecf8",
    "target": "14249bdc",
    "confidence": 0.79
  },
  {
    "source": "5db6ecf8",
    "target": "7fe016a3",
    "confidence": 0.74
  },
  {
    "source": "5db6ecf8",
    "target": "e4d9c920",
    "confidence": 0.85
  },
  {
    "source": "5db6ecf8",
    "target": "9a4d7488",
    "confidence": 0.85
  },
  {
    "source": "5db6ecf8",
    "target": "1db2ee60",
    "confidence": 0.68
  },
  {
    "source": "5db6ecf8",
    "target": "cb8a26f7",
    "confidence": 0.68
  },
  {
    "source": "5db6ecf8",
    "target": "184e688f",
    "confidence": 0.86
  },
  {
    "source": "5db6ecf8",
    "target": "9aca9e2c",
    "confidence": 0.81
  },
  {
    "source": "05a8cd42",
    "target": "9cff86c4",
    "confidence": 0.8
  },
  {
    "source": "05a8cd42",
    "target": "af18548d",
    "confidence": 0.83
  },
  {
    "source": "05a8cd42",
    "target": "38c5f627",
    "confidence": 0.86
  },
  {
    "source": "05a8cd42",
    "target": "8dd3f5a6",
    "confidence": 0.82
  },
  {
    "source": "05a8cd42",
    "target": "c580c6fd",
    "confidence": 0.83
  },
  {
    "source": "05a8cd42",
    "target": "8ee323f1",
    "confidence": 0.84
  },
  {
    "source": "05a8cd42",
    "target": "c8b607e8",
    "confidence": 0.85
  },
  {
    "source": "05a8cd42",
    "target": "93f5a7e2",
    "confidence": 0.91
  },
  {
    "source": "d4e7ac7a",
    "target": "50a5f7d8",
    "confidence": 0.77
  },
  {
    "source": "d4e7ac7a",
    "target": "0eadb747",
    "confidence": 0.64
  },
  {
    "source": "d4e7ac7a",
    "target": "431f97f2",
    "confidence": 0.64
  },
  {
    "source": "d4e7ac7a",
    "target": "4b5309ba",
    "confidence": 0.81
  },
  {
    "source": "43979938",
    "target": "6c4e8997",
    "confidence": 0.72
  },
  {
    "source": "43979938",
    "target": "f1ed80eb",
    "confidence": 0.69
  },
  {
    "source": "43979938",
    "target": "123052fa",
    "confidence": 0.84
  },
  {
    "source": "43979938",
    "target": "d4e7ac7a",
    "confidence": 0.68
  },
  {
    "source": "43979938",
    "target": "e4ce790b",
    "confidence": 0.87
  },
  {
    "source": "43979938",
    "target": "1b9d7b0f",
    "confidence": 0.72
  },
  {
    "source": "43979938",
    "target": "241d1484",
    "confidence": 0.85
  },
  {
    "source": "e4ec1c9c",
    "target": "ea8a0669",
    "confidence": 0.85
  },
  {
    "source": "e4ec1c9c",
    "target": "e5cffcbd",
    "confidence": 0.89
  },
  {
    "source": "e4ec1c9c",
    "target": "41836b44",
    "confidence": 0.77
  },
  {
    "source": "e4ec1c9c",
    "target": "ae4a3d83",
    "confidence": 0.92
  },
  {
    "source": "e4ec1c9c",
    "target": "5c657965",
    "confidence": 0.75
  },
  {
    "source": "e4ec1c9c",
    "target": "f62101da",
    "confidence": 0.82
  },
  {
    "source": "daeef8c2",
    "target": "891d788a",
    "confidence": 0.71
  },
  {
    "source": "daeef8c2",
    "target": "cd7678ff",
    "confidence": 0.8
  },
  {
    "source": "daeef8c2",
    "target": "e868a706",
    "confidence": 0.71
  },
  {
    "source": "daeef8c2",
    "target": "8cbf6c51",
    "confidence": 0.72
  },
  {
    "source": "73825afb",
    "target": "d782b600",
    "confidence": 0.7
  },
  {
    "source": "73825afb",
    "target": "8b5f33bc",
    "confidence": 0.79
  },
  {
    "source": "73825afb",
    "target": "7a82b2e3",
    "confidence": 0.77
  },
  {
    "source": "73825afb",
    "target": "9bb38101",
    "confidence": 0.68
  },
  {
    "source": "73825afb",
    "target": "82c20686",
    "confidence": 0.8
  },
  {
    "source": "73825afb",
    "target": "07a26cdf",
    "confidence": 0.75
  },
  {
    "source": "b71050e4",
    "target": "4e42c198",
    "confidence": 0.89
  },
  {
    "source": "b71050e4",
    "target": "b3200f55",
    "confidence": 0.88
  },
  {
    "source": "b71050e4",
    "target": "1d9a20ed",
    "confidence": 0.86
  },
  {
    "source": "b71050e4",
    "target": "8cbf6c51",
    "confidence": 0.73
  },
  {
    "source": "b71050e4",
    "target": "84cb89ee",
    "confidence": 0.87
  },
  {
    "source": "2f188eac",
    "target": "8399e64b",
    "confidence": 0.69
  },
  {
    "source": "2f188eac",
    "target": "7f339c79",
    "confidence": 0.61
  },
  {
    "source": "2f188eac",
    "target": "4f10fd6e",
    "confidence": 0.61
  },
  {
    "source": "2f188eac",
    "target": "4c610dd6",
    "confidence": 0.68
  },
  {
    "source": "2f188eac",
    "target": "453662c7",
    "confidence": 0.63
  },
  {
    "source": "2f188eac",
    "target": "254a1e6e",
    "confidence": 0.64
  },
  {
    "source": "2f188eac",
    "target": "98d2ca01",
    "confidence": 0.66
  },
  {
    "source": "018225db",
    "target": "17ff9ab4",
    "confidence": 0.65
  },
  {
    "source": "018225db",
    "target": "df9e6431",
    "confidence": 0.71
  },
  {
    "source": "018225db",
    "target": "8bf049b5",
    "confidence": 0.63
  },
  {
    "source": "018225db",
    "target": "a1ea0b9c",
    "confidence": 0.7
  },
  {
    "source": "018225db",
    "target": "2e822ae1",
    "confidence": 0.74
  },
  {
    "source": "018225db",
    "target": "771a950b",
    "confidence": 0.9
  },
  {
    "source": "67820bc2",
    "target": "f997db4d",
    "confidence": 0.6
  },
  {
    "source": "67820bc2",
    "target": "af1126fa",
    "confidence": 0.69
  },
  {
    "source": "67820bc2",
    "target": "f01f07c0",
    "confidence": 0.61
  },
  {
    "source": "67820bc2",
    "target": "7177105c",
    "confidence": 0.6
  },
  {
    "source": "67820bc2",
    "target": "9016d792",
    "confidence": 0.68
  },
  {
    "source": "c3777980",
    "target": "a65fea51",
    "confidence": 0.62
  },
  {
    "source": "c3777980",
    "target": "6cf22e37",
    "confidence": 0.61
  },
  {
    "source": "c3777980",
    "target": "9bcf064c",
    "confidence": 0.62
  },
  {
    "source": "c3777980",
    "target": "7ab18aee",
    "confidence": 0.75
  },
  {
    "source": "c3777980",
    "target": "27c9af8d",
    "confidence": 0.62
  },
  {
    "source": "c997b990",
    "target": "eef16a28",
    "confidence": 0.54
  },
  {
    "source": "c997b990",
    "target": "92f886ef",
    "confidence": 0.54
  },
  {
    "source": "c997b990",
    "target": "a6e15bd3",
    "confidence": 0.51
  },
  {
    "source": "ee1791e5",
    "target": "c997b990",
    "confidence": 0.88
  },
  {
    "source": "ee1791e5",
    "target": "92f886ef",
    "confidence": 0.54
  },
  {
    "source": "ee1791e5",
    "target": "eef16a28",
    "confidence": 0.49
  },
  {
    "source": "d29fa000",
    "target": "c997b990",
    "confidence": 0.54
  },
  {
    "source": "d29fa000",
    "target": "eef16a28",
    "confidence": 0.55
  },
  {
    "source": "d29fa000",
    "target": "09f8dd6a",
    "confidence": 0.58
  },
  {
    "source": "d29fa000",
    "target": "a6e15bd3",
    "confidence": 0.56
  },
  {
    "source": "d29fa000",
    "target": "92f886ef",
    "confidence": 0.61
  },
  {
    "source": "d29fa000",
    "target": "ee1791e5",
    "confidence": 0.55
  },
  {
    "source": "489d609e",
    "target": "c997b990",
    "confidence": 0.6
  },
  {
    "source": "489d609e",
    "target": "eef16a28",
    "confidence": 0.67
  },
  {
    "source": "489d609e",
    "target": "92f886ef",
    "confidence": 0.61
  },
  {
    "source": "489d609e",
    "target": "ee1791e5",
    "confidence": 0.59
  },
  {
    "source": "489d609e",
    "target": "d29fa000",
    "confidence": 0.72
  },
  {
    "source": "5f7f5650",
    "target": "7177105c",
    "confidence": 0.6
  },
  {
    "source": "5f7f5650",
    "target": "c3777980",
    "confidence": 0.61
  },
  {
    "source": "5f7f5650",
    "target": "5a8dbd74",
    "confidence": 0.65
  },
  {
    "source": "5f7f5650",
    "target": "07fb8f8d",
    "confidence": 0.6
  },
  {
    "source": "ac5b06dc",
    "target": "5a8dbd74",
    "confidence": 0.67
  },
  {
    "source": "ac5b06dc",
    "target": "5f7f5650",
    "confidence": 0.83
  },
  {
    "source": "ac5b06dc",
    "target": "c3777980",
    "confidence": 0.6
  },
  {
    "source": "ac5b06dc",
    "target": "7177105c",
    "confidence": 0.62
  },
  {
    "source": "ac5b06dc",
    "target": "df56723b",
    "confidence": 0.59
  },
  {
    "source": "c6f463bd",
    "target": "c3777980",
    "confidence": 0.58
  },
  {
    "source": "c6f463bd",
    "target": "5a8dbd74",
    "confidence": 0.63
  },
  {
    "source": "c6f463bd",
    "target": "ac5b06dc",
    "confidence": 0.8
  },
  {
    "source": "c6f463bd",
    "target": "7177105c",
    "confidence": 0.62
  },
  {
    "source": "c6f463bd",
    "target": "5f7f5650",
    "confidence": 0.78
  },
  {
    "source": "3f7371af",
    "target": "aaa374aa",
    "confidence": 0.59
  },
  {
    "source": "3f7371af",
    "target": "a2a526fb",
    "confidence": 0.58
  },
  {
    "source": "3f7371af",
    "target": "6440883c",
    "confidence": 0.66
  },
  {
    "source": "3f7371af",
    "target": "ca574889",
    "confidence": 0.57
  },
  {
    "source": "80aa4812",
    "target": "f3e29ce3",
    "confidence": 0.6
  },
  {
    "source": "80aa4812",
    "target": "3f7371af",
    "confidence": 0.58
  },
  {
    "source": "80aa4812",
    "target": "aaa374aa",
    "confidence": 0.67
  },
  {
    "source": "80aa4812",
    "target": "26dcecc3",
    "confidence": 0.6
  },
  {
    "source": "80aa4812",
    "target": "8ac0d11c",
    "confidence": 0.61
  },
  {
    "source": "c72a6912",
    "target": "8ac0d11c",
    "confidence": 0.51
  },
  {
    "source": "c72a6912",
    "target": "f3e29ce3",
    "confidence": 0.53
  },
  {
    "source": "c72a6912",
    "target": "3f7371af",
    "confidence": 0.54
  },
  {
    "source": "c72a6912",
    "target": "80aa4812",
    "confidence": 0.57
  },
  {
    "source": "c72a6912",
    "target": "aaa374aa",
    "confidence": 0.72
  },
  {
    "source": "58e61f8a",
    "target": "8072c9ca",
    "confidence": 0.62
  },
  {
    "source": "58e61f8a",
    "target": "a2a526fb",
    "confidence": 0.63
  },
  {
    "source": "58e61f8a",
    "target": "f3e29ce3",
    "confidence": 0.63
  },
  {
    "source": "58e61f8a",
    "target": "8ac0d11c",
    "confidence": 0.64
  },
  {
    "source": "d1028509",
    "target": "a2a526fb",
    "confidence": 0.84
  },
  {
    "source": "d1028509",
    "target": "8ac0d11c",
    "confidence": 0.72
  },
  {
    "source": "d1028509",
    "target": "e0706c1f",
    "confidence": 0.7
  },
  {
    "source": "d1028509",
    "target": "58e61f8a",
    "confidence": 0.65
  },
  {
    "source": "b372ccbd",
    "target": "aaa374aa",
    "confidence": 0.64
  },
  {
    "source": "b372ccbd",
    "target": "3f7371af",
    "confidence": 0.7
  },
  {
    "source": "b372ccbd",
    "target": "5dc77801",
    "confidence": 0.65
  },
  {
    "source": "b372ccbd",
    "target": "ca574889",
    "confidence": 0.61
  },
  {
    "source": "b372ccbd",
    "target": "d1028509",
    "confidence": 0.64
  },
  {
    "source": "b372ccbd",
    "target": "a2a526fb",
    "confidence": 0.69
  },
  {
    "source": "b372ccbd",
    "target": "84d6b81d",
    "confidence": 0.61
  },
  {
    "source": "b5601eb0",
    "target": "1d0aadfb",
    "confidence": 0.62
  },
  {
    "source": "b5601eb0",
    "target": "4fadc33f",
    "confidence": 0.67
  },
  {
    "source": "b5601eb0",
    "target": "1ab6738e",
    "confidence": 0.61
  },
  {
    "source": "b5601eb0",
    "target": "e337f334",
    "confidence": 0.63
  },
  {
    "source": "b5601eb0",
    "target": "5f0b9fec",
    "confidence": 0.62
  }
];

export const categoryCounts: Record<string, number> = {
  "Education": 160,
  "Government": 145,
  "Health": 141,
  "Economics": 120,
  "Labor": 69,
  "Finance": 49,
  "Environment": 47,
  "Demographics": 42,
  "Housing": 42,
  "Energy": 36,
  "Technology": 30,
  "Crime": 18,
  "Transportation": 15,
  "Agriculture": 12,
  "Geography": 12,
  "Sports": 9,
  "Other": 5
};
