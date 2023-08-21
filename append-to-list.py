import json
from os import path
import csv
import time

filename = 'input possibilities.json'
scols = [] 

with open('dataset 2.csv') as f:
        dataset = list(csv.reader(f))
        
        for row in dataset[1:]:
            name = (row[1])
            scols.append(name)

            
with open(filename, 'w') as json_file:
      json.dump(scols, json_file, indent=4)


