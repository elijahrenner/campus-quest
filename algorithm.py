import haversine as hs
import csv

#__CONVERSION RATES

KILOMETERS = 1.0
METERS = 1000.0
MILES = 0.621371192
NAUTICAL_MILES = 0.539956803
FEET = 3280.839895013
INCHES = 39370.078740158

#list of schools
_SCHOOLS = []

#loop to take inputs
while True:
    school = (input('School row #: '))

    if school == '':
        break

    _SCHOOLS.append(int(school))

#these are the appended coordinates
_COORDINATES = []

#for loop for gathering lat and lon
for x in _SCHOOLS:
    with open('dataset 2.csv') as f:
        dataset = list(csv.reader(f))
        if x < len(dataset):
            lon = dataset[x][70]
            lat = dataset[x][71]
            x = (lat,lon)
            _COORDINATES.append(x)
        else:
            continue

print(_COORDINATES)

# #comparing distances between coordinates
# num_locations = len(_COORDINATES)

# for i in range(num_locations):
#     for j in range(i + 1, num_locations):
#         loc1 = _COORDINATES[i]
#         loc2 = _COORDINATES[j]
#         distance_miles = hs.haversine(loc1, loc2) * MILES
#         print(f"Distance between loc{i+1} and loc{j+1}: {distance_miles:.2f} miles")