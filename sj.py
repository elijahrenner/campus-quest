import geopy.distance
import csv

# Coordinates dictionary to store school names as keys and coordinates as values
coordinates_dict = {}

# Loop to take inputs and convert to coordinates
while True:
    school = input('School: ')

    if school == '':
        break

    with open('dataset 2.csv') as f:
        dataset = list(csv.reader(f))
        
        for row in dataset[1:]:
            columns = row
            if columns[1] == school:
                lon = float(row[70])  # Convert longitude to float
                lat = float(row[71])  # Convert latitude to float
                coordinates_dict[school] = (lat, lon)
                break

# Comparing distances between coordinates
schools = list(coordinates_dict.keys())  # Get the list of school names
num_schools = len(schools)

for i in range(num_schools):
    for j in range(i + 1, num_schools):
        school1 = schools[i]
        school2 = schools[j]
        loc1 = coordinates_dict[school1]
        loc2 = coordinates_dict[school2]
        distance_miles = geopy.distance.geodesic(loc1, loc2).miles
        print(f"Distance between {school1} and {school2}: {distance_miles:.2f} miles")
