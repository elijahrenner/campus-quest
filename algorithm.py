import geopy.distance
import csv

#coordinates list
_coordinates = []

#loop to take inputs and convert to coordinates
while True:
    school = (input('School: '))

    if school == '':
        break

    with open('dataset 2.csv') as f:
        dataset = list(csv.reader(f))
        
        for row_num, row in enumerate(dataset[1:], start=1):
            columns = row
            if columns[1] == school:
                lon = dataset[row_num][70]
                lat = dataset[row_num][71]
                x = (lat,lon)
                _coordinates.append(x)
                
#comparing distances between coordinates
num_locations = len(_coordinates)

for i in range(num_locations):
    for j in range(i + 1, num_locations):
        loc1 = _coordinates[i]
        loc2 = _coordinates[j]
        print(loc1)
        print(loc2)
        distance_miles = geopy.distance.geodesic(loc1,loc2).miles
        print(f"Distance between loc{i+1} and loc{j+1}: {distance_miles:.2f} miles")