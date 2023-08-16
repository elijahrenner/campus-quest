import haversine as hs
import csv

with open('dataset 2.csv') as f:
    dataset = list(csv.reader(f))

    row = (int(input('Enter row number: ')))-1
    col = (int(input('Enter column number: ')))-1

    if row < len(dataset) and col < len(dataset[row]):
        coordinate = dataset[row][col]
        print("Coordinate:", coordinate)
    else:
        print("Invalid line or row number.")