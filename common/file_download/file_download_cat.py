import sys
import requests
import os
import time

api_url = 'https://wiki.leagueoflegends.com/en-us/api.php'

def download_files_in_category(category):
	print('Files in Category:' + category + ' will be placed in /images.')
	s = requests.Session()
	params = {
		'action': 'query',
		'generator': 'categorymembers',
		'gcmtitle': 'Category:' + category,
		'gcmlimit': 500,
		'gcmtype': 'file',
		'prop': 'imageinfo',
		'iiprop': 'url',
		'format': 'json'
	}
	if not os.path.exists('images'):
		os.makedirs('images')
	while(True):
		try:
			r = s.get(url=api_url, params=params)
			data = r.json()
			pages = data["query"]["pages"]
		except Exception as e:
			print(r.text)
			print(data)
			print(e)
			break
		for page_id in pages:
			image_name = pages[page_id]["title"].replace('File:', '')
			image_url = pages[page_id]["imageinfo"][0]["url"]
			r = s.get(url=image_url, stream=True)
			path = 'images/' + image_name
			if r.status_code == 200:
				with open(path, 'xb') as f:
					for chunk in r:
						f.write(chunk)
		if "continue" in data and "gcmcontinue" in data["continue"]:
			params['gcmcontinue'] = data["continue"]["gcmcontinue"]
		else:
			break
		time.sleep(2)

def main():
	'''
	Usage: python file_download_cat.py "Champions by name"
	'''
	if(len(sys.argv) <= 1):
		help(main)
		return
	download_files_in_category(sys.argv[1])

if __name__ == '__main__':
	main()