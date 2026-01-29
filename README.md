# EarthRef's Framework for Integrated Earth Science and Technology Applications (FIESTA) API

<img src="logo.png?raw=true" style="height: 50vh"/>

## Usage

The deployed API is currently available at https://api.earthref.org/v1 with documentation at https://api.earthref.org. These GET requests can be made in the browser to test the API:

#### Get the metadata for the latest 10 MagIC contributions as JSON rows:
- https://api.earthref.org/v1/MagIC/search/contributions

#### Get the metadata for the latest 20 locations in MagIC that mention "sedimentary" as JSON rows:
- https://api.earthref.org/v1/MagIC/search/locations?size=20&query=sedimentary

#### Get MagIC contribution 16645 in MagIC Text File format:
- https://api.earthref.org/v1/MagIC/contribution/16645

These requests can also be made with an HTTP request client, for example getting a contribution with Python:
```python
import requests

# Get the 50 latest sites in MagIC
response = requests.get(
    'https://api.earthref.org/v1/MagIC/contribution/16663',
    headers={'Accept': 'text/plain'}
)

# Check the response status code
if (response.status_code == 404):
  print('Request URL is incorrect.')
if (response.status_code == 204):
  print('Contribution ID doesn''t exist.')
  
# Parse the first 100 characters of the contribution
print(response.content[0:100])
```
Or searching with Python:
```python
import requests
import pandas

# Get the 50 latest sites in MagIC
response = requests.get(
    'https://api.earthref.org/v1/MagIC/search/sites',
    params={'query': 'devonian', 'size': 50},
    headers={'Accept': 'application/json'}
)

# Check the response status code
if (response.status_code == 404):
  print('Request URL is incorrect.')

# Parse the JSON output into a dictionary
json_response = response.json()

# Retrieve the list of sites, of which each site may have multiple data rows
sites = json_response['results']

# Flatten the sites rows
def flatten(listOflists):
    return [item for sublist in listOflists for item in sublist]
sites_rows = flatten(sites)

sites_df = pandas.DataFrame(sites_rows)
sites_df.head()
```

## Development

```
npm install
npm dev
# API running at http://localhost:3100
```

